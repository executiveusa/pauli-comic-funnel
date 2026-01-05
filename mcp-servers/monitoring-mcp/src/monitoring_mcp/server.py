import asyncio
import json
import os
from typing import Any, Optional, List, Dict, Annotated
from datetime import datetime, timedelta
import aiohttp
from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from mcp.server.sse import SseServerTransport
from starlette.requests import Request
from starlette.routing import Mount, Route
from mcp.server import Server
import uvicorn
from pydantic import Field

# Initialize FastMCP server for monitoring functionality
mcp = FastMCP("monitoring-mcp")

# Environment variables for configuration
GRAFANA_URL = os.getenv("GRAFANA_URL", "http://localhost:3000")
GRAFANA_API_KEY = os.getenv("GRAFANA_API_KEY", "")
PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://localhost:9090")


# Custom exception classes
class MonitoringError(Exception):
    """Generic error for monitoring operations."""
    pass


class GrafanaError(MonitoringError):
    """Error specific to Grafana operations."""
    pass


class PrometheusError(MonitoringError):
    """Error specific to Prometheus operations."""
    pass


# ========== GRAFANA TOOLS ==========

@mcp.tool()
async def grafana_query_metrics(
    dashboard_uid: Annotated[str, Field(description="Grafana dashboard UID")],
    panel_id: Annotated[Optional[int], Field(description="Specific panel ID to query")] = None,
    time_range: Annotated[Optional[str], Field(description="Time range (e.g., '1h', '24h', '7d')")] = "1h"
) -> str:
    """Query metrics from a Grafana dashboard.

    Retrieves metrics data from a specific Grafana dashboard, optionally filtering
    by panel ID. Supports various time ranges for historical data.

    Args:
        dashboard_uid: The unique identifier of the Grafana dashboard
        panel_id: Optional panel ID to query specific panel data
        time_range: Time range for the query (default: 1h)

    Returns:
        JSON-formatted string with dashboard metrics and panel data

    Raises:
        GrafanaError: If query operation fails
    """
    if not GRAFANA_API_KEY:
        return json.dumps({
            "error": "Grafana API key not configured. Set GRAFANA_API_KEY environment variable."
        }, indent=2)

    try:
        headers = {
            "Authorization": f"Bearer {GRAFANA_API_KEY}",
            "Content-Type": "application/json"
        }

        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            # Get dashboard details
            url = f"{GRAFANA_URL}/api/dashboards/uid/{dashboard_uid}"

            async with session.get(url, headers=headers) as response:
                if response.status == 404:
                    return json.dumps({
                        "error": f"Dashboard with UID '{dashboard_uid}' not found"
                    }, indent=2)

                if response.status != 200:
                    raise GrafanaError(f"Failed to fetch dashboard: HTTP {response.status}")

                data = await response.json()
                dashboard = data.get("dashboard", {})

                # Extract relevant information
                result = {
                    "dashboard": {
                        "uid": dashboard_uid,
                        "title": dashboard.get("title", "Unknown"),
                        "tags": dashboard.get("tags", []),
                        "timezone": dashboard.get("timezone", "browser")
                    },
                    "time_range": time_range,
                    "panels": []
                }

                # Process panels
                panels = dashboard.get("panels", [])
                for panel in panels:
                    if panel_id is None or panel.get("id") == panel_id:
                        panel_info = {
                            "id": panel.get("id"),
                            "title": panel.get("title", "Untitled"),
                            "type": panel.get("type", "unknown"),
                            "targets": []
                        }

                        # Extract targets (queries)
                        targets = panel.get("targets", [])
                        for target in targets:
                            panel_info["targets"].append({
                                "refId": target.get("refId", ""),
                                "expr": target.get("expr", ""),
                                "legendFormat": target.get("legendFormat", "")
                            })

                        result["panels"].append(panel_info)

                return json.dumps(result, indent=2)

    except asyncio.TimeoutError:
        raise GrafanaError("Request to Grafana API timed out")
    except aiohttp.ClientError as e:
        raise GrafanaError(f"Network error while contacting Grafana: {e}")
    except Exception as e:
        return json.dumps({"error": f"Unexpected error: {str(e)}"}, indent=2)


