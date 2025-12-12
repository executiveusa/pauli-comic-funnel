"""
Lux Computer Use Handler for LiteLLM
Enables desktop automation through Claude's computer use capabilities.

This handler integrates with LiteLLM to provide computer use actions:
- Screenshot capture
- Mouse movements and clicks  
- Keyboard input
- Window management
"""

import os
import base64
import json
import asyncio
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from enum import Enum
import subprocess
import platform

try:
    from PIL import ImageGrab, Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import pyautogui
    pyautogui.FAILSAFE = True
    HAS_PYAUTOGUI = True
except ImportError:
    HAS_PYAUTOGUI = False


class ActionType(Enum):
    SCREENSHOT = "screenshot"
    MOUSE_MOVE = "mouse_move"
    LEFT_CLICK = "left_click"
    RIGHT_CLICK = "right_click"
    DOUBLE_CLICK = "double_click"
    TYPE = "type"
    KEY = "key"
    SCROLL = "scroll"
    DRAG = "drag"


@dataclass
class ComputerAction:
    action: ActionType
    coordinate: Optional[Tuple[int, int]] = None
    text: Optional[str] = None
    key: Optional[str] = None
    scroll_amount: int = 0


@dataclass
class ComputerUseConfig:
    display_width: int = 1920
    display_height: int = 1080
    screenshot_quality: int = 85
    action_delay: float = 0.1
    enable_safety: bool = True


