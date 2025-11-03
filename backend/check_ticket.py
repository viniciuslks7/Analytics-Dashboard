"""Script para verificar cálculo de ticket_medio"""
import asyncio
import sys
import psycopg

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def main():
    conn = await psycopg.AsyncConnection.connect(
        "postgresql://challenge:challenge_2024@localhost:5432/challenge_db"
    )
    
    print("\n📊 ANÁLISE DE TICKET MÉDIO\n")
    
    print("1. Ticket médio GERAL (sem agrupar):")
    cur = await conn.execute("""
        SELECT 
            COUNT(*) as qtd_vendas,
            SUM(total_amount) as faturamento,
            AVG(total_amount) as ticket_medio
        FROM sales
    """)
    row = await cur.fetchone()
    print(f"   {row[0]:,} vendas")
    print(f"   R$ {row[1]:,.2f} faturamento")
    print(f"   R$ {row[2]:.2f} ticket médio\n")
    
    print("2. Ticket médio POR DIA (primeiros 10 dias):")
    cur = await conn.execute("""
        SELECT 
            DATE(created_at) as data,
            COUNT(*) as qtd_vendas,
            SUM(total_amount) as faturamento,
            AVG(total_amount) as ticket_medio
        FROM sales
        GROUP BY DATE(created_at)
        ORDER BY data
        LIMIT 10
    """)
    print("   Data       | Vendas | Faturamento    | Ticket Médio")
    print("   " + "-" * 58)
    for row in await cur.fetchall():
        print(f"   {row[0]} | {row[1]:6,} | R$ {row[2]:12,.2f} | R$ {row[3]:8.2f}")
    
    print("\n3. Variação do ticket médio por dia:")
    cur = await conn.execute("""
        WITH daily_stats AS (
            SELECT 
                DATE(created_at) as data,
                AVG(total_amount) as ticket_medio
            FROM sales
            GROUP BY DATE(created_at)
        )
        SELECT 
            MIN(ticket_medio) as min_ticket,
            MAX(ticket_medio) as max_ticket,
            AVG(ticket_medio) as avg_ticket,
            STDDEV(ticket_medio) as stddev_ticket
        FROM daily_stats
    """)
    row = await cur.fetchone()
    print(f"   Mínimo: R$ {row[0]:.2f}")
    print(f"   Máximo: R$ {row[1]:.2f}")
    print(f"   Média:  R$ {row[2]:.2f}")
    print(f"   Desvio: R$ {row[3]:.2f}")
    print(f"   Variação: {((row[1] - row[0]) / row[0] * 100):.1f}%")
    
    await conn.close()

asyncio.run(main())
