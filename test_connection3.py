#!/usr/bin/env python3
"""Test PostgreSQL connection using environment variables"""
import os
import sys

# Set PostgreSQL environment variables
os.environ['PGHOST'] = 'localhost'
os.environ['PGPORT'] = '5432'
os.environ['PGDATABASE'] = 'challenge_db'
os.environ['PGUSER'] = 'challenge'
os.environ['PGPASSWORD'] = 'challenge'
os.environ['PGCLIENTENCODING'] = 'UTF8'

print("Testing connection with environment variables...")
print(f"PGHOST={os.environ['PGHOST']}")
print(f"PGPORT={os.environ['PGPORT']}")
print(f"PGDATABASE={os.environ['PGDATABASE']}")
print(f"PGUSER={os.environ['PGUSER']}")
print()

import psycopg2

try:
    # Connect using environment variables (no connection string)
    conn = psycopg2.connect("")
    print("✅ Connected successfully!")
    
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()[0]
    print(f"PostgreSQL: {version[:80]}...")
    
    cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    count = cursor.fetchone()[0]
    print(f"Tables in database: {count}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
