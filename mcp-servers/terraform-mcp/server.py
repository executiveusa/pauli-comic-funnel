"""
Terraform MCP Server
Infrastructure as Code management through Model Context Protocol
"""

import os
import json
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, List
from python_terraform import Terraform, IsFlagged
from fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("terraform-mcp")

# Default Terraform working directory
DEFAULT_WORKING_DIR = os.getenv("TERRAFORM_WORKING_DIR", os.getcwd())


class TerraformManager:
    """Manages Terraform operations with security and state management"""

    def __init__(self, working_dir: str = DEFAULT_WORKING_DIR):
        self.working_dir = Path(working_dir).resolve()
        self.tf = Terraform(working_dir=str(self.working_dir))

    def ensure_initialized(self) -> bool:
        """Ensure Terraform is initialized"""
        if not (self.working_dir / ".terraform").exists():
            return_code, stdout, stderr = self.tf.init()
            if return_code != 0:
                raise Exception(f"Terraform init failed: {stderr}")
        return True


@mcp.tool()
def terraform_init(
    working_dir: Optional[str] = None,
    backend_config: Optional[Dict[str, str]] = None,
    upgrade: bool = False
) -> Dict[str, Any]:
    """
    Initialize a Terraform working directory

    Args:
        working_dir: Path to Terraform configuration directory
        backend_config: Backend configuration key-value pairs
        upgrade: Upgrade modules and plugins to latest versions

    Returns:
        Dictionary with initialization status and output
    """
    try:
        dir_path = working_dir or DEFAULT_WORKING_DIR
        tf = Terraform(working_dir=dir_path)

        kwargs = {}
        if backend_config:
            kwargs['backend_config'] = backend_config
        if upgrade:
            kwargs['upgrade'] = IsFlagged

        return_code, stdout, stderr = tf.init(**kwargs)

        return {
            "success": return_code == 0,
            "return_code": return_code,
            "output": stdout,
            "error": stderr if return_code != 0 else None,
            "working_dir": dir_path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def terraform_plan(
    working_dir: Optional[str] = None,
    var_file: Optional[str] = None,
    variables: Optional[Dict[str, str]] = None,
    out: Optional[str] = None,
    destroy: bool = False
) -> Dict[str, Any]:
    """
    Generate and show Terraform execution plan

    Args:
        working_dir: Path to Terraform configuration directory
        var_file: Path to variables file
        variables: Dictionary of variables to pass
        out: Save plan to specified file
        destroy: Create a destroy plan

    Returns:
        Dictionary with plan output and changes summary
    """
    try:
        dir_path = working_dir or DEFAULT_WORKING_DIR
        manager = TerraformManager(dir_path)
        manager.ensure_initialized()

        kwargs = {}
        if var_file:
            kwargs['var_file'] = var_file
        if variables:
            kwargs['var'] = variables
        if out:
            kwargs['out'] = out
        if destroy:
            kwargs['destroy'] = IsFlagged

        return_code, stdout, stderr = manager.tf.plan(**kwargs)

        return {
            "success": return_code == 0,
            "return_code": return_code,
            "plan_output": stdout,
            "error": stderr if return_code != 0 else None,
            "working_dir": dir_path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def terraform_apply(
    working_dir: Optional[str] = None,
    var_file: Optional[str] = None,
    variables: Optional[Dict[str, str]] = None,
    plan_file: Optional[str] = None,
    auto_approve: bool = False
) -> Dict[str, Any]:
    """
    Apply Terraform configuration changes

    Args:
        working_dir: Path to Terraform configuration directory
        var_file: Path to variables file
        variables: Dictionary of variables to pass
        plan_file: Path to saved plan file to apply
        auto_approve: Skip interactive approval (use with caution)

    Returns:
        Dictionary with apply results and resource changes
    """
    try:
        dir_path = working_dir or DEFAULT_WORKING_DIR
        manager = TerraformManager(dir_path)
        manager.ensure_initialized()

        kwargs = {}
        if var_file:
            kwargs['var_file'] = var_file
        if variables:
            kwargs['var'] = variables
        if auto_approve:
            kwargs['auto_approve'] = IsFlagged

        if plan_file:
            return_code, stdout, stderr = manager.tf.apply(plan_file, **kwargs)
        else:
            return_code, stdout, stderr = manager.tf.apply(**kwargs)

        return {
            "success": return_code == 0,
            "return_code": return_code,
            "output": stdout,
            "error": stderr if return_code != 0 else None,
            "working_dir": dir_path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def terraform_destroy(
    working_dir: Optional[str] = None,
    var_file: Optional[str] = None,
    variables: Optional[Dict[str, str]] = None,
    auto_approve: bool = False,
    target: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Destroy Terraform-managed infrastructure

    Args:
        working_dir: Path to Terraform configuration directory
        var_file: Path to variables file
        variables: Dictionary of variables to pass
        auto_approve: Skip interactive approval (use with caution)
        target: Destroy only specific resources

    Returns:
        Dictionary with destroy results
    """
    try:
        dir_path = working_dir or DEFAULT_WORKING_DIR
        manager = TerraformManager(dir_path)
        manager.ensure_initialized()

        kwargs = {}
        if var_file:
            kwargs['var_file'] = var_file
        if variables:
            kwargs['var'] = variables
        if auto_approve:
            kwargs['auto_approve'] = IsFlagged
        if target:
            kwargs['target'] = target

        return_code, stdout, stderr = manager.tf.destroy(**kwargs)

        return {
            "success": return_code == 0,
            "return_code": return_code,
            "output": stdout,
            "error": stderr if return_code != 0 else None,
            "working_dir": dir_path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def terraform_state_list(
    working_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    List resources in Terraform state

    Args:
        working_dir: Path to Terraform configuration directory

    Returns:
        Dictionary with list of resources in state
    """
    try:
        dir_path = working_dir or DEFAULT_WORKING_DIR
        manager = TerraformManager(dir_path)

        return_code, stdout, stderr = manager.tf.state_list()

        resources = stdout.strip().split('\n') if stdout else []

        return {
            "success": return_code == 0,
            "resources": resources,
            "count": len(resources),
            "error": stderr if return_code != 0 else None,
            "working_dir": dir_path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def terraform_state_show(
    resource_address: str,
    working_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Show detailed state for a specific resource

    Args:
        resource_address: Address of the resource (e.g., 'aws_instance.example')
        working_dir: Path to Terraform configuration directory

    Returns:
        Dictionary with resource details from state
    """
    try:
        dir_path = working_dir or DEFAULT_WORKING_DIR
        manager = TerraformManager(dir_path)

        return_code, stdout, stderr = manager.tf.state_show(resource_address)

        return {
            "success": return_code == 0,
            "resource_address": resource_address,
            "details": stdout,
            "error": stderr if return_code != 0 else None,
            "working_dir": dir_path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def terraform_output(
    working_dir: Optional[str] = None,
    name: Optional[str] = None,
    json_format: bool = True
) -> Dict[str, Any]:
    """
    Read output values from Terraform state

    Args:
        working_dir: Path to Terraform configuration directory
        name: Specific output name to retrieve (returns all if not specified)
        json_format: Return outputs in JSON format

    Returns:
        Dictionary with output values
    """
    try:
        dir_path = working_dir or DEFAULT_WORKING_DIR
        manager = TerraformManager(dir_path)

        kwargs = {}
        if json_format:
            kwargs['json'] = IsFlagged

        if name:
            return_code, stdout, stderr = manager.tf.output(name, **kwargs)
        else:
            return_code, stdout, stderr = manager.tf.output(**kwargs)

        outputs = {}
        if json_format and stdout:
            try:
                outputs = json.loads(stdout)
            except json.JSONDecodeError:
                outputs = {"raw": stdout}
        else:
            outputs = {"raw": stdout}

        return {
            "success": return_code == 0,
            "outputs": outputs,
            "error": stderr if return_code != 0 else None,
            "working_dir": dir_path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def terraform_workspace_list(
    working_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    List all Terraform workspaces

    Args:
        working_dir: Path to Terraform configuration directory

    Returns:
        Dictionary with list of workspaces and current workspace
    """
    try:
        dir_path = working_dir or DEFAULT_WORKING_DIR
        manager = TerraformManager(dir_path)
        manager.ensure_initialized()

        return_code, stdout, stderr = manager.tf.workspace('list')

        workspaces = []
        current = None

        if stdout:
            for line in stdout.strip().split('\n'):
                line = line.strip()
                if line.startswith('*'):
                    current = line[1:].strip()
                    workspaces.append(current)
                elif line:
                    workspaces.append(line)

        return {
            "success": return_code == 0,
            "workspaces": workspaces,
            "current": current,
            "error": stderr if return_code != 0 else None,
            "working_dir": dir_path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def terraform_workspace_select(
    workspace: str,
    working_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Switch to a different Terraform workspace

    Args:
        workspace: Name of workspace to switch to
        working_dir: Path to Terraform configuration directory

    Returns:
        Dictionary with workspace switch result
    """
    try:
        dir_path = working_dir or DEFAULT_WORKING_DIR
        manager = TerraformManager(dir_path)
        manager.ensure_initialized()

        return_code, stdout, stderr = manager.tf.workspace('select', workspace)

        return {
            "success": return_code == 0,
            "workspace": workspace,
            "output": stdout,
            "error": stderr if return_code != 0 else None,
            "working_dir": dir_path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def terraform_validate(
    working_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate Terraform configuration files

    Args:
        working_dir: Path to Terraform configuration directory

    Returns:
        Dictionary with validation results
    """
    try:
        dir_path = working_dir or DEFAULT_WORKING_DIR
        manager = TerraformManager(dir_path)
        manager.ensure_initialized()

        return_code, stdout, stderr = manager.tf.validate()

        return {
            "success": return_code == 0,
            "valid": return_code == 0,
            "output": stdout,
            "error": stderr if return_code != 0 else None,
            "working_dir": dir_path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def terraform_refresh(
    working_dir: Optional[str] = None,
    var_file: Optional[str] = None,
    variables: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Update Terraform state to match real infrastructure

    Args:
        working_dir: Path to Terraform configuration directory
        var_file: Path to variables file
        variables: Dictionary of variables to pass

    Returns:
        Dictionary with refresh results
    """
    try:
        dir_path = working_dir or DEFAULT_WORKING_DIR
        manager = TerraformManager(dir_path)
        manager.ensure_initialized()

        kwargs = {}
        if var_file:
            kwargs['var_file'] = var_file
        if variables:
            kwargs['var'] = variables

        return_code, stdout, stderr = manager.tf.refresh(**kwargs)

        return {
            "success": return_code == 0,
            "output": stdout,
            "error": stderr if return_code != 0 else None,
            "working_dir": dir_path
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
