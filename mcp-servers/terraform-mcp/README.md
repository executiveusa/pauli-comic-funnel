# Terraform MCP Server

Infrastructure as Code management through Model Context Protocol using Terraform.

## Overview

This MCP server provides comprehensive Terraform operations including:
- Infrastructure planning and deployment
- State management and queries
- Workspace management
- Resource lifecycle operations
- Drift detection and validation

## Features

### Core Operations
- **terraform_init** - Initialize Terraform working directory
- **terraform_plan** - Generate execution plans
- **terraform_apply** - Apply infrastructure changes
- **terraform_destroy** - Destroy managed infrastructure
- **terraform_validate** - Validate configuration files
- **terraform_refresh** - Update state to match real infrastructure

### State Management
- **terraform_state_list** - List all resources in state
- **terraform_state_show** - Show detailed resource information
- **terraform_output** - Read output values

### Workspace Management
- **terraform_workspace_list** - List all workspaces
- **terraform_workspace_select** - Switch between workspaces

## Installation

### Prerequisites
- Python 3.8 or higher
- Terraform CLI installed and in PATH
- FastMCP framework

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables (optional):
```bash
export TERRAFORM_WORKING_DIR=/path/to/terraform/configs
```

3. Run the server:
```bash
python server.py
```

## Configuration

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "terraform": {
      "command": "python",
      "args": [
        "/absolute/path/to/terraform-mcp/server.py"
      ],
      "env": {
        "TERRAFORM_WORKING_DIR": "/path/to/terraform/configs"
      }
    }
  }
}
```

### Environment Variables

- `TERRAFORM_WORKING_DIR` - Default directory for Terraform operations (default: current directory)

## Usage Examples

### Initialize Terraform
```python
# Initialize with default backend
terraform_init()

# Initialize with backend configuration
terraform_init(
    backend_config={
        "bucket": "my-tf-state",
        "key": "terraform.tfstate",
        "region": "us-west-2"
    },
    upgrade=True
)
```

### Plan Infrastructure Changes
```python
# Basic plan
terraform_plan()

# Plan with variables
terraform_plan(
    var_file="production.tfvars",
    variables={"instance_type": "t3.medium"},
    out="tfplan"
)

# Destroy plan
terraform_plan(destroy=True)
```

### Apply Changes
```python
# Apply with auto-approve
terraform_apply(
    var_file="production.tfvars",
    auto_approve=True
)

# Apply saved plan
terraform_apply(plan_file="tfplan")
```

### State Management
```python
# List all resources
result = terraform_state_list()
print(f"Total resources: {result['count']}")

# Show specific resource
terraform_state_show("aws_instance.web_server")

# Get outputs
outputs = terraform_output(json_format=True)
```

### Workspace Management
```python
# List workspaces
workspaces = terraform_workspace_list()

# Switch workspace
terraform_workspace_select("production")
```

## Security Best Practices

### 1. Credential Management
- Never hardcode credentials in Terraform files
- Use environment variables or secret management systems
- Consider using Terraform Cloud or Enterprise for sensitive operations

### 2. State File Security
- Store state files in encrypted remote backends
- Use state locking to prevent concurrent modifications
- Restrict access to state files (contain sensitive data)

### 3. Access Control
- Implement RBAC for Terraform operations
- Use separate workspaces for different environments
- Audit all infrastructure changes

### 4. Safe Operations
- Always run `terraform plan` before `terraform apply`
- Use `-target` flag cautiously to modify specific resources
- Enable auto-approve only in CI/CD pipelines with proper safeguards
- Implement drift detection to catch unauthorized changes

### 5. Version Control
- Store Terraform configurations in version control
- Pin provider versions for reproducibility
- Review all changes through pull requests

## Error Handling

The server provides detailed error information:

```python
result = terraform_apply()
if not result['success']:
    print(f"Error: {result['error']}")
    print(f"Return code: {result['return_code']}")
```

## Limitations

- Requires Terraform CLI installed on the system
- Interactive prompts are disabled (use auto_approve when appropriate)
- Large state files may have performance impact
- Remote backend configuration must be pre-configured

## Troubleshooting

### Terraform Not Found
Ensure Terraform is installed and in PATH:
```bash
terraform version
```

### State Lock Errors
Release stuck locks:
```bash
terraform force-unlock <lock-id>
```

### Backend Initialization Issues
Check backend configuration and credentials:
```bash
terraform init -backend-config=backend.hcl
```

## Contributing

Contributions are welcome! Please ensure:
- All new tools include comprehensive docstrings
- Security best practices are followed
- Error handling is implemented
- Examples are provided

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Your Repository]
- Documentation: [Link to docs]
- Community: [Link to community]
