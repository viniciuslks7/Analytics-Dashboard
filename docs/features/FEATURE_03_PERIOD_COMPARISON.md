# 📊 Feature #03: Comparação de Períodos

## 📋 Visão Geral

Sistema de comparação temporal que permite analisar métricas entre diferentes períodos (atual vs anterior), identificando tendências, crescimento e anomalias. Calcula automaticamente variação percentual e exibe indicadores visuais de performance.

---

## 🎯 Objetivo

Facilitar análise temporal e identificação de tendências através de:
- Comparação automática período atual vs anterior
- Cálculo de variação percentual
- Indicadores visuais de tendência (↑/↓)
- Alertas de anomalias significativas
- Contextualização de performance

---

## ✨ Funcionalidades

### 1. **Comparação Automática**

Sistema calcula automaticamente o período anterior baseado no período atual selecionado:

```typescript
const calculatePreviousPeriod = (startDate: Date, endDate: Date) => {
  const days = differenceInDays(endDate, startDate);
  
  return {
    start: subDays(startDate, days + 1),
    end: subDays(endDate, days + 1),
  };
};
```

**Exemplos:**
- Atual: 01/05 → 31/05 (31 dias)
- Anterior: 01/04 → 30/04 (31 dias)

- Atual: 01/01 → 07/01 (7 dias - semana)
- Anterior: 25/12 → 31/12 (7 dias - semana anterior)

### 2. **Métricas Comparadas**

```typescript
interface PeriodComparison {
  metric: string;                  // Nome da métrica
  current: number;                 // Valor período atual
  previous: number;                // Valor período anterior
  change: number;                  // Diferença absoluta
  change_percentage: number;       // Variação %
  trend: 'up' | 'down' | 'stable'; // Tendência
}
```

**Métricas Suportadas:**
- 💰 Faturamento
- 🛒 Quantidade de Vendas
- 📊 Ticket Médio
- ❌ Taxa de Cancelamento
- ⏱️ Tempo de Entrega
- 👥 Clientes Únicos

### 3. **Indicadores Visuais de Tendência**

```tsx
<TrendIndicator 
  trend="up" 
  percentage={12.5}
  size="large"
/>
```

**Renderização:**
- ✅ **Crescimento**: 🟢 ↑ +12.5% (verde)
- ❌ **Queda**: 🔴 ↓ -8.3% (vermelho)
- ➖ **Estável**: 🟡 → ±0.5% (amarelo)

### 4. **Threshold de Estabilidade**

```typescript
const calculateTrend = (changePercentage: number): Trend => {
  const threshold = 0.5; // 0.5% = estável
  
  if (Math.abs(changePercentage) <= threshold) {
    return 'stable';
  }
  
  return changePercentage > 0 ? 'up' : 'down';
};
```

**Lógica:**
- Variação < 0.5%: Considerado estável
- Variação > 0.5%: Tendência significativa

### 5. **Cards de Comparação**

```tsx
<ComparisonCard
  comparison={{
    metric: 'Faturamento',
    current: 145320.50,
    previous: 129450.00,
    change: 15870.50,
    change_percentage: 12.26,
    trend: 'up',
  }}
  format="currency"
/>
```

**Renderização:**

```
┌─────────────────────────────────┐
│ 💰 Faturamento                  │
│                                 │
│ Atual:     R$ 145.320,50       │
│ Anterior:  R$ 129.450,00       │
│                                 │
│ 🟢 ↑ +12.26% (+R$ 15.870,50)   │
└─────────────────────────────────┘
```

### 6. **Comparação em Linha Temporal**

Gráfico mostrando ambos os períodos sobrepostos:

```tsx
<TimeSeriesChart
  data={[
    { date: '01/05', current: 5200, previous: 4800 },
    { date: '02/05', current: 5450, previous: 4950 },
    { date: '03/05', current: 5380, previous: 5100 },
  ]}
  series={[
    { name: 'Período Atual', color: '#1890ff' },
    { name: 'Período Anterior', color: '#8c8c8c' },
  ]}
/>
```

---

## 🏗️ Arquitetura

### Frontend (`PeriodComparison.tsx`)

