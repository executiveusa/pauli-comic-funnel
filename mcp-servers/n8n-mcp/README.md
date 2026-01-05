# n8n MCP Server

Self-hosted workflow automation through Model Context Protocol using n8n API.

## Overview

This MCP server provides comprehensive n8n workflow automation operations including:
- Workflow creation and management
- Workflow execution and monitoring
- Credential management
- Webhook operations
- Execution history tracking
- Node and connection management

## Features

### Workflow Management
- **n8n_list_workflows** - List all workflows with filtering
- **n8n_get_workflow** - Get detailed workflow information
- **n8n_create_workflow** - Create new workflows
- **n8n_update_workflow** - Update existing workflows
- **n8n_activate_workflow** - Activate/deactivate workflows
- **n8n_delete_workflow** - Remove workflows

### Execution Operations
- **n8n_execute_workflow** - Manually trigger workflow execution
- **n8n_list_executions** - List execution history
- **n8n_get_execution** - Get detailed execution data
- **n8n_delete_execution** - Remove execution records

### Credential Management
- **n8n_list_credentials** - List all credentials (without sensitive data)
- **n8n_create_credential** - Create new credentials
- **n8n_delete_credential** - Remove credentials

### Utilities
- **n8n_health_check** - Check n8n instance health
- **n8n_get_webhook_url** - Get webhook URLs for workflows

## Installation

### Prerequisites
- Python 3.8 or higher
- n8n instance (self-hosted or cloud)
- n8n API key
- FastMCP framework

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up n8n API access:
   - In n8n, go to Settings > API
   - Generate an API key
   - Note your n8n instance URL

3. Configure environment variables:
```bash
export N8N_API_URL=http://localhost:5678/api/v1
export N8N_API_KEY=your-api-key-here
```

4. Run the server:
```bash
python server.py
```

