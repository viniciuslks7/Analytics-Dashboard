import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import * as echarts from 'echarts';

interface ChurnTrendChartProps {
  data: Array<{
    date: string;
    active_customers: number;
    churned_customers: number;
    churn_rate: number;
  }>;
  loading?: boolean;
  granularity: string;
}

export const ChurnTrendChart = ({ data, loading, granularity }: ChurnTrendChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || loading) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (data && data.length > 0) {
      const dates = data.map(d => new Date(d.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: granularity === 'month' ? 'numeric' : '2-digit'
      }));
      const activeCustomers = data.map(d => d.active_customers);
      const churnedCustomers = data.map(d => d.churned_customers);
      const churnRate = data.map(d => d.churn_rate);

      const option: echarts.EChartsOption = {
        title: {
          text: 'Tendência de Churn ao Longo do Tempo',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['Clientes Ativos', 'Clientes Churned', 'Taxa de Churn (%)'],
          top: 30
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates,
          boundaryGap: false
        },
        yAxis: [
          {
            type: 'value',
            name: 'Clientes',
            position: 'left'
          },
          {
            type: 'value',
            name: 'Taxa de Churn (%)',
            position: 'right',
            axisLabel: {
              formatter: '{value}%'
            }
          }
        ],
        series: [
          {
            name: 'Clientes Ativos',
            type: 'line',
            data: activeCustomers,
            smooth: true,
            itemStyle: {
              color: '#52c41a'
            },
            areaStyle: {
              color: 'rgba(82, 196, 26, 0.1)'
            }
          },
          {
            name: 'Clientes Churned',
            type: 'line',
            data: churnedCustomers,
            smooth: true,
            itemStyle: {
              color: '#cf1322'
            },
            areaStyle: {
              color: 'rgba(207, 19, 34, 0.1)'
            }
          },
          {
            name: 'Taxa de Churn (%)',
            type: 'line',
            yAxisIndex: 1,
            data: churnRate,
            smooth: true,
            itemStyle: {
              color: '#fa8c16'
            },
            lineStyle: {
              width: 3,
              type: 'dashed'
            }
          }
        ]
      };

      chartInstance.current.setOption(option);
    }

    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [data, loading, granularity]);

  return (
    <Card loading={loading} title="Tendência de Churn">
      <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
    </Card>
  );
};
