import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';

export const DeliveryMetricsChart = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery-metrics'],
    queryFn: () => analyticsAPI.query({
      metrics: ['tempo_medio_entrega', 'qtd_vendas'],
      dimensions: ['bairro'],
      filters: [],
      order_by: [{ field: 'tempo_medio_entrega', direction: 'desc' }],
      limit: 15
    }),
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (data?.data && data.data.length > 0) {
      const neighborhoods = data.data.map((row: any) => row.bairro || 'Desconhecido');
      const avgDeliveryTime = data.data.map((row: any) => Number(row.tempo_medio_entrega) || 0);
      const quantities = data.data.map((row: any) => Number(row.qtd_vendas) || 0);

      const option: echarts.EChartsOption = {
        title: {
          text: 'Tempo Médio de Entrega por Bairro',
          subtext: 'Top 15 bairros com maior tempo de entrega',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            crossStyle: {
              color: '#999'
            }
          },
          formatter: (params: any) => {
            const tempo = params[0];
            const qtd = params[1];
            return `
              <strong>${tempo.name}</strong><br/>
              ${tempo.seriesName}: ${tempo.value.toFixed(1)} min<br/>
              ${qtd.seriesName}: ${qtd.value.toLocaleString('pt-BR')}
            `;
          }
        },
        legend: {
          data: ['Tempo Médio (min)', 'Quantidade de Entregas'],
          top: 50
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: [
          {
            type: 'category',
            data: neighborhoods,
            axisPointer: {
              type: 'shadow'
            },
            axisLabel: {
              rotate: 45,
              interval: 0,
              formatter: (value: string) => {
                return value.length > 15 ? value.substring(0, 15) + '...' : value;
              }
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: 'Tempo (min)',
            min: 0,
            axisLabel: {
              formatter: '{value} min'
            }
          },
          {
            type: 'value',
            name: 'Quantidade',
            min: 0,
            axisLabel: {
              formatter: '{value}'
            }
          }
        ],
        series: [
          {
            name: 'Tempo Médio (min)',
            type: 'bar',
            data: avgDeliveryTime,
            itemStyle: {
              color: '#ee6666'
            },
            label: {
              show: true,
              position: 'top',
              formatter: '{c} min'
            }
          },
          {
            name: 'Quantidade de Entregas',
            type: 'line',
            yAxisIndex: 1,
            data: quantities,
            itemStyle: {
              color: '#5470c6'
            },
            lineStyle: {
              width: 2
            },
            symbolSize: 8
          }
        ]
      };

      chartInstance.current.setOption(option);
    }

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

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

  return <div ref={chartRef} className="chart-container" style={{ width: '100%', height: '500px' }} />;
};
