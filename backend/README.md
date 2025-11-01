# 🍔 Restaurant Analytics Platform - Backend

Backend API construído com **FastAPI + PostgreSQL** para análise de dados operacionais de restaurantes.

## 🏗️ Arquitetura

```
backend/
├── app/
│   ├── api/            # Rotas da API
│   │   └── analytics.py
│   ├── db/             # Database connection
│   │   └── database.py
│   ├── models/         # Pydantic models
│   │   └── schemas.py
│   ├── services/       # Business logic
│   │   └── analytics_service.py
│   ├── config.py       # Settings
│   └── main.py         # FastAPI app
├── create_views.py     # Script para criar Materialized Views
├── requirements.txt
└── .env.example
```

## 🚀 Setup Rápido

### 1. Configurar ambiente Python

```powershell
# Criar virtual environment
python -m venv venv

# Ativar (Windows)
.\venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente

```powershell
# Copiar exemplo
copy .env.example .env

# Editar .env com suas configurações
```

### 3. Garantir que o PostgreSQL está rodando

```powershell
# Via Docker (do repositório nola-repo)
cd ..\nola-repo
docker compose up -d postgres

# Gerar dados (se ainda não gerou)
docker compose run --rm data-generator
```

### 4. Criar Materialized Views

```powershell
python create_views.py
```

### 5. Iniciar API

```powershell
# Modo desenvolvimento (auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Ou usando Python diretamente
python -m app.main
```

## 📚 API Endpoints

### Analytics

- **POST /api/v1/analytics/query** - Query genérico customizável
- **GET /api/v1/analytics/kpis** - Dashboard de KPIs principais
- **GET /api/v1/analytics/dimensions/stores** - Lista de lojas
- **GET /api/v1/analytics/dimensions/channels** - Lista de canais
- **GET /api/v1/analytics/dimensions/products** - Top produtos
- **GET /api/v1/analytics/dimensions/regions** - Regiões de entrega

### Health

- **GET /** - Info da API
- **GET /health** - Health check

### Documentação Interativa

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔍 Exemplo de Query

```json
POST /api/v1/analytics/query

{
  "metrics": ["faturamento", "ticket_medio", "qtd_vendas"],
  "dimensions": ["channel_name", "periodo_dia"],
  "filters": {
    "channel_id": {"in": [2, 3]}
  },
  "date_range": {
    "start_date": "2024-05-01",
    "end_date": "2024-05-31"
  },
  "order_by": [{"field": "faturamento", "direction": "desc"}],
  "limit": 100
}
```

## 📊 Materialized Views

O backend usa **Materialized Views** para performance otimizada:

### 1. `vendas_agregadas`
- Pré-agregação por loja, canal, data, hora
- Métricas: faturamento, ticket médio, clientes únicos

### 2. `produtos_analytics`
- Top produtos por canal, período
- Quantidade vendida, faturamento por produto

### 3. `delivery_metrics`
- Tempo de entrega por região (P50, P90, P95)
- Análise geográfica de entregas

### 4. `customer_rfm`
- Recência, Frequência, Valor monetário
- Segmentação de clientes

### Refresh das Views

```sql
-- Refresh individual (sem lock)
REFRESH MATERIALIZED VIEW CONCURRENTLY vendas_agregadas;

-- Refresh todas
REFRESH MATERIALIZED VIEW vendas_agregadas;
REFRESH MATERIALIZED VIEW produtos_analytics;
REFRESH MATERIALIZED VIEW delivery_metrics;
REFRESH MATERIALIZED VIEW customer_rfm;
```

## 🎯 Métricas Disponíveis

- `faturamento` - Soma do valor total
- `ticket_medio` - Média do valor por venda
- `qtd_vendas` - Contagem de vendas
- `qtd_produtos` - Soma de produtos vendidos
- `tempo_medio_entrega` - Tempo médio de entrega (minutos)
- `p50_entrega`, `p90_entrega`, `p95_entrega` - Percentis de entrega
- `tempo_medio_preparo` - Tempo médio de preparo
- `clientes_unicos` - Contagem de clientes únicos
- `taxa_cancelamento` - Taxa de cancelamento (%)

## 📏 Dimensões Disponíveis

- `channel` - Canal de venda (nome)
- `channel_id` - ID do canal
- `store` - Loja (nome)
- `store_id` - ID da loja
- `data` - Data da venda
- `hora` - Hora da venda
- `dia_semana` - Dia da semana (0=Dom, 6=Sáb)
- `mes` - Mês (YYYY-MM)
- `periodo_dia` - Período (Manhã, Tarde, Noite, Madrugada)
- `produto` - Nome do produto
- `categoria` - Categoria do produto
- `bairro` - Bairro (delivery)
- `cidade` - Cidade (delivery)

## ⚡ Performance

- **Materialized Views**: Queries < 200ms mesmo com 500k+ registros
- **Connection Pool**: 5-20 conexões assíncronas
- **Índices**: Criados automaticamente nas views
- **Paginação**: Limite de 1000 registros por query

## 🧪 Testes

```powershell
# Testes unitários (TODO)
pytest tests/

# Test coverage (TODO)
pytest --cov=app tests/
```

## 🐳 Docker (Opcional)

```dockerfile
# TODO: Dockerfile para containerizar o backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 Próximos Passos

- [ ] Adicionar cache (Redis)
- [ ] Implementar testes automatizados
- [ ] Adicionar autenticação (JWT)
- [ ] Criar endpoint para salvar dashboards
- [ ] Implementar WebSockets para dados real-time
- [ ] Adicionar rate limiting

## 🔗 Links Úteis

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [AsyncPG Documentation](https://magicstack.github.io/asyncpg/)
- [PostgreSQL Materialized Views](https://www.postgresql.org/docs/current/sql-creatematerializedview.html)

---

**Desenvolvido para o God Level Coder Challenge** 🚀
