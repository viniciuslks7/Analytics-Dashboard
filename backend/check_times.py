import psycopg

conn = psycopg.connect(
    "host=localhost port=5432 dbname=challenge_db user=challenge password=challenge_2024",
    autocommit=True
)

cur = conn.cursor()

print("\n" + "="*80)
print("VERIFICAÇÃO DE TEMPOS MÉDIOS - COM E SEM FILTROS")
print("="*80)

# Teste 1: SEM FILTROS (todos os canais)
print("\n🔍 TESTE 1: SEM FILTROS (Todos os canais)")
print("-" * 80)

query1 = """
SELECT
    COUNT(DISTINCT s.id) as total_vendas,
    COUNT(DISTINCT s.id) FILTER (WHERE delivery_seconds IS NOT NULL) as vendas_com_entrega,
    COUNT(DISTINCT s.id) FILTER (WHERE production_seconds IS NOT NULL) as vendas_com_preparo,
    AVG(delivery_seconds / 60.0) FILTER (WHERE delivery_seconds IS NOT NULL) as tempo_medio_entrega_min,
    AVG(production_seconds / 60.0) FILTER (WHERE production_seconds IS NOT NULL) as tempo_medio_preparo_min
FROM sales s
WHERE sale_status_desc = 'COMPLETED'
  AND DATE(s.created_at) >= '2025-05-05'
  AND DATE(s.created_at) <= '2025-05-20'
"""

cur.execute(query1)
row = cur.fetchone()
total, com_entrega, com_preparo, tempo_entrega, tempo_preparo = row

print(f"  Total vendas: {total:,}")
print(f"  Vendas com tempo entrega: {com_entrega:,} ({com_entrega/total*100:.1f}%)")
print(f"  Vendas com tempo preparo: {com_preparo:,} ({com_preparo/total*100:.1f}%)")
print(f"  ⏱️  TEMPO MÉDIO ENTREGA: {tempo_entrega:.1f} min" if tempo_entrega else "  ⏱️  TEMPO MÉDIO ENTREGA: N/A")
print(f"  👨‍🍳 TEMPO MÉDIO PREPARO: {tempo_preparo:.1f} min" if tempo_preparo else "  👨‍🍳 TEMPO MÉDIO PREPARO: N/A")

# Teste 2: COM FILTRO - iFood
print("\n🔍 TESTE 2: FILTRO - iFood (Delivery)")
print("-" * 80)

query2 = """
SELECT
    COUNT(DISTINCT s.id) as total_vendas,
    COUNT(DISTINCT s.id) FILTER (WHERE delivery_seconds IS NOT NULL) as vendas_com_entrega,
    COUNT(DISTINCT s.id) FILTER (WHERE production_seconds IS NOT NULL) as vendas_com_preparo,
    AVG(delivery_seconds / 60.0) FILTER (WHERE delivery_seconds IS NOT NULL) as tempo_medio_entrega_min,
    AVG(production_seconds / 60.0) FILTER (WHERE production_seconds IS NOT NULL) as tempo_medio_preparo_min
FROM sales s
LEFT JOIN channels ch ON ch.id = s.channel_id
WHERE sale_status_desc = 'COMPLETED'
  AND DATE(s.created_at) >= '2025-05-05'
  AND DATE(s.created_at) <= '2025-05-20'
  AND ch.name IN ('iFood')
"""

cur.execute(query2)
row = cur.fetchone()
total, com_entrega, com_preparo, tempo_entrega, tempo_preparo = row

print(f"  Total vendas: {total:,}")
print(f"  Vendas com tempo entrega: {com_entrega:,} ({com_entrega/total*100:.1f}%)")
print(f"  Vendas com tempo preparo: {com_preparo:,} ({com_preparo/total*100:.1f}%)")
print(f"  ⏱️  TEMPO MÉDIO ENTREGA: {tempo_entrega:.1f} min" if tempo_entrega else "  ⏱️  TEMPO MÉDIO ENTREGA: N/A")
print(f"  👨‍🍳 TEMPO MÉDIO PREPARO: {tempo_preparo:.1f} min" if tempo_preparo else "  👨‍🍳 TEMPO MÉDIO PREPARO: N/A")

