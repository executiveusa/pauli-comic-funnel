# Copyright (c) The Pauli Effect. All rights reserved.

"""
THE PAULI EFFECT - Main Orchestration API

This is the central entry point for the Pauli AI Agency.
It connects all agents, the router, and Agent Lightning monitoring.

Usage:
    from pauli_lightning import Pauli
    
    pauli = Pauli()
    
    # Talk to Pauli
    response = await pauli.chat("Create a landing page for my startup")
    
    # Use computer
    await pauli.computer_use("Click the submit button")
    
    # Run browser automation
    await pauli.browse("Go to github.com and star the repo")
"""

import os
import asyncio
from typing import Any, Dict, List, Optional, Union, Callable
from dataclasses import dataclass
from datetime import datetime

from .core import (
    PauliConfig,
    PauliGuardrails,
    PauliStore,
    PauliTrainer,
    PauliAgent,
    GuardrailViolation,
    AGL_AVAILABLE,
    PAULI_CONFIG,
)

from .agents import (
    LuxComputerAgent,
    BrowserOpsAgent,
    ResearcherAgent,
    DesignerAgent,
    DevOpsAgent,
    CRMAgent,
    get_agent,
    AGENT_REGISTRY,
)

from .router import PauliRouter, TaskType, RoutingDecision, get_router

import logging
logger = logging.getLogger(__name__)


@dataclass
class PauliResponse:
    """Response from a Pauli operation."""
    success: bool
    result: Any
    agent_used: str
    model_used: str
    task_type: str
    cost: float
    duration_ms: int
    trace_id: Optional[str] = None
    error: Optional[str] = None


