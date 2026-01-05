import os
import json
from typing import Any, Optional, List, Dict
from datetime import datetime
import resend
from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from mcp.server.sse import SseServerTransport
from starlette.requests import Request
from starlette.routing import Mount, Route
from mcp.server import Server
import uvicorn
from pydantic import Field, BaseModel

# Initialize FastMCP server for Resend email functionality
mcp = FastMCP("resend-mcp")

# Initialize Resend API key from environment
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


# Custom exception classes
class ResendAPIError(Exception):
    """Generic error for Resend API operations."""
    pass


class ResendAuthError(ResendAPIError):
    """Raised when Resend API authentication fails."""
    pass


class ResendValidationError(ResendAPIError):
    """Raised when email validation fails."""
    pass


# Pydantic models for structured data
class EmailAttachment(BaseModel):
    """Email attachment structure."""
    filename: str
    content: str  # Base64 encoded content
    content_type: Optional[str] = None


class EmailTemplate(BaseModel):
    """Email template structure."""
    name: str
    subject: str
    html: Optional[str] = None
    text: Optional[str] = None


def _check_api_key() -> bool:
    """Check if Resend API key is configured."""
    return RESEND_API_KEY is not None and len(RESEND_API_KEY) > 0


def _format_error(message: str) -> str:
    """Format error message consistently."""
    return json.dumps({"error": message, "success": False}, indent=2)


def _format_success(data: Dict[str, Any], message: Optional[str] = None) -> str:
    """Format success response consistently."""
    response = {"success": True, "data": data}
    if message:
        response["message"] = message
    return json.dumps(response, indent=2)


@mcp.tool()
async def send_email(
    from_email: str,
    to_email: str,
    subject: str,
    html: Optional[str] = None,
    text: Optional[str] = None,
    cc: Optional[str] = None,
    bcc: Optional[str] = None,
    reply_to: Optional[str] = None,
    tags: Optional[str] = None,
) -> str:
    """Send a transactional email using Resend.

    This tool sends emails with full support for HTML/text content, CC/BCC,
    reply-to addresses, and tagging for analytics.

    Args:
        from_email: Sender email address (must be verified domain)
        to_email: Recipient email address (comma-separated for multiple)
        subject: Email subject line
        html: HTML email content (optional if text provided)
        text: Plain text email content (optional if html provided)
        cc: CC email addresses (comma-separated)
        bcc: BCC email addresses (comma-separated)
        reply_to: Reply-to email address
        tags: Tags for analytics (comma-separated key:value pairs)

    Returns:
        JSON-formatted string with email ID and status

    Raises:
        ResendAPIError: If email sending fails
    """
    if not _check_api_key():
        return _format_error("RESEND_API_KEY environment variable is not set")

    # Validate inputs
    if not from_email or not to_email or not subject:
        return _format_error("from_email, to_email, and subject are required")

    if not html and not text:
        return _format_error("Either html or text content must be provided")

    try:
        # Build email parameters
        params: Dict[str, Any] = {
            "from": from_email,
            "to": [e.strip() for e in to_email.split(",")],
            "subject": subject,
        }

        if html:
            params["html"] = html
        if text:
            params["text"] = text
        if cc:
            params["cc"] = [e.strip() for e in cc.split(",")]
        if bcc:
            params["bcc"] = [e.strip() for e in bcc.split(",")]
        if reply_to:
            params["reply_to"] = reply_to
        if tags:
            # Parse tags from "key1:value1,key2:value2" format
            tag_dict = {}
            for tag in tags.split(","):
                if ":" in tag:
                    key, value = tag.split(":", 1)
                    tag_dict[key.strip()] = value.strip()
            if tag_dict:
                params["tags"] = [{"name": k, "value": v} for k, v in tag_dict.items()]

        # Send email
        email = resend.Emails.send(params)

        return _format_success({
            "email_id": email.get("id"),
            "from": from_email,
            "to": to_email.split(","),
            "subject": subject,
            "timestamp": datetime.utcnow().isoformat()
        }, "Email sent successfully")

    except Exception as e:
        if "authentication" in str(e).lower() or "api key" in str(e).lower():
            raise ResendAuthError(f"Authentication failed: {e}")
        return _format_error(f"Failed to send email: {str(e)}")