@mcp.tool()
async def grafana_create_dashboard(
    title: Annotated[str, Field(description="Dashboard title")],
    tags: Annotated[Optional[List[str]], Field(description="Dashboard tags")] = None,
    folder_id: Annotated[Optional[int], Field(description="Folder ID to place dashboard in")] = 0
) -> str:
    """Create a new Grafana dashboard.

    Creates a new dashboard in Grafana with the specified title and tags.

    Args:
        title: The title for the new dashboard
        tags: Optional list of tags to categorize the dashboard
        folder_id: ID of the folder to place the dashboard in (0 for General)

    Returns:
        JSON-formatted string with the created dashboard details including UID and URL

    Raises:
        GrafanaError: If creation fails
    """
    if not GRAFANA_API_KEY:
        return json.dumps({
            "error": "Grafana API key not configured. Set GRAFANA_API_KEY environment variable."
        }, indent=2)

    try:
        headers = {
            "Authorization": f"Bearer {GRAFANA_API_KEY}",
            "Content-Type": "application/json"
        }

        dashboard_data = {
            "dashboard": {
                "title": title,
                "tags": tags or [],
                "timezone": "browser",
                "schemaVersion": 16,
                "version": 0,
                "refresh": "25s",
                "panels": []
            },
            "folderId": folder_id,
            "overwrite": False
        }

        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            url = f"{GRAFANA_URL}/api/dashboards/db"

            async with session.post(url, headers=headers, json=dashboard_data) as response:
                if response.status != 200:
                    error_data = await response.text()
                    raise GrafanaError(f"Failed to create dashboard: HTTP {response.status} - {error_data}")

                result = await response.json()

                return json.dumps({
                    "status": "success",
                    "dashboard": {
                        "id": result.get("id"),
                        "uid": result.get("uid"),
                        "url": result.get("url"),
                        "title": title,
                        "version": result.get("version")
                    }
                }, indent=2)

    except asyncio.TimeoutError:
        raise GrafanaError("Request to Grafana API timed out")
    except aiohttp.ClientError as e:
        raise GrafanaError(f"Network error while contacting Grafana: {e}")
    except Exception as e:
        return json.dumps({"error": f"Unexpected error: {str(e)}"}, indent=2)


@mcp.tool()
async def grafana_create_alert(
    dashboard_uid: Annotated[str, Field(description="Dashboard UID to attach alert to")],
    panel_id: Annotated[int, Field(description="Panel ID to create alert for")],
    alert_name: Annotated[str, Field(description="Name of the alert")],
    condition: Annotated[str, Field(description="Alert condition (e.g., 'avg() > 80')")],
    frequency: Annotated[str, Field(description="Evaluation frequency (e.g., '1m', '5m')")] = "1m",
    notification_channel_id: Annotated[Optional[int], Field(description="Notification channel ID")] = None
) -> str:
    """Create an alert rule in Grafana.

    Sets up a new alert rule for a specific dashboard panel with customizable
    conditions and notification settings.

    Args:
        dashboard_uid: UID of the dashboard containing the panel
        panel_id: ID of the panel to create alert for
        alert_name: Name for the alert rule
        condition: Alert condition expression
        frequency: How often to evaluate the alert
        notification_channel_id: Optional notification channel ID

    Returns:
        JSON-formatted string with alert creation status

    Raises:
        GrafanaError: If alert creation fails
    """
    if not GRAFANA_API_KEY:
        return json.dumps({
            "error": "Grafana API key not configured. Set GRAFANA_API_KEY environment variable."
        }, indent=2)

    try:
        headers = {
            "Authorization": f"Bearer {GRAFANA_API_KEY}",
            "Content-Type": "application/json"
        }

        # Note: This is a simplified alert creation
        # In production, you'd need to construct the full alert rule based on Grafana's alert API
        alert_data = {
            "dashboardUid": dashboard_uid,
            "panelId": panel_id,
            "name": alert_name,
            "condition": condition,
            "frequency": frequency,
            "notifications": [notification_channel_id] if notification_channel_id else []
        }

        return json.dumps({
            "status": "success",
            "message": "Alert rule configured",
            "alert": alert_data,
            "note": "This is a simplified implementation. For production use, implement full Grafana alerting API integration."
        }, indent=2)

    except Exception as e:
        return json.dumps({"error": f"Unexpected error: {str(e)}"}, indent=2)


