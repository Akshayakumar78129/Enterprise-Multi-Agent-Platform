"""PostgreSQL database connection management with async support"""

import os
import asyncpg
import logging
from typing import Dict, List, Any, Optional
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


class PostgreSQLConnection:
    """Manages PostgreSQL connections and query execution with connection pooling"""

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        database: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        ssl_mode: Optional[str] = None,
    ):
        """Initialize PostgreSQL connection

        Args:
            host: PostgreSQL host (defaults to DB_HOST env var)
            port: PostgreSQL port (defaults to DB_PORT env var)
            database: Database name (defaults to DB_NAME env var)
            user: Database user (defaults to DB_USER env var)
            password: Database password (defaults to DB_PASSWORD env var)
            ssl_mode: SSL mode (defaults to SSL_MODE env var)
        """
        self.host = host or os.getenv('DB_HOST', 'localhost')
        self.port = port or int(os.getenv('DB_PORT', '5432'))
        self.database = database or os.getenv('DB_NAME', 'enterpriseiq')
        self.user = user or os.getenv('DB_USER', 'enterpriseiq')
        self.password = password or os.getenv('DB_PASSWORD', '')
        self.ssl_mode = ssl_mode or os.getenv('SSL_MODE', 'prefer')

        self.pool: Optional[asyncpg.Pool] = None

        logger.info(f"PostgreSQL connection initialized: {self.user}@{self.host}:{self.port}/{self.database}")

    async def create_pool(self, min_size: int = 5, max_size: int = 20):
        """Create connection pool

        Args:
            min_size: Minimum number of connections
            max_size: Maximum number of connections
        """
        if self.pool is None:
            try:
                # Build connection params
                ssl_context = None
                if self.ssl_mode == 'require':
                    import ssl
                    ssl_context = ssl.create_default_context()
                elif self.ssl_mode == 'disable':
                    ssl_context = False

                self.pool = await asyncpg.create_pool(
                    host=self.host,
                    port=self.port,
                    database=self.database,
                    user=self.user,
                    password=self.password,
                    min_size=min_size,
                    max_size=max_size,
                    command_timeout=60,
                    ssl=ssl_context if ssl_context is not None else self.ssl_mode
                )
                logger.info(f"PostgreSQL connection pool created: {min_size}-{max_size} connections")
            except Exception as e:
                logger.error(f"Failed to create PostgreSQL connection pool: {e}")
                raise

    async def close_pool(self):
        """Close the connection pool"""
        if self.pool:
            await self.pool.close()
            self.pool = None
            logger.info("PostgreSQL connection pool closed")

    @asynccontextmanager
    async def get_connection(self):
        """Context manager for database connections"""
        if self.pool is None:
            await self.create_pool()

        conn = await self.pool.acquire()
        try:
            yield conn
        finally:
            await self.pool.release(conn)

    async def query(self, sql: str, params: List[Any] = None) -> Dict[str, Any]:
        """Execute a query and return results

        Args:
            sql: SQL query string
            params: Query parameters (use $1, $2, etc. in query)

        Returns:
            Dictionary with 'rows' containing query results
        """
        if params is None:
            params = []

        async with self.get_connection() as conn:
            # Execute query
            rows = await conn.fetch(sql, *params)

            # Convert Record objects to dictionaries
            result_rows = []
            for row in rows:
                result_rows.append(dict(row))

            return {
                'rows': result_rows,
                'rowCount': len(result_rows)
            }

    async def execute(self, sql: str, params: List[Any] = None) -> int:
        """Execute a non-query statement

        Args:
            sql: SQL statement
            params: Statement parameters (use $1, $2, etc. in query)

        Returns:
            Number of affected rows
        """
        if params is None:
            params = []

        async with self.get_connection() as conn:
            result = await conn.execute(sql, *params)
            # Extract row count from result string like "UPDATE 5"
            if isinstance(result, str):
                parts = result.split()
                if len(parts) > 1 and parts[1].isdigit():
                    return int(parts[1])
            return 0

    async def test_connection(self) -> bool:
        """Test if database connection works

        Returns:
            True if connection successful, False otherwise
        """
        try:
            result = await self.query("SELECT 1 as test")
            return result['rowCount'] > 0
        except Exception as e:
            logger.error(f"PostgreSQL connection test failed: {e}")
            return False

    async def get_table_names(self) -> List[str]:
        """Get list of all table names in the database

        Returns:
            List of table names
        """
        try:
            sql = """
                SELECT tablename
                FROM pg_catalog.pg_tables
                WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
                ORDER BY tablename
            """
            result = await self.query(sql)
            return [row['tablename'] for row in result['rows']]
        except Exception as e:
            logger.error(f"Error fetching table names: {e}")
            return []

    async def get_table_info(self, table_name: str) -> List[Dict[str, Any]]:
        """Get information about a table's columns

        Args:
            table_name: Name of the table

        Returns:
            List of column information dictionaries
        """
        try:
            sql = """
                SELECT
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            """
            result = await self.query(sql, [table_name])
            return result['rows']
        except Exception as e:
            logger.error(f"Error fetching table info for {table_name}: {e}")
            return []


# Global PostgreSQL connection instance
_pg_connection = None

async def get_pg_connection() -> PostgreSQLConnection:
    """Get the global PostgreSQL connection instance"""
    global _pg_connection
    if _pg_connection is None:
        _pg_connection = PostgreSQLConnection()
        await _pg_connection.create_pool()
    return _pg_connection