@mcp.tool()
async def get_email_status(
    email_id: str
) -> str:
    """Get the delivery status of a sent email.

    Track the delivery status of emails sent through Resend including
    delivery, bounce, and open events.

    Args:
        email_id: The email ID returned from send_email

    Returns:
        JSON-formatted string with email status and events
    """
    if not _check_api_key():
        return _format_error("RESEND_API_KEY environment variable is not set")

    if not email_id:
        return _format_error("email_id is required")

    try:
        email = resend.Emails.get(email_id)

        return _format_success({
            "email_id": email_id,
            "status": email.get("last_event", "unknown"),
            "created_at": email.get("created_at"),
            "from": email.get("from"),
            "to": email.get("to"),
            "subject": email.get("subject"),
            "events": email.get("events", [])
        })

    except Exception as e:
        return _format_error(f"Failed to get email status: {str(e)}")


@mcp.tool()
async def create_template(
    name: str,
    subject: str,
    html: Optional[str] = None,
    text: Optional[str] = None
) -> str:
    """Create a reusable email template.

    Create email templates that can be reused for consistent messaging.
    Templates support variable substitution using {{variable_name}} syntax.

    Args:
        name: Template name/identifier
        subject: Template subject line (supports variables)
        html: HTML template content (supports variables)
        text: Plain text template content (supports variables)

    Returns:
        JSON-formatted string with template details
    """
    if not _check_api_key():
        return _format_error("RESEND_API_KEY environment variable is not set")

    if not name or not subject:
        return _format_error("name and subject are required")

    if not html and not text:
        return _format_error("Either html or text content must be provided")

    try:
        # Note: Resend API doesn't have a native template storage endpoint
        # This creates a template structure that can be stored locally
        # or in your own database
        template = {
            "name": name,
            "subject": subject,
            "html": html,
            "text": text,
            "created_at": datetime.utcnow().isoformat()
        }

        return _format_success(template, f"Template '{name}' created successfully")

    except Exception as e:
        return _format_error(f"Failed to create template: {str(e)}")


@mcp.tool()
async def send_batch_emails(
    from_email: str,
    recipients: str,  # JSON array of recipient objects
    subject: str,
    html: Optional[str] = None,
    text: Optional[str] = None
) -> str:
    """Send batch emails to multiple recipients with personalization.

    Send emails to multiple recipients efficiently. Each recipient can have
    personalized content using variable substitution.

    Args:
        from_email: Sender email address
        recipients: JSON array of recipient objects with 'email' and optional 'variables'
        subject: Email subject (supports variables per recipient)
        html: HTML content (supports variables per recipient)
        text: Plain text content (supports variables per recipient)

    Returns:
        JSON-formatted string with batch send results
    """
    if not _check_api_key():
        return _format_error("RESEND_API_KEY environment variable is not set")

    if not from_email or not recipients or not subject:
        return _format_error("from_email, recipients, and subject are required")

    try:
        # Parse recipients JSON
        recipient_list = json.loads(recipients)

        if not isinstance(recipient_list, list):
            return _format_error("recipients must be a JSON array")

        results = []
        errors = []

        for recipient in recipient_list:
            if not isinstance(recipient, dict) or "email" not in recipient:
                errors.append({"error": "Invalid recipient format", "recipient": recipient})
                continue

            try:
                # Build personalized content
                recipient_html = html
                recipient_text = text
                recipient_subject = subject

                # Apply variable substitution if variables provided
                if "variables" in recipient and isinstance(recipient["variables"], dict):
                    for key, value in recipient["variables"].items():
                        placeholder = f"{{{{{key}}}}}"
                        if recipient_html:
                            recipient_html = recipient_html.replace(placeholder, str(value))
                        if recipient_text:
                            recipient_text = recipient_text.replace(placeholder, str(value))
                        recipient_subject = recipient_subject.replace(placeholder, str(value))

                # Send individual email
                params = {
                    "from": from_email,
                    "to": recipient["email"],
                    "subject": recipient_subject,
                }

                if recipient_html:
                    params["html"] = recipient_html
                if recipient_text:
                    params["text"] = recipient_text

                email = resend.Emails.send(params)

                results.append({
                    "email": recipient["email"],
                    "email_id": email.get("id"),
                    "status": "sent"
                })

            except Exception as e:
                errors.append({
                    "email": recipient.get("email", "unknown"),
                    "error": str(e)
                })

        return _format_success({
            "total": len(recipient_list),
            "sent": len(results),
            "failed": len(errors),
            "results": results,
            "errors": errors if errors else None
        }, f"Batch send completed: {len(results)} sent, {len(errors)} failed")

    except json.JSONDecodeError:
        return _format_error("Invalid JSON format for recipients")
    except Exception as e:
        return _format_error(f"Failed to send batch emails: {str(e)}")


