import { create } from 'zustand';

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface QueryConfig {
  metrics: string[];
  dimensions: string[];
  filters: FilterCondition[];
  orderBy: { field: string; direction: 'asc' | 'desc' }[];
  limit: number;
}

interface QueryBuilderState {
  config: QueryConfig;
  setMetrics: (metrics: string[]) => void;
  setDimensions: (dimensions: string[]) => void;
  addFilter: (filter: FilterCondition) => void;
  removeFilter: (id: string) => void;
  updateFilter: (id: string, updates: Partial<FilterCondition>) => void;
  setOrderBy: (orderBy: { field: string; direction: 'asc' | 'desc' }[]) => void;
  setLimit: (limit: number) => void;
  resetConfig: () => void;
  loadConfig: (config: QueryConfig) => void;
}

const defaultConfig: QueryConfig = {
  metrics: ['faturamento'],
  dimensions: ['canal_venda'],
  filters: [],
  orderBy: [{ field: 'faturamento', direction: 'desc' }],
  limit: 100,
};

export const useQueryBuilder = create<QueryBuilderState>((set) => ({
  config: defaultConfig,
  
  setMetrics: (metrics) =>
    set((state) => ({
      config: { ...state.config, metrics },
    })),
    
  setDimensions: (dimensions) =>
    set((state) => ({
      config: { ...state.config, dimensions },
    })),
    
  addFilter: (filter) =>
    set((state) => ({
      config: {
        ...state.config,
        filters: [...state.config.filters, filter],
      },
    })),
    
  removeFilter: (id) =>
    set((state) => ({
      config: {
        ...state.config,
        filters: state.config.filters.filter((f) => f.id !== id),
      },
    })),
    
  updateFilter: (id, updates) =>
    set((state) => ({
      config: {
        ...state.config,
        filters: state.config.filters.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        ),
      },
    })),
    
  setOrderBy: (orderBy) =>
    set((state) => ({
      config: { ...state.config, orderBy },
    })),
    
  setLimit: (limit) =>
    set((state) => ({
      config: { ...state.config, limit },
    })),
    
  resetConfig: () => set({ config: defaultConfig }),
  
  loadConfig: (config) => set({ config }),
}));
