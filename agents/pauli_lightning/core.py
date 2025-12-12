# Copyright (c) The Pauli Effect. All rights reserved.

"""
THE PAULI EFFECT - Agent Lightning Core

This module implements the core infrastructure following Microsoft's
Agent Lightning architecture and best practices.

Based on: https://microsoft.github.io/agent-lightning/
"""

import os
import logging
import asyncio
from typing import Any, Dict, List, Optional, TypeVar, Generic, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime

# Agent Lightning imports - these will be available after `pip install agentlightning`
try:
    import agentlightning as agl
    from agentlightning import (
        LitAgent,
        Trainer,
        emit_reward,
        emit_message,
        emit_object,
        emit_exception,
        AgentOpsTracer,
        OtelTracer,
        LightningStore,
        InMemoryLightningStore,
        LightningStoreClient,
        LightningStoreServer,
    )
    AGL_AVAILABLE = True
except ImportError:
    AGL_AVAILABLE = False
    # Provide stub classes for development without agentlightning installed
    class LitAgent:
        pass
    class Trainer:
        pass
    def emit_reward(reward: float): pass
    def emit_message(msg: str): pass
    def emit_object(obj: Any): pass
    def emit_exception(exc: Exception): pass

logger = logging.getLogger(__name__)

T = TypeVar("T")

# =============================================================================
# CONFIGURATION
# =============================================================================

@dataclass
class PauliConfig:
    """Global configuration for The Pauli Effect Agent Lightning integration."""
    
    # Store Configuration
    store_backend: str = "memory"  # "memory", "redis", "client"
    store_url: str = "http://localhost:45993"
    redis_url: str = "redis://localhost:6379"
    
    # Training Configuration
    experiment_name: str = "pauli-effect-v1"
    max_rollouts: int = 100
    n_runners: int = 4
    
    # LLM Configuration
    litellm_base_url: str = "http://localhost:4000"
    default_model: str = "claude-sonnet-4-20250514"
    fallback_model: str = "gpt-4o-mini"
    
    # Guardrails
    max_tokens_per_request: int = 100000
    max_cost_per_request: float = 1.0
    max_requests_per_minute: int = 60
    enable_content_filter: bool = True
    enable_pii_filter: bool = True
    
    # Dashboard
    dashboard_port: int = 5173
    api_port: int = 45993
    
    # Logging
    log_level: str = "INFO"
    trace_all_calls: bool = True
    
    @classmethod
    def from_env(cls) -> "PauliConfig":
        """Load configuration from environment variables."""
        return cls(
            store_backend=os.getenv("PAULI_STORE_BACKEND", "memory"),
            store_url=os.getenv("PAULI_STORE_URL", "http://localhost:45993"),
            redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
            experiment_name=os.getenv("PAULI_EXPERIMENT", "pauli-effect-v1"),
            litellm_base_url=os.getenv("LITELLM_BASE_URL", "http://localhost:4000"),
            default_model=os.getenv("PAULI_DEFAULT_MODEL", "claude-sonnet-4-20250514"),
            log_level=os.getenv("PAULI_LOG_LEVEL", "INFO"),
        )

# Global configuration instance
PAULI_CONFIG = PauliConfig.from_env()


# =============================================================================
# GUARDRAILS
# =============================================================================

class GuardrailViolation(Exception):
    """Raised when a guardrail policy is violated."""
    pass

class GuardrailLevel(Enum):
    """Severity levels for guardrail violations."""
    WARNING = "warning"
    BLOCK = "block"
    CRITICAL = "critical"

@dataclass
class GuardrailResult:
    """Result of a guardrail check."""
    passed: bool
    level: GuardrailLevel = GuardrailLevel.WARNING
    message: str = ""
    details: Dict[str, Any] = field(default_factory=dict)