```tsx
export const PeriodComparison = ({ 
  showCards = true,
  showChart = false,
}: PeriodComparisonProps) => {
  const { startDate, endDate } = useFilters();
  
  // Calcula período anterior automaticamente
  const { start: prevStart, end: prevEnd } = useMemo(() => 
    calculatePreviousPeriod(startDate, endDate),
    [startDate, endDate]
  );
  
  // Fetch dados do período atual
  const { data: currentData } = useQuery({
    queryKey: ['kpis', startDate, endDate],
    queryFn: () => analyticsAPI.getKPIs({ startDate, endDate }),
  });
  
  // Fetch dados do período anterior
  const { data: previousData } = useQuery({
    queryKey: ['kpis', prevStart, prevEnd],
    queryFn: () => analyticsAPI.getKPIs({ 
      startDate: prevStart, 
      endDate: prevEnd 
    }),
  });
  
  // Calcula comparações
  const comparisons = useMemo(() => 
    calculateComparisons(currentData, previousData),
    [currentData, previousData]
  );
  
  return (
    <section className="period-comparison">
      <div className="comparison-header">
        <h3>Comparação de Períodos</h3>
        <div className="period-labels">
          <span className="current-period">
            {formatPeriod(startDate, endDate)}
          </span>
          <span className="vs">vs</span>
          <span className="previous-period">
            {formatPeriod(prevStart, prevEnd)}
          </span>
        </div>
      </div>
      
      {showCards && (
        <div className="comparison-grid">
          {comparisons.map((comp, idx) => (
            <ComparisonCard 
              key={idx} 
              comparison={comp}
              format={getFormatForMetric(comp.metric)}
            />
          ))}
        </div>
      )}
      
      {showChart && (
        <TimeSeriesComparisonChart
          currentPeriod={{ start: startDate, end: endDate }}
          previousPeriod={{ start: prevStart, end: prevEnd }}
        />
      )}
    </section>
  );
};
```

### Backend (`analytics.py`)

```python
@router.get("/compare", response_model=PeriodComparisonResponse)
async def compare_periods(
    current_start: date,
    current_end: date,
    previous_start: date,
    previous_end: date,
    store_id: Optional[List[int]] = Query(None),
    channel_id: Optional[List[int]] = Query(None),
):
    """
    Compara métricas entre dois períodos
    
    Returns:
        Comparações com variação absoluta e percentual
    """
    # Fetch período atual
    current_filters = {
        'date_range': {'start_date': current_start, 'end_date': current_end},
        'store_id': store_id,
        'channel_id': channel_id,
    }
    current_kpis = await analytics_service.calculate_kpis(current_filters)
    
    # Fetch período anterior
    previous_filters = {
        'date_range': {'start_date': previous_start, 'end_date': previous_end},
        'store_id': store_id,
        'channel_id': channel_id,
    }
    previous_kpis = await analytics_service.calculate_kpis(previous_filters)
    
    # Calcula comparações
    comparisons = _calculate_comparisons(current_kpis, previous_kpis)
    
    return PeriodComparisonResponse(
        current_period={'start': current_start, 'end': current_end},
        previous_period={'start': previous_start, 'end': previous_end},
        comparisons=comparisons,
    )


def _calculate_comparisons(current: dict, previous: dict) -> List[PeriodComparison]:
    """Calcula variações entre períodos"""
    comparisons = []
    
    for metric_name in current.keys():
        current_value = current[metric_name]
        previous_value = previous[metric_name]
        
        # Calcula diferença absoluta
        change = current_value - previous_value
        
        # Calcula variação percentual
        if previous_value != 0:
            change_percentage = (change / previous_value) * 100
        else:
            change_percentage = 100 if current_value > 0 else 0
        
        # Determina tendência
        trend = _determine_trend(change_percentage)
        
        comparisons.append(PeriodComparison(
            metric=metric_name,
            current=current_value,
            previous=previous_value,
            change=change,
            change_percentage=round(change_percentage, 2),
            trend=trend,
        ))
    
    return comparisons


def _determine_trend(change_percentage: float) -> str:
    """Determina tendência baseado em threshold"""
    STABLE_THRESHOLD = 0.5  # ±0.5% = estável
    
    if abs(change_percentage) <= STABLE_THRESHOLD:
        return 'stable'
    
    return 'up' if change_percentage > 0 else 'down'
```

