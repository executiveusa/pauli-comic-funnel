# AWS MCP Server

A **Model Context Protocol (MCP)** server that provides comprehensive AWS services automation. This server enables AI assistants to manage AWS infrastructure including S3, Lambda, EC2, CloudWatch, and IAM through boto3.

## Features

- **S3 Operations**: Upload, download, list, and delete objects in S3 buckets
- **Lambda Management**: Deploy, invoke, and manage Lambda functions
- **EC2 Control**: Start, stop, and monitor EC2 instances
- **CloudWatch Monitoring**: Query metrics, logs, and set alarms
- **IAM Management**: Manage users, roles, and policies
- **Credential Security**: Secure credential management with environment variables

## Requirements

- **Python**: 3.10 or higher
- **Dependencies**:
  - `mcp` - Model Context Protocol framework
  - `boto3` - AWS SDK for Python
  - `starlette` - Web framework for SSE transport
  - `uvicorn` - ASGI server

## Installation

### Using uv (Recommended)

```bash
# Install from source
cd pauli-comic-funnel-main/mcp-servers/aws-mcp
uv sync
```

### Using pip

```bash
pip install -r requirements.txt
```

## Configuration

### AWS Credentials

Set up your AWS credentials using one of these methods:

1. **Environment Variables** (Recommended for MCP):
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

2. **AWS Credentials File** (~/.aws/credentials):
```ini
[default]
aws_access_key_id = your_access_key
aws_secret_access_key = your_secret_key
region = us-east-1
```

3. **AWS Config File** (~/.aws/config):
```ini
[default]
region = us-east-1
output = json
```

### MCP Client Configuration

Add to your MCP client configuration (.mcp.json):

```json
{
  "mcpServers": {
    "aws-mcp": {
      "command": "uv",
      "args": ["run", "python", "-m", "aws_mcp"],
      "cwd": "e:/DESKTOP BACKUP FILES/THE PAULI EFFECT/pauli-comic-funnel-main/mcp-servers/aws-mcp",
      "env": {
        "AWS_ACCESS_KEY_ID": "your_access_key",
        "AWS_SECRET_ACCESS_KEY": "your_secret_key",
        "AWS_DEFAULT_REGION": "us-east-1"
      }
    }
  }
}
```

## Available Tools

### S3 Operations

#### `s3_list_buckets`
List all S3 buckets in your account.

**Returns**: List of bucket names and creation dates

#### `s3_list_objects`
List objects in an S3 bucket.

**Parameters**:
- `bucket` (required): S3 bucket name
- `prefix` (optional): Filter objects by prefix

#### `s3_upload_file`
Upload a file to S3.

**Parameters**:
- `bucket` (required): S3 bucket name
- `key` (required): Object key (path in S3)
- `file_path` (required): Local file path to upload

#### `s3_download_file`
Download a file from S3.

**Parameters**:
- `bucket` (required): S3 bucket name
- `key` (required): Object key to download
- `file_path` (required): Local path to save file

#### `s3_delete_object`
Delete an object from S3.

**Parameters**:
- `bucket` (required): S3 bucket name
- `key` (required): Object key to delete

### Lambda Operations

#### `lambda_list_functions`
List all Lambda functions.

**Returns**: List of function names, runtimes, and ARNs

#### `lambda_invoke`
Invoke a Lambda function.

**Parameters**:
- `function_name` (required): Lambda function name
- `payload` (optional): JSON payload to send to function

#### `lambda_create_function`
Create a new Lambda function.

**Parameters**:
- `function_name` (required): Function name
- `runtime` (required): Runtime (e.g., "python3.11")
- `role_arn` (required): IAM role ARN
- `handler` (required): Handler (e.g., "index.handler")
- `zip_file_path` (required): Path to deployment package

#### `lambda_update_code`
Update Lambda function code.

**Parameters**:
- `function_name` (required): Function name
- `zip_file_path` (required): Path to new deployment package

### EC2 Operations

#### `ec2_list_instances`
List EC2 instances.

**Parameters**:
- `filters` (optional): Instance filters (e.g., "running", "stopped")

**Returns**: Instance IDs, states, types, and IPs

#### `ec2_start_instances`
Start EC2 instances.

**Parameters**:
- `instance_ids` (required): List of instance IDs to start

#### `ec2_stop_instances`
Stop EC2 instances.

**Parameters**:
- `instance_ids` (required): List of instance IDs to stop

