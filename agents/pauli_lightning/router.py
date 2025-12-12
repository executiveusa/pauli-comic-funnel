# Copyright (c) The Pauli Effect. All rights reserved.

"""
THE PAULI EFFECT - Intelligent Model Router with Agent Lightning Integration

Routes requests to optimal LLM based on task type, cost, and performance.
Integrates with Agent Lightning for tracing and improvement.
"""

import os
import json
import hashlib
from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime

from .core import (
    PauliConfig,
    PauliGuardrails,
    emit_reward,
    emit_object,
    AGL_AVAILABLE,
    PAULI_CONFIG,
)

import logging
logger = logging.getLogger(__name__)


class TaskType(Enum):
    """Types of tasks that can be routed."""
    CODING = "coding"
    CREATIVE = "creative"
    ANALYSIS = "analysis"
    VISION = "vision"
    COMPUTER_USE = "computer_use"
    FAST_RESPONSE = "fast_response"
    LONG_CONTEXT = "long_context"
    REASONING = "reasoning"
    BROWSER = "browser"
    RESEARCH = "research"


@dataclass
class ModelConfig:
    """Configuration for an LLM model."""
    name: str
    provider: str
    cost_per_1k_input: float
    cost_per_1k_output: float
    max_tokens: int
    supports_vision: bool = False
    supports_computer_use: bool = False
    latency_ms: int = 1000
    quality_score: float = 0.85


# Model Registry - Current as of Dec 2025
MODELS: Dict[str, ModelConfig] = {
    # Claude Models (Anthropic)
    "claude-sonnet-4-20250514": ModelConfig(
        name="claude-sonnet-4-20250514",
        provider="anthropic",
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        max_tokens=200000,
        supports_vision=True,
        supports_computer_use=True,
        latency_ms=1500,
        quality_score=0.95
    ),
    "claude-3-5-haiku-20241022": ModelConfig(
        name="claude-3-5-haiku-20241022",
        provider="anthropic",
        cost_per_1k_input=0.0008,
        cost_per_1k_output=0.004,
        max_tokens=200000,
        supports_vision=True,
        supports_computer_use=False,
        latency_ms=800,
        quality_score=0.85
    ),
    # Gemini Models (Google)
    "gemini-2.0-flash": ModelConfig(
        name="gemini-2.0-flash",
        provider="google",
        cost_per_1k_input=0.0001,
        cost_per_1k_output=0.0004,
        max_tokens=1000000,
        supports_vision=True,
        supports_computer_use=False,
        latency_ms=500,
        quality_score=0.88
    ),
    "gemini-1.5-pro": ModelConfig(
        name="gemini-1.5-pro",
        provider="google",
        cost_per_1k_input=0.00125,
        cost_per_1k_output=0.005,
        max_tokens=2000000,
        supports_vision=True,
        supports_computer_use=False,
        latency_ms=2000,
        quality_score=0.92
    ),
    # OpenAI Models
    "gpt-4o": ModelConfig(
        name="gpt-4o",
        provider="openai",
        cost_per_1k_input=0.0025,
        cost_per_1k_output=0.01,
        max_tokens=128000,
        supports_vision=True,
        supports_computer_use=False,
        latency_ms=1200,
        quality_score=0.93
    ),
    "gpt-4o-mini": ModelConfig(
        name="gpt-4o-mini",
        provider="openai",
        cost_per_1k_input=0.00015,
        cost_per_1k_output=0.0006,
        max_tokens=128000,
        supports_vision=True,
        supports_computer_use=False,
        latency_ms=600,
        quality_score=0.82
    ),
}

# Task-to-Model Priority Mapping
TASK_MODEL_PRIORITY: Dict[TaskType, List[str]] = {
    TaskType.CODING: ["claude-sonnet-4-20250514", "gpt-4o", "gemini-1.5-pro"],
    TaskType.CREATIVE: ["claude-sonnet-4-20250514", "gpt-4o", "gemini-1.5-pro"],
    TaskType.ANALYSIS: ["gemini-1.5-pro", "claude-sonnet-4-20250514", "gpt-4o"],
    TaskType.VISION: ["gpt-4o", "claude-sonnet-4-20250514", "gemini-2.0-flash"],
    TaskType.COMPUTER_USE: ["claude-sonnet-4-20250514"],  # Only Claude supports this
    TaskType.FAST_RESPONSE: ["gemini-2.0-flash", "gpt-4o-mini", "claude-3-5-haiku-20241022"],
    TaskType.LONG_CONTEXT: ["gemini-1.5-pro", "gemini-2.0-flash", "claude-sonnet-4-20250514"],
    TaskType.REASONING: ["claude-sonnet-4-20250514", "gpt-4o", "gemini-1.5-pro"],
    TaskType.BROWSER: ["claude-sonnet-4-20250514", "gpt-4o"],
    TaskType.RESEARCH: ["gemini-1.5-pro", "claude-sonnet-4-20250514", "gpt-4o"],
}