---

## 📊 Cálculos e Fórmulas

### 1. **Variação Absoluta**

```
Variação Absoluta = Valor Atual - Valor Anterior
```

**Exemplo:**
```
Atual:    R$ 145.320,50
Anterior: R$ 129.450,00
Variação: R$ 15.870,50
```

### 2. **Variação Percentual**

```
Variação % = (Valor Atual - Valor Anterior) / Valor Anterior × 100
```

**Exemplo:**
```
Atual:    R$ 145.320,50
Anterior: R$ 129.450,00
Variação: (145320.50 - 129450.00) / 129450.00 × 100 = 12.26%
```

### 3. **Tratamento de Divisão por Zero**

```typescript
const calculateChangePercentage = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0; // 100% se cresceu do zero
  }
  
  return ((current - previous) / previous) * 100;
};
```

### 4. **Cálculo de Período Anterior**

```typescript
// Para período de N dias
const days = differenceInDays(endDate, startDate);

previousStart = subDays(startDate, days + 1);
previousEnd = subDays(endDate, days + 1);
```

**Exemplo:**
```
Atual: 01/05 → 31/05 (31 dias)

Cálculo:
- days = 31 - 1 + 1 = 31
- previousStart = 01/05 - 32 = 30/03
- previousEnd = 31/05 - 32 = 29/04

Anterior: 30/03 → 29/04 (31 dias)
```

---

## 🎨 Interface do Usuário

### Layout Completo

```
┌──────────────────────────────────────────────┐
│  📊 Comparação de Períodos                   │
│  01/05 - 31/05  vs  01/04 - 30/04           │
├──────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐           │
│  │ 💰 Faturamento │ 🛒 Vendas    │           │
│  │ R$ 145.320   │ 1.234 vendas │           │
│  │ R$ 129.450   │ 1.156 vendas │           │
│  │ 🟢 ↑ +12.26% │ 🟢 ↑ +6.75%  │           │
│  └─────────────┘ └─────────────┘           │
│                                              │
│  ┌─────────────┐ ┌─────────────┐           │
│  │ 📊 Ticket    │ ❌ Cancelam. │           │
│  │ R$ 117,80    │ 3.2%         │           │
│  │ R$ 112,00    │ 4.1%         │           │
│  │ 🟢 ↑ +5.18%  │ 🟢 ↓ -21.95% │           │
│  └─────────────┘ └─────────────┘           │
├──────────────────────────────────────────────┤
│  📈 Gráfico de Linha Temporal               │
│  (Ambos períodos sobrepostos)               │
└──────────────────────────────────────────────┘
```

### Cores e Estilos

```css
.trend-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.trend-up {
  color: #52c41a; /* Verde */
}

.trend-down {
  color: #ff4d4f; /* Vermelho */
}

.trend-stable {
  color: #faad14; /* Amarelo */
}

.comparison-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.comparison-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

---

## ⚡ Performance

### 1. **Queries Paralelas**

```typescript
// Busca períodos em paralelo, não sequencial
const [currentData, previousData] = await Promise.all([
  analyticsAPI.getKPIs({ startDate, endDate }),
  analyticsAPI.getKPIs({ startDate: prevStart, endDate: prevEnd }),
]);
```

**Benefício:**
- 2x mais rápido que sequencial
- Melhor UX (loading único)

### 2. **Cache Inteligente**

```typescript
// React Query cacheia ambos períodos
const { data: currentData } = useQuery({
  queryKey: ['kpis', startDate, endDate],
  queryFn: () => analyticsAPI.getKPIs({ startDate, endDate }),
  staleTime: 5 * 60 * 1000, // 5 minutos
});
```

**Estratégia:**
- Cache por período (chave única)
- Reutiliza dados se período não mudou
- TTL de 5 minutos

### 3. **Memoização de Cálculos**

```typescript
const comparisons = useMemo(() => 
  calculateComparisons(currentData, previousData),
  [currentData, previousData]
);
```

**Vantagem:**
- Recalcula apenas quando dados mudam
- Evita re-renders desnecessários

---

## 🔄 Integração com Outras Features

### Feature #01: Dashboard Analytics
- Comparações exibidas no dashboard principal
- KPIs mostram tendência automaticamente

### Feature #05: Filtros Globais
- Comparações respeitam filtros ativos
- Ambos períodos aplicam mesmo filtro

### Feature #06: Export
- Comparações exportáveis em CSV/PDF
- Tabela com variação % incluída

### Feature #11: Sistema de Alertas
- Alertas baseados em variação %
- Notificações para mudanças significativas

---

## 📁 Estrutura de Arquivos

```
frontend/
├── src/
│   ├── components/
│   │   └── PeriodComparison/
│   │       ├── PeriodComparison.tsx       # Componente principal
│   │       ├── ComparisonCard.tsx         # Card individual
│   │       ├── TrendIndicator.tsx         # Indicador ↑/↓
│   │       ├── TimeSeriesComparison.tsx   # Gráfico temporal
│   │       └── styles.css                 # Estilos
│   └── utils/
│       └── dateUtils.ts                   # Funções de data

