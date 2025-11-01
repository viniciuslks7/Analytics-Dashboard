# 🎯 SpecKit - Plataforma Analytics para Restaurantes
## God Level Coder Challenge

**Data de Criação:** 28/10/2025  
**Prazo de Entrega:** 03/11/2025 (23h59)  
**Objetivo:** Construir um "Power BI para Restaurantes" - Plataforma de analytics customizável

---

## 📊 1. Visão Geral do Desafio

### 1.1 Contexto
Restaurantes geram dados massivos através de múltiplos canais (presencial, iFood, Rappi, WhatsApp, app próprio), mas donos não conseguem extrair insights para tomar decisões estratégicas.

### 1.2 Persona Principal
**Maria** - Dona de 3 restaurantes que precisa responder:
- ❓ "Qual produto vende mais na quinta à noite no iFood?"
- ❓ "Meu tempo de entrega piorou. Em quais regiões?"
- ❓ "Quais clientes compraram 3+ vezes mas não voltam há 30 dias?"

### 1.3 Dados Fornecidos
- 📦 **Volume:** 500.000 vendas
- 📅 **Período:** 6 meses
- 🏪 **Lojas:** 50 unidades
- 📱 **Canais:** Presencial, iFood, Rappi, WhatsApp, App Próprio
- 💾 **Database:** PostgreSQL com schema realista

---

## 🏗️ 2. Arquitetura Técnica

### 2.1 Stack Definida

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  React 18 + TypeScript + Vite                       │
│  └─ UI: Ant Design / shadcn/ui                      │
│  └─ Charts: ECharts (Apache ECharts)                │
│  └─ Tables: react-table / TanStack Table            │
│  └─ State: Zustand / React Query                    │
└──────────────────┬──────────────────────────────────┘
                   │ REST API (JSON)
