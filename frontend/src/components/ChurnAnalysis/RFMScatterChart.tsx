import { useEffect, useRef } from 'react';
import { Card } from 'antd';
import * as echarts from 'echarts';
import { useTheme } from '../../hooks/useTheme';
import { getEChartsTheme } from '../../styles/theme';

interface RFMScatterChartProps {
  data: Array<{
    recency_score: number;
    frequency_score: number;
    monetary_score: number;
    customer_count: number;
    segment_name: string;
  }>;
  loading?: boolean;
}

export const RFMScatterChart = ({ data, loading }: RFMScatterChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartRef.current || loading) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (data && data.length > 0) {
      // Group by segment
      const segmentMap = new Map<string, Array<[number, number, number, string]>>();
      
      data.forEach(item => {
        if (!segmentMap.has(item.segment_name)) {
          segmentMap.set(item.segment_name, []);
        }
        segmentMap.get(item.segment_name)!.push([
          item.recency_score,
          item.frequency_score,
          item.customer_count,
          item.segment_name
        ]);
      });

      // Color mapping
      const colorMap: Record<string, string> = {
        'Campeões': '#52c41a',
        'Clientes Fiéis': '#73d13d',
        'Promissores': '#95de64',
        'Potenciais': '#fadb14',
        'Em Risco': '#fa8c16',
        'Hibernando': '#d4380d',
        'Perdidos': '#cf1322'
      };

      const series = Array.from(segmentMap.entries()).map(([name, points]) => ({
        name,
        type: 'scatter' as const,
        symbolSize: (val: number[]) => Math.sqrt(val[2]) * 5, // Size based on customer count
        data: points,
        itemStyle: {
          color: colorMap[name] || '#5470c6'
        }
      }));

      const baseTheme = getEChartsTheme(theme);
      const option: echarts.EChartsOption = {
        ...baseTheme,
        title: {
          text: 'Matriz RFM - Recência vs Frequência',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            const [recency, frequency, count, segment] = params.value;
            return `<strong>${segment}</strong><br/>
                    Recência: ${recency}<br/>
                    Frequência: ${frequency}<br/>
                    Clientes: ${count.toLocaleString('pt-BR')}`;
          }
        },
        legend: {
          data: Array.from(segmentMap.keys()),
          top: 35,
          type: 'scroll'
        },
        grid: {
          left: '8%',
          right: '4%',
          bottom: '12%',
          top: '18%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          name: 'Recência (Score)',
          nameLocation: 'middle',
          nameGap: 30,
          min: 0,
          max: 5,
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        yAxis: {
          type: 'value',
          name: 'Frequência (Score)',
          nameLocation: 'middle',
          nameGap: 40,
          min: 0,
          max: 5,
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        series: series
      };

      chartInstance.current.setOption(option);
    }

    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [data, loading, theme]);

  return (
    <Card loading={loading} title="Matriz RFM">
      <div ref={chartRef} style={{ width: '100%', height: '500px' }} />
      <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
        <strong>Legenda:</strong> Tamanho das bolhas = Quantidade de clientes | 
        Eixo X = Recência (quanto maior, mais recente) | 
        Eixo Y = Frequência (quanto maior, mais frequente)
      </div>
    </Card>
  );
};
