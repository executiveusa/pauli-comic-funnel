import os
import json
from typing import Any, Optional, List, Dict
from datetime import datetime
import asyncio
import aiohttp
from huggingface_hub import (
    HfApi,
    login,
    InferenceClient,
    list_models,
    list_datasets,
    model_info,
    dataset_info,
    create_repo,
    upload_file,
    upload_folder,
)
from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from mcp.server.sse import SseServerTransport
from starlette.requests import Request
from starlette.routing import Mount, Route
from mcp.server import Server
import uvicorn
from pydantic import Field, BaseModel

# Initialize FastMCP server for HuggingFace functionality
mcp = FastMCP("huggingface-mcp")

# Initialize HuggingFace API
HF_TOKEN = os.getenv("HF_TOKEN")
if HF_TOKEN:
    login(token=HF_TOKEN)
    hf_api = HfApi(token=HF_TOKEN)
else:
    hf_api = HfApi()


# Custom exception classes
class HuggingFaceAPIError(Exception):
    """Generic error for HuggingFace API operations."""
    pass


class HuggingFaceAuthError(HuggingFaceAPIError):
    """Raised when HuggingFace authentication fails."""
    pass


class HuggingFaceNotFoundError(HuggingFaceAPIError):
    """Raised when a model/dataset is not found."""
    pass


def _check_token() -> bool:
    """Check if HuggingFace token is configured."""
    return HF_TOKEN is not None and len(HF_TOKEN) > 0


def _format_error(message: str) -> str:
    """Format error message consistently."""
    return json.dumps({"error": message, "success": False}, indent=2)


def _format_success(data: Dict[str, Any], message: Optional[str] = None) -> str:
    """Format success response consistently."""
    response = {"success": True, "data": data}
    if message:
        response["message"] = message
    return json.dumps(response, indent=2, default=str)


@mcp.tool()
async def search_models(
    query: Optional[str] = None,
    task: Optional[str] = None,
    library: Optional[str] = None,
    language: Optional[str] = None,
    limit: int = 10
) -> str:
    """Search for models on HuggingFace Hub.

    Search and filter models by various criteria including task type,
    library, language, and keywords.

    Args:
        query: Search query string (model name, description keywords)
        task: Filter by task (e.g., "text-generation", "image-classification")
        library: Filter by library (e.g., "transformers", "diffusers", "pytorch")
        language: Filter by language (e.g., "en", "es", "multilingual")
        limit: Maximum number of results (default: 10, max: 100)

    Returns:
        JSON-formatted string with list of matching models
    """
    try:
        limit = min(limit, 100)  # Cap at 100

        # Build filters
        filters = {}
        if task:
            filters["task"] = task
        if library:
            filters["library"] = library
        if language:
            filters["language"] = language

        # Search models
        models = list(list_models(
            search=query,
            filter=filters if filters else None,
            limit=limit,
            sort="downloads",
            direction=-1
        ))

        # Format results
        results = []
        for model in models:
            results.append({
                "id": model.modelId,
                "author": model.author if hasattr(model, 'author') else None,
                "downloads": model.downloads if hasattr(model, 'downloads') else 0,
                "likes": model.likes if hasattr(model, 'likes') else 0,
                "task": model.pipeline_tag if hasattr(model, 'pipeline_tag') else None,
                "library": model.library_name if hasattr(model, 'library_name') else None,
                "tags": model.tags if hasattr(model, 'tags') else [],
                "created_at": model.created_at.isoformat() if hasattr(model, 'created_at') and model.created_at else None
            })

        return _format_success({
            "total": len(results),
            "query": query,
            "filters": filters,
            "models": results
        })

    except Exception as e:
        return _format_error(f"Failed to search models: {str(e)}")


