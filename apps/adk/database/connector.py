"""Database connector for unified database access"""

import sqlite3
import os
from typing import Dict, List, Any, Optional, Tuple
from contextlib import contextmanager
from .connection import DatabaseConnection


class DatabaseConnector:
    """Unified database connector class for all agents."""
    
    def __init__(self, db_path: Optional[str] = None):
        """Initialize the database connector."""
        self.db_connection = DatabaseConnection(db_path)
    
    @contextmanager
    def get_connection(self):
        """Get a database connection context manager."""
        with self.db_connection.get_connection() as conn:
            yield conn
    
    async def query(self, sql: str, params: List[Any] = None) -> Dict[str, Any]:
        """Execute a query and return results."""
        return await self.db_connection.query(sql, params)
    
    async def execute(self, sql: str, params: List[Any] = None) -> int:
        """Execute a non-query statement."""
        return await self.db_connection.execute(sql, params)
    
    def get_db_path(self) -> str:
        """Get the database path."""
        return self.db_connection.db_path
    
    def test_connection(self) -> bool:
        """Test if database connection works."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                return True
        except Exception:
            return False
    
    def get_table_info(self, table_name: str) -> List[Dict[str, Any]]:
        """Get information about a table's columns."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = cursor.fetchall()
                return [dict(column) for column in columns]
        except Exception:
            return []
    
    def get_table_names(self) -> List[str]:
        """Get list of all table names in the database."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = cursor.fetchall()
                return [table[0] for table in tables]
        except Exception:
            return []
    
    def get_sample_data(self, table_name: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get sample data from a table."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(f"SELECT * FROM {table_name} LIMIT {limit}")
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
        except Exception:
            return []


# Global database connector instance
_db_connector = None

def get_db_connector() -> DatabaseConnector:
    """Get the database connector instance."""
    global _db_connector
    if _db_connector is None:
        _db_connector = DatabaseConnector()
    return _db_connector


def get_connection() -> Tuple[sqlite3.Connection, DatabaseConnector]:
    """Get a database connection and connector wrapper.
    
    Returns:
        Tuple of (connection, connector_wrapper)
    """
    connector = get_db_connector()
    conn = sqlite3.connect(connector.get_db_path())
    conn.row_factory = sqlite3.Row
    return conn, connector
