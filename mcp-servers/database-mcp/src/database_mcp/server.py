import asyncio
import json
from typing import Any, Optional, Dict, List
from urllib.parse import urlparse
from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from mcp.server.sse import SseServerTransport
from starlette.requests import Request
from starlette.routing import Mount, Route
from mcp.server import Server
import uvicorn
from pydantic import Field
import logging

# Initialize FastMCP server for database operations
mcp = FastMCP("database-mcp")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Custom exception classes for database operations
class DatabaseError(Exception):
    """Generic error for database operations."""
    pass


class ConnectionError(DatabaseError):
    """Raised when database connection fails."""
    pass


class QueryError(DatabaseError):
    """Raised when query execution fails."""
    pass


# Connection pool management
_connection_pools = {}


async def _get_connection_pool(db_type: str, connection_string: str):
    """Get or create a connection pool for the database."""
    pool_key = f"{db_type}:{connection_string}"

    if pool_key in _connection_pools:
        return _connection_pools[pool_key]

    try:
        if db_type == "postgresql":
            import asyncpg
            pool = await asyncpg.create_pool(connection_string, min_size=1, max_size=10)
        elif db_type == "mysql":
            import aiomysql
            parsed = urlparse(connection_string)
            pool = await aiomysql.create_pool(
                host=parsed.hostname,
                port=parsed.port or 3306,
                user=parsed.username,
                password=parsed.password,
                db=parsed.path.lstrip('/'),
                minsize=1,
                maxsize=10
            )
        elif db_type == "mongodb":
            from motor.motor_asyncio import AsyncIOMotorClient
            pool = AsyncIOMotorClient(connection_string)
        else:
            raise DatabaseError(f"Unsupported database type: {db_type}")

        _connection_pools[pool_key] = pool
        return pool
    except Exception as e:
        raise ConnectionError(f"Failed to create connection pool: {str(e)}")


