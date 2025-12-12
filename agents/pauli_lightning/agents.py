# Copyright (c) The Pauli Effect. All rights reserved.

"""
THE PAULI EFFECT - Agent Implementations

This module contains all specialized agent implementations:
- LuxComputerAgent: Desktop automation via Claude Computer Use
- BrowserOpsAgent: Browser automation via Playwright MCP
- ResearcherAgent: Web research and information gathering
- DesignerAgent: UI/UX design assistance
- DevOpsAgent: Infrastructure and deployment
- CRMAgent: Customer relationship management
"""

import os
import json
import base64
import asyncio
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

from .core import (
    PauliAgent,
    PauliConfig,
    PauliGuardrails,
    GuardrailViolation,
    emit_reward,
    emit_message,
    emit_object,
    AGL_AVAILABLE,
    PAULI_CONFIG,
)

import logging
logger = logging.getLogger(__name__)


# =============================================================================
# LUX COMPUTER USE AGENT
# =============================================================================

@dataclass
class LuxAction:
    """Represents a computer use action."""
    action_type: str
    coordinates: Optional[Tuple[int, int]] = None
    text: Optional[str] = None
    key: Optional[str] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class LuxComputerAgent(PauliAgent):
    """
    Lux Computer Use Agent
    
    Provides desktop automation capabilities:
    - Mouse movements and clicks
    - Keyboard input
    - Screen capture and analysis
    - Window management
    
    Integrates with Claude Computer Use API via LiteLLM.
    """
    
    agent_name = "lux-computer"
    agent_role = """You are Lux, an advanced desktop automation agent. 
    You can see the screen, move the mouse, click, type, and interact with 
    applications. You help users automate repetitive tasks and navigate 
    their computer efficiently. Always explain what you're doing and ask 
    for confirmation before performing destructive actions."""
    agent_capabilities = [
        "screenshot",
        "mouse_move",
        "left_click",
        "right_click", 
        "double_click",
        "type",
        "key",
        "scroll",
    ]
    
    def __init__(
        self,
        config: PauliConfig = None,
        guardrails: PauliGuardrails = None,
        screen_width: int = 1920,
        screen_height: int = 1080,
    ):
        super().__init__(config, guardrails)
        self.screen_width = screen_width
        self.screen_height = screen_height
        self.action_history: List[LuxAction] = []
        self.session_id: Optional[str] = None
        self._litellm_client = None
        
    async def initialize_session(self) -> str:
        """Initialize a computer use session."""
        self.session_id = f"lux-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        self.action_history = []
        self.emit_trace("session_start", {
            "session_id": self.session_id,
            "screen_size": f"{self.screen_width}x{self.screen_height}"
        })
        return self.session_id
        
    def get_tool_definition(self) -> Dict[str, Any]:
        """Get the Claude Computer Use tool definition."""
        return {
            "type": "computer_20241022",
            "name": "computer",
            "display_width_px": self.screen_width,
            "display_height_px": self.screen_height,
            "display_number": 1,
        }
        
    async def execute(self, task: str, **kwargs) -> Dict[str, Any]:
        """Execute a computer use task."""
        if not self.session_id:
            await self.initialize_session()
            
        # Check guardrails for computer actions
        guardrail_results = self.guardrails.check_all(
            content=task,
            lux_action=kwargs.get("action"),
            lux_target=kwargs.get("target"),
        )
        self.guardrails.enforce(guardrail_results)
        
        # Log the task
        self.emit_trace("computer_task", {
            "task": task,
            "session_id": self.session_id,
        })
        
        # Build the request for LiteLLM/Claude
        messages = [
            {
                "role": "system",
                "content": self.agent_role
            },
            {
                "role": "user", 
                "content": task
            }
        ]
        
        # If screenshot provided, include it
        if "screenshot" in kwargs:
            messages[-1] = {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": kwargs["screenshot"]
                        }
                    },
                    {
                        "type": "text",
                        "text": task
                    }
                ]
            }
            
        # Return the prepared request (actual API call happens in orchestration layer)
        return {
            "session_id": self.session_id,
            "messages": messages,
            "tools": [self.get_tool_definition()],
            "model": f"{self.config.default_model}",
            "max_tokens": 4096,
            "tool_choice": {"type": "auto"},
        }
        
    def parse_action_response(self, response: Dict) -> List[LuxAction]:
        """Parse Claude's response into executable actions."""
        actions = []
        
        for block in response.get("content", []):
            if block.get("type") == "tool_use" and block.get("name") == "computer":
                input_data = block.get("input", {})
                action_type = input_data.get("action", "")
                
                action = LuxAction(
                    action_type=action_type,
                    coordinates=tuple(input_data.get("coordinate", [0, 0])) if "coordinate" in input_data else None,
                    text=input_data.get("text"),
                )
                actions.append(action)
                self.action_history.append(action)
                
                # Emit trace for the action
                self.emit_trace("computer_action", {
                    "action": action_type,
                    "coordinates": action.coordinates,
                    "text": action.text[:50] if action.text else None,
                })
                
        return actions


