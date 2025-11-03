"""Script para verificar dados mensais"""
import asyncio
import sys
import selectors
import psycopg

# Fix para Windows ProactorEventLoop
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def check_monthly_data():
    conn = await psycopg.AsyncConnection.connect(
        "postgresql://challenge:challenge_2024@localhost:5432/challenge_db"
    )
    
    print("\n1. Verificando coluna 'mes' na tabela sales:")
    cur = await conn.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sales' 
        AND column_name IN ('mes', 'created_at')
        ORDER BY column_name
    """)
    columns = await cur.fetchall()
    for col in columns:
        print(f"  - {col[0]}: {col[1]}")
    
    print("\n2. Verificando EXTRACT para meses:")
    cur = await conn.execute("""
        SELECT 
            EXTRACT(YEAR FROM created_at) as ano,
            EXTRACT(MONTH FROM created_at) as mes,
            COUNT(*) as qtd,
            SUM(total) as total
        FROM sales 
        GROUP BY ano, mes 
        ORDER BY ano, mes 
        LIMIT 10
    """)
    extracted = await cur.fetchall()
    print(f"  ✅ Encontrados {len(extracted)} registros usando EXTRACT:")
    for row in extracted:
        print(f"    - {int(row[0])}-{int(row[1]):02d}: {row[2]} vendas, R$ {row[3]:.2f}")
    
    print("\n3. Verificando formato de data esperado pelo frontend:")
    cur = await conn.execute("""
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as mes_formatado,
            COUNT(*) as qtd,
            SUM(total) as total
        FROM sales 
        GROUP BY mes_formatado 
        ORDER BY mes_formatado 
        LIMIT 20
    """)
    formatted = await cur.fetchall()
    print(f"  ✅ Formato YYYY-MM ({len(formatted)} meses):")
    for row in formatted:
        print(f"    - {row[0]}: {row[1]} vendas, R$ {row[2]:.2f}")
    
    print("\n4. Verificando range completo de datas:")
    cur = await conn.execute("""
        SELECT 
            MIN(created_at) as primeira_venda,
            MAX(created_at) as ultima_venda,
            COUNT(DISTINCT TO_CHAR(created_at, 'YYYY-MM')) as total_meses
        FROM sales
    """)
    date_range = await cur.fetchone()
    print(f"  📅 Range: {date_range[0]} até {date_range[1]}")
    print(f"  📊 Total de meses distintos: {date_range[2]}")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check_monthly_data())
