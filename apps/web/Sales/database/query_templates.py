"""
Common SQL query templates for the Sales Analytics Multi-Agent System.
"""

import logging
from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from . import connection

# Sales Transaction Queries
GET_SALES_TRANSACTIONS = """
    SELECT 
        t."Txn Date" as date,
        t."Net Sales Amount" as amount,
        t."Net Sales Quantity" as quantity,
        c."Customer Name" as customer_name,
        i."Item Desc" as product_name,
        i."Item Category Desc" as category,
        i."Item Subcategory Desc" as subcategory,
        r."Sales Org Hrchy L1 Name" as region_name
    FROM "dbo_F_Sales_Transaction" t
    LEFT JOIN "dbo_D_Customer" c ON t."Customer Key" = c."Customer Key"
    LEFT JOIN "dbo_D_Item" i ON t."Item Key" = i."Item Key"
    LEFT JOIN "dbo_D_Sales_Organization" r ON t."Sales Organization Key" = r."Sales Organization Key"
    WHERE t."Txn Date" BETWEEN ? AND ?
        AND t."Deleted Flag" = 0
        AND t."Excluded Flag" = 0
"""

# Sales Performance Queries
GET_SALES_PERFORMANCE = """
    SELECT 
        strftime('%Y-%m', t."Txn Date") as month,
        SUM(t."Net Sales Amount") as total_sales,
        COUNT(DISTINCT t."Customer Key") as unique_customers,
        COUNT(DISTINCT t."Sales Txn Number") as total_orders
    FROM "dbo_F_Sales_Transaction" t
    WHERE t."Txn Date" BETWEEN ? AND ?
        AND t."Deleted Flag" = 0
        AND t."Excluded Flag" = 0
    GROUP BY strftime('%Y-%m', t."Txn Date")
    ORDER BY month
"""

# Product Performance Queries
GET_PRODUCT_PERFORMANCE = """
    SELECT 
        i."Item Desc" as product_name,
        i."Item Category Desc" as category,
        SUM(t."Net Sales Amount") as total_sales,
        COUNT(DISTINCT t."Customer Key") as unique_customers,
        COUNT(DISTINCT t."Sales Txn Number") as total_orders
    FROM "dbo_F_Sales_Transaction" t
    JOIN "dbo_D_Item" i ON t."Item Key" = i."Item Key"
    WHERE t."Txn Date" BETWEEN ? AND ?
        AND t."Deleted Flag" = 0
        AND t."Excluded Flag" = 0
    GROUP BY i."Item Desc", i."Item Category Desc"
"""

# Regional Performance Queries
GET_REGIONAL_PERFORMANCE = """
    SELECT 
        r.RegionName,
        SUM(t.Amount) as TotalSales,
        COUNT(DISTINCT t.CustomerID) as UniqueCustomers,
        COUNT(DISTINCT t.OrderID) as TotalOrders
    FROM dbo_F_Sales_Transaction t
    JOIN dbo_D_Sales_Organization r ON t.RegionID = r.RegionID
    WHERE t.TransactionDate BETWEEN ? AND ?
    GROUP BY r.RegionName
    ORDER BY TotalSales DESC
"""

# Customer Analysis Queries
GET_CUSTOMER_ANALYSIS = """
    SELECT 
        c.CustomerName,
        c.CustomerCategory,
        SUM(t.Amount) as TotalSpent,
        COUNT(DISTINCT t.OrderID) as TotalOrders,
        MIN(t.TransactionDate) as FirstPurchase,
        MAX(t.TransactionDate) as LastPurchase
    FROM dbo_F_Sales_Transaction t
    JOIN dbo_D_Customer c ON t.CustomerID = c.CustomerID
    WHERE t.TransactionDate BETWEEN ? AND ?
    GROUP BY c.CustomerName, c.CustomerCategory
    ORDER BY TotalSpent DESC
"""

def get_latest_date(conn) -> str:
    """
    Get the latest date from the sales transactions table.
    
    Args:
        conn: Database connection
        
    Returns:
        Latest date as string in YYYY-MM-DD format
    """
    try:
        query = """
            SELECT MAX("Txn Date") as latest_date
            FROM "dbo_F_Sales_Transaction"
            WHERE "Deleted Flag" = 0 AND "Excluded Flag" = 0
        """
        result = pd.read_sql_query(query, conn)
        if result.empty or result['latest_date'].iloc[0] is None:
            return datetime.now().strftime("%Y-%m-%d")
        return result['latest_date'].iloc[0]
    except Exception as e:
        logging.error(f"Error getting latest date: {str(e)}")
        return datetime.now().strftime("%Y-%m-%d")

def get_date_range(time_period: str) -> Tuple[str, str]:
    """
    Get date range based on time period.
    
    Args:
        time_period: Time period ('last_7_days', 'last_30_days', 'last_90_days', 'last_year')
        
    Returns:
        Tuple of (start_date, end_date) in YYYY-MM-DD format
    """
    try:
        conn, wrapper = connection.get_connection()
        end_date = get_latest_date(conn)
        end_date_dt = datetime.strptime(end_date, "%Y-%m-%d")
        
        if time_period == 'last_7_days':
            start_date = (end_date_dt - timedelta(days=7)).strftime("%Y-%m-%d")
        elif time_period == 'last_30_days':
            start_date = (end_date_dt - timedelta(days=30)).strftime("%Y-%m-%d")
        elif time_period == 'last_90_days':
            start_date = (end_date_dt - timedelta(days=90)).strftime("%Y-%m-%d")
        elif time_period == 'last_year':
            start_date = (end_date_dt - timedelta(days=365)).strftime("%Y-%m-%d")
        else:
            raise ValueError(f"Invalid time period: {time_period}")
            
        return start_date, end_date
    except Exception as e:
        logging.error(f"Error getting date range: {str(e)}")
        raise
    finally:
        if 'conn' in locals():
            conn.close()
        if 'wrapper' in locals():
            wrapper.close() 