"""Test script to verify API endpoints"""

import asyncio
import json
from datetime import datetime

# Test database connection
async def test_database():
    from database.connection import DatabaseConnection

    db = DatabaseConnection()
    result = await db.query("SELECT 1 as test", [])
    print(f"Database connection: {'OK' if result else 'FAILED'}")
    return result is not None

# Test schema
def test_schema():
    from domains.churn_prediction.schema import ChurnSchema

    schema = ChurnSchema()
    print(f"Schema tables: {schema.TABLES}")
    print(f"Schema loaded: OK")
    return True

# Test data service
async def test_data_service():
    from domains.churn_prediction.data_service import ChurnDataService

    service = ChurnDataService()
    # Test without filters
    try:
        result = await service.get_customers({})
        print(f"Data service (customers): OK ({len(result.get('rows', []))} rows)")
        return True
    except Exception as e:
        print(f"Data service error: {e}")
        return False

# Test processing service
async def test_processing_service():
    from domains.churn_prediction.processing_service import ChurnProcessingService

    try:
        service = ChurnProcessingService()
        print(f"Processing service initialized: OK")

        # Test summary endpoint
        result = await service.get_dashboard_summary({})
        print(f"Dashboard summary keys: {list(result.keys())}")
        return True
    except Exception as e:
        print(f"Processing service error: {e}")
        return False

# Run all tests
async def main():
    print("=" * 50)
    print("Testing Python Backend API Structure")
    print("=" * 50)

    # Run tests
    db_ok = await test_database()
    schema_ok = test_schema()
    data_ok = await test_data_service()

    print("\n" + "=" * 50)
    print("Testing Processing Service (May have ML import issues)")
    print("=" * 50)
    processing_ok = await test_processing_service()

    print("\n" + "=" * 50)
    print("Summary:")
    print(f"  Database: {'OK' if db_ok else 'FAILED'}")
    print(f"  Schema: {'OK' if schema_ok else 'FAILED'}")
    print(f"  Data Service: {'OK' if data_ok else 'FAILED'}")
    print(f"  Processing Service: {'OK' if processing_ok else 'FAILED'}")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())