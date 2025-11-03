# 📊 Feature #04: Visualizações ECharts

## 📋 Visão Geral

Sistema completo de visualizações interativas usando **Apache ECharts 5.5.1**, oferecendo 7+ tipos de gráficos responsivos, interativos e customizáveis para análise de dados de restaurantes. Todos os gráficos suportam drill-down, tooltips detalhados, zoom, e export de imagens.

---

## 🎯 Objetivo

Fornecer visualizações poderosas e intuitivas que transformem dados em insights acionáveis:
- **7+ tipos de gráficos** para diferentes análises
- **Interatividade completa** (hover, click, zoom)
- **Responsividade** (mobile-first design)
- **Performance** (rendering otimizado para grandes volumes)
- **Acessibilidade** (suporte a screen readers)

---

## ✨ Tipos de Gráficos Implementados

### 1. **Gráfico de Pizza (Pie Chart)**

**Uso:** Vendas por Canal, Distribuição por Categoria

```tsx
<SalesChannelChart filters={apiFilters} />
```

**Características:**
- Donut chart (radius: 40%-70%)
- Hover mostra porcentagem
- Click para drill-down
- Legendas laterais
- Cores customizadas

**Configuração ECharts:**
```typescript
{
  type: 'pie',
  radius: ['40%', '70%'],
  itemStyle: {
    borderRadius: 10,
    borderColor: '#fff',
    borderWidth: 2
  },
  emphasis: {
    label: {
      show: true,
      fontSize: 20,
      fontWeight: 'bold'
    }
  }
}
```

### 2. **Gráfico de Barras (Bar Chart)**

**Uso:** Top Produtos, Ranking de Lojas

```tsx
<TopProductsChart filters={apiFilters} />
```

**Características:**
- Barras horizontais ou verticais
- Cores graduadas
- Valores nas barras
- Ordenação dinâmica
- Limite configurável (top 10/20/50)

**Configuração ECharts:**
```typescript
{
  type: 'bar',
  data: topProducts.map(p => p.revenue),
  itemStyle: {
    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: '#83bff6' },
      { offset: 1, color: '#188df0' }
    ])
  },
  label: {
    show: true,
    position: 'right',
    formatter: 'R$ {c}'
  }
}
```

### 3. **Gráfico de Linha Temporal (Line Chart)**

**Uso:** Faturamento ao Longo do Tempo, Tendências

```tsx
<TimeSeriesChart filters={apiFilters} />
```

**Características:**
- Múltiplas séries (comparação)
- Área preenchida (area chart)
- Zoom e pan
- Data zoom (slider)
- Marcadores em pontos

**Configuração ECharts:**
```typescript
{
  type: 'line',
  smooth: true,
  areaStyle: {
    opacity: 0.3
  },
  emphasis: {
    focus: 'series'
  },
  dataZoom: [
    { type: 'inside', start: 0, end: 100 },
    { type: 'slider', start: 0, end: 100 }
  ]
}
```

### 4. **Heatmap (Mapa de Calor)**

**Uso:** Análise de Horários, Padrões Temporais

```tsx
<HourlyHeatmap filters={apiFilters} />
```

**Características:**
- Matriz hora x dia da semana
- Cores graduadas (verde → vermelho)
- Tooltip com valores
- Identificação de picos
- Visual calendar-like

**Configuração ECharts:**
```typescript
{
  type: 'heatmap',
  data: heatmapData, // [[dayIndex, hour, value], ...]
  label: {
    show: true
  },
  itemStyle: {
    borderColor: '#fff',
    borderWidth: 1
  },
  visualMap: {
    min: 0,
    max: maxValue,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: '0%',
    inRange: {
      color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', 
              '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
    }
  }
}
```

### 5. **Scatter Plot (Gráfico de Dispersão)**

**Uso:** Análise RFM, Correlações

```tsx
<RFMScatterChart data={rfmSegments} />
```

**Características:**
- Eixos X/Y customizáveis
- Tamanho de bolha (3ª dimensão)
- Cores por categoria
- Tooltip detalhado
- Zoom e seleção

### 6. **Gráfico de Métricas de Entrega**

**Uso:** Performance Operacional, Tempos

```tsx
<DeliveryMetricsChart filters={apiFilters} />
```

**Características:**
- Barras agrupadas (grouped bar)
- Comparação múltiplas métricas
- Cores por métrica
- Legendas interativas

### 7. **Gráficos Combinados**

**Uso:** Faturamento + Quantidade (dois eixos Y)

```typescript
series: [
  { type: 'bar', yAxisIndex: 0, data: revenues },
  { type: 'line', yAxisIndex: 1, data: quantities }
]
```

---

## 🏗️ Arquitetura

### Componente Base de Gráfico