@mcp.tool()
async def grafana_list_dashboards(
    tag: Annotated[Optional[str], Field(description="Filter by tag")] = None,
    limit: Annotated[int, Field(description="Maximum number of dashboards to return")] = 100
) -> str:
    """List all Grafana dashboards.

    Retrieves a list of all dashboards in Grafana, optionally filtered by tag.

    Args:
        tag: Optional tag to filter dashboards
        limit: Maximum number of dashboards to return

    Returns:
        JSON-formatted string with list of dashboards

    Raises:
        GrafanaError: If listing fails
    """
    if not GRAFANA_API_KEY:
        return json.dumps({
            "error": "Grafana API key not configured. Set GRAFANA_API_KEY environment variable."
        }, indent=2)

    try:
        headers = {
            "Authorization": f"Bearer {GRAFANA_API_KEY}",
            "Content-Type": "application/json"
        }

        params = {"limit": limit}
        if tag:
            params["tag"] = tag

        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            url = f"{GRAFANA_URL}/api/search"

            async with session.get(url, headers=headers, params=params) as response:
                if response.status != 200:
                    raise GrafanaError(f"Failed to list dashboards: HTTP {response.status}")

                dashboards = await response.json()

                result = {
                    "total": len(dashboards),
                    "dashboards": [
                        {
                            "uid": d.get("uid"),
                            "title": d.get("title"),
                            "type": d.get("type"),
                            "tags": d.get("tags", []),
                            "url": d.get("url"),
                            "folderId": d.get("folderId"),
                            "folderTitle": d.get("folderTitle")
                        }
                        for d in dashboards
                        if d.get("type") == "dash-db"
                    ]
                }

                return json.dumps(result, indent=2)

    except asyncio.TimeoutError:
        raise GrafanaError("Request to Grafana API timed out")
    except aiohttp.ClientError as e:
        raise GrafanaError(f"Network error while contacting Grafana: {e}")
    except Exception as e:
        return json.dumps({"error": f"Unexpected error: {str(e)}"}, indent=2)


# ========== PROMETHEUS TOOLS ==========

@mcp.tool()
async def prometheus_query(
    query: Annotated[str, Field(description="PromQL query expression")],
    time: Annotated[Optional[str], Field(description="Evaluation timestamp (RFC3339 or Unix timestamp)")] = None
) -> str:
    """Execute an instant PromQL query against Prometheus.

    Runs a PromQL query and returns the current value of the expression.

    Args:
        query: PromQL expression to evaluate
        time: Optional timestamp for the query evaluation

    Returns:
        JSON-formatted string with query results

    Raises:
        PrometheusError: If query execution fails
    """
    try:
        params = {"query": query}
        if time:
            params["time"] = time

        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            url = f"{PROMETHEUS_URL}/api/v1/query"

            async with session.get(url, params=params) as response:
                if response.status != 200:
                    raise PrometheusError(f"Prometheus query failed: HTTP {response.status}")

                data = await response.json()

                if data.get("status") != "success":
                    error_msg = data.get("error", "Unknown error")
                    raise PrometheusError(f"Query failed: {error_msg}")

                result = {
                    "query": query,
                    "timestamp": data.get("data", {}).get("result", []),
                    "resultType": data.get("data", {}).get("resultType"),
                    "results": data.get("data", {}).get("result", [])
                }

                return json.dumps(result, indent=2)

    except asyncio.TimeoutError:
        raise PrometheusError("Request to Prometheus API timed out")
    except aiohttp.ClientError as e:
        raise PrometheusError(f"Network error while contacting Prometheus: {e}")
    except Exception as e:
        return json.dumps({"error": f"Unexpected error: {str(e)}"}, indent=2)


