import asyncio
import json
import os
from typing import Any, Optional, List, Dict, Tuple, Annotated
from pathlib import Path
from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from mcp.server.sse import SseServerTransport
from starlette.requests import Request
from starlette.routing import Mount, Route
from mcp.server import Server
import uvicorn
from pydantic import Field

# Initialize FastMCP server for ImageMagick functionality
mcp = FastMCP("imagemagick-mcp")


# Custom exception classes for ImageMagick operations
class ImageMagickError(Exception):
    """Generic error for ImageMagick operations."""
    pass


class ImageMagickNotFoundError(ImageMagickError):
    """Raised when Wand/ImageMagick is not installed."""
    pass


class ImageProcessingError(ImageMagickError):
    """Raised when image processing fails."""
    pass


def _check_wand_installed() -> bool:
    """Check if Wand (ImageMagick Python bindings) is installed."""
    try:
        from wand.image import Image
        return True
    except ImportError:
        return False


@mcp.tool()
async def resize_image(
    input_path: str,
    output_path: str,
    width: Annotated[Optional[int], Field(description="Target width in pixels (None to maintain aspect ratio)")] = None,
    height: Annotated[Optional[int], Field(description="Target height in pixels (None to maintain aspect ratio)")] = None,
    percentage: Annotated[Optional[int], Field(description="Resize by percentage (e.g., 50 for 50%)")] = None,
    maintain_aspect: Annotated[bool, Field(description="Maintain aspect ratio when resizing")] = True
) -> str:
    """Resize an image to specified dimensions or percentage.

    This tool resizes images using ImageMagick, with options to maintain aspect ratio,
    scale by percentage, or specify exact dimensions.

    Args:
        input_path: Path to the input image file
        output_path: Path for the resized output image
        width: Target width in pixels (None to auto-calculate)
        height: Target height in pixels (None to auto-calculate)
        percentage: Resize by percentage (overrides width/height if set)
        maintain_aspect: Whether to maintain aspect ratio

    Returns:
        JSON string with resize operation result

    Raises:
        ImageMagickError: If resize operation fails
    """
    if not _check_wand_installed():
        return json.dumps({
            "success": False,
            "error": "Wand (ImageMagick Python bindings) is not installed. Install with: pip install Wand"
        }, indent=2)

    try:
        from wand.image import Image

        if not os.path.exists(input_path):
            return json.dumps({
                "success": False,
                "error": f"Input file not found: {input_path}"
            }, indent=2)

        with Image(filename=input_path) as img:
            original_width = img.width
            original_height = img.height
            original_size = os.path.getsize(input_path)

            if percentage:
                # Resize by percentage
                new_width = int(original_width * percentage / 100)
                new_height = int(original_height * percentage / 100)
                img.resize(new_width, new_height)
            elif width and height:
                # Resize to specific dimensions
                if maintain_aspect:
                    img.transform(resize=f"{width}x{height}")
                else:
                    img.resize(width, height)
            elif width:
                # Resize by width, maintain aspect ratio
                aspect_ratio = original_height / original_width
                new_height = int(width * aspect_ratio)
                img.resize(width, new_height)
            elif height:
                # Resize by height, maintain aspect ratio
                aspect_ratio = original_width / original_height
                new_width = int(height * aspect_ratio)
                img.resize(new_width, height)
            else:
                return json.dumps({
                    "success": False,
                    "error": "Must specify either width, height, or percentage"
                }, indent=2)

            img.save(filename=output_path)
            output_size = os.path.getsize(output_path)

            return json.dumps({
                "success": True,
                "input_file": input_path,
                "output_file": output_path,
                "original_dimensions": f"{original_width}x{original_height}",
                "new_dimensions": f"{img.width}x{img.height}",
                "original_size_kb": round(original_size / 1024, 2),
                "new_size_kb": round(output_size / 1024, 2),
                "size_reduction_percent": round((1 - output_size / original_size) * 100, 2)
            }, indent=2)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Image resize failed: {str(e)}"
        }, indent=2)


