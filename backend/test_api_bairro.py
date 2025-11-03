import asyncio
import sys
import selectors
import psycopg
from app.services.analytics_service import AnalyticsService

# Fix for Windows ProactorEventLoop
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test():
    conn = await psycopg.AsyncConnection.connect(
        "host=localhost port=5432 dbname=challenge_db user=challenge password=challenge_2024"
    )
    
    service = AnalyticsService(conn)
    
    result = await service.execute_query({
        'metrics': ['tempo_medio_entrega', 'qtd_vendas'],
        'dimensions': ['bairro'],
        'filters': {},
        'order_by': [{'field': 'qtd_vendas', 'direction': 'desc'}],
        'limit': 15
    })
    
    print("\n" + "="*80)
    print("🔍 DADOS DA API - Top 15 bairros por volume de entregas")
    print("="*80 + "\n")
    
    print(f"{'#':<4} {'Bairro':<35} {'Entregas':>12} {'Tempo Médio':>15}")
    print("="*80)
    
    for i, row in enumerate(result['data']):
        bairro = row.get('bairro', 'NULL')
        qtd = row.get('qtd_vendas', 0)
        tempo = row.get('tempo_medio_entrega', 0)
        print(f"{i+1:<4} {str(bairro):<35} {qtd:>12,} {tempo:>12.1f} min")
    
    print("\n" + "="*80)
    print(f"Total de linhas retornadas: {len(result['data'])}")
    print("="*80 + "\n")
    
    # Check for None values
    none_count = sum(1 for row in result['data'] if row.get('bairro') is None)
    print(f"Linhas com bairro=None: {none_count}")
    
    await conn.close()

asyncio.run(test())