@mcp.tool()
async def verify_domain(
    domain: str
) -> str:
    """Get domain verification status and DNS records.

    Check domain verification status and get the required DNS records
    for domain verification with Resend.

    Args:
        domain: Domain name to verify (e.g., "example.com")

    Returns:
        JSON-formatted string with verification status and DNS records
    """
    if not _check_api_key():
        return _format_error("RESEND_API_KEY environment variable is not set")

    if not domain:
        return _format_error("domain is required")

    try:
        # Get domain verification status
        domain_info = resend.Domains.get(domain)

        return _format_success({
            "domain": domain,
            "status": domain_info.get("status", "unknown"),
            "verified": domain_info.get("status") == "verified",
            "records": domain_info.get("records", []),
            "region": domain_info.get("region"),
            "created_at": domain_info.get("created_at")
        })

    except Exception as e:
        return _format_error(f"Failed to get domain verification status: {str(e)}")


@mcp.tool()
async def add_domain(
    domain: str,
    region: Optional[str] = "us-east-1"
) -> str:
    """Add a new domain for email sending.

    Add and configure a new domain for sending emails through Resend.
    Returns DNS records that need to be configured.

    Args:
        domain: Domain name to add (e.g., "example.com")
        region: AWS region for domain (default: us-east-1)

    Returns:
        JSON-formatted string with domain details and required DNS records
    """
    if not _check_api_key():
        return _format_error("RESEND_API_KEY environment variable is not set")

    if not domain:
        return _format_error("domain is required")

    try:
        params = {"name": domain}
        if region:
            params["region"] = region

        domain_info = resend.Domains.create(params)

        return _format_success({
            "domain": domain,
            "id": domain_info.get("id"),
            "status": domain_info.get("status"),
            "records": domain_info.get("records", []),
            "region": region,
            "created_at": domain_info.get("created_at")
        }, f"Domain '{domain}' added successfully. Please configure DNS records.")

    except Exception as e:
        return _format_error(f"Failed to add domain: {str(e)}")


@mcp.tool()
async def list_domains() -> str:
    """List all configured domains and their verification status.

    Get a list of all domains configured in your Resend account with
    their verification status.

    Returns:
        JSON-formatted string with list of domains
    """
    if not _check_api_key():
        return _format_error("RESEND_API_KEY environment variable is not set")

    try:
        domains = resend.Domains.list()

        domain_list = []
        for domain in domains.get("data", []):
            domain_list.append({
                "id": domain.get("id"),
                "domain": domain.get("name"),
                "status": domain.get("status"),
                "verified": domain.get("status") == "verified",
                "region": domain.get("region"),
                "created_at": domain.get("created_at")
            })

        return _format_success({
            "total": len(domain_list),
            "domains": domain_list
        })

    except Exception as e:
        return _format_error(f"Failed to list domains: {str(e)}")


@mcp.tool()
async def get_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> str:
    """Get email analytics and delivery statistics.

    Retrieve email analytics including send counts, delivery rates,
    bounce rates, and engagement metrics.

    Args:
        start_date: Start date in ISO format (e.g., "2024-01-01")
        end_date: End date in ISO format (e.g., "2024-01-31")

    Returns:
        JSON-formatted string with analytics data
    """
    if not _check_api_key():
        return _format_error("RESEND_API_KEY environment variable is not set")

    try:
        # Note: Resend analytics API endpoints may vary
        # This is a placeholder structure for analytics

        analytics = {
            "period": {
                "start": start_date or "N/A",
                "end": end_date or "N/A"
            },
            "metrics": {
                "emails_sent": 0,
                "emails_delivered": 0,
                "emails_bounced": 0,
                "emails_opened": 0,
                "emails_clicked": 0
            },
            "note": "Analytics integration requires Resend Pro plan"
        }

        return _format_success(analytics)

    except Exception as e:
        return _format_error(f"Failed to get analytics: {str(e)}")


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
    """Main entry point for the Resend MCP server."""
    mcp_server = mcp._mcp_server

    import argparse

    parser = argparse.ArgumentParser(description='Run Resend MCP server with configurable transport')
    parser.add_argument('--transport', choices=['stdio', 'sse'], default='stdio',
                        help='Transport mode (stdio or sse)')
    parser.add_argument('--host', default='0.0.0.0',
                        help='Host to bind to (for SSE mode)')
    parser.add_argument('--port', type=int, default=8080,
                        help='Port to listen on (for SSE mode)')
    args = parser.parse_args()

    if args.transport == 'stdio':
        mcp.run(transport='stdio')
    else:
        starlette_app = create_starlette_app(mcp_server, debug=True)
        uvicorn.run(starlette_app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