# Teste 3: COM FILTRO - Presencial
print("\n🔍 TESTE 3: FILTRO - Presencial (SEM delivery)")
print("-" * 80)

query3 = """
SELECT
    COUNT(DISTINCT s.id) as total_vendas,
    COUNT(DISTINCT s.id) FILTER (WHERE delivery_seconds IS NOT NULL) as vendas_com_entrega,
    COUNT(DISTINCT s.id) FILTER (WHERE production_seconds IS NOT NULL) as vendas_com_preparo,
    AVG(delivery_seconds / 60.0) FILTER (WHERE delivery_seconds IS NOT NULL) as tempo_medio_entrega_min,
    AVG(production_seconds / 60.0) FILTER (WHERE production_seconds IS NOT NULL) as tempo_medio_preparo_min
FROM sales s
LEFT JOIN channels ch ON ch.id = s.channel_id
WHERE sale_status_desc = 'COMPLETED'
  AND DATE(s.created_at) >= '2025-05-05'
  AND DATE(s.created_at) <= '2025-05-20'
  AND ch.name IN ('Presencial')
"""

cur.execute(query3)
row = cur.fetchone()
total, com_entrega, com_preparo, tempo_entrega, tempo_preparo = row

print(f"  Total vendas: {total:,}")
print(f"  Vendas com tempo entrega: {com_entrega:,} ({com_entrega/total*100:.1f}%)")
print(f"  Vendas com tempo preparo: {com_preparo:,} ({com_preparo/total*100:.1f}%)")
print(f"  ⏱️  TEMPO MÉDIO ENTREGA: {tempo_entrega:.1f} min" if tempo_entrega else "  ⏱️  TEMPO MÉDIO ENTREGA: N/A")
print(f"  👨‍🍳 TEMPO MÉDIO PREPARO: {tempo_preparo:.1f} min" if tempo_preparo else "  👨‍🍳 TEMPO MÉDIO PREPARO: N/A")

# Teste 4: COM FILTRO - Uber Eats
print("\n🔍 TESTE 4: FILTRO - Uber Eats (Delivery)")
print("-" * 80)

query4 = """
SELECT
    COUNT(DISTINCT s.id) as total_vendas,
    COUNT(DISTINCT s.id) FILTER (WHERE delivery_seconds IS NOT NULL) as vendas_com_entrega,
    COUNT(DISTINCT s.id) FILTER (WHERE production_seconds IS NOT NULL) as vendas_com_preparo,
    AVG(delivery_seconds / 60.0) FILTER (WHERE delivery_seconds IS NOT NULL) as tempo_medio_entrega_min,
    AVG(production_seconds / 60.0) FILTER (WHERE production_seconds IS NOT NULL) as tempo_medio_preparo_min
FROM sales s
LEFT JOIN channels ch ON ch.id = s.channel_id
WHERE sale_status_desc = 'COMPLETED'
  AND DATE(s.created_at) >= '2025-05-05'
  AND DATE(s.created_at) <= '2025-05-20'
  AND ch.name IN ('Uber Eats')
"""

cur.execute(query4)
row = cur.fetchone()
total, com_entrega, com_preparo, tempo_entrega, tempo_preparo = row

print(f"  Total vendas: {total:,}")
print(f"  Vendas com tempo entrega: {com_entrega:,} ({com_entrega/total*100:.1f}%)")
print(f"  Vendas com tempo preparo: {com_preparo:,} ({com_preparo/total*100:.1f}%)")
print(f"  ⏱️  TEMPO MÉDIO ENTREGA: {tempo_entrega:.1f} min" if tempo_entrega else "  ⏱️  TEMPO MÉDIO ENTREGA: N/A")
print(f"  👨‍🍳 TEMPO MÉDIO PREPARO: {tempo_preparo:.1f} min" if tempo_preparo else "  👨‍🍳 TEMPO MÉDIO PREPARO: N/A")

print("\n" + "="*80)
print("📊 RESUMO:")
print("="*80)
print("Se os tempos estão DIFERENTES entre os testes, o backend está funcionando!")
print("Se aparecem IGUAIS, há um problema no cálculo ou no banco de dados.")
print("="*80 + "\n")

cur.close()
conn.close()
