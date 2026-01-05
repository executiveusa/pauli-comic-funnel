import asyncio
import json
import os
import tempfile
from typing import Any, Optional, List, Dict, Annotated
from pathlib import Path
import subprocess
from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from mcp.server.sse import SseServerTransport
from starlette.requests import Request
from starlette.routing import Mount, Route
from mcp.server import Server
import uvicorn
from pydantic import Field

# Initialize FastMCP server for FFmpeg functionality
mcp = FastMCP("ffmpeg-mcp")


# Custom exception classes for FFmpeg operations
class FFmpegError(Exception):
    """Generic error for FFmpeg operations."""
    pass


class FFmpegNotFoundError(FFmpegError):
    """Raised when FFmpeg is not installed or not found in PATH."""
    pass


class FFmpegProcessError(FFmpegError):
    """Raised when FFmpeg process fails."""
    pass


def _check_ffmpeg_installed() -> bool:
    """Check if FFmpeg is installed and available in PATH."""
    try:
        subprocess.run(
            ["ffmpeg", "-version"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def _run_ffmpeg_command(command: List[str], timeout: int = 300) -> Dict[str, Any]:
    """
    Execute an FFmpeg command and return the result.

    Args:
        command: List of command arguments
        timeout: Command timeout in seconds

    Returns:
        Dict with success status, stdout, and stderr

    Raises:
        FFmpegProcessError: If command execution fails
    """
    try:
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
            check=False
        )

        return {
            "success": result.returncode == 0,
            "returncode": result.returncode,
            "stdout": result.stdout.decode("utf-8", errors="ignore"),
            "stderr": result.stderr.decode("utf-8", errors="ignore")
        }
    except subprocess.TimeoutExpired:
        raise FFmpegProcessError(f"FFmpeg command timed out after {timeout} seconds")
    except Exception as e:
        raise FFmpegProcessError(f"Failed to execute FFmpeg command: {e}")


@mcp.tool()
async def convert_video_format(
    input_path: str,
    output_path: str,
    output_format: Annotated[str, Field(description="Output format (e.g., mp4, webm, avi, mkv)")] = "mp4",
    video_codec: Annotated[Optional[str], Field(description="Video codec (e.g., h264, vp9, hevc)")] = None,
    audio_codec: Annotated[Optional[str], Field(description="Audio codec (e.g., aac, mp3, opus)")] = None,
    quality: Annotated[Optional[str], Field(description="Quality preset: low, medium, high, or CRF value (0-51)")] = "medium"
) -> str:
    """Convert video from one format to another with optional codec and quality settings.

    This tool converts video files between different formats using FFmpeg. It supports
    various video and audio codecs, quality presets, and streaming optimization.

    Args:
        input_path: Path to the input video file
        output_path: Path for the output video file
        output_format: Desired output format (mp4, webm, avi, mkv, etc.)
        video_codec: Video codec to use (h264, vp9, hevc, etc.)
        audio_codec: Audio codec to use (aac, mp3, opus, etc.)
        quality: Quality preset (low/medium/high) or CRF value (0-51, lower is better)

    Returns:
        JSON string with conversion result and file information

    Raises:
        FFmpegError: If conversion fails
    """
    if not _check_ffmpeg_installed():
        return json.dumps({
            "success": False,
            "error": "FFmpeg is not installed or not found in PATH"
        }, indent=2)

    # Validate input file exists
    if not os.path.exists(input_path):
        return json.dumps({
            "success": False,
            "error": f"Input file not found: {input_path}"
        }, indent=2)

    # Build FFmpeg command
    command = ["ffmpeg", "-i", input_path]

    # Set video codec
    if video_codec:
        command.extend(["-c:v", video_codec])
    else:
        # Default codecs based on format
        codec_map = {
            "mp4": "libx264",
            "webm": "libvpx-vp9",
            "mkv": "libx264",
            "avi": "libx264"
        }
        command.extend(["-c:v", codec_map.get(output_format, "libx264")])

    # Set audio codec
    if audio_codec:
        command.extend(["-c:a", audio_codec])
    else:
        # Default audio codecs
        audio_map = {
            "mp4": "aac",
            "webm": "libopus",
            "mkv": "aac",
            "avi": "mp3"
        }
        command.extend(["-c:a", audio_map.get(output_format, "aac")])

    # Set quality
    quality_map = {
        "low": "28",
        "medium": "23",
        "high": "18"
    }
    crf_value = quality_map.get(quality, quality)
    command.extend(["-crf", crf_value])

    # Add streaming optimization for mp4
    if output_format == "mp4":
        command.extend(["-movflags", "+faststart"])

    # Add output path and overwrite flag
    command.extend(["-y", output_path])

    try:
        result = _run_ffmpeg_command(command, timeout=600)

        if result["success"]:
            # Get output file info
            output_size = os.path.getsize(output_path)
            input_size = os.path.getsize(input_path)

            return json.dumps({
                "success": True,
                "input_file": input_path,
                "output_file": output_path,
                "format": output_format,
                "video_codec": video_codec or codec_map.get(output_format, "libx264"),
                "audio_codec": audio_codec or audio_map.get(output_format, "aac"),
                "quality": quality,
                "input_size_mb": round(input_size / (1024 * 1024), 2),
                "output_size_mb": round(output_size / (1024 * 1024), 2),
                "compression_ratio": round((1 - output_size / input_size) * 100, 2),
                "command": " ".join(command)
            }, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "FFmpeg conversion failed",
                "stderr": result["stderr"]
            }, indent=2)

    except FFmpegProcessError as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def compress_video(
    input_path: str,
    output_path: str,
    target_size_mb: Annotated[Optional[float], Field(description="Target file size in MB")] = None,
    bitrate: Annotated[Optional[str], Field(description="Target bitrate (e.g., '1M', '500k')")] = None,
    scale: Annotated[Optional[str], Field(description="Scale resolution (e.g., '1280:720', '640:-1')")] = None
) -> str:
    """Compress video file to reduce size using FFmpeg.

    This tool compresses video files by adjusting bitrate, resolution, or targeting
    a specific file size. Useful for optimizing videos for web delivery.

    Args:
        input_path: Path to the input video file
        output_path: Path for the compressed output file
        target_size_mb: Target file size in megabytes
        bitrate: Target bitrate (e.g., '1M' for 1 Mbps, '500k' for 500 kbps)
        scale: Resolution scaling (e.g., '1280:720' or '640:-1' to maintain aspect ratio)

    Returns:
        JSON string with compression result and statistics
    """
    if not _check_ffmpeg_installed():
        return json.dumps({
            "success": False,
            "error": "FFmpeg is not installed or not found in PATH"
        }, indent=2)

    if not os.path.exists(input_path):
        return json.dumps({
            "success": False,
            "error": f"Input file not found: {input_path}"
        }, indent=2)

    # Build FFmpeg command
    command = ["ffmpeg", "-i", input_path]

    # Add scale filter if specified
    filters = []
    if scale:
        filters.append(f"scale={scale}")

    if filters:
        command.extend(["-vf", ",".join(filters)])

    # Set bitrate
    if bitrate:
        command.extend(["-b:v", bitrate])
    elif target_size_mb:
        # Calculate bitrate from target size
        # Get video duration using ffprobe
        duration_cmd = [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", input_path
        ]
        duration_result = subprocess.run(
            duration_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        duration = float(duration_result.stdout.decode().strip())

        # Calculate bitrate (target_size in bits / duration in seconds)
        target_bitrate = int((target_size_mb * 8 * 1024 * 1024) / duration)
        command.extend(["-b:v", str(target_bitrate)])

    # Use efficient codecs
    command.extend(["-c:v", "libx264", "-preset", "medium", "-c:a", "aac", "-b:a", "128k"])

    # Add output and overwrite flag
    command.extend(["-y", output_path])

    try:
        result = _run_ffmpeg_command(command, timeout=600)

        if result["success"]:
            input_size = os.path.getsize(input_path)
            output_size = os.path.getsize(output_path)

            return json.dumps({
                "success": True,
                "input_file": input_path,
                "output_file": output_path,
                "input_size_mb": round(input_size / (1024 * 1024), 2),
                "output_size_mb": round(output_size / (1024 * 1024), 2),
                "size_reduction_mb": round((input_size - output_size) / (1024 * 1024), 2),
                "compression_ratio": round((1 - output_size / input_size) * 100, 2),
                "command": " ".join(command)
            }, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "Video compression failed",
                "stderr": result["stderr"]
            }, indent=2)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def generate_thumbnail(
    input_path: str,
    output_path: str,
    timestamp: Annotated[str, Field(description="Timestamp for thumbnail (e.g., '00:00:05', '10' for seconds)")] = "00:00:01",
    width: Annotated[int, Field(description="Thumbnail width in pixels")] = 1280,
    height: Annotated[int, Field(description="Thumbnail height in pixels (-1 for auto)")] = -1
) -> str:
    """Generate thumbnail image from video at specified timestamp.

    This tool extracts a single frame from a video file and saves it as an image,
    useful for creating video previews and thumbnails.

    Args:
        input_path: Path to the input video file
        output_path: Path for the thumbnail image
        timestamp: Time position for thumbnail (format: HH:MM:SS or seconds)
        width: Thumbnail width in pixels
        height: Thumbnail height in pixels (-1 maintains aspect ratio)

    Returns:
        JSON string with thumbnail generation result
    """
    if not _check_ffmpeg_installed():
        return json.dumps({
            "success": False,
            "error": "FFmpeg is not installed or not found in PATH"
        }, indent=2)

    if not os.path.exists(input_path):
        return json.dumps({
            "success": False,
            "error": f"Input file not found: {input_path}"
        }, indent=2)

    # Build FFmpeg command
    command = [
        "ffmpeg", "-ss", timestamp, "-i", input_path,
        "-vf", f"scale={width}:{height}",
        "-frames:v", "1",
        "-q:v", "2",
        "-y", output_path
    ]

    try:
        result = _run_ffmpeg_command(command, timeout=30)

        if result["success"] and os.path.exists(output_path):
            file_size = os.path.getsize(output_path)

            return json.dumps({
                "success": True,
                "input_file": input_path,
                "output_file": output_path,
                "timestamp": timestamp,
                "dimensions": f"{width}x{height if height > 0 else 'auto'}",
                "file_size_kb": round(file_size / 1024, 2),
                "command": " ".join(command)
            }, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "Thumbnail generation failed",
                "stderr": result["stderr"]
            }, indent=2)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def extract_audio(
    input_path: str,
    output_path: str,
    audio_format: Annotated[str, Field(description="Audio format (mp3, aac, wav, flac, opus)")] = "mp3",
    bitrate: Annotated[str, Field(description="Audio bitrate (e.g., '192k', '320k')")] = "192k"
) -> str:
    """Extract audio track from video file.

    This tool extracts the audio stream from a video file and saves it as a
    standalone audio file in various formats.

    Args:
        input_path: Path to the input video file
        output_path: Path for the output audio file
        audio_format: Desired audio format (mp3, aac, wav, flac, opus)
        bitrate: Audio bitrate (e.g., '192k', '320k')

    Returns:
        JSON string with extraction result
    """
    if not _check_ffmpeg_installed():
        return json.dumps({
            "success": False,
            "error": "FFmpeg is not installed or not found in PATH"
        }, indent=2)

    if not os.path.exists(input_path):
        return json.dumps({
            "success": False,
            "error": f"Input file not found: {input_path}"
        }, indent=2)

    # Map format to codec
    codec_map = {
        "mp3": "libmp3lame",
        "aac": "aac",
        "wav": "pcm_s16le",
        "flac": "flac",
        "opus": "libopus"
    }

    codec = codec_map.get(audio_format, "libmp3lame")

    # Build FFmpeg command
    command = [
        "ffmpeg", "-i", input_path,
        "-vn",  # No video
        "-c:a", codec,
        "-b:a", bitrate,
        "-y", output_path
    ]

    try:
        result = _run_ffmpeg_command(command, timeout=300)

        if result["success"]:
            file_size = os.path.getsize(output_path)

            return json.dumps({
                "success": True,
                "input_file": input_path,
                "output_file": output_path,
                "format": audio_format,
                "codec": codec,
                "bitrate": bitrate,
                "file_size_mb": round(file_size / (1024 * 1024), 2),
                "command": " ".join(command)
            }, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "Audio extraction failed",
                "stderr": result["stderr"]
            }, indent=2)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def get_video_info(input_path: str) -> str:
    """Get detailed information about a video file using FFprobe.

    This tool analyzes a video file and returns comprehensive metadata including
    duration, resolution, codecs, bitrate, and stream information.

    Args:
        input_path: Path to the video file to analyze

    Returns:
        JSON string with detailed video information
    """
    if not _check_ffmpeg_installed():
        return json.dumps({
            "success": False,
            "error": "FFmpeg/FFprobe is not installed or not found in PATH"
        }, indent=2)

    if not os.path.exists(input_path):
        return json.dumps({
            "success": False,
            "error": f"Input file not found: {input_path}"
        }, indent=2)

    # Use ffprobe to get video information
    command = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        input_path
    ]

    try:
        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=30
        )

        if result.returncode == 0:
            info = json.loads(result.stdout.decode())

            # Extract key information
            format_info = info.get("format", {})
            streams = info.get("streams", [])

            video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
            audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

            response = {
                "success": True,
                "file_path": input_path,
                "format": {
                    "filename": format_info.get("filename"),
                    "format_name": format_info.get("format_name"),
                    "duration": float(format_info.get("duration", 0)),
                    "size_bytes": int(format_info.get("size", 0)),
                    "size_mb": round(int(format_info.get("size", 0)) / (1024 * 1024), 2),
                    "bitrate": int(format_info.get("bit_rate", 0))
                }
            }

            if video_stream:
                response["video"] = {
                    "codec": video_stream.get("codec_name"),
                    "profile": video_stream.get("profile"),
                    "width": video_stream.get("width"),
                    "height": video_stream.get("height"),
                    "aspect_ratio": video_stream.get("display_aspect_ratio"),
                    "frame_rate": video_stream.get("r_frame_rate"),
                    "bitrate": int(video_stream.get("bit_rate", 0)) if video_stream.get("bit_rate") else None
                }

            if audio_stream:
                response["audio"] = {
                    "codec": audio_stream.get("codec_name"),
                    "sample_rate": int(audio_stream.get("sample_rate", 0)),
                    "channels": audio_stream.get("channels"),
                    "bitrate": int(audio_stream.get("bit_rate", 0)) if audio_stream.get("bit_rate") else None
                }

            return json.dumps(response, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": "Failed to get video information",
                "stderr": result.stderr.decode()
            }, indent=2)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


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
    """Main entry point for the FFmpeg MCP server."""
    mcp_server = mcp._mcp_server

    import argparse

    parser = argparse.ArgumentParser(description='Run FFmpeg MCP server with configurable transport')
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