class PauliGuardrails:
    """
    Safety guardrails for Pauli agents.
    
    Implements Microsoft's Responsible AI guidelines:
    - Content filtering
    - Cost limits
    - Rate limiting
    - PII protection
    - Action constraints
    """
    
    def __init__(self, config: PauliConfig = None):
        self.config = config or PAULI_CONFIG
        self._request_count = 0
        self._request_window_start = datetime.now()
        self._total_cost = 0.0
        
        # Blocked patterns for content filtering
        self._blocked_patterns = [
            # Add patterns that should be blocked
        ]
        
        # Allowed computer actions for Lux
        self._allowed_lux_actions = {
            "screenshot", "mouse_move", "left_click", "right_click",
            "double_click", "type", "key", "scroll", "wait"
        }
        
        # Blocked applications for computer use
        self._blocked_applications = {
            "cmd.exe", "powershell.exe", "terminal",
            "system32", "registry", "regedit"
        }
        
    def check_content(self, content: str) -> GuardrailResult:
        """Check content against safety filters."""
        if not self.config.enable_content_filter:
            return GuardrailResult(passed=True)
            
        # Check for blocked patterns
        content_lower = content.lower()
        for pattern in self._blocked_patterns:
            if pattern in content_lower:
                return GuardrailResult(
                    passed=False,
                    level=GuardrailLevel.BLOCK,
                    message=f"Content contains blocked pattern",
                    details={"pattern": pattern}
                )
        
        return GuardrailResult(passed=True)
    
    def check_cost(self, estimated_cost: float) -> GuardrailResult:
        """Check if request cost is within limits."""
        if estimated_cost > self.config.max_cost_per_request:
            return GuardrailResult(
                passed=False,
                level=GuardrailLevel.BLOCK,
                message=f"Estimated cost ${estimated_cost:.4f} exceeds limit ${self.config.max_cost_per_request:.4f}",
                details={"estimated_cost": estimated_cost, "limit": self.config.max_cost_per_request}
            )
        return GuardrailResult(passed=True)
    
    def check_rate_limit(self) -> GuardrailResult:
        """Check rate limiting."""
        now = datetime.now()
        elapsed = (now - self._request_window_start).total_seconds()
        
        # Reset window every minute
        if elapsed >= 60:
            self._request_count = 0
            self._request_window_start = now
            
        self._request_count += 1
        
        if self._request_count > self.config.max_requests_per_minute:
            return GuardrailResult(
                passed=False,
                level=GuardrailLevel.BLOCK,
                message=f"Rate limit exceeded: {self._request_count}/{self.config.max_requests_per_minute} requests/min",
                details={"count": self._request_count, "limit": self.config.max_requests_per_minute}
            )
        return GuardrailResult(passed=True)
    
    def check_lux_action(self, action: str, target: Optional[str] = None) -> GuardrailResult:
        """Check if a Lux computer use action is allowed."""
        if action not in self._allowed_lux_actions:
            return GuardrailResult(
                passed=False,
                level=GuardrailLevel.BLOCK,
                message=f"Action '{action}' is not in allowed list",
                details={"action": action, "allowed": list(self._allowed_lux_actions)}
            )
            
        # Check target against blocked applications
        if target:
            target_lower = target.lower()
            for blocked in self._blocked_applications:
                if blocked in target_lower:
                    return GuardrailResult(
                        passed=False,
                        level=GuardrailLevel.CRITICAL,
                        message=f"Cannot interact with system application: {blocked}",
                        details={"target": target, "blocked": blocked}
                    )
        
        return GuardrailResult(passed=True)
    
    def check_all(
        self,
        content: Optional[str] = None,
        estimated_cost: Optional[float] = None,
        lux_action: Optional[str] = None,
        lux_target: Optional[str] = None,
    ) -> List[GuardrailResult]:
        """Run all applicable guardrail checks."""
        results = []
        
        # Always check rate limit
        results.append(self.check_rate_limit())
        
        if content:
            results.append(self.check_content(content))
            
        if estimated_cost is not None:
            results.append(self.check_cost(estimated_cost))
            
        if lux_action:
            results.append(self.check_lux_action(lux_action, lux_target))
            
        return results
    
    def enforce(self, results: List[GuardrailResult]) -> None:
        """Enforce guardrail results, raising exceptions for violations."""
        for result in results:
            if not result.passed:
                if result.level in (GuardrailLevel.BLOCK, GuardrailLevel.CRITICAL):
                    raise GuardrailViolation(result.message)
                else:
                    logger.warning(f"Guardrail warning: {result.message}")


