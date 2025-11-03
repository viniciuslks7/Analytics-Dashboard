# 🏗️ Arquitetura do Sistema - Analytics para Restaurantes

## 📋 Visão Geral

Sistema de analytics em tempo real para restaurantes com múltiplos canais de venda, desenvolvido com arquitetura moderna e escalável. Implementa padrões de design avançados, cache distribuído, visualizações interativas e análise preditiva.

---

## 🎯 Objetivos Arquiteturais

### Requisitos Funcionais
- ✅ Processar +100K vendas/dia sem degradação
- ✅ Latência < 500ms para queries complexas
- ✅ Suporte a 1000+ usuários simultâneos
- ✅ Drill-down contextual em 3+ níveis
- ✅ Exportação em múltiplos formatos (CSV, JSON, PDF, PNG)
- ✅ Análise RFM e detecção de churn
- ✅ Dashboards customizáveis por usuário

### Requisitos Não-Funcionais
- 🔒 **Segurança**: SQL injection prevention, input validation
- 📈 **Performance**: Cache Redis, connection pooling, query optimization
- 🔄 **Escalabilidade**: Horizontal scaling, microservices-ready
- 🛡️ **Confiabilidade**: Error handling, retry logic, fallbacks
- 🧪 **Testabilidade**: >80% coverage, E2E tests
- 📚 **Manutenibilidade**: Clean code, SOLID, documentation

---

## 🏛️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│  React 18 + TypeScript + Vite + Ant Design + ECharts           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER (Nginx)                       │
│          SSL Termination + Reverse Proxy + Caching              │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   BACKEND API (FastAPI)  │  │   BACKEND API (FastAPI)  │
│   Python 3.11 + Uvicorn  │  │   Python 3.11 + Uvicorn  │
│   - Analytics Service    │  │   - Analytics Service    │
│   - ~~Query Builder~~    │  │   - ~~Query Builder~~    │
│   - RFM Analysis         │  │   - RFM Analysis         │
└──────────────────────────┘  └──────────────────────────┘
            │                              │
            └──────────┬───────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌──────────────┐
