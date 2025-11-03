# ⏱️ Timeline Cronológica Completa
## Todas as Alterações do Projeto em Ordem Temporal

---

## 📅 01 de Novembro de 2025

### 🕐 15:19 - Configuração Inicial do Backend
**Commit:** `25b21a7`  
**Tipo:** Setup  
**Duração:** ~30 min

**O que foi feito:**
- Configuração inicial do projeto backend com FastAPI
- Estrutura de pastas criada (app, models, api, services)
- Arquivo `requirements.txt` com dependências básicas
- Configuração de ambiente com python-dotenv

**Arquivos criados:**
- `backend/app/main.py`
- `backend/app/config.py`
- `backend/requirements.txt`

---

### 🕐 15:25 - Primeira Tentativa com asyncpg
**Commit:** `ab978d0`  
**Tipo:** Refactor  
**Motivo:** Compatibilidade Python 3.14

**Problema encontrado:**
- asyncpg não era compatível com Python 3.14
- Necessidade de migrar para psycopg3

**Decisão:** Migrar para psycopg3

---

### 🕐 15:46 - Migração Completa para psycopg3
**Commit:** `83c58c7`  
**Tipo:** Refactor  
**Duração:** ~20 min

**O que foi feito:**
- Instalado `psycopg[binary]` e `psycopg-pool`
- Reescrita da classe `Database` para usar psycopg3
- Atualização de todos os métodos (fetch_one, fetch_all, execute)
- Configuração de connection pool

**Código alterado:**
```python
# backend/app/db/database.py
import psycopg
from psycopg_pool import AsyncConnectionPool

class Database:
    def __init__(self):
        self.pool: Optional[AsyncConnectionPool] = None
    
    async def connect(self):
        self.pool = AsyncConnectionPool(
            conninfo=settings.DATABASE_URL,
            min_size=2,
            max_size=10
        )
```

---

### 🕐 15:57 - Docker Compose para Gerador de Dados
**Commit:** `e780eb7`  
**Tipo:** Configuration  
**Duração:** ~15 min

**O que foi feito:**
- Criado `docker-compose.yml` para gerador de dados
- Configurado Python 3.12 no container
- Volume mount para data_generator

**Por quê:**
- Gerador de dados não funcionava em Python 3.14
- Solução: executar em container com Python 3.12

---

### 🕐 16:02 - Fix Unicode no Docker
**Commit:** `336933a`  
**Tipo:** Bug Fix  
**Problema:** UnicodeDecodeError ao gerar dados

**Solução:**
```dockerfile
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV PYTHONIOENCODING=utf-8
```

---

### 🕐 18:32 - Frontend Inicial com React + Vite
**Commit:** `6c745c7`  
**Tipo:** Feature  
**Duração:** ~2 horas

**O que foi feito:**
- Criado projeto React com Vite
- Instalado TypeScript, Ant Design, ECharts
- Estrutura de componentes (Dashboard, KPIs)
- Primeiros gráficos básicos

**Dependências instaladas:**
```json
{
  "react": "^18.3.1",
  "antd": "^5.21.6",
  "echarts": "^5.5.1",
  "@tanstack/react-query": "^5.59.20"
}
```