@mcp.tool()
async def crop_image(
    input_path: str,
    output_path: str,
    x: Annotated[int, Field(description="X coordinate of top-left corner")] = 0,
    y: Annotated[int, Field(description="Y coordinate of top-left corner")] = 0,
    width: Annotated[int, Field(description="Width of crop area")],
    height: Annotated[int, Field(description="Height of crop area")]
) -> str:
    """Crop an image to specified dimensions and position.

    This tool crops images to a rectangular region, useful for extracting
    specific areas or creating thumbnails.

    Args:
        input_path: Path to the input image file
        output_path: Path for the cropped output image
        x: X coordinate of the top-left corner of crop area
        y: Y coordinate of the top-left corner of crop area
        width: Width of the crop area in pixels
        height: Height of the crop area in pixels

    Returns:
        JSON string with crop operation result
    """
    if not _check_wand_installed():
        return json.dumps({
            "success": False,
            "error": "Wand (ImageMagick Python bindings) is not installed. Install with: pip install Wand"
        }, indent=2)

    try:
        from wand.image import Image

        if not os.path.exists(input_path):
            return json.dumps({
                "success": False,
                "error": f"Input file not found: {input_path}"
            }, indent=2)

        with Image(filename=input_path) as img:
            original_width = img.width
            original_height = img.height

            # Validate crop dimensions
            if x + width > original_width or y + height > original_height:
                return json.dumps({
                    "success": False,
                    "error": f"Crop area exceeds image bounds. Image size: {original_width}x{original_height}"
                }, indent=2)

            img.crop(left=x, top=y, width=width, height=height)
            img.save(filename=output_path)

            return json.dumps({
                "success": True,
                "input_file": input_path,
                "output_file": output_path,
                "original_dimensions": f"{original_width}x{original_height}",
                "crop_area": f"{width}x{height} at ({x},{y})",
                "cropped_dimensions": f"{img.width}x{img.height}"
            }, indent=2)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Image crop failed: {str(e)}"
        }, indent=2)


@mcp.tool()
async def rotate_image(
    input_path: str,
    output_path: str,
    degrees: Annotated[float, Field(description="Degrees to rotate (positive = clockwise, negative = counter-clockwise)")],
    background_color: Annotated[str, Field(description="Background color for empty areas (e.g., 'white', '#ffffff')")] = "white"
) -> str:
    """Rotate an image by specified degrees.

    This tool rotates images around their center point, with customizable
    background color for exposed areas.

    Args:
        input_path: Path to the input image file
        output_path: Path for the rotated output image
        degrees: Rotation angle in degrees (positive = clockwise)
        background_color: Background color for empty areas after rotation

    Returns:
        JSON string with rotation operation result
    """
    if not _check_wand_installed():
        return json.dumps({
            "success": False,
            "error": "Wand (ImageMagick Python bindings) is not installed. Install with: pip install Wand"
        }, indent=2)

    try:
        from wand.image import Image

        if not os.path.exists(input_path):
            return json.dumps({
                "success": False,
                "error": f"Input file not found: {input_path}"
            }, indent=2)

        with Image(filename=input_path) as img:
            original_dims = f"{img.width}x{img.height}"

            img.background_color = background_color
            img.rotate(degree=degrees)
            img.save(filename=output_path)

            return json.dumps({
                "success": True,
                "input_file": input_path,
                "output_file": output_path,
                "rotation_degrees": degrees,
                "background_color": background_color,
                "original_dimensions": original_dims,
                "new_dimensions": f"{img.width}x{img.height}"
            }, indent=2)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Image rotation failed: {str(e)}"
        }, indent=2)


@mcp.tool()
async def convert_format(
    input_path: str,
    output_path: str,
    output_format: Annotated[str, Field(description="Output format (jpg, png, webp, gif, bmp, tiff)")],
    quality: Annotated[int, Field(description="Quality for lossy formats (1-100, higher is better)")] = 85
) -> str:
    """Convert image to different format.

    This tool converts images between various formats, with quality control
    for lossy formats like JPEG and WebP.

    Args:
        input_path: Path to the input image file
        output_path: Path for the converted output image
        output_format: Target format (jpg, png, webp, gif, bmp, tiff)
        quality: Quality setting for lossy formats (1-100)

    Returns:
        JSON string with conversion operation result
    """
    if not _check_wand_installed():
        return json.dumps({
            "success": False,
            "error": "Wand (ImageMagick Python bindings) is not installed. Install with: pip install Wand"
        }, indent=2)

    try:
        from wand.image import Image

        if not os.path.exists(input_path):
            return json.dumps({
                "success": False,
                "error": f"Input file not found: {input_path}"
            }, indent=2)

        original_size = os.path.getsize(input_path)

        with Image(filename=input_path) as img:
            original_format = img.format
            img.format = output_format.lower()

            # Set quality for lossy formats
            if output_format.lower() in ['jpg', 'jpeg', 'webp']:
                img.compression_quality = quality

            img.save(filename=output_path)
            output_size = os.path.getsize(output_path)

            return json.dumps({
                "success": True,
                "input_file": input_path,
                "output_file": output_path,
                "original_format": original_format,
                "new_format": output_format.upper(),
                "quality": quality if output_format.lower() in ['jpg', 'jpeg', 'webp'] else "N/A",
                "original_size_kb": round(original_size / 1024, 2),
                "new_size_kb": round(output_size / 1024, 2),
                "size_change_percent": round((output_size / original_size - 1) * 100, 2)
            }, indent=2)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Format conversion failed: {str(e)}"
        }, indent=2)