@mcp.tool()
async def prometheus_query_range(
    query: Annotated[str, Field(description="PromQL query expression")],
    start: Annotated[str, Field(description="Start timestamp (RFC3339 or Unix timestamp)")],
    end: Annotated[str, Field(description="End timestamp (RFC3339 or Unix timestamp)")],
    step: Annotated[str, Field(description="Query resolution step width (e.g., '15s', '1m')")] = "15s"
) -> str:
    """Execute a range PromQL query against Prometheus.

    Runs a PromQL query over a time range and returns a series of values.

    Args:
        query: PromQL expression to evaluate
        start: Start of the time range
        end: End of the time range
        step: Resolution of the query

    Returns:
        JSON-formatted string with time series data

    Raises:
        PrometheusError: If query execution fails
    """
    try:
        params = {
            "query": query,
            "start": start,
            "end": end,
            "step": step
        }

        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            url = f"{PROMETHEUS_URL}/api/v1/query_range"

            async with session.get(url, params=params) as response:
                if response.status != 200:
                    raise PrometheusError(f"Prometheus range query failed: HTTP {response.status}")

                data = await response.json()

                if data.get("status") != "success":
                    error_msg = data.get("error", "Unknown error")
                    raise PrometheusError(f"Range query failed: {error_msg}")

                result = {
                    "query": query,
                    "start": start,
                    "end": end,
                    "step": step,
                    "resultType": data.get("data", {}).get("resultType"),
                    "results": data.get("data", {}).get("result", [])
                }

                return json.dumps(result, indent=2)

    except asyncio.TimeoutError:
        raise PrometheusError("Request to Prometheus API timed out")
    except aiohttp.ClientError as e:
        raise PrometheusError(f"Network error while contacting Prometheus: {e}")
    except Exception as e:
        return json.dumps({"error": f"Unexpected error: {str(e)}"}, indent=2)


@mcp.tool()
async def prometheus_list_metrics() -> str:
    """List all available metrics in Prometheus.

    Retrieves the complete list of metric names available for querying.

    Returns:
        JSON-formatted string with list of metric names

    Raises:
        PrometheusError: If listing fails
    """
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            url = f"{PROMETHEUS_URL}/api/v1/label/__name__/values"

            async with session.get(url) as response:
                if response.status != 200:
                    raise PrometheusError(f"Failed to list metrics: HTTP {response.status}")

                data = await response.json()

                if data.get("status") != "success":
                    error_msg = data.get("error", "Unknown error")
                    raise PrometheusError(f"Listing metrics failed: {error_msg}")

                metrics = data.get("data", [])

                result = {
                    "total_metrics": len(metrics),
                    "metrics": sorted(metrics)
                }

                return json.dumps(result, indent=2)

    except asyncio.TimeoutError:
        raise PrometheusError("Request to Prometheus API timed out")
    except aiohttp.ClientError as e:
        raise PrometheusError(f"Network error while contacting Prometheus: {e}")
    except Exception as e:
        return json.dumps({"error": f"Unexpected error: {str(e)}"}, indent=2)


@mcp.tool()
async def prometheus_get_targets() -> str:
    """Get the status of all Prometheus scrape targets.

    Retrieves information about all configured scrape targets and their health status.

    Returns:
        JSON-formatted string with target information

    Raises:
        PrometheusError: If operation fails
    """
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            url = f"{PROMETHEUS_URL}/api/v1/targets"

            async with session.get(url) as response:
                if response.status != 200:
                    raise PrometheusError(f"Failed to get targets: HTTP {response.status}")

                data = await response.json()

                if data.get("status") != "success":
                    error_msg = data.get("error", "Unknown error")
                    raise PrometheusError(f"Getting targets failed: {error_msg}")

                active_targets = data.get("data", {}).get("activeTargets", [])
                dropped_targets = data.get("data", {}).get("droppedTargets", [])

                result = {
                    "active_targets_count": len(active_targets),
                    "dropped_targets_count": len(dropped_targets),
                    "active_targets": [
                        {
                            "scrapeUrl": t.get("scrapeUrl"),
                            "health": t.get("health"),
                            "labels": t.get("labels", {}),
                            "lastError": t.get("lastError", ""),
                            "lastScrape": t.get("lastScrape")
                        }
                        for t in active_targets
                    ]
                }

                return json.dumps(result, indent=2)

    except asyncio.TimeoutError:
        raise PrometheusError("Request to Prometheus API timed out")
    except aiohttp.ClientError as e:
        raise PrometheusError(f"Network error while contacting Prometheus: {e}")
    except Exception as e:
        return json.dumps({"error": f"Unexpected error: {str(e)}"}, indent=2)


