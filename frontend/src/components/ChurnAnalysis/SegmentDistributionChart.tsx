import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import * as echarts from 'echarts';
import { useTheme } from '../../hooks/useTheme';
import { getEChartsTheme } from '../../styles/theme';

interface SegmentDistributionChartProps {
  data: Array<{
    segment_name: string;
    customer_count: number;
    avg_monetary: number;
  }>;
  loading?: boolean;
}

export const SegmentDistributionChart = ({ data, loading }: SegmentDistributionChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartRef.current || loading) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (data && data.length > 0) {
      // Aggregate by segment name
      const segmentMap = new Map<string, { count: number; value: number }>();
      
      data.forEach(item => {
        const existing = segmentMap.get(item.segment_name) || { count: 0, value: 0 };
        segmentMap.set(item.segment_name, {
          count: existing.count + item.customer_count,
          value: existing.value + (item.avg_monetary * item.customer_count)
        });
      });

      const pieData = Array.from(segmentMap.entries()).map(([name, stats]) => ({
        name,
        value: stats.count
      }));

      // Color mapping for segments
      const colorMap: Record<string, string> = {
        'Campeões': '#52c41a',
        'Clientes Fiéis': '#73d13d',
        'Promissores': '#95de64',
        'Potenciais': '#fadb14',
        'Em Risco': '#fa8c16',
        'Hibernando': '#d4380d',
        'Perdidos': '#cf1322'
      };

      const baseTheme = getEChartsTheme(theme);
      const option: echarts.EChartsOption = {
        ...baseTheme,
        title: {
          text: 'Distribuição de Segmentos RFM',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            const total = pieData.reduce((sum, item) => sum + item.value, 0);
            const percentage = ((params.value / total) * 100).toFixed(1);
            return `<strong>${params.name}</strong><br/>
                    Clientes: ${params.value.toLocaleString('pt-BR')}<br/>
                    Percentual: ${percentage}%`;
          }
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          itemGap: 12
        },
        series: [
          {
            name: 'Segmentos',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{d}%',
              fontSize: 12
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            data: pieData.map(item => ({
              ...item,
              itemStyle: {
                color: colorMap[item.name] || '#5470c6'
              }
            }))
          }
        ]
      };

      chartInstance.current.setOption(option);
    }

    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [data, loading, theme]);

  return (
    <Card loading={loading} title="Distribuição de Segmentos">
      <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
    </Card>
  );
};
