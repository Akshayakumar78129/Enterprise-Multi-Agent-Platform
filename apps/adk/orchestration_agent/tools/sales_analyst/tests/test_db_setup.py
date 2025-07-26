"""
Test database setup for sales analyst tests.
"""

import sqlite3
import os
from datetime import datetime, timedelta
import random

def setup_test_database():
    """Set up a test database with sample data."""
    # Create test database in memory
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY,
            date TEXT,
            product TEXT,
            category TEXT,
            region TEXT,
            customer TEXT,
            revenue REAL,
            units INTEGER,
            cost REAL,
            order_id TEXT
        )
    """)
    
    # Generate sample data
    products = ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard']
    categories = ['Electronics', 'Accessories']
    regions = ['North', 'South', 'East', 'West']
    customers = ['Customer1', 'Customer2', 'Customer3', 'Customer4']
    
    # Generate sales data for 6 months
    start_date = datetime(2020, 6, 1)
    end_date = datetime(2020, 12, 31)
    current_date = start_date
    
    sample_data = []
    order_id = 1
    
    while current_date <= end_date:
        # Generate 3-5 sales per day
        for _ in range(random.randint(3, 5)):
            product = random.choice(products)
            category = 'Electronics' if product in ['Laptop', 'Phone', 'Tablet'] else 'Accessories'
            region = random.choice(regions)
            customer = random.choice(customers)
            units = random.randint(1, 5)
            revenue = units * (random.uniform(500, 1000) if category == 'Electronics' else random.uniform(50, 200))
            cost = revenue * random.uniform(0.4, 0.7)
            
            sample_data.append((
                current_date.strftime('%Y-%m-%d'),
                product,
                category,
                region,
                customer,
                revenue,
                units,
                cost,
                f'ORD-{order_id}'
            ))
            order_id += 1
        
        current_date += timedelta(days=1)
    
    # Insert sample data
    cursor.executemany(
        """
        INSERT INTO sales (date, product, category, region, customer, revenue, units, cost, order_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        sample_data
    )
    
    conn.commit()
    return conn

if __name__ == "__main__":
    setup_test_database() 