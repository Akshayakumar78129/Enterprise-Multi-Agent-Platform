#!/usr/bin/env python3
"""
Migrate F_Sales_Transaction using COPY command
"""
import sqlite3
import psycopg2
import sys
import io

# PostgreSQL connection details
PG_HOST = "multiagent-prod-db.postgres.database.azure.com"
PG_DATABASE = "postgres"
PG_USER = "dbadmin"
PG_PASSWORD = "SecurePass12345"

# SQLite database path
SQLITE_DB = "apps/adk/orchestration_agent/database/customers.db"
TABLE_NAME = "dbo_F_Sales_Transaction"

def migrate_sales_transaction():
    print("="*60)
    print("Migrating F_Sales_Transaction (COPY method)")
    print("="*60)

    # Connect to SQLite
    print(f"\nConnecting to SQLite: {SQLITE_DB}")
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    print("[OK] Connected to SQLite")

    # Connect to PostgreSQL
    print(f"\nConnecting to PostgreSQL: {PG_HOST}")
    pg_conn = psycopg2.connect(
        host=PG_HOST,
        database=PG_DATABASE,
        user=PG_USER,
        password=PG_PASSWORD,
        sslmode='require'
    )
    print("[OK] Connected to PostgreSQL")

    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()

    # Get row count
    sqlite_cursor.execute(f"SELECT COUNT(*) FROM {TABLE_NAME}")
    total_rows = sqlite_cursor.fetchone()[0]
    print(f"\nTotal rows to migrate: {total_rows:,}")

    if total_rows == 0:
        print("Table is empty")
        return False

    # Drop and recreate table
    print(f"\nRecreating table in PostgreSQL...")
    pg_cursor.execute(f'DROP TABLE IF EXISTS "{TABLE_NAME}" CASCADE')

    # Get column info
    sqlite_cursor.execute(f"PRAGMA table_info({TABLE_NAME})")
    columns_info = sqlite_cursor.fetchall()

    columns_def = []
    for col in columns_info:
        col_name = f'"{col[1]}"'
        col_type = col[2].upper()

        if 'INT' in col_type:
            pg_type = 'INTEGER'
        elif 'TEXT' in col_type or 'CHAR' in col_type:
            pg_type = 'TEXT'
        elif 'REAL' in col_type or 'FLOA' in col_type or 'DOUB' in col_type:
            pg_type = 'DOUBLE PRECISION'
        else:
            pg_type = 'TEXT'

        not_null = "NOT NULL" if col[3] else ""
        columns_def.append(f"{col_name} {pg_type} {not_null}".strip())

    create_table_sql = f'CREATE TABLE "{TABLE_NAME}" ({", ".join(columns_def)})'
    pg_cursor.execute(create_table_sql)
    pg_conn.commit()
    print("[OK] Table created with {} columns".format(len(columns_info)))

    # Prepare CSV data in memory
    print(f"\nPreparing data for COPY...")
    sqlite_cursor.execute(f"SELECT * FROM {TABLE_NAME}")

    # Create CSV in memory
    csv_buffer = io.StringIO()
    row_count = 0

    for row in sqlite_cursor:
        # Convert None to \N (PostgreSQL NULL in COPY)
        values = []
        for val in row:
            if val is None:
                values.append('\\N')
            elif isinstance(val, str):
                # Escape special characters for CSV
                val = str(val).replace('\\', '\\\\').replace('\t', '\\t').replace('\n', '\\n')
                values.append(val)
            else:
                values.append(str(val))

        csv_buffer.write('\t'.join(values) + '\n')
        row_count += 1

        if row_count % 10000 == 0:
            print(f"  Prepared: {row_count:,} / {total_rows:,}")

    print(f"[OK] Prepared {row_count:,} rows")

    # Use COPY to import
    print(f"\nImporting to PostgreSQL via COPY...")
    csv_buffer.seek(0)

    column_names = [f'"{col[1]}"' for col in columns_info]
    copy_sql = f'COPY "{TABLE_NAME}" ({", ".join(column_names)}) FROM STDIN'

    try:
        pg_cursor.copy_expert(copy_sql, csv_buffer)
        pg_conn.commit()
        print("[OK] COPY completed")
    except Exception as e:
        print(f"[ERROR] COPY failed: {e}")
        pg_conn.rollback()
        return False

    # Verify
    pg_cursor.execute(f'SELECT COUNT(*) FROM "{TABLE_NAME}"')
    final_count = pg_cursor.fetchone()[0]
    print(f"\n[OK] Verification: {final_count:,} rows in PostgreSQL")

    sqlite_conn.close()
    pg_conn.close()

    if final_count == total_rows:
        print("\n[SUCCESS] Migration completed!")
        return True
    else:
        print(f"\n[WARNING] Row count mismatch: {final_count} vs {total_rows}")
        return False

if __name__ == "__main__":
    success = migrate_sales_transaction()
    sys.exit(0 if success else 1)
