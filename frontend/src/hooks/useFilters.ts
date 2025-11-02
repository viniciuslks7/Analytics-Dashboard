import { create } from 'zustand';
import { useEffect } from 'react';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

export interface FilterState {
  // Date Range
  dateRange: [Dayjs | null, Dayjs | null] | null;
  
  // Selected Values
  selectedChannels: string[];
  selectedStores: string[];
  selectedProducts: string[];
  
  // Available Options
  channelOptions: { label: string; value: string }[];
  storeOptions: { label: string; value: string }[];
  productOptions: { label: string; value: string }[];
  
  // Loading State
  isLoading: boolean;
  
  // Actions
  setDateRange: (dateRange: [Dayjs | null, Dayjs | null] | null) => void;
  setSelectedChannels: (channels: string[]) => void;
  setSelectedStores: (stores: string[]) => void;
  setSelectedProducts: (products: string[]) => void;
  setChannelOptions: (options: { label: string; value: string }[]) => void;
  setStoreOptions: (options: { label: string; value: string }[]) => void;
  setProductOptions: (options: { label: string; value: string }[]) => void;
  setIsLoading: (loading: boolean) => void;
  resetFilters: () => void;
}

// Initial date range: last 30 days
const initialDateRange: [Dayjs, Dayjs] = [
  dayjs().subtract(30, 'day'),
  dayjs()
];

export const useFilterStore = create<FilterState>((set) => ({
  // Initial State
  dateRange: initialDateRange,
  selectedChannels: [],
  selectedStores: [],
  selectedProducts: [],
  channelOptions: [],
  storeOptions: [],
  productOptions: [],
  isLoading: false,
  
  // Actions
  setDateRange: (dateRange) => set({ dateRange }),
  setSelectedChannels: (selectedChannels) => set({ selectedChannels }),
  setSelectedStores: (selectedStores) => set({ selectedStores }),
  setSelectedProducts: (selectedProducts) => set({ selectedProducts }),
  setChannelOptions: (channelOptions) => set({ channelOptions }),
  setStoreOptions: (storeOptions) => set({ storeOptions }),
  setProductOptions: (productOptions) => set({ productOptions }),
  setIsLoading: (isLoading) => set({ isLoading }),
  
  resetFilters: () =>
    set({
      dateRange: initialDateRange,
      selectedChannels: [],
      selectedStores: [],
      selectedProducts: [],
    }),
}));

// Hook with API integration
export const useFilters = () => {
  const store = useFilterStore();

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      store.setIsLoading(true);
      try {
        // Fetch unique channels
        const channelsRes = await fetch('http://localhost:8000/api/v1/analytics/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metrics: [],
            dimensions: ['canal_venda'],
            filters: {},
            order_by: [{ field: 'canal_venda', direction: 'asc' }]
          })
        });
        const channelsData = await channelsRes.json();
        const channelOptions = channelsData.data.map((item: any) => ({
          label: item.canal_venda,
          value: item.canal_venda
        }));
        store.setChannelOptions(channelOptions);

        // Fetch unique stores
        const storesRes = await fetch('http://localhost:8000/api/v1/analytics/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metrics: [],
            dimensions: ['nome_loja'],
            filters: {},
            order_by: [{ field: 'nome_loja', direction: 'asc' }]
          })
        });
        const storesData = await storesRes.json();
        const storeOptions = storesData.data.map((item: any) => ({
          label: item.nome_loja,
          value: item.nome_loja
        }));
        store.setStoreOptions(storeOptions);

        // Fetch unique products (limited to top 100 for performance)
        const productsRes = await fetch('http://localhost:8000/api/v1/analytics/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metrics: ['SUM(quantidade) as total_vendido'],
            dimensions: ['nome_produto'],
            filters: {},
            order_by: [{ field: 'total_vendido', direction: 'desc' }],
            limit: 100
          })
        });
        const productsData = await productsRes.json();
        const productOptions = productsData.data.map((item: any) => ({
          label: item.nome_produto,
          value: item.nome_produto
        }));
        store.setProductOptions(productOptions);

      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        store.setIsLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  return store;
};

// Helper function to convert filters to API format
export const getAPIFilters = (state: FilterState) => {
  const filters: Record<string, any> = {};

  if (state.dateRange && state.dateRange[0] && state.dateRange[1]) {
    filters.data_venda_gte = state.dateRange[0].format('YYYY-MM-DD');
    filters.data_venda_lte = state.dateRange[1].format('YYYY-MM-DD');
  }

  if (state.selectedChannels.length > 0) {
    filters.canal_venda = state.selectedChannels;
  }

  if (state.selectedStores.length > 0) {
    filters.nome_loja = state.selectedStores;
  }

  if (state.selectedProducts.length > 0) {
    filters.nome_produto = state.selectedProducts;
  }

  return filters;
};
