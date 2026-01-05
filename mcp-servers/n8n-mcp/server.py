"""
n8n MCP Server
Self-hosted workflow automation through Model Context Protocol
"""

import os
import json
import requests
from typing import Optional, Dict, Any, List
from datetime import datetime
from fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("n8n-mcp")

# n8n API configuration
N8N_API_URL = os.getenv("N8N_API_URL", "http://localhost:5678/api/v1")
N8N_API_KEY = os.getenv("N8N_API_KEY", "")


class N8nClient:
    """Manages n8n API interactions with proper error handling"""

    def __init__(self, api_url: str = N8N_API_URL, api_key: str = N8N_API_KEY):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()

        if self.api_key:
            self.session.headers.update({
                "X-N8N-API-KEY": self.api_key,
                "Content-Type": "application/json"
            })

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make HTTP request to n8n API"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"

        try:
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                params=params,
                timeout=30
            )

            response.raise_for_status()

            if response.content:
                return {
                    "success": True,
                    "data": response.json(),
                    "status_code": response.status_code
                }
            else:
                return {
                    "success": True,
                    "data": None,
                    "status_code": response.status_code
                }

        except requests.exceptions.HTTPError as e:
            error_detail = {}
            try:
                error_detail = e.response.json()
            except:
                error_detail = {"message": str(e)}

            return {
                "success": False,
                "error": error_detail.get("message", str(e)),
                "status_code": e.response.status_code,
                "details": error_detail
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """GET request"""
        return self._make_request("GET", endpoint, params=params)

    def post(self, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """POST request"""
        return self._make_request("POST", endpoint, data=data)

    def put(self, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """PUT request"""
        return self._make_request("PUT", endpoint, data=data)

    def patch(self, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """PATCH request"""
        return self._make_request("PATCH", endpoint, data=data)

    def delete(self, endpoint: str) -> Dict[str, Any]:
        """DELETE request"""
        return self._make_request("DELETE", endpoint)


n8n = N8nClient()


@mcp.tool()
def n8n_list_workflows(
    active: Optional[bool] = None,
    tags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    List all workflows

    Args:
        active: Filter by active status (True/False)
        tags: Filter by tags

    Returns:
        Dictionary with list of workflows
    """
    try:
        params = {}
        if active is not None:
            params['active'] = str(active).lower()
        if tags:
            params['tags'] = ','.join(tags)

        result = n8n.get("workflows", params=params)

        if not result['success']:
            return result

        workflows = result['data'].get('data', [])

        workflow_list = []
        for wf in workflows:
            workflow_info = {
                "id": wf.get("id"),
                "name": wf.get("name"),
                "active": wf.get("active"),
                "tags": wf.get("tags", []),
                "created_at": wf.get("createdAt"),
                "updated_at": wf.get("updatedAt"),
                "nodes": len(wf.get("nodes", [])),
                "connections": wf.get("connections", {})
            }
            workflow_list.append(workflow_info)

        return {
            "success": True,
            "count": len(workflow_list),
            "workflows": workflow_list
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_get_workflow(workflow_id: str) -> Dict[str, Any]:
    """
    Get detailed workflow information

    Args:
        workflow_id: Workflow ID

    Returns:
        Dictionary with workflow details
    """
    try:
        result = n8n.get(f"workflows/{workflow_id}")

        if not result['success']:
            return result

        workflow = result['data']

        return {
            "success": True,
            "workflow": {
                "id": workflow.get("id"),
                "name": workflow.get("name"),
                "active": workflow.get("active"),
                "nodes": workflow.get("nodes", []),
                "connections": workflow.get("connections", {}),
                "settings": workflow.get("settings", {}),
                "staticData": workflow.get("staticData"),
                "tags": workflow.get("tags", []),
                "createdAt": workflow.get("createdAt"),
                "updatedAt": workflow.get("updatedAt")
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_create_workflow(
    name: str,
    nodes: List[Dict[str, Any]],
    connections: Dict[str, Any],
    active: bool = False,
    settings: Optional[Dict[str, Any]] = None,
    tags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Create a new workflow

    Args:
        name: Workflow name
        nodes: List of workflow nodes
        connections: Node connections
        active: Activate workflow immediately
        settings: Workflow settings
        tags: Workflow tags

    Returns:
        Dictionary with created workflow details
    """
    try:
        workflow_data = {
            "name": name,
            "nodes": nodes,
            "connections": connections,
            "active": active,
            "settings": settings or {},
            "tags": tags or []
        }

        result = n8n.post("workflows", data=workflow_data)

        if not result['success']:
            return result

        workflow = result['data']

        return {
            "success": True,
            "workflow_id": workflow.get("id"),
            "name": workflow.get("name"),
            "active": workflow.get("active"),
            "created_at": workflow.get("createdAt")
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_update_workflow(
    workflow_id: str,
    name: Optional[str] = None,
    nodes: Optional[List[Dict[str, Any]]] = None,
    connections: Optional[Dict[str, Any]] = None,
    active: Optional[bool] = None,
    settings: Optional[Dict[str, Any]] = None,
    tags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Update an existing workflow

    Args:
        workflow_id: Workflow ID
        name: New workflow name
        nodes: Updated node list
        connections: Updated connections
        active: Change active status
        settings: Updated settings
        tags: Updated tags

    Returns:
        Dictionary with update status
    """
    try:
        # Get current workflow first
        current = n8n.get(f"workflows/{workflow_id}")
        if not current['success']:
            return current

        workflow = current['data']

        # Update only provided fields
        update_data = {
            "name": name or workflow.get("name"),
            "nodes": nodes or workflow.get("nodes", []),
            "connections": connections or workflow.get("connections", {}),
            "active": active if active is not None else workflow.get("active"),
            "settings": settings or workflow.get("settings", {}),
            "tags": tags or workflow.get("tags", [])
        }

        result = n8n.put(f"workflows/{workflow_id}", data=update_data)

        if not result['success']:
            return result

        updated_workflow = result['data']

        return {
            "success": True,
            "workflow_id": updated_workflow.get("id"),
            "name": updated_workflow.get("name"),
            "active": updated_workflow.get("active"),
            "updated_at": updated_workflow.get("updatedAt")
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_activate_workflow(workflow_id: str, active: bool = True) -> Dict[str, Any]:
    """
    Activate or deactivate a workflow

    Args:
        workflow_id: Workflow ID
        active: True to activate, False to deactivate

    Returns:
        Dictionary with activation status
    """
    try:
        result = n8n.patch(f"workflows/{workflow_id}", data={"active": active})

        if not result['success']:
            return result

        workflow = result['data']

        return {
            "success": True,
            "workflow_id": workflow.get("id"),
            "name": workflow.get("name"),
            "active": workflow.get("active"),
            "status": "activated" if active else "deactivated"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_delete_workflow(workflow_id: str) -> Dict[str, Any]:
    """
    Delete a workflow

    Args:
        workflow_id: Workflow ID

    Returns:
        Dictionary with deletion status
    """
    try:
        result = n8n.delete(f"workflows/{workflow_id}")

        return {
            "success": result['success'],
            "workflow_id": workflow_id,
            "deleted": result['success'],
            "message": "Workflow deleted successfully" if result['success'] else result.get('error')
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_execute_workflow(
    workflow_id: str,
    data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Execute a workflow manually

    Args:
        workflow_id: Workflow ID
        data: Input data for workflow execution

    Returns:
        Dictionary with execution results
    """
    try:
        result = n8n.post(
            f"workflows/{workflow_id}/execute",
            data={"data": data or {}}
        )

        if not result['success']:
            return result

        execution = result['data']

        return {
            "success": True,
            "execution_id": execution.get("id"),
            "workflow_id": workflow_id,
            "finished": execution.get("finished"),
            "mode": execution.get("mode"),
            "started_at": execution.get("startedAt"),
            "stopped_at": execution.get("stoppedAt"),
            "data": execution.get("data")
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_list_executions(
    workflow_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20
) -> Dict[str, Any]:
    """
    List workflow executions

    Args:
        workflow_id: Filter by workflow ID
        status: Filter by status (success, error, waiting, running)
        limit: Maximum number of results

    Returns:
        Dictionary with list of executions
    """
    try:
        params = {"limit": limit}
        if workflow_id:
            params['workflowId'] = workflow_id
        if status:
            params['status'] = status

        result = n8n.get("executions", params=params)

        if not result['success']:
            return result

        executions = result['data'].get('data', [])

        execution_list = []
        for exec in executions:
            execution_info = {
                "id": exec.get("id"),
                "workflow_id": exec.get("workflowId"),
                "workflow_name": exec.get("workflowData", {}).get("name"),
                "finished": exec.get("finished"),
                "mode": exec.get("mode"),
                "started_at": exec.get("startedAt"),
                "stopped_at": exec.get("stoppedAt"),
                "status": exec.get("status"),
                "retryOf": exec.get("retryOf"),
                "retrySuccessId": exec.get("retrySuccessId")
            }
            execution_list.append(execution_info)

        return {
            "success": True,
            "count": len(execution_list),
            "executions": execution_list
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_get_execution(execution_id: str) -> Dict[str, Any]:
    """
    Get detailed execution information

    Args:
        execution_id: Execution ID

    Returns:
        Dictionary with execution details
    """
    try:
        result = n8n.get(f"executions/{execution_id}")

        if not result['success']:
            return result

        execution = result['data']

        return {
            "success": True,
            "execution": {
                "id": execution.get("id"),
                "workflow_id": execution.get("workflowId"),
                "finished": execution.get("finished"),
                "mode": execution.get("mode"),
                "started_at": execution.get("startedAt"),
                "stopped_at": execution.get("stoppedAt"),
                "status": execution.get("status"),
                "data": execution.get("data"),
                "workflowData": execution.get("workflowData")
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_delete_execution(execution_id: str) -> Dict[str, Any]:
    """
    Delete an execution record

    Args:
        execution_id: Execution ID

    Returns:
        Dictionary with deletion status
    """
    try:
        result = n8n.delete(f"executions/{execution_id}")

        return {
            "success": result['success'],
            "execution_id": execution_id,
            "deleted": result['success'],
            "message": "Execution deleted successfully" if result['success'] else result.get('error')
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_list_credentials() -> Dict[str, Any]:
    """
    List all credentials (without sensitive data)

    Returns:
        Dictionary with list of credentials
    """
    try:
        result = n8n.get("credentials")

        if not result['success']:
            return result

        credentials = result['data'].get('data', [])

        credential_list = []
        for cred in credentials:
            credential_info = {
                "id": cred.get("id"),
                "name": cred.get("name"),
                "type": cred.get("type"),
                "created_at": cred.get("createdAt"),
                "updated_at": cred.get("updatedAt")
            }
            credential_list.append(credential_info)

        return {
            "success": True,
            "count": len(credential_list),
            "credentials": credential_list
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_create_credential(
    name: str,
    credential_type: str,
    data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Create a new credential

    Args:
        name: Credential name
        credential_type: Type of credential (e.g., 'httpHeaderAuth', 'oAuth2Api')
        data: Credential data

    Returns:
        Dictionary with created credential details (without sensitive data)
    """
    try:
        credential_data = {
            "name": name,
            "type": credential_type,
            "data": data
        }

        result = n8n.post("credentials", data=credential_data)

        if not result['success']:
            return result

        credential = result['data']

        return {
            "success": True,
            "credential_id": credential.get("id"),
            "name": credential.get("name"),
            "type": credential.get("type"),
            "created_at": credential.get("createdAt")
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_delete_credential(credential_id: str) -> Dict[str, Any]:
    """
    Delete a credential

    Args:
        credential_id: Credential ID

    Returns:
        Dictionary with deletion status
    """
    try:
        result = n8n.delete(f"credentials/{credential_id}")

        return {
            "success": result['success'],
            "credential_id": credential_id,
            "deleted": result['success'],
            "message": "Credential deleted successfully" if result['success'] else result.get('error')
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def n8n_health_check() -> Dict[str, Any]:
    """
    Check n8n instance health status

    Returns:
        Dictionary with health status
    """
    try:
        # Try to get workflows as a health check
        result = n8n.get("workflows", params={"limit": 1})

        return {
            "success": result['success'],
            "status": "healthy" if result['success'] else "unhealthy",
            "api_url": n8n.api_url,
            "authenticated": bool(n8n.api_key),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@mcp.tool()
def n8n_get_webhook_url(
    workflow_id: str,
    webhook_path: str
) -> Dict[str, Any]:
    """
    Get webhook URL for a workflow

    Args:
        workflow_id: Workflow ID
        webhook_path: Webhook path from workflow

    Returns:
        Dictionary with webhook URL
    """
    try:
        # Extract base URL from API URL
        base_url = n8n.api_url.replace('/api/v1', '')

        webhook_url = f"{base_url}/webhook/{webhook_path}"
        test_webhook_url = f"{base_url}/webhook-test/{webhook_path}"

        return {
            "success": True,
            "workflow_id": workflow_id,
            "webhook_path": webhook_path,
            "production_url": webhook_url,
            "test_url": test_webhook_url
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
