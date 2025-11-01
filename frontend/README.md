# 📊 Restaurant Analytics Platform - Frontend# React + TypeScript + Vite



Interface web moderna construída com **React + TypeScript + Vite + ECharts** para visualização de dados operacionais de restaurantes.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## 🏗️ ArquiteturaCurrently, two official plugins are available:



```- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

frontend/- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

├── src/

│   ├── api/                # Comunicação com backend## React Compiler

│   │   ├── client.ts       # Axios client configurado

│   │   └── analytics.ts    # API methodsThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

│   ├── components/         # Componentes React

│   │   ├── Charts/         # Gráficos ECharts## Expanding the ESLint configuration

│   │   │   ├── SalesChannelChart.tsx

│   │   │   ├── TopProductsChart.tsxIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

│   │   │   ├── HourlyHeatmap.tsx

│   │   │   └── DeliveryMetricsChart.tsx```js

│   │   └── KPICard.tsx     # Card de KPIexport default defineConfig([

│   ├── pages/              # Páginas  globalIgnores(['dist']),

│   │   └── Dashboard.tsx   # Dashboard principal  {

│   ├── types/              # TypeScript types    files: ['**/*.{ts,tsx}'],

│   │   └── analytics.ts    extends: [

│   ├── App.tsx             # App root      // Other configs...

│   ├── App.css             # Estilos globais

│   └── main.tsx            # Entry point      // Remove tseslint.configs.recommended and replace with this

├── package.json      tseslint.configs.recommendedTypeChecked,

├── tsconfig.json      // Alternatively, use this for stricter rules

├── vite.config.ts      tseslint.configs.strictTypeChecked,

└── .env      // Optionally, add this for stylistic rules

```      tseslint.configs.stylisticTypeChecked,



## 🚀 Setup Rápido      // Other configs...

    ],

### 1. Instalar dependências    languageOptions: {

      parserOptions: {

```powershell        project: ['./tsconfig.node.json', './tsconfig.app.json'],

npm install        tsconfigRootDir: import.meta.dirname,

```      },

      // other options...

### 2. Configurar variáveis de ambiente    },

  },

```powershell])

# Criar arquivo .env```

echo VITE_API_URL=http://localhost:8000 > .env

```You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:



### 3. Iniciar servidor de desenvolvimento```js

// eslint.config.js

```powershellimport reactX from 'eslint-plugin-react-x'

npm run devimport reactDom from 'eslint-plugin-react-dom'

```

export default defineConfig([

Acesse: **http://localhost:5173**  globalIgnores(['dist']),

  {

## 📦 Dependências Principais    files: ['**/*.{ts,tsx}'],

    extends: [

### Core      // Other configs...

- **React 18** - Library UI      // Enable lint rules for React

- **TypeScript** - Type safety      reactX.configs['recommended-typescript'],

- **Vite 7** - Build tool (experimental rolldown)      // Enable lint rules for React DOM

      reactDom.configs.recommended,

### Data Fetching    ],

- **@tanstack/react-query** - Server state management + cache    languageOptions: {

- **Axios** - HTTP client      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

### Visualizações        tsconfigRootDir: import.meta.dirname,

- **ECharts** - High-performance charts      },

  - Gráficos de pizza      // other options...

  - Gráficos de barras    },

  - Heatmaps  },

  - Gráficos combo (linha + barra)])

```

## 📊 Visualizações Disponíveis

### 1. **KPI Cards** (Dashboard Header)
- Faturamento Total
- Ticket Médio
- Total de Vendas
- Clientes Únicos
- Tempo Médio de Entrega
- Tempo Médio de Preparo

### 2. **Sales Channel Chart** (Pizza)
- Distribuição de faturamento por canal
- Hover para ver detalhes
- Porcentagem de cada canal

### 3. **Top Products Chart** (Barras Horizontais)
- Top 10 produtos mais vendidos
- Quantidade de vendas por produto
- Labels com valores

### 4. **Hourly Heatmap** (Mapa de Calor)
- Vendas por hora do dia × dia da semana
- Gradiente de cores por intensidade
- Identificação de horários de pico

### 5. **Delivery Metrics Chart** (Combo)
- Tempo médio de entrega por bairro (barras)
- Quantidade de entregas (linha)
- Top 15 bairros com maior tempo
- Dual axis

## ⚙️ Scripts Disponíveis

```powershell
# Desenvolvimento com HMR
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## 🎨 Estilização

### CSS Variables
```css
--primary-color: #2563eb
--secondary-color: #7c3aed
--success-color: #10b981
--danger-color: #ef4444
```

### Componentes Estilizados
- KPI Cards com hover effects
- Charts responsivos
- Loading spinners
- Error states
- Dark theme ready (preparado)

## 🔄 React Query

Configuração otimizada para cache e refetch:

```typescript
{
  refetchInterval: 30000,      // Refetch a cada 30s (KPIs)
  refetchInterval: 60000,      // Refetch a cada 60s (Charts)
  refetchOnWindowFocus: false, // Não refetch ao focar janela
  retry: 1                     // Tentar 1x em caso de erro
}
```

## 📱 Responsividade

- **Desktop**: Grid 2-3 colunas
- **Tablet**: Grid 2 colunas
- **Mobile**: Stack vertical (1 coluna)

Breakpoints:
- `@media (max-width: 768px)` - Mobile
- Grid com `auto-fit minmax(280px, 1fr)` - Adaptativo

## 🚀 Performance

### Otimizações Implementadas
- ✅ React Query cache (reduz requests)
- ✅ ECharts resize listeners otimizados
- ✅ Cleanup de chart instances ao desmontar
- ✅ Vite code splitting automático

### Bundle Size (estimado)
- Vendor: ~400KB (React + React Query + ECharts)
- App: ~50KB
- Total gzipped: ~150KB

## 🎯 Próximas Features

### Filtros Interativos
- [ ] Date range picker
- [ ] Multi-select para canais/lojas
- [ ] Filtros salvos

### Drill-down
- [ ] Click em canal → ver lojas do canal
- [ ] Click em produto → ver detalhes
- [ ] Click em bairro → ver mapa

### Exportação
- [ ] Export CSV
- [ ] Export PNG (charts)
- [ ] Export PDF (relatório completo)

## 🔗 Links Úteis

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [ECharts Examples](https://echarts.apache.org/examples/)
- [React Query Docs](https://tanstack.com/query/latest)

---

**Desenvolvido para o God Level Coder Challenge** 🚀
