# ImageMagick MCP Server

A Model Context Protocol (MCP) server that provides comprehensive image manipulation capabilities through ImageMagick. This server enables AI assistants to perform professional-grade image processing tasks.

## Features

### Image Processing Tools

- **resize_image** - Resize images by dimensions or percentage
- **crop_image** - Crop images to specific regions
- **rotate_image** - Rotate images with custom background colors
- **convert_format** - Convert between image formats with quality control
- **add_watermark** - Add text or image watermarks
- **optimize_image** - Reduce file size while maintaining quality
- **batch_process_images** - Process multiple images at once

### Supported Formats

**Input/Output:** JPG, PNG, WebP, GIF, BMP, TIFF, SVG, and many more

## Prerequisites

**ImageMagick must be installed on your system.**

### Installation Instructions

**macOS:**
```bash
brew install imagemagick
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install imagemagick libmagickwand-dev
```

**Windows:**
Download from [imagemagick.org](https://imagemagick.org/script/download.php) or use:
```powershell
choco install imagemagick
```

**Verify installation:**
```bash
magick -version
```

## Installation

### Using uv (recommended)
```bash
cd pauli-comic-funnel-main/mcp-servers/imagemagick-mcp
uv pip install -e .
```

### Using pip
```bash
cd pauli-comic-funnel-main/mcp-servers/imagemagick-mcp
pip install -e .
```

This will install the Wand Python bindings for ImageMagick along with other dependencies.

## Usage

### Running the Server

**Stdio mode (for MCP clients):**
```bash
imagemagick-mcp
```

**HTTP/SSE mode (for web integration):**
```bash
imagemagick-mcp --transport sse --host 0.0.0.0 --port 8082
```

### MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "imagemagick": {
      "command": "imagemagick-mcp"
    }
  }
}
```

Or for SSE mode:
```json
{
  "mcpServers": {
    "imagemagick": {
      "url": "http://localhost:8082/sse"
    }
  }
}
```

## Tool Examples

### 1. Resize Image

Resize by width, maintaining aspect ratio:

```python
{
  "tool": "resize_image",
  "arguments": {
    "input_path": "/path/to/image.jpg",
    "output_path": "/path/to/resized.jpg",
    "width": 1920,
    "maintain_aspect": true
  }
}
```

Resize by percentage:

```python
{
  "tool": "resize_image",
  "arguments": {
    "input_path": "/path/to/image.jpg",
    "output_path": "/path/to/smaller.jpg",
    "percentage": 50
  }
}
```

Resize to exact dimensions:

```python
{
  "tool": "resize_image",
  "arguments": {
    "input_path": "/path/to/image.jpg",
    "output_path": "/path/to/exact.jpg",
    "width": 800,
    "height": 600,
    "maintain_aspect": false
  }
}
```

### 2. Crop Image

Crop to specific region:

```python
{
  "tool": "crop_image",
  "arguments": {
    "input_path": "/path/to/image.jpg",
    "output_path": "/path/to/cropped.jpg",
    "x": 100,
    "y": 100,
    "width": 800,
    "height": 600
  }
}
```

### 3. Rotate Image

Rotate 90 degrees clockwise:

```python
{
  "tool": "rotate_image",
  "arguments": {
    "input_path": "/path/to/image.jpg",
    "output_path": "/path/to/rotated.jpg",
    "degrees": 90,
    "background_color": "white"
  }
}
```

### 4. Convert Format

Convert PNG to WebP:

```python
{
  "tool": "convert_format",
  "arguments": {
    "input_path": "/path/to/image.png",
    "output_path": "/path/to/image.webp",
    "output_format": "webp",
    "quality": 85
  }
}
```

**Supported Formats:**
- `jpg/jpeg` - Universal compatibility
- `png` - Lossless, supports transparency
- `webp` - Modern, efficient format
- `gif` - Animations and transparency
- `bmp` - Uncompressed bitmap
- `tiff` - Professional/print quality

### 5. Add Watermark

Text watermark:

```python
{
  "tool": "add_watermark",
  "arguments": {
    "input_path": "/path/to/image.jpg",
    "output_path": "/path/to/watermarked.jpg",
    "watermark_text": "© 2024 My Company",
    "position": "bottom-right",
    "opacity": 0.5,
    "font_size": 40
  }
}
```

Image watermark:

```python
{
  "tool": "add_watermark",
  "arguments": {
    "input_path": "/path/to/image.jpg",
    "output_path": "/path/to/watermarked.jpg",
    "watermark_image_path": "/path/to/logo.png",
    "position": "bottom-right",
    "opacity": 0.7
  }
}
```

**Position Options:**
- `top-left`
- `top-right`
- `bottom-left`
- `bottom-right`
- `center`

### 6. Optimize Image

Optimize for web:

```python
{
  "tool": "optimize_image",
  "arguments": {
    "input_path": "/path/to/image.jpg",
    "output_path": "/path/to/optimized.jpg",
    "quality": 85,
    "strip_metadata": true,
    "progressive": true
  }
}
```

### 7. Batch Process Images

Batch resize all JPGs in a directory:

```python
{
  "tool": "batch_process_images",
  "arguments": {
    "input_directory": "/path/to/images",
    "output_directory": "/path/to/resized",
    "operation": "resize",
    "file_pattern": "*.jpg",
    "width": 1920,
    "maintain_aspect": true
  }
}
```

Batch convert to WebP:

```python
{
  "tool": "batch_process_images",
  "arguments": {
    "input_directory": "/path/to/images",
    "output_directory": "/path/to/webp",
    "operation": "convert",
    "file_pattern": "*.png",
    "output_format": "webp",
    "quality": 85
  }
}
```

Batch optimize:

```python
{
  "tool": "batch_process_images",
  "arguments": {
    "input_directory": "/path/to/images",
    "output_directory": "/path/to/optimized",
    "operation": "optimize",
    "file_pattern": "*.*",
    "quality": 85,
    "strip_metadata": true
  }
}
```

## Optimization Strategies

### 1. Web Optimization Pipeline

Optimal settings for web delivery:

```python
# Step 1: Convert to WebP
convert_format(
    input_path="original.png",
    output_path="web.webp",
    output_format="webp",
    quality=85
)

