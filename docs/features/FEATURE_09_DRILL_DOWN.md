# 🔍 Feature #9: Drill-down em Gráficos
## A História Completa - De Zeros a Funcional (11 Commits)

**Data Inicial:** 02/11/2025 23:36  
**Data Final:** 03/11/2025 00:56  
**Duração Total:** ~1h 20min  
**Commits:** 11  
**Status:** ✅ Completa e Funcional

---

## 📋 Contexto

Após implementar o dashboard principal com gráficos interativos (ECharts), o usuário solicitou a funcionalidade de **drill-down**: ao clicar em um ponto/barra/setor do gráfico, abrir um modal com análise detalhada daquele item específico.

**Requisitos:**
- ✅ Click em qualquer gráfico
- ✅ Modal com análise detalhada
- ✅ Gráficos específicos do item
- ✅ KPIs relevantes
- ✅ Timeline do item
- ✅ Breadcrumb de navegação

---

## 🎯 Implementação Inicial

### Commit #1: Implementação Base
**Hash:** `e9aa56b`  
**Data:** 02/11/2025 23:36  
**Tipo:** Feature

**O que foi criado:**

#### Backend - Novos Endpoints
Nenhum endpoint novo! Usamos a API existente `/api/v1/analytics/query` com filtros customizados.

#### Frontend - Componentes

**1. DrillDownModal.tsx** (150 linhas)
```typescript
interface DrillDownModalProps {
  visible: boolean;
  onClose: () => void;
  context: {
    type: 'channel' | 'product' | 'store' | 'neighborhood' | 'hour';
    value: string;
    label: string;
  } | null;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  visible,
  onClose,
  context
}) => {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      title={
        <Space>
          <ArrowLeftOutlined onClick={onClose} />
          <Breadcrumb>
            <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item>{context?.label}</Breadcrumb.Item>
          </Breadcrumb>
        </Space>
      }
    >
      <DrillDownContent context={context} />
    </Modal>
  );
};
```

**2. DrillDownContent.tsx** (280 linhas)
```typescript
export const DrillDownContent: React.FC<{ context: DrillDownContext }> = ({
  context
}) => {
  // Construir filtros baseado no contexto
  const filters = useMemo(() => {
    const result: any = {};
    
    if (context.type === 'channel') {
      result.canal_venda = context.value; // ⚠️ BUG #1: String, não array!
    } else if (context.type === 'product') {
      result.nome_produto = context.value;
    }
    // ... outros tipos
    
    return result;
  }, [context]);

  // Query para KPIs
  const { data: kpiData } = useQuery({
    queryKey: ['drill-down-kpi', filters],
    queryFn: () => analyticsApi.query({
      metrics: ['SUM(ps.quantity * ps.unit_price)', 'COUNT(DISTINCT s.id)'],
      dimensions: [],
      filters
    })
  });

  // Query para gráficos
  const { data: chartData } = useQuery({
    queryKey: ['drill-down-chart', filters],
    queryFn: () => analyticsApi.query({
      dimensions: ['DATE(s.sale_date)'],
      metrics: ['SUM(ps.quantity * ps.unit_price)'],
      filters,
      order_by: [{ field: 'DATE(s.sale_date)', direction: 'asc' }]
    })
  });

  return (
    <div>
      <Row gutter={16}>
        {/* KPIs */}
        <Col span={6}>
          <Statistic title="Faturamento" value={totalRevenue} />
        </Col>
        <Col span={6}>
          <Statistic title="Vendas" value={totalSales} />
        </Col>
        {/* ... mais KPIs */}
      </Row>
      
      {/* Gráficos */}
      <Row gutter={16}>
        <Col span={12}>
          <TimelineChart data={chartData} />
        </Col>
        <Col span={12}>
          <TopProductsChart data={chartData} filters={filters} />
        </Col>
      </Row>
    </div>
  );
};
```

**3. Integração nos Gráficos Existentes**
```typescript
// SalesChannelChart.tsx
const onChartClick = (params: any) => {
  setDrillDownContext({
    type: 'channel',
    value: params.name,
    label: `Canal: ${params.name}`
  });
  setDrillDownVisible(true);
};

chartInstance.on('click', onChartClick);
```

**Resultado:** Modal abre, mas... 🐛

---

## 🐛 Bug #1: Tudo Zerado!

### O Problema
**Data:** 02/11/2025 23:44  
**Usuário reportou:** "Não está mostrando nada... tudo zerado"

