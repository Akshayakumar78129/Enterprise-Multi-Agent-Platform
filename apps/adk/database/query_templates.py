"""Database query templates and utility functions"""

from datetime import datetime, timedelta
from typing import Tuple, Optional
from .connection import get_connection


def get_latest_date(conn=None) -> str:
    """
    Get the latest date from the sales transactions table.
    
    Args:
        conn: Database connection (optional, will create if not provided)
    
    Returns:
        Latest date as string in YYYY-MM-DD format
    """
    if conn is None:
        db = get_connection()
        with db.get_connection() as conn:
            return _get_latest_date_from_conn(conn)
    else:
        return _get_latest_date_from_conn(conn)


def _get_latest_date_from_conn(conn) -> str:
    """Helper function to get latest date from connection"""
    try:
        cursor = conn.cursor()
        # Try different table names that might exist
        tables_to_try = [
            "sales_transactions",
            "transactions", 
            "sales",
            "customer_transactions"
        ]
        
        for table in tables_to_try:
            try:
                cursor.execute(f"SELECT MAX(date) as latest_date FROM {table}")
                result = cursor.fetchone()
                if result and result[0]:
                    return result[0]
            except:
                continue
        
        # If no table found, return current date
        return datetime.now().strftime("%Y-%m-%d")
        
    except Exception as e:
        # Fallback to current date
        return datetime.now().strftime("%Y-%m-%d")


def get_date_range(time_period: str, conn=None) -> Tuple[str, str]:
    """
    Get date range based on time period.
    
    Args:
        time_period: Time period ('last_7_days', 'last_30_days', 'last_90_days', 'last_year')
        conn: Database connection (optional)
    
    Returns:
        Tuple of (start_date, end_date) in YYYY-MM-DD format
    """
    if conn is None:
        db = get_connection()
        with db.get_connection() as conn:
            end_date = get_latest_date(conn)
            return _calculate_date_range(time_period, end_date)
    else:
        end_date = get_latest_date(conn)
        return _calculate_date_range(time_period, end_date)


def _calculate_date_range(time_period: str, end_date: str) -> Tuple[str, str]:
    """Helper function to calculate date range"""
    end_date_dt = datetime.strptime(end_date, "%Y-%m-%d")
    
    if time_period == 'last_7_days':
        start_date_dt = end_date_dt - timedelta(days=7)
    elif time_period == 'last_30_days':
        start_date_dt = end_date_dt - timedelta(days=30)
    elif time_period == 'last_90_days':
        start_date_dt = end_date_dt - timedelta(days=90)
    elif time_period == 'last_year':
        start_date_dt = end_date_dt - timedelta(days=365)
    else:
        # Default to last 30 days
        start_date_dt = end_date_dt - timedelta(days=30)
    
    return start_date_dt.strftime("%Y-%m-%d"), end_date


def get_customer_count(conn=None) -> int:
    """
    Get total customer count from database.
    
    Args:
        conn: Database connection (optional)
    
    Returns:
        Number of customers
    """
    if conn is None:
        db = get_connection()
        with db.get_connection() as conn:
            return _get_customer_count_from_conn(conn)
    else:
        return _get_customer_count_from_conn(conn)


def _get_customer_count_from_conn(conn) -> int:
    """Helper function to get customer count from connection"""
    try:
        cursor = conn.cursor()
        # Try different table names
        tables_to_try = ["customers", "customer", "users"]
        
        for table in tables_to_try:
            try:
                cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                result = cursor.fetchone()
                if result:
                    return result[0]
            except:
                continue
        
        return 0
        
    except Exception as e:
        return 0


def get_sales_summary(conn=None) -> dict:
    """
    Get basic sales summary from database.
    
    Args:
        conn: Database connection (optional)
    
    Returns:
        Dictionary with sales summary data
    """
    if conn is None:
        db = get_connection()
        with db.get_connection() as conn:
            return _get_sales_summary_from_conn(conn)
    else:
        return _get_sales_summary_from_conn(conn)


def _get_sales_summary_from_conn(conn) -> dict:
    """Helper function to get sales summary from connection"""
    try:
        cursor = conn.cursor()
        
        # Try to get sales data from different possible tables
        tables_to_try = [
            "sales_transactions",
            "transactions", 
            "sales",
            "customer_transactions"
        ]
        
        for table in tables_to_try:
            try:
                cursor.execute(f"""
                    SELECT 
                        COUNT(*) as transaction_count,
                        SUM(amount) as total_amount,
                        AVG(amount) as avg_amount
                    FROM {table}
                """)
                result = cursor.fetchone()
                if result:
                    return {
                        'transaction_count': result[0] or 0,
                        'total_amount': result[1] or 0,
                        'avg_amount': result[2] or 0
                    }
            except:
                continue
        
        return {
            'transaction_count': 0,
            'total_amount': 0,
            'avg_amount': 0
        }
        
    except Exception as e:
        return {
            'transaction_count': 0,
            'total_amount': 0,
            'avg_amount': 0
        }
