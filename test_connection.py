#!/usr/bin/env python3
"""Test PostgreSQL connection with different encodings"""
import psycopg2
import sys

# Try different connection approaches
db_urls = [
    "postgresql://challenge:challenge@localhost:5432/challenge_db",
    "host=localhost port=5432 dbname=challenge_db user=challenge password=challenge",
    "host=localhost port=5432 dbname=challenge_db user=challenge password=challenge client_encoding=utf8",
]

for i, db_url in enumerate(db_urls, 1):
    print(f"\n{i}. Testing: {db_url[:50]}...")
    try:
        conn = psycopg2.connect(db_url)
        print(f"   ✓ Connected successfully!")
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"   PostgreSQL: {version[:50]}...")
        cursor.close()
        conn.close()
        print(f"\n✅ SUCCESS! Use this connection string:")
        print(f"   {db_url}")
        sys.exit(0)
    except Exception as e:
        print(f"   ✗ Error: {e}")

print("\n❌ All connection attempts failed")
sys.exit(1)
