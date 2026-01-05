# FFmpeg MCP Server

A Model Context Protocol (MCP) server that provides video and audio processing capabilities through FFmpeg. This server enables AI assistants to perform professional-grade media manipulation tasks.

## Features

### Video Processing Tools

- **convert_video_format** - Convert videos between formats with codec and quality control
- **compress_video** - Reduce video file size with bitrate/resolution optimization
- **generate_thumbnail** - Extract frame images at specific timestamps
- **extract_audio** - Extract audio tracks from videos
- **get_video_info** - Analyze video files and extract metadata

### Supported Formats

**Video:** MP4, WebM, MKV, AVI, MOV, FLV, and more
**Audio:** MP3, AAC, WAV, FLAC, Opus, OGG
**Images:** JPG, PNG, BMP (for thumbnails)

## Prerequisites

**FFmpeg must be installed and available in your system PATH.**

### Installation Instructions

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) or use:
```powershell
choco install ffmpeg
```

**Verify installation:**
```bash
ffmpeg -version
```

## Installation

### Using uv (recommended)
```bash
cd pauli-comic-funnel-main/mcp-servers/ffmpeg-mcp
uv pip install -e .
```

### Using pip
```bash
cd pauli-comic-funnel-main/mcp-servers/ffmpeg-mcp
pip install -e .
```

## Usage

### Running the Server

**Stdio mode (for MCP clients):**
```bash
ffmpeg-mcp
```

**HTTP/SSE mode (for web integration):**
```bash
ffmpeg-mcp --transport sse --host 0.0.0.0 --port 8081
```

### MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "ffmpeg": {
      "command": "ffmpeg-mcp"
    }
  }
}
```

Or for SSE mode:
```json
{
  "mcpServers": {
    "ffmpeg": {
      "url": "http://localhost:8081/sse"
    }
  }
}
```

## Tool Examples

### 1. Convert Video Format

Convert a video to MP4 with H.264 codec:

```python
{
  "tool": "convert_video_format",
  "arguments": {
    "input_path": "/path/to/input.avi",
    "output_path": "/path/to/output.mp4",
    "output_format": "mp4",
    "video_codec": "libx264",
    "audio_codec": "aac",
    "quality": "high"
  }
}
```

**Quality Options:**
- `low` - CRF 28 (smaller file, lower quality)
- `medium` - CRF 23 (balanced)
- `high` - CRF 18 (larger file, better quality)
- Or specify CRF directly: `"18"` (0-51, lower is better)

### 2. Compress Video

Reduce video size by targeting specific bitrate:

```python
{
  "tool": "compress_video",
  "arguments": {
    "input_path": "/path/to/large-video.mp4",
    "output_path": "/path/to/compressed.mp4",
    "bitrate": "1M",
    "scale": "1280:720"
  }
}
```

Target a specific file size:

```python
{
  "tool": "compress_video",
  "arguments": {
    "input_path": "/path/to/large-video.mp4",
    "output_path": "/path/to/compressed.mp4",
    "target_size_mb": 50
  }
}
```

### 3. Generate Thumbnail

Extract a thumbnail at 5 seconds:

```python
{
  "tool": "generate_thumbnail",
  "arguments": {
    "input_path": "/path/to/video.mp4",
    "output_path": "/path/to/thumbnail.jpg",
    "timestamp": "00:00:05",
    "width": 1280,
    "height": -1
  }
}
```

**Timestamp Formats:**
- Seconds: `"5"` or `"30"`
- Time format: `"00:00:05"` or `"00:01:30"`

### 4. Extract Audio

Extract audio as MP3:

```python
{
  "tool": "extract_audio",
  "arguments": {
    "input_path": "/path/to/video.mp4",
    "output_path": "/path/to/audio.mp3",
    "audio_format": "mp3",
    "bitrate": "192k"
  }
}
```

**Audio Formats:**
- `mp3` - Universal compatibility
- `aac` - High quality, smaller files
- `flac` - Lossless compression
- `wav` - Uncompressed
- `opus` - Modern, efficient codec

### 5. Get Video Information

Analyze video file metadata:

```python
{
  "tool": "get_video_info",
  "arguments": {
    "input_path": "/path/to/video.mp4"
  }
}
```

**Returns:**
- Duration, file size, bitrate
- Video: codec, resolution, frame rate
- Audio: codec, sample rate, channels

## Asset Management Strategies

### 1. Batch Processing

Process multiple videos by calling tools in sequence:

```python
videos = ["video1.mp4", "video2.mp4", "video3.mp4"]
for video in videos:
    convert_video_format(
        input_path=video,
        output_path=video.replace(".mp4", "_converted.webm"),
        output_format="webm",
        quality="medium"
    )
```

### 2. Streaming Optimization

For web delivery, always use MP4 with faststart:

```python
convert_video_format(
    input_path="source.mov",
    output_path="web-ready.mp4",
    output_format="mp4",
    video_codec="libx264",
    quality="medium"
)
# Automatically adds -movflags +faststart for streaming
```

### 3. Multi-Resolution Encoding

Create multiple versions for adaptive streaming:

```python
resolutions = [
    ("1920:1080", "1080p", "5M"),
    ("1280:720", "720p", "2.5M"),
    ("854:480", "480p", "1M")
]

for scale, label, bitrate in resolutions:
    compress_video(
        input_path="source.mp4",
        output_path=f"output_{label}.mp4",
        scale=scale,
        bitrate=bitrate
    )
```

### 4. Thumbnail Generation Strategy

Generate thumbnails at key moments:

```python
timestamps = ["00:00:01", "00:00:30", "00:01:00", "00:02:00"]
for i, ts in enumerate(timestamps):
    generate_thumbnail(
        input_path="video.mp4",
        output_path=f"thumb_{i+1}.jpg",
        timestamp=ts,
        width=1280
    )
```

### 5. Quality vs Size Optimization

Find optimal quality/size balance:

```python
# Step 1: Get original info
info = get_video_info(input_path="original.mp4")

# Step 2: Compress to target size
compress_video(
    input_path="original.mp4",
    output_path="compressed.mp4",
    target_size_mb=original_size_mb * 0.3  # 30% of original
)

# Step 3: Verify quality
verify_info = get_video_info(input_path="compressed.mp4")
```

## Error Handling

All tools return JSON responses with success indicators:

```json
{
  "success": true,
  "input_file": "/path/to/input.mp4",
  "output_file": "/path/to/output.mp4",
  "format": "mp4",
  "compression_ratio": 45.2
}
```

On error:
```json
{
  "success": false,
  "error": "FFmpeg is not installed or not found in PATH"
}
```

## Performance Tips

1. **Use appropriate codecs**: H.264 for compatibility, H.265/HEVC for better compression
2. **Batch operations**: Process multiple files in parallel for efficiency
3. **CRF vs Bitrate**: Use CRF for variable quality, bitrate for predictable file sizes
4. **Resolution scaling**: Reduce resolution before bitrate for better visual quality
5. **Audio optimization**: 128k AAC is sufficient for most web content

## Troubleshooting

**FFmpeg not found:**
- Ensure FFmpeg is installed and in your system PATH
- Test with: `ffmpeg -version`

**Command timeout:**
- Large files may take time to process
- Timeout is set to 600 seconds (10 minutes) for conversions
- Consider compressing or splitting very large files

**Quality issues:**
- Use higher CRF values (lower numbers = better quality)
- Avoid scaling down resolution too much
- Check original video quality before conversion

## Development

### Project Structure
```
ffmpeg-mcp/
├── src/
│   └── ffmpeg_mcp/
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