# =============================================================================
# BROWSER OPS AGENT
# =============================================================================

class BrowserOpsAgent(PauliAgent):
    """
    Browser Operations Agent
    
    Provides browser automation via Playwright MCP:
    - Navigate to URLs
    - Click elements
    - Fill forms
    - Extract data
    - Take screenshots
    """
    
    agent_name = "browserops"
    agent_role = """You are a browser automation specialist. You help users
    navigate websites, fill forms, extract data, and automate web tasks.
    You use Playwright for reliable cross-browser automation."""
    agent_capabilities = [
        "navigate",
        "click",
        "fill",
        "extract",
        "screenshot",
        "scroll",
        "wait",
    ]
    
    def __init__(self, config: PauliConfig = None, guardrails: PauliGuardrails = None):
        super().__init__(config, guardrails)
        self._mcp_connected = False
        
    async def execute(self, task: str, **kwargs) -> Dict[str, Any]:
        """Execute a browser automation task."""
        url = kwargs.get("url")
        action = kwargs.get("action", "navigate")
        selector = kwargs.get("selector")
        
        self.emit_trace("browser_task", {
            "task": task,
            "url": url,
            "action": action,
        })
        
        # Return MCP-compatible request
        return {
            "mcp_server": "playwright",
            "action": action,
            "params": {
                "url": url,
                "selector": selector,
                "task": task,
            }
        }


# =============================================================================
# RESEARCHER AGENT
# =============================================================================

class ResearcherAgent(PauliAgent):
    """
    Research Agent
    
    Performs web research and information gathering:
    - Search queries
    - Content extraction
    - Summarization
    - Fact checking
    """
    
    agent_name = "researcher"
    agent_role = """You are an expert researcher. You gather information from
    multiple sources, verify facts, and synthesize findings into clear reports.
    You cite sources and highlight uncertainty when appropriate."""
    agent_capabilities = [
        "search",
        "extract",
        "summarize",
        "analyze",
        "cite",
    ]
    
    async def execute(self, task: str, **kwargs) -> Dict[str, Any]:
        """Execute a research task."""
        sources = kwargs.get("sources", [])
        depth = kwargs.get("depth", "standard")
        
        self.emit_trace("research_task", {
            "task": task,
            "sources_count": len(sources),
            "depth": depth,
        })
        
        return {
            "task": task,
            "sources": sources,
            "depth": depth,
            "model": self.config.default_model,
        }


# =============================================================================
# DESIGNER AGENT
# =============================================================================

class DesignerAgent(PauliAgent):
    """
    Designer Agent
    
    Assists with UI/UX design:
    - Generate design suggestions
    - Review layouts
    - Color palettes
    - Component recommendations
    """
    
    agent_name = "designer"
    agent_role = """You are a UI/UX design expert. You help create beautiful,
    accessible, and user-friendly interfaces. You understand design principles,
    typography, color theory, and modern design trends."""
    agent_capabilities = [
        "review",
        "suggest",
        "palette",
        "layout",
        "accessibility",
    ]
    
    async def execute(self, task: str, **kwargs) -> Dict[str, Any]:
        """Execute a design task."""
        context = kwargs.get("context", {})
        
        self.emit_trace("design_task", {
            "task": task,
            "has_context": bool(context),
        })
        
        return {
            "task": task,
            "context": context,
            "model": self.config.default_model,
        }


