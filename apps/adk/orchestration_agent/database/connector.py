"""
Create this new centralized database connector in database/connector.py
This will be used by all tools to access the correct database
Supports both SQLite (local) and PostgreSQL (production)
"""

import os
import sys
import logging
import sqlite3

# Try to import psycopg2 for PostgreSQL support
try:
    import psycopg2
    import psycopg2.extras
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("psycopg2 not available, PostgreSQL support disabled")

# Configure logging
logger = logging.getLogger(__name__)

class DatabaseConnector:
    """
    Unified database connector class for all agents.
    
    This class provides a standardized interface for database connections
    across all agents and tools in the Financial Analytics Agency.
    """
    
    _instance = None
    
    @classmethod
    def get_instance(cls):
        """Get singleton instance of DatabaseConnector."""
        if cls._instance is None:
            cls._instance = DatabaseConnector()
        return cls._instance
    
    def __init__(self):
        """Initialize the database connector."""
        self.connection = None
        self.cursor = None
        self.db_path = None
        self.db_type = None  # 'sqlite' or 'postgres'

    def connect(self):
        """
        Establish a connection to the database.
        Checks for PostgreSQL first (via DATABASE_URL), falls back to SQLite.

        Returns:
            bool: True if connection successful, False otherwise.
        """
        if self.connection:
            # Already connected
            return True

        try:
            # Check for PostgreSQL connection first
            database_url = os.environ.get("DATABASE_URL")
            use_postgres = os.environ.get("USE_POSTGRES", "false").lower() == "true"

            if database_url and use_postgres and POSTGRES_AVAILABLE:
                # Use PostgreSQL
                logger.info(f"Connecting to PostgreSQL database")
                self.connection = psycopg2.connect(database_url)
                self.cursor = self.connection.cursor()
                self.db_type = 'postgres'

                # Test the connection
                self.cursor.execute("SELECT version();")
                version = self.cursor.fetchone()
                logger.info(f"Connected to PostgreSQL: {version[0][:50]}...")

                # List all tables for debugging
                try:
                    self.cursor.execute("""
                        SELECT table_name FROM information_schema.tables
                        WHERE table_schema='public'
                        ORDER BY table_name
                    """)
                    tables = self.cursor.fetchall()
                    table_names = [table[0] for table in tables]
                    logger.info(f"Available tables: {table_names}")
                except Exception as e:
                    logger.warning(f"Could not list tables: {str(e)}")

                return True

            # Fall back to SQLite
            logger.info("Using SQLite database")
            self.db_type = 'sqlite'

            # Get database path from environment
            self.db_path = os.environ.get("DB_NAME")

            if not self.db_path or not os.path.exists(self.db_path):
                logger.warning(f"Database not found at {self.db_path}")

                # Search for database files in common locations
                search_locations = [
                    os.getcwd(),
                    os.path.dirname(os.getcwd()),
                    os.path.dirname(os.path.abspath(__file__)),
                    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database"),
                ]

                db_files = ["sales_agent.db", "financial_agent.db", "customers.db", "inventory.db"]
                for location in search_locations:
                    for db_file in db_files:
                        path = os.path.join(location, db_file)
                        if os.path.exists(path):
                            self.db_path = path
                            logger.info(f"Found database at {self.db_path}")
                            break
                    if self.db_path and os.path.exists(self.db_path):
                        break

            # If still not found, use in-memory database
            if not self.db_path or not os.path.exists(self.db_path):
                logger.warning("No database file found, using in-memory SQLite database")
                self.db_path = ":memory:"

            # Connect to the database
            logger.info(f"Connecting to SQLite database: {self.db_path}")
            self.connection = sqlite3.connect(self.db_path)
            self.cursor = self.connection.cursor()

            # Test the connection
            self.cursor.execute("SELECT sqlite_version();")
            version = self.cursor.fetchone()
            logger.info(f"Connected to SQLite version: {version[0]}")

            # List all tables in the database for debugging
            try:
                self.cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = self.cursor.fetchall()
                table_names = [table[0] for table in tables]
                logger.info(f"Available tables: {table_names}")
            except Exception as e:
                logger.warning(f"Could not list tables: {str(e)}")

            return True

        except Exception as e:
            logger.error(f"Database connection error: {str(e)}")
            return False
    
    def execute_query(self, query, params=None):
        """
        Execute a SQL query with optional parameters.
        
        Args:
            query (str): SQL query to execute
            params (tuple, optional): Parameters for the query
            
        Returns:
            list: Query results as a list of tuples
        """
        try:
            if not self.connection:
                success = self.connect()
                if not success:
                    raise Exception("Not connected to database")
            
            logger.debug(f"Executing query: {query}")
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
                
            return self.cursor.fetchall()
            
        except Exception as e:
            logger.error(f"Query execution error: {str(e)}")
            logger.error(f"Query: {query}")
            if params:
                logger.error(f"Parameters: {params}")
            
            # Return empty list instead of raising exception
            return []
    
    def fetch_all(self):
        """Fetch all results from the most recent query."""
        try:
            if not self.cursor:
                return []
                
            return self.cursor.fetchall()
        except Exception as e:
            logger.error(f"Error fetching results: {str(e)}")
            return []
    
    def close(self):
        """Close the database connection."""
        if self.connection:
            self.connection.close()
            self.connection = None
            self.cursor = None
            logger.info("Database connection closed")

def get_db_connector():
    """Get the database connector instance."""
    return DatabaseConnector.get_instance()