@mcp.tool()
async def get_model_info(
    model_id: str
) -> str:
    """Get detailed information about a specific model.

    Retrieve comprehensive information about a model including its
    architecture, training data, performance metrics, and usage.

    Args:
        model_id: Model identifier (e.g., "gpt2", "bert-base-uncased")

    Returns:
        JSON-formatted string with detailed model information
    """
    if not model_id:
        return _format_error("model_id is required")

    try:
        info = model_info(model_id)

        model_data = {
            "id": info.modelId,
            "author": info.author if hasattr(info, 'author') else None,
            "downloads": info.downloads if hasattr(info, 'downloads') else 0,
            "likes": info.likes if hasattr(info, 'likes') else 0,
            "task": info.pipeline_tag if hasattr(info, 'pipeline_tag') else None,
            "library": info.library_name if hasattr(info, 'library_name') else None,
            "tags": info.tags if hasattr(info, 'tags') else [],
            "card_data": info.card_data if hasattr(info, 'card_data') else {},
            "siblings": [s.rfilename for s in info.siblings] if hasattr(info, 'siblings') else [],
            "private": info.private if hasattr(info, 'private') else False,
            "created_at": info.created_at.isoformat() if hasattr(info, 'created_at') and info.created_at else None,
            "last_modified": info.last_modified.isoformat() if hasattr(info, 'last_modified') and info.last_modified else None
        }

        return _format_success(model_data)

    except Exception as e:
        if "404" in str(e):
            raise HuggingFaceNotFoundError(f"Model '{model_id}' not found")
        return _format_error(f"Failed to get model info: {str(e)}")


