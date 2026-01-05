# Database MCP Server

Universal database operations MCP server supporting PostgreSQL, MySQL, MongoDB, and Supabase.

## Features

- **Multi-Database Support**: PostgreSQL, MySQL, MongoDB, Supabase
- **Connection Pooling**: Efficient connection management with configurable pool sizes
- **Query Execution**: Execute SELECT, INSERT, UPDATE, DELETE operations
- **Schema Management**: Get table and column information
- **Backup/Restore**: Create database backups (PostgreSQL, MySQL)
- **Security**: Parameterized queries to prevent SQL injection
- **Error Handling**: Comprehensive error handling and logging

## Installation

### Using uv (recommended)

```bash
cd mcp-servers/database-mcp
uv pip install -e .
```

### Using pip

```bash
cd mcp-servers/database-mcp
pip install -e .
```

## Usage

### Running the Server

**STDIO mode (for Claude Desktop):**
```bash
database-mcp --transport stdio
```

**SSE mode (for web applications):**
```bash
database-mcp --transport sse --host 0.0.0.0 --port 8081
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "database-mcp": {
      "command": "uv",
      "args": ["run", "database-mcp"]
    }
  }
}
```

## Available Tools

### 1. execute_query

Execute SQL queries on PostgreSQL, MySQL, or Supabase databases.

**Parameters:**
- `db_type`: Database type ("postgresql", "mysql", or "supabase")
- `connection_string`: Database connection string
- `query`: SQL query to execute
- `params`: Optional list of query parameters

**Example:**
```python
{
  "db_type": "postgresql",
  "connection_string": "postgresql://user:pass@localhost:5432/mydb",
  "query": "SELECT * FROM users WHERE id = $1",
  "params": [1]
}
```

### 2. execute_mongodb_query

Execute MongoDB operations.

**Parameters:**
- `connection_string`: MongoDB connection string
- `database`: Database name
- `collection`: Collection name
- `operation`: Operation type ("find", "insert_one", "update_one", "delete_one", "count")
- `query`: Query filter (optional)
- `document`: Document to insert (optional)
- `update`: Update operations (optional)
- `limit`: Maximum documents to return (default: 100)

**Example:**
```python
{
  "connection_string": "mongodb://localhost:27017",
  "database": "mydb",
  "collection": "users",
  "operation": "find",
  "query": {"status": "active"},
  "limit": 10
}
```

### 3. get_schema_info

Get database schema information.

**Parameters:**
- `db_type`: Database type ("postgresql", "mysql", or "supabase")
- `connection_string`: Database connection string
- `table_name`: Optional specific table name

**Example:**
```python
{
  "db_type": "postgresql",
  "connection_string": "postgresql://user:pass@localhost:5432/mydb",
  "table_name": "users"
}
```

### 4. create_backup

Create a database backup (requires pg_dump or mysqldump installed).

**Parameters:**
- `db_type`: Database type ("postgresql" or "mysql")
- `connection_string`: Database connection string
- `backup_path`: Path where backup file should be saved

**Example:**
```python
{
  "db_type": "postgresql",
  "connection_string": "postgresql://user:pass@localhost:5432/mydb",
  "backup_path": "/backups/mydb_backup.sql"
}
```

## Connection String Formats

### PostgreSQL / Supabase
```
postgresql://username:password@hostname:port/database
```

### MySQL
```
mysql://username:password@hostname:port/database
```

### MongoDB
```
mongodb://username:password@hostname:port/database
```

## Security Best Practices

1. **Use Environment Variables**: Store connection strings in environment variables
2. **Parameterized Queries**: Always use the `params` parameter for user input
3. **Connection Pooling**: Automatically managed to prevent connection exhaustion
4. **Error Handling**: Errors are logged but sensitive information is not exposed

## Dependencies

- `mcp`: Model Context Protocol framework
- `asyncpg`: PostgreSQL async driver
- `aiomysql`: MySQL async driver
- `motor`: MongoDB async driver
- `starlette`: Web framework for SSE mode
- `uvicorn`: ASGI server

## Development

### Running Tests

```bash
uv run pytest
```

### Code Formatting

```bash
uv run black src/
uv run isort src/
```

### Type Checking

```bash
uv run mypy src/
```

## Troubleshooting

### Connection Issues

- Verify connection string format
- Check database server is running
- Ensure firewall allows connections
- Verify credentials are correct

### Backup Issues

- Ensure `pg_dump` or `mysqldump` is installed
- Verify backup path is writable
- Check database user has backup permissions

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please submit pull requests or open issues for bugs and feature requests.
