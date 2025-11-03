# 🎛️ Feature #08: Gerenciador de Dashboards

## 📋 Visão Geral

Sistema para criar, salvar e gerenciar dashboards personalizados. Permite configurar widgets, layout, filtros e compartilhar com a equipe. Usa localStorage para persistência.

---

## ✨ Funcionalidades

### 1. **Criar Dashboard Personalizado**

```tsx
<DashboardManager onDashboardChange={handleChange} />
```

Interface:
- Nome do dashboard
- Descrição
- Widgets selecionados
- Layout (grid)
- Filtros padrão

### 2. **Salvar Configuração**

```typescript
interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: GridLayout;
  filters: FilterConfig;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. **Gerenciar Dashboards**

- ➕ Criar novo
- 💾 Salvar atual
- 📋 Duplicar
- 🗑️ Deletar
- 🔄 Alternar entre dashboards

---

## 🏗️ Implementação

```typescript
export const DashboardManager = () => {
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<string>('default');
  
  // Carrega dashboards do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboards');
    if (saved) {
      setDashboards(JSON.parse(saved));
    }
  }, []);
  
  const saveDashboard = (config: DashboardConfig) => {
    const updated = [...dashboards, config];
    setDashboards(updated);
    localStorage.setItem('dashboards', JSON.stringify(updated));
  };
  
  return (
    <Dropdown menu={{
      items: dashboards.map(d => ({
        key: d.id,
        label: d.name,
        onClick: () => setCurrentDashboard(d.id)
      }))
    }}>
      <Button icon={<AppstoreOutlined />}>
        Dashboards
      </Button>
    </Dropdown>
  );
};
```

---

## 🎨 Widgets Disponíveis

- 📊 KPI Card
- 📈 Gráfico de Linha
- 🍰 Gráfico de Pizza
- 📊 Gráfico de Barras
- 🗓️ Heatmap
- 📋 Tabela de Dados
- ⚠️ Lista de Alertas

---

## 💾 Persistência

```typescript
// localStorage
const STORAGE_KEY = 'dashboards';

const save = (data: DashboardConfig[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const load = (): DashboardConfig[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};
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
