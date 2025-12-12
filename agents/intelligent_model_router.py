"""
Intelligent Model Router for The Pauli Effect
Auto-selects optimal LLM based on task type, cost, and latency requirements.

Usage:
    from intelligent_model_router import route_request
    response = await route_request(prompt, task_type="coding", budget="low")
"""

import os
import json
import asyncio
from typing import Optional, Dict, Any, Literal
from dataclasses import dataclass
from enum import Enum
import httpx

# Model pricing per 1M tokens (as of Dec 2025)
MODEL_PRICING = {
    "claude-sonnet-4-20250514": {"input": 3.00, "output": 15.00, "provider": "anthropic"},
    "claude-3-5-sonnet-20241022": {"input": 3.00, "output": 15.00, "provider": "anthropic"},
    "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25, "provider": "anthropic"},
    "gpt-4o": {"input": 2.50, "output": 10.00, "provider": "openai"},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60, "provider": "openai"},
    "gpt-4-turbo": {"input": 10.00, "output": 30.00, "provider": "openai"},
    "gemini-2.0-flash": {"input": 0.10, "output": 0.40, "provider": "google"},
    "gemini-1.5-pro": {"input": 1.25, "output": 5.00, "provider": "google"},
    "gemini-1.5-flash": {"input": 0.075, "output": 0.30, "provider": "google"},
    "deepseek-chat": {"input": 0.14, "output": 0.28, "provider": "deepseek"},
    "deepseek-coder": {"input": 0.14, "output": 0.28, "provider": "deepseek"},
}

# Task-to-model mapping based on capabilities
TASK_MODEL_MAP = {
    "coding": ["claude-sonnet-4-20250514", "deepseek-coder", "gpt-4o"],
    "creative": ["claude-sonnet-4-20250514", "gpt-4o", "gemini-1.5-pro"],
    "analysis": ["claude-sonnet-4-20250514", "gemini-1.5-pro", "gpt-4o"],
    "chat": ["gpt-4o-mini", "gemini-2.0-flash", "claude-3-haiku-20240307"],
    "summarization": ["gemini-2.0-flash", "gpt-4o-mini", "claude-3-haiku-20240307"],
    "translation": ["gpt-4o", "gemini-1.5-pro", "claude-sonnet-4-20250514"],
    "math": ["deepseek-chat", "claude-sonnet-4-20250514", "gpt-4o"],
    "vision": ["gpt-4o", "gemini-1.5-pro", "claude-sonnet-4-20250514"],
    "computer_use": ["claude-sonnet-4-20250514", "lux-computer-use"],
    "general": ["gpt-4o-mini", "gemini-2.0-flash", "claude-3-haiku-20240307"],
}

class BudgetTier(Enum):
    LOW = "low"        # Cheapest option
    MEDIUM = "medium"  # Balance of cost/quality
    HIGH = "high"      # Best quality regardless of cost


@dataclass
class RouterConfig:
    litellm_base_url: str = "http://localhost:4000"
    litellm_api_key: str = ""
    fallback_enabled: bool = True
    max_retries: int = 3
    timeout_seconds: float = 60.0


@dataclass
class RoutingDecision:
    model: str
    provider: str
    estimated_cost_per_1k: float
    reasoning: str


