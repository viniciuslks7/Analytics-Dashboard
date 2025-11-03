# 📤 Feature #06: Sistema de Export

## 📋 Visão Geral

Sistema completo de exportação de dados e gráficos em múltiplos formatos (CSV, JSON, PDF, PNG). Permite download instantâneo de tabelas, KPIs e visualizações para análise offline e compartilhamento.

---

## ✨ Formatos Suportados

### 1. **CSV (Comma-Separated Values)**
- Tabelas e dados tabulares
- Compatível com Excel
- Formatação de números e moedas

### 2. **JSON (JavaScript Object Notation)**
- Dados brutos estruturados
- Para integração com outras ferramentas
- Incluí metadados

### 3. **PDF (Portable Document Format)**
- Dashboard completo
- Formatação profissional
- Cabeçalho com logo e data

### 4. **PNG (Imagem)**
- Gráficos individuais
- Alta resolução
- Fundo transparente opcional

---

## 🏗️ Componente ExportButton

```tsx
<ExportButton 
  data={kpiData}
  filename="dashboard-analytics"
  elementId="dashboard-content"
  formats={['csv', 'json', 'pdf', 'png']}
/>
```

### Implementação

```typescript
export const ExportButton = ({ 
  data = [], 
  filename = 'export', 
  elementId 
}: ExportButtonProps) => {
  
  const handleExportCSV = () => {
    const csv = convertToCSV(data);
    downloadFile(csv, `${filename}.csv`, 'text/csv');
  };
  
  const handleExportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${filename}.json`, 'application/json');
  };
  
  const handleExportPDF = async () => {
    const element = document.getElementById(elementId);
    const pdf = await html2pdf()
      .from(element)
      .set({
        margin: 1,
        filename: `${filename}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      })
      .save();
  };
  
  return (
    <Dropdown menu={{
      items: [
        { key: 'csv', label: '📄 Exportar CSV', onClick: handleExportCSV },
        { key: 'json', label: '📋 Exportar JSON', onClick: handleExportJSON },
        { key: 'pdf', label: '📕 Exportar PDF', onClick: handleExportPDF },
      ]
    }}>
      <Button icon={<DownloadOutlined />}>
        Exportar
      </Button>
    </Dropdown>
  );
};
```

---

## 📊 Conversão de Dados

### CSV Converter

```typescript
const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      let cell = row[header];
      
      // Formatar números
      if (typeof cell === 'number') {
        cell = cell.toLocaleString('pt-BR');
      }
      
      // Escapar vírgulas e aspas
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
        cell = `"${cell.replace(/"/g, '""')}"`;
      }
      
      return cell;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};
```

### JSON Formatter

```typescript
const formatJSON = (data: any[]): string => {
  return JSON.stringify({
    exportDate: new Date().toISOString(),
    recordCount: data.length,
    data: data
  }, null, 2);
};
```

---

## 📈 Export de Gráficos

### ECharts para PNG

```typescript
const exportChartAsImage = (chartInstance: echarts.ECharts) => {
  const url = chartInstance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  });
  
  const link = document.createElement('a');
  link.download = 'chart.png';
  link.href = url;
  link.click();
};
```

### html2pdf Configuration

```typescript
const pdfOptions = {
  margin: [10, 10, 10, 10],
  filename: `dashboard-${Date.now()}.pdf`,
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { 
    scale: 2, 
    useCORS: true,
    logging: false 
  },
  jsPDF: { 
    unit: 'mm', 
    format: 'a4', 
    orientation: 'portrait' 
  }
};
```

---

## ⚡ Performance

### 1. Lazy Load da Biblioteca

```typescript
const html2pdf = lazy(() => import('html2pdf.js'));
```

### 2. Workers para CSV Grande

```typescript
const worker = new Worker('csv-worker.js');
worker.postMessage({ data: largeData });
worker.onmessage = (e) => {
  downloadFile(e.data, 'export.csv');
};
```

---

## 🔄 Integração

- Feature #01: Export de KPIs
- Feature #04: Export de gráficos ECharts
- Feature #10: Export de tabelas

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