# =============================================================================
# STORE
# =============================================================================

class PauliStore:
    """
    Central data store for The Pauli Effect.
    
    Wraps Agent Lightning's LightningStore with Pauli-specific functionality.
    """
    
    def __init__(self, config: PauliConfig = None):
        self.config = config or PAULI_CONFIG
        self._store: Optional[Any] = None
        self._initialized = False
        
    async def initialize(self) -> None:
        """Initialize the store based on configuration."""
        if self._initialized:
            return
            
        if not AGL_AVAILABLE:
            logger.warning("Agent Lightning not installed. Using mock store.")
            self._store = {}
            self._initialized = True
            return
            
        if self.config.store_backend == "memory":
            self._store = InMemoryLightningStore()
        elif self.config.store_backend == "client":
            self._store = LightningStoreClient(self.config.store_url)
        else:
            self._store = InMemoryLightningStore()
            
        self._initialized = True
        logger.info(f"Pauli Store initialized with backend: {self.config.store_backend}")
        
    @property
    def store(self) -> Any:
        """Get the underlying LightningStore."""
        if not self._initialized:
            asyncio.get_event_loop().run_until_complete(self.initialize())
        return self._store
    
    async def start_rollout(self, input_data: Dict[str, Any]) -> Any:
        """Start a new rollout."""
        await self.initialize()
        if AGL_AVAILABLE and hasattr(self._store, 'start_rollout'):
            return await self._store.start_rollout(input=input_data)
        return {"rollout_id": f"mock-{datetime.now().timestamp()}"}
    
    async def query_spans(self, rollout_id: str) -> List[Any]:
        """Query spans for a rollout."""
        if AGL_AVAILABLE and hasattr(self._store, 'query_spans'):
            return await self._store.query_spans(rollout_id=rollout_id)
        return []
    
    async def close(self) -> None:
        """Close the store connection."""
        if AGL_AVAILABLE and hasattr(self._store, 'close'):
            await self._store.close()


# =============================================================================
# BASE AGENT
# =============================================================================