│   REDIS     │ │ POSTGRESQL  │ │   LOGGING    │
│   Cache     │ │  Database   │ │   System     │
│   (6379)    │ │  (5432)     │ │ (ELK Stack)  │
└─────────────┘ └─────────────┘ └──────────────┘
```

---

## 📦 Estrutura de Diretórios

```
analytics-restaurantes/
├── frontend/                    # React Application
│   ├── src/
│   │   ├── pages/              # Páginas principais
│   │   │   ├── Dashboard.tsx   # Dashboard principal
│   │   │   ├── ChurnDashboard.tsx
│   │   │   ├── AlertsPage.tsx
│   │   │   └── QueryBuilder.tsx
│   │   │
│   │   ├── components/         # Componentes reutilizáveis
│   │   │   ├── Charts/         # Gráficos ECharts
│   │   │   │   ├── PieChart.tsx
│   │   │   │   ├── BarChart.tsx
│   │   │   │   ├── LineChart.tsx
│   │   │   │   └── HourlyHeatmap.tsx
│   │   │   │
│   │   │   ├── DrillDown/      # Drill-down contextual
│   │   │   │   ├── DrillDownModal.tsx
│   │   │   │   └── DrillDownContent.tsx
│   │   │   │
│   │   │   ├── Filters/        # Sistema de filtros
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   ├── DateRangePicker.tsx
│   │   │   │   └── MultiSelect.tsx
│   │   │   │
│   │   │   ├── DataTable/      # Tabela interativa
│   │   │   │   └── DataTable.tsx
│   │   │   │
│   │   │   └── Export/         # Sistema de exportação
│   │   │       └── ExportButton.tsx
│   │   │
│   │   ├── hooks/              # Custom React Hooks
│   │   │   ├── useAnalytics.ts
│   │   │   ├── useDrillDown.ts
│   │   │   ├── useFilters.ts
│   │   │   └── useEChart.ts
│   │   │
│   │   ├── stores/             # Zustand State Management
│   │   │   ├── filterStore.ts
│   │   │   └── dashboardStore.ts
│   │   │
│   │   ├── services/           # API Services
│   │   │   ├── api.ts
│   │   │   └── analyticsAPI.ts
│   │   │
│   │   ├── types/              # TypeScript Types
│   │   │   ├── analytics.ts
│   │   │   ├── filters.ts
│   │   │   └── charts.ts
│   │   │
│   │   ├── utils/              # Utilities
│   │   │   ├── formatters.ts
│   │   │   ├── queryKey.ts
│   │   │   └── exportHelpers.ts
│   │   │
│   │   └── App.tsx             # App principal
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                     # FastAPI Application
│   ├── app/
│   │   ├── main.py             # Entry point
│   │   │
│   │   ├── routers/            # API Endpoints
│   │   │   ├── __init__.py
│   │   │   ├── analytics.py    # /api/v1/analytics/*
│   │   │   ├── churn.py        # /api/v1/churn/*
│   │   │   ├── alerts.py       # /api/v1/alerts/*
│   │   │   └── export.py       # /api/v1/export/*
│   │   │
│   │   ├── services/           # Business Logic
│   │   │   ├── __init__.py
│   │   │   ├── analytics_service.py
│   │   │   ├── ~~query_builder_service.py~~ (REMOVIDO)
│   │   │   ├── churn_service.py
│   │   │   └── cache_service.py
│   │   │
│   │   ├── models/             # Pydantic Models
│   │   │   ├── __init__.py
│   │   │   ├── analytics.py
│   │   │   ├── filters.py
│   │   │   └── churn.py
│   │   │
│   │   ├── core/               # Core Configuration
│   │   │   ├── __init__.py
│   │   │   ├── config.py       # Settings
│   │   │   ├── database.py     # DB Connection Pool
│   │   │   ├── redis_client.py # Redis Client
│   │   │   └── security.py     # SQL Whitelists
│   │   │
│   │   └── utils/              # Utilities
│   │       ├── __init__.py
│   │       ├── sql_builder.py
│   │       └── validators.py
│   │
│   ├── tests/                  # Pytest Tests
│   │   ├── test_analytics.py
│   │   ├── ~~test_query_builder.py~~ (REMOVIDO)
│   │   └── test_churn.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── database/                    # Database Scripts
│   ├── migrations/             # Alembic Migrations
│   ├── seeds/                  # Seed Data
│   └── schema.sql              # Schema DDL
│
├── docs/                        # Documentation
│   ├── features/               # Feature Docs (14 files)
│   ├── technical/              # Technical Docs
│   │   ├── ARCHITECTURE.md     # Este arquivo
│   │   ├── BUGFIXES.md         # Bug documentation
│   │   ├── API.md              # API Reference
│   │   └── DEPLOYMENT.md       # Deploy Guide
│   └── history/                # Historical Docs
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🔧 Stack Tecnológico

### Frontend
```typescript
{
  "framework": "React 18.3.1",
  "language": "TypeScript 5.6.2",
  "buildTool": "Vite 5.4.8",
  "ui": {
    "library": "Ant Design 5.21.4",
    "charts": "Apache ECharts 5.5.1",
    "icons": "Ant Design Icons 5.5.1"
  },
  "stateManagement": {
    "global": "Zustand 5.0.0",
    "server": "React Query 5.59.16"
  },
  "http": "Axios 1.7.7",
  "routing": "React Router DOM 6.27.0",
  "utilities": {
    "dates": "date-fns 4.1.0",
    "export": {
      "pdf": "html2pdf.js 0.10.2",
      "csv": "papaparse 5.4.1"
    }
  }
}
```

