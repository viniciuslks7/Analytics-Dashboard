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
        symbolSize: (val: number[]) => {
          // Reduced size: sqrt(count) * 2.5 instead of 5 for better clarity
          // Min size: 8, Max size: 40
          const size = Math.sqrt(val[2]) * 2.5;
          return Math.max(8, Math.min(40, size));
        },
        data: points,
        itemStyle: {
          color: colorMap[name] || '#5470c6',
          opacity: 0.8, // Slight transparency for overlapping circles
          borderColor: '#fff',
          borderWidth: 1
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }));

      const baseTheme = getEChartsTheme(theme);
      const isDark = theme === 'dark';
      
      const option: echarts.EChartsOption = {
        ...baseTheme,
        title: {
          text: 'Matriz RFM - Segmentação de Clientes',
          left: 'center',
          textStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: isDark ? '#fff' : '#262626'
          },
          subtext: 'Recência (quão recente) × Frequência (quantas vezes comprou)',
          subtextStyle: {
            fontSize: 12,
            color: isDark ? '#8c8c8c' : '#595959'
          }
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: '#ddd',
          borderWidth: 1,
          textStyle: {
            color: isDark ? '#fff' : '#262626',
            fontSize: 13
          },
          formatter: (params: any) => {
            const [recency, frequency, count, segment] = params.value;
            return `<div style="padding: 4px 8px;">
                      <strong style="font-size: 14px; color: ${colorMap[segment] || '#5470c6'}">${segment}</strong><br/>
                      <span style="display: inline-block; width: 100px;">📅 Recência:</span> <strong>${recency}/5</strong><br/>
                      <span style="display: inline-block; width: 100px;">🔄 Frequência:</span> <strong>${frequency}/5</strong><br/>
                      <span style="display: inline-block; width: 100px;">👥 Clientes:</span> <strong>${count.toLocaleString('pt-BR')}</strong>
                    </div>`;
          }
        },
        legend: {
          data: Array.from(segmentMap.keys()),
          top: 60,
          type: 'scroll',
          textStyle: {
            fontSize: 12,
            color: isDark ? '#d9d9d9' : '#595959'
          },
          selected: Object.fromEntries(
            Array.from(segmentMap.keys()).map(k => [k, true])
          ),
          itemWidth: 16,
          itemHeight: 16
        },
        grid: {
          left: '8%',
          right: '5%',
          bottom: '10%',
          top: '25%',
          containLabel: true,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
          borderColor: isDark ? '#434343' : '#d9d9d9',
          borderWidth: 1
        },
        xAxis: {
          type: 'value',
          name: 'Recência (Score) →',
          nameLocation: 'middle',
          nameGap: 35,
          nameTextStyle: {
            fontSize: 13,
            fontWeight: 'bold',
            color: isDark ? '#d9d9d9' : '#262626'
          },
          min: 0,
          max: 6,
          interval: 1,
          axisLine: {
            lineStyle: {
              color: isDark ? '#434343' : '#d9d9d9',
              width: 2
            }
          },
          axisTick: {
            length: 6
          },
          axisLabel: {
            fontSize: 12,
            color: isDark ? '#bfbfbf' : '#595959',
            formatter: (value: number) => {
              if (value === 0 || value === 6) return '';
              return value.toString();
            }
          },
          splitLine: {
            show: true,
            lineStyle: {
              type: 'solid',
              color: isDark ? '#303030' : '#e8e8e8',
              width: 1,
              opacity: 0.5
            }
          }
        },
        yAxis: {
          type: 'value',
          name: '↑ Frequência (Score)',
          nameLocation: 'middle',
          nameGap: 45,
          nameTextStyle: {
            fontSize: 13,
            fontWeight: 'bold',
            color: isDark ? '#d9d9d9' : '#262626'
          },
          min: 0,
          max: 6,
          interval: 1,
          axisLine: {
            lineStyle: {
              color: isDark ? '#434343' : '#d9d9d9',
              width: 2
            }
          },
          axisTick: {
            length: 6
          },
          axisLabel: {
            fontSize: 12,
            color: isDark ? '#bfbfbf' : '#595959',
            formatter: (value: number) => {
              if (value === 0 || value === 6) return '';
              return value.toString();
            }
          },
          splitLine: {
            show: true,
            lineStyle: {
              type: 'solid',
              color: isDark ? '#303030' : '#e8e8e8',
              width: 1,
              opacity: 0.5
            }
          }
        },
        graphic: [
          // Quadrante: Alto-Direita (Campeões)
          {
            type: 'text',
            left: '82%',
            top: '30%',
            style: {
              text: '🏆 CAMPEÕES\n(Alta Rec. + Alta Freq.)',
              fontSize: 11,
              fontWeight: 'bold',
              fill: isDark ? '#52c41a' : '#389e0d',
              align: 'center' as const,
              opacity: 0.7
            },
            z: 0
          },
          // Quadrante: Alto-Esquerda (Em Risco)
          {
            type: 'text',
            left: '12%',
            top: '30%',
            style: {
              text: '⚠️ EM RISCO\n(Baixa Rec. + Alta Freq.)',
              fontSize: 11,
              fontWeight: 'bold',
              fill: isDark ? '#fa8c16' : '#d46b08',
              align: 'center' as const,
              opacity: 0.7
            },
            z: 0
          },
          // Quadrante: Baixo-Direita (Promissores)
          {
            type: 'text',
            left: '82%',
            top: '72%',
            style: {
              text: '✨ PROMISSORES\n(Alta Rec. + Baixa Freq.)',
              fontSize: 11,
              fontWeight: 'bold',
              fill: isDark ? '#95de64' : '#7cb305',
              align: 'center' as const,
              opacity: 0.7
            },
            z: 0
          },
          // Quadrante: Baixo-Esquerda (Perdidos)
          {
            type: 'text',
            left: '12%',
            top: '72%',
            style: {
              text: '❌ PERDIDOS\n(Baixa Rec. + Baixa Freq.)',
              fontSize: 11,
              fontWeight: 'bold',
              fill: isDark ? '#cf1322' : '#a8071a',
              align: 'center' as const,
              opacity: 0.7
            },
            z: 0
          }
        ] as any,
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut',
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
      <div ref={chartRef} style={{ width: '100%', height: '550px' }} />
      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
        borderRadius: '8px',
        fontSize: '12px',
        lineHeight: '1.8'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' }}>
          📊 Como interpretar a Matriz RFM:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <strong style={{ color: '#52c41a' }}>• Recência (R):</strong> Quão recente foi a última compra
            <br/><span style={{ marginLeft: '12px', opacity: 0.8 }}>Score 5 = Comprou recentemente | Score 1 = Não compra há muito tempo</span>
          </div>
          <div>
            <strong style={{ color: '#1890ff' }}>• Frequência (F):</strong> Quantas vezes o cliente comprou
            <br/><span style={{ marginLeft: '12px', opacity: 0.8 }}>Score 5 = Compra frequentemente | Score 1 = Compra raramente</span>
          </div>
          <div>
            <strong style={{ color: '#faad14' }}>• Tamanho da bolha:</strong> Quantidade de clientes naquele ponto
            <br/><span style={{ marginLeft: '12px', opacity: 0.8 }}>Bolhas maiores = Mais clientes com esse perfil</span>
          </div>
          <div>
            <strong style={{ color: '#722ed1' }}>• Quadrantes:</strong> Áreas estratégicas da matriz
            <br/><span style={{ marginLeft: '12px', opacity: 0.8 }}>Superior direito = Melhores clientes | Inferior esquerdo = Clientes perdidos</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