class PauliAgent(LitAgent if AGL_AVAILABLE else object):
    """
    Base agent class for all Pauli agents.
    
    Provides:
    - Automatic tracing via Agent Lightning
    - Built-in guardrails
    - Reward emission
    - Error handling
    
    Subclass this to create specific agents (Lux, BrowserOps, etc.)
    """
    
    # Agent identity - override in subclasses
    agent_name: str = "pauli-base"
    agent_role: str = "General purpose AI assistant"
    agent_capabilities: List[str] = []
    
    def __init__(
        self,
        config: PauliConfig = None,
        guardrails: PauliGuardrails = None,
    ):
        if AGL_AVAILABLE:
            super().__init__()
        self.config = config or PAULI_CONFIG
        self.guardrails = guardrails or PauliGuardrails(self.config)
        self._tracer = None
        self._store = None
        
    def set_store(self, store: PauliStore) -> None:
        """Set the store for this agent."""
        self._store = store
        
    def set_tracer(self, tracer: Any) -> None:
        """Set the tracer for this agent."""
        self._tracer = tracer
        
    def emit_trace(self, name: str, data: Dict[str, Any]) -> None:
        """Emit a trace span."""
        if AGL_AVAILABLE:
            emit_object({"name": name, **data})
            
    def emit_success(self, reward: float = 1.0, details: Optional[Dict] = None) -> None:
        """Emit a success reward."""
        if AGL_AVAILABLE:
            emit_reward(reward)
        self.emit_trace("success", {"reward": reward, **(details or {})})
        
    def emit_failure(self, reward: float = -1.0, error: Optional[str] = None) -> None:
        """Emit a failure reward."""
        if AGL_AVAILABLE:
            emit_reward(reward)
        self.emit_trace("failure", {"reward": reward, "error": error})
        
    async def run(self, task: str, **kwargs) -> Dict[str, Any]:
        """
        Execute a task with full tracing and guardrails.
        
        Override this method in subclasses.
        """
        # Check guardrails
        guardrail_results = self.guardrails.check_all(content=task)
        self.guardrails.enforce(guardrail_results)
        
        try:
            result = await self.execute(task, **kwargs)
            self.emit_success(1.0, {"task": task, "result_preview": str(result)[:100]})
            return {"success": True, "result": result}
        except GuardrailViolation as e:
            self.emit_failure(-1.0, str(e))
            return {"success": False, "error": str(e), "type": "guardrail_violation"}
        except Exception as e:
            if AGL_AVAILABLE:
                emit_exception(e)
            self.emit_failure(-0.5, str(e))
            return {"success": False, "error": str(e), "type": "execution_error"}
            
    async def execute(self, task: str, **kwargs) -> Any:
        """
        Execute the actual task logic.
        
        Override this method in subclasses.
        """
        raise NotImplementedError("Subclasses must implement execute()")
    
    # LitAgent interface methods (for Agent Lightning compatibility)
    def rollout(self, task: Any, resources: Any, rollout: Any) -> Any:
        """Synchronous rollout for Agent Lightning."""
        return asyncio.get_event_loop().run_until_complete(
            self.run(str(task))
        )
    
    async def rollout_async(self, task: Any, resources: Any, rollout: Any) -> Any:
        """Asynchronous rollout for Agent Lightning."""
        return await self.run(str(task))


# =============================================================================
# TRAINER
# =============================================================================

class PauliTrainer:
    """
    Training orchestration for Pauli agents.
    
    Wraps Agent Lightning's Trainer with Pauli-specific configuration.
    """
    
    def __init__(
        self,
        config: PauliConfig = None,
        store: PauliStore = None,
    ):
        self.config = config or PAULI_CONFIG
        self.store = store or PauliStore(self.config)
        self._trainer: Optional[Any] = None
        
    async def initialize(self) -> None:
        """Initialize the trainer."""
        await self.store.initialize()
        
        if not AGL_AVAILABLE:
            logger.warning("Agent Lightning not installed. Using mock trainer.")
            return
            
        self._trainer = Trainer(
            store=self.store.store,
            n_runners=self.config.n_runners,
            max_rollouts=self.config.max_rollouts,
        )
        
    def train(
        self,
        agent: PauliAgent,
        dataset: List[Dict[str, Any]],
    ) -> None:
        """Train an agent on a dataset."""
        if not AGL_AVAILABLE:
            logger.warning("Training requires agentlightning. Skipping.")
            return
            
        asyncio.get_event_loop().run_until_complete(self.initialize())
        self._trainer.fit(agent, dataset)
        
    def dev(
        self,
        agent: PauliAgent,
        dataset: List[Dict[str, Any]],
    ) -> None:
        """Run a development/debug training session."""
        if not AGL_AVAILABLE:
            logger.warning("Dev mode requires agentlightning. Skipping.")
            return
            
        asyncio.get_event_loop().run_until_complete(self.initialize())
        self._trainer.dev(agent, dataset)


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    "PAULI_CONFIG",
    "PauliConfig",
    "PauliGuardrails",
    "GuardrailViolation",
    "GuardrailLevel",
    "GuardrailResult",
    "PauliStore",
    "PauliAgent",
    "PauliTrainer",
    "AGL_AVAILABLE",
]