```tsx
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';

interface ChartProps {
  filters?: Record<string, any>;
}

export const BaseChart = ({ filters = {} }: ChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['chart-data', filters],
    queryFn: () => analyticsAPI.query({
      metrics: ['faturamento'],
      dimensions: ['data'],
      filters: filters,
    }),
    refetchInterval: 60000, // 1 minuto
  });

  useEffect(() => {
    if (!chartRef.current) return;

    // Inicializa chart (apenas uma vez)
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (data?.data) {
      // Configura opções
      const option: echarts.EChartsOption = {
        title: { text: 'Título do Gráfico' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: data.data.map(d => d.data) },
        yAxis: { type: 'value' },
        series: [{
          type: 'line',
          data: data.data.map(d => d.faturamento)
        }]
      };

      chartInstance.current.setOption(option);
    }

    // Resize responsivo
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  if (isLoading) return <div className="loading">Carregando...</div>;
  if (error) return <div className="error">Erro ao carregar gráfico</div>;

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
};
```

### Hook Customizado para Temas

```typescript
// hooks/useEChartsTheme.ts
import { useTheme } from './useTheme';

export const getEChartsTheme = (theme: 'light' | 'dark') => {
  const isDark = theme === 'dark';
  
  return {
    backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
    textStyle: {
      color: isDark ? '#ffffff' : '#333333'
    },
    title: {
      textStyle: {
        color: isDark ? '#ffffff' : '#333333'
      }
    },
    legend: {
      textStyle: {
        color: isDark ? '#ffffff' : '#333333'
      }
    },
    grid: {
      borderColor: isDark ? '#444444' : '#e0e0e0'
    }
  };
};
```

### Sistema de Cores

```typescript
// styles/chartColors.ts
export const CHART_COLORS = {
  primary: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'],
  gradient: {
    blue: ['#83bff6', '#188df0'],
    green: ['#91cc75', '#3ba272'],
    red: ['#ee6666', '#d73027']
  },
  heatmap: [
    '#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8',
    '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'
  ]
};
```

---

## 🎨 Customização e Temas

### Dark Mode Support

```typescript
const { theme } = useTheme();
const baseTheme = getEChartsTheme(theme);

const option: echarts.EChartsOption = {
  ...baseTheme,
  // ... resto da configuração
};
```

### Tooltips Customizados

```typescript
tooltip: {
  trigger: 'item',
  formatter: (params: any) => {
    return `
      <div class="custom-tooltip">
        <strong>${params.name}</strong><br/>
        <span class="value">R$ ${params.value.toLocaleString('pt-BR')}</span><br/>
        <span class="percent">${params.percent}%</span>
      </div>
    `;
  },
  backgroundColor: 'rgba(50, 50, 50, 0.95)',
  borderColor: '#777',
  borderWidth: 1,
  textStyle: {
    color: '#fff'
  }
}
```

### Animações

```typescript
animation: true,
animationDuration: 1000,
animationEasing: 'cubicOut',
animationDelay: (idx: number) => idx * 100 // Stagger effect
```

---

## 📱 Responsividade

### Grid Responsivo

```typescript
grid: {
  left: window.innerWidth < 768 ? '10%' : '5%',
  right: window.innerWidth < 768 ? '10%' : '5%',
  top: '15%',
  bottom: '15%',
  containLabel: true
}
```

### Resize Handler

```typescript
useEffect(() => {
  const handleResize = () => {
    chartInstance.current?.resize({
      width: chartRef.current?.clientWidth,
      height: 400
    });
  };
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Media Queries CSS

```css
.chart-container {
  width: 100%;
  height: 400px;
}

@media (max-width: 768px) {
  .chart-container {
    height: 300px;
  }
  
  .echarts-legend {
    font-size: 10px !important;
  }
}
```

---

## 🎯 Interatividade

### 1. Drill-Down ao Clicar

```typescript
chartInstance.current.on('click', (params: any) => {
  if (params.componentType === 'series') {
    setDrillDownContext({
      type: 'channel',
      value: params.name,
      label: params.name,
      filters: filters
    });
    setModalVisible(true);
  }
});
```

### 2. Highlight ao Hover

```typescript
emphasis: {
  focus: 'series',
  blurScope: 'coordinateSystem',
  itemStyle: {
    shadowBlur: 10,
    shadowOffsetX: 0,
    shadowColor: 'rgba(0, 0, 0, 0.5)'
  }
}
```

### 3. Zoom e Pan

```typescript
dataZoom: [
  {
    type: 'inside',
    start: 0,
    end: 100,
    zoomOnMouseWheel: true,
    moveOnMouseMove: true
  },
  {
    type: 'slider',
    start: 0,
    end: 100,
    height: 20,
    bottom: 10
  }
]
```

### 4. Seleção de Legendas

```typescript
legend: {
  data: ['Série 1', 'Série 2'],
  selected: {
    'Série 1': true,
    'Série 2': true
  },
  selectedMode: 'multiple' // ou 'single'
}
```

---

## ⚡ Performance

### 1. Lazy Loading de Gráficos

```typescript
const ChartComponent = lazy(() => import('./SalesChannelChart'));

