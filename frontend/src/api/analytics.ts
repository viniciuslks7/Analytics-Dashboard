import { apiClient } from './client';
import type {
  KPIDashboard,
  AnalyticsQueryRequest,
  AnalyticsQueryResponse,
  DimensionValuesResponse,
} from '../types/analytics';

export const analyticsAPI = {
  // Get KPI Dashboard
  getKPIs: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<KPIDashboard> => {
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
