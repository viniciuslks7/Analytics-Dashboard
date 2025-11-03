import psycopg

conn = psycopg.connect(
    "host=localhost port=5432 dbname=challenge_db user=challenge password=challenge_2024",
    autocommit=True
)

cur = conn.cursor()

# Verificar dados de tempo de entrega para a Opção 2 (iFood - DELIVERY)
print("\n🔍 VERIFICAÇÃO DE TEMPOS DE ENTREGA - Opção 2 (iFood)\n")
print("Canal: iFood")
print("Loja: Almeida e Filhos - Freitas")
print("Produto: Lasanha M #029")
print("=" * 80)

query = """
SELECT 
    s.id as sale_id,
    s.created_at,
    s.delivery_seconds,
    s.production_seconds,
    s.total_amount,
    ch.name as canal,
    st.name as loja,
    p.name as produto
FROM sales s
JOIN channels ch ON ch.id = s.channel_id
JOIN stores st ON st.id = s.store_id
JOIN product_sales ps ON ps.sale_id = s.id
JOIN products p ON p.id = ps.product_id
WHERE ch.name = 'iFood'
  AND st.name = 'Almeida e Filhos - Freitas'
  AND p.name = 'Lasanha M #029'
ORDER BY s.created_at DESC
LIMIT 15
"""

cur.execute(query)
results = cur.fetchall()

print(f"\n📊 Total de vendas encontradas: {len(results)}\n")

for row in results:
    sale_id, created_at, delivery_sec, production_sec, total, canal, loja, produto = row
    
    delivery_min = f"{delivery_sec/60:.1f} min" if delivery_sec else "NULL"
    production_min = f"{production_sec/60:.1f} min" if production_sec else "NULL"
    
    print(f"Venda #{sale_id} | {created_at.strftime('%Y-%m-%d %H:%M')}")
    print(f"  💰 Valor: R$ {total:.2f}")
    print(f"  🚚 Entrega: {delivery_min}")
    print(f"  👨‍🍳 Preparo: {production_min}")
    print("-" * 80)

# Estatísticas gerais
cur.execute("""
SELECT 
    COUNT(*) as total,
    COUNT(delivery_seconds) as com_tempo_entrega,
    AVG(delivery_seconds / 60.0) FILTER (WHERE delivery_seconds IS NOT NULL) as media_entrega,
    COUNT(production_seconds) as com_tempo_preparo,
    AVG(production_seconds / 60.0) FILTER (WHERE production_seconds IS NOT NULL) as media_preparo
FROM sales s
JOIN channels ch ON ch.id = s.channel_id
JOIN stores st ON st.id = s.store_id
JOIN product_sales ps ON ps.sale_id = s.id
JOIN products p ON p.id = ps.product_id
WHERE ch.name = 'iFood'
  AND st.name = 'Almeida e Filhos - Freitas'
  AND p.name = 'Lasanha M #029'
""")

row = cur.fetchone()
total, com_entrega, media_entrega, com_preparo, media_preparo = row

print(f"\n📈 ESTATÍSTICAS:")
print(f"  Total de vendas: {total}")
print(f"  Com tempo de entrega: {com_entrega} ({com_entrega/total*100:.1f}%)")
print(f"  Tempo médio de entrega: {media_entrega:.1f} min" if media_entrega else "  Tempo médio de entrega: N/A")
print(f"  Com tempo de preparo: {com_preparo} ({com_preparo/total*100:.1f}%)")
print(f"  Tempo médio de preparo: {media_preparo:.1f} min" if media_preparo else "  Tempo médio de preparo: N/A")

cur.close()
conn.close()
