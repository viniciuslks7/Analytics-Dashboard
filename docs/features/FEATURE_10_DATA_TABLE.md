# 📋 Feature #10: Data Table Interativa

## 📋 Visão Geral

Tabela de dados robusta e interativa usando Ant Design Table. Suporta ordenação, paginação, busca inline, colunas dinâmicas e export. Otimizada para grandes volumes de dados com paginação server-side.

---

## ✨ Funcionalidades

### 1. **Colunas Dinâmicas**

Colunas geradas automaticamente baseadas nos dados retornados pela query:

```typescript
const columns = Object.keys(data[0]).map(key => ({
  title: formatColumnTitle(key),
  dataIndex: key,
  key: key,
  sorter: true,
  render: (value) => formatCellValue(value, key)
}));
```

### 2. **Ordenação**

- **Client-side**: Para datasets pequenos (< 1000 linhas)
- **Server-side**: Para datasets grandes

```tsx
<Table
  columns={columns}
  dataSource={data}
  onChange={handleTableChange}
  sorter={{ multiple: 2 }}
/>
```

### 3. **Paginação**

```typescript
pagination={{
  current: page,
  pageSize: pageSize,
  total: totalRecords,
  showSizeChanger: true,
  pageSizeOptions: ['10', '25', '50', '100'],
  showTotal: (total) => `Total: ${total} registros`
}}
```

### 4. **Busca Inline**

```tsx
<Input.Search
  placeholder="Buscar..."
  onSearch={handleSearch}
  style={{ width: 300, marginBottom: 16 }}
/>
```

---

## 🏗️ Implementação

```tsx
export const DataTable = ({ filters = {} }: DataTableProps) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<string>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>();
  
  const { data, isLoading } = useQuery({
    queryKey: ['table-data', filters, page, pageSize, sortField, sortOrder],
    queryFn: () => analyticsAPI.query({
      metrics: ['faturamento', 'qtd_vendas'],
      dimensions: ['nome_produto', 'canal_venda'],
      filters: filters,
      order_by: sortField ? [{ field: sortField, direction: sortOrder }] : [],
      limit: pageSize,
      offset: (page - 1) * pageSize
    })
  });
  
  const columns = useMemo(() => {
    if (!data?.data || data.data.length === 0) return [];
    
    return Object.keys(data.data[0]).map(key => ({
      title: formatColumnTitle(key),
      dataIndex: key,
      key: key,
      sorter: true,
      render: (value: any) => formatCellValue(value, key)
    }));
  }, [data]);
  
  const handleTableChange = (
    pagination: any,
    filters: any,
    sorter: any
  ) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
  };
  
  return (
    <div className="data-table">
      <Input.Search
        placeholder="Buscar na tabela..."
        onSearch={handleSearch}
        style={{ width: 300, marginBottom: 16 }}
      />
      
      <Table
        columns={columns}
        dataSource={data?.data}
        loading={isLoading}
        onChange={handleTableChange}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.metadata?.total_count || 0,
          showSizeChanger: true,
          pageSizeOptions: ['10', '25', '50', '100'],
          showTotal: (total) => `Total: ${total} registros`
        }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
      
      <ExportButton data={data?.data} filename="table-export" />
    </div>
  );
};
```

---

## 📊 Formatação de Células

```typescript
const formatCellValue = (value: any, columnKey: string): ReactNode => {
  // Moeda
  if (columnKey.includes('faturamento') || columnKey.includes('valor')) {
    return `R$ ${Number(value).toLocaleString('pt-BR', { 
      minimumFractionDigits: 2 
    })}`;
  }
  
  // Número
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR');
  }
  
  // Data
  if (columnKey.includes('data') && typeof value === 'string') {
    return dayjs(value).format('DD/MM/YYYY');
  }
  
  // Porcentagem
  if (columnKey.includes('taxa') || columnKey.includes('percent')) {
    return `${Number(value).toFixed(2)}%`;
  }
  
  return value;
};
```

---

## 📱 Responsividade

```css
.data-table {
  width: 100%;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .data-table .ant-table {
    font-size: 12px;
  }
  
  .data-table .ant-table-thead > tr > th {
    padding: 8px 4px;
  }
}
```

---

## ⚡ Performance

### Virtual Scrolling

```tsx
<Table
  virtual
  scroll={{ y: 600, x: 'max-content' }}
/>
```

### Server-side Pagination

```python
@router.post("/query")
async def query(request: AnalyticsQueryRequest):
    # Pagination
    limit = request.limit or 25
    offset = request.offset or 0
    
    query = f"""
        SELECT ...
        FROM sales
        LIMIT {limit}
        OFFSET {offset}
    """
    
    results = await db.execute_query(query)
    total_count = await db.count("sales")
    
    return {
        "data": results,
        "metadata": {
            "total_count": total_count,
            "page": offset // limit + 1,
            "page_size": limit
        }
    }
```

---

## 🔄 Integração

- ~~Feature #02: Query Builder gera tabela~~ ❌ REMOVIDO
- Feature #05: Filtros globais aplicados
- Feature #06: Export de dados da tabela

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