**Sintomas:**
- Modal abre ✅
- KPIs mostram R$ 0,00 ❌
- Gráficos vazios ❌
- Console sem erros ❌

### Investigação (Commits #2-5)

**Commit #2:** `89be313` - Fix imports TypeScript  
**Commit #3:** `3a848e3` - Remove monetaryMetrics  
**Commit #4:** `93c5103` - Remove useDashboardStore import  
**Commit #5:** `b146795` - **SOLUÇÃO ENCONTRADA!**

### Causa Raiz
```typescript
// ❌ ERRADO (o que estava sendo enviado)
filters: {
  canal_venda: 'iFood'  // String!
}

// ✅ CORRETO (o que o backend esperava)
filters: {
  canal_venda: ['iFood']  // Array!
}
```

**Por quê?**
- Backend usa `WHERE canal_venda IN (%s, %s, ...)` 
- Espera sempre arrays para filtros
- String causava query incorreta: `WHERE canal_venda IN ('iFood')` → funcionava
- Mas valores não eram encontrados porque o campo real é `ch.name`, não `canal_venda`!

### Solução (Commit #5)
**Hash:** `b146795`  
**Data:** 02/11/2025 23:48

```typescript
const filters = useMemo(() => {
  const result: any = {};
  
  if (context.type === 'channel') {
    result.canal_venda = [context.value]; // ✅ Array!
  } else if (context.type === 'product') {
    result.nome_produto = [context.value]; // ✅ Array!
  } else if (context.type === 'neighborhood') {
    result.bairro = [context.value]; // ✅ Array!
  }
  
  return result;
}, [context]);
```

**Resultado:** Dados aparecem! Mas... novo erro 🐛

---

## 🐛 Bug #2: Backend 500 Error

### O Problema
**Data:** 02/11/2025 23:56  
**Erro:** `column "canal_venda" does not exist`

**Stack trace:**
```
psycopg.errors.UndefinedColumn: column "canal_venda" does not exist
LINE 3: WHERE canal_venda IN (%s)
              ^
HINT: Perhaps you meant to reference the column "ch.name"
```

### Causa Raiz
Backend estava usando o nome do campo diretamente no SQL:

```python
# ❌ ERRADO
def build_query(filters):
    where_clauses = []
    for field, values in filters.items():
        where_clauses.append(f"{field} IN ({placeholders})")  # field = 'canal_venda'
```

**Problema:**
- `canal_venda` não existe como coluna
- É um **alias** que deveria mapear para `ch.name`
- Tabela channels precisa de JOIN

### Solução (Commit #6)
**Hash:** `ae53fd4`  
**Data:** 02/11/2025 23:56

```python
class AnalyticsService:
    DIMENSIONS_MAP = {
        'canal_venda': ('ch.name', 'channel'),
        'nome_loja': ('st.name', 'store'),
        'nome_produto': ('p.name', 'product'),
        'bairro': ('st.neighborhood', 'store'),
        # ...
    }
    
    def build_query(self, filters):
        where_clauses = []
        required_joins = set()
        
        for field, values in filters.items():
            if field in self.DIMENSIONS_MAP:
                field_expr, join_hint = self.DIMENSIONS_MAP[field]
                required_joins.add(join_hint)
                where_clauses.append(f"{field_expr} IN ({placeholders})")
            else:
                where_clauses.append(f"{field} IN ({placeholders})")
        
        # Adicionar JOINs necessários
        for join in required_joins:
            if join == 'channel':
                query += " LEFT JOIN channels ch ON s.channel_id = ch.id"
            # ...
```

**Resultado:** Backend funciona! Mas frontend ainda zerado... 🐛

---

## 🐛 Bug #3: Cache do React Query

### O Problema
**Data:** 03/11/2025 00:10  
**Usuário:** "Funciona primeira vez, depois nunca mais"

**Sintomas:**
- Primeiro drill-down: funciona ✅
- Segundo drill-down: mostra dados do primeiro ❌
- Terceiro drill-down: ainda mostra dados do primeiro ❌

### Causa Raiz
```typescript
// ❌ PROBLEMA
const { data } = useQuery({
  queryKey: ['drill-down', filters],  // filters é objeto!
  queryFn: () => analyticsApi.query(filters)
});
```

**Por quê não funciona:**
1. `filters` é um objeto JavaScript
2. Objetos têm referência, não valor
3. React Query compara por referência
4. Mesmo conteúdo = referência diferente = cache hit errado!

