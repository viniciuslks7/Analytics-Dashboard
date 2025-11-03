# 🐍 Backend Changes - Python/FastAPI

---

## 📦 Stack Tecnológico

- **Python:** 3.14
- **Framework:** FastAPI 0.115.5
- **Database:** PostgreSQL + psycopg3 (migrado de asyncpg)
- **Pool:** psycopg-pool 3.2.3
- **Validação:** Pydantic 2.10.3

---

## 🏗️ Estrutura Criada

```
backend/
├── app/
│   ├── main.py              # FastAPI app + routers
│   ├── config.py            # Settings (DATABASE_URL)
│   ├── db/
│   │   └── database.py      # Database class + pool
│   ├── models/
│   │   ├── schemas.py       # AnalyticsQueryRequest
│   │   └── alert.py         # Alert models
│   ├── services/
│   │   ├── analytics_service.py  # Queries dinâmicas
│   │   └── alert_service.py      # In-memory alerts
│   └── api/
│       ├── analytics.py     # POST /api/v1/analytics/query
│       └── alerts.py        # CRUD alertas
└── requirements.txt
```

---

## 🔧 Principais Alterações

### 1. Migração asyncpg → psycopg3
**Motivo:** Python 3.14 incompatível com asyncpg

**Antes:**
```python
import asyncpg
pool = await asyncpg.create_pool(DATABASE_URL)
```

**Depois:**
```python
import psycopg
from psycopg_pool import AsyncConnectionPool

pool = AsyncConnectionPool(
    conninfo=DATABASE_URL,
    min_size=2,
    max_size=10
)
```

**Commits:** `ab978d0`, `83c58c7`

---

### 2. Analytics Service - Query Dinâmica

**Arquivo:** `backend/app/services/analytics_service.py`

**Funcionalidades:**
- ✅ Métricas dinâmicas (`SUM`, `COUNT`, `AVG`)
- ✅ Dimensões dinâmicas (canal, produto, loja, data)
- ✅ Filtros com mapeamento automático
- ✅ JOINs automáticos baseado em campos
- ✅ Validação de SQL injection

**Mapeamento de Campos:**
```python
DIMENSIONS_MAP = {
    'canal_venda': ('ch.name', 'channel'),
    'nome_loja': ('st.name', 'store'),
    'nome_produto': ('p.name', 'product'),
    'bairro': ('st.neighborhood', 'store'),
    'DATE(s.sale_date)': ('DATE(s.sale_date)', None)
}
```

**Exemplo Query Gerada:**
```python
# Input
{
  "metrics": ["SUM(ps.quantity * ps.unit_price)"],
  "dimensions": ["canal_venda"],
  "filters": {"canal_venda": ["iFood", "Uber Eats"]}
}

# Output SQL
SELECT 
  ch.name as canal_venda,
  SUM(ps.quantity * ps.unit_price) as metric_0
FROM sales s
LEFT JOIN channels ch ON s.channel_id = ch.id
LEFT JOIN product_sales ps ON s.id = ps.sale_id
WHERE ch.name IN (%s, %s)
GROUP BY ch.name
```

**Commits:** `c886f32`, `3f4d4b2`, `ae53fd4`

---

### 3. Alert Service - Sistema de Alertas

**Arquivo:** `backend/app/services/alert_service.py`

**Armazenamento:** In-memory (Dict[UUID, Alert])

**Funcionalidades:**
- ✅ CRUD completo
- ✅ Verificação de condições (>, <, =, ≥, ≤)
- ✅ Histórico de triggers
- ✅ Múltiplos canais (notification, email, webhook)

**Operadores:**
```python
operators = {
    "gt": lambda x, y: x > y,
    "lt": lambda x, y: x < y,
    "eq": lambda x, y: x == y,
    "gte": lambda x, y: x >= y,
    "lte": lambda x, y: x <= y,
}
```

**Commit:** `094ee15`

---

### 4. Endpoints Criados

#### Analytics API
```python
POST /api/v1/analytics/query
- Métricas dinâmicas
- Dimensões dinâmicas
- Filtros avançados
- Ordenação customizada

POST /api/v1/analytics/compare
- Comparar dois períodos
- Calcular % de mudança
```

#### Alerts API
```python
POST   /api/v1/alerts          # Criar
GET    /api/v1/alerts          # Listar
GET    /api/v1/alerts/{id}     # Buscar
PUT    /api/v1/alerts/{id}     # Atualizar
DELETE /api/v1/alerts/{id}     # Deletar

POST /api/v1/alerts/check           # Verificar manual
POST /api/v1/alerts/check-current   # Verificar automático
```

---

## 🐛 Bugs Corrigidos

### SQL Placeholders
```python
# ❌ ANTES (asyncpg): WHERE field = $1
# ✅ DEPOIS (psycopg3): WHERE field = %s
```
**Commits:** `21125f2`, `80e081d`

### Event Loop Windows
```python
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(
        asyncio.WindowsSelectorEventLoopPolicy()
    )
```
**Commit:** `566e8e7`

### Parâmetros None
```python
# ❌ ANTES: params = None
# ✅ DEPOIS: params = params or ()
```
**Commit:** `f0ac04e`

### Filter Mapping
```python
# ❌ ANTES: WHERE canal_venda IN (...)  # Coluna não existe!
# ✅ DEPOIS: WHERE ch.name IN (...)      # Coluna real
```
**Commit:** `ae53fd4`

---

## 📊 Estatísticas

**Arquivos Criados:** 25  
**Linhas de Código:** ~3,500  
**Endpoints:** 9  
**Models:** 6  
**Services:** 2  

**Commits Backend:** 20  
**Bugs Corrigidos:** 10

---

## 👤 Desenvolvedor

**Nome:** Vinicius Oliveira  
**Email:** vinicius.oliveiratwt@gmail.com  
**Data:** 03 de novembro de 2025

> 💡 **Nota:** Documentação revisada e aprovada pelo desenvolvedor.

---

**Última Atualização:** 03/11/2025

---

**Desenvolvido por Vinicius Oliveira** · vinicius.oliveiratwt@gmail.com
