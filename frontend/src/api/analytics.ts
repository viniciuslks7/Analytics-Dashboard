import { apiClient } from './client';
import type {
  KPIDashboard,
  AnalyticsQueryRequest,
  AnalyticsQueryResponse,
  DimensionValuesResponse,
} from '../types/analytics';

export const analyticsAPI = {
  // Get KPI Dashboard
  getKPIs: async (filters?: Record<string, any>): Promise<KPIDashboard> => {
    const params: any = {};
    
    // Convert filters to query params (matching backend parameter names)
    if (filters) {
      if (filters.data_venda_gte) params.start_date = filters.data_venda_gte;
      if (filters.data_venda_lte) params.end_date = filters.data_venda_lte;
      
      // Send as arrays to match backend List[str] expectations
      if (filters.canal_venda && filters.canal_venda.length > 0) {
        params.canal_venda = filters.canal_venda;
      }
      if (filters.nome_loja && filters.nome_loja.length > 0) {
        params.nome_loja = filters.nome_loja;
      }
      if (filters.nome_produto && filters.nome_produto.length > 0) {
        params.nome_produto = filters.nome_produto;
      }
    }
    
    const response = await apiClient.get('/api/v1/analytics/kpis', { params });
    return response.data;
  },

  // Execute custom analytics query
  query: async (request: AnalyticsQueryRequest): Promise<AnalyticsQueryResponse> => {
    const response = await apiClient.post('/api/v1/analytics/query', request);
    return response.data;
  },

  // Get dimension values
  getDimensionValues: async (dimension: string): Promise<DimensionValuesResponse> => {
    const response = await apiClient.get(`/api/v1/analytics/dimensions/${dimension}`);
    return response.data;
  },

  // Convenience methods for specific dimensions
  getStores: () => analyticsAPI.getDimensionValues('stores'),
  getChannels: () => analyticsAPI.getDimensionValues('channels'),
  getProducts: () => analyticsAPI.getDimensionValues('products'),
  getRegions: () => analyticsAPI.getDimensionValues('regions'),
};
