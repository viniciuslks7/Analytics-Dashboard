import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';

interface HourlyHeatmapProps {
  filters?: Record<string, any>;
}

export const HourlyHeatmap = ({ filters = {} }: HourlyHeatmapProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['hourly-heatmap', filters],
    queryFn: () => analyticsAPI.query({
      metrics: ['qtd_vendas'],
      dimensions: ['hora', 'dia_semana'],
      filters: filters,
      order_by: [{ field: 'hora', direction: 'asc' }],
      limit: 200
    }),
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (data?.data && data.data.length > 0) {
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const horas = Array.from({ length: 24 }, (_, i) => `${i}h`);

      // Criar matriz de dados [hora, dia_semana, qtd_vendas]
      const heatmapData: [number, number, number][] = [];
      const dataMap: Record<string, number> = {};

      data.data.forEach((row: any) => {
        const hora = Number(row.hora) || 0;
        const diaSemana = Number(row.dia_semana) || 0;
        const qtd = Number(row.qtd_vendas) || 0;
        const key = `${hora}-${diaSemana}`;
        dataMap[key] = qtd;
      });

      // Preencher matriz completa (24 horas x 7 dias)
      for (let h = 0; h < 24; h++) {
        for (let d = 0; d < 7; d++) {
          const key = `${h}-${d}`;
          const value = dataMap[key] || 0;
          heatmapData.push([h, d, value]);
        }
      }

      const maxValue = Math.max(...heatmapData.map(item => item[2]));

      const option: echarts.EChartsOption = {
        title: {
          text: 'Vendas por Hora e Dia da Semana',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
          }
        },
        tooltip: {
          position: 'top',
          formatter: (params: any) => {
            const hora = params.data[0];
            const dia = params.data[1];
            const qtd = params.data[2];
            return `
              <strong>${diasSemana[dia]}, ${hora}h</strong><br/>
              Vendas: ${qtd.toLocaleString('pt-BR')}
            `;
          }
        },
        grid: {
          height: '60%',
          top: '15%',
          left: '10%',
          right: '5%'
        },
        xAxis: {
          type: 'category',
          data: horas,
          splitArea: {
            show: true
          },
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'category',
          data: diasSemana,
          splitArea: {
            show: true
          }
        },
        visualMap: {
          min: 0,
          max: maxValue,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
          inRange: {
            color: ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']
          }
        },
        series: [
          {
            name: 'Vendas',
            type: 'heatmap',
            data: heatmapData,
            label: {
              show: false
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
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
