/**
 * API Client para Alertas
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
}

export interface AlertCreate {
  name: string;
  description?: string;
  condition: AlertCondition;
  enabled: boolean;
  notification_channels: ('toast' | 'email' | 'webhook')[];
}

export interface Alert extends AlertCreate {
  id: string;
  created_at: string;
  updated_at: string;
  last_triggered_at?: string;
  trigger_count: number;
}

export interface AlertCheckResult {
  alert_id: string;
  alert_name: string;
  triggered: boolean;
  current_value: number;
  threshold: number;
  message: string;
  timestamp: string;
}

export const alertsAPI = {
  /**
   * Cria um novo alerta
   */
  create: async (data: AlertCreate): Promise<Alert> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/alerts`, data);
    return response.data;
  },

  /**
   * Lista todos os alertas
   */
  list: async (enabledOnly: boolean = false): Promise<Alert[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/alerts`, {
      params: { enabled_only: enabledOnly }
    });
    return response.data;
  },

  /**
   * Obtém um alerta específico
   */
  get: async (alertId: string): Promise<Alert> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/alerts/${alertId}`);
    return response.data;
  },

  /**
   * Atualiza um alerta
   */
  update: async (alertId: string, data: Partial<AlertCreate>): Promise<Alert> => {
    const response = await axios.put(`${API_BASE_URL}/api/v1/alerts/${alertId}`, data);
    return response.data;
  },

  /**
   * Deleta um alerta
   */
  delete: async (alertId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/alerts/${alertId}`);
  },

  /**
   * Verifica alertas com métricas fornecidas
   */
  check: async (metrics: Record<string, number>): Promise<AlertCheckResult[]> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/alerts/check`, metrics);
    return response.data;
  },

  /**
   * Verifica alertas com dados atuais do sistema
   */
  checkCurrent: async (): Promise<AlertCheckResult[]> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/alerts/check-current`);
    return response.data;
  }
};
