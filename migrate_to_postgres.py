#!/usr/bin/env python3
"""
Migrate SQLite database to PostgreSQL
"""
import sqlite3
import psycopg2
from psycopg2.extras import execute_batch
import sys

# PostgreSQL connection details
PG_HOST = "multiagent-prod-db.postgres.database.azure.com"
PG_DATABASE = "postgres"
PG_USER = "dbadmin"
PG_PASSWORD = "SecurePass12345"

# SQLite database path
SQLITE_DB = "apps/adk/orchestration_agent/database/customers.db"

def get_table_schema(sqlite_cursor, table_name):
    """Get CREATE TABLE statement from SQLite"""
    sqlite_cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
    result = sqlite_cursor.fetchone()
    return result[0] if result else None

def convert_sqlite_to_postgres_type(sqlite_type):
    """Convert SQLite types to PostgreSQL types"""
    sqlite_type = sqlite_type.upper()
    if 'INT' in sqlite_type:
        return 'INTEGER'
    elif 'TEXT' in sqlite_type or 'CHAR' in sqlite_type or 'CLOB' in sqlite_type:
        return 'TEXT'
    elif 'REAL' in sqlite_type or 'FLOA' in sqlite_type or 'DOUB' in sqlite_type:
        return 'DOUBLE PRECISION'
    elif 'BLOB' in sqlite_type:
        return 'BYTEA'
    elif 'NUMERIC' in sqlite_type or 'DECIMAL' in sqlite_type:
        return 'NUMERIC'
    else:
        return 'TEXT'

def migrate_table(sqlite_conn, pg_conn, table_name):
    """Migrate a single table from SQLite to PostgreSQL"""
    print(f"\nMigrating table: {table_name}")

    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()

    # Get table schema
    sqlite_cursor.execute(f"PRAGMA table_info({table_name})")
    columns_info = sqlite_cursor.fetchall()

    # Create PostgreSQL table
    columns_def = []
    for col in columns_info:
        col_name = f'"{col[1]}"'
        col_type = convert_sqlite_to_postgres_type(col[2])
        not_null = "NOT NULL" if col[3] else ""
        columns_def.append(f"{col_name} {col_type} {not_null}".strip())

    create_table_sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" ({", ".join(columns_def)})'

    try:
        pg_cursor.execute(f'DROP TABLE IF EXISTS "{table_name}" CASCADE')
        pg_cursor.execute(create_table_sql)
        pg_conn.commit()
        print(f"  Created table schema")
    except Exception as e:
        print(f"  Error creating table: {e}")
        return False

    # Get row count
    sqlite_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    total_rows = sqlite_cursor.fetchone()[0]
    print(f"  Total rows to migrate: {total_rows:,}")

    if total_rows == 0:
        print(f"  Skipping empty table")
        return True

    # Migrate data in batches
    batch_size = 1000
    sqlite_cursor.execute(f"SELECT * FROM {table_name}")

    column_names = [f'"{col[1]}"' for col in columns_info]
    insert_sql = f'INSERT INTO "{table_name}" ({", ".join(column_names)}) VALUES ({", ".join(["%s"] * len(column_names))})'

    rows_migrated = 0
    while True:
        rows = sqlite_cursor.fetchmany(batch_size)
        if not rows:
            break

        try:
            execute_batch(pg_cursor, insert_sql, rows, page_size=batch_size)
            pg_conn.commit()
            rows_migrated += len(rows)
            print(f"  Migrated {rows_migrated:,} / {total_rows:,} rows ({rows_migrated/total_rows*100:.1f}%)")
        except Exception as e:
            print(f"  Error inserting batch: {e}")
            pg_conn.rollback()
            return False

    print(f"  [OK] Successfully migrated {rows_migrated:,} rows")
    return True

def main():
    """Main migration function"""
    print("="*60)
    print("SQLite to PostgreSQL Migration")
    print("="*60)

    # Connect to SQLite
    print(f"\nConnecting to SQLite database: {SQLITE_DB}")
    try:
        sqlite_conn = sqlite3.connect(SQLITE_DB)
        print("[OK] Connected to SQLite")
    except Exception as e:
        print(f"[ERROR] Error connecting to SQLite: {e}")
        return 1

    # Connect to PostgreSQL
    print(f"\nConnecting to PostgreSQL: {PG_HOST}")
    try:
        pg_conn = psycopg2.connect(
            host=PG_HOST,
            database=PG_DATABASE,
            user=PG_USER,
            password=PG_PASSWORD,
            sslmode='require'
        )
        print("[OK] Connected to PostgreSQL")
    except Exception as e:
        print(f"[ERROR] Error connecting to PostgreSQL: {e}")
        return 1

    # Get list of tables
    sqlite_cursor = sqlite_conn.cursor()
    sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in sqlite_cursor.fetchall()]

    print(f"\nFound {len(tables)} tables to migrate:")
    for table in tables:
        print(f"  - {table}")

    # Migrate each table
    print("\n" + "="*60)
    print("Starting migration...")
    print("="*60)

    success_count = 0
    for table in tables:
        if migrate_table(sqlite_conn, pg_conn, table):
            success_count += 1

    # Close connections
    sqlite_conn.close()
    pg_conn.close()

    # Summary
    print("\n" + "="*60)
    print("Migration Summary")
    print("="*60)
    print(f"Successfully migrated: {success_count}/{len(tables)} tables")

    if success_count == len(tables):
        print("\n[OK] Migration completed successfully!")
        return 0
    else:
        print(f"\n[ERROR] Migration incomplete: {len(tables) - success_count} tables failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