### Backend
```python
{
  "framework": "FastAPI 0.115.4",
  "language": "Python 3.11",
  "server": "Uvicorn 0.32.0",
  "database": {
    "driver": "psycopg[binary,pool] 3.1.9",
    "orm": None,  # Raw SQL for performance
    "migrations": "Alembic 1.13.0"
  },
  "cache": "redis 5.2.0",
  "validation": "Pydantic 2.9.2",
  "testing": "pytest 8.3.3",
  "linting": {
    "formatter": "black 24.10.0",
    "imports": "isort 5.13.2",
    "types": "mypy 1.13.0"
  }
}
```

### Infrastructure
```yaml
services:
  - name: PostgreSQL
    version: "15.4"
    purpose: Transactional database
    
  - name: Redis
    version: "7.2"
    purpose: Cache + Session Store
    
  - name: Nginx
    version: "1.25"
    purpose: Reverse proxy + Load balancer
    
  - name: Docker
    version: "24.0"
    purpose: Containerization
    
  - name: Docker Compose
    version: "2.21"
    purpose: Orchestration
```

---

## 🔄 Fluxo de Dados

### 1. Request Flow (Query Analytics)

```
┌──────────┐
│  User    │
│  Action  │
└────┬─────┘
     │
     │ 1. Click em gráfico/filtro
     ▼
┌──────────────────┐
│  React Component │
│  (Dashboard.tsx) │
└────┬─────────────┘
     │
     │ 2. Atualiza Zustand store
     ▼
┌──────────────────┐
│  filterStore.ts  │
│  { filters }     │
└────┬─────────────┘
     │
     │ 3. Trigger React Query
     ▼
┌──────────────────────┐
│  useAnalytics hook   │
│  useMemo + useQuery  │
└────┬─────────────────┘
     │
     │ 4. HTTP POST /api/v1/analytics/query
     │    Body: { metrics, dimensions, filters }
     ▼
┌─────────────────────────┐
│  BACKEND (FastAPI)      │
│  @router.post("/query") │
└────┬────────────────────┘
     │
     │ 5. Valida request (Pydantic)
     ▼
┌──────────────────────────┐
│  analytics_service.py    │
│  build_query()           │
└────┬─────────────────────┘
     │
     │ 6. Verifica cache Redis
     ▼
┌─────────────┐     Cache HIT? ──YES──> Return cached
│   Redis     │                           │
│   Cache     │                           │
└────┬────────┘                           │
     │ Cache MISS                         │
     │                                    │
     │ 7. Constrói SQL                   │
     ▼                                    │
┌──────────────────────────┐             │
│  ~~query_builder_service~~ (REMOVIDO) │
│  - ~~Mapeia dimensões~~  │             │
│  - ~~Aplica whitelists~~ │             │
│  - ~~Monta SQL seguro~~  │             │
└────┬─────────────────────┘             │
     │                                    │
     │ 8. Executa query                  │
     ▼                                    │
┌─────────────┐                          │
│ PostgreSQL  │                          │
│  (Pool)     │                          │
└────┬────────┘                          │
     │                                    │
     │ 9. Retorna resultados             │
     ▼                                    │
┌──────────────────────────┐             │
│  analytics_service.py    │             │
│  - Formata resultados    │             │
│  - Calcula agregações    │             │
│  - Salva em cache        │             │
└────┬─────────────────────┘             │
     │                                    │
     │ 10. Response JSON                 │
     │◄───────────────────────────────────┘
     ▼
┌──────────────────┐
│  React Component │
│  - Atualiza UI   │
│  - Renderiza     │
└──────────────────┘
```

### 2. Drill-Down Flow

```
User Click no Gráfico
        │
        ▼
┌──────────────────────┐
│  onChartClick event  │
│  { type, value }     │
└──────────┬───────────┘
           │
           │ Abre Modal
           ▼
┌────────────────────────┐
│  DrillDownModal.tsx    │
│  destroyOnClose={true} │
└──────────┬─────────────┘
           │
           │ Renderiza conteúdo
           ▼
┌───────────────────────────┐
│  DrillDownContent.tsx     │
│  - Constrói filtros       │
│  - canal_venda: [value]   │
└──────────┬────────────────┘
           │
           │ Nova query com filtros
           ▼
┌────────────────────────┐
│  useDrillDownData()    │
│  - Serializa filtros   │
│  - Nova queryKey       │
└──────────┬─────────────┘
           │
           │ Request
           ▼
    [Backend API]
           │
           │ Response
           ▼
┌────────────────────────┐
│  Modal atualiza        │
│  - KPIs                │
│  - Gráficos ECharts    │
│  - Tabela de dados     │
└────────────────────────┘
```

