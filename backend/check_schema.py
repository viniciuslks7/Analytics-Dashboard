"""Script simples para verificar schema"""
import asyncio
import sys
import psycopg

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def main():
    conn = await psycopg.AsyncConnection.connect(
        "postgresql://challenge:challenge_2024@localhost:5432/challenge_db"
    )
    
    print("Colunas da tabela sales:")
    cur = await conn.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sales' 
        ORDER BY ordinal_position
    """)
    for row in await cur.fetchall():
        print(f"  - {row[0]}: {row[1]}")
    
    await conn.close()

asyncio.run(main())
