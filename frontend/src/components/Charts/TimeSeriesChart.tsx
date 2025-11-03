import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';
import { Card, Select, Spin, Alert, Button, Space } from 'antd';
import { LineChartOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTheme } from '../../hooks/useTheme';
import { getEChartsTheme } from '../../styles/theme';
import './TimeSeriesChart.css';

const { Option } = Select;

interface TimeSeriesChartProps {
  filters?: Record<string, any>;
}

export const TimeSeriesChart = ({ filters = {} }: TimeSeriesChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { theme } = useTheme();
  
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['faturamento', 'qtd_vendas']);
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');

  const metricsOptions = [
    { value: 'faturamento', label: 'Faturamento', color: '#1890ff' },
    { value: 'qtd_vendas', label: 'Quantidade de Vendas', color: '#52c41a' },
    { value: 'ticket_medio', label: 'Ticket Médio', color: '#faad14' },
    { value: 'clientes_unicos', label: 'Clientes Únicos', color: '#722ed1' },
    { value: 'tempo_medio_entrega', label: 'Tempo Médio de Entrega', color: '#eb2f96' },
  ];

  // Mapeamento para agregação temporal correta
  const getTemporalDimension = () => {
    switch (granularity) {
      case 'day':
        return 'data';
      case 'week':
        return 'semana'; // EXTRACT(WEEK FROM created_at)
      case 'month':
        return 'mes';
      default:
        return 'data';
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['time-series', selectedMetrics, granularity, filters],
    queryFn: () => analyticsAPI.query({
      metrics: selectedMetrics,
      dimensions: [getTemporalDimension()],
      filters: filters,
      order_by: [{ field: getTemporalDimension(), direction: 'asc' }],
      limit: 365
    }),
    enabled: selectedMetrics.length > 0
  });

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    if (data?.data && data.data.length > 0) {
      const dimension = getTemporalDimension();
      const dates = data.data.map((row: any) => row[dimension]);
      
      console.log('📊 Time Series Data:', {
        granularity,
        dimension,
        dataLength: data.data.length,
        dates: dates,
        firstRow: data.data[0]
      });
      
      // Separar métricas por escala
      const monetaryMetrics = ['faturamento', 'ticket_medio'];
      const countMetrics = ['qtd_vendas', 'clientes_unicos'];
      const timeMetrics = ['tempo_medio_entrega'];
      
      const series = selectedMetrics.map(metric => {
        const metricConfig = metricsOptions.find(m => m.value === metric);
        const values = data.data.map((row: any) => Number(row[metric]) || 0);

        // Determinar qual eixo Y usar
        let yAxisIndex = 0; // Padrão: eixo esquerdo (valores monetários/grandes)
        if (countMetrics.includes(metric) || timeMetrics.includes(metric)) {
          yAxisIndex = 1; // Eixo direito para contagens e tempo
        }

        return {
          name: metricConfig?.label || metric,
          type: 'line' as const,
          yAxisIndex: yAxisIndex,
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: metricConfig?.color || '#1890ff'
          },
          lineStyle: {
            width: 2
          },
          areaStyle: {
            opacity: 0.1
          }
        };
      });

      const baseTheme = getEChartsTheme(theme);
      const option: echarts.EChartsOption = {
        ...baseTheme,
        title: {
          text: 'Evolução Temporal',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          },
          formatter: (params: any) => {
            let tooltipContent = `<strong>${params[0].axisValue}</strong><br/>`;
            params.forEach((param: any) => {
              const value = param.value;
              const formattedValue = param.seriesName.includes('Faturamento') || param.seriesName.includes('Ticket')
                ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : param.seriesName.includes('Tempo')
                ? `${value.toFixed(1)} min`
                : value.toLocaleString('pt-BR');
              tooltipContent += `${param.marker} ${param.seriesName}: ${formattedValue}<br/>`;
            });
            return tooltipContent;
          }
        },
        legend: {
          data: series.map(s => s.name),
          bottom: 10,
          type: 'scroll'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        toolbox: {
          feature: {
            saveAsImage: {
              title: 'Salvar como PNG',
              name: 'evolucao-temporal'
            },
            dataZoom: {
              yAxisIndex: 'none',
              title: {
                zoom: 'Zoom',
                back: 'Resetar'
              }
            },
            restore: {
              title: 'Restaurar'
            }
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLabel: {
            rotate: 45,
            formatter: (value: string) => {
              if (granularity === 'day' && value.includes('-')) {
                // Formato: 2025-05-05
                return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              } else if (granularity === 'week') {
                // Formato: 2025-19 (semana)
                return `Sem ${value.split('-')[1]}`;
              } else if (granularity === 'month') {
                // Formato: 2025-05 (mês)
                const [year, month] = value.split('-');
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                return `${monthNames[parseInt(month) - 1]}/${year}`;
              }
              return value;
            }
          }
        },
        yAxis: [
          {
            type: 'value',
            name: 'R$ (Faturamento/Ticket)',
            position: 'left',
            axisLabel: {
              formatter: (value: number) => {
                if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
                return `R$ ${value.toFixed(0)}`;
              }
            }
          },
          {
            type: 'value',
            name: 'Quantidade',
            position: 'right',
            axisLabel: {
              formatter: (value: number) => {
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toFixed(0);
              }
            }
          }
        ],
        dataZoom: [
          {
            type: 'inside',
            start: 0,
            end: 100
          },
          {
            start: 0,
            end: 100
          }
        ],
        series: series
      };

      chartInstance.current.setOption(option);
    }

    // Resize handler
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, selectedMetrics, granularity, theme]);

  const handleExport = () => {
    if (chartInstance.current) {
      const url = chartInstance.current.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      const link = document.createElement('a');
      link.href = url;
      link.download = `evolucao-temporal-${new Date().getTime()}.png`;
      link.click();
    }
  };

  if (isLoading) {
    return (
      <Card className="time-series-card">
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Spin size="large" tip="Carregando dados temporais..." />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="time-series-card">
        <Alert
          message="Erro ao carregar dados"
          description={error instanceof Error ? error.message : 'Erro desconhecido'}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card
      className="time-series-card"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LineChartOutlined />
          <span>Gráfico de Linha Temporal</span>
        </div>
      }
      extra={
        <Space>
          <Select
            mode="multiple"
            placeholder="Selecione métricas"
            value={selectedMetrics}
            onChange={setSelectedMetrics}
            style={{ minWidth: 250 }}
            maxTagCount="responsive"
          >
            {metricsOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
          <Select
            value={granularity}
            onChange={setGranularity}
            style={{ width: 120 }}
          >
            <Option value="day">Por Dia</Option>
            <Option value="week">Por Semana</Option>
            <Option value="month">Por Mês</Option>
          </Select>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            size="small"
          >
            Exportar
          </Button>
        </Space>
      }
    >
      <div ref={chartRef} style={{ width: '100%', height: '500px' }} />
      
      {data?.data && data.data.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>Nenhum dado disponível para o período selecionado</p>
        </div>
      )}
      
      {data?.data && data.data.length > 0 && data.data.length < 3 && (
        <div style={{ textAlign: 'center', padding: '10px', color: '#faad14', fontSize: '12px' }}>
          ⚠️ Poucos pontos de dados para esta granularidade ({data.data.length} {granularity === 'day' ? 'dias' : granularity === 'week' ? 'semanas' : 'meses'})
        </div>
      )}
    </Card>
  );
};
