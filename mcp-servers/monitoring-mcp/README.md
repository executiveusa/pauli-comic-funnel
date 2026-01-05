# Monitoring MCP Server

Combined monitoring solution providing Grafana and Prometheus integration through the Model Context Protocol (MCP).

## Features

### Grafana Integration
- **Query Metrics**: Retrieve metrics from dashboards and panels
- **Dashboard Management**: Create and list dashboards
- **Alert Management**: Create and configure alert rules
- **Dashboard Discovery**: Search and filter dashboards by tags

### Prometheus Integration
- **PromQL Queries**: Execute instant and range queries
- **Metrics Discovery**: List all available metrics
- **Target Monitoring**: Check scrape target health
- **Time Series Data**: Query historical metrics data

### Health & Utilities
- **Health Checks**: Monitor service availability
- **Data Export**: Backup configurations and metrics

## Installation

```bash
# Using uv (recommended)
uv pip install -e .

# Or using pip
pip install -e .
```

## Configuration

Set the following environment variables:

```bash
# Grafana Configuration
export GRAFANA_URL="http://localhost:3000"
export GRAFANA_API_KEY="your-grafana-api-key"

# Prometheus Configuration
export PROMETHEUS_URL="http://localhost:9090"
```

### Creating a Grafana API Key

1. Log into Grafana
2. Navigate to Configuration → API Keys
3. Click "New API Key"
4. Set role to "Editor" or "Admin"
5. Copy the generated key

## Usage

### Stdio Mode (Default)

```bash
monitoring-mcp
```

### SSE Mode (HTTP Server)

```bash
monitoring-mcp --transport sse --host 0.0.0.0 --port 8081
```

## Available Tools

### Grafana Tools

#### `grafana_query_metrics`
Query metrics from a Grafana dashboard.

**Parameters:**
- `dashboard_uid` (required): Dashboard unique identifier
- `panel_id` (optional): Specific panel to query
- `time_range` (optional): Time range (default: "1h")

**Example:**
```json
{
  "dashboard_uid": "abc123",
  "panel_id": 2,
  "time_range": "24h"
}
```

#### `grafana_create_dashboard`
Create a new Grafana dashboard.

**Parameters:**
- `title` (required): Dashboard title
- `tags` (optional): List of tags
- `folder_id` (optional): Folder ID (default: 0 for General)

#### `grafana_create_alert`
Create an alert rule for a dashboard panel.

**Parameters:**
- `dashboard_uid` (required): Dashboard UID
- `panel_id` (required): Panel ID
- `alert_name` (required): Alert name
- `condition` (required): Alert condition (e.g., "avg() > 80")
- `frequency` (optional): Evaluation frequency (default: "1m")
- `notification_channel_id` (optional): Notification channel

#### `grafana_list_dashboards`
List all dashboards, optionally filtered by tag.

**Parameters:**
- `tag` (optional): Filter by tag
- `limit` (optional): Max results (default: 100)

### Prometheus Tools

#### `prometheus_query`
Execute an instant PromQL query.

**Parameters:**
- `query` (required): PromQL expression
- `time` (optional): Evaluation timestamp

**Example:**
```json
{
  "query": "up{job=\"prometheus\"}"
}
```

#### `prometheus_query_range`
Execute a range PromQL query over time.

**Parameters:**
- `query` (required): PromQL expression
- `start` (required): Start timestamp
- `end` (required): End timestamp
- `step` (optional): Resolution step (default: "15s")

**Example:**
```json
{
  "query": "rate(http_requests_total[5m])",
  "start": "2024-01-01T00:00:00Z",
  "end": "2024-01-01T01:00:00Z",
  "step": "1m"
}
```

#### `prometheus_list_metrics`
List all available metrics in Prometheus.

**Parameters:** None

#### `prometheus_get_targets`
Get status of all Prometheus scrape targets.

**Parameters:** None

### Utility Tools

#### `monitoring_health_check`
Check health status of both Grafana and Prometheus.

**Parameters:** None

#### `monitoring_export_data`
Export monitoring data for backup or analysis.

**Parameters:**
- `source` (required): "grafana" or "prometheus"
- `export_type` (required): Type of data to export
- `parameters` (optional): Additional export parameters

## Common Use Cases

### Monitor System Metrics

```json
{
  "query": "node_cpu_seconds_total"
}
```

### Check Application Health

```json
{
  "query": "up{job=\"myapp\"}"
}
```

### Query Error Rate

```json
{
  "query": "rate(http_requests_total{status=~\"5..\"}[5m])",
  "start": "2024-01-01T00:00:00Z",
  "end": "2024-01-01T01:00:00Z",
  "step": "1m"
}
```

### Create Dashboard

```json
{
  "title": "Application Monitoring",
  "tags": ["production", "api"]
}
```

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black .
isort .
```

### Type Checking

```bash
mypy .
```

## Integration with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "monitoring": {
      "command": "monitoring-mcp",
      "env": {
        "GRAFANA_URL": "http://localhost:3000",
        "GRAFANA_API_KEY": "your-api-key",
        "PROMETHEUS_URL": "http://localhost:9090"
      }
    }
  }
}
```

## Troubleshooting

### Connection Issues

Verify services are reachable:
```bash
curl http://localhost:3000/api/health  # Grafana
curl http://localhost:9090/-/healthy   # Prometheus
```

### Authentication Errors

Ensure your Grafana API key has sufficient permissions:
- Editor role for creating dashboards
- Admin role for alert management

### Network Timeouts

Adjust timeout settings in the code or check network connectivity to your monitoring services.

## License

MIT

## Contributing

Contributions welcome! Please submit pull requests or open issues for bugs and feature requests.
