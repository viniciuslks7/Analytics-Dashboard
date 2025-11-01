export interface KPICard {
  label: string;
  value: number | string;
  format: 'number' | 'currency' | 'percentage' | 'duration';
  change?: number;
  change_label?: string;
}

export interface QueryMetadata {
  total_rows: number;
  query_time_ms: number;
  cached: boolean;
  timestamp: string;
}

export interface KPIDashboard {
  kpis: KPICard[];
  period: string;
  metadata: QueryMetadata;
}

export interface AnalyticsQueryRequest {
  metrics: string[];
  dimensions?: string[];
  filters?: Record<string, any>;
  date_range?: {
    start_date?: string;
    end_date?: string;
  };
  order_by?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
}

export interface AnalyticsQueryResponse {
  data: Record<string, any>[];
  metadata: QueryMetadata;
}

export interface DimensionValue {
  id: string | number;
  label: string;
  count?: number;
}

export interface DimensionValuesResponse {
  dimension: string;
  values: DimensionValue[];
  total: number;
}
