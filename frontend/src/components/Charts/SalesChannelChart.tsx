import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';
import { useTheme } from '../../hooks/useTheme';
import { getEChartsTheme } from '../../styles/theme';
import { DrillDownModal, DrillDownContext } from '../DrillDown';

interface SalesChannelChartProps {
  filters?: Record<string, any>;
}

export const SalesChannelChart = ({ filters = {} }: SalesChannelChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { theme } = useTheme();
  const [drillDownContext, setDrillDownContext] = useState<DrillDownContext | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-by-channel', filters],
    queryFn: () => analyticsAPI.query({
      metrics: ['faturamento', 'qtd_vendas'],
      dimensions: ['canal_venda'],
      filters: filters,
      order_by: [{ field: 'faturamento', direction: 'desc' }],
      limit: 10
    }),
    refetchInterval: 60000, // Atualiza a cada 60s
  });

  useEffect(() => {
    if (!chartRef.current) return;

    // Inicializa o gráfico
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (data?.data && data.data.length > 0) {
      const channels = data.data.map((row: any) => row.canal_venda || 'Desconhecido');
      const revenues = data.data.map((row: any) => Number(row.faturamento) || 0);
      const quantities = data.data.map((row: any) => Number(row.qtd_vendas) || 0);

      const baseTheme = getEChartsTheme(theme);
      const option: echarts.EChartsOption = {
        ...baseTheme,
        title: {
          text: 'Vendas por Canal',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            const index = params.dataIndex;
            return `
              <strong>${params.name}</strong><br/>
              Faturamento: R$ ${revenues[index].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<br/>
              Vendas: ${quantities[index].toLocaleString('pt-BR')}
            `;
          }
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
        },
        series: [
          {
            name: 'Faturamento',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 20,
                fontWeight: 'bold',
                formatter: (params: any) => {
                  return `${params.name}\n${params.percent}%`;
                }
              }
            },
            labelLine: {
              show: false
            },
            data: channels.map((channel: string, index: number) => ({
              value: revenues[index],
              name: channel,
            }))
          }
        ],
        color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4']
      };

      chartInstance.current.setOption(option);

      // Adicionar event listener para drill-down
      chartInstance.current.off('click');
      chartInstance.current.on('click', (params: any) => {
        if (params.componentType === 'series') {
          setDrillDownContext({
            type: 'channel',
            value: params.name,
            label: params.name,
            filters: filters
          });
          setModalVisible(true);
        }
      });
    }

    // Resize ao mudar tamanho da janela
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, theme]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="chart-container">
        <div className="loading">Carregando gráfico...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <div className="error">Erro ao carregar dados do gráfico</div>
      </div>
    );
  }

  return (
    <>
      <div ref={chartRef} className="chart-container" style={{ width: '100%', height: '400px', cursor: 'pointer' }} />
      <DrillDownModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        context={drillDownContext}
      />
    </>
  );
};