### 3. Cache Strategy

```
Request → Check Redis
             │
     ┌───────┴────────┐
     │                │
   HIT              MISS
     │                │
     │                ▼
     │         Execute Query
     │                │
     │                ▼
     │         Format Data
     │                │
     │                ▼
     │      Cache in Redis (TTL)
     │                │
     └────────┬───────┘
              │
              ▼
        Return to Client

Cache Keys Pattern:
- analytics:{hash(query_params)}
- churn:metrics:{date_range}
- churn:at-risk:{date}
- TTL: 5 minutes (300s)
```

---

## 🗄️ Modelo de Dados

### Diagrama ER (Simplificado)

```
┌──────────────────┐
│     SALES        │
├──────────────────┤
│ id (PK)          │
│ created_at       │
│ total_amount     │
│ customer_id (FK) │
│ store_id (FK)    │
│ channel_id (FK)  │
└────┬─────────────┘
     │
     ├───────────────────────────┐
     │                           │
     ▼                           ▼
┌──────────────┐        ┌──────────────┐
│  CUSTOMERS   │        │   STORES     │
├──────────────┤        ├──────────────┤
│ id (PK)      │        │ id (PK)      │
│ name         │        │ name         │
│ email        │        │ address      │
│ created_at   │        │ region       │
└──────────────┘        └──────────────┘

     │                           │
     ▼                           ▼
┌──────────────┐        ┌──────────────┐
│ SALE_ITEMS   │        │  CHANNELS    │
├──────────────┤        ├──────────────┤
│ id (PK)      │        │ id (PK)      │
│ sale_id (FK) │        │ name         │
│ product_id   │        │ commission   │
│ quantity     │        └──────────────┘
│ price        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PRODUCTS    │
├──────────────┤
│ id (PK)      │
│ name         │
│ category     │
│ price        │
└──────────────┘
```

### Principais Queries

**1. Dashboard Principal:**
```sql
-- KPIs Agregados
SELECT 
    COUNT(DISTINCT s.id) as qtd_vendas,
    SUM(s.total_amount) as faturamento,
    AVG(s.total_amount) as ticket_medio,
    COUNT(DISTINCT s.customer_id) as qtd_clientes
FROM sales s
WHERE s.created_at BETWEEN %s AND %s
  AND s.channel_id = ANY(%s)  -- Filtros opcionais
```

**2. Top Produtos:**
```sql
SELECT 
    p.name as produto,
    COUNT(si.id) as vendas,
    SUM(si.quantity * si.price) as receita
FROM sale_items si
JOIN products p ON p.id = si.product_id
JOIN sales s ON s.id = si.sale_id
WHERE s.created_at BETWEEN %s AND %s
GROUP BY p.name
ORDER BY receita DESC
LIMIT 10
```

**3. Análise RFM:**
```sql
WITH customer_metrics AS (
    SELECT 
        customer_id,
        -- Recency: dias desde última compra
        DATE_PART('day', NOW() - MAX(created_at)) as recency,
        -- Frequency: número de compras
        COUNT(*) as frequency,
        -- Monetary: valor total gasto
        SUM(total_amount) as monetary
    FROM sales
    WHERE created_at >= NOW() - INTERVAL '90 days'
    GROUP BY customer_id
),
rfm_scores AS (
    SELECT 
        customer_id,
        -- Score 1-5 (5 = melhor)
        NTILE(5) OVER (ORDER BY recency DESC) as r_score,
        NTILE(5) OVER (ORDER BY frequency) as f_score,
        NTILE(5) OVER (ORDER BY monetary) as m_score
    FROM customer_metrics
)
SELECT 
    customer_id,
    CASE 
        WHEN r_score >= 4 AND f_score >= 4 THEN 'Champions'
        WHEN r_score >= 3 AND f_score >= 3 THEN 'Loyal'
        WHEN r_score >= 3 AND f_score <= 2 THEN 'Potential'
        WHEN r_score <= 2 AND f_score >= 3 THEN 'At Risk'
        ELSE 'Hibernating'
    END as segment
FROM rfm_scores
```