## Configuration

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "python",
      "args": [
        "/absolute/path/to/n8n-mcp/server.py"
      ],
      "env": {
        "N8N_API_URL": "http://localhost:5678/api/v1",
        "N8N_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Environment Variables

- `N8N_API_URL` - n8n API base URL (default: `http://localhost:5678/api/v1`)
- `N8N_API_KEY` - n8n API key for authentication

## Usage Examples

### Workflow Operations

#### List Workflows
```python
# List all workflows
workflows = n8n_list_workflows()

# List only active workflows
active_workflows = n8n_list_workflows(active=True)

# Filter by tags
tagged_workflows = n8n_list_workflows(tags=["production", "critical"])
```

#### Create Workflow
```python
# Define workflow nodes
nodes = [
    {
        "name": "Start",
        "type": "n8n-nodes-base.start",
        "position": [250, 300],
        "parameters": {}
    },
    {
        "name": "HTTP Request",
        "type": "n8n-nodes-base.httpRequest",
        "position": [450, 300],
        "parameters": {
            "url": "https://api.example.com/data",
            "method": "GET"
        }
    }
]

# Define connections
connections = {
    "Start": {
        "main": [
            [
                {
                    "node": "HTTP Request",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
}

# Create workflow
result = n8n_create_workflow(
    name="API Data Fetcher",
    nodes=nodes,
    connections=connections,
    active=True,
    tags=["api", "automation"]
)
```

#### Update Workflow
```python
# Update workflow name and activation status
n8n_update_workflow(
    workflow_id="123",
    name="Updated API Fetcher",
    active=True
)

# Update only nodes
n8n_update_workflow(
    workflow_id="123",
    nodes=updated_nodes,
    connections=updated_connections
)
```

#### Activate/Deactivate Workflow
```python
# Activate workflow
n8n_activate_workflow(workflow_id="123", active=True)

# Deactivate workflow
n8n_activate_workflow(workflow_id="123", active=False)
```

### Execution Operations

#### Execute Workflow
```python
# Execute with input data
result = n8n_execute_workflow(
    workflow_id="123",
    data={
        "customerId": "12345",
        "action": "process"
    }
)

# Check execution result
if result['success']:
    print(f"Execution ID: {result['execution_id']}")
    print(f"Status: {result['finished']}")
```

#### Monitor Executions
```python
# List all executions
executions = n8n_list_executions(limit=50)

# Filter by workflow
workflow_executions = n8n_list_executions(
    workflow_id="123",
    limit=20
)

# Filter by status
failed_executions = n8n_list_executions(
    status="error",
    limit=10
)

# Get detailed execution data
execution = n8n_get_execution(execution_id="456")
print(f"Execution data: {execution['execution']['data']}")
```

### Credential Management

#### List Credentials
```python
# List all credentials (without sensitive data)
credentials = n8n_list_credentials()

for cred in credentials['credentials']:
    print(f"{cred['name']} ({cred['type']})")
```

#### Create Credential
```python
# Create HTTP header authentication
credential = n8n_create_credential(
    name="API Key Auth",
    credential_type="httpHeaderAuth",
    data={
        "name": "X-API-Key",
        "value": "your-api-key"
    }
)

# Create OAuth2 credential
oauth_cred = n8n_create_credential(
    name="Google OAuth",
    credential_type="oAuth2Api",
    data={
        "clientId": "your-client-id",
        "clientSecret": "your-client-secret",
        "authUrl": "https://accounts.google.com/o/oauth2/auth",
        "accessTokenUrl": "https://accounts.google.com/o/oauth2/token",
        "scope": "https://www.googleapis.com/auth/drive"
    }
)
```

### Webhook Operations

```python
# Get webhook URLs for a workflow
webhook_info = n8n_get_webhook_url(
    workflow_id="123",
    webhook_path="customer-webhook"
)

print(f"Production URL: {webhook_info['production_url']}")
print(f"Test URL: {webhook_info['test_url']}")
```

### Health Monitoring

```python
# Check n8n instance health
health = n8n_health_check()

if health['success']:
    print(f"n8n is {health['status']}")
else:
    print(f"n8n health check failed: {health['error']}")
```

## Security Best Practices

### 1. API Key Security
- Store API keys in environment variables or secret management systems
- Never commit API keys to version control
- Rotate API keys regularly
- Use separate API keys for different environments

### 2. Workflow Security
- Review workflows before activation
- Implement proper error handling in workflows
- Use credentials for external service authentication
- Validate webhook inputs

### 3. Credential Management
- Use n8n's built-in credential encryption
- Implement credential rotation policies
- Audit credential usage regularly
- Restrict access to sensitive credentials

### 4. Network Security
- Use HTTPS for n8n API communication
- Implement firewall rules to restrict API access
- Use VPN or private networks for production deployments
- Enable rate limiting

### 5. Access Control
- Implement role-based access control (RBAC)
- Use separate n8n instances for different teams/projects
- Audit workflow executions
- Monitor API usage

## Advanced Features

### Workflow Templates

Create reusable workflow templates:

```python
def create_api_polling_workflow(name, api_url, interval_minutes=5):
    """Template for API polling workflows"""
    nodes = [
        {
            "name": "Schedule",
            "type": "n8n-nodes-base.scheduleTrigger",
            "position": [250, 300],
            "parameters": {
                "rule": {
                    "interval": [{"field": "minutes", "minutesInterval": interval_minutes}]
                }
            }
        },
        {
            "name": "HTTP Request",
            "type": "n8n-nodes-base.httpRequest",
            "position": [450, 300],
            "parameters": {
                "url": api_url,
                "method": "GET"
            }
        },
        {
            "name": "Set",
            "type": "n8n-nodes-base.set",
            "position": [650, 300],
            "parameters": {
                "values": {
                    "string": [
                        {
                            "name": "timestamp",
                            "value": "={{$now.toISO()}}"
                        }
                    ]
                }
            }
        }
    ]

    connections = {
        "Schedule": {"main": [[{"node": "HTTP Request", "type": "main", "index": 0}]]},
        "HTTP Request": {"main": [[{"node": "Set", "type": "main", "index": 0}]]}
    }

    return n8n_create_workflow(
        name=name,
        nodes=nodes,
        connections=connections,
        active=False
    )

# Use template
workflow = create_api_polling_workflow(
    name="Poll Customer API",
    api_url="https://api.example.com/customers",
    interval_minutes=10
)
```

### Execution Monitoring

```python
def monitor_workflow_health(workflow_id, hours=24):
    """Monitor workflow execution health"""
    executions = n8n_list_executions(
        workflow_id=workflow_id,
        limit=100
    )

    total = len(executions['executions'])
    failed = sum(1 for e in executions['executions'] if e['status'] == 'error')
    success_rate = ((total - failed) / total * 100) if total > 0 else 0

    return {
        "workflow_id": workflow_id,
        "total_executions": total,
        "failed_executions": failed,
        "success_rate": f"{success_rate:.2f}%"
    }
```

### Batch Operations

```python
def bulk_activate_workflows(tag):
    """Activate all workflows with a specific tag"""
    workflows = n8n_list_workflows(tags=[tag])

    results = []
    for wf in workflows['workflows']:
        if not wf['active']:
            result = n8n_activate_workflow(wf['id'], active=True)
            results.append(result)

    return results
```

## Error Handling

All tools return structured error responses:

```python
result = n8n_execute_workflow(workflow_id="123")

if not result['success']:
    print(f"Error: {result['error']}")
    if 'status_code' in result:
        print(f"Status: {result['status_code']}")
    if 'details' in result:
        print(f"Details: {result['details']}")
```

## Limitations

- API key required for all operations
- Rate limiting depends on n8n instance configuration
- Large workflow executions may timeout
- Webhook testing requires active n8n instance

## Troubleshooting

### Connection Issues

```bash
# Test n8n API connectivity
curl -H "X-N8N-API-KEY: your-key" http://localhost:5678/api/v1/workflows
```

### API Key Problems

```python
# Verify API key is set
health = n8n_health_check()
print(f"Authenticated: {health['authenticated']}")
```

### Workflow Execution Failures

```python
# Check execution logs
execution = n8n_get_execution(execution_id="456")
if execution['execution']['status'] == 'error':
    print(f"Error details: {execution['execution']['data']}")
```

## Performance Optimization

### Caching Workflow Data

```python
import functools
from datetime import datetime, timedelta

@functools.lru_cache(maxsize=100)
def get_cached_workflow(workflow_id):
    """Cache workflow data for 5 minutes"""
    return n8n_get_workflow(workflow_id)
```

### Batch Execution Queries

```python
# Query executions in batches
def get_all_recent_executions(workflow_id, hours=24):
    all_executions = []
    limit = 100
    offset = 0

    while True:
        batch = n8n_list_executions(
            workflow_id=workflow_id,
            limit=limit
        )

        if not batch['executions']:
            break

        all_executions.extend(batch['executions'])

        if len(batch['executions']) < limit:
            break

    return all_executions
```

## Integration Examples

### With Slack

```python
# Create Slack notification workflow
def create_slack_notifier(webhook_url, channel):
    nodes = [
        {
            "name": "Webhook",
            "type": "n8n-nodes-base.webhook",
            "position": [250, 300],
            "parameters": {"path": "notify"}
        },
        {
            "name": "Slack",
            "type": "n8n-nodes-base.slack",
            "position": [450, 300],
            "parameters": {
                "webhookUrl": webhook_url,
                "channel": channel,
                "text": "={{$json.message}}"
            }
        }
    ]

    # ... rest of workflow definition
```

### With Database

```python
# Create database sync workflow
def create_db_sync_workflow(db_credentials_id):
    # Define nodes with database operations
    # ...
```

## Contributing

Contributions welcome! Please ensure:
- All new tools include comprehensive docstrings
- Error handling is implemented
- Security best practices are followed
- Examples are provided

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Your Repository]
- n8n Documentation: https://docs.n8n.io/
- n8n Community: https://community.n8n.io/

## Resources

- [n8n API Documentation](https://docs.n8n.io/api/)
- [n8n Workflow Examples](https://n8n.io/workflows)
- [FastMCP Documentation](https://github.com/jlowin/fastmcp)
