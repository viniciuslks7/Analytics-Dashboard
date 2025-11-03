import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  filters: {
    startDate?: string;
    endDate?: string;
    channel?: string;
    store?: string;
    product?: string;
  };
  layout?: {
    chartOrder?: string[];
    hiddenCharts?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface DashboardStore {
  dashboards: DashboardConfig[];
  currentDashboardId: string | null;
  
  // Actions
  createDashboard: (name: string, description?: string) => string;
  updateDashboard: (id: string, config: Partial<DashboardConfig>) => void;
  deleteDashboard: (id: string) => void;
  setCurrentDashboard: (id: string | null) => void;
  getCurrentDashboard: () => DashboardConfig | null;
  saveDashboardFilters: (id: string, filters: DashboardConfig['filters']) => void;
  loadDashboardFilters: (id: string) => DashboardConfig['filters'] | null;
  duplicateDashboard: (id: string) => string;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      dashboards: [
        {
          id: 'default',
          name: 'Dashboard Padrão',
          description: 'Dashboard principal com todas as visualizações',
          filters: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      currentDashboardId: 'default',

      createDashboard: (name, description) => {
        const id = `dashboard_${Date.now()}`;
        const newDashboard: DashboardConfig = {
          id,
          name,
          description,
          filters: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set((state) => ({
          dashboards: [...state.dashboards, newDashboard],
          currentDashboardId: id
        }));

        return id;
      },

      updateDashboard: (id, config) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === id
              ? { ...d, ...config, updatedAt: new Date().toISOString() }
              : d
          )
        }));
      },

      deleteDashboard: (id) => {
        if (id === 'default') {
          console.warn('Cannot delete default dashboard');
          return;
        }

        set((state) => {
          const newDashboards = state.dashboards.filter((d) => d.id !== id);
          const newCurrentId = state.currentDashboardId === id ? 'default' : state.currentDashboardId;
          
          return {
            dashboards: newDashboards,
            currentDashboardId: newCurrentId
          };
        });
      },

      setCurrentDashboard: (id) => {
        set({ currentDashboardId: id });
      },

      getCurrentDashboard: () => {
        const state = get();
        return state.dashboards.find((d) => d.id === state.currentDashboardId) || null;
      },

      saveDashboardFilters: (id, filters) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === id
              ? { ...d, filters, updatedAt: new Date().toISOString() }
              : d
          )
        }));
      },

      loadDashboardFilters: (id) => {
        const state = get();
        const dashboard = state.dashboards.find((d) => d.id === id);
        return dashboard?.filters || null;
      },

      duplicateDashboard: (id) => {
        const state = get();
        const original = state.dashboards.find((d) => d.id === id);
        
        if (!original) return '';

        const newId = `dashboard_${Date.now()}`;
        const duplicated: DashboardConfig = {
          ...original,
          id: newId,
          name: `${original.name} (Cópia)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set((state) => ({
          dashboards: [...state.dashboards, duplicated]
        }));

        return newId;
      }
    }),
    {
      name: 'dashboard-storage',
      version: 1
    }
  )
);
