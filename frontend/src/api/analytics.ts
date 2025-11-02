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
    
    // Convert filters to query params
    if (filters) {
      if (filters.data_venda_gte) params.start_date = filters.data_venda_gte;
      if (filters.data_venda_lte) params.end_date = filters.data_venda_lte;
      if (filters.canal_venda) params.channels = filters.canal_venda.join(',');
      if (filters.nome_loja) params.stores = filters.nome_loja.join(',');
      if (filters.nome_produto) params.products = filters.nome_produto.join(',');
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
