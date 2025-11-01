#!/usr/bin/env python3
"""Test PostgreSQL connection using psycopg3"""
import psycopg

print("Testing connection with psycopg3...")

conn_string = "host=localhost port=5432 dbname=challenge_db user=challenge password=challenge_2024"

try:
    with psycopg.connect(conn_string) as conn:
        print("✅ Connected successfully!")
        
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()[0]
            print(f"PostgreSQL: {version[:80]}...")
            
            cur.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
            count = cur.fetchone()[0]
            print(f"Tables in database: {count}")
            
        print("\n✅ psycopg3 works perfectly!")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