class LuxComputerUseHandler:
    """
    Handler for computer use actions via LiteLLM.
    Provides a bridge between Claude's computer_use tool and actual desktop actions.
    """
    
    def __init__(self, config: Optional[ComputerUseConfig] = None):
        self.config = config or ComputerUseConfig()
        self._validate_dependencies()
    
    def _validate_dependencies(self):
        """Check required dependencies are available."""
        if not HAS_PIL:
            raise ImportError("PIL/Pillow is required: pip install Pillow")
        if not HAS_PYAUTOGUI:
            raise ImportError("pyautogui is required: pip install pyautogui")
    
    def take_screenshot(self, region: Optional[Tuple[int, int, int, int]] = None) -> str:
        """Capture screenshot and return as base64."""
        screenshot = ImageGrab.grab(bbox=region)
        
        # Resize if needed for token efficiency
        max_dim = 1280
        if screenshot.width > max_dim or screenshot.height > max_dim:
            ratio = min(max_dim / screenshot.width, max_dim / screenshot.height)
            new_size = (int(screenshot.width * ratio), int(screenshot.height * ratio))
            screenshot = screenshot.resize(new_size, Image.LANCZOS)
        
        # Convert to base64
        import io
        buffer = io.BytesIO()
        screenshot.save(buffer, format="PNG", quality=self.config.screenshot_quality)
        return base64.b64encode(buffer.getvalue()).decode()
    
    def execute_action(self, action: ComputerAction) -> Dict[str, Any]:
        """Execute a computer action."""
        result = {"success": True, "action": action.action.value}
        
        try:
            if action.action == ActionType.SCREENSHOT:
                result["screenshot"] = self.take_screenshot()
                
            elif action.action == ActionType.MOUSE_MOVE:
                if action.coordinate:
                    pyautogui.moveTo(action.coordinate[0], action.coordinate[1])
                    
            elif action.action == ActionType.LEFT_CLICK:
                if action.coordinate:
                    pyautogui.click(action.coordinate[0], action.coordinate[1])
                else:
                    pyautogui.click()
                    
            elif action.action == ActionType.RIGHT_CLICK:
                if action.coordinate:
                    pyautogui.rightClick(action.coordinate[0], action.coordinate[1])
                else:
                    pyautogui.rightClick()
                    
            elif action.action == ActionType.DOUBLE_CLICK:
                if action.coordinate:
                    pyautogui.doubleClick(action.coordinate[0], action.coordinate[1])
                else:
                    pyautogui.doubleClick()
                    
            elif action.action == ActionType.TYPE:
                if action.text:
                    pyautogui.write(action.text, interval=0.02)
                    
            elif action.action == ActionType.KEY:
                if action.key:
                    # Handle special keys
                    key_map = {
                        "Return": "enter",
                        "Escape": "escape",
                        "Tab": "tab",
                        "Backspace": "backspace",
                        "Delete": "delete",
                        "space": "space",
                        "Up": "up",
                        "Down": "down",
                        "Left": "left",
                        "Right": "right",
                    }
                    key = key_map.get(action.key, action.key.lower())
                    pyautogui.press(key)
                    
            elif action.action == ActionType.SCROLL:
                pyautogui.scroll(action.scroll_amount)
                
            elif action.action == ActionType.DRAG:
                if action.coordinate and action.text:
                    # text contains "end_x,end_y"
                    end_coords = action.text.split(",")
                    end_x, end_y = int(end_coords[0]), int(end_coords[1])
                    pyautogui.moveTo(action.coordinate[0], action.coordinate[1])
                    pyautogui.drag(
                        end_x - action.coordinate[0],
                        end_y - action.coordinate[1],
                        duration=0.5
                    )
            
            # Small delay for action completion
            asyncio.sleep(self.config.action_delay) if asyncio.get_event_loop().is_running() else None
            
        except Exception as e:
            result["success"] = False
            result["error"] = str(e)
        
        return result
    
    def parse_tool_use(self, tool_input: Dict[str, Any]) -> ComputerAction:
        """Parse Claude's computer_use tool input into a ComputerAction."""
        action_str = tool_input.get("action", "screenshot")
        
        action_map = {
            "screenshot": ActionType.SCREENSHOT,
            "mouse_move": ActionType.MOUSE_MOVE,
            "left_click": ActionType.LEFT_CLICK,
            "right_click": ActionType.RIGHT_CLICK,
            "double_click": ActionType.DOUBLE_CLICK,
            "type": ActionType.TYPE,
            "key": ActionType.KEY,
            "scroll": ActionType.SCROLL,
            "drag": ActionType.DRAG,
        }
        
        action_type = action_map.get(action_str, ActionType.SCREENSHOT)
        
        coordinate = None
        if "coordinate" in tool_input:
            coord = tool_input["coordinate"]
            coordinate = (coord[0], coord[1])
        
        return ComputerAction(
            action=action_type,
            coordinate=coordinate,
            text=tool_input.get("text"),
            key=tool_input.get("key"),
            scroll_amount=tool_input.get("scroll_amount", 0)
        )
    
    def handle_tool_call(self, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for handling computer_use tool calls from LiteLLM.
        
        Args:
            tool_input: The input from Claude's computer_use tool
            
        Returns:
            Result dict with screenshot if applicable
        """
        action = self.parse_tool_use(tool_input)
        result = self.execute_action(action)
        
        # Always include a screenshot after non-screenshot actions
        if action.action != ActionType.SCREENSHOT and result["success"]:
            result["screenshot"] = self.take_screenshot()
        
        return result


class LiteLLMComputerUseMiddleware:
    """
    Middleware to intercept and handle computer_use tool calls in LiteLLM.
    """
    
    def __init__(self):
        self.handler = LuxComputerUseHandler()
    
    def process_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Process LiteLLM response and execute computer_use tools."""
        
        if "choices" not in response:
            return response
        
        for choice in response["choices"]:
            message = choice.get("message", {})
            tool_calls = message.get("tool_calls", [])
            
            tool_results = []
            for tool_call in tool_calls:
                if tool_call.get("function", {}).get("name") == "computer":
                    # Parse arguments
                    args = json.loads(tool_call["function"]["arguments"])
                    
                    # Execute the action
                    result = self.handler.handle_tool_call(args)
                    
                    tool_results.append({
                        "tool_call_id": tool_call["id"],
                        "result": result
                    })
            
            if tool_results:
                message["_computer_use_results"] = tool_results
        
        return response


# LiteLLM custom handler registration
def get_litellm_config() -> Dict[str, Any]:
    """
    Returns LiteLLM configuration for computer use models.
    Add this to your litellm_config.yaml or use programmatically.
    """
    return {
        "model_list": [
            {
                "model_name": "lux-computer-use",
                "litellm_params": {
                    "model": "claude-sonnet-4-20250514",
                    "api_key": os.getenv("ANTHROPIC_API_KEY"),
                    "extra_headers": {
                        "anthropic-beta": "computer-use-2024-10-22"
                    }
                },
                "model_info": {
                    "supports_computer_use": True,
                    "max_tokens": 8192
                }
            }
        ],
        "litellm_settings": {
            "callbacks": ["custom_callbacks.lux_computer_use_callback"]
        }
    }


# Example usage
if __name__ == "__main__":
    handler = LuxComputerUseHandler()
    
    # Take a screenshot
    print("Taking screenshot...")
    result = handler.handle_tool_call({"action": "screenshot"})
    print(f"Screenshot captured: {len(result.get('screenshot', ''))} bytes")
    
    # Get screen size
    import pyautogui
    width, height = pyautogui.size()
    print(f"Screen size: {width}x{height}")