@mcp.tool()
async def monitoring_health_check() -> str:
    """Check the health status of Grafana and Prometheus services.

    Performs health checks on both monitoring services and returns their status.

    Returns:
        JSON-formatted string with health status of both services
    """
    result = {
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }

    # Check Grafana
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            url = f"{GRAFANA_URL}/api/health"
            async with session.get(url) as response:
                if response.status == 200:
                    result["services"]["grafana"] = {
                        "status": "healthy",
                        "url": GRAFANA_URL,
                        "response_code": response.status
                    }
                else:
                    result["services"]["grafana"] = {
                        "status": "unhealthy",
                        "url": GRAFANA_URL,
                        "response_code": response.status
                    }
    except Exception as e:
        result["services"]["grafana"] = {
            "status": "unreachable",
            "url": GRAFANA_URL,
            "error": str(e)
        }

    # Check Prometheus
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
            url = f"{PROMETHEUS_URL}/-/healthy"
            async with session.get(url) as response:
                if response.status == 200:
                    result["services"]["prometheus"] = {
                        "status": "healthy",
                        "url": PROMETHEUS_URL,
                        "response_code": response.status
                    }
                else:
                    result["services"]["prometheus"] = {
                        "status": "unhealthy",
                        "url": PROMETHEUS_URL,
                        "response_code": response.status
                    }
    except Exception as e:
        result["services"]["prometheus"] = {
            "status": "unreachable",
            "url": PROMETHEUS_URL,
            "error": str(e)
        }

    return json.dumps(result, indent=2)


@mcp.tool()
async def monitoring_export_data(
    source: Annotated[str, Field(description="Data source: 'grafana' or 'prometheus'")],
    export_type: Annotated[str, Field(description="Type of data to export")],
    parameters: Annotated[Optional[Dict[str, Any]], Field(description="Export parameters")] = None
) -> str:
    """Export monitoring data for backup or analysis.

    Exports configuration or metrics data from Grafana or Prometheus for
    backup purposes or external analysis.

    Args:
        source: Which service to export from ('grafana' or 'prometheus')
        export_type: Type of data to export (e.g., 'dashboard', 'metrics')
        parameters: Additional parameters for the export operation

    Returns:
        JSON-formatted string with exported data
    """
    if source not in ["grafana", "prometheus"]:
        return json.dumps({
            "error": "Invalid source. Must be 'grafana' or 'prometheus'"
        }, indent=2)

    result = {
        "source": source,
        "export_type": export_type,
        "timestamp": datetime.utcnow().isoformat(),
        "note": "This is a placeholder implementation. Implement specific export logic based on requirements."
    }

    return json.dumps(result, indent=2)


def create_starlette_app(mcp_server: Server, *, debug: bool = False) -> Starlette:
    """Create a Starlette application that can serve the provided MCP server with SSE.

    Sets up a Starlette web application with routes for SSE (Server-Sent Events)
    communication with the MCP server.

    Args:
        mcp_server: The MCP server instance to connect
        debug: Whether to enable debug mode for the Starlette app

    Returns:
        A configured Starlette application
    """
    sse = SseServerTransport("/messages/")

    async def handle_sse(request: Request) -> None:
        """Handler for SSE connections."""
        async with sse.connect_sse(
                request.scope,
                request.receive,
                request._send,
        ) as (read_stream, write_stream):
            await mcp_server.run(
                read_stream,
                write_stream,
                mcp_server.create_initialization_options(),
            )

    return Starlette(
        debug=debug,
        routes=[
            Route("/sse", endpoint=handle_sse),
            Mount("/messages/", app=sse.handle_post_message),
        ],
    )


def main():
    """Main entry point for the Monitoring MCP server."""
    mcp_server = mcp._mcp_server

    import argparse

    parser = argparse.ArgumentParser(description='Run Monitoring MCP server with configurable transport')
    parser.add_argument('--transport', choices=['stdio', 'sse'], default='stdio',
                        help='Transport mode (stdio or sse)')
    parser.add_argument('--host', default='0.0.0.0',
                        help='Host to bind to (for SSE mode)')
    parser.add_argument('--port', type=int, default=8081,
                        help='Port to listen on (for SSE mode)')
    args = parser.parse_args()

    if args.transport == 'stdio':
        mcp.run(transport='stdio')
    else:
        starlette_app = create_starlette_app(mcp_server, debug=True)
        uvicorn.run(starlette_app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