**Arquivos criados:**
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/components/KPICards.tsx`
- `frontend/src/components/Charts/`

---

### 🕐 19:01 - Materialized Views + Ambiente Completo
**Commit:** `16ae93b`  
**Tipo:** Feature + Configuration  
**Duração:** ~30 min

**O que foi feito:**
- Criadas materialized views no PostgreSQL
- Backend rodando na porta 8000
- Frontend rodando na porta 5173
- CORS configurado

**Views criadas:**
```sql
CREATE MATERIALIZED VIEW mv_sales_by_channel AS ...
CREATE MATERIALIZED VIEW mv_sales_by_product AS ...
CREATE MATERIALIZED VIEW mv_hourly_sales AS ...
```

---

### 🕐 20:03 - Gráficos ECharts Completos
**Commit:** `09e2f13`  
**Tipo:** Feature  
**Duração:** ~1 hora

**O que foi implementado:**
- ✅ Gráfico de pizza (vendas por canal)
- ✅ Gráfico de barras (top produtos)
- ✅ Heatmap (horários de pico)
- ✅ Métricas de entrega

**Componentes criados:**
- `SalesChannelChart.tsx`
- `TopProductsChart.tsx`
- `DeliveryMetrics.tsx`
- `HourlyHeatmap.tsx`

---

### 🕐 20:09 - Refatoração + READMEs
**Commit:** `2889c84`  
**Tipo:** Refactor + Documentation  
**Duração:** ~10 min

**O que foi feito:**
- Removidos arquivos de teste
- Otimizado database pool
- Adicionado logging estruturado
- READMEs completos para backend e frontend

---

### 🕐 20:18 - Fix Estrutura de Filtros
**Commit:** `5010474`  
**Tipo:** Bug Fix  
**Problema:** Gráficos quebravam com filtros

**Causa:** Frontend enviava `filters: []` (array)  
**Backend esperava:** `filters: {}` (objeto)

**Solução:**
```typescript
// Antes:
filters: []

// Depois:
filters: {}
```

---

### 🕐 21:16 - Análise de Status vs SPECKIT
**Commit:** `44a73b7`  
**Tipo:** Documentation  
**Duração:** ~30 min

**O que foi criado:**
- `STATUS_IMPLEMENTACAO.md`
- Comparação completa: implementado vs especificado
- Identificação de gaps

**Descobertas:**
- 80% das features básicas implementadas
- Faltavam: filtros globais, comparação períodos, export, churn

---

### 🕐 21:23 - Plano de Melhorias
**Commit:** `76336d7`  
**Tipo:** Documentation  
**Duração:** ~10 min

**O que foi criado:**
- `PLANO_MELHORIAS.md`
- 14 features priorizadas
- Cronograma de 3 dias
- Estimativas de tempo

---

### 🕐 21:36 - Feature #1: Filtros Globais
**Commit:** `7a1a376`  
**Tipo:** Feature  
**Duração:** ~30 min

**O que foi implementado:**
- DateRangePicker com Ant Design
- MultiSelect para canais
- FilterPanel no sidebar
- Zustand para estado global

**Componentes criados:**
- `components/Filters/FilterPanel.tsx`
- `components/Filters/DateRangePicker.tsx`
- `store/useFiltersStore.ts`

---

### 🕐 22:05 - Fix psycopg-pool no Requirements
**Commit:** `ab60d81`  
**Tipo:** Bug Fix  
**Problema:** Backend não iniciava

**Causa:** `psycopg-pool` faltando no requirements.txt

**Solução:**
```txt
psycopg[binary]==3.2.3
psycopg-pool==3.2.3
```

---

### 🕐 22:11 - QUICKSTART.md
**Commit:** `aa77674`  
**Tipo:** Documentation

**O que foi criado:**
- Guia rápido de uso dos scripts
- Instruções de setup
- Comandos principais

---

### 🕐 22:37 - Fix Parâmetros do Database
**Commit:** `f0ac04e`  
**Tipo:** Bug Fix  
**Problema:** Queries falhavam sem parâmetros

**Causa:** Passando `None` quando deveria ser tupla vazia

**Solução:**
```python
# Antes:
params = None

# Depois:
params = params or ()
```

---

### 🕐 23:18 - Fix Placeholders SQL (Parte 1)
**Commit:** `21125f2`  
**Tipo:** Bug Fix  
**Problema:** Syntax error em queries

**Causa:** psycopg3 usa `%s` em vez de `$1, $2`

**Solução:** Substituir todos os placeholders

---

### 🕐 23:20 - Fix Placeholders SQL (Completo)
**Commit:** `80e081d`  
**Tipo:** Bug Fix

**O que foi corrigido:**
- Todos os placeholders em `analytics_service.py`
- WHERE clauses
- INSERT statements
- UPDATE statements

---

### 🕐 23:35 - Fix Event Loop Windows
**Commit:** `566e8e7`  
**Tipo:** Bug Fix  
**Problema:** Backend travava no Windows

**Causa:** asyncio padrão não funciona bem no Windows

**Solução:**
```python
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(
        asyncio.WindowsSelectorEventLoopPolicy()
    )