**4. Heatmap Horário:**
```sql
SELECT 
    EXTRACT(DOW FROM created_at) as day_of_week,
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(*) as vendas,
    SUM(total_amount) as receita
FROM sales
WHERE created_at BETWEEN %s AND %s
GROUP BY day_of_week, hour
ORDER BY day_of_week, hour
```

---

## 🔐 Segurança

### 1. SQL Injection Prevention

**Whitelists Obrigatórias:**
```python
# app/core/security.py
ALLOWED_DIMENSIONS = {
    'canal_venda', 'nome_loja', 'nome_produto', 
    'bairro', 'data', 'hora'
}

ALLOWED_METRICS = {
    'faturamento', 'qtd_vendas', 'ticket_medio',
    'qtd_clientes', 'taxa_conversao'
}

ALLOWED_AGGREGATIONS = {'SUM', 'COUNT', 'AVG', 'MIN', 'MAX'}

ALLOWED_ORDER_DIRECTIONS = {'ASC', 'DESC'}
```

**Validação de Input:**
```python
def validate_query_request(request: QueryRequest):
    # Valida dimensões
    for dim in request.dimensions:
        if dim not in ALLOWED_DIMENSIONS:
            raise HTTPException(400, f"Dimensão inválida: {dim}")
    
    # Valida métricas
    for metric in request.metrics:
        if metric not in ALLOWED_METRICS:
            raise HTTPException(400, f"Métrica inválida: {metric}")
    
    # Valida ordenação
    if request.order_by:
        field, direction = request.order_by
        if field not in ALLOWED_DIMENSIONS | ALLOWED_METRICS:
            raise HTTPException(400, f"Campo inválido: {field}")
        if direction not in ALLOWED_ORDER_DIRECTIONS:
            raise HTTPException(400, f"Direção inválida: {direction}")
```

**Parameterized Queries:**
```python
# ✅ SEMPRE usar placeholders
query = """
SELECT COUNT(*) FROM sales 
WHERE channel_id = %s AND created_at >= %s
"""
params = (channel_id, start_date)

# ❌ NUNCA concatenar strings
query = f"SELECT * FROM sales WHERE channel_id = {channel_id}"  # PERIGOSO!
```

### 2. Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/analytics/query")
@limiter.limit("100/minute")  # 100 requests por minuto
async def query_analytics(request: QueryRequest):
    pass