class Pauli:
    """
    THE PAULI EFFECT - Main AI Orchestrator
    
    Pauli is the central intelligence that coordinates all agents,
    routes requests to optimal models, and learns from interactions.
    
    Features:
    - Multi-agent coordination
    - Intelligent model routing
    - Computer use via Lux
    - Browser automation
    - Research capabilities
    - Agent Lightning integration for continuous improvement
    """
    
    def __init__(
        self,
        config: PauliConfig = None,
        guardrails: PauliGuardrails = None,
        enable_voice: bool = False,
    ):
        self.config = config or PAULI_CONFIG
        self.guardrails = guardrails or PauliGuardrails(self.config)
        self.router = get_router(config=self.config, guardrails=self.guardrails)
        self.store = PauliStore(self.config)
        self.enable_voice = enable_voice
        
        # Initialize agents
        self._agents: Dict[str, PauliAgent] = {}
        self._initialize_agents()
        
        # Session tracking
        self.session_id = f"pauli-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        self.conversation_history: List[Dict] = []
        
        # Callbacks for voice/UI integration
        self._on_response: Optional[Callable] = None
        self._on_action: Optional[Callable] = None
        self._on_error: Optional[Callable] = None
        
        logger.info(f"Pauli initialized - Session: {self.session_id}")
        
    def _initialize_agents(self) -> None:
        """Initialize all agent instances."""
        self._agents = {
            "lux": LuxComputerAgent(self.config, self.guardrails),
            "browser": BrowserOpsAgent(self.config, self.guardrails),
            "researcher": ResearcherAgent(self.config, self.guardrails),
            "designer": DesignerAgent(self.config, self.guardrails),
            "devops": DevOpsAgent(self.config, self.guardrails),
            "crm": CRMAgent(self.config, self.guardrails),
        }
        
        # Set store for all agents
        for agent in self._agents.values():
            agent.set_store(self.store)
            
    def get_agent(self, agent_type: str) -> PauliAgent:
        """Get a specific agent by type."""
        if agent_type not in self._agents:
            raise ValueError(f"Unknown agent: {agent_type}. Available: {list(self._agents.keys())}")
        return self._agents[agent_type]
        
    # =========================================================================
    # MAIN CHAT INTERFACE
    # =========================================================================
        
    async def chat(
        self,
        message: str,
        context: Optional[Dict] = None,
        force_agent: Optional[str] = None,
        force_model: Optional[str] = None,
    ) -> PauliResponse:
        """
        Main chat interface to Pauli.
        
        Automatically routes to the best agent and model based on the message.
        
        Args:
            message: The user's message
            context: Optional context (images, files, etc.)
            force_agent: Force a specific agent
            force_model: Force a specific model
            
        Returns:
            PauliResponse with the result
        """
        start_time = datetime.now()
        context = context or {}
        
        try:
            # Route the request
            routing = self.router.route(
                message,
                has_image="image" in context,
                force_model=force_model,
            )
            
            # Select agent based on task type or forced agent
            if force_agent:
                agent = self.get_agent(force_agent)
            else:
                agent = self._select_agent(routing.task_type)
                
            # Execute the task
            result = await agent.run(message, **context)
            
            # Calculate duration
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            
            # Record outcome for learning
            self.router.record_outcome(result.get("success", False))
            
            # Build response
            response = PauliResponse(
                success=result.get("success", False),
                result=result.get("result"),
                agent_used=agent.agent_name,
                model_used=routing.model,
                task_type=routing.task_type.value,
                cost=routing.estimated_cost,
                duration_ms=duration_ms,
                error=result.get("error"),
            )
            
            # Log conversation
            self.conversation_history.append({
                "timestamp": datetime.now().isoformat(),
                "message": message,
                "response": response.__dict__,
            })
            
            # Trigger callback
            if self._on_response:
                self._on_response(response)
                
            return response
            
        except GuardrailViolation as e:
            if self._on_error:
                self._on_error(e)
            return PauliResponse(
                success=False,
                result=None,
                agent_used="guardrails",
                model_used="",
                task_type="blocked",
                cost=0,
                duration_ms=0,
                error=str(e),
            )
        except Exception as e:
            logger.exception(f"Chat error: {e}")
            if self._on_error:
                self._on_error(e)
            return PauliResponse(
                success=False,
                result=None,
                agent_used="error",
                model_used="",
                task_type="error",
                cost=0,
                duration_ms=0,
                error=str(e),
            )
            
    def _select_agent(self, task_type: TaskType) -> PauliAgent:
        """Select the best agent for a task type."""
        mapping = {
            TaskType.COMPUTER_USE: "lux",
            TaskType.BROWSER: "browser",
            TaskType.RESEARCH: "researcher",
            TaskType.CREATIVE: "designer",
            TaskType.CODING: "devops",
            TaskType.VISION: "lux",
        }
        agent_key = mapping.get(task_type, "researcher")
        return self._agents[agent_key]
        
    # =========================================================================
    # COMPUTER USE (LUX)
    # =========================================================================
        
    async def computer_use(
        self,
        instruction: str,
        screenshot: Optional[str] = None,
        max_actions: int = 10,
    ) -> PauliResponse:
        """
        Execute a computer use task via Lux.
        
        Args:
            instruction: What to do (e.g., "Click the submit button")
            screenshot: Base64-encoded current screenshot
            max_actions: Maximum number of actions to perform
            
        Returns:
            PauliResponse with the actions taken
        """
        return await self.chat(
            instruction,
            context={
                "screenshot": screenshot,
                "max_actions": max_actions,
            },
            force_agent="lux",
        )
        
    # =========================================================================
    # BROWSER AUTOMATION
    # =========================================================================
        
    async def browse(
        self,
        instruction: str,
        url: Optional[str] = None,
    ) -> PauliResponse:
        """
        Execute a browser automation task.
        
        Args:
            instruction: What to do (e.g., "Fill in the contact form")
            url: Starting URL
            
        Returns:
            PauliResponse with the result
        """
        return await self.chat(
            instruction,
            context={"url": url},
            force_agent="browser",
        )
        
    # =========================================================================
    # RESEARCH
    # =========================================================================
        
    async def research(
        self,
        topic: str,
        depth: str = "standard",
        sources: List[str] = None,
    ) -> PauliResponse:
        """
        Perform research on a topic.
        
        Args:
            topic: What to research
            depth: "quick", "standard", or "deep"
            sources: Specific sources to consult
            
        Returns:
            PauliResponse with the research findings
        """
        return await self.chat(
            f"Research: {topic}",
            context={
                "depth": depth,
                "sources": sources or [],
            },
            force_agent="researcher",
        )
        
    # =========================================================================
    # VOICE INTERFACE
    # =========================================================================
        
    def on_response(self, callback: Callable[[PauliResponse], None]) -> None:
        """Register callback for responses (for voice/UI integration)."""
        self._on_response = callback
        
    def on_action(self, callback: Callable[[Dict], None]) -> None:
        """Register callback for actions (for voice narration)."""
        self._on_action = callback
        
    def on_error(self, callback: Callable[[Exception], None]) -> None:
        """Register callback for errors."""
        self._on_error = callback
        
    async def voice_command(self, audio_text: str) -> PauliResponse:
        """
        Process a voice command.
        
        This is the entry point for voice interfaces like VAPI.
        """
        # Add voice-specific context
        return await self.chat(
            audio_text,
            context={"source": "voice"},
        )
        
    # =========================================================================
    # DASHBOARD & MONITORING
    # =========================================================================
        
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get data for the Agent Lightning dashboard."""
        return {
            "session_id": self.session_id,
            "conversation_count": len(self.conversation_history),
            "routing_stats": self.router.get_stats(),
            "agents": {
                name: {
                    "name": agent.agent_name,
                    "role": agent.agent_role[:100],
                    "capabilities": agent.agent_capabilities,
                }
                for name, agent in self._agents.items()
            },
            "guardrails": {
                "content_filter": self.config.enable_content_filter,
                "pii_filter": self.config.enable_pii_filter,
                "max_cost": self.config.max_cost_per_request,
                "rate_limit": self.config.max_requests_per_minute,
            },
            "agent_lightning": {
                "available": AGL_AVAILABLE,
                "store_backend": self.config.store_backend,
                "experiment": self.config.experiment_name,
            }
        }
        
    def get_conversation_history(self) -> List[Dict]:
        """Get the conversation history for this session."""
        return self.conversation_history
        
    async def export_traces(self) -> List[Dict]:
        """Export all traces for Agent Lightning analysis."""
        if not AGL_AVAILABLE:
            return []
        # This would export from the Agent Lightning store
        return []
        
    # =========================================================================
    # TRAINING
    # =========================================================================
        
    async def train(
        self,
        agent_type: str,
        dataset: List[Dict],
    ) -> Dict[str, Any]:
        """
        Train a specific agent using Agent Lightning.
        
        Args:
            agent_type: Which agent to train
            dataset: Training dataset
            
        Returns:
            Training results and metrics
        """
        if not AGL_AVAILABLE:
            return {"error": "Agent Lightning not installed"}
            
        agent = self.get_agent(agent_type)
        trainer = PauliTrainer(self.config, self.store)
        
        await trainer.initialize()
        trainer.train(agent, dataset)
        
        return {
            "success": True,
            "agent": agent_type,
            "dataset_size": len(dataset),
        }


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

_pauli_instance: Optional[Pauli] = None

def get_pauli(**kwargs) -> Pauli:
    """Get or create the singleton Pauli instance."""
    global _pauli_instance
    if _pauli_instance is None:
        _pauli_instance = Pauli(**kwargs)
    return _pauli_instance


async def chat(message: str, **kwargs) -> PauliResponse:
    """Quick chat with Pauli."""
    pauli = get_pauli()
    return await pauli.chat(message, **kwargs)


async def computer(instruction: str, **kwargs) -> PauliResponse:
    """Quick computer use command."""
    pauli = get_pauli()
    return await pauli.computer_use(instruction, **kwargs)


async def browse(instruction: str, **kwargs) -> PauliResponse:
    """Quick browser command."""
    pauli = get_pauli()
    return await pauli.browse(instruction, **kwargs)


async def research(topic: str, **kwargs) -> PauliResponse:
    """Quick research command."""
    pauli = get_pauli()
    return await pauli.research(topic, **kwargs)


__all__ = [
    "Pauli",
    "PauliResponse",
    "get_pauli",
    "chat",
    "computer",
    "browse",
    "research",
]