@mcp.tool()
async def add_watermark(
    input_path: str,
    output_path: str,
    watermark_text: Annotated[Optional[str], Field(description="Text to use as watermark")] = None,
    watermark_image_path: Annotated[Optional[str], Field(description="Path to watermark image")] = None,
    position: Annotated[str, Field(description="Position: top-left, top-right, bottom-left, bottom-right, center")] = "bottom-right",
    opacity: Annotated[float, Field(description="Watermark opacity (0.0 to 1.0)")] = 0.5,
    font_size: Annotated[int, Field(description="Font size for text watermark")] = 40
) -> str:
    """Add text or image watermark to an image.

    This tool adds watermarks to protect images or add branding, supporting
    both text and image watermarks with positioning and opacity control.

    Args:
        input_path: Path to the input image file
        output_path: Path for the watermarked output image
        watermark_text: Text to use as watermark (if not using image)
        watermark_image_path: Path to watermark image file
        position: Watermark position (top-left, top-right, bottom-left, bottom-right, center)
        opacity: Watermark opacity (0.0 = transparent, 1.0 = opaque)
        font_size: Font size for text watermarks

    Returns:
        JSON string with watermark operation result
    """
    if not _check_wand_installed():
        return json.dumps({
            "success": False,
            "error": "Wand (ImageMagick Python bindings) is not installed. Install with: pip install Wand"
        }, indent=2)

    try:
        from wand.image import Image
        from wand.drawing import Drawing
        from wand.color import Color

        if not os.path.exists(input_path):
            return json.dumps({
                "success": False,
                "error": f"Input file not found: {input_path}"
            }, indent=2)

        if not watermark_text and not watermark_image_path:
            return json.dumps({
                "success": False,
                "error": "Must specify either watermark_text or watermark_image_path"
            }, indent=2)

        with Image(filename=input_path) as img:
            if watermark_image_path:
                # Image watermark
                if not os.path.exists(watermark_image_path):
                    return json.dumps({
                        "success": False,
                        "error": f"Watermark image not found: {watermark_image_path}"
                    }, indent=2)

                with Image(filename=watermark_image_path) as watermark:
                    # Set opacity
                    watermark.alpha_channel = 'activate'
                    watermark.evaluate(operator='multiply', value=opacity, channel='alpha')

                    # Calculate position
                    x, y = _calculate_watermark_position(
                        img.width, img.height,
                        watermark.width, watermark.height,
                        position
                    )

                    img.composite(watermark, left=x, top=y)

            else:
                # Text watermark
                with Drawing() as draw:
                    draw.font_size = font_size
                    draw.fill_color = Color(f'rgba(255, 255, 255, {opacity})')
                    draw.stroke_color = Color(f'rgba(0, 0, 0, {opacity * 0.5})')
                    draw.stroke_width = 2

                    # Get text dimensions
                    metrics = draw.get_font_metrics(img, watermark_text)
                    text_width = int(metrics.text_width)
                    text_height = int(metrics.text_height)

                    # Calculate position
                    x, y = _calculate_watermark_position(
                        img.width, img.height,
                        text_width, text_height,
                        position
                    )

                    draw.text(x, y + text_height, watermark_text)
                    draw(img)

            img.save(filename=output_path)

            return json.dumps({
                "success": True,
                "input_file": input_path,
                "output_file": output_path,
                "watermark_type": "image" if watermark_image_path else "text",
                "watermark_content": watermark_image_path or watermark_text,
                "position": position,
                "opacity": opacity
            }, indent=2)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Watermark addition failed: {str(e)}"
        }, indent=2)