┌──────────────────▼──────────────────────────────────┐
│                    BACKEND                          │
│  FastAPI (Python 3.11+) + asyncpg                   │
│  └─ Endpoints: /api/v1/analytics/*                  │
│  └─ Validation: Pydantic                            │
│  └─ Performance: Async + Connection Pool            │
└──────────────────┬──────────────────────────────────┘
                   │ SQL Queries
┌──────────────────▼──────────────────────────────────┐
│              DATA LAYER (OLAP)                      │
│  PostgreSQL 15+ com Materialized Views              │
│  ├─ vendas_agregadas (loja, canal, data, hora)     │
│  ├─ produtos_analytics (top produtos, categorias)   │
│  ├─ delivery_metrics (tempo entrega por região)     │
│  └─ customer_rfm (Recência, Frequência, Valor)     │
└──────────────────┬──────────────────────────────────┘
                   │ Source Data
┌──────────────────▼──────────────────────────────────┐
│              SOURCE DATA (OLTP)                     │
│  PostgreSQL - Schema Transacional Fornecido         │
│  (Dados gerados por generate_data.py)               │
└─────────────────────────────────────────────────────┘
```

### 2.2 Decisões Arquiteturais

#### ✅ Concordâncias Totais
1. **Camada OLAP sobre OLTP:** Materialized Views para performance
2. **Stack Moderna:** FastAPI + React + TypeScript
3. **Self-Service BI:** Usuário cria dashboards sem código
4. **Pré-agregação:** Consultas em milissegundos mesmo com 500k+ registros
5. **Fases Incrementais:** Entregas testáveis e validáveis

#### 🎯 Ajustes Estratégicos

| Decisão Original | Ajuste | Justificativa |
|------------------|--------|---------------|
| Considerar ClickHouse | **Usar apenas PostgreSQL** | 500k vendas performam bem com MVs + índices. Menor complexidade e deploy mais simples. Documentar migração futura. |
| Recharts ou ECharts | **ECharts como principal** | Performance superior com grandes datasets, mais tipos de gráficos nativos, melhor para analytics. |
| Todas features juntas | **Priorização MVP clara** | Foco em funcionalidades core que resolvem o problema de Maria. Nice-to-have se sobrar tempo. |

---

## 🎨 3. Features e Funcionalidades

### 3.1 MVP - MUST HAVE ✅

#### 🔹 Dashboard Builder
- [ ] Interface drag & drop para selecionar métricas e dimensões
- [ ] Painel de controle visual (sem código)
- [ ] Filtros globais: Data, Loja, Canal, Produto, Região

#### 🔹 Visualizações Core
- [ ] **KPI Cards** - Métricas principais destacadas
- [ ] **Gráfico de Linha** - Tendências ao longo do tempo
- [ ] **Gráfico de Barras** - Comparações entre categorias
- [ ] **Gráfico de Pizza** - Distribuições percentuais
- [ ] **Tabela Dinâmica** - Dados tabulares com ordenação/filtro

#### 🔹 Métricas Disponíveis
- [ ] Faturamento Total
- [ ] Ticket Médio
- [ ] Quantidade de Vendas
- [ ] Tempo Médio de Entrega (P50, P90, P95)
- [ ] Produtos Mais Vendidos
- [ ] Performance por Canal
- [ ] Performance por Região

#### 🔹 Dimensões Disponíveis
- [ ] Loja
- [ ] Canal (iFood, Rappi, Presencial, etc.)
- [ ] Data (dia, semana, mês)
- [ ] Hora (faixa horária)
- [ ] Dia da Semana
- [ ] Produto / Categoria
- [ ] Região (Bairro, Cidade)

#### 🔹 Responder Perguntas de Maria
- [ ] **P1:** "Qual produto vende mais na quinta à noite no iFood?"
  - Filtro: Canal=iFood, Dia=Quinta, Hora=Noite
  - Agrupamento: Produto
  - Métrica: Quantidade Vendida
  
- [ ] **P2:** "Meu tempo de entrega piorou. Em quais regiões?"
  - Comparação de períodos (últimos 7 dias vs 7 dias anteriores)
  - Agrupamento: Bairro/Cidade
  - Métrica: P90 Tempo de Entrega
  
- [ ] **P3:** "Quais clientes compraram 3+ vezes mas não voltam há 30 dias?"
  - Segmentação: Frequência >= 3, Recência >= 30 dias
  - Lista: Clientes para reativação

#### 🔹 Comparação de Períodos
- [ ] Seletor de período base
- [ ] Comparação automática (MoM, WoW, Custom)
- [ ] Indicadores visuais (↑ ↓) com percentuais

### 3.2 Nice to Have 🎁 (Se sobrar tempo)

- [ ] **Salvar Dashboards Customizados** - Persistir configurações do usuário
- [ ] **Compartilhamento** - Gerar link/export para equipe
- [ ] **Export** - CSV, PDF, PNG dos gráficos
- [ ] **Alertas** - Notificações quando métricas atingem thresholds
- [ ] **Drill-down** - Clicar em gráfico para detalhar dados
- [ ] **Temas** - Dark mode / Light mode
- [ ] **Multi-idioma** - PT-BR / EN

---

## 🗄️ 4. Modelo de Dados Analítico (OLAP)

### 4.1 Materialized Views Principais

#### 📊 vendas_agregadas
```sql
CREATE MATERIALIZED VIEW vendas_agregadas AS
SELECT
    s.store_id,
    s.channel,
    DATE(s.created_at) as data_venda,
    EXTRACT(DOW FROM s.created_at) as dia_semana, -- 0=Dom, 6=Sáb
    EXTRACT(HOUR FROM s.created_at) as hora,
    CASE 
        WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 6 AND 11 THEN 'Manhã'
        WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 12 AND 17 THEN 'Tarde'
        WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 18 AND 23 THEN 'Noite'
        ELSE 'Madrugada'
    END as periodo_dia,
    COUNT(DISTINCT s.id) as qtd_vendas,
    SUM(s.total_amount) as faturamento,
    AVG(s.total_amount) as ticket_medio,
    COUNT(DISTINCT s.customer_id) as clientes_unicos
FROM sales s
GROUP BY 1,2,3,4,5,6;

CREATE INDEX idx_vendas_agregadas ON vendas_agregadas(store_id, channel, data_venda);
```

#### 📦 produtos_analytics
```sql
CREATE MATERIALIZED VIEW produtos_analytics AS
SELECT
    si.product_id,
    p.name as produto_nome,
    p.category,
    s.channel,
    DATE(s.created_at) as data_venda,
    EXTRACT(DOW FROM s.created_at) as dia_semana,
    CASE 
        WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 6 AND 11 THEN 'Manhã'
        WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 12 AND 17 THEN 'Tarde'
        WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 18 AND 23 THEN 'Noite'
        ELSE 'Madrugada'
    END as periodo_dia,
    SUM(si.quantity) as quantidade_vendida,
    SUM(si.subtotal) as faturamento_produto,
    COUNT(DISTINCT s.id) as num_vendas
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
JOIN products p ON si.product_id = p.id
GROUP BY 1,2,3,4,5,6,7;

CREATE INDEX idx_produtos_analytics ON produtos_analytics(product_id, channel, data_venda);
```

#### 🚚 delivery_metrics
```sql
CREATE MATERIALIZED VIEW delivery_metrics AS
SELECT
    da.neighborhood as bairro,
    da.city as cidade,
    da.state as estado,
    s.channel,
    DATE(s.created_at) as data_venda,
    COUNT(s.id) as total_entregas,
    AVG(s.delivery_seconds) as tempo_medio_entrega,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.delivery_seconds) as p50_entrega,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY s.delivery_seconds) as p90_entrega,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY s.delivery_seconds) as p95_entrega
FROM sales s
LEFT JOIN delivery_addresses da ON s.delivery_address_id = da.id
WHERE s.channel != 'Presencial'
GROUP BY 1,2,3,4,5;

CREATE INDEX idx_delivery_metrics ON delivery_metrics(bairro, cidade, data_venda);
```

#### 👥 customer_rfm
```sql
CREATE MATERIALIZED VIEW customer_rfm AS
SELECT
    c.id as customer_id,
    c.name as customer_name,
    c.email,
    c.phone,
    COUNT(DISTINCT s.id) as frequencia,
    MAX(s.created_at) as ultima_compra,
    EXTRACT(DAY FROM NOW() - MAX(s.created_at)) as recencia_dias,
    SUM(s.total_amount) as valor_total,
    AVG(s.total_amount) as ticket_medio_cliente
FROM customers c
JOIN sales s ON c.id = s.customer_id
GROUP BY 1,2,3,4;

CREATE INDEX idx_customer_rfm ON customer_rfm(frequencia, recencia_dias);
```

### 4.2 Estratégia de Refresh
- **Frequência:** A cada 5 minutos ou sob demanda
- **Método:** `REFRESH MATERIALIZED VIEW CONCURRENTLY`
- **Script:** Python script agendado ou trigger-based

---

## 🔌 5. API Backend (FastAPI)

### 5.1 Estrutura de Endpoints

```
/api/v1/
├─ /analytics/
│  ├─ /query (POST)          # Endpoint genérico para queries customizadas
│  ├─ /metrics               # KPIs pré-calculados
│  ├─ /top-products          # Top N produtos
│  └─ /customer-segments     # Segmentação de clientes (RFM)
│
├─ /dimensions/              # Listar valores disponíveis
│  ├─ /stores
│  ├─ /channels
│  ├─ /products
│  └─ /regions
│
└─ /dashboards/              # (Nice to have)
   ├─ /list
   ├─ /save
   └─ /load/{id}
```

### 5.2 Exemplo de Request (Endpoint Genérico)

```json
POST /api/v1/analytics/query
{
  "metrics": ["faturamento", "ticket_medio", "qtd_vendas"],
  "dimensions": ["channel", "periodo_dia"],
  "filters": {
    "data_venda": {"gte": "2025-04-01", "lte": "2025-04-30"},
    "channel": {"in": ["iFood", "Rappi"]},
    "dia_semana": {"eq": 4}
  },
  "order_by": [{"field": "faturamento", "direction": "desc"}],
  "limit": 100
}
```

### 5.3 Response Format

```json
{
  "data": [
    {
      "channel": "iFood",
      "periodo_dia": "Noite",
      "faturamento": 125430.50,
      "ticket_medio": 45.80,
      "qtd_vendas": 2738
    }
  ],
  "metadata": {
    "total_rows": 12,
    "query_time_ms": 45,
    "cached": false
  }
}
```

---

## 🎨 6. Frontend (React + TypeScript)

### 6.1 Estrutura de Componentes

```
src/
├─ components/
│  ├─ QueryBuilder/
│  │  ├─ MetricSelector.tsx       # Seleção de métricas
│  │  ├─ DimensionSelector.tsx    # Seleção de dimensões
│  │  └─ FilterPanel.tsx          # Painel de filtros
│  │
│  ├─ Charts/
│  │  ├─ KPICard.tsx              # Cards de métricas
│  │  ├─ LineChart.tsx            # Gráfico de linha (ECharts)
│  │  ├─ BarChart.tsx             # Gráfico de barras (ECharts)
│  │  ├─ PieChart.tsx             # Gráfico de pizza (ECharts)
│  │  └─ DataTable.tsx            # Tabela dinâmica (TanStack)
│  │
│  ├─ Layout/
│  │  ├─ Sidebar.tsx              # Menu lateral
│  │  ├─ Header.tsx               # Cabeçalho
│  │  └─ Dashboard.tsx            # Container principal
│  │
│  └─ MariaQuestions/             # Componente especial para as 3 perguntas
│     ├─ Question1.tsx
│     ├─ Question2.tsx
│     └─ Question3.tsx
│
├─ hooks/
│  ├─ useAnalytics.ts             # Hook para queries
│  └─ useDimensions.ts            # Hook para dimensões
│
├─ services/
│  └─ api.ts                      # Axios/Fetch client
│
└─ types/
   └─ analytics.ts                # TypeScript interfaces
```

### 6.2 UI/UX Guidelines

- **Design System:** Ant Design ou shadcn/ui (definir após análise)
- **Responsividade:** Desktop-first (analytics é desktop-heavy)
- **Performance:** 
  - Lazy loading de componentes
  - Virtualização para tabelas grandes
  - Debounce em filtros (500ms)
- **Acessibilidade:** Suporte a teclado, labels ARIA

---

## 📅 7. Roadmap de Desenvolvimento (5 dias)

### **Dia 1 - Segunda (28/10)** 🟢 Setup + Modelagem
**Objetivo:** Ambiente funcionando e dados modelados

- [ ] Clonar repositório GitHub
- [ ] Analisar `database-schema.sql` e `generate_data.py`
- [ ] Setup Docker Compose (PostgreSQL)
- [ ] Executar schema e gerar 500k vendas
- [ ] Criar as 4 Materialized Views principais
- [ ] Validar performance das queries
- [ ] Criar script de refresh das MVs

**Entregável:** ✅ Database PostgreSQL populado com MVs funcionando

---

### **Dia 2 - Terça (29/10)** 🟡 Backend Core
**Objetivo:** API funcional com queries otimizadas

- [ ] Setup FastAPI (estrutura de pastas, config)
- [ ] Implementar conexão async com PostgreSQL
- [ ] Criar modelos Pydantic para request/response
- [ ] Desenvolver endpoint `/analytics/query` (genérico)
- [ ] Desenvolver endpoint `/metrics` (KPIs)
- [ ] Desenvolver endpoint `/dimensions/*`
- [ ] Testes de performance (query < 200ms)
- [ ] Documentação OpenAPI (Swagger)

**Entregável:** ✅ API REST funcionando com queries sub-200ms

---

### **Dia 3 - Quarta (30/10)** 🟠 Frontend Base
**Objetivo:** Interface funcional sem visualizações

- [ ] Setup Vite + React + TypeScript
- [ ] Instalar dependências (Ant Design/shadcn, React Query)
- [ ] Criar estrutura de pastas
- [ ] Implementar layout (Header + Sidebar + Main)
- [ ] Desenvolver QueryBuilder (MetricSelector + DimensionSelector)
- [ ] Desenvolver FilterPanel (Data, Loja, Canal)
- [ ] Integrar com API (hooks + services)
- [ ] Testar fluxo completo de query

**Entregável:** ✅ Interface funcional com filtros e seleção (sem gráficos)

---

### **Dia 4 - Quinta (31/10)** 🔴 Visualização + UX
**Objetivo:** Solução completa funcionando

**Manhã:**
- [ ] Instalar e configurar ECharts
- [ ] Implementar KPICard component
- [ ] Implementar LineChart component
- [ ] Implementar BarChart component
- [ ] Implementar PieChart component

**Tarde:**
- [ ] Implementar DataTable (TanStack Table)
- [ ] Criar componentes para as 3 perguntas de Maria
- [ ] Integrar comparação de períodos
- [ ] Polish UI/UX (cores, espaçamentos, responsividade)

**Noite:**
- [ ] Testes end-to-end
- [ ] Ajustes de performance frontend
- [ ] Loading states e error handling

**Entregável:** ✅ Solução 100% funcional respondendo as 3 perguntas

---

### **Dia 5 - Sexta (01/11)** 🟣 Deploy + Documentação + Vídeo
**Objetivo:** Entrega final pronta

**Manhã:**
- [ ] Dockerizar aplicação (Dockerfile + docker-compose)
- [ ] Setup CI/CD básico (opcional)
- [ ] Deploy backend (Railway / Render / Heroku)
- [ ] Deploy frontend (Vercel / Netlify)
- [ ] Configurar CORS e variáveis de ambiente
- [ ] Testes em produção

**Tarde:**
- [ ] Escrever documentação arquitetural (README.md)
- [ ] Documentar decisões técnicas
- [ ] Criar guia de setup local
- [ ] Preparar roteiro do vídeo demo

**Noite:**
- [ ] Gravar vídeo demo (5-10 min)
  - Apresentação da arquitetura
  - Demo das funcionalidades
  - Resposta às 3 perguntas de Maria
  - Performance e escalabilidade
- [ ] Editar vídeo
- [ ] Preparar email de envio

**Entregável:** ✅ Solução deployed + Documentação + Vídeo

---

### **Sábado/Domingo (02-03/11)** 🔵 Buffer & Polimento
**Objetivo:** Ajustes finais e contingência

- [ ] Revisão final de código
- [ ] Testes adicionais
- [ ] Implementar nice-to-have se possível
- [ ] Ajustes no vídeo
- [ ] Envio final até 23h59 de 03/11

---

## ✅ 8. Checklist de Entrega

### 8.1 Código
- [ ] Repositório Git organizado
- [ ] README.md completo com instruções
- [ ] Código bem documentado
- [ ] Testes implementados (unitários + integração)
- [ ] `.env.example` com variáveis necessárias
- [ ] Docker setup funcional

### 8.2 Solução Funcional
- [ ] Backend deployado e acessível
- [ ] Frontend deployado e acessível
- [ ] Database configurado
- [ ] Responde as 3 perguntas de Maria
- [ ] Performance < 500ms nas queries principais

### 8.3 Documentação
- [ ] Documentação arquitetural
- [ ] Justificativa das decisões técnicas
- [ ] Guia de instalação local
- [ ] Diagrama de arquitetura
- [ ] Documentação da API (Swagger)

### 8.4 Vídeo Demo (5-10 min)
- [ ] Apresentação pessoal
- [ ] Overview da solução
- [ ] Demonstração das funcionalidades
- [ ] Resposta às 3 perguntas de Maria
- [ ] Explicação das decisões arquiteturais
- [ ] Performance e escalabilidade

### 8.5 Email de Envio
- [ ] Destinatário: gsilvestre@arcca.io
- [ ] Assunto: "God Level Challenge - [Seu Nome]"
- [ ] Corpo: Nome completo, CPF
- [ ] Anexos/Links:
  - Link do repositório
  - Link da solução deployada
  - Link do vídeo (YouTube/Loom)
  - Documentação (PDF ou link)

---

## 🎯 9. Critérios de Avaliação

### 9.1 Pensamento Arquitetural (25%)
- ✅ Separação clara OLTP/OLAP
- ✅ Uso de Materialized Views
- ✅ API RESTful bem estruturada
- ✅ Escolha justificada de tecnologias
- ✅ Escalabilidade considerada

### 9.2 Qualidade da Solução (30%)
- ✅ Resolve o problema de Maria
- ✅ Self-service BI funcional
- ✅ Interface intuitiva
- ✅ Métricas relevantes para o negócio
- ✅ Flexibilidade na análise

### 9.3 Performance e Escala (20%)
- ✅ Queries < 500ms
- ✅ Suporta 500k+ registros
- ✅ Frontend responsivo
- ✅ Otimizações evidentes (índices, cache)

### 9.4 UX e Usabilidade (15%)
- ✅ Interface limpa e profissional
- ✅ Navegação intuitiva
- ✅ Feedback visual adequado
- ✅ Tratamento de erros
- ✅ Design responsivo

### 9.5 Metodologia de Trabalho (10%)
- ✅ Código limpo e organizado
- ✅ Commits semânticos
- ✅ Testes implementados
- ✅ Documentação clara
- ✅ Boas práticas aplicadas

---

## 📚 10. Recursos e Referências

### 10.1 Documentação Técnica
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [PostgreSQL Materialized Views](https://www.postgresql.org/docs/current/sql-creatematerializedview.html)
- [ECharts Documentation](https://echarts.apache.org/en/index.html)
- [React Query](https://tanstack.com/query/latest)
- [TanStack Table](https://tanstack.com/table/latest)

### 10.2 Inspirações de UI/UX
- Metabase
- Looker Studio (Google Data Studio)
- Tableau
- Power BI
- Retool

### 10.3 Deploy Platforms
- **Backend:** Railway, Render, Heroku, Fly.io
- **Frontend:** Vercel, Netlify, Cloudflare Pages
- **Database:** Supabase, Neon, Railway

---

## 🚀 11. Comandos Rápidos

### Setup Inicial
```bash
# Clonar repositório
git clone https://github.com/lucasvieira94/nola-god-level
cd nola-god-level

# Docker PostgreSQL
docker-compose up -d

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Database
```bash
# Conectar ao PostgreSQL
psql -h localhost -U postgres -d restaurant_analytics

# Refresh MVs
REFRESH MATERIALIZED VIEW CONCURRENTLY vendas_agregadas;
```

---

## 📝 12. Notas Importantes

### ⚠️ Pontos de Atenção
1. **Performance é crítica:** Queries devem ser < 500ms
2. **UX sem código:** O usuário não deve escrever SQL/código
3. **Escalabilidade:** Arquitetura deve suportar 10x+ dados
4. **As 3 perguntas de Maria:** Devem ser respondidas de forma clara e rápida

### 💡 Diferenciais Competitivos
1. Interface drag & drop intuitiva
2. Comparação de períodos automatizada
3. Visualizações interativas (drill-down)
4. Performance excepcional (< 200ms)
5. Deploy completo e funcional
6. Documentação detalhada

### 🎬 Roteiro do Vídeo (sugestão)
1. **Intro (30s):** Apresentação + contexto do desafio
2. **Arquitetura (2min):** Decisões técnicas + diagrama
3. **Demo Funcionalidades (3min):** Interface + filtros + visualizações
4. **3 Perguntas de Maria (2min):** Resolver cada uma ao vivo
5. **Performance (1min):** Mostrar velocidade das queries
6. **Conclusão (1min):** Diferenciais + próximos passos

---

## ✨ Status do Projeto

- [x] SpecKit criado e revisado
- [ ] Repositório clonado e analisado
- [ ] Ambiente local configurado
- [ ] Backend desenvolvido
- [ ] Frontend desenvolvido
- [ ] Deploy realizado
- [ ] Documentação finalizada
- [ ] Vídeo gravado e enviado

---

**Última atualização:** 28/10/2025  
**Versão:** 1.0  
**Desenvolvedor:** Vinicius Siqueira de Oliveira 
**Contato:** vinicius.oliveiratwt@gmail.com

---

> 💪 **"God Level Coder Challenge"** - Transformando dados em decisões estratégicas para o food service! 🍔📊
