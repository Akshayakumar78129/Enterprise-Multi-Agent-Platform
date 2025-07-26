"""Customer engagement classification tool."""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sqlite3
import logging
import os
from typing import Dict, Any, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def analyze_customer_engagement(start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict:
    """
    Analyze customer engagement metrics using actual data from the customers.db database.
    
    Args:
        start_date (str, optional): Start date for analysis (YYYY-MM-DD)
        end_date (str, optional): End date for analysis (YYYY-MM-DD)
        
    Returns:
        Dict containing engagement analysis report
    """
    try:
        # Get path to customers.db
        db_path = "/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db"
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        logger.info("Database connected successfully.")
        
        # Build date filter if dates provided
        date_filter = ""
        if start_date and end_date:
            date_filter = f"WHERE cl.\"Last Activity Date\" BETWEEN '{start_date}' AND '{end_date}'"
        
        # Query to get engagement metrics
        query = f"""
        WITH CustomerEngagement AS (
            SELECT 
                c."Customer Key",
                c."Customer Number",
                c."Customer Name",
                cl."Loyalty Status",
                cl."RFM Score",
                cl."Recency Band",
                cl."Frequency Band",
                cl."Monetary Band",
                cl."Days Since Last Activity",
                cl."Number Sales Txns",
                cl."Avg Sales Amount",
                cl."Last Activity Date",
                CASE 
                    WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
                    WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
                    ELSE 'Low'
                END as engagement_level
            FROM 
                dbo_D_Customer c
            LEFT JOIN 
                dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
            {date_filter}
        )
        SELECT 
            engagement_level,
            COUNT(*) as customer_count,
            AVG("Number Sales Txns") as avg_transactions,
            AVG("Avg Sales Amount") as avg_purchase_value,
            AVG("Days Since Last Activity") as avg_days_since_activity
        FROM CustomerEngagement
        GROUP BY engagement_level
        ORDER BY 
            CASE engagement_level
                WHEN 'High' THEN 1
                WHEN 'Medium' THEN 2
                WHEN 'Low' THEN 3
            END;
        """
        
        cursor = conn.cursor()
        results = cursor.execute(query).fetchall()
        
        # Generate report
        report = "Customer Engagement Analysis Report\n"
        report += "================================\n\n"
        
        for row in results:
            level, count, avg_txns, avg_value, avg_days = row
            report += f"{level} Engagement Customers:\n"
            report += f"- Count: {count}\n"
            report += f"- Average Transactions: {avg_txns:.1f}\n"
            report += f"- Average Purchase Value: ${avg_value:.2f}\n"
            report += f"- Average Days Since Activity: {avg_days:.1f}\n\n"
            
        return {
            "report": report,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error in engagement analysis: {str(e)}")
        return {
            "report": f"Failed to analyze customer engagement: {str(e)}",
            "success": False
        }
    finally:
        if 'conn' in locals():
            conn.close() 