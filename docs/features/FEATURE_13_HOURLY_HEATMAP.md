# 🔥 Feature #13: Heatmap de Horários

## 📋 Visão Geral

Visualização em mapa de calor que mostra padrões de vendas por **hora do dia** × **dia da semana**. Identifica picos de demanda, horários de baixo movimento e padrões temporais para otimizar operações.

---

## 🎯 Objetivo

Responder perguntas operacionais:
- Quais horários têm mais vendas?
- Que dias da semana são mais movimentados?
- Quando escalar equipe?
- Quando fazer promoções?

---

## ✨ Funcionalidades

### 1. **Visualização Heatmap**

```tsx
<HourlyHeatmap filters={apiFilters} />
```

**Layout:**
- **Eixo X**: Horas (0-23)
- **Eixo Y**: Dias da semana (Seg-Dom)
- **Cores**: Verde (alto) → Amarelo → Vermelho (baixo)
- **Tooltip**: Valores exatos ao passar mouse

### 2. **Query Agregada**

```typescript
const { data } = useQuery({
  queryKey: ['hourly-heatmap', filters],
  queryFn: () => analyticsAPI.query({
    metrics: ['faturamento', 'qtd_vendas'],
    dimensions: ['hora', 'dia_semana'],
    filters: filters,
  })
});
```

### 3. **Identificação de Picos**

```typescript
const findPeakHours = (heatmapData: any[]) => {
  return heatmapData
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 horários
};
```

---

## 🏗️ Implementação

```tsx
export const HourlyHeatmap = ({ filters = {} }: HeatmapProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  
  const { data } = useQuery({
    queryKey: ['heatmap-hourly', filters],
    queryFn: () => analyticsAPI.query({
      metrics: ['faturamento'],
      dimensions: ['hora', 'dia_semana'],
      filters: filters,
    })
  });
  
  useEffect(() => {
    if (!chartRef.current || !data?.data) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    
    // Preparar dados para heatmap
    const heatmapData = data.data.map((row: any) => [
      parseInt(row.dia_semana), // 0 = Dom, 6 = Sáb
      parseInt(row.hora),       // 0-23
      parseFloat(row.faturamento)
    ]);
    
    const maxValue = Math.max(...heatmapData.map(d => d[2]));
    
    const option: echarts.EChartsOption = {
      title: {
        text: 'Heatmap de Vendas por Horário',
        left: 'center'
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const [dayIndex, hour, value] = params.data;
          const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayIndex];
          return `
            <strong>${dayName} às ${hour}h</strong><br/>
            Faturamento: R$ ${value.toLocaleString('pt-BR')}
          `;
        }
      },
      grid: {
        height: '70%',
        top: '15%'
      },
      xAxis: {
        type: 'category',
        data: Array.from({ length: 24 }, (_, i) => `${i}h`),
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        splitArea: { show: true }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: {
          color: [
            '#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8',
            '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'
          ]
        }
      },
      series: [{
        name: 'Faturamento',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
    
    chartInstance.current.setOption(option);
  }, [data]);
  
  return <div ref={chartRef} style={{ width: '100%', height: '500px' }} />;
};
```

---

## 📊 Backend Query

```python
@router.post("/query")
async def get_hourly_heatmap(filters: dict):
    """Query agregada por hora e dia da semana"""
    
    query = """
        SELECT 
            EXTRACT(HOUR FROM created_at) as hora,
            EXTRACT(DOW FROM created_at) as dia_semana,
            SUM(total_amount) as faturamento,
            COUNT(id) as qtd_vendas
        FROM sales
        WHERE sale_status_desc = 'COMPLETED'
          {date_filter}
          {store_filter}
        GROUP BY hora, dia_semana
        ORDER BY dia_semana, hora
    """
    
    results = await db.execute_query(query)
    return {"data": results}
```

---

## 🎨 Customização de Cores

```typescript
// Escala de cores personalizada
const colorScale = [
  '#313695',  // Azul escuro (baixo)
  '#4575b4',
  '#74add1',
  '#abd9e9',
  '#e0f3f8',
  '#ffffbf',  // Amarelo (médio)
  '#fee090',
  '#fdae61',
  '#f46d43',
  '#d73027',
  '#a50026'   // Vermelho escuro (alto)
];
```

---

## 💡 Insights Automáticos

```typescript
const analyzeHeatmap = (data: any[]) => {
  // Horário de pico
  const peakHour = data.reduce((max, curr) => 
    curr.value > max.value ? curr : max
  );
  
  // Horário de baixa
  const lowHour = data.reduce((min, curr) => 
    curr.value < min.value ? curr : min
  );
  
  // Dias mais movimentados
  const busyDays = calculateBusyDays(data);
  
  return {
    peakHour: `${peakHour.day} às ${peakHour.hour}h`,
    lowHour: `${lowHour.day} às ${lowHour.hour}h`,
    busyDays: busyDays
  };
};
```

---

## 📈 Casos de Uso

### 1. Escalação de Equipe
Identificar horários que precisam de mais atendentes

### 2. Promoções
Criar promoções em horários de baixo movimento

### 3. Gestão de Estoque
Preparar estoque para horários de pico

### 4. Otimização de Delivery
Alocar entregadores conforme demanda

---

## 🔄 Integração

- Feature #01: KPI de horário de pico
- Feature #04: Usa ECharts heatmap
- Feature #05: Aplica filtros globais

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