```

### 3. CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Apenas origem conhecida
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

---

## 📈 Performance Optimization

### 1. Database Indexing

```sql
-- Índices para queries comuns
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_channel_id ON sales(channel_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_store_id ON sales(store_id);

-- Índice composto para filtros frequentes
CREATE INDEX idx_sales_date_channel 
ON sales(created_at, channel_id);

-- Índice para agregações
CREATE INDEX idx_sale_items_product_id 
ON sale_items(product_id) INCLUDE (quantity, price);
```

### 2. Connection Pooling

```python
from psycopg_pool import ConnectionPool

# Pool de conexões
pool = ConnectionPool(
    conninfo="postgresql://user:pass@host:5432/db",
    min_size=5,      # Mínimo de 5 conexões
    max_size=20,     # Máximo de 20 conexões
    timeout=30,      # Timeout de 30s
    max_waiting=10,  # Máximo de 10 aguardando
    max_lifetime=3600  # Recicla após 1h
)

# Uso
with pool.connection() as conn:
    with conn.cursor() as cur:
        cur.execute(query, params)
        results = cur.fetchall()
```

### 3. Redis Caching

```python
import redis
import json
import hashlib

redis_client = redis.Redis(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=True
)

def get_cached_query(query_params: dict):
    # Gera chave única
    key = f"analytics:{hashlib.md5(json.dumps(query_params, sort_keys=True).encode()).hexdigest()}"
    
    # Busca em cache
    cached = redis_client.get(key)
    if cached:
        return json.loads(cached)
    
    # Executa query
    result = execute_query(query_params)
    
    # Salva em cache (5 min)
    redis_client.setex(key, 300, json.dumps(result))
    
    return result
```

### 4. Query Optimization

**Antes (N+1 queries):**
```python
# ❌ Executa 1 + N queries
sales = get_all_sales()  # 1 query
for sale in sales:
    sale.customer = get_customer(sale.customer_id)  # N queries
```

**Depois (1 query com JOIN):**
```python
# ✅ Executa apenas 1 query
query = """
SELECT 
    s.*,
    c.name as customer_name,
    c.email as customer_email
FROM sales s
LEFT JOIN customers c ON c.id = s.customer_id
WHERE s.created_at >= %s
"""
```

### 5. Frontend Optimization

**Code Splitting:**
```typescript
// Lazy load de páginas
const ChurnDashboard = lazy(() => import('./pages/ChurnDashboard'));
const QueryBuilder = lazy(() => import('./pages/QueryBuilder'));

// Uso com Suspense
<Suspense fallback={<Loading />}>
  <ChurnDashboard />
</Suspense>
```

**Memoization:**
```typescript
// Memoiza cálculos pesados
const chartOptions = useMemo(() => ({
  title: { text: 'Vendas por Canal' },
  series: data.map(formatSeries),
  // ...
}), [data]);  // Só recalcula se data mudar

// Memoiza componentes
const ExpensiveChart = memo(({ data }) => {
  return <EChartsReact option={data} />;
}, (prev, next) => prev.data === next.data);
```

**Virtual Scrolling:**
```typescript
// Para tabelas grandes (>1000 rows)
<Table
  dataSource={data}
  scroll={{ y: 400 }}  // Virtual scroll
  pagination={{
    pageSize: 50,
    showSizeChanger: true,
    showTotal: (total) => `Total: ${total}`
  }}
/>
```

---

## 🧪 Testing Strategy

### 1. Backend Tests (pytest)

```python
# tests/test_analytics.py
# NOTA: Query Builder foi removido por questões de segurança

def test_analytics_validates_dimensions():
    """Deve rejeitar dimensões inválidas"""
    with pytest.raises(HTTPException) as exc:
        validate_query_request(QueryRequest(
            dimensions=['invalid_dimension'],
            metrics=['faturamento']
        ))
    assert exc.value.status_code == 400

def test_sql_injection_prevention():
    """Deve prevenir SQL injection"""
    malicious_input = "'; DROP TABLE sales; --"
    
    with pytest.raises(HTTPException):
        build_query(
            dimensions=[malicious_input],
            metrics=['faturamento']
        )

def test_cache_hit():
    """Deve retornar do cache na segunda chamada"""
    params = {'date_from': '2025-01-01', 'date_to': '2025-01-31'}
    
    # Primeira chamada (cache miss)
    result1 = get_analytics(params)
    
    # Segunda chamada (cache hit)
    with patch('redis_client.get') as mock_get:
        result2 = get_analytics(params)
        mock_get.assert_called_once()
```

### 2. Frontend Tests (Vitest + React Testing Library)

```typescript
// Dashboard.test.tsx
describe('Dashboard', () => {
  it('should load KPIs on mount', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Faturamento Total/i)).toBeInTheDocument();
    });
  });
  
  it('should open drill-down on chart click', async () => {
    render(<Dashboard />);
    
    const chart = screen.getByTestId('revenue-chart');
    fireEvent.click(chart);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  
  it('should apply filters', async () => {
    const { getByLabelText } = render(<Dashboard />);
    
    const channelFilter = getByLabelText('Canal de Venda');
    fireEvent.change(channelFilter, { target: { value: 'iFood' } });
    
    await waitFor(() => {
      expect(mockAPI.query).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { canal_venda: ['iFood'] }
        })
      );
    });
  });
});
```

### 3. E2E Tests (Playwright)

```typescript
// e2e/dashboard.spec.ts
test('full analytics workflow', async ({ page }) => {
  // Navega para dashboard
  await page.goto('http://localhost:5173');
  
  // Aguarda KPIs carregarem
  await expect(page.locator('[data-testid="kpi-faturamento"]')).toBeVisible();
  
  // Aplica filtro
  await page.selectOption('[data-testid="channel-filter"]', 'iFood');
  
  // Clica em gráfico
  await page.click('[data-testid="revenue-chart"]');
  
  // Verifica modal drill-down
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  
  // Exporta CSV
  await page.click('[data-testid="export-csv"]');
  
  // Aguarda download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-testid="confirm-export"]')
  ]);
  
  expect(download.suggestedFilename()).toMatch(/analytics.*\.csv/);
});
```

---

## 🚀 Deployment

### 1. Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/analytics
      - REDIS_URL=redis://redis:6379/0
      - PYTHONIOENCODING=utf-8
    depends_on:
      - db
      - redis

  db:
    image: postgres:15.4
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=analytics
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:1.25-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

### 2. Production Deployment (Kubernetes)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: analytics-backend
  template:
    metadata:
      labels:
        app: analytics-backend
    spec:
      containers:
      - name: backend
        image: analytics-backend:v1.0.0
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: analytics-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: analytics-config
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: analytics-backend-service
spec:
  selector:
    app: analytics-backend
  ports:
  - port: 8000
    targetPort: 8000
  type: LoadBalancer
```