@mcp.tool()
async def execute_query(
    db_type: str,
    connection_string: str,
    query: str,
    params: Optional[List[Any]] = None
) -> str:
    """Execute a SQL query on PostgreSQL, MySQL, or Supabase database.

    This tool enables AI assistants to execute SQL queries with proper connection
    pooling and error handling. Supports SELECT, INSERT, UPDATE, DELETE operations.

    Args:
        db_type: Database type ("postgresql", "mysql", or "supabase")
        connection_string: Database connection string (e.g., "postgresql://user:pass@host:port/db")
        query: SQL query to execute
        params: Optional list of query parameters for parameterized queries

    Returns:
        JSON-formatted string with query results or execution status

    Raises:
        DatabaseError: If query execution fails
    """

    # Parameter validation
    if not query or not isinstance(query, str):
        return json.dumps({"error": "Query parameter is required and must be a non-empty string"})

    if db_type not in ["postgresql", "mysql", "supabase"]:
        return json.dumps({"error": f"Unsupported database type: {db_type}. Supported: postgresql, mysql, supabase"})

    # Supabase uses PostgreSQL
    if db_type == "supabase":
        db_type = "postgresql"

    try:
        pool = await _get_connection_pool(db_type, connection_string)

        if db_type == "postgresql":
            async with pool.acquire() as conn:
                if query.strip().upper().startswith("SELECT"):
                    rows = await conn.fetch(query, *(params or []))
                    results = [dict(row) for row in rows]
                    return json.dumps({
                        "success": True,
                        "row_count": len(results),
                        "results": results
                    }, indent=2, default=str)
                else:
                    result = await conn.execute(query, *(params or []))
                    return json.dumps({
                        "success": True,
                        "message": result,
                        "affected_rows": result.split()[-1] if result else "0"
                    }, indent=2)

        elif db_type == "mysql":
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    await cursor.execute(query, params or ())

                    if query.strip().upper().startswith("SELECT"):
                        rows = await cursor.fetchall()
                        columns = [desc[0] for desc in cursor.description]
                        results = [dict(zip(columns, row)) for row in rows]
                        return json.dumps({
                            "success": True,
                            "row_count": len(results),
                            "results": results
                        }, indent=2, default=str)
                    else:
                        await conn.commit()
                        return json.dumps({
                            "success": True,
                            "affected_rows": cursor.rowcount
                        }, indent=2)

    except Exception as e:
        logger.error(f"Query execution error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def execute_mongodb_query(
    connection_string: str,
    database: str,
    collection: str,
    operation: str,
    query: Optional[Dict[str, Any]] = None,
    document: Optional[Dict[str, Any]] = None,
    update: Optional[Dict[str, Any]] = None,
    limit: int = 100
) -> str:
    """Execute a MongoDB query with support for find, insert, update, and delete operations.

    Args:
        connection_string: MongoDB connection string
        database: Database name
        collection: Collection name
        operation: Operation type ("find", "insert_one", "update_one", "delete_one", "count")
        query: Query filter (for find, update, delete operations)
        document: Document to insert (for insert operations)
        update: Update operations (for update operations)
        limit: Maximum number of documents to return (for find operations)

    Returns:
        JSON-formatted string with operation results
    """

    if operation not in ["find", "insert_one", "update_one", "delete_one", "count"]:
        return json.dumps({"error": f"Unsupported operation: {operation}"})

    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(connection_string)
        db = client[database]
        coll = db[collection]

        if operation == "find":
            cursor = coll.find(query or {}).limit(limit)
            documents = await cursor.to_list(length=limit)
            # Convert ObjectId to string for JSON serialization
            for doc in documents:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
            return json.dumps({
                "success": True,
                "count": len(documents),
                "documents": documents
            }, indent=2, default=str)

        elif operation == "insert_one":
            if not document:
                return json.dumps({"error": "Document parameter is required for insert operation"})
            result = await coll.insert_one(document)
            return json.dumps({
                "success": True,
                "inserted_id": str(result.inserted_id)
            }, indent=2)

        elif operation == "update_one":
            if not query or not update:
                return json.dumps({"error": "Query and update parameters are required for update operation"})
            result = await coll.update_one(query, update)
            return json.dumps({
                "success": True,
                "matched_count": result.matched_count,
                "modified_count": result.modified_count
            }, indent=2)

        elif operation == "delete_one":
            if not query:
                return json.dumps({"error": "Query parameter is required for delete operation"})
            result = await coll.delete_one(query)
            return json.dumps({
                "success": True,
                "deleted_count": result.deleted_count
            }, indent=2)

        elif operation == "count":
            count = await coll.count_documents(query or {})
            return json.dumps({
                "success": True,
                "count": count
            }, indent=2)

    except Exception as e:
        logger.error(f"MongoDB operation error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)
    finally:
        client.close()


@mcp.tool()
async def get_schema_info(
    db_type: str,
    connection_string: str,
    table_name: Optional[str] = None
) -> str:
    """Get database schema information including tables and columns.

    Args:
        db_type: Database type ("postgresql", "mysql", or "supabase")
        connection_string: Database connection string
        table_name: Optional specific table name to get info for

    Returns:
        JSON-formatted string with schema information
    """

    if db_type == "supabase":
        db_type = "postgresql"

    try:
        pool = await _get_connection_pool(db_type, connection_string)

        if db_type == "postgresql":
            async with pool.acquire() as conn:
                if table_name:
                    query = """
                        SELECT column_name, data_type, is_nullable, column_default
                        FROM information_schema.columns
                        WHERE table_name = $1
                        ORDER BY ordinal_position
                    """
                    rows = await conn.fetch(query, table_name)
                else:
                    query = """
                        SELECT table_name, table_type
                        FROM information_schema.tables
                        WHERE table_schema = 'public'
                        ORDER BY table_name
                    """
                    rows = await conn.fetch(query)

                results = [dict(row) for row in rows]
                return json.dumps({
                    "success": True,
                    "schema_info": results
                }, indent=2, default=str)

        elif db_type == "mysql":
            async with pool.acquire() as conn:
                async with conn.cursor() as cursor:
                    if table_name:
                        await cursor.execute(f"DESCRIBE {table_name}")
                    else:
                        await cursor.execute("SHOW TABLES")

                    rows = await cursor.fetchall()
                    columns = [desc[0] for desc in cursor.description]
                    results = [dict(zip(columns, row)) for row in rows]
                    return json.dumps({
                        "success": True,
                        "schema_info": results
                    }, indent=2, default=str)

    except Exception as e:
        logger.error(f"Schema info error: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2)


@mcp.tool()
async def create_backup(
    db_type: str,
    connection_string: str,
    backup_path: str
) -> str:
    """Create a database backup.

    Args:
        db_type: Database type ("postgresql" or "mysql")
        connection_string: Database connection string
        backup_path: Path where backup file should be saved

    Returns:
        JSON-formatted string with backup status
    """

    try:
        import subprocess
        parsed = urlparse(connection_string)

        if db_type == "postgresql":
            cmd = [
                "pg_dump",
                "-h", parsed.hostname,
                "-p", str(parsed.port or 5432),
                "-U", parsed.username,
                "-d", parsed.path.lstrip('/'),
                "-f", backup_path
            ]
        elif db_type == "mysql":
            cmd = [
                "mysqldump",
                "-h", parsed.hostname,
                "-P", str(parsed.port or 3306),
                "-u", parsed.username,
                f"-p{parsed.password}",
                parsed.path.lstrip('/'),
                "--result-file", backup_path
            ]
        else:
            return json.dumps({"error": f"Backup not supported for {db_type}"})

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            return json.dumps({
                "success": True,
                "message": f"Backup created at {backup_path}"
            }, indent=2)
        else:
            return json.dumps({
                "success": False,
                "error": result.stderr
            }, indent=2)

    except Exception as e:
        logger.error(f"Backup error: {str(e)}")
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
    """Main entry point for the Database MCP server."""
    mcp_server = mcp._mcp_server

    import argparse

    parser = argparse.ArgumentParser(description='Run Database MCP server with configurable transport')
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