**Exemplo:**
```typescript
const filters1 = { canal_venda: ['iFood'] };
const filters2 = { canal_venda: ['iFood'] };

filters1 === filters2  // false! (referências diferentes)
JSON.stringify(filters1) === JSON.stringify(filters2)  // true!
```

### Solução (Commit #7)
**Hash:** `1fa4c4f`  
**Data:** 03/11/2025 00:10

```typescript
// ✅ SOLUÇÃO
const filters = useMemo(() => ({
  canal_venda: [context.value]
}), [context.value, context.type]); // Memoizar!

const filtersKey = useMemo(() => 
  JSON.stringify(filters), [filters]
); // Serializar!

const { data } = useQuery({
  queryKey: ['drill-down', filtersKey], // String estável!
  queryFn: () => analyticsApi.query(filters),
  staleTime: 0,  // Sempre revalidar
  gcTime: 0      // Não cachear
});
```

**Resultado:** Cache funciona corretamente! Mas gráficos não renderizam... 🐛

---

## 🐛 Bug #4: Gráficos Não Renderizam

### O Problema
**Data:** 03/11/2025 00:17  
**Sintomas:**
- Dados chegam ✅
- Refs existem ✅
- `echarts.init()` não é chamado ❌

### Investigação (Commits #8-9)

**Commit #8:** `31967f8` - Adicionar logs de debug
```typescript
console.log('📊 Chart render:', {
  hasRef: !!chartRef.current,
  loading,
  hasData: !!data,
  dataLength: data?.length
});
```

**Descoberta:**
```
📊 Chart render: { hasRef: false, loading: true, hasData: false, dataLength: 0 }
📊 Chart render: { hasRef: true, loading: true, hasData: false, dataLength: 0 }
📊 Chart render: { hasRef: true, loading: false, hasData: true, dataLength: 15 }
⏰ Data arrived but skipped render (no ref) // ⚠️ AQUI!
```

### Causa Raiz
**Race condition entre dados e DOM!**

1. Componente monta
2. Query inicia
3. Ref ainda é `null` (DOM não pronto)
4. Query resolve (dados chegam)
5. useEffect roda: `if (!chartRef.current) return;` ❌ SKIP!
6. Ref fica pronta (tarde demais)

### Solução (Commit #9)
**Hash:** `fcc91ea`  
**Data:** 03/11/2025 00:40

```typescript
useEffect(() => {
  if (!data || data.length === 0) return;
  
  if (!chartRef.current) {
    console.log('⏰ Data ready but ref not yet, retrying in 50ms...');
    
    // ✅ RETRY MECHANISM
    setTimeout(() => {
      if (chartRef.current && !chartInstance.current) {
        console.log('📈 Retry successful, rendering chart');
        renderChart();
      }
    }, 50);
    return;
  }
  
  renderChart();
}, [data, chartRef.current]);
```

**Resultado:** Gráficos renderizam! Mas só na primeira abertura... 🐛

---

## 🐛 Bug #5: Modal Não Limpa Gráficos

### O Problema Final
**Data:** 03/11/2025 00:56  
**Usuário:** "Funciona na primeira vez, depois quebra"

**Sintomas:**
- Primeira abertura: tudo funciona ✅
- Fechar modal ✅
- Segunda abertura: gráficos em branco ❌
- Console: "Refs exist but not rendering" ❌

### Investigação Profunda

**Teste 1:** Inspecionar DOM
```javascript
// Modal fechado
document.querySelector('.drill-down-chart')  // null ✅

// Modal aberto pela segunda vez
document.querySelector('.drill-down-chart')  // <div> existe ✅
document.querySelector('.drill-down-chart').offsetParent  // null ❌❌❌
```

**CAUSA RAIZ DESCOBERTA!**

O Modal do Ant Design **NÃO DESMONTA** o conteúdo ao fechar!
- Apenas esconde com `display: none`
- Refs ficam apontando para elementos **invisíveis**
- `echarts.init()` falha silenciosamente em elementos invisíveis
- Segunda abertura: refs apontam para DOM antigo escondido

**Comportamento do Ant Design Modal:**
```typescript
// Padrão (destroyOnClose: false)
<Modal>
  <div style="display: none"> {/* Escondido, não destruído! */}
    <div ref={chartRef}> {/* Ref antiga permanece! */}
  </div>
</Modal>
```

