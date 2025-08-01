import os
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

# Setup logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize the inventory database with required tables and sample data"""
    try:
        # Get the database path
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, "Inventory", "database", "inventory.db")
        
        # Create database directory if it doesn't exist
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Drop existing tables if they exist
        drop_tables(cursor)
        
        # Create tables
        create_tables(cursor)
        
        # Verify tables were created
        verify_tables(cursor)
        
        # Generate and insert sample data
        insert_sample_data(cursor)
        
        # Commit changes and close connection
        conn.commit()
        conn.close()
        
        logger.info(f"Database initialized successfully at {db_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        return False

def drop_tables(cursor):
    """Drop existing tables if they exist"""
    try:
        tables = [
            "dbo_F_Sales_Transaction",
            "dbo_F_Inventory_Snapshot",
            "dbo_D_Item",
            "dbo_D_Warehouse"
        ]
        for table in tables:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
        logger.info("Existing tables dropped successfully")
    except Exception as e:
        logger.error(f"Error dropping tables: {str(e)}")
        raise

def create_tables(cursor):
    """Create the required tables in the database"""
    try:
        # Create dbo_D_Item table
        cursor.execute("""
        CREATE TABLE dbo_D_Item (
            Item_Key INTEGER PRIMARY KEY,
            Item_Number TEXT NOT NULL,
            Item_Name TEXT NOT NULL,
            Item_Category TEXT NOT NULL,
            Unit_Cost REAL NOT NULL,
            Lead_Time_Days INTEGER,
            Obsolescence_Risk REAL,
            Storage_Requirements TEXT
        )
        """)
        logger.info("Table dbo_D_Item created successfully")
        
        # Create dbo_D_Warehouse table
        cursor.execute("""
        CREATE TABLE dbo_D_Warehouse (
            Warehouse_Key INTEGER PRIMARY KEY,
            Warehouse_ID TEXT NOT NULL,
            Warehouse_Name TEXT NOT NULL,
            Storage_Cost_Per_Unit REAL NOT NULL,
            Warehouse_Type TEXT NOT NULL
        )
        """)
        logger.info("Table dbo_D_Warehouse created successfully")
        
        # Create dbo_F_Inventory_Snapshot table
        cursor.execute("""
        CREATE TABLE dbo_F_Inventory_Snapshot (
            Snapshot_Key INTEGER PRIMARY KEY AUTOINCREMENT,
            Item_Key INTEGER NOT NULL,
            Warehouse_Key INTEGER NOT NULL,
            Current_Stock INTEGER NOT NULL,
            Average_Stock_Level REAL,
            Reorder_Point INTEGER,
            Safety_Stock INTEGER,
            Snapshot_Date TEXT NOT NULL,
            FOREIGN KEY (Item_Key) REFERENCES dbo_D_Item (Item_Key),
            FOREIGN KEY (Warehouse_Key) REFERENCES dbo_D_Warehouse (Warehouse_Key)
        )
        """)
        logger.info("Table dbo_F_Inventory_Snapshot created successfully")
        
        # Create dbo_F_Sales_Transaction table
        cursor.execute("""
        CREATE TABLE dbo_F_Sales_Transaction (
            Transaction_Key INTEGER PRIMARY KEY AUTOINCREMENT,
            Item_Key INTEGER NOT NULL,
            Warehouse_Key INTEGER NOT NULL,
            Transaction_Date TEXT NOT NULL,
            Quantity INTEGER NOT NULL,
            FOREIGN KEY (Item_Key) REFERENCES dbo_D_Item (Item_Key),
            FOREIGN KEY (Warehouse_Key) REFERENCES dbo_D_Warehouse (Warehouse_Key)
        )
        """)
        logger.info("Table dbo_F_Sales_Transaction created successfully")
        
    except Exception as e:
        logger.error(f"Error creating tables: {str(e)}")
        raise

def verify_tables(cursor):
    """Verify that all tables were created with correct columns"""
    try:
        # Get list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        expected_tables = [
            "dbo_D_Item",
            "dbo_D_Warehouse",
            "dbo_F_Inventory_Snapshot",
            "dbo_F_Sales_Transaction"
        ]
        
        # Verify all expected tables exist
        for table in expected_tables:
            if table not in tables:
                raise Exception(f"Table {table} was not created")
            
            # Get table info
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [row[1] for row in cursor.fetchall()]
            logger.info(f"Table {table} columns: {columns}")
            
            # Verify required columns exist
            if table == "dbo_D_Item":
                required_columns = ["Item_Key", "Item_Number", "Item_Name", "Item_Category", 
                                  "Unit_Cost", "Lead_Time_Days", "Obsolescence_Risk", "Storage_Requirements"]
            elif table == "dbo_D_Warehouse":
                required_columns = ["Warehouse_Key", "Warehouse_ID", "Warehouse_Name", 
                                  "Storage_Cost_Per_Unit", "Warehouse_Type"]
            elif table == "dbo_F_Inventory_Snapshot":
                required_columns = ["Snapshot_Key", "Item_Key", "Warehouse_Key", "Current_Stock", 
                                  "Average_Stock_Level", "Reorder_Point", "Safety_Stock", "Snapshot_Date"]
            elif table == "dbo_F_Sales_Transaction":
                required_columns = ["Transaction_Key", "Item_Key", "Warehouse_Key", 
                                  "Transaction_Date", "Quantity"]
            
            missing_columns = [col for col in required_columns if col not in columns]
            if missing_columns:
                raise Exception(f"Table {table} is missing required columns: {missing_columns}")
        
        logger.info("All tables verified successfully")
    except Exception as e:
        logger.error(f"Error verifying tables: {str(e)}")
        raise

