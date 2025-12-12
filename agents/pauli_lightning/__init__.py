# Copyright (c) The Pauli Effect. All rights reserved.
# Agent Lightning Integration for Pauli AI Agency

"""
THE PAULI EFFECT - Agent Lightning Integration

This module provides the core infrastructure for training, monitoring,
and improving all Pauli agents using Microsoft Agent Lightning's
reinforcement learning capabilities.

Components:
- Pauli: Main orchestrator - the central AI that coordinates everything
- PauliStore: Central data store for all agent traces
- PauliTrainer: Training orchestration for agent improvement
- PauliAgent: Base agent class with built-in tracing
- Guardrails: Safety policies and constraints
- Router: Intelligent model selection

Quick Start:
    from pauli_lightning import Pauli
    
    pauli = Pauli()
    
    # Chat with Pauli
    response = await pauli.chat("Create a landing page")
    
    # Computer use (Lux)
    response = await pauli.computer_use("Click the submit button")
    
    # Browser automation
    response = await pauli.browse("Go to github.com")
"""

from .core import (
    PauliStore,
    PauliTrainer,
    PauliAgent,
    PauliGuardrails,
    PauliConfig,
    PAULI_CONFIG,
    AGL_AVAILABLE,
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

from .router import (
    PauliRouter,
    TaskType,
    RoutingDecision,
    get_router,
)

from .pauli import (
    Pauli,
    PauliResponse,
    get_pauli,
    chat,
    computer,
    browse,
    research,
)

__all__ = [
    # Main Orchestrator
    "Pauli",
    "PauliResponse",
    "get_pauli",
    # Quick functions
    "chat",
    "computer",
    "browse",
    "research",
    # Core
    "PauliStore",
    "PauliTrainer", 
    "PauliAgent",
    "PauliGuardrails",
    "PauliConfig",
    "PAULI_CONFIG",
    "AGL_AVAILABLE",
    # Agents
    "LuxComputerAgent",
    "BrowserOpsAgent",
    "ResearcherAgent",
    "DesignerAgent",
    "DevOpsAgent",
    "CRMAgent",
    "get_agent",
    "AGENT_REGISTRY",
    # Router
    "PauliRouter",
    "TaskType",
    "RoutingDecision",
    "get_router",
]

__version__ = "1.0.0"