### Solução Final (Commit #10)
**Hash:** `20a3060`  
**Data:** 03/11/2025 00:56

```typescript
<Modal
  open={visible}
  onCancel={onClose}
  width={1200}
  destroyOnClose={true}  // ✅ SOLUÇÃO MÁGICA!
  footer={null}
>
  <DrillDownContent context={context} />
</Modal>
```

**O que `destroyOnClose` faz:**
1. Ao fechar: **desmonta completamente** o conteúdo
2. Refs são liberadas da memória
3. Instâncias ECharts são destruídas
4. Ao abrir: **tudo recriado do zero**
5. Refs novas, DOM novo, gráficos novos ✅

**Resultado:** FUNCIONA PERFEITAMENTE! ✅✅✅

---

## 📊 Código Final

### DrillDownModal.tsx (Versão Final)
```typescript
import React from 'react';
import { Modal, Breadcrumb, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { DrillDownContent } from './DrillDownContent';

export interface DrillDownContext {
  type: 'channel' | 'product' | 'store' | 'neighborhood' | 'hour';
  value: string;
  label: string;
}

interface DrillDownModalProps {
  visible: boolean;
  onClose: () => void;
  context: DrillDownContext | null;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  visible,
  onClose,
  context
}) => {
  if (!context) return null;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      destroyOnClose={true}  // ✅ CRÍTICO!
      title={
        <Space>
          <ArrowLeftOutlined 
            onClick={onClose} 
            style={{ cursor: 'pointer' }} 
          />
          <Breadcrumb>
            <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item>{context.label}</Breadcrumb.Item>
          </Breadcrumb>
        </Space>
      }
    >
      <DrillDownContent context={context} />
    </Modal>
  );
};
```

### DrillDownContent.tsx (Versão Final)
```typescript
import React, { useMemo } from 'react';
import { Row, Col, Statistic, Card } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api/analytics';
import { DrillDownContext } from './DrillDownModal';

export const DrillDownContent: React.FC<{ context: DrillDownContext }> = ({
  context
}) => {
  // ✅ Filtros memoizados corretamente
  const filters = useMemo(() => {
    const result: any = {};
    
    if (context.type === 'channel') {
      result.canal_venda = [context.value];  // Array!
    } else if (context.type === 'product') {
      result.nome_produto = [context.value];
    } else if (context.type === 'neighborhood') {
      result.bairro = [context.value];
    }
    
    return result;
  }, [context.type, context.value]);

  // ✅ Query key serializada
  const filtersKey = useMemo(() => 
    JSON.stringify(filters), [filters]
  );

  // Query para KPIs
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['drill-down-kpi', filtersKey],
    queryFn: () => analyticsApi.query({
      metrics: [
        'SUM(ps.quantity * ps.unit_price) as total_revenue',
        'COUNT(DISTINCT s.id) as total_sales',
        'AVG(ps.unit_price) as avg_ticket'
      ],
      dimensions: [],
      filters
    }),
    staleTime: 0,
    gcTime: 0
  });

  // Query para timeline
  const { data: timelineData } = useQuery({
    queryKey: ['drill-down-timeline', filtersKey],
    queryFn: () => analyticsApi.query({
      dimensions: ['DATE(s.sale_date)'],
      metrics: ['SUM(ps.quantity * ps.unit_price)'],
      filters,
      order_by: [{ field: 'DATE(s.sale_date)', direction: 'asc' }]
    }),
    staleTime: 0,
    gcTime: 0
  });

  const totalRevenue = kpiData?.[0]?.total_revenue || 0;
  const totalSales = kpiData?.[0]?.total_sales || 0;
  const avgTicket = kpiData?.[0]?.avg_ticket || 0;

  return (
    <div style={{ padding: '16px' }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Faturamento Total"
              value={totalRevenue}
              precision={2}
              prefix="R$"
              loading={kpiLoading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total de Vendas"
              value={totalSales}
              loading={kpiLoading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Ticket Médio"
              value={avgTicket}
              precision={2}
              prefix="R$"
              loading={kpiLoading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Timeline de Vendas">
            <TimelineChart data={timelineData} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
```

