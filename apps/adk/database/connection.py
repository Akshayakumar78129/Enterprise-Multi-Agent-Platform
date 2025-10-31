"""Database connection management with connection pooling and optimization
Supports both SQLite (local) and PostgreSQL (production)
"""

import sqlite3
import os
import threading
from typing import Dict, List, Any, Optional
from contextlib import contextmanager
from queue import Queue, Empty
import time

# Try to import psycopg2 for PostgreSQL support
try:
    import psycopg2
    import psycopg2.extras
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False


class ConnectionPool:
    """SQLite connection pool for better resource management"""

    def __init__(self, db_path: str, pool_size: int = 5):
        """Initialize connection pool

        Args:
            db_path: Path to SQLite database
            pool_size: Number of connections to maintain
        """
        self.db_path = db_path
        self.pool_size = pool_size
        self._connections = Queue(maxsize=pool_size)
        self._lock = threading.RLock()
        self._created_connections = 0

        # Pre-create connections
        for _ in range(min(2, pool_size)):  # Start with 2 connections
            self._create_connection()

    def _create_connection(self):
        """Create a new database connection with optimizations"""
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row  # Enable column access by name

        # Enable WAL mode for better concurrency
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")

        # Optimize for read-heavy workload
        conn.execute("PRAGMA cache_size=10000")  # ~40MB cache
        conn.execute("PRAGMA temp_store=MEMORY")

        # Enable query optimizer
        conn.execute("PRAGMA optimize")

        return conn

    @contextmanager
    def get_connection(self):
        """Get a connection from the pool"""
        conn = None
        try:
            # Try to get an existing connection
            try:
                conn = self._connections.get(block=False)
            except Empty:
                # Create new connection if pool not full
                with self._lock:
                    if self._created_connections < self.pool_size:
                        conn = self._create_connection()
                        self._created_connections += 1
                    else:
                        # Wait for available connection
                        conn = self._connections.get(block=True, timeout=30)

            yield conn
        finally:
            # Return connection to pool
            if conn:
                try:
                    # Test if connection is still valid
                    conn.execute("SELECT 1")
                    self._connections.put(conn)
                except:
                    # Connection is broken, create a new one
                    with self._lock:
                        self._created_connections -= 1
                    try:
                        conn.close()
                    except:
                        pass

    def close_all(self):
        """Close all connections in the pool"""
        while not self._connections.empty():
            try:
                conn = self._connections.get(block=False)
                conn.close()
            except:
                pass
        self._created_connections = 0


class DatabaseConnection:
    """Manages database connections and query execution with pooling"""

    def __init__(self, db_path: Optional[str] = None, use_pool: bool = True):
        """Initialize database connection

        Args:
            db_path: Path to SQLite database file. If None, uses default path.
            use_pool: Whether to use connection pooling
        """
        if db_path is None:
            # Default to the existing database path
            db_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "orchestration_agent",
                "database",
                "customers.db"
            )
        self.db_path = db_path
        self.use_pool = use_pool

        # Initialize connection pool if enabled
        if use_pool:
            self.pool = ConnectionPool(db_path, pool_size=5)
        else:
            self.pool = None

    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        if self.pool:
            with self.pool.get_connection() as conn:
                yield conn
        else:
            # Fallback to single connection
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row  # Enable column access by name
            try:
                yield conn
            finally:
                conn.close()

    async def query(self, sql: str, params: List[Any] = None) -> Dict[str, Any]:
        """Execute a query and return results

        Args:
            sql: SQL query string
            params: Query parameters

        Returns:
            Dictionary with 'rows' containing query results
        """
        if params is None:
            params = []

        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute(sql, params)
            except Exception as e:
                print(f"[ERROR] SQL execution failed:")
                print(f"[ERROR] SQL: {repr(sql)}")
                print(f"[ERROR] Params: {params}")
                print(f"[ERROR] Exception: {e}")
                raise

            # Fetch all rows
            rows = cursor.fetchall()

            # Convert Row objects to dictionaries
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
            params: Statement parameters

        Returns:
            Number of affected rows
        """
        if params is None:
            params = []

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, params)
            conn.commit()
            return cursor.rowcount


# Global database connection instance
_db_connection = None

def get_connection() -> DatabaseConnection:
    """Get the global database connection instance"""
    global _db_connection
    if _db_connection is None:
        _db_connection = DatabaseConnection()
    return _db_connection