---

## 📊 Monitoring & Observability

### 1. Health Checks

```python
# app/main.py
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/ready")
async def readiness_check():
    """Readiness check - valida dependências"""
    checks = {
        "database": await check_database(),
        "redis": await check_redis()
    }
    
    all_ready = all(checks.values())
    
    return {
        "ready": all_ready,
        "checks": checks
    }
```

### 2. Logging

```python
import logging
import structlog

# Configuração de logging estruturado
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Uso
logger.info("query_executed", 
    query_id=query_id,
    duration_ms=duration,
    rows_returned=len(results)
)
```

### 3. Metrics (Prometheus)

```python
from prometheus_client import Counter, Histogram, generate_latest

# Métricas
requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

query_duration = Histogram(
    'sql_query_duration_seconds',
    'SQL query duration',
    ['query_type']
)

# Middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start
    
    requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response

# Endpoint de métricas
@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

---

## 🔄 CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run tests
        run: |
          cd frontend
          npm run test:coverage
      
      - name: Build
        run: |
          cd frontend
          npm run build

  deploy:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy scripts
          kubectl apply -f k8s/
```

---

## 📚 Referências e Recursos

### Documentação Relacionada
- [FEATURE_INDEX.md](../features/FEATURE_INDEX.md) - Índice de todas as features
- [BUGFIXES.md](./BUGFIXES.md) - Documentação de bugs corrigidos
- [API.md](./API.md) - Referência completa da API
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia de deployment

### Tecnologias
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [ECharts Documentation](https://echarts.apache.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)

### Padrões e Best Practices
- [12 Factor App](https://12factor.net/)
- [REST API Best Practices](https://restfulapi.net/)
- [SQL Injection Prevention](https://owasp.org/www-community/attacks/SQL_Injection)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

---

## 👤 Desenvolvedor

**Nome:** Vinicius Oliveira  
**Email:** vinicius.oliveiratwt@gmail.com  
**Data de Documentação:** 03/11/2025  
**Versão:** 1.0.0

---

**Última Atualização:** 03/11/2025  
**Status:** ✅ Produção  
**Versão do Sistema:** 1.0.0
