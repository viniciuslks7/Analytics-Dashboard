import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';
import { useTheme } from '../../hooks/useTheme';
import { getEChartsTheme } from '../../styles/theme';
import { DrillDownModal, type DrillDownContext } from '../DrillDown';

interface TopProductsChartProps {
  filters?: Record<string, any>;
}

export const TopProductsChart = ({ filters = {} }: TopProductsChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { theme } = useTheme();
  const [drillDownContext, setDrillDownContext] = useState<DrillDownContext | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['top-products', filters],
    queryFn: () => analyticsAPI.query({
      metrics: ['qtd_vendas', 'faturamento'],
      dimensions: ['nome_produto'],
      filters: filters,
      order_by: [{ field: 'qtd_vendas', direction: 'desc' }],
      limit: 10
    }),
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (data?.data && data.data.length > 0) {
      const products = data.data.map((row: any) => row.nome_produto || 'Desconhecido');
      const quantities = data.data.map((row: any) => Number(row.qtd_vendas) || 0);

      const baseTheme = getEChartsTheme(theme);
      const option: echarts.EChartsOption = {
        ...baseTheme,
        title: {
          text: 'Top 10 Produtos Mais Vendidos',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params: any) => {
            const qtd = params[0];
            return `
              <strong>${qtd.name}</strong><br/>
              ${qtd.seriesName}: ${qtd.value.toLocaleString('pt-BR')}
            `;
          }
        },
        legend: {
          data: ['Quantidade'],
          top: 30
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          name: 'Quantidade'
        },
        yAxis: {
          type: 'category',
          data: products,
          axisLabel: {
            formatter: (value: string) => {
              return value.length > 20 ? value.substring(0, 20) + '...' : value;
            }
          }
        },
        series: [
          {
            name: 'Quantidade',
            type: 'bar',
            data: quantities,
            itemStyle: {
              color: '#5470c6'
            },
            label: {
              show: true,
              position: 'right',
              formatter: '{c}'
            }
          }
        ],
        color: ['#5470c6', '#91cc75']
      };

      chartInstance.current.setOption(option);

      // Adicionar event listener para drill-down
      chartInstance.current.off('click');
      chartInstance.current.on('click', (params: any) => {
        if (params.componentType === 'series') {
          setDrillDownContext({
            type: 'product',
            value: params.name,
            label: params.name,
            filters: filters
          });
          setModalVisible(true);
        }
      });
    }

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, theme]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
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
      <div ref={chartRef} className="chart-container" style={{ width: '100%', height: '500px', cursor: 'pointer' }} />
      <DrillDownModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        context={drillDownContext}
      />
    </>
  );
};
