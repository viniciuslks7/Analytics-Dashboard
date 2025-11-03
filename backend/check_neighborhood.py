import psycopg

conn = psycopg.connect(
    "host=localhost port=5432 dbname=challenge_db user=challenge password=challenge_2024",
    autocommit=True
)

cur = conn.cursor()

print("\n" + "="*80)
print("🚚 VERIFICAÇÃO - TEMPO MÉDIO DE ENTREGA POR BAIRRO")
print("="*80 + "\n")

query = """
SELECT 
    COALESCE(da.neighborhood, '(não informado)') as bairro,
    COUNT(*) as entregas,
    AVG(s.delivery_seconds / 60.0) as tempo_medio_min
FROM sales s
LEFT JOIN delivery_addresses da ON da.sale_id = s.id
WHERE s.delivery_seconds IS NOT NULL
  AND s.sale_status_desc = 'COMPLETED'
GROUP BY bairro
ORDER BY entregas DESC
LIMIT 15
"""

cur.execute(query)
rows = cur.fetchall()

print(f"{'Bairro':<35} {'Entregas':>12} {'Tempo Médio':>15}")
print("="*80)

for row in rows:
    bairro, entregas, tempo = row
    print(f"{bairro:<35} {entregas:>12,} {tempo:>12.1f} min")

print("\n" + "="*80)
print("📊 ANÁLISE:")
print("="*80)

# Check if null neighborhoods exist
cur.execute("""
SELECT COUNT(*) FROM delivery_addresses WHERE neighborhood IS NULL
""")
null_count = cur.fetchone()[0]
print(f"Endereços com bairro NULL: {null_count:,}")

# Check total delivery addresses
cur.execute("SELECT COUNT(*) FROM delivery_addresses")
total_addresses = cur.fetchone()[0]
print(f"Total de endereços: {total_addresses:,}")
print(f"Porcentagem NULL: {(null_count/total_addresses)*100:.1f}%")

cur.close()
conn.close()
