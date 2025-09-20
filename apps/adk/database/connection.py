"""Database connection management"""

import sqlite3
import os
from typing import Dict, List, Any, Optional
from contextlib import contextmanager


class DatabaseConnection:
    """Manages database connections and query execution"""

    def __init__(self, db_path: Optional[str] = None):
        """Initialize database connection

        Args:
            db_path: Path to SQLite database file. If None, uses default path.
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

    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
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
            cursor.execute(sql, params)

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