@dataclass
class RoutingDecision:
    """Result of a routing decision."""
    model: str
    provider: str
    task_type: TaskType
    estimated_cost: float
    reason: str
    litellm_model: str
    alternatives: List[str] = field(default_factory=list)
    confidence: float = 1.0


class PauliRouter:
    """
    Intelligent Model Router for The Pauli Effect.
    
    Features:
    - Task-based model selection
    - Cost optimization
    - Quality vs speed tradeoffs
    - Agent Lightning integration for learning
    - Automatic fallback handling
    """
    
    def __init__(
        self,
        config: PauliConfig = None,
        guardrails: PauliGuardrails = None,
        prefer_speed: bool = False,
        prefer_quality: bool = True,
        max_cost_per_request: float = 0.50,
    ):
        self.config = config or PAULI_CONFIG
        self.guardrails = guardrails or PauliGuardrails(self.config)
        self.prefer_speed = prefer_speed
        self.prefer_quality = prefer_quality
        self.max_cost_per_request = max_cost_per_request
        
        # History for Agent Lightning training
        self.routing_history: List[Dict] = []
        self.reward_history: List[float] = []
        
    def classify_task(self, prompt: str, has_image: bool = False, metadata: Dict = None) -> TaskType:
        """Classify the task type based on prompt content."""
        prompt_lower = prompt.lower()
        metadata = metadata or {}
        
        # Check metadata hints first
        if metadata.get("task_type"):
            try:
                return TaskType(metadata["task_type"])
            except ValueError:
                pass
                
        # Computer use detection
        computer_keywords = ["click", "mouse", "keyboard", "screen", "desktop", "window", "scroll"]
        if any(kw in prompt_lower for kw in computer_keywords):
            return TaskType.COMPUTER_USE
            
        # Vision detection
        if has_image or any(kw in prompt_lower for kw in ["image", "picture", "screenshot", "photo", "look at"]):
            return TaskType.VISION
            
        # Coding detection
        code_keywords = ["code", "function", "class", "debug", "implement", "python", "javascript", "typescript", "react", "api"]
        if any(kw in prompt_lower for kw in code_keywords):
            return TaskType.CODING
            
        # Browser detection
        browser_keywords = ["website", "webpage", "browser", "navigate", "url", "link"]
        if any(kw in prompt_lower for kw in browser_keywords):
            return TaskType.BROWSER
            
        # Research detection  
        research_keywords = ["research", "find", "search", "look up", "information about", "what is"]
        if any(kw in prompt_lower for kw in research_keywords):
            return TaskType.RESEARCH
            
        # Long context detection
        if len(prompt) > 50000:
            return TaskType.LONG_CONTEXT
            
        # Analysis detection
        analysis_keywords = ["analyze", "compare", "evaluate", "summarize", "review", "assess"]
        if any(kw in prompt_lower for kw in analysis_keywords):
            return TaskType.ANALYSIS
            
        # Fast response for short queries
        if len(prompt) < 500:
            return TaskType.FAST_RESPONSE
            
        # Creative detection
        creative_keywords = ["write", "create", "generate", "story", "poem", "creative"]
        if any(kw in prompt_lower for kw in creative_keywords):
            return TaskType.CREATIVE
            
        # Default to reasoning
        return TaskType.REASONING
        
    def estimate_tokens(self, prompt: str) -> tuple[int, int]:
        """Estimate input and output tokens."""
        # Rough estimation: ~4 characters per token
        input_tokens = len(prompt) // 4
        output_tokens = min(input_tokens * 2, 4000)  # Cap output estimate
        return input_tokens, output_tokens
        
    def estimate_cost(self, model: ModelConfig, input_tokens: int, output_tokens: int) -> float:
        """Estimate the cost of a request."""
        input_cost = (input_tokens / 1000) * model.cost_per_1k_input
        output_cost = (output_tokens / 1000) * model.cost_per_1k_output
        return input_cost + output_cost
        
    def route(
        self,
        prompt: str,
        has_image: bool = False,
        required_features: List[str] = None,
        max_latency_ms: int = None,
        force_model: str = None,
        metadata: Dict = None,
    ) -> RoutingDecision:
        """
        Route a request to the optimal model.
        
        Args:
            prompt: The prompt to route
            has_image: Whether the request includes images
            required_features: Required features (vision, computer_use)
            max_latency_ms: Maximum acceptable latency
            force_model: Force a specific model
            metadata: Additional routing metadata
            
        Returns:
            RoutingDecision with selected model and reasoning
        """
        required_features = required_features or []
        metadata = metadata or {}
        
        # Force specific model if requested
        if force_model and force_model in MODELS:
            config = MODELS[force_model]
            return RoutingDecision(
                model=force_model,
                provider=config.provider,
                task_type=TaskType.REASONING,
                estimated_cost=0,
                reason="forced_selection",
                litellm_model=f"{config.provider}/{force_model}",
                confidence=1.0,
            )
            
        # Classify task
        task_type = self.classify_task(prompt, has_image, metadata)
        
        # Get candidate models
        candidates = TASK_MODEL_PRIORITY.get(task_type, list(MODELS.keys()))
        
        # Filter by required features
        if "vision" in required_features:
            candidates = [m for m in candidates if m in MODELS and MODELS[m].supports_vision]
        if "computer_use" in required_features:
            candidates = [m for m in candidates if m in MODELS and MODELS[m].supports_computer_use]
            
        # Filter by latency
        if max_latency_ms:
            candidates = [m for m in candidates if m in MODELS and MODELS[m].latency_ms <= max_latency_ms]
            
        # Estimate tokens
        input_tokens, output_tokens = self.estimate_tokens(prompt)
        
        # Filter by cost and score candidates
        scored_candidates = []
        for model_name in candidates:
            if model_name not in MODELS:
                continue
            model = MODELS[model_name]
            cost = self.estimate_cost(model, input_tokens, output_tokens)
            
            if cost <= self.max_cost_per_request:
                # Calculate score based on preferences
                if self.prefer_speed:
                    score = 1.0 / (model.latency_ms + 1)
                elif self.prefer_quality:
                    score = model.quality_score
                else:
                    # Balance: quality/cost ratio
                    score = model.quality_score / (cost + 0.001)
                    
                scored_candidates.append((model_name, cost, score))
                
        # Fallback if no candidates
        if not scored_candidates:
            cheapest = min(MODELS.items(), key=lambda x: x[1].cost_per_1k_input)
            model_name = cheapest[0]
            config = cheapest[1]
            cost = self.estimate_cost(config, input_tokens, output_tokens)
            
            decision = RoutingDecision(
                model=model_name,
                provider=config.provider,
                task_type=task_type,
                estimated_cost=cost,
                reason="cost_fallback",
                litellm_model=f"{config.provider}/{model_name}",
                confidence=0.5,
            )
            self._log_decision(decision, prompt)
            return decision
            
        # Sort by score and select best
        scored_candidates.sort(key=lambda x: -x[2])
        selected = scored_candidates[0]
        alternatives = [c[0] for c in scored_candidates[1:3]]
        
        config = MODELS[selected[0]]
        decision = RoutingDecision(
            model=selected[0],
            provider=config.provider,
            task_type=task_type,
            estimated_cost=selected[1],
            reason="optimal_selection",
            litellm_model=f"{config.provider}/{selected[0]}",
            alternatives=alternatives,
            confidence=min(1.0, selected[2] * 1.1),
        )
        
        self._log_decision(decision, prompt)
        return decision
        
    def _log_decision(self, decision: RoutingDecision, prompt: str) -> None:
        """Log routing decision for Agent Lightning training."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "model": decision.model,
            "task_type": decision.task_type.value,
            "estimated_cost": decision.estimated_cost,
            "reason": decision.reason,
            "prompt_length": len(prompt),
        }
        self.routing_history.append(entry)
        
        # Emit trace for Agent Lightning
        if AGL_AVAILABLE:
            emit_object({
                "name": "routing_decision",
                **entry
            })
            
    def record_outcome(self, success: bool, actual_latency_ms: int = None, user_rating: float = None) -> None:
        """
        Record the outcome of a routing decision for learning.
        
        This data feeds into Agent Lightning for continuous improvement.
        """
        if not self.routing_history:
            return
            
        last_decision = self.routing_history[-1]
        
        # Calculate reward
        reward = 1.0 if success else -0.5
        
        if user_rating is not None:
            reward = (reward + user_rating) / 2
            
        if actual_latency_ms and "latency_target" in last_decision:
            if actual_latency_ms > last_decision["latency_target"]:
                reward -= 0.2
                
        self.reward_history.append(reward)
        
        # Emit reward for Agent Lightning
        if AGL_AVAILABLE:
            emit_reward(reward)
            
    def get_stats(self) -> Dict[str, Any]:
        """Get routing statistics for dashboard."""
        if not self.routing_history:
            return {"total_requests": 0}
            
        model_usage = {}
        task_usage = {}
        total_cost = 0.0
        
        for entry in self.routing_history:
            model = entry.get("model", "unknown")
            task = entry.get("task_type", "unknown")
            cost = entry.get("estimated_cost", 0)
            
            model_usage[model] = model_usage.get(model, 0) + 1
            task_usage[task] = task_usage.get(task, 0) + 1
            total_cost += cost
            
        avg_reward = sum(self.reward_history) / len(self.reward_history) if self.reward_history else 0
            
        return {
            "total_requests": len(self.routing_history),
            "estimated_total_cost": round(total_cost, 4),
            "model_usage": model_usage,
            "task_usage": task_usage,
            "average_reward": round(avg_reward, 3),
        }


# Singleton router instance
_router: Optional[PauliRouter] = None

def get_router(**kwargs) -> PauliRouter:
    """Get or create the singleton router instance."""
    global _router
    if _router is None:
        _router = PauliRouter(**kwargs)
    return _router


__all__ = [
    "TaskType",
    "ModelConfig", 
    "RoutingDecision",
    "PauliRouter",
    "get_router",
    "MODELS",
    "TASK_MODEL_PRIORITY",
]
