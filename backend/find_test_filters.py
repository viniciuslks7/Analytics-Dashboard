import psycopg
import sys

try:
    # Conectar ao banco (síncrono para evitar problemas de event loop no Windows)
    conn = psycopg.connect(
        "host=localhost port=5432 dbname=challenge_db user=challenge password=challenge_2024",
        autocommit=True
    )
    
    cur = conn.cursor()
    
    # Buscar uma combinação real de canal + loja + produto com vendas
    query = """
    SELECT 
        c.name as canal,
        s.name as loja,
        p.name as produto,
        COUNT(DISTINCT sa.id) as num_vendas,
        SUM(ps.quantity) as quantidade_vendida
    FROM sales sa
    JOIN channels c ON sa.channel_id = c.id
    JOIN stores s ON sa.store_id = s.id
    JOIN product_sales ps ON sa.id = ps.sale_id
    JOIN products p ON ps.product_id = p.id
    GROUP BY c.name, s.name, p.name
    HAVING COUNT(DISTINCT sa.id) >= 5
    ORDER BY num_vendas DESC
    LIMIT 10
    """
    
    cur.execute(query)
    results = cur.fetchall()
    
    print("\n🎯 COMBINAÇÕES REAIS COM OS 3 FILTROS:\n")
    print("-" * 80)
    
    for i, (canal, loja, produto, vendas, qtd) in enumerate(results, 1):
        print(f"\n{i}. Canal: {canal}")
        print(f"   Loja: {loja}")
        print(f"   Produto: {produto}")
        print(f"   📊 {vendas} vendas | {qtd:.0f} unidades vendidas")
        print("-" * 80)
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Erro: {e}", file=sys.stderr)
    sys.exit(1)