def insert_sample_data(cursor):
    """Insert sample data into the database tables"""
    try:
        # Generate sample items
        items = [
            (1, "P1001", "Premium Widget", "Widgets", 45.00, 7, 0.1, "Standard"),
            (2, "P1002", "Standard Widget", "Widgets", 25.00, 5, 0.05, "Standard"),
            (3, "P2001", "Deluxe Gadget", "Gadgets", 65.00, 10, 0.15, "Standard"),
            (4, "P2002", "Basic Gadget", "Gadgets", 35.00, 7, 0.1, "Standard"),
            (5, "P3001", "Professional Tool", "Tools", 85.00, 14, 0.2, "Oversized"),
            (6, "P3002", "Basic Tool", "Tools", 45.00, 7, 0.1, "Standard"),
            (7, "P4001", "Luxury Item", "Luxury", 150.00, 21, 0.3, "High Security"),
            (8, "P4002", "Premium Item", "Luxury", 95.00, 14, 0.2, "Standard"),
            (9, "P5001", "Food Item", "Groceries", 15.00, 3, 0.4, "Temperature Controlled"),
            (10, "P5002", "Beverage", "Groceries", 12.00, 3, 0.3, "Temperature Controlled")
        ]
        
        # Insert items
        cursor.executemany("""
        INSERT INTO dbo_D_Item ([Item_Key], [Item_Number], [Item_Name], [Item_Category], 
                               [Unit_Cost], [Lead_Time_Days], [Obsolescence_Risk], [Storage_Requirements])
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, items)
        logger.info(f"Inserted {len(items)} items into dbo_D_Item")
        
        # Generate sample warehouses
        warehouses = [
            (1, "WH001", "Main Distribution Center", 2.50, "Central"),
            (2, "WH002", "East Coast Facility", 3.25, "Regional"),
            (3, "WH003", "West Coast Facility", 3.75, "Regional"),
            (4, "WH004", "Temperature Controlled Facility", 5.50, "Specialized"),
            (5, "WH005", "Overflow Storage", 1.75, "External")
        ]
        
        # Insert warehouses
        cursor.executemany("""
        INSERT INTO dbo_D_Warehouse ([Warehouse_Key], [Warehouse_ID], [Warehouse_Name], 
                                    [Storage_Cost_Per_Unit], [Warehouse_Type])
        VALUES (?, ?, ?, ?, ?)
        """, warehouses)
        logger.info(f"Inserted {len(warehouses)} warehouses into dbo_D_Warehouse")
        
        # Generate sample inventory snapshots
        today = datetime.now().date()
        inventory_snapshots = []
        
        for item_key in range(1, 11):
            for warehouse_key in range(1, 6):
                if np.random.random() < 0.7:  # 70% chance of being in a warehouse
                    current_stock = np.random.randint(50, 500)
                    avg_stock = current_stock * np.random.uniform(0.8, 1.2)
                    reorder_point = np.random.randint(50, 150)
                    safety_stock = np.random.randint(25, 75)
                    
                    inventory_snapshots.append((
                        item_key, warehouse_key, int(current_stock), float(avg_stock),
                        int(reorder_point), int(safety_stock), today.strftime("%Y-%m-%d")
                    ))
        
        # Insert inventory snapshots
        cursor.executemany("""
        INSERT INTO dbo_F_Inventory_Snapshot 
            ([Item_Key], [Warehouse_Key], [Current_Stock], [Average_Stock_Level], 
             [Reorder_Point], [Safety_Stock], [Snapshot_Date])
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, inventory_snapshots)
        logger.info(f"Inserted {len(inventory_snapshots)} inventory snapshots into dbo_F_Inventory_Snapshot")
        
        # Generate sample sales transactions
        sales_transactions = []
        end_date = today
        start_date = end_date - timedelta(days=365)  # One year of data
        
        current_date = start_date
        while current_date <= end_date:
            for item_key in range(1, 11):
                for warehouse_key in range(1, 6):
                    if np.random.random() < 0.7:  # 70% chance of having sales
                        daily_sales = np.random.poisson(lam=5)  # Average 5 units per day
                        if daily_sales > 0:
                            sales_transactions.append((
                                item_key, warehouse_key, current_date.strftime("%Y-%m-%d"), daily_sales
                            ))
            
            current_date += timedelta(days=1)
        
        # Insert sales transactions
        cursor.executemany("""
        INSERT INTO dbo_F_Sales_Transaction ([Item_Key], [Warehouse_Key], [Transaction_Date], [Quantity])
        VALUES (?, ?, ?, ?)
        """, sales_transactions)
        logger.info(f"Inserted {len(sales_transactions)} sales transactions into dbo_F_Sales_Transaction")
        
        # Verify the data was inserted correctly
        cursor.execute("""
        SELECT COUNT(*) 
        FROM dbo_D_Item i
        JOIN dbo_F_Inventory_Snapshot ist ON i.[Item_Key] = ist.[Item_Key]
        JOIN dbo_D_Warehouse w ON w.[Warehouse_Key] = ist.[Warehouse_Key]
        """)
        count = cursor.fetchone()[0]
        logger.info(f"Verified {count} records in joined tables")
        
    except Exception as e:
        logger.error(f"Error inserting sample data: {str(e)}")
        raise

if __name__ == "__main__":
    # Initialize the database
    init_database() 