# Step 2: Create fallback JPEG
convert_format(
    input_path="original.png",
    output_path="web.jpg",
    output_format="jpg",
    quality=85
)

# Step 3: Optimize both
optimize_image(
    input_path="web.webp",
    output_path="web-optimized.webp",
    quality=85,
    strip_metadata=True
)
```

### 2. Responsive Image Generation

Create multiple sizes for responsive design:

```python
sizes = [
    (1920, "xl"),
    (1280, "lg"),
    (768, "md"),
    (480, "sm")
]

for width, label in sizes:
    resize_image(
        input_path="original.jpg",
        output_path=f"image-{label}.jpg",
        width=width,
        maintain_aspect=True
    )
```

### 3. Thumbnail Generation

Create consistent thumbnails:

```python
# Square crop from center
crop_image(
    input_path="photo.jpg",
    output_path="temp.jpg",
    x=200, y=100,  # Adjust based on image
    width=800, height=800
)

# Resize to thumbnail size
resize_image(
    input_path="temp.jpg",
    output_path="thumbnail.jpg",
    width=300, height=300,
    maintain_aspect=False
)
```

### 4. Branding Workflow

Add watermark to all images:

```python
batch_process_images(
    input_directory="/photos",
    output_directory="/branded",
    operation="watermark",
    file_pattern="*.jpg",
    watermark_text="© 2024 Company Name",
    position="bottom-right",
    opacity=0.6
)
```

### 5. Format Migration

Convert entire library to modern formats:

```python
# Convert all PNGs to WebP
batch_process_images(
    input_directory="/images/png",
    output_directory="/images/webp",
    operation="convert",
    file_pattern="*.png",
    output_format="webp",
    quality=90
)
```

## Error Handling

All tools return JSON responses with success indicators:

```json
{
  "success": true,
  "input_file": "/path/to/input.jpg",
  "output_file": "/path/to/output.jpg",
  "original_dimensions": "3000x2000",
  "new_dimensions": "1920x1280",
  "compression_ratio": 65.5
}
```

On error:
```json
{
  "success": false,
  "error": "Input file not found: /path/to/missing.jpg"
}
```

## Performance Tips

1. **Batch processing**: Use `batch_process_images` for multiple files
2. **Quality settings**: 85 is optimal for most web images
3. **Progressive JPEG**: Enable for better perceived loading
4. **WebP format**: 25-35% smaller than JPEG at same quality
5. **Strip metadata**: Reduces file size significantly
6. **Resize before processing**: Smaller images process faster

## Best Practices

### Image Optimization
- Use WebP for modern browsers, JPEG as fallback
- Quality 85 is sweet spot for file size vs quality
- Always strip metadata for web images
- Enable progressive encoding for JPEGs

### Watermarking
- Use 40-60% opacity for subtle watermarks
- Position in bottom-right or across center
- Keep text concise and readable
- Use PNG logos with transparency

### Batch Processing
- Test on single image first
- Use specific file patterns to avoid mistakes
- Keep originals in separate directory
- Verify output before deleting originals

### Format Selection
- **JPEG**: Photos, complex images
- **PNG**: Graphics, transparency needed
- **WebP**: Modern web, best compression
- **GIF**: Simple animations only
- **TIFF**: Archival, professional print

## Troubleshooting

**Wand/ImageMagick not found:**
- Ensure ImageMagick is installed: `magick -version`
- On Linux, install libmagickwand-dev
- Reinstall Wand: `pip install --force-reinstall Wand`

**Out of memory errors:**
- Process large images in smaller batches
- Resize before other operations
- Increase system memory allocation

**Quality issues:**
- Use higher quality settings (90-95)
- Avoid multiple re-compressions
- Use lossless formats (PNG, TIFF) for intermediate steps

**Slow processing:**
- Resize images before other operations
- Use batch processing for multiple files
- Consider parallelization for large batches

## Development

### Project Structure
```
imagemagick-mcp/
├── src/
│   └── imagemagick_mcp/
│       ├── __init__.py
│       └── server.py
├── pyproject.toml
├── requirements.txt
└── README.md
```

### Running Tests
```bash
pytest
```

### Code Quality
```bash
black src/
isort src/
mypy src/
```

## License

MIT License - See project repository for details

## Contributing

Contributions welcome! This server is part of The Pauli Effect project.

## Support

For issues and feature requests, please use the project's issue tracker.