```

---

### 🕐 23:37 - Metrics Opcional
**Commit:** `66d1fb9`  
**Tipo:** Enhancement  

**O que mudou:**
- Métricas agora são opcionais quando há dimensões
- Permite queries de listagem pura

---

### 🕐 23:39 - Fix Formato order_by
**Commit:** `b883e82`  
**Tipo:** Bug Fix  
**Problema:** order_by não funcionava

**Antes:** `order_by: "canal_venda"`  
**Depois:** `order_by: [{ field: "canal_venda", direction: "asc" }]`

---

### 🕐 23:42 - Aliases PT-BR
**Commit:** `c886f32`  
**Tipo:** Enhancement

**O que foi adicionado:**
- `canal_venda` → `ch.name`
- `nome_loja` → `st.name`
- `nome_produto` → `p.name`
- Logs de debug

---

### 🕐 23:43 - Métricas SQL Customizadas
**Commit:** `3f4d4b2`  
**Tipo:** Enhancement

**O que permite:**
- `SUM(ps.quantity * ps.unit_price)`
- `COUNT(DISTINCT s.customer_id)`
- Qualquer agregação SQL válida

---

### 🕐 23:45 - Fix Nome Coluna Quantity
**Commit:** `d681504`  
**Tipo:** Bug Fix

**Problema:** Coluna quantity não encontrada  
**Solução:** Usar `ps.quantity` completo

---

### 🕐 23:47 - Ajuste Range de Datas
**Commit:** `2651ff8`  
**Tipo:** Enhancement

**O que mudou:**
- Data inicial: 05/05/2025
- Data final: 20/05/2025
- Período real dos dados

---

### 🕐 23:51 - Feature #2: Comparação de Períodos (Backend)
**Commit:** `b3fd757`  
**Tipo:** Feature

**O que foi criado:**
- Endpoint `/api/v1/analytics/compare`
- Calcula diferenças e percentuais
- Retorna base_metrics + compare_metrics

---

## 📅 02 de Novembro de 2025

### 🕐 20:24 - Feature #2: Comparação de Períodos (Frontend)
**Commit:** `bdff6d6`  
**Tipo:** Feature  
**Duração:** ~30 min

**O que foi implementado:**
- Componente `PeriodComparison.tsx`
- Cards com indicadores visuais (↑↓)
- Cores verde/vermelho
- Percentuais de mudança

---

### 🕐 20:30 - Feature #3: Gráfico Temporal
**Commit:** `b054c43`  
**Tipo:** Feature  
**Duração:** ~30 min

**O que foi implementado:**
- Gráfico de linha temporal
- Zoom in/out
- Multi-séries (faturamento + quantidade)
- Granularidade (dia/semana/mês)

---

### 🕐 20:36 - Eixos Y Duplos
**Commit:** `5ace57b`  
**Tipo:** Enhancement

**O que foi adicionado:**
- Eixo Y esquerdo: Faturamento (R$)
- Eixo Y direito: Quantidade (un)
- Agregação por semana

---

### 🕐 20:39 - Melhorias no Gráfico Temporal
**Commit:** `64a9b8f`  
**Tipo:** Enhancement

**O que foi melhorado:**
- Formatação do eixo X (datas)
- Aviso quando há poucos dados
- Tooltip melhorado

---

### 🕐 20:42 - Feature #4: Tabela Dinâmica
**Commit:** `8a1e484`  
**Tipo:** Feature  
**Duração:** ~30 min

**O que foi implementado:**
- TanStack Table v8
- Sorting por colunas
- Filtering inline
- Paginação (10/25/50/100)
- Export CSV

**Componente:** `components/DataTable/DataTable.tsx`

---

### 🕐 20:47 - Simplificação da DataTable
**Commit:** `876115a`  
**Tipo:** Bug Fix  
**Problema:** Tabela travava com muitos dados

**Solução:** Remover dimensão produto da query

---

### 🕐 20:52 - Feature #5: Query Builder
**Commit:** `b2a55f2`  
**Tipo:** Feature  
**Duração:** ~30 min

**O que foi implementado:**
- Drag-and-drop de métricas
- Drag-and-drop de dimensões
- Construtor visual de filtros
- Preview da query SQL
- Save/Load queries

**Componente:** `components/QueryBuilder/`

---

### 🕐 20:57 - Segurança (SQL Injection)
**Commit:** `7ae4a26`  
**Tipo:** Security  

**O que foi adicionado:**
- Whitelist de métricas
- Whitelist de dimensões
- Proteção contra SQL injection
- Documentação de segurança

**Arquivo:** `SECURITY.md`

---

### 🕐 21:19 - Remoção do Query Builder
**Commit:** `ee95c41`  
**Tipo:** Refactor  
**Motivo:** Complexo demais para usuários leigos

**Decisão:** Manter apenas visualizações prontas

---

### 🕐 21:21 - Feature #6: Export Completo
**Commit:** `be0c8b1`  
**Tipo:** Feature  
**Duração:** ~30 min

**O que foi implementado:**
- Export CSV (tabelas)
- Export Excel (com formatação)
- Export PNG (gráficos)
- Export PDF (relatório completo)

**Bibliotecas:**
- `file-saver`
- `xlsx`
- `jspdf`
- `html2canvas`

---

### 🕐 21:27 - DataTable Error Handling
**Commit:** `b61de9a`  
**Tipo:** Enhancement

**O que foi adicionado:**
- Try-catch
- Loading state
- Logs de debug
- Mensagens de erro

---

### 🕐 21:34 - Fix Nomes de Dimensões
**Commit:** `e8aef67`  
**Tipo:** Bug Fix

**Corrigido:**
- `channel` → `canal_venda`
- `product` → `nome_produto`

---

### 🕐 21:52 - Validação Métricas Customizadas
**Commit:** `a6a1865`  
**Tipo:** Enhancement

**O que foi expandido:**
- Aceitar `COUNT(DISTINCT ...)`
- Aceitar `SUM()` sem prefixo
- Aceitar `AVG()` sem prefixo

---

### 🕐 21:56 - Pattern 4 para COUNT DISTINCT
**Commit:** `5b7cc5e`  
**Tipo:** Enhancement

**Padrão adicionado:**
```python
r'^COUNT\s*\(\s*DISTINCT\s+\w+\s*\)$'
```

---

### 🕐 22:02 - Feature #7: Churn Dashboard
**Commit:** `c05f7cb`  
**Tipo:** Feature  
**Duração:** ~40 min

**O que foi implementado:**
- Dashboard completo de churn
- Análise RFM (Recency, Frequency, Monetary)
- Clientes em risco
- Valor em risco
- Métricas de churn

**Componentes:**
- `pages/ChurnDashboard.tsx`
- `components/ChurnAnalysis/RFMSegmentation.tsx`
- `components/ChurnAnalysis/AtRiskCustomers.tsx`

---

### 🕐 22:03 - Fix Imports Churn
**Commit:** `5c04008`  
**Tipo:** Bug Fix

**Corrigido:** Usar barrel exports (`index.ts`)

---

### 🕐 22:49 - Fix Queries de Churn
**Commit:** `5f3942c`  
**Tipo:** Bug Fix

**Problema:** customer_name incorreto, RFM não calculava

**Solução:**
- Usar `c.name` para customer_name
- Calcular RFM dinamicamente sem view
- Joins corretos

---

### 🕐 23:03 - Ajuste Clientes em Risco
**Commit:** `c3f3e3a`  
**Tipo:** Enhancement

**O que mudou:**
- Remover filtro de período rígido
- Traduzir segmentos RFM para PT-BR
- Champions, Loyal, etc.

---

### 🕐 23:09 - Feature #8: Salvar Dashboards
**Commit:** `b0634ec`  
**Tipo:** Feature  
**Duração:** ~30 min

**O que foi implementado:**
- Salvar configuração de dashboard
- Carregar dashboard salvo
- Duplicar dashboard
- Excluir dashboard
- LocalStorage para persistência

**Componente:** `components/Dashboard/DashboardManager.tsx`

---

### 🕐 23:25 - Feature #10: Dark Mode
**Commit:** `adfe267`  
**Tipo:** Feature  
**Duração:** ~30 min

**O que foi implementado:**
- Toggle dark/light
- Persistência no localStorage
- Temas para ECharts
- Context API + Hook customizado

**Arquivos:**
- `hooks/useTheme.ts`
- `styles/theme.ts`

---

### 🕐 23:36 - Feature #9: Drill-down
**Commit:** `e9aa56b`  
**Tipo:** Feature  
**Duração:** ~30 min

**O que foi implementado:**
- Click em gráfico abre modal
- Análise detalhada do item
- Gráficos específicos
- Navegação breadcrumb

**Componentes:**
- `components/DrillDown/DrillDownModal.tsx`
- `components/DrillDown/DrillDownContent.tsx`

---

### 🕐 23:44 - Fix Imports DrillDown
**Commit:** `89be313`  
**Tipo:** Bug Fix

**Corrigido:** Imports TypeScript + parâmetros não usados

---

### 🕐 23:45 - Remove monetaryMetrics
**Commit:** `3a848e3`  
**Tipo:** Bug Fix

---

### 🕐 23:45 - Remove useDashboardStore Import
**Commit:** `93c5103`  
**Tipo:** Bug Fix

---

### 🕐 23:48 - Fix Filtros Drill-down (Arrays)
**Commit:** `b146795`  
**Tipo:** Bug Fix  
**Problema:** Drill-down mostrava zeros

**Causa:** Frontend enviava `canal_venda: 'iFood'` (string)  
**Backend esperava:** `canal_venda: ['iFood']` (array)

**Solução:**
```typescript
filters.canal_venda = [context.value]; // Array!
```

---

### 🕐 23:56 - Fix Backend Filter Mapping
**Commit:** `ae53fd4`  
**Tipo:** Bug Fix  
**Problema:** Backend 500 - "column canal_venda does not exist"

**Causa:** Backend usava nome do campo diretamente no SQL

**Solução:**
- Mapear através de `DIMENSIONS_MAP`
- `canal_venda` → `ch.name`
- Adicionar JOINs automaticamente

**Código:**
```python
field_expr = field
if field in self.DIMENSIONS_MAP:
    field_expr, join_hint = self.DIMENSIONS_MAP[field]
    # Adicionar JOIN channels se necessário
