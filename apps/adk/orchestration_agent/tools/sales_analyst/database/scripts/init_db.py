"""
Database initialization script.
"""

import os
import sys
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)

import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables(conn):
    """Create database tables."""
    cursor = conn.cursor()
    
    # Create Item table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS "dbo_D_Item" (
            "Item Key" INTEGER PRIMARY KEY,
            "Item Desc" TEXT,
            "Item Category Desc" TEXT,
            "Item Subcategory Desc" TEXT,
            "Base Cost" REAL
        )
    """)
    
    # Create Customer table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS "dbo_D_Customer" (
            "Customer Key" INTEGER PRIMARY KEY,
            "Customer Name" TEXT
        )
    """)
    
    # Create Sales Organization table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS "dbo_D_Sales_Organization" (
            "Sales Organization Key" INTEGER PRIMARY KEY,
            "Sales Org Hrchy L1 Name" TEXT
        )
    """)
    
    # Create Sales Transaction table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS "dbo_F_Sales_Transaction" (
            "Transaction Key" INTEGER PRIMARY KEY,
            "Txn Date" DATE,
            "Net Sales Amount" REAL,
            "Net Sales Quantity" INTEGER,
            "Item Key" INTEGER,
            "Customer Key" INTEGER,
            "Sales Organization Key" INTEGER,
            "Deleted Flag" INTEGER DEFAULT 0,
            "Excluded Flag" INTEGER DEFAULT 0,
            FOREIGN KEY ("Item Key") REFERENCES "dbo_D_Item" ("Item Key"),
            FOREIGN KEY ("Customer Key") REFERENCES "dbo_D_Customer" ("Customer Key"),
            FOREIGN KEY ("Sales Organization Key") REFERENCES "dbo_D_Sales_Organization" ("Sales Organization Key")
        )
    """)
    
    conn.commit()

def generate_sample_data():
    """Generate sample data for the database."""
    # Generate items
    items = pd.DataFrame({
        "Item Key": range(1, 11),
        "Item Desc": [
            "Indoor Cycling Bike w/Monitor M",
            "Electric City Bike L",
            "Indoor Cycling Bike w/Monitor S",
            "Electric City Bike M",
            "Electric City Bike S",
            "Mountain Bike Pro L",
            "Mountain Bike Pro M",
            "Mountain Bike Pro S",
            "Road Bike Elite L",
            "Road Bike Elite M"
        ],
        "Item Category Desc": ["Bikes"] * 10,
        "Item Subcategory Desc": ["Indoor", "Electric", "Indoor", "Electric", "Electric", 
                                 "Mountain", "Mountain", "Mountain", "Road", "Road"],
        "Base Cost": np.random.uniform(500, 2000, 10)
    })
    
    # Generate customers
    customers = pd.DataFrame({
        "Customer Key": range(1, 21),
        "Customer Name": [f"Customer {i}" for i in range(1, 21)]
    })
    
    # Generate sales organizations
    sales_orgs = pd.DataFrame({
        "Sales Organization Key": range(1, 6),
        "Sales Org Hrchy L1 Name": ["North", "South", "East", "West", "Central"]
    })
    
    # Generate transactions
    num_transactions = 1000
    transactions = pd.DataFrame({
        "Transaction Key": range(1, num_transactions + 1),
        "Txn Date": pd.date_range(end=datetime.now(), periods=num_transactions),
        "Net Sales Amount": np.random.uniform(1000, 5000, num_transactions),
        "Net Sales Quantity": np.random.randint(1, 5, num_transactions),
        "Item Key": np.random.randint(1, 11, num_transactions),
        "Customer Key": np.random.randint(1, 21, num_transactions),
        "Sales Organization Key": np.random.randint(1, 6, num_transactions),
        "Deleted Flag": 0,
        "Excluded Flag": 0
    })
    
    return items, customers, sales_orgs, transactions

def insert_data(conn, items, customers, sales_orgs, transactions):
    """Insert sample data into the database."""
    items.to_sql("dbo_D_Item", conn, if_exists="replace", index=False)
    customers.to_sql("dbo_D_Customer", conn, if_exists="replace", index=False)
    sales_orgs.to_sql("dbo_D_Sales_Organization", conn, if_exists="replace", index=False)
    transactions.to_sql("dbo_F_Sales_Transaction", conn, if_exists="replace", index=False)

def init_database():
    """Initialize the database with tables and sample data."""
    try:
        db_path = config.DATABASE['path']
        logger.info(f"Initializing database at: {db_path}")
        
        # Create database directory if it doesn't exist
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # Connect to database
        conn = sqlite3.connect(db_path)
        
        # Create tables
        create_tables(conn)
        
        # Generate and insert sample data
        items, customers, sales_orgs, transactions = generate_sample_data()
        insert_data(conn, items, customers, sales_orgs, transactions)
        
        logger.info("Database initialized successfully")
        conn.close()
        
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

if __name__ == "__main__":
    init_database() 