# =============================================================================
# DEVOPS AGENT
# =============================================================================

class DevOpsAgent(PauliAgent):
    """
    DevOps Agent
    
    Handles infrastructure and deployment:
    - Docker management
    - CI/CD pipelines
    - Cloud deployment
    - Monitoring setup
    """
    
    agent_name = "devops"
    agent_role = """You are a DevOps engineer. You help with infrastructure,
    deployment, monitoring, and operational excellence. You follow security
    best practices and prefer automation over manual processes."""
    agent_capabilities = [
        "deploy",
        "monitor",
        "scale",
        "configure",
        "troubleshoot",
    ]
    
    async def execute(self, task: str, **kwargs) -> Dict[str, Any]:
        """Execute a DevOps task."""
        platform = kwargs.get("platform", "docker")
        
        # Extra guardrails for infrastructure actions
        if platform in ["production", "prod"]:
            self.emit_trace("devops_warning", {
                "message": "Production environment detected",
                "task": task,
            })
            
        self.emit_trace("devops_task", {
            "task": task,
            "platform": platform,
        })
        
        return {
            "task": task,
            "platform": platform,
            "model": self.config.default_model,
        }


# =============================================================================
# CRM AGENT
# =============================================================================

class CRMAgent(PauliAgent):
    """
    CRM Agent
    
    Customer relationship management:
    - Contact management
    - Lead tracking
    - Communication drafts
    - Follow-up scheduling
    """
    
    agent_name = "crm"
    agent_role = """You are a customer relationship specialist. You help manage
    contacts, track leads, draft communications, and ensure excellent customer
    service. You maintain professionalism and respect privacy."""
    agent_capabilities = [
        "contact",
        "lead",
        "draft",
        "schedule",
        "analyze",
    ]
    
    async def execute(self, task: str, **kwargs) -> Dict[str, Any]:
        """Execute a CRM task."""
        contact_id = kwargs.get("contact_id")
        action = kwargs.get("action", "analyze")
        
        # Extra guardrails for PII
        if self.config.enable_pii_filter:
            guardrail_results = self.guardrails.check_all(content=task)
            self.guardrails.enforce(guardrail_results)
            
        self.emit_trace("crm_task", {
            "task": task,
            "action": action,
            "has_contact": contact_id is not None,
        })
        
        return {
            "task": task,
            "contact_id": contact_id,
            "action": action,
            "model": self.config.default_model,
        }


# =============================================================================
# AGENT REGISTRY
# =============================================================================

AGENT_REGISTRY = {
    "lux": LuxComputerAgent,
    "lux-computer": LuxComputerAgent,
    "computer": LuxComputerAgent,
    "browserops": BrowserOpsAgent,
    "browser": BrowserOpsAgent,
    "researcher": ResearcherAgent,
    "research": ResearcherAgent,
    "designer": DesignerAgent,
    "design": DesignerAgent,
    "devops": DevOpsAgent,
    "infrastructure": DevOpsAgent,
    "crm": CRMAgent,
    "customer": CRMAgent,
}

def get_agent(agent_type: str, **kwargs) -> PauliAgent:
    """Get an agent instance by type."""
    agent_class = AGENT_REGISTRY.get(agent_type.lower())
    if not agent_class:
        raise ValueError(f"Unknown agent type: {agent_type}. Available: {list(AGENT_REGISTRY.keys())}")
    return agent_class(**kwargs)


__all__ = [
    "LuxComputerAgent",
    "LuxAction",
    "BrowserOpsAgent",
    "ResearcherAgent",
    "DesignerAgent",
    "DevOpsAgent",
    "CRMAgent",
    "AGENT_REGISTRY",
    "get_agent",
]