def _calculate_watermark_position(
    img_width: int,
    img_height: int,
    wm_width: int,
    wm_height: int,
    position: str
) -> Tuple[int, int]:
    """Calculate watermark position coordinates."""
    margin = 20

    positions = {
        "top-left": (margin, margin),
        "top-right": (img_width - wm_width - margin, margin),
        "bottom-left": (margin, img_height - wm_height - margin),
        "bottom-right": (img_width - wm_width - margin, img_height - wm_height - margin),
        "center": ((img_width - wm_width) // 2, (img_height - wm_height) // 2)
    }

    return positions.get(position, positions["bottom-right"])


@mcp.tool()
async def optimize_image(
    input_path: str,
    output_path: str,
    quality: Annotated[int, Field(description="Optimization quality (1-100, lower = smaller file)")] = 85,
    strip_metadata: Annotated[bool, Field(description="Remove EXIF and other metadata")] = True,
    progressive: Annotated[bool, Field(description="Use progressive encoding (for JPEG)")] = True
) -> str:
    """Optimize image file size while maintaining visual quality.

    This tool reduces image file size through compression, metadata removal,
    and encoding optimization without significantly affecting visual quality.

    Args:
        input_path: Path to the input image file
        output_path: Path for the optimized output image
        quality: Compression quality (1-100, lower = smaller file)
        strip_metadata: Whether to remove EXIF and metadata
        progressive: Use progressive encoding for JPEG

    Returns:
        JSON string with optimization result and statistics
    """
    if not _check_wand_installed():
        return json.dumps({
            "success": False,
            "error": "Wand (ImageMagick Python bindings) is not installed. Install with: pip install Wand"
        }, indent=2)

    try:
        from wand.image import Image

        if not os.path.exists(input_path):
            return json.dumps({
                "success": False,
                "error": f"Input file not found: {input_path}"
            }, indent=2)

        original_size = os.path.getsize(input_path)

        with Image(filename=input_path) as img:
            # Set compression quality
            img.compression_quality = quality

            # Strip metadata if requested
            if strip_metadata:
                img.strip()

            # Use progressive encoding for JPEG
            if progressive and img.format.lower() in ['jpeg', 'jpg']:
                img.interlace_scheme = 'plane'

            img.save(filename=output_path)
            output_size = os.path.getsize(output_path)

            return json.dumps({
                "success": True,
                "input_file": input_path,
                "output_file": output_path,
                "quality": quality,
                "metadata_stripped": strip_metadata,
                "progressive": progressive,
                "original_size_kb": round(original_size / 1024, 2),
                "optimized_size_kb": round(output_size / 1024, 2),
                "size_reduction_kb": round((original_size - output_size) / 1024, 2),
                "compression_ratio": round((1 - output_size / original_size) * 100, 2)
            }, indent=2)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Image optimization failed: {str(e)}"
        }, indent=2)


@mcp.tool()
async def batch_process_images(
    input_directory: str,
    output_directory: str,
    operation: Annotated[str, Field(description="Operation: resize, convert, optimize")],
    file_pattern: Annotated[str, Field(description="File pattern to match (e.g., '*.jpg', '*.png')")] = "*.*",
    **kwargs
) -> str:
    """Batch process multiple images in a directory.

    This tool applies image processing operations to multiple files at once,
    useful for processing large collections of images efficiently.

    Args:
        input_directory: Path to directory containing input images
        output_directory: Path to directory for output images
        operation: Operation to perform (resize, convert, optimize)
        file_pattern: Glob pattern to match files (e.g., '*.jpg')
        **kwargs: Additional parameters for the specific operation

    Returns:
        JSON string with batch processing results
    """
    if not _check_wand_installed():
        return json.dumps({
            "success": False,
            "error": "Wand (ImageMagick Python bindings) is not installed. Install with: pip install Wand"
        }, indent=2)

    try:
        from pathlib import Path

        input_dir = Path(input_directory)
        output_dir = Path(output_directory)

        if not input_dir.exists():
            return json.dumps({
                "success": False,
                "error": f"Input directory not found: {input_directory}"
            }, indent=2)

        # Create output directory if it doesn't exist
        output_dir.mkdir(parents=True, exist_ok=True)

        # Find matching files
        files = list(input_dir.glob(file_pattern))

        if not files:
            return json.dumps({
                "success": False,
                "error": f"No files found matching pattern: {file_pattern}"
            }, indent=2)

        results = {
            "total_files": len(files),
            "processed": 0,
            "failed": 0,
            "files": []
        }

        for file_path in files:
            output_path = output_dir / file_path.name

            try:
                # Call appropriate operation
                if operation == "resize":
                    result = await resize_image(
                        str(file_path),
                        str(output_path),
                        **kwargs
                    )
                elif operation == "convert":
                    result = await convert_format(
                        str(file_path),
                        str(output_path),
                        **kwargs
                    )
                elif operation == "optimize":
                    result = await optimize_image(
                        str(file_path),
                        str(output_path),
                        **kwargs
                    )
                else:
                    results["files"].append({
                        "file": str(file_path),
                        "success": False,
                        "error": f"Unknown operation: {operation}"
                    })
                    results["failed"] += 1
                    continue

                result_data = json.loads(result)
                if result_data.get("success"):
                    results["processed"] += 1
                else:
                    results["failed"] += 1

                results["files"].append({
                    "file": str(file_path),
                    "success": result_data.get("success"),
                    "output": str(output_path) if result_data.get("success") else None,
                    "error": result_data.get("error")
                })

            except Exception as e:
                results["failed"] += 1
                results["files"].append({
                    "file": str(file_path),
                    "success": False,
                    "error": str(e)
                })

        return json.dumps({
            "success": True,
            "operation": operation,
            "input_directory": input_directory,
            "output_directory": output_directory,
            "pattern": file_pattern,
            "summary": results
        }, indent=2)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": f"Batch processing failed: {str(e)}"
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
    """Main entry point for the ImageMagick MCP server."""
    mcp_server = mcp._mcp_server

    import argparse

    parser = argparse.ArgumentParser(description='Run ImageMagick MCP server with configurable transport')
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
