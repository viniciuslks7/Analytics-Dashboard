# 🍔 Restaurant Analytics Platform

> Plataforma de analytics self-service para donos de restaurantes explorarem seus dados operacionais

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![ECharts](https://img.shields.io/badge/ECharts-AA344D?style=flat&logo=apache-echarts&logoColor=white)](https://echarts.apache.org/)

---

## 📋 Sobre o Projeto

Sistema completo de Business Intelligence desenvolvido para o **God Level Coder Challenge**, oferecendo:

✅ **API REST** com FastAPI para queries customizáveis  
✅ **Dashboard interativo** com React + TypeScript + ECharts  
✅ **Materialized Views** otimizadas para 500k+ registros  
✅ **4 visualizações** principais (Pizza, Barras, Heatmap, Combo)  
✅ **KPIs em tempo real** com atualização automática  

### 🎯 Problemas Resolvidos

1. **Produtos mais vendidos por canal e período**
   - View: `produtos_analytics`
   - Chart: TopProductsChart (Barras)

2. **Degradação de tempo de entrega por região**
   - View: `delivery_metrics` (P50, P90, P95)
   - Chart: DeliveryMetricsChart (Combo)

3. **Churn de clientes** (3+ compras, 30+ dias inativos)
   - View: `customer_rfm` (Recência, Frequência, Valor)
   - Endpoint: `/api/v1/analytics/query` com filtros

---

## 🏗️ Arquitetura

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  React + Vite   │────────▶│  FastAPI + Psycopg3 │────────▶│  PostgreSQL 15  │
│  + TypeScript   │  HTTP   │  + Pydantic      │  Async  │  + Mat. Views   │
│  + ECharts      │         │  + Connection Pool│         │                 │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
    Frontend                       Backend                     Database
   Port: 5173                    Port: 8000                  Port: 5432
```

### Stack Tecnológica

**Backend:**
- FastAPI 0.120.4 (async REST API)
- psycopg 3.2.12 (PostgreSQL async driver)
- Pydantic 2.12.3 (data validation)
- SQLAlchemy 2.0.44 (ORM)
- Python 3.12

**Frontend:**
- React 18 (UI library)
- TypeScript 5 (type safety)
- Vite 7 (build tool)
- ECharts 5 (visualizations)
- React Query (data fetching + cache)
- Axios (HTTP client)

**Database:**
- PostgreSQL 15 (via Docker)
- 4 Materialized Views otimizadas
- Índices automáticos

---

## 🚀 Setup Rápido

### Pré-requisitos

- Python 3.12+
- Node.js 18+
- Docker + Docker Compose
- PostgreSQL 15 (via Docker)

### 1. Clone e Configure o Ambiente

```powershell
# Clone o repositório
cd "C:\Users\LAB\Desktop\Code test god level"

# Verifique se o Docker está rodando
docker ps
```

### 2. Setup do Database

```powershell
# Inicie PostgreSQL (via nola-repo)
cd nola-repo
docker compose up -d postgres

# Gere dados (opcional - já temos 53k+ registros)
docker compose run --rm data-generator

# Volte para raiz
cd ..
```

### 3. Setup do Backend

```powershell
cd backend

# Crie virtual environment (Python 3.12)
python -m venv venv
.\venv\Scripts\activate

# Instale dependências
pip install -r requirements.txt

# Configure .env
copy .env.example .env
# Edite .env se necessário (padrão já funciona)

# Crie Materialized Views
python create_views.py

# Inicie API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend rodando em: **http://localhost:8000**  
Docs: **http://localhost:8000/docs**

### 4. Setup do Frontend

```powershell
# Em outro terminal
cd frontend

# Instale dependências
npm install

# Configure .env
echo VITE_API_URL=http://localhost:8000 > .env

# Inicie dev server
npm run dev
```

Frontend rodando em: **http://localhost:5173**

---

## 📊 Funcionalidades

### Dashboard Principal

**KPIs:**
- 💰 Faturamento Total
- 🎫 Ticket Médio
- 📈 Total de Vendas
- 👥 Clientes Únicos
- 🚚 Tempo Médio de Entrega
- ⏱️ Tempo Médio de Preparo

**Visualizações:**

1. **Sales Channel Chart** (Pizza)
   - Distribuição de vendas por canal
   - % de faturamento por canal
   
2. **Top Products Chart** (Barras)
   - Top 10 produtos mais vendidos
   - Quantidade de vendas

3. **Hourly Heatmap** (Mapa de Calor)
   - 24 horas × 7 dias da semana
   - Identificação de horários de pico

4. **Delivery Metrics** (Combo)
   - Tempo médio por região
   - Volume de entregas

### API Endpoints

```
GET  /                              # Info da API
GET  /health                        # Health check
GET  /docs                          # Swagger UI

POST /api/v1/analytics/query        # Query customizável
GET  /api/v1/analytics/kpis         # Dashboard KPIs
GET  /api/v1/analytics/dimensions/stores    # Lojas
GET  /api/v1/analytics/dimensions/channels  # Canais
GET  /api/v1/analytics/dimensions/products  # Produtos
GET  /api/v1/analytics/dimensions/regions   # Regiões
```

### Exemplo de Query Customizada

```bash
curl -X POST http://localhost:8000/api/v1/analytics/query \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": ["faturamento", "qtd_vendas", "ticket_medio"],
    "dimensions": ["channel", "periodo_dia"],
    "filters": {},
    "order_by": [{"field": "faturamento", "direction": "desc"}],
    "limit": 10
  }'
```

---

## 🗄️ Materialized Views

### 1. `vendas_agregadas` (31k+ rows)
```sql
-- Pré-agregação por loja, canal, data, hora
-- Atualização: Manual via REFRESH MATERIALIZED VIEW
```

### 2. `produtos_analytics` (64k+ rows)
```sql
-- Produtos × Canal × Data × Período
-- Performance: < 50ms para queries top-N
```

### 3. `delivery_metrics` (30k+ rows)
```sql
-- Tempo de entrega por bairro (P50, P90, P95)
-- Análise geográfica detalhada
```

### 4. `customer_rfm` (11k+ rows)
```sql
-- Recência, Frequência, Valor monetário
-- Segmentação de clientes
```

### Refresh Manual

```powershell
# Execute create_views.py ou:
cd backend
python -c "
import asyncio
from app.db.database import db

async def refresh():
    await db.connect()
    await db.execute('REFRESH MATERIALIZED VIEW vendas_agregadas')
    await db.execute('REFRESH MATERIALIZED VIEW produtos_analytics')
    await db.execute('REFRESH MATERIALIZED VIEW delivery_metrics')
    await db.execute('REFRESH MATERIALIZED VIEW customer_rfm')
    print('✅ Views refreshed!')
    await db.disconnect()

asyncio.run(refresh())
"
```

---

## 📁 Estrutura do Projeto

```
Code test god level/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # Routes
│   │   ├── db/             # Database
│   │   ├── models/         # Schemas
│   │   ├── services/       # Business logic
│   │   ├── config.py       # Settings
│   │   └── main.py         # FastAPI app
│   ├── create_views.py     # Script para views
│   ├── requirements.txt
│   ├── .env
│   └── README.md
│
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # React components
│   │   │   └── Charts/     # ECharts components
│   │   ├── pages/          # Pages
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx
│   ├── package.json
│   ├── .env
│   └── README.md
│
├── nola-repo/               # Repositório oficial do desafio
│   ├── docker-compose.yml  # PostgreSQL + Data Generator
│   └── generate_data.py    # Script de geração de dados
│
├── venv_py312/              # Python 3.12 venv para backend
├── SPECKIT.md               # Especificação técnica completa
├── .gitignore
└── README.md                # Este arquivo
```

---

## ⚡ Performance

### Backend
- **Connection Pool**: 2-10 conexões assíncronas
- **Query Time**: < 200ms (com Materialized Views)
- **Throughput**: 100+ req/s

### Frontend
- **Bundle Size**: ~150KB (gzipped)
- **First Load**: < 2s
- **Chart Rendering**: < 500ms
- **Cache**: React Query (30-60s)

### Database
- **Records**: 53k+ vendas (~6M registros totais)
- **Views**: 136k+ registros pré-agregados
- **Indexes**: Automáticos em views
- **Query Time**: < 100ms (queries simples)

---

## 🧪 Testes

### Backend
```powershell
cd backend
pytest tests/ -v --cov=app
```

### Frontend
```powershell
cd frontend
npm run test
```

---

## 📝 Commits

Padrão: **Conventional Commits** (em Português)

```
feat(frontend): adicionar gráfico de vendas por canal
fix(backend): corrigir query de agregação
refactor(database): otimizar connection pool
docs(readme): atualizar instruções de setup
chore(deps): atualizar dependências
```

**Histórico de Commits:**
1. `chore: configuração inicial do backend com FastAPI`
2. `refactor(database): migrar de asyncpg para psycopg3`
3. `chore: adicionar docker-compose para executar gerador de dados`
4. `feat: criar estrutura inicial do frontend React + TypeScript`
5. `feat: criar materialized views e configurar ambiente backend/frontend`
6. `feat(frontend): implementar visualizações com ECharts`

---

## 🎯 Roadmap

### ✅ Concluído
- [x] Backend FastAPI com psycopg3
- [x] 4 Materialized Views
- [x] Frontend React + TypeScript
- [x] 4 Visualizações ECharts
- [x] Dashboard com KPIs
- [x] API REST completa
- [x] Docker PostgreSQL
- [x] Geração de dados (53k+ vendas)

### 🔄 Em Progresso
- [ ] Geração completa de dados (500k vendas)
- [ ] Testes de integração backend-frontend

### 📅 Próximos Passos
- [ ] Autenticação (JWT)
- [ ] Cache Redis
- [ ] Filtros interativos (date picker, multi-select)
- [ ] Export CSV/PDF
- [ ] Drill-down em gráficos
- [ ] Deploy (Vercel + Railway)
- [ ] Vídeo demo (5-10 min)

---

## 📚 Documentação Completa

Este projeto possui documentação técnica abrangente:

### 📖 Principais Documentos
- **[Documentação Geral](./docs/README.md)** - Visão geral completa do projeto
- **[Índice de Features](./docs/features/FEATURE_INDEX.md)** - 13 features ativas (1 removida)
- **[Arquitetura](./docs/technical/ARCHITECTURE.md)** - Arquitetura detalhada do sistema
- **[Bugfixes](./docs/technical/BUGFIXES.md)** - 15 bugs corrigidos documentados

### 🎯 Features Documentadas (13 ativas + 1 removida)
1. **Dashboard Analytics & KPIs** - 6+ KPIs em tempo real
2. ~~**Query Builder**~~ - ❌ **REMOVIDO** (segurança - SQL injection prevention)
3. **Period Comparison** - Comparação automática de períodos
4. **ECharts Visualizations** - 7+ tipos de gráficos
5. **Global Filters** - Filtros aplicados globalmente
6. **Export System** - CSV, JSON, PDF, PNG
7. **Churn/RFM Analysis** - Segmentação de clientes
8. **Dashboard Manager** - Dashboards customizáveis
9. **Drill-Down** - Análise contextual detalhada
10. **Data Table** - Tabela interativa com ordenação
11. **Alerts System** - Sistema de alertas configurável
12. **i18n** - Suporte a 3 idiomas (PT, EN, ES)
13. **Hourly Heatmap** - Análise por hora do dia
14. **Redis Cache** - Cache distribuído (24-98x speedup)

---

## 🎥 Demo

**Vídeo:** [Em breve - link do YouTube]

**Screenshots:**

[Dashboard KPIs]
[Gráfico de Pizza - Canais]
[Heatmap Horário]
[Métricas de Entrega]

---

## 👨‍💻 Desenvolvedor

**Vinícius Oliveira**
- GitHub: [@viniciuslks7](https://github.com/viniciuslks7)
- Email: vinicius.oliveiratwt@gmail.com

---

## 📄 Licença

Este projeto foi desenvolvido para o **God Level Coder Challenge**.

---

## 🙏 Agradecimentos

- **Nola Treinamentos** - Pelo desafio incrível
- **FastAPI** - Framework moderno e rápido
- **ECharts** - Biblioteca de gráficos poderosa
- **React Community** - Ecossistema rico

---

**Desenvolvido com ❤️ para o God Level Coder Challenge** 🚀
