# Resend MCP Server

A Model Context Protocol (MCP) server for transactional email functionality using Resend API. This server enables AI assistants to send emails, manage templates, track delivery, and verify domains.

## Features

- **Email Sending**: Send transactional emails with HTML/text content
- **Batch Emails**: Send personalized emails to multiple recipients
- **Templates**: Create and manage reusable email templates
- **Delivery Tracking**: Track email delivery status and events
- **Domain Management**: Add, verify, and manage sending domains
- **Analytics**: Access email delivery statistics and metrics

## Installation

### Using uv (recommended)

```bash
cd mcp-servers/resend-mcp
uv pip install -e .
```

### Using pip

```bash
cd mcp-servers/resend-mcp
pip install -e .
```

## Configuration

Set your Resend API key as an environment variable:

```bash
export RESEND_API_KEY="re_your_api_key_here"
```

Get your API key from: https://resend.com/api-keys

## Usage

### Running with stdio transport (default)

```bash
resend-mcp
```

### Running with SSE transport

```bash
resend-mcp --transport sse --host 0.0.0.0 --port 8080
```

## MCP Configuration

Add to your Claude Desktop or MCP client configuration:

```json
{
  "mcpServers": {
    "resend": {
      "command": "resend-mcp",
      "env": {
        "RESEND_API_KEY": "re_your_api_key_here"
      }
    }
  }
}
```

## Available Tools

### 1. send_email

Send a transactional email with full customization options.

**Parameters:**
- `from_email` (required): Sender email address (must use verified domain)
- `to_email` (required): Recipient email(s), comma-separated
- `subject` (required): Email subject line
- `html` (optional): HTML email content
- `text` (optional): Plain text content
- `cc` (optional): CC recipients, comma-separated
- `bcc` (optional): BCC recipients, comma-separated
- `reply_to` (optional): Reply-to email address
- `tags` (optional): Tags for analytics (format: "key1:value1,key2:value2")

**Example:**
```json
{
  "from_email": "noreply@yourdomain.com",
  "to_email": "user@example.com",
  "subject": "Welcome to Our Service",
  "html": "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
  "tags": "campaign:welcome,type:onboarding"
}
```

### 2. get_email_status

Track the delivery status of a sent email.

**Parameters:**
- `email_id` (required): Email ID returned from send_email

**Example:**
```json
{
  "email_id": "abc123def456"
}
```

### 3. send_batch_emails

Send personalized emails to multiple recipients efficiently.

**Parameters:**
- `from_email` (required): Sender email address
- `recipients` (required): JSON array of recipient objects
- `subject` (required): Email subject (supports variables)
- `html` (optional): HTML content (supports variables)
- `text` (optional): Plain text content (supports variables)

**Example:**
```json
{
  "from_email": "noreply@yourdomain.com",
  "recipients": "[{\"email\":\"user1@example.com\",\"variables\":{\"name\":\"Alice\"}},{\"email\":\"user2@example.com\",\"variables\":{\"name\":\"Bob\"}}]",
  "subject": "Hello {{name}}!",
  "html": "<p>Hi {{name}}, welcome to our service!</p>"
}
```

### 4. create_template

Create a reusable email template with variable support.

**Parameters:**
- `name` (required): Template identifier
- `subject` (required): Subject line (supports {{variables}})
- `html` (optional): HTML content (supports {{variables}})
- `text` (optional): Plain text content (supports {{variables}})

**Example:**
```json
{
  "name": "welcome_email",
  "subject": "Welcome {{name}}!",
  "html": "<h1>Hello {{name}}!</h1><p>Welcome to {{company_name}}.</p>"
}
```

### 5. verify_domain

Check domain verification status and get DNS records.

**Parameters:**
- `domain` (required): Domain to verify (e.g., "yourdomain.com")

**Example:**
```json
{
  "domain": "yourdomain.com"
}
```

### 6. add_domain

Add a new domain for email sending.

**Parameters:**
- `domain` (required): Domain to add
- `region` (optional): AWS region (default: "us-east-1")

**Example:**
```json
{
  "domain": "yourdomain.com",
  "region": "us-east-1"
}
```

### 7. list_domains

List all configured domains and their verification status.

**Example:**
```json
{}
```

### 8. get_analytics

Get email analytics and delivery statistics.

**Parameters:**
- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Example:**
```json
{
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

## Domain Verification

Before sending emails, you must verify your domain:

1. Add your domain using `add_domain`
2. Add the provided DNS records to your domain's DNS settings
3. Wait for DNS propagation (can take up to 48 hours)
4. Check verification status with `verify_domain`

Required DNS records (example):
- **SPF**: TXT record for root domain
- **DKIM**: CNAME records for domain keys
- **DMARC**: TXT record for email authentication

## Best Practices

1. **Domain Verification**: Always verify domains before sending
2. **Email Validation**: Validate recipient emails before sending
3. **Rate Limits**: Be aware of Resend API rate limits
4. **Error Handling**: Check response status for all operations
5. **Analytics Tags**: Use tags for better email tracking
6. **Templates**: Use templates for consistent messaging

## Rate Limits

Resend API rate limits vary by plan:
- **Free**: 100 emails/day
- **Pro**: 50,000 emails/month
- **Enterprise**: Custom limits

## Error Handling

All tools return JSON responses with `success` field:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error description"
}
```

## Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=resend_mcp
```

## Development

```bash
# Install development dependencies
uv pip install -e ".[dev]"

# Format code
black src/

# Type checking
mypy src/

# Linting
isort src/
```

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference/introduction)
- [MCP Protocol](https://modelcontextprotocol.io)
- [FastMCP Framework](https://github.com/jlowin/fastmcp)

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Resend Support: https://resend.com/support
- MCP Documentation: https://modelcontextprotocol.io
- GitHub Issues: https://github.com/paulieffect/resend-mcp/issues
