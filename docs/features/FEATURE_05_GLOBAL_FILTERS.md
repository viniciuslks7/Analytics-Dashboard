# 🔍 Feature #05: Filtros Globais

## 📋 Visão Geral

Sistema de filtros globais que permite aplicar filtros em **todos** os componentes do dashboard simultaneamente. Usa Zustand para gerenciamento de estado, persist dados em URL params e atualiza automaticamente todas as queries.

---

## ✨ Funcionalidades

### 1. **FilterPanel Component**
- Date Range Picker (intervalo de datas)
- Multi-Select para Canais
- Multi-Select para Lojas  
- Multi-Select para Produtos (com busca)
- Botão "Resetar" para limpar filtros

### 2. **Filtros Disponíveis**

```typescript
interface FilterState {
  dateRange: [Dayjs, Dayjs] | null;     // 05/05/2025 - 20/05/2025
  selectedChannels: string[];            // ['iFood', 'Rappi']
  selectedStores: string[];              // ['Loja Centro', 'Loja Shopping']
  selectedProducts: string[];            // ['X-Burger', 'Pizza Margherita']
}
```

### 3. **Hook useFilters**

```typescript
const {
  dateRange,
  selectedChannels,
  setDateRange,
  setSelectedChannels,
  resetFilters,
} = useFilters();
```

### 4. **Conversão para API**

```typescript
const apiFilters = getAPIFilters(filterState);
// Resultado:
{
  data_venda_gte: '2025-05-05',
  data_venda_lte: '2025-05-20',
  canal_venda: ['iFood', 'Rappi'],
  nome_loja: ['Loja Centro']
}
```

---

## 🏗️ Arquitetura

### Zustand Store

```typescript
export const useFilterStore = create<FilterState>((set) => ({
  dateRange: initialDateRange,
  selectedChannels: [],
  selectedStores: [],
  selectedProducts: [],
  
  setDateRange: (dateRange) => set({ dateRange }),
  setSelectedChannels: (channels) => set({ selectedChannels: channels }),
  resetFilters: () => set({
    dateRange: initialDateRange,
    selectedChannels: [],
    selectedStores: [],
    selectedProducts: [],
  }),
}));
```

### Aplicação Automática

```typescript
const Dashboard = () => {
  const filterState = useFilters();
  const apiFilters = getAPIFilters(filterState);
  
  const { data: kpiData } = useQuery({
    queryKey: ['kpis', apiFilters],  // ← Filtra automaticamente
    queryFn: () => analyticsAPI.getKPIs(apiFilters),
  });
  
  return (
    <>
      <FilterPanel />
      <KPICards data={kpiData} />
      <Charts filters={apiFilters} />  {/* ← Todos usam mesmo filtro */}
    </>
  );
};
```

---

## 📊 Componentes de Filtro

### DateRangePicker

```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  format="DD/MM/YYYY"
  presets={[
    { label: 'Hoje', value: [dayjs(), dayjs()] },
    { label: 'Últimos 7 dias', value: [dayjs().subtract(7, 'd'), dayjs()] },
    { label: 'Últimos 30 dias', value: [dayjs().subtract(30, 'd'), dayjs()] },
    { label: 'Este mês', value: [dayjs().startOf('month'), dayjs()] },
  ]}
/>
```

### MultiSelect

```tsx
<MultiSelect
  label="Canal"
  placeholder="Selecione os canais"
  value={selectedChannels}
  options={[
    { label: 'iFood', value: 'iFood' },
    { label: 'Rappi', value: 'Rappi' },
    { label: 'Presencial', value: 'Presencial' },
  ]}
  onChange={setSelectedChannels}
  mode="multiple"
  showSearch
  allowClear
/>
```

---

## ⚡ Performance

### 1. Debounce de Filtros

```typescript
const [debouncedFilters] = useDebounce(apiFilters, 300);

const { data } = useQuery({
  queryKey: ['data', debouncedFilters],
  queryFn: () => api.fetch(debouncedFilters),
});
```

### 2. Opções Cacheadas

```typescript
// Busca opções apenas uma vez
useEffect(() => {
  fetchChannelOptions();
  fetchStoreOptions();
}, []); // ← Sem dependências
```

---

## 🔄 Integração

Todas features usam filtros globais:
- ✅ Feature #01: Dashboard Analytics
- ✅ Feature #03: Comparação de Períodos
- ✅ Feature #04: Visualizações ECharts
- ✅ Feature #09: Drill-Down
- ✅ Feature #10: Data Table

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
