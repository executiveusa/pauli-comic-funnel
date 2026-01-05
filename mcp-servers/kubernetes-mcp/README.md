# Kubernetes MCP Server

Container orchestration management through Model Context Protocol using Kubernetes Python client.

## Overview

This MCP server provides comprehensive Kubernetes operations including:
- Pod and deployment management
- Service creation and management
- ConfigMap and Secret operations
- Log aggregation and monitoring
- Resource scaling and updates
- Node health monitoring

## Features

### Pod Management
- **k8s_list_pods** - List pods with filtering options
- **k8s_get_pod_logs** - Retrieve pod logs
- **k8s_execute_command** - Execute commands in pods

### Deployment Operations
- **k8s_create_deployment** - Create new deployments
- **k8s_scale_deployment** - Scale deployments up or down
- **k8s_delete_deployment** - Remove deployments

### Service Management
- **k8s_list_services** - List services in namespace
- **k8s_create_service** - Create new services

### Configuration Management
- **k8s_get_configmap** - Retrieve ConfigMap data
- **k8s_create_configmap** - Create ConfigMaps
- **k8s_get_secret** - Retrieve Secret data (use with caution)

### Cluster Operations
- **k8s_list_namespaces** - List all namespaces
- **k8s_get_node_status** - Get cluster node health and capacity

## Installation

### Prerequisites
- Python 3.8 or higher
- Kubernetes cluster access
- Valid kubeconfig file
- FastMCP framework

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure kubectl access:
```bash
# Verify cluster access
kubectl cluster-info
kubectl get nodes
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
    "kubernetes": {
      "command": "python",
      "args": [
        "/absolute/path/to/kubernetes-mcp/server.py"
      ],
      "env": {
        "KUBECONFIG": "/path/to/.kube/config"
      }
    }
  }
}
```

### Environment Variables

- `KUBECONFIG` - Path to kubeconfig file (default: `~/.kube/config`)

### In-Cluster Configuration

When running inside a Kubernetes pod, the server automatically uses in-cluster configuration.

## Usage Examples

### Pod Operations
```python
# List all pods in default namespace
pods = k8s_list_pods()

# List pods with label selector
pods = k8s_list_pods(
    namespace="production",
    label_selector="app=web,tier=frontend"
)

# Get pod logs
logs = k8s_get_pod_logs(
    pod_name="web-server-abc123",
    namespace="default",
    tail_lines=100
)

# Execute command in pod
result = k8s_execute_command(
    pod_name="web-server-abc123",
    command=["ls", "-la", "/app"],
    namespace="default"
)
```

### Deployment Management
```python
# Create deployment
deployment = k8s_create_deployment(
    name="nginx-web",
    image="nginx:latest",
    replicas=3,
    port=80,
    env_vars={"ENV": "production"},
    labels={"app": "nginx", "tier": "frontend"}
)

# Scale deployment
k8s_scale_deployment(
    name="nginx-web",
    replicas=5,
    namespace="default"
)

# Delete deployment
k8s_delete_deployment(
    name="nginx-web",
    namespace="default"
)
```

### Service Management
```python
# List services
services = k8s_list_services(namespace="default")

# Create service
service = k8s_create_service(
    name="nginx-service",
    port=80,
    target_port=8080,
    service_type="LoadBalancer",
    selector={"app": "nginx"}
)
```

### Configuration Management
```python
# Create ConfigMap
configmap = k8s_create_configmap(
    name="app-config",
    data={
        "database_url": "postgresql://localhost:5432/mydb",
        "api_key": "placeholder"
    },
    namespace="default"
)

# Get ConfigMap
config = k8s_get_configmap(
    name="app-config",
    namespace="default"
)

# Get Secret (decoded)
secret = k8s_get_secret(
    name="api-credentials",
    namespace="default",
    decode=True
)
```

