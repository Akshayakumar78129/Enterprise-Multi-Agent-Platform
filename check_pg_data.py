import psycopg2

conn = psycopg2.connect(
    host='multiagent-prod-db.postgres.database.azure.com',
    database='postgres',
    user='dbadmin',
    password='SecurePass12345',
    sslmode='require'
)

cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
tables = [row[0] for row in cur.fetchall()]

print(f"Checking all {len(tables)} tables:\n")
total_rows = 0
for t in tables:
    cur.execute(f'SELECT COUNT(*) FROM "{t}"')
    count = cur.fetchone()[0]
    total_rows += count
    status = "[OK]" if count > 0 else "[EMPTY]"
    print(f"{status} {t}: {count:,} rows")

print(f"\nTotal rows across all tables: {total_rows:,}")
conn.close()
