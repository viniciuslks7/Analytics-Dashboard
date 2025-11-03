# 📊 Feature #07: Análise de Churn e RFM

## 📋 Visão Geral

Sistema avançado de análise de churn (perda de clientes) e segmentação RFM (Recency, Frequency, Monetary) para identificar clientes em risco, segmentar por valor e comportamento, e otimizar estratégias de retenção.

---

## 🎯 Objetivo

Responder perguntas críticas de negócio:
- Quais clientes estão em risco de churn?
- Quem são os melhores clientes (RFM)?
- Qual a taxa de retenção?
- Como evoluiu o churn ao longo do tempo?

---

## ✨ Funcionalidades

### 1. **Segmentação RFM**

```
R (Recency):   Há quanto tempo comprou pela última vez?
F (Frequency): Quantas vezes comprou?
M (Monetary):  Quanto gastou no total?
```

**Segmentos Identificados:**
- 🏆 **Champions**: R=5, F=5, M=5 → Melhores clientes
- 💎 **Loyal**: F=4-5, M=4-5 → Clientes fiéis
- 🌟 **Potential**: R=4-5, F=1-2 → Novos promissores
- ⚠️ **At Risk**: R=1-2, F=4-5 → Em risco de churn
- 😴 **Hibernating**: R=1, F=1 → Inativos

### 2. **Clientes em Risco**

API Endpoint: `GET /api/v1/analytics/churn/at-risk`

```json
{
  "data": [
    {
      "customer_id": 1234,
      "customer_name": "Maria Silva",
      "last_purchase_days": 45,
      "total_purchases": 12,
      "total_spent": 2340.50,
      "risk_score": 0.85,
      "segment": "At Risk"
    }
  ]
}
```

### 3. **Métricas de Churn**

```typescript
{
  total_customers: 1000,
  churned_customers: 120,
  churn_rate: 12.0,          // % de churn
  retention_rate: 88.0,       // % de retenção
  avg_lifetime_value: 1250.00
}
```

### 4. **Gráfico Scatter RFM**

```tsx
<RFMScatterChart data={rfmSegments} />
```

Eixos:
- X: Recency (dias desde última compra)
- Y: Frequency (número de compras)
- Tamanho: Monetary (valor total gasto)
- Cor: Segmento RFM

---

## 🏗️ Backend API

### Cálculo RFM

```python
@router.get("/churn/rfm-segments")
async def get_rfm_segments(filters: dict):
    """Segmenta clientes por RFM"""
    
    query = """
        WITH customer_rfm AS (
            SELECT 
                customer_id,
                customer_name,
                -- Recency: dias desde última compra
                CURRENT_DATE - MAX(DATE(created_at)) as recency_days,
                -- Frequency: número de compras
                COUNT(DISTINCT id) as frequency,
                -- Monetary: valor total gasto
                SUM(total_amount) as monetary
            FROM sales
            WHERE sale_status_desc = 'COMPLETED'
            GROUP BY customer_id, customer_name
        ),
        rfm_scores AS (
            SELECT 
                *,
                -- Score 1-5 (quintis)
                NTILE(5) OVER (ORDER BY recency_days DESC) as r_score,
                NTILE(5) OVER (ORDER BY frequency) as f_score,
                NTILE(5) OVER (ORDER BY monetary) as m_score
            FROM customer_rfm
        )
        SELECT 
            *,
            -- Classificação de segmento
            CASE
                WHEN r_score = 5 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
                WHEN r_score >= 4 AND f_score >= 4 THEN 'Loyal'
                WHEN r_score >= 4 AND f_score <= 2 THEN 'Potential'
                WHEN r_score <= 2 AND f_score >= 4 THEN 'At Risk'
                WHEN r_score = 1 AND f_score = 1 THEN 'Hibernating'
                ELSE 'Regular'
            END as segment
        FROM rfm_scores
        ORDER BY monetary DESC
    """
    
    results = await db.execute_query(query)
    return {"data": results}
```

---

## 📊 ChurnDashboard Page

```tsx
export const ChurnDashboard = () => {
  const { data: metrics } = useQuery({
    queryKey: ['churn-metrics'],
    queryFn: () => analyticsAPI.getChurnMetrics()
  });
  
  const { data: atRisk } = useQuery({
    queryKey: ['at-risk-customers'],
    queryFn: () => analyticsAPI.getAtRiskCustomers()
  });
  
  const { data: rfmSegments } = useQuery({
    queryKey: ['rfm-segments'],
    queryFn: () => analyticsAPI.getRFMSegments()
  });
  
  return (
    <div className="churn-dashboard">
      {/* KPIs de Churn */}
      <div className="kpi-row">
        <KPICard label="Taxa de Churn" value={`${metrics.churn_rate}%`} />
        <KPICard label="Retenção" value={`${metrics.retention_rate}%`} />
        <KPICard label="LTV Médio" value={metrics.avg_lifetime_value} />
      </div>
      
      {/* Gráfico Scatter RFM */}
      <RFMScatterChart data={rfmSegments} />
      
      {/* Distribuição de Segmentos */}
      <SegmentDistributionChart data={rfmSegments} />
      
      {/* Tabela de Clientes em Risco */}
      <AtRiskCustomersTable data={atRisk} />
    </div>
  );
};
```

---

## 📈 Visualizações

### 1. Scatter Plot RFM

```typescript
{
  type: 'scatter',
  data: rfmData.map(customer => [
    customer.recency_days,
    customer.frequency,
    customer.monetary,
    customer.segment
  ]),
  symbolSize: (data) => Math.sqrt(data[2]) / 10, // Tamanho por valor
  itemStyle: {
    color: (params) => getSegmentColor(params.data[3])
  }
}
```

### 2. Trend Chart (Churn ao Longo do Tempo)

```typescript
{
  type: 'line',
  data: monthlyChurn.map(m => ({
    month: m.month,
    churn_rate: m.churn_rate,
    retention_rate: m.retention_rate
  }))
}
```

---

## 🎯 Estratégias por Segmento

### Champions 🏆
- **Ação:** Programas VIP, early access
- **Objetivo:** Manter engajamento

### At Risk ⚠️
- **Ação:** Cupons de reativação, contato personalizado
- **Objetivo:** Prevenir churn

### Hibernating 😴
- **Ação:** Campanhas de reconquista
- **Objetivo:** Reativar clientes

---

## 🔄 Integração

- Feature #01: KPIs de retenção no dashboard
- Feature #11: Alertas para clientes em risco
- Feature #06: Export de lista de clientes

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