### Backend - analytics_service.py (Trechos Relevantes)
```python
class AnalyticsService:
    DIMENSIONS_MAP = {
        'canal_venda': ('ch.name', 'channel'),
        'nome_loja': ('st.name', 'store'),
        'nome_produto': ('p.name', 'product'),
        'bairro': ('st.neighborhood', 'store'),
        'DATE(s.sale_date)': ('DATE(s.sale_date)', None),
    }
    
    async def query(self, query_data: AnalyticsQueryRequest):
        filters = query_data.filters or {}
        where_clauses = []
        where_params = []
        required_joins = set()
        
        # Processar filtros
        for field, values in filters.items():
            if not values:
                continue
                
            if field in self.DIMENSIONS_MAP:
                field_expr, join_hint = self.DIMENSIONS_MAP[field]
                if join_hint:
                    required_joins.add(join_hint)
                placeholders = ', '.join(['%s'] * len(values))
                where_clauses.append(f"{field_expr} IN ({placeholders})")
                where_params.extend(values)
        
        # Construir query
        query = "SELECT ..."
        query += " FROM sales s"
        
        # Adicionar JOINs baseado em filtros
        if 'channel' in required_joins:
            query += " LEFT JOIN channels ch ON s.channel_id = ch.id"
        if 'store' in required_joins:
            query += " LEFT JOIN stores st ON s.store_id = st.id"
        if 'product' in required_joins:
            query += " LEFT JOIN products p ON ps.product_id = p.id"
        
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        # Executar
        result = await self.db.fetch_all(query, tuple(where_params))
        return result
```

---

## 🎓 Lições Aprendidas

### 1. Arrays vs Strings em Filtros
- **Sempre** use arrays para filtros, mesmo com um valor
- Backend SQL usa `IN (...)` que espera lista
- Frontend deve enviar formato consistente

### 2. Mapeamento de Aliases
- Aliases (canal_venda) ≠ Colunas reais (ch.name)
- Backend precisa de mapa de tradução
- JOINs devem ser adicionados automaticamente

### 3. React Query Cache
- Objetos JavaScript: compara por referência
- Solução: serializar para string na queryKey
- Ou usar `staleTime: 0` para desabilitar cache

### 4. Race Conditions Ref vs Data
- Dados podem chegar antes do DOM estar pronto
- Implementar retry mechanism com setTimeout
- Verificar `offsetParent` para elementos visíveis

### 5. Ant Design Modal Lifecycle
- **destroyOnClose: false** (padrão) = elementos escondidos ficam no DOM
- **destroyOnClose: true** = desmonta completamente ao fechar
- Sempre usar `true` para gráficos/charts/mapas

---

## 📈 Impacto

### Antes
- Gráficos estáticos
- Sem detalhamento
- Cliques não faziam nada

### Depois
- ✅ Click em qualquer gráfico abre drill-down
- ✅ Análise detalhada do item
- ✅ KPIs específicos
- ✅ Timeline de vendas
- ✅ Funciona em múltiplas aberturas
- ✅ Performance otimizada

### Métricas
- **Bugs corrigidos:** 5 críticos
- **Commits:** 11
- **Linhas adicionadas:** ~800
- **Arquivos criados:** 3
- **Tempo total:** 1h 20min
- **Taxa de sucesso:** 100% ✅

---

## 🔗 Commits Relacionados

1. `e9aa56b` - feat: implementar drill-down em gráficos
2. `89be313` - fix: corrigir imports TypeScript
3. `3a848e3` - fix: remover monetaryMetrics não utilizado
4. `93c5103` - fix: remover useDashboardStore não utilizado
5. `b146795` - fix: corrigir formato de filtros (array vs string)
6. `ae53fd4` - fix: mapear filtros para colunas SQL corretas
7. `1fa4c4f` - fix: corrigir cache do React Query com serialização
8. `31967f8` - debug: adicionar logs detalhados nos gráficos
9. `1d51bbc` - fix: melhorar cleanup de gráficos ECharts
10. `fcc91ea` - fix: implementar retry para race condition ref vs data
11. `20a3060` - fix: adicionar destroyOnClose no modal drill-down

---

## 👤 Desenvolvedor

**Nome:** Vinicius Oliveira  
**Email:** vinicius.oliveiratwt@gmail.com  
**Data:** 03 de novembro de 2025  
**Duração:** ~1h 20min (11 commits)

> 💡 **Nota:** Documentação revisada e aprovada pelo desenvolvedor.

---

**Última Atualização:** 03/11/2025  
**Status:** ✅ Feature Completa e Estável

---

**Desenvolvido por Vinicius Oliveira** · vinicius.oliveiratwt@gmail.com
