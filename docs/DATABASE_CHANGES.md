# 🗄️ Database Changes - PostgreSQL

---

## 📊 Estrutura do Banco

### Tabelas Principais

```sql
-- Canais de venda
channels
├── id (UUID, PK)
├── name (VARCHAR)
└── created_at (TIMESTAMP)

-- Lojas
stores
├── id (UUID, PK)
├── name (VARCHAR)
├── neighborhood (VARCHAR)
└── created_at (TIMESTAMP)

-- Produtos
products
├── id (UUID, PK)
├── name (VARCHAR)
├── category (VARCHAR)
└── created_at (TIMESTAMP)

-- Clientes
customers
├── id (UUID, PK)
├── name (VARCHAR)
├── email (VARCHAR)
└── created_at (TIMESTAMP)

-- Vendas (tabela principal)
sales
├── id (UUID, PK)
├── sale_date (TIMESTAMP)
├── channel_id (UUID, FK)
├── store_id (UUID, FK)
├── customer_id (UUID, FK)
└── created_at (TIMESTAMP)

-- Produtos vendidos (relação N:N)
product_sales
├── id (UUID, PK)
├── sale_id (UUID, FK)
├── product_id (UUID, FK)
├── quantity (INT)
└── unit_price (DECIMAL)
```

---

## 🔍 Materialized Views

### 1. Vendas por Canal
```sql
CREATE MATERIALIZED VIEW mv_sales_by_channel AS
SELECT 
    ch.name as canal_venda,
    COUNT(DISTINCT s.id) as total_vendas,
    SUM(ps.quantity * ps.unit_price) as faturamento_total,
    AVG(ps.quantity * ps.unit_price) as ticket_medio
FROM sales s
JOIN channels ch ON s.channel_id = ch.id
JOIN product_sales ps ON s.id = ps.sale_id
GROUP BY ch.name;
```

### 2. Top Produtos
```sql
CREATE MATERIALIZED VIEW mv_top_products AS
SELECT 
    p.name as nome_produto,
    p.category as categoria,
    SUM(ps.quantity) as quantidade_vendida,
    SUM(ps.quantity * ps.unit_price) as faturamento_total,
    COUNT(DISTINCT s.id) as numero_vendas
FROM products p
JOIN product_sales ps ON p.id = ps.product_id
JOIN sales s ON ps.sale_id = s.id
GROUP BY p.id, p.name, p.category
ORDER BY faturamento_total DESC;
```

### 3. Vendas por Hora
```sql
CREATE MATERIALIZED VIEW mv_hourly_sales AS
SELECT 
    DATE(s.sale_date) as data,
    EXTRACT(HOUR FROM s.sale_date) as hora,
    COUNT(DISTINCT s.id) as total_vendas,
    SUM(ps.quantity * ps.unit_price) as faturamento
FROM sales s
JOIN product_sales ps ON s.id = ps.sale_id
GROUP BY DATE(s.sale_date), EXTRACT(HOUR FROM s.sale_date);
```

**Commit:** `16ae93b`

---

## 🔄 Migrações

### 1. asyncpg → psycopg3
**Motivo:** Python 3.14 incompatível

**Mudanças:**
- ✅ Connection pool: `AsyncConnectionPool`
- ✅ Placeholders: `$1` → `%s`
- ✅ Fetch methods: mesma interface mantida

**Commits:** `ab978d0`, `83c58c7`

---

### 2. Queries Dinâmicas

**Antes:** Views estáticas
```sql
SELECT * FROM mv_sales_by_channel;
```

**Depois:** Queries dinâmicas com JOINs
```sql
-- Query gerada dinamicamente
SELECT 
  ch.name as canal_venda,
  SUM(ps.quantity * ps.unit_price) as total_revenue
FROM sales s
LEFT JOIN channels ch ON s.channel_id = ch.id
LEFT JOIN product_sales ps ON s.id = ps.sale_id
WHERE ch.name IN (%s, %s)
  AND DATE(s.sale_date) BETWEEN %s AND %s
GROUP BY ch.name
ORDER BY total_revenue DESC;
```

**Vantagens:**
- ✅ Filtros dinâmicos
- ✅ Métricas customizadas
- ✅ Dimensões sob demanda
- ✅ Sem necessidade de views adicionais

---

## 🗂️ Índices

```sql
-- Performance de queries principais
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_channel ON sales(channel_id);
CREATE INDEX idx_sales_store ON sales(store_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_product_sales_sale ON product_sales(sale_id);
CREATE INDEX idx_product_sales_product ON product_sales(product_id);
```

---

## 📈 Volume de Dados

**Dados Gerados:**
- **Canais:** 3 (iFood, Uber Eats, Rappi)
- **Lojas:** 10
- **Produtos:** 50+
- **Clientes:** 100+
- **Vendas:** ~1000
- **Product Sales:** ~2000

**Período:** 05/05/2025 - 20/05/2025

---

## 🔧 Connection Pool

```python
# Configuração psycopg3
pool = AsyncConnectionPool(
    conninfo=DATABASE_URL,
    min_size=2,      # Conexões mínimas
    max_size=10,     # Conexões máximas
    timeout=30,      # Timeout em segundos
    max_idle=300     # Tempo max idle
)
```

---

## 🐛 Bugs Corrigidos

### 1. Placeholders SQL
```sql
-- ❌ ANTES (asyncpg): WHERE field = $1 AND other = $2
-- ✅ DEPOIS (psycopg3): WHERE field = %s AND other = %s
```

### 2. Parâmetros None
```python
# ❌ ANTES: cursor.execute(query, None)
# ✅ DEPOIS: cursor.execute(query, () if not params else params)
```

### 3. Column Mapping
```sql
-- ❌ ANTES: WHERE canal_venda = %s  -- Coluna não existe!
-- ✅ DEPOIS: WHERE ch.name = %s      -- Coluna real após JOIN
```

---

## 📊 Performance

### Query Times (média)
- **Agregações simples:** 5-10ms
- **Drill-down com filtros:** 15-25ms
- **Churn RFM:** 50-100ms
- **Export completo:** 200-300ms

### Otimizações Aplicadas
- ✅ Índices em foreign keys
- ✅ Connection pooling
- ✅ Prepared statements automáticos
- ✅ LIMIT em queries exploratórias

---

## 🔐 Segurança

### SQL Injection Prevention

**Whitelist de Campos:**
```python
ALLOWED_METRICS = [
    'SUM(ps.quantity * ps.unit_price)',
    'COUNT(DISTINCT s.id)',
    'AVG(ps.unit_price)',
    # ...
]

ALLOWED_DIMENSIONS = [
    'canal_venda', 'nome_loja', 
    'nome_produto', 'bairro',
    'DATE(s.sale_date)'
]
```

**Validação:**
```python
if metric not in ALLOWED_METRICS:
    raise ValueError("Métrica não permitida")

if dimension not in ALLOWED_DIMENSIONS:
    raise ValueError("Dimensão não permitida")
```

**Commit:** `7ae4a26`

---

## 🔮 Melhorias Futuras

1. **Particionamento:** Particionar `sales` por data
2. **Read Replicas:** Separar leitura/escrita
3. **Cache Redis:** Cache de queries frequentes
4. **Sharding:** Distribuir dados por região
5. **Archive:** Mover dados antigos para cold storage

---

**Última Atualização:** 03/11/2025 01:45