### Cluster Monitoring
```python
# List all namespaces
namespaces = k8s_list_namespaces()

# Get node status
nodes = k8s_get_node_status()
for node in nodes['nodes']:
    print(f"Node: {node['name']}, Ready: {node['ready']}")
    print(f"CPU: {node['capacity']['cpu']}, Memory: {node['capacity']['memory']}")
```

## Security Best Practices

### 1. RBAC (Role-Based Access Control)
- Create service accounts with minimal required permissions
- Use namespace-scoped roles instead of cluster-wide roles
- Regularly audit RBAC permissions

Example RBAC configuration:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: mcp-server
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: mcp-server-role
  namespace: default
rules:
- apiGroups: ["", "apps"]
  resources: ["pods", "deployments", "services", "configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: mcp-server-binding
  namespace: default
subjects:
- kind: ServiceAccount
  name: mcp-server
roleRef:
  kind: Role
  name: mcp-server-role
  apiGroup: rbac.authorization.k8s.io
```

### 2. Secret Management
- Never log or expose Secret values
- Use external secret management systems (e.g., HashiCorp Vault, AWS Secrets Manager)
- Rotate secrets regularly
- Enable encryption at rest for etcd

### 3. Network Policies
- Implement network policies to restrict pod-to-pod communication
- Use namespaces for logical isolation
- Apply principle of least privilege

### 4. Pod Security
- Use Pod Security Standards (restricted profile recommended)
- Avoid running containers as root
- Use read-only root filesystems where possible
- Set resource limits and requests

### 5. Audit Logging
- Enable Kubernetes audit logging
- Monitor API server access
- Alert on suspicious activities

## Advanced Features

### Label Selectors
Filter resources using Kubernetes label selectors:
```python
# AND condition
pods = k8s_list_pods(label_selector="app=nginx,env=production")

# Set-based selection
pods = k8s_list_pods(label_selector="env in (production, staging)")
```

### Field Selectors
Filter by object fields:
```python
# Only running pods
pods = k8s_list_pods(field_selector="status.phase=Running")

# Specific pod IP
pods = k8s_list_pods(field_selector="status.podIP=10.0.0.5")
```

### Resource Monitoring
```python
# Get comprehensive pod status
result = k8s_list_pods(namespace="production")
for pod in result['pods']:
    print(f"Pod: {pod['name']}")
    print(f"Status: {pod['status']}")
    print(f"Node: {pod['node']}")
    for container in pod['containers']:
        print(f"  Container: {container['name']}, Ready: {container['ready']}")
```

## Error Handling

All tools return structured error responses:

```python
result = k8s_create_deployment(...)
if not result['success']:
    print(f"Error: {result['error']}")
    print(f"Status: {result.get('status_code')}")
    print(f"Reason: {result.get('reason')}")
```

## Limitations

- No support for streaming logs (MCP limitation)
- No interactive terminal access
- Large log outputs may be truncated
- Watch operations not supported (use polling instead)

## Troubleshooting

### Authentication Issues
```bash
# Verify kubeconfig
kubectl config view

# Test cluster access
kubectl get nodes
kubectl get pods --all-namespaces
```

### Permission Denied
```bash
# Check current context
kubectl config current-context

# Verify RBAC permissions
kubectl auth can-i list pods --namespace=default
```

### Connection Refused
```bash
# Check cluster endpoint
kubectl cluster-info

# Verify API server is accessible
curl -k https://your-cluster-endpoint:6443
```

## Multi-Cluster Support

To manage multiple clusters, switch context:
```python
# List available contexts
from kubernetes import config
contexts, active_context = config.list_kube_config_contexts()

# Change context (requires server restart)
os.environ['KUBECONFIG'] = '/path/to/other/kubeconfig'
```

## Performance Considerations

- Use label selectors to filter resources
- Limit log tail lines for large pods
- Consider pagination for large result sets
- Cache namespace and node information

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
- Kubernetes Documentation: https://kubernetes.io/docs/
- Python Client: https://github.com/kubernetes-client/python
