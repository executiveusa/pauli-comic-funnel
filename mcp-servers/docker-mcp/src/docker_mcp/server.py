import asyncio
import json
from typing import Any, Optional, Dict, List
from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from mcp.server.sse import SseServerTransport
from starlette.requests import Request
from starlette.routing import Mount, Route
from mcp.server import Server
import uvicorn
from pydantic import Field
import logging
import docker
from docker.errors import DockerException, APIError, NotFound

# Initialize FastMCP server for Docker operations
mcp = FastMCP("docker-mcp")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Custom exception classes for Docker operations
class DockerOperationError(Exception):
    """Generic error for Docker operations."""
    pass


# Global Docker client
_docker_client = None


def get_docker_client():
    """Get or create Docker client."""
    global _docker_client
    if _docker_client is None:
        try:
            _docker_client = docker.from_env()
        except DockerException as e:
            raise DockerOperationError(f"Failed to connect to Docker: {str(e)}")
    return _docker_client


@mcp.tool()
async def list_containers(
    all_containers: bool = False,
    filters: Optional[Dict[str, Any]] = None
) -> str:
    """List Docker containers.

    Args:
        all_containers: If True, show all containers (default shows just running)
        filters: Optional dict of filters (e.g., {"status": "running"})

    Returns:
        JSON-formatted string with container information
    """
    try:
        client = get_docker_client()
        containers = client.containers.list(all=all_containers, filters=filters or {})

        results = []
        for container in containers:
            results.append({
                "id": container.short_id,
                "name": container.name,
                "image": container.image.tags[0] if container.image.tags else container.image.id,
                "status": container.status,
                "ports": container.ports,
                "labels": container.labels
            })

        return json.dumps({
            "success": True,
            "count": len(results),
            "containers": results
        }, indent=2)

    except Exception as e:
        logger.error(f"List containers error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def start_container(
    container_name_or_id: str
) -> str:
    """Start a Docker container.

    Args:
        container_name_or_id: Container name or ID

    Returns:
        JSON-formatted string with operation status
    """
    try:
        client = get_docker_client()
        container = client.containers.get(container_name_or_id)
        container.start()

        return json.dumps({
            "success": True,
            "message": f"Container {container_name_or_id} started successfully",
            "container_id": container.short_id
        }, indent=2)

    except NotFound:
        return json.dumps({
            "success": False,
            "error": f"Container {container_name_or_id} not found"
        }, indent=2)
    except Exception as e:
        logger.error(f"Start container error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def stop_container(
    container_name_or_id: str,
    timeout: int = 10
) -> str:
    """Stop a Docker container.

    Args:
        container_name_or_id: Container name or ID
        timeout: Seconds to wait before killing container

    Returns:
        JSON-formatted string with operation status
    """
    try:
        client = get_docker_client()
        container = client.containers.get(container_name_or_id)
        container.stop(timeout=timeout)

        return json.dumps({
            "success": True,
            "message": f"Container {container_name_or_id} stopped successfully",
            "container_id": container.short_id
        }, indent=2)

    except NotFound:
        return json.dumps({
            "success": False,
            "error": f"Container {container_name_or_id} not found"
        }, indent=2)
    except Exception as e:
        logger.error(f"Stop container error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def create_container(
    image: str,
    name: Optional[str] = None,
    command: Optional[str] = None,
    environment: Optional[Dict[str, str]] = None,
    ports: Optional[Dict[str, int]] = None,
    volumes: Optional[Dict[str, Dict[str, str]]] = None,
    detach: bool = True
) -> str:
    """Create and optionally start a Docker container.

    Args:
        image: Docker image name (e.g., "nginx:latest")
        name: Container name (optional)
        command: Command to run in container (optional)
        environment: Environment variables dict (optional)
        ports: Port mappings dict (e.g., {"80/tcp": 8080})
        volumes: Volume mappings dict (e.g., {"/host/path": {"bind": "/container/path", "mode": "rw"}})
        detach: Run container in background (default: True)

    Returns:
        JSON-formatted string with container information
    """
    try:
        client = get_docker_client()

        container = client.containers.run(
            image=image,
            name=name,
            command=command,
            environment=environment or {},
            ports=ports or {},
            volumes=volumes or {},
            detach=detach
        )

        return json.dumps({
            "success": True,
            "message": f"Container created successfully",
            "container_id": container.short_id,
            "container_name": container.name
        }, indent=2)

    except Exception as e:
        logger.error(f"Create container error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def remove_container(
    container_name_or_id: str,
    force: bool = False
) -> str:
    """Remove a Docker container.

    Args:
        container_name_or_id: Container name or ID
        force: Force removal even if running

    Returns:
        JSON-formatted string with operation status
    """
    try:
        client = get_docker_client()
        container = client.containers.get(container_name_or_id)
        container.remove(force=force)

        return json.dumps({
            "success": True,
            "message": f"Container {container_name_or_id} removed successfully"
        }, indent=2)

    except NotFound:
        return json.dumps({
            "success": False,
            "error": f"Container {container_name_or_id} not found"
        }, indent=2)
    except Exception as e:
        logger.error(f"Remove container error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def get_container_logs(
    container_name_or_id: str,
    tail: int = 100,
    follow: bool = False
) -> str:
    """Get logs from a Docker container.

    Args:
        container_name_or_id: Container name or ID
        tail: Number of lines to show from end of logs
        follow: Follow log output (not recommended for MCP)

    Returns:
        JSON-formatted string with container logs
    """
    try:
        client = get_docker_client()
        container = client.containers.get(container_name_or_id)
        logs = container.logs(tail=tail, follow=follow).decode('utf-8')

        return json.dumps({
            "success": True,
            "container": container_name_or_id,
            "logs": logs
        }, indent=2)

    except NotFound:
        return json.dumps({
            "success": False,
            "error": f"Container {container_name_or_id} not found"
        }, indent=2)
    except Exception as e:
        logger.error(f"Get logs error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def list_images(
    filters: Optional[Dict[str, Any]] = None
) -> str:
    """List Docker images.

    Args:
        filters: Optional dict of filters (e.g., {"dangling": "true"})

    Returns:
        JSON-formatted string with image information
    """
    try:
        client = get_docker_client()
        images = client.images.list(filters=filters or {})

        results = []
        for image in images:
            results.append({
                "id": image.short_id,
                "tags": image.tags,
                "size": f"{image.attrs['Size'] / (1024**2):.2f} MB",
                "created": image.attrs['Created']
            })

        return json.dumps({
            "success": True,
            "count": len(results),
            "images": results
        }, indent=2)

    except Exception as e:
        logger.error(f"List images error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def pull_image(
    image: str,
    tag: str = "latest"
) -> str:
    """Pull a Docker image from registry.

    Args:
        image: Image name (e.g., "nginx")
        tag: Image tag (default: "latest")

    Returns:
        JSON-formatted string with operation status
    """
    try:
        client = get_docker_client()
        full_image = f"{image}:{tag}"
        client.images.pull(image, tag=tag)

        return json.dumps({
            "success": True,
            "message": f"Image {full_image} pulled successfully"
        }, indent=2)

    except Exception as e:
        logger.error(f"Pull image error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def build_image(
    path: str,
    tag: str,
    dockerfile: str = "Dockerfile",
    buildargs: Optional[Dict[str, str]] = None
) -> str:
    """Build a Docker image from Dockerfile.

    Args:
        path: Build context path
        tag: Image tag (e.g., "myapp:latest")
        dockerfile: Dockerfile name (default: "Dockerfile")
        buildargs: Build arguments dict (optional)

    Returns:
        JSON-formatted string with build status
    """
    try:
        client = get_docker_client()
        image, build_logs = client.images.build(
            path=path,
            tag=tag,
            dockerfile=dockerfile,
            buildargs=buildargs or {},
            rm=True
        )

        logs = [log.get('stream', '').strip() for log in build_logs if 'stream' in log]

        return json.dumps({
            "success": True,
            "message": f"Image {tag} built successfully",
            "image_id": image.short_id,
            "build_logs": logs[-20:]  # Last 20 log lines
        }, indent=2)

    except Exception as e:
        logger.error(f"Build image error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def docker_compose_up(
    compose_file: str = "docker-compose.yml",
    project_name: Optional[str] = None,
    detach: bool = True
) -> str:
    """Start services defined in docker-compose file.

    Args:
        compose_file: Path to docker-compose.yml
        project_name: Project name (optional)
        detach: Run in background (default: True)

    Returns:
        JSON-formatted string with operation status
    """
    try:
        import subprocess

        cmd = ["docker-compose", "-f", compose_file]
        if project_name:
            cmd.extend(["-p", project_name])
        cmd.append("up")
        if detach:
            cmd.append("-d")

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            return json.dumps({
                "success": True,
                "message": "Docker Compose services started successfully",
                "output": result.stdout
            }, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": result.stderr
            }, indent=2)

    except Exception as e:
        logger.error(f"Docker Compose up error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def get_container_stats(
    container_name_or_id: str
) -> str:
    """Get resource usage statistics for a container.

    Args:
        container_name_or_id: Container name or ID

    Returns:
        JSON-formatted string with resource statistics
    """
    try:
        client = get_docker_client()
        container = client.containers.get(container_name_or_id)
        stats = container.stats(stream=False)

        # Parse CPU and memory usage
        cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - \
                   stats['precpu_stats']['cpu_usage']['total_usage']
        system_delta = stats['cpu_stats']['system_cpu_usage'] - \
                      stats['precpu_stats']['system_cpu_usage']
        cpu_percent = (cpu_delta / system_delta) * 100.0 if system_delta > 0 else 0.0

        mem_usage = stats['memory_stats']['usage']
        mem_limit = stats['memory_stats']['limit']
        mem_percent = (mem_usage / mem_limit) * 100.0

        return json.dumps({
            "success": True,
            "container": container_name_or_id,
            "stats": {
                "cpu_percent": f"{cpu_percent:.2f}%",
                "memory_usage": f"{mem_usage / (1024**2):.2f} MB",
                "memory_limit": f"{mem_limit / (1024**2):.2f} MB",
                "memory_percent": f"{mem_percent:.2f}%",
                "network_rx": stats['networks'].get('eth0', {}).get('rx_bytes', 0),
                "network_tx": stats['networks'].get('eth0', {}).get('tx_bytes', 0)
            }
        }, indent=2)

    except NotFound:
        return json.dumps({
            "success": False,
            "error": f"Container {container_name_or_id} not found"
        }, indent=2)
    except Exception as e:
        logger.error(f"Get stats error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


def create_starlette_app(mcp_server: Server, *, debug: bool = False) -> Starlette:
    """Create a Starlette application that can serve the provided MCP server with SSE."""
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
    """Main entry point for the Docker MCP server."""
    mcp_server = mcp._mcp_server

    import argparse

    parser = argparse.ArgumentParser(description='Run Docker MCP server with configurable transport')
    parser.add_argument('--transport', choices=['stdio', 'sse'], default='stdio',
                        help='Transport mode (stdio or sse)')
    parser.add_argument('--host', default='0.0.0.0',
                        help='Host to bind to (for SSE mode)')
    parser.add_argument('--port', type=int, default=8082,
                        help='Port to listen on (for SSE mode)')
    args = parser.parse_args()

    if args.transport == 'stdio':
        mcp.run(transport='stdio')
    else:
        starlette_app = create_starlette_app(mcp_server, debug=True)
        uvicorn.run(starlette_app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