backend/
├── app/
│   ├── api/
│   │   └── analytics.py                   # Rota /compare
│   ├── services/
│   │   └── analytics_service.py           # Lógica de comparação
│   └── models/
│       └── schemas.py                     # PeriodComparisonResponse
```

---

## 🧪 Testes

### Unit Tests

```typescript
describe('PeriodComparison', () => {
  it('should calculate previous period correctly', () => {
    const current = {
      start: new Date('2024-05-01'),
      end: new Date('2024-05-31'),
    };
    
    const previous = calculatePreviousPeriod(current.start, current.end);
    
    expect(previous.start).toEqual(new Date('2024-03-31'));
    expect(previous.end).toEqual(new Date('2024-04-30'));
  });
  
  it('should calculate change percentage', () => {
    const change = calculateChangePercentage(145320, 129450);
    
    expect(change).toBeCloseTo(12.26, 2);
  });
  
  it('should determine trend correctly', () => {
    expect(determineTrend(12.26)).toBe('up');
    expect(determineTrend(-8.50)).toBe('down');
    expect(determineTrend(0.3)).toBe('stable');
  });
});
```

### Integration Tests

```python
@pytest.mark.asyncio
async def test_compare_periods():
    """Testa comparação de períodos"""
    response = await client.get("/api/v1/analytics/compare", params={
        'current_start': '2024-05-01',
        'current_end': '2024-05-31',
        'previous_start': '2024-04-01',
        'previous_end': '2024-04-30',
    })
    
    assert response.status_code == 200
    data = response.json()
    
    assert 'comparisons' in data
    assert len(data['comparisons']) > 0
    
    for comp in data['comparisons']:
        assert 'metric' in comp
        assert 'current' in comp
        assert 'previous' in comp
        assert 'change_percentage' in comp
        assert 'trend' in comp
```

---

## 🐛 Troubleshooting

### Problema: Período Anterior Incorreto

**Sintomas:**
- Datas erradas calculadas
- Comparação com período diferente do esperado

**Diagnóstico:**
```typescript
console.log('Current:', { startDate, endDate });
console.log('Previous:', calculatePreviousPeriod(startDate, endDate));
```

**Solução:**
- Verificar lógica de `subDays()`
- Considerar meses com dias diferentes
- Testar edge cases (fim de mês, ano bissexto)

### Problema: Divisão por Zero

**Sintomas:**
- `Infinity` ou `NaN` em variação %
- Card mostra valores inválidos

**Solução:**
```typescript
const calculateChangePercentage = (current: number, previous: number): number => {
  if (previous === 0) {
    if (current === 0) return 0;
    return current > 0 ? 100 : -100;
  }
  
  return ((current - previous) / previous) * 100;
};
```

---

## 📚 Referências

### Inspirações
- **Google Analytics**: Comparação de períodos
- **Amplitude**: Trend indicators
- **Mixpanel**: Period-over-period analysis

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