#### `ec2_describe_instance`
Get detailed information about an instance.

**Parameters**:
- `instance_id` (required): Instance ID

### CloudWatch Operations

#### `cloudwatch_get_metrics`
Query CloudWatch metrics.

**Parameters**:
- `namespace` (required): Metric namespace (e.g., "AWS/EC2")
- `metric_name` (required): Metric name
- `dimensions` (optional): Metric dimensions
- `start_time` (optional): Start time for query
- `end_time` (optional): End time for query
- `period` (optional): Period in seconds (default: 300)

#### `cloudwatch_put_metric_alarm`
Create or update a CloudWatch alarm.

**Parameters**:
- `alarm_name` (required): Alarm name
- `metric_name` (required): Metric to monitor
- `namespace` (required): Metric namespace
- `threshold` (required): Alarm threshold
- `comparison_operator` (required): Comparison operator

#### `cloudwatch_get_log_events`
Get CloudWatch log events.

**Parameters**:
- `log_group` (required): Log group name
- `log_stream` (optional): Log stream name
- `start_time` (optional): Start time
- `limit` (optional): Maximum events to return

### IAM Operations

#### `iam_list_users`
List IAM users.

**Returns**: List of usernames and ARNs

#### `iam_list_roles`
List IAM roles.

**Returns**: List of role names and ARNs

#### `iam_create_user`
Create a new IAM user.

**Parameters**:
- `username` (required): Username to create

#### `iam_attach_policy`
Attach a policy to a user or role.

**Parameters**:
- `entity_name` (required): User or role name
- `policy_arn` (required): Policy ARN
- `entity_type` (required): "user" or "role"

## Usage Examples

### S3 File Operations
```python
# List buckets
s3_list_buckets()

# Upload a file
s3_upload_file(
    bucket="my-bucket",
    key="data/file.txt",
    file_path="/local/path/file.txt"
)

# Download a file
s3_download_file(
    bucket="my-bucket",
    key="data/file.txt",
    file_path="/local/path/downloaded.txt"
)
```

### Lambda Management
```python
# List functions
lambda_list_functions()

# Invoke a function
lambda_invoke(
    function_name="my-function",
    payload='{"key": "value"}'
)

# Update function code
lambda_update_code(
    function_name="my-function",
    zip_file_path="./deployment.zip"
)
```

### EC2 Instance Management
```python
# List running instances
ec2_list_instances(filters="running")

# Start instances
ec2_start_instances(instance_ids=["i-1234567890abcdef0"])

# Stop instances
ec2_stop_instances(instance_ids=["i-1234567890abcdef0"])
```

### CloudWatch Monitoring
```python
# Get CPU metrics
cloudwatch_get_metrics(
    namespace="AWS/EC2",
    metric_name="CPUUtilization",
    dimensions=[{"Name": "InstanceId", "Value": "i-1234567890abcdef0"}]
)

# Create alarm
cloudwatch_put_metric_alarm(
    alarm_name="HighCPU",
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    threshold=80.0,
    comparison_operator="GreaterThanThreshold"
)
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use IAM roles** when running on AWS infrastructure
3. **Apply least privilege** principle to IAM policies
4. **Rotate credentials** regularly
5. **Enable MFA** for sensitive operations
6. **Use CloudTrail** for audit logging

## Error Handling

The server handles various error conditions:

- **Authentication Errors**: Invalid or missing credentials
- **Permission Errors**: Insufficient IAM permissions
- **Resource Not Found**: Requested resources don't exist
- **Rate Limiting**: AWS API throttling
- **Network Errors**: Connection issues

## Testing

Run the test suite:

```bash
uv run pytest tests/
```

## Architecture

- **FastMCP Framework**: Built on FastMCP for easy MCP server development
- **boto3 Client**: Official AWS SDK for Python
- **Async Operations**: Non-blocking async/await patterns
- **Error Recovery**: Comprehensive error handling and retry logic
- **Resource Cleanup**: Proper resource cleanup and connection management

## License

MIT License - See LICENSE file for details

## Acknowledgments

- [AWS boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html) for AWS SDK
- [MCP (Model Context Protocol)](https://github.com/modelcontextprotocol) for protocol specification
- [FastMCP](https://github.com/jlowin/fastmcp) for server framework

## Support

- **Issues**: File issues in The Pauli Effect repository
- **Documentation**: [AWS boto3 Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)

---

**Built for The Pauli Effect - AI-Powered Automation Platform**
