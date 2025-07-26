"""
Database connection utilities for the Sales Analytics Multi-Agent System.
Enforces read-only mode for all database operations.
"""

import sqlite3
import logging
from pathlib import Path
import config

# Configure logging
logging.basicConfig(
    level=config.LOGGING['level'],
    format=config.LOGGING['format'],
    filename=config.LOGGING['file']
)
logger = logging.getLogger(__name__)

class ReadOnlyConnection:
    """A wrapper for SQLite connection that enforces read-only operations."""
    
    def __init__(self, db_path):
        self.db_path = Path(db_path)
        if not self.db_path.exists():
            raise FileNotFoundError(f"Database file not found: {db_path}")
        
        # Open connection in read-only mode
        self.conn = sqlite3.connect(f'file:{db_path}?mode=ro', uri=True)
        self.conn.row_factory = sqlite3.Row  # Enable dictionary-like access to rows
        
    def execute(self, query, params=None):
        """Execute a read-only query."""
        try:
            cursor = self.conn.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            return cursor
        except sqlite3.OperationalError as e:
            if "attempt to write a readonly database" in str(e):
                logger.error("Attempted write operation on read-only database")
                raise PermissionError("Write operations are not allowed on this database")
            raise
    
    def fetchall(self, query, params=None):
        """Execute a query and return all results."""
        cursor = self.execute(query, params)
        return cursor.fetchall()
    
    def fetchone(self, query, params=None):
        """Execute a query and return one result."""
        cursor = self.execute(query, params)
        return cursor.fetchone()
    
    def close(self):
        """Close the database connection."""
        self.conn.close()

def get_connection():
    """Get a read-only database connection."""
    try:
        db_path = config.DATABASE['path']
        # Create a regular connection for pandas
        conn = sqlite3.connect(f'file:{db_path}?mode=ro', uri=True)
        # Create the wrapper for our custom operations
        wrapper = ReadOnlyConnection(db_path)
        return conn, wrapper
    except Exception as e:
        logger.error(f"Failed to establish database connection: {str(e)}")
        raise

# Example usage:
# conn, wrapper = get_connection()
# results = wrapper.fetchall("SELECT * FROM dbo_F_Sales_Transaction LIMIT 10")
# conn.close()
# wrapper.close() 