```

---

## 📅 03 de Novembro de 2025

### 🕐 00:10 - Fix Cache React Query
**Commit:** `1fa4c4f`  
**Tipo:** Bug Fix  
**Problema:** Drill-down funciona primeira vez, depois falha

**Causa:** React Query cacheia com object reference  
**Objects mudam referência mas React Query não detecta**

**Solução:**
```typescript
// Memoizar filtros
const filters = useMemo(() => { ... }, [deps]);

// Serializar para queryKey
const filtersKey = useMemo(() => 
  JSON.stringify(filters), [filters]
);

// Usar string na queryKey
queryKey: ['drill-down', filtersKey],

// Sempre revalidar
staleTime: 0,
gcTime: 0
```

---

### 🕐 00:17 - Debug Logs Gráficos
**Commit:** `31967f8`  
**Tipo:** Debug

**O que foi adicionado:**
- Logs com emojis (📊 🔍 ⏰ 📈)
- hasRef, loading, hasData, dataLength
- Tracking de lifecycle dos gráficos

---

### 🕐 00:30 - Melhor Cleanup Gráficos
**Commit:** `1d51bbc`  
**Tipo:** Enhancement

**O que foi melhorado:**
- Nullificar instâncias após dispose
- Verificar arrays vazios
- Logs de criação/reutilização
- Logs de skip

---

### 🕐 00:40 - Retry Mechanism para Refs
**Commit:** `fcc91ea`  
**Tipo:** Bug Fix  
**Problema:** Dados chegam antes do DOM estar pronto

**Causa:** Race condition - query resolve antes do ref

**Solução:**
```typescript
if (!chartRef.current) {
  // Retry após 50ms
  setTimeout(() => {
    if (chartRef.current && !chartInstance.current) {
      // Renderizar agora
    }
  }, 50);
  return;
}
```

---

### 🕐 00:56 - destroyOnClose no Modal
**Commit:** `20a3060`  
**Tipo:** Bug Fix  
**Problema:** Gráficos só funcionam na primeira abertura

**CAUSA RAIZ:**
- Modal do Ant Design não desmonta conteúdo ao fechar
- Apenas esconde com `display: none`
- Refs ficam presas ao DOM escondido
- Segunda abertura: refs apontam para elementos invisíveis

**SOLUÇÃO:**
```typescript
<Modal destroyOnClose={true}>
```

**Resultado:**
- Modal desmonta completamente ao fechar
- Refs são recriadas do zero
- Gráficos funcionam em todas as aberturas ✅

---

### 🕐 01:05 - Feature #11: Alertas e Notificações
**Commit:** `094ee15`  
**Tipo:** Feature  
**Duração:** ~1 hora

**Backend:**
- Modelo `Alert` com Pydantic
- Serviço `AlertService` (in-memory)
- Endpoints CRUD (`/api/v1/alerts`)
- Verificação automática de alertas
- Suporte a operadores (>, <, =, ≥, ≤)

**Frontend:**
- Página de gerenciamento
- Tabela com alertas
- Modal criar/editar
- Notificações toast automáticas
- Verificação a cada 60 segundos

**Arquivos criados:**
- `backend/app/models/alert.py`
- `backend/app/services/alert_service.py`
- `backend/app/api/alerts.py`
- `frontend/src/components/Alerts/AlertManager.tsx`
- `frontend/src/components/Alerts/CreateAlertModal.tsx`
- `frontend/src/components/Alerts/AlertNotification.tsx`

---

### 🕐 01:09 - Fix Imports Alertas
**Commit:** `4fb75b3`  
**Tipo:** Bug Fix

**Corrigido:**
- Adicionar `.tsx` em imports
- `AnalyticsQueryRequest` correto no backend

---

### 🕐 01:18 - Feature #12: Multi-idioma (i18n)
**Commit:** `e6fa6e0`  
**Tipo:** Feature  
**Duração:** ~40 min

**O que foi implementado:**
- react-i18next + i18next
- 3 idiomas: PT, EN, ES
- Seletor de idioma no header
- Detecção automática
- Persistência no localStorage

**Traduções completas para:**
- Menu
- Alertas
- Dashboard
- Churn
- Drill-down
- Métricas
- Botões

**Arquivos criados:**
- `frontend/src/i18n/config.ts`
- `frontend/src/i18n/locales/pt.json`
- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/es.json`
- `frontend/src/components/LanguageSelector.tsx`

---

## 📊 Resumo Estatístico

### Total de Alterações
- **Commits:** 61
- **Dias trabalhados:** 3
- **Horas estimadas:** ~20 horas
- **Arquivos criados:** 85+
- **Arquivos modificados:** 150+

### Por Tipo
- **Features:** 12 grandes features
- **Bug Fixes:** 20+ correções
- **Enhancements:** 15+ melhorias
- **Refactors:** 5 refatorações
- **Documentation:** 5 documentos

### Por Área
- **Backend:** 30% das alterações
- **Frontend:** 60% das alterações
- **Documentation:** 5% das alterações
- **Configuration:** 5% das alterações

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
