#!/usr/bin/env python3
"""Test PostgreSQL connection with encoding fixes"""
import os
import sys
import locale

# Force UTF-8 encoding
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['LANG'] = 'en_US.UTF-8'
os.environ['LC_ALL'] = 'en_US.UTF-8'

# Set console encoding for Windows
if sys.platform == 'win32':
    import ctypes
    kernel32 = ctypes.windll.kernel32
    kernel32.SetConsoleCP(65001)  # UTF-8
    kernel32.SetConsoleOutputCP(65001)  # UTF-8

print(f"System encoding: {sys.getdefaultencoding()}")
print(f"Locale: {locale.getpreferredencoding()}")
print()

import psycopg2

db_url = "host=localhost port=5432 dbname=challenge_db user=challenge password=challenge"

print(f"Testing connection...")
try:
    conn = psycopg2.connect(db_url)
    print(f"✓ Connected successfully!")
    
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()[0]
    print(f"PostgreSQL: {version[:80]}...")
    
    cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    count = cursor.fetchone()[0]
    print(f"Tables in database: {count}")
    
    cursor.close()
    conn.close()
    print("\n✅ Connection works!")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
