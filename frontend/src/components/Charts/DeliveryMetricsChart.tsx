import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';
import { useTheme } from '../../hooks/useTheme';
import { getEChartsTheme } from '../../styles/theme';
import { DrillDownModal, type DrillDownContext } from '../DrillDown';

interface DeliveryMetricsChartProps {
  filters?: Record<string, any>;
}

export const DeliveryMetricsChart = ({ filters = {} }: DeliveryMetricsChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { theme } = useTheme();
  const [drillDownContext, setDrillDownContext] = useState<DrillDownContext | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery-metrics', filters],
    queryFn: () => analyticsAPI.query({
      metrics: ['tempo_medio_entrega', 'qtd_vendas'],
      dimensions: ['bairro'],
      filters: filters,
      order_by: [{ field: 'qtd_vendas', direction: 'desc' }], // Order by volume, not time
      limit: 50 // Get more to aggregate "Others"
    }),
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (data?.data && data.data.length > 0) {
      // Process and aggregate data
      const TOP_N = 10;
      const sortedData = [...data.data].sort((a: any, b: any) => 
        (Number(b.qtd_vendas) || 0) - (Number(a.qtd_vendas) || 0)
      );

      // Top N neighborhoods
      const topNeighborhoods = sortedData.slice(0, TOP_N);
      
      // Aggregate "Others"
      const others = sortedData.slice(TOP_N);
      if (others.length > 0) {
        const totalQtd = others.reduce((sum: number, row: any) => sum + (Number(row.qtd_vendas) || 0), 0);
        const totalTime = others.reduce((sum: number, row: any) => sum + (Number(row.tempo_medio_entrega) || 0) * (Number(row.qtd_vendas) || 0), 0);
        const avgTime = totalQtd > 0 ? totalTime / totalQtd : 0;
        
        topNeighborhoods.push({
          bairro: `Outros (${others.length} bairros)`,
          qtd_vendas: totalQtd,
          tempo_medio_entrega: avgTime,
          isAggregated: true
        });
      }

      // Reverse for horizontal bar (top to bottom)
      topNeighborhoods.reverse();

      const neighborhoods = topNeighborhoods.map((row: any) => row.bairro || 'Desconhecido');
      const avgDeliveryTime = topNeighborhoods.map((row: any) => Number(row.tempo_medio_entrega) || 0);
      const quantities = topNeighborhoods.map((row: any) => Number(row.qtd_vendas) || 0);

      const baseTheme = getEChartsTheme(theme);
      const option: echarts.EChartsOption = {
        ...baseTheme,
        title: {
          text: 'Tempo Médio de Entrega por Bairro',
          subtext: `Top ${TOP_N} bairros com maior volume de entregas`,
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
            const barParam = params[0];
            const idx = topNeighborhoods.findIndex((n: any) => n.bairro === barParam.name);
            const neighborhood = topNeighborhoods[idx];
            
            return `
              <strong>${barParam.name}</strong><br/>
              Tempo Médio: ${avgDeliveryTime[idx].toFixed(1)} min<br/>
              Entregas: ${quantities[idx].toLocaleString('pt-BR')}<br/>
              ${neighborhood?.isAggregated ? '<em style="color: #999; font-size: 11px;">Agregação de múltiplos bairros</em>' : ''}
            `;
          }
        },
        grid: {
          left: '15%',
          right: '10%',
          top: '15%',
          bottom: '8%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          name: 'Tempo Médio (minutos)',
          nameLocation: 'middle',
          nameGap: 30,
          min: 0,
          axisLabel: {
            formatter: '{value} min'
          },
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed',
              opacity: 0.3
            }
          }
        },
        yAxis: {
          type: 'category',
          data: neighborhoods,
          axisLabel: {
            interval: 0,
            formatter: (value: string) => {
              // Truncate long names
              return value.length > 25 ? value.substring(0, 25) + '...' : value;
            },
            fontSize: 11
          },
          axisTick: {
            show: false
          }
        },
        series: [
          {
            name: 'Tempo Médio de Entrega',
            type: 'bar',
            data: avgDeliveryTime.map((time, idx) => ({
              value: time,
              itemStyle: {
                // Color gradient based on time
                color: time > 45 ? '#d4380d' : time > 35 ? '#fa8c16' : time > 25 ? '#fadb14' : '#52c41a'
              },
              label: {
                show: true,
                position: 'right',
                formatter: (params: any) => {
                  const qty = quantities[idx];
                  return `${params.value.toFixed(1)} min (${qty.toLocaleString('pt-BR')} entregas)`;
                },
                fontSize: 10,
                color: '#666'
              }
            })),
            barMaxWidth: 30,
            barCategoryGap: '25%'
          }
        ],
        animation: true,
        animationDuration: 800,
        animationEasing: 'cubicOut'
      };

      chartInstance.current.setOption(option);

      // Adicionar event listener para drill-down
      chartInstance.current.off('click');
      chartInstance.current.on('click', (params: any) => {
        if (params.componentType === 'series') {
          const neighborhood = topNeighborhoods[neighborhoods.indexOf(params.name)];
          
          // Don't allow drill-down on aggregated "Others"
          if (neighborhood?.isAggregated) {
            return;
          }
          
          setDrillDownContext({
            type: 'neighborhood',
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
      <div ref={chartRef} className="chart-container" style={{ width: '100%', height: '600px', cursor: 'pointer' }} />
      <DrillDownModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        context={drillDownContext}
      />
    </>
  );
};
