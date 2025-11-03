import psycopg

conn = psycopg.connect(
    "host=localhost port=5432 dbname=challenge_db user=challenge password=challenge_2024",
    autocommit=True
)

cur = conn.cursor()

# Verificar se há dados nas tabelas principais
queries = [
    ("sales", "SELECT COUNT(*) FROM sales"),
    ("stores", "SELECT COUNT(*) FROM stores"),
    ("channels", "SELECT COUNT(*) FROM channels"),
    ("products", "SELECT COUNT(*) FROM products"),
    ("product_sales", "SELECT COUNT(*) FROM product_sales"),
]

print("\n📊 VERIFICAÇÃO DE DADOS NO BANCO:\n")
for table, query in queries:
    cur.execute(query)
    count = cur.fetchone()[0]
    print(f"  {table:20} → {count:,} registros")

# Verificar canais disponíveis
print("\n\n🔍 CANAIS DISPONÍVEIS:")
cur.execute("SELECT id, name FROM channels ORDER BY name")
for id, name in cur.fetchall():
    print(f"  [{id}] {name}")

# Verificar lojas disponíveis (primeiras 10)
print("\n\n🏪 LOJAS DISPONÍVEIS (amostra):")
cur.execute("SELECT id, name FROM stores ORDER BY name LIMIT 10")
for id, name in cur.fetchall():
    print(f"  [{id}] {name}")

# Verificar produtos disponíveis (primeiros 10)
print("\n\n📦 PRODUTOS DISPONÍVEIS (amostra):")
cur.execute("SELECT id, name FROM products ORDER BY name LIMIT 10")
for id, name in cur.fetchall():
    print(f"  [{id}] {name}")

cur.close()
conn.close()