<Suspense fallback={<ChartSkeleton />}>
  <ChartComponent filters={filters} />
</Suspense>
```

### 2. Memoização de Opções

```typescript
const chartOptions = useMemo(() => ({
  title: { text: 'Vendas por Canal' },
  series: [{
    type: 'pie',
    data: processedData
  }]
}), [processedData]);
```

### 3. Throttle de Resize

```typescript
import { throttle } from 'lodash';

const handleResize = throttle(() => {
  chartInstance.current?.resize();
}, 300);
```

### 4. Dispose Correto

```typescript
useEffect(() => {
  return () => {
    chartInstance.current?.dispose();
    chartInstance.current = null;
  };
}, []);
```

### 5. Otimização de Dados

```typescript
// Limitar número de pontos
const MAX_POINTS = 1000;
const sampledData = data.length > MAX_POINTS 
  ? sampleData(data, MAX_POINTS)
  : data;
```

---

## 📊 Tipos de Análises Suportadas

### 1. Análise Temporal
- **Line Chart**: Tendências ao longo do tempo
- **Area Chart**: Faturamento acumulado
- **Heatmap**: Padrões por hora/dia

### 2. Análise Dimensional
- **Pie Chart**: Distribuição por categoria
- **Bar Chart**: Ranking e comparação
- **Treemap**: Hierarquia de dados

### 3. Análise de Correlação
- **Scatter Plot**: RFM, correlações
- **Bubble Chart**: 3 dimensões simultâneas

### 4. Análise Geográfica
- **Map Chart**: Vendas por região
- **Geo Heatmap**: Densidade de entregas

---

## 🔄 Integração com Backend

### Query para Gráficos

```typescript
const { data } = useQuery({
  queryKey: ['chart-sales-channel', filters],
  queryFn: () => analyticsAPI.query({
    metrics: ['faturamento', 'qtd_vendas'],
    dimensions: ['canal_venda'],
    filters: {
      ...filters,
      date_range: { start_date: startDate, end_date: endDate }
    },
    order_by: [{ field: 'faturamento', direction: 'desc' }],
    limit: 10
  }),
  refetchInterval: 60000,
  staleTime: 30000,
});
```

### Transformação de Dados

```typescript
const processChartData = (rawData: any[]) => {
  return {
    categories: rawData.map(d => d.canal_venda),
    values: rawData.map(d => parseFloat(d.faturamento)),
    counts: rawData.map(d => parseInt(d.qtd_vendas))
  };
};
```

---

## 📁 Estrutura de Arquivos

```
frontend/src/components/Charts/
├── index.ts                           # Exports
├── BaseChart.tsx                      # Componente base
├── SalesChannelChart.tsx              # Pie chart
├── TopProductsChart.tsx               # Bar chart
├── TimeSeriesChart.tsx                # Line chart
├── HourlyHeatmap.tsx                  # Heatmap
├── DeliveryMetricsChart.tsx           # Grouped bar
├── RFMScatterChart.tsx                # Scatter plot
└── styles/
    ├── charts.css                     # Estilos gerais
    └── chartThemes.ts                 # Temas ECharts
```

---

## 🧪 Testes

```typescript
describe('SalesChannelChart', () => {
  it('should render chart with data', async () => {
    const mockData = {
      data: [
        { canal_venda: 'iFood', faturamento: 125000, qtd_vendas: 1200 },
        { canal_venda: 'Presencial', faturamento: 98000, qtd_vendas: 950 }
      ]
    };
    
    render(<SalesChannelChart />);
    
    await waitFor(() => {
      expect(screen.getByText('Vendas por Canal')).toBeInTheDocument();
    });
  });
  
  it('should handle drill-down click', async () => {
    render(<SalesChannelChart />);
    
    const chart = screen.getByRole('img', { name: /chart/i });
    fireEvent.click(chart);
    
    await waitFor(() => {
      expect(screen.getByText('Drill-Down')).toBeInTheDocument();
    });
  });
});
```

---

## 🐛 Troubleshooting

### Problema: Gráfico Não Renderiza

**Solução:**
```typescript
// Adicionar retry mechanism
useEffect(() => {
  if (!chartRef.current) {
    setTimeout(() => {
      if (chartRef.current && !chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }
    }, 50);
    return;
  }
}, []);
```

### Problema: Memory Leak

**Solução:**
```typescript
useEffect(() => {
  return () => {
    chartInstance.current?.dispose();
    chartInstance.current = null;
  };
}, []);
```

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