@mcp.tool()
async def run_inference(
    model_id: str,
    inputs: str,
    parameters: Optional[str] = None
) -> str:
    """Run inference on a HuggingFace model using the Inference API.

    Execute model inference for various tasks including text generation,
    classification, translation, and more.

    Args:
        model_id: Model identifier to use for inference
        inputs: Input text or data for the model
        parameters: JSON string of model-specific parameters (optional)

    Returns:
        JSON-formatted string with inference results
    """
    if not model_id or not inputs:
        return _format_error("model_id and inputs are required")

    try:
        client = InferenceClient(token=HF_TOKEN)

        # Parse parameters if provided
        params = {}
        if parameters:
            try:
                params = json.loads(parameters)
            except json.JSONDecodeError:
                return _format_error("Invalid JSON format for parameters")

        # Run inference
        result = client.post(
            json={"inputs": inputs, "parameters": params},
            model=model_id
        )

        return _format_success({
            "model": model_id,
            "inputs": inputs,
            "result": result,
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        if "authentication" in str(e).lower() or "token" in str(e).lower():
            raise HuggingFaceAuthError(f"Authentication failed: {e}")
        return _format_error(f"Inference failed: {str(e)}")


@mcp.tool()
async def search_datasets(
    query: Optional[str] = None,
    task: Optional[str] = None,
    language: Optional[str] = None,
    limit: int = 10
) -> str:
    """Search for datasets on HuggingFace Hub.

    Search and filter datasets by various criteria including task type,
    language, and keywords.

    Args:
        query: Search query string (dataset name, description keywords)
        task: Filter by task category
        language: Filter by language (e.g., "en", "es", "multilingual")
        limit: Maximum number of results (default: 10, max: 100)

    Returns:
        JSON-formatted string with list of matching datasets
    """
    try:
        limit = min(limit, 100)  # Cap at 100

        # Build filters
        filters = {}
        if task:
            filters["task_categories"] = task
        if language:
            filters["language"] = language

        # Search datasets
        datasets = list(list_datasets(
            search=query,
            filter=filters if filters else None,
            limit=limit,
            sort="downloads",
            direction=-1
        ))

        # Format results
        results = []
        for dataset in datasets:
            results.append({
                "id": dataset.id,
                "author": dataset.author if hasattr(dataset, 'author') else None,
                "downloads": dataset.downloads if hasattr(dataset, 'downloads') else 0,
                "likes": dataset.likes if hasattr(dataset, 'likes') else 0,
                "tags": dataset.tags if hasattr(dataset, 'tags') else [],
                "created_at": dataset.created_at.isoformat() if hasattr(dataset, 'created_at') and dataset.created_at else None
            })

        return _format_success({
            "total": len(results),
            "query": query,
            "filters": filters,
            "datasets": results
        })

    except Exception as e:
        return _format_error(f"Failed to search datasets: {str(e)}")


@mcp.tool()
async def get_dataset_info(
    dataset_id: str
) -> str:
    """Get detailed information about a specific dataset.

    Retrieve comprehensive information about a dataset including its
    structure, size, splits, and features.

    Args:
        dataset_id: Dataset identifier (e.g., "squad", "glue")

    Returns:
        JSON-formatted string with detailed dataset information
    """
    if not dataset_id:
        return _format_error("dataset_id is required")

    try:
        info = dataset_info(dataset_id)

        dataset_data = {
            "id": info.id,
            "author": info.author if hasattr(info, 'author') else None,
            "downloads": info.downloads if hasattr(info, 'downloads') else 0,
            "likes": info.likes if hasattr(info, 'likes') else 0,
            "tags": info.tags if hasattr(info, 'tags') else [],
            "card_data": info.card_data if hasattr(info, 'card_data') else {},
            "siblings": [s.rfilename for s in info.siblings] if hasattr(info, 'siblings') else [],
            "private": info.private if hasattr(info, 'private') else False,
            "created_at": info.created_at.isoformat() if hasattr(info, 'created_at') and info.created_at else None,
            "last_modified": info.last_modified.isoformat() if hasattr(info, 'last_modified') and info.last_modified else None
        }

        return _format_success(dataset_data)

    except Exception as e:
        if "404" in str(e):
            raise HuggingFaceNotFoundError(f"Dataset '{dataset_id}' not found")
        return _format_error(f"Failed to get dataset info: {str(e)}")


@mcp.tool()
async def create_model_repo(
    repo_id: str,
    private: bool = False,
    exist_ok: bool = False
) -> str:
    """Create a new model repository on HuggingFace Hub.

    Create a repository to host your model files and model card.

    Args:
        repo_id: Repository identifier (format: "username/repo-name")
        private: Whether the repository should be private (default: False)
        exist_ok: Don't raise error if repository already exists (default: False)

    Returns:
        JSON-formatted string with repository URL
    """
    if not _check_token():
        return _format_error("HF_TOKEN environment variable is not set")

    if not repo_id:
        return _format_error("repo_id is required")

    try:
        url = create_repo(
            repo_id=repo_id,
            private=private,
            exist_ok=exist_ok,
            repo_type="model",
            token=HF_TOKEN
        )

        return _format_success({
            "repo_id": repo_id,
            "url": str(url),
            "private": private,
            "created_at": datetime.utcnow().isoformat()
        }, f"Model repository '{repo_id}' created successfully")

    except Exception as e:
        if "authentication" in str(e).lower():
            raise HuggingFaceAuthError(f"Authentication failed: {e}")
        return _format_error(f"Failed to create repository: {str(e)}")


@mcp.tool()
async def create_dataset_repo(
    repo_id: str,
    private: bool = False,
    exist_ok: bool = False
) -> str:
    """Create a new dataset repository on HuggingFace Hub.

    Create a repository to host your dataset files and dataset card.

    Args:
        repo_id: Repository identifier (format: "username/repo-name")
        private: Whether the repository should be private (default: False)
        exist_ok: Don't raise error if repository already exists (default: False)

    Returns:
        JSON-formatted string with repository URL
    """
    if not _check_token():
        return _format_error("HF_TOKEN environment variable is not set")

    if not repo_id:
        return _format_error("repo_id is required")

    try:
        url = create_repo(
            repo_id=repo_id,
            private=private,
            exist_ok=exist_ok,
            repo_type="dataset",
            token=HF_TOKEN
        )

        return _format_success({
            "repo_id": repo_id,
            "url": str(url),
            "private": private,
            "created_at": datetime.utcnow().isoformat()
        }, f"Dataset repository '{repo_id}' created successfully")

    except Exception as e:
        if "authentication" in str(e).lower():
            raise HuggingFaceAuthError(f"Authentication failed: {e}")
        return _format_error(f"Failed to create repository: {str(e)}")


@mcp.tool()
async def upload_model_file(
    repo_id: str,
    file_path: str,
    path_in_repo: Optional[str] = None
) -> str:
    """Upload a file to a model repository.

    Upload model files, configurations, or other assets to your model repository.

    Args:
        repo_id: Repository identifier (format: "username/repo-name")
        file_path: Local path to the file to upload
        path_in_repo: Path where file should be stored in repo (optional)

    Returns:
        JSON-formatted string with upload confirmation
    """
    if not _check_token():
        return _format_error("HF_TOKEN environment variable is not set")

    if not repo_id or not file_path:
        return _format_error("repo_id and file_path are required")

    try:
        # Check if file exists
        if not os.path.exists(file_path):
            return _format_error(f"File not found: {file_path}")

        # Upload file
        url = upload_file(
            path_or_fileobj=file_path,
            path_in_repo=path_in_repo or os.path.basename(file_path),
            repo_id=repo_id,
            repo_type="model",
            token=HF_TOKEN
        )

        return _format_success({
            "repo_id": repo_id,
            "file_path": file_path,
            "path_in_repo": path_in_repo or os.path.basename(file_path),
            "url": str(url),
            "uploaded_at": datetime.utcnow().isoformat()
        }, "File uploaded successfully")

    except Exception as e:
        return _format_error(f"Failed to upload file: {str(e)}")


@mcp.tool()
async def list_spaces(
    author: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 10
) -> str:
    """List HuggingFace Spaces (deployed ML applications).

    Search and browse deployed Spaces on HuggingFace Hub.

    Args:
        author: Filter by author/organization
        search: Search query for Space names and descriptions
        limit: Maximum number of results (default: 10, max: 100)

    Returns:
        JSON-formatted string with list of Spaces
    """
    try:
        limit = min(limit, 100)

        # Use HF API to list spaces
        spaces = hf_api.list_spaces(
            author=author,
            search=search,
            limit=limit,
            sort="likes",
            direction=-1
        )

        # Format results
        results = []
        for space in spaces:
            results.append({
                "id": space.id,
                "author": space.author if hasattr(space, 'author') else None,
                "likes": space.likes if hasattr(space, 'likes') else 0,
                "sdk": space.sdk if hasattr(space, 'sdk') else None,
                "tags": space.tags if hasattr(space, 'tags') else [],
                "created_at": space.created_at.isoformat() if hasattr(space, 'created_at') and space.created_at else None
            })

        return _format_success({
            "total": len(results),
            "author": author,
            "search": search,
            "spaces": results
        })

    except Exception as e:
        return _format_error(f"Failed to list spaces: {str(e)}")


@mcp.tool()
async def create_space(
    repo_id: str,
    sdk: str = "gradio",
    private: bool = False
) -> str:
    """Create a new Space on HuggingFace Hub.

    Create a Space to deploy ML applications using Gradio, Streamlit, or Docker.

    Args:
        repo_id: Space identifier (format: "username/space-name")
        sdk: SDK to use ("gradio", "streamlit", or "docker")
        private: Whether the Space should be private (default: False)

    Returns:
        JSON-formatted string with Space URL
    """
    if not _check_token():
        return _format_error("HF_TOKEN environment variable is not set")

    if not repo_id:
        return _format_error("repo_id is required")

    if sdk not in ["gradio", "streamlit", "docker", "static"]:
        return _format_error("sdk must be 'gradio', 'streamlit', 'docker', or 'static'")

    try:
        url = create_repo(
            repo_id=repo_id,
            private=private,
            repo_type="space",
            space_sdk=sdk,
            token=HF_TOKEN
        )

        return _format_success({
            "repo_id": repo_id,
            "url": str(url),
            "sdk": sdk,
            "private": private,
            "created_at": datetime.utcnow().isoformat()
        }, f"Space '{repo_id}' created successfully")

    except Exception as e:
        if "authentication" in str(e).lower():
            raise HuggingFaceAuthError(f"Authentication failed: {e}")
        return _format_error(f"Failed to create Space: {str(e)}")


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
    """Main entry point for the HuggingFace MCP server."""
    mcp_server = mcp._mcp_server

    import argparse

    parser = argparse.ArgumentParser(description='Run HuggingFace MCP server with configurable transport')
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