class IntelligentModelRouter:
    """
    Routes LLM requests to optimal model based on:
    - Task type (coding, creative, analysis, etc.)
    - Budget constraints (low/medium/high)
    - Token count estimation
    - Provider availability
    """
    
    def __init__(self, config: Optional[RouterConfig] = None):
        self.config = config or RouterConfig(
            litellm_base_url=os.getenv("LITELLM_BASE_URL", "http://localhost:4000"),
            litellm_api_key=os.getenv("LITELLM_API_KEY", "")
        )
        self.client = httpx.AsyncClient(timeout=self.config.timeout_seconds)
        self._provider_health: Dict[str, bool] = {}
    
    def select_model(
        self,
        task_type: str = "general",
        budget: BudgetTier = BudgetTier.MEDIUM,
        required_features: Optional[list] = None
    ) -> RoutingDecision:
        """Select optimal model based on task and constraints."""
        
        # Get candidate models for this task
        candidates = TASK_MODEL_MAP.get(task_type, TASK_MODEL_MAP["general"])
        
        # Filter by required features
        if required_features:
            if "vision" in required_features:
                candidates = [m for m in candidates if m in ["gpt-4o", "gemini-1.5-pro", "claude-sonnet-4-20250514"]]
            if "computer_use" in required_features:
                candidates = ["claude-sonnet-4-20250514", "lux-computer-use"]
        
        # Sort by cost
        def get_cost(model):
            pricing = MODEL_PRICING.get(model, {"input": 999, "output": 999})
            return pricing["input"] + pricing["output"]
        
        candidates_with_cost = [(m, get_cost(m)) for m in candidates if m in MODEL_PRICING]
        candidates_with_cost.sort(key=lambda x: x[1])
        
        # Select based on budget
        if budget == BudgetTier.LOW:
            selected = candidates_with_cost[0] if candidates_with_cost else (candidates[0], 0)
        elif budget == BudgetTier.HIGH:
            selected = candidates_with_cost[-1] if candidates_with_cost else (candidates[0], 0)
        else:  # MEDIUM - pick middle option
            idx = len(candidates_with_cost) // 2
            selected = candidates_with_cost[idx] if candidates_with_cost else (candidates[0], 0)
        
        model_name = selected[0]
        pricing = MODEL_PRICING.get(model_name, {"input": 0, "output": 0, "provider": "unknown"})
        
        return RoutingDecision(
            model=model_name,
            provider=pricing["provider"],
            estimated_cost_per_1k=(pricing["input"] + pricing["output"]) / 2000,  # Per 1K tokens
            reasoning=f"Selected {model_name} for {task_type} task with {budget.value} budget"
        )
    
    async def route_request(
        self,
        messages: list,
        task_type: str = "general",
        budget: str = "medium",
        stream: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """Route request to optimal model via LiteLLM."""
        
        budget_tier = BudgetTier(budget.lower())
        decision = self.select_model(task_type, budget_tier)
        
        # Build request
        payload = {
            "model": decision.model,
            "messages": messages,
            "stream": stream,
            **kwargs
        }
        
        headers = {
            "Content-Type": "application/json",
        }
        if self.config.litellm_api_key:
            headers["Authorization"] = f"Bearer {self.config.litellm_api_key}"
        
        # Make request with fallback
        for attempt in range(self.config.max_retries):
            try:
                response = await self.client.post(
                    f"{self.config.litellm_base_url}/v1/chat/completions",
                    json=payload,
                    headers=headers
                )
                response.raise_for_status()
                
                result = response.json()
                result["_routing"] = {
                    "model_selected": decision.model,
                    "provider": decision.provider,
                    "reasoning": decision.reasoning,
                    "estimated_cost_per_1k": decision.estimated_cost_per_1k
                }
                return result
                
            except httpx.HTTPStatusError as e:
                if attempt < self.config.max_retries - 1 and self.config.fallback_enabled:
                    # Try next best model
                    fallback_models = TASK_MODEL_MAP.get(task_type, TASK_MODEL_MAP["general"])
                    if decision.model in fallback_models:
                        idx = fallback_models.index(decision.model)
                        if idx + 1 < len(fallback_models):
                            decision.model = fallback_models[idx + 1]
                            payload["model"] = decision.model
                            continue
                raise
        
        return {"error": "All models failed"}
    
    async def check_provider_health(self) -> Dict[str, bool]:
        """Check health of all configured providers."""
        providers = ["anthropic", "openai", "google", "deepseek"]
        
        for provider in providers:
            try:
                response = await self.client.get(
                    f"{self.config.litellm_base_url}/health",
                    timeout=5.0
                )
                self._provider_health[provider] = response.status_code == 200
            except:
                self._provider_health[provider] = False
        
        return self._provider_health
    
    def get_pricing_report(self) -> str:
        """Generate a pricing comparison report."""
        lines = ["# Model Pricing Report (per 1M tokens)\n"]
        lines.append("| Model | Input | Output | Provider |")
        lines.append("|-------|-------|--------|----------|")
        
        for model, pricing in sorted(MODEL_PRICING.items(), key=lambda x: x[1]["input"]):
            lines.append(
                f"| {model} | ${pricing['input']:.2f} | ${pricing['output']:.2f} | {pricing['provider']} |"
            )
        
        return "\n".join(lines)


# Convenience function
async def route_request(
    prompt: str,
    task_type: str = "general",
    budget: str = "medium",
    system_prompt: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Quick routing function.
    
    Args:
        prompt: User message
        task_type: One of coding, creative, analysis, chat, summarization, translation, math, vision, general
        budget: One of low, medium, high
        system_prompt: Optional system message
    
    Returns:
        LLM response with routing metadata
    """
    router = IntelligentModelRouter()
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    return await router.route_request(messages, task_type, budget, **kwargs)


# CLI interface
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--pricing":
            router = IntelligentModelRouter()
            print(router.get_pricing_report())
        elif sys.argv[1] == "--test":
            async def test():
                result = await route_request(
                    "Write a Python function to sort a list",
                    task_type="coding",
                    budget="low"
                )
                print(json.dumps(result, indent=2))
            asyncio.run(test())
    else:
        print("Intelligent Model Router for The Pauli Effect")
        print("Usage:")
        print("  python intelligent_model_router.py --pricing  # Show pricing")
        print("  python intelligent_model_router.py --test     # Test routing")
