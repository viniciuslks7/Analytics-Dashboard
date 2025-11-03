import { useEffect } from 'react';
import { notification } from 'antd';
import { BellOutlined, WarningOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { alertsAPI } from '../../api/alerts';
import type { AlertCheckResult } from '../../api/alerts';

interface AlertNotificationProps {
  /**
   * Intervalo de verificação em milissegundos (padrão: 60000 = 1 minuto)
   */
  checkInterval?: number;
  /**
   * Se deve verificar automaticamente
   */
  enabled?: boolean;
}

export const AlertNotification = ({ 
  checkInterval = 60000, 
  enabled = true 
}: AlertNotificationProps) => {
  
  // Query para verificar alertas automaticamente
  const { data: triggeredAlerts } = useQuery({
    queryKey: ['check-alerts'],
    queryFn: () => alertsAPI.checkCurrent(),
    refetchInterval: enabled ? checkInterval : false,
    enabled: enabled,
  });

  // Mostrar notificações quando alertas forem disparados
  useEffect(() => {
    if (triggeredAlerts && triggeredAlerts.length > 0) {
      triggeredAlerts.forEach((result: AlertCheckResult) => {
        notification.warning({
          message: `⚠️ ${result.alert_name}`,
          description: result.message,
          icon: <WarningOutlined style={{ color: '#faad14' }} />,
          placement: 'topRight',
          duration: 8,
        });
      });
    }
  }, [triggeredAlerts]);

  // Componente não renderiza nada visualmente
  return null;
};

/**
 * Hook para verificar alertas manualmente
 */
export const useAlertCheck = () => {
  const checkAlerts = async () => {
    try {
      const results = await alertsAPI.checkCurrent();
      
      if (results.length > 0) {
        results.forEach((result: AlertCheckResult) => {
          notification.warning({
            message: `⚠️ ${result.alert_name}`,
            description: result.message,
            icon: <BellOutlined style={{ color: '#faad14' }} />,
            placement: 'topRight',
            duration: 8,
          });
        });
      } else {
        notification.success({
          message: '✅ Todos os Alertas OK',
          description: 'Nenhum alerta foi disparado',
          placement: 'topRight',
          duration: 3,
        });
      }
      
      return results;
    } catch (error) {
      notification.error({
        message: 'Erro ao Verificar Alertas',
        description: 'Não foi possível verificar os alertas no momento',
        placement: 'topRight',
      });
      throw error;
    }
  };

  return { checkAlerts };
};
