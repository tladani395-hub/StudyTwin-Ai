import psycopg

conn = psycopg.connect('postgresql://studytwin:studytwin_password@127.0.0.1:5432/studytwin_db')
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;")
tables = [r[0] for r in cur.fetchall()]

print(f"{'Table Name':<30} | {'Row Count':>10}")
print("-" * 43)

total_rows = 0
for t in tables:
    cur.execute(f'SELECT count(*) FROM "{t}"')
    cnt = cur.fetchone()[0]
    total_rows += cnt
    print(f"{t:<30} | {cnt:>10}")

print("-" * 43)
print(f"{'TOTAL SEEDED ROWS':<30} | {total_rows:>10}")
print(f"{'TOTAL TABLES':<30} | {len(tables):>10}")
conn.close()
