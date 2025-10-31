#!/usr/bin/env python3
"""
Test script to verify database connector works with PostgreSQL
"""
import os
import sys

# Set environment variables for PostgreSQL
os.environ["DATABASE_URL"] = "postgresql://dbadmin:SecurePass12345@multiagent-prod-db.postgres.database.azure.com/postgres?sslmode=require"
os.environ["USE_POSTGRES"] = "true"

# Add the apps/adk directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'adk'))

from orchestration_agent.database.connector import get_db_connector

def main():
    print("="*60)
    print("Testing Database Connector with PostgreSQL")
    print("="*60)

    # Get the database connector
    print("\n[1] Getting database connector...")
    db = get_db_connector()

    # Connect to the database
    print("\n[2] Connecting to database...")
    success = db.connect()

    if not success:
        print("[ERROR] Failed to connect to database")
        return 1

    print(f"[OK] Connected successfully")
    print(f"    Database type: {db.db_type}")

    # Test querying data
    print("\n[3] Testing data queries...")

    # Query 1: Count customers
    print("\n    Query 1: Count customers...")
    results = db.execute_query('SELECT COUNT(*) FROM "dbo_D_Customer"')
    if results:
        print(f"    [OK] Total customers: {results[0][0]:,}")
    else:
        print("    [ERROR] Failed to count customers")

    # Query 2: Get sample customer data
    print("\n    Query 2: Get sample customers...")
    results = db.execute_query('SELECT * FROM "dbo_D_Customer" LIMIT 5')
    if results:
        print(f"    [OK] Retrieved {len(results)} sample customers")
        for i, row in enumerate(results, 1):
            print(f"        Customer {i}: {row[:3]}...")
    else:
        print("    [ERROR] Failed to get sample customers")

    # Query 3: Count sales transactions
    print("\n    Query 3: Count sales transactions...")
    results = db.execute_query('SELECT COUNT(*) FROM "dbo_F_Sales_Transaction"')
    if results:
        print(f"    [OK] Total transactions: {results[0][0]:,}")
    else:
        print("    [ERROR] Failed to count transactions")

    # Query 4: List all tables
    print("\n    Query 4: List all tables...")
    results = db.execute_query("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema='public'
        ORDER BY table_name
    """)
    if results:
        print(f"    [OK] Found {len(results)} tables:")
        for table in results:
            print(f"        - {table[0]}")
    else:
        print("    [ERROR] Failed to list tables")

    # Close connection
    print("\n[4] Closing connection...")
    db.close()
    print("    [OK] Connection closed")

    print("\n" + "="*60)
    print("[SUCCESS] All tests passed!")
    print("="*60)
    return 0

if __name__ == "__main__":
    sys.exit(main())
