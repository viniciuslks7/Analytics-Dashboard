"""Script para verificar distribuição mensal dos dados"""
import asyncio
import sys
import psycopg

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def main():
    conn = await psycopg.AsyncConnection.connect(
        "postgresql://challenge:challenge_2024@localhost:5432/challenge_db"
    )
    
    print("\n📅 ANÁLISE DE DADOS MENSAIS\n")
    
    print("1. Range de datas:")
    cur = await conn.execute("""
        SELECT 
            MIN(created_at)::date as primeira_venda,
            MAX(created_at)::date as ultima_venda,
            MAX(created_at)::date - MIN(created_at)::date as dias_total
        FROM sales
    """)
    row = await cur.fetchone()
    print(f"   Primeira venda: {row[0]}")
    print(f"   Última venda: {row[1]}")
    print(f"   Total de dias: {row[2]} dias\n")
    
    print("2. Dados por mês (formato YYYY-MM):")
    cur = await conn.execute("""
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as mes,
            COUNT(*) as qtd_vendas,
            SUM(total_amount) as faturamento
        FROM sales 
        GROUP BY mes 
        ORDER BY mes
    """)
    rows = await cur.fetchall()
    print(f"   Total de meses: {len(rows)}\n")
    for row in rows:
        print(f"   {row[0]}: {row[1]:,} vendas, R$ {row[2]:,.2f}")
    
    await conn.close()

asyncio.run(main())
