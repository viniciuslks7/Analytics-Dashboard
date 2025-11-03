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
        return 'semana'; // TO_CHAR(s.created_at, 'IYYY-IW') -> 2025-19
      case 'month':
        return 'mes'; // TO_CHAR(s.created_at, 'YYYY-MM') -> 2025-05
      default:
        return 'data';
    }
  };

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['time-series', selectedMetrics, granularity, JSON.stringify(filters)], // Stringify filters para garantir detecção de mudanças
    queryFn: () => analyticsAPI.query({
      metrics: selectedMetrics,
      dimensions: [getTemporalDimension()],
      filters: filters,
      order_by: [{ field: getTemporalDimension(), direction: 'asc' }],
      limit: 365
    }),
    enabled: selectedMetrics.length > 0,
    refetchOnWindowFocus: false,
    staleTime: 0, // SEM CACHE - sempre buscar dados frescos quando filtros mudarem
    gcTime: 0 // Não manter em cache após desmontagem
  });

  // Debug: log do estado do componente (DEPOIS da declaração do useQuery)
  console.log('🔍 TimeSeriesChart State:', {
    granularity,
    dimension: getTemporalDimension(),
    selectedMetrics,
    filters,
    filtersString: JSON.stringify(filters),
    hasData: !!data,
    isLoading,
    isFetching
  });
  
  // Log tabular dos filtros para facilitar visualização
  if (Object.keys(filters).length > 0) {
    console.table(filters);
  }

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // Mostrar loading no gráfico durante fetch
    if (isFetching && !isLoading) {
      chartInstance.current.showLoading('default', {
        text: 'Atualizando...',
        color: '#1890ff',
        textColor: '#666',
        maskColor: 'rgba(255, 255, 255, 0.4)',
        zlevel: 0
      });
    } else {
      chartInstance.current.hideLoading();
    }

    // Type assertion para garantir que data tem a estrutura esperada
    const queryData = data as any;
    
    console.log('🔍 Query Data State:', {
      hasData: !!queryData,
      hasDataArray: queryData?.data ? true : false,
      isArray: Array.isArray(queryData?.data),
      length: queryData?.data?.length,
      dimension: getTemporalDimension(),
      rawData: queryData
    });
    
    if (queryData?.data && Array.isArray(queryData.data) && queryData.data.length > 0) {
      const dimension = getTemporalDimension();
      const dates = queryData.data.map((row: any) => row[dimension]);
      
      console.log('📊 Time Series Data:', {
        granularity,
        dimension,
        dataLength: queryData.data.length,
        dates: dates, // TODAS as datas (não apenas 5) para debug
        allRows: queryData.data, // TODOS os dados brutos
        firstRow: queryData.data[0],
        selectedMetrics,
        sampleValues: selectedMetrics.map(metric => ({
          metric,
          values: queryData.data.map((row: any) => row[metric]), // TODOS os valores
          nullCount: queryData.data.filter((row: any) => row[metric] === null || row[metric] === undefined).length,
          // Log específico para ticket_medio
          ...(metric === 'ticket_medio' ? {
            rawValues: queryData.data.map((row: any) => ({ date: row[dimension], value: row[metric] })),
            min: Math.min(...queryData.data.map((row: any) => row[metric]).filter((v: any) => v !== null)),
            max: Math.max(...queryData.data.map((row: any) => row[metric]).filter((v: any) => v !== null)),
            avg: queryData.data.reduce((sum: number, row: any) => sum + (row[metric] || 0), 0) / queryData.data.length
          } : {})
        }))
      });
      
      // Log tabular do ticket_medio se estiver selecionado
      if (selectedMetrics.includes('ticket_medio')) {
        const ticketData = queryData.data.map((row: any) => ({
          [dimension]: row[dimension],
          ticket_medio: row.ticket_medio
        }));
        console.log('💰 TICKET MÉDIO DETALHADO:');
        console.table(ticketData);
      }
      
      // Separar métricas por escala
      const countMetrics = ['qtd_vendas', 'clientes_unicos'];
      const timeMetrics = ['tempo_medio_entrega'];
      const ticketMetrics = ['ticket_medio']; // Ticket médio precisa de eixo próprio devido à pequena variação
      
      const series = selectedMetrics.map(metric => {
        const metricConfig = metricsOptions.find(m => m.value === metric);
        const values = queryData.data.map((row: any) => {
          const value = row[metric];
          // Converter para número, tratando null/undefined
          return value !== null && value !== undefined ? Number(value) : null;
        });

        // Determinar qual eixo Y usar
        let yAxisIndex = 0; // Padrão: eixo esquerdo (valores monetários grandes - faturamento)
        if (ticketMetrics.includes(metric)) {
          yAxisIndex = 1; // Eixo direito 1 para ticket médio (pequena variação)
        } else if (countMetrics.includes(metric)) {
          yAxisIndex = 2; // Eixo direito 2 para contagens
        } else if (timeMetrics.includes(metric)) {
          yAxisIndex = 3; // Eixo direito 3 para tempo
        }

        return {
          name: metricConfig?.label || metric,
          type: 'line' as const,
          yAxisIndex: yAxisIndex,
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          connectNulls: true, // Conectar pontos mesmo com valores nulos
          itemStyle: {
            color: metricConfig?.color || '#1890ff',
            borderWidth: 2,
            borderColor: '#fff'
          },
          lineStyle: {
            width: 3,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowBlur: 10,
            shadowOffsetY: 2
          },
          emphasis: {
            focus: 'series' as const,
            lineStyle: {
              width: 4
            },
            itemStyle: {
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            }
          },
          areaStyle: {
            opacity: 0.15
          },
          animation: true,
          animationDelay: (idx: number) => idx * 50 // Animar pontos sequencialmente
        };
      });
      
      // Log das séries criadas (DEPOIS da criação)
      console.log('📈 SÉRIES CRIADAS:', series.map(s => ({
        name: s.name,
        dataPoints: s.data.length,
        yAxisIndex: s.yAxisIndex,
        firstValue: s.data[0],
        lastValue: s.data[s.data.length - 1]
      })));

      const baseTheme = getEChartsTheme(theme);
      const option: echarts.EChartsOption = {
        ...baseTheme,
        animation: true,
        animationDuration: 800,
        animationEasing: 'cubicOut',
        animationThreshold: 2000,
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
            },
            animation: true
          },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#ccc',
          borderWidth: 1,
          textStyle: {
            color: '#333'
          },
          extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 6px;',
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
          right: '25%', // Aumentar para acomodar 4 eixos (3 à direita)
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
            name: 'R$ (Faturamento)',
            position: 'left',
            axisLabel: {
              formatter: (value: number) => {
                if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
                return `R$ ${value.toFixed(0)}`;
              }
            },
            splitLine: {
              show: true,
              lineStyle: {
                type: 'dashed',
                opacity: 0.3
              }
            }
          },
          {
            type: 'value',
            name: 'R$ (Ticket Médio)',
            position: 'right',
            axisLabel: {
              formatter: (value: number) => `R$ ${value.toFixed(0)}`
            },
            splitLine: {
              show: false
            }
          },
          {
            type: 'value',
            name: 'Quantidade',
            position: 'right',
            offset: 80,
            axisLabel: {
              formatter: (value: number) => {
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toFixed(0);
              }
            },
            splitLine: {
              show: false
            }
          },
          {
            type: 'value',
            name: 'Tempo (min)',
            position: 'right',
            offset: 160, // Deslocamento maior para 4 eixos
            axisLabel: {
              formatter: (value: number) => `${value.toFixed(0)} min`
            },
            splitLine: {
              show: false
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

      // notMerge: true força o ECharts a recriar o gráfico com as novas séries
      // replaceMerge: ['series'] substitui completamente o array de séries
      chartInstance.current.setOption(option, {
        notMerge: false,
        replaceMerge: ['series', 'yAxis'] // Substitui séries e eixos completamente
      });
    }

    // Resize handler
    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, selectedMetrics, granularity, theme, isFetching, isLoading]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

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
          {isFetching && !isLoading && (
            <Spin size="small" />
          )}
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
      
      {(() => {
        const queryData = data as any;
        if (queryData?.data && Array.isArray(queryData.data)) {
          if (queryData.data.length === 0) {
            return (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <p>Nenhum dado disponível para o período selecionado</p>
              </div>
            );
          }
          if (queryData.data.length === 1) {
            return (
              <Alert
                message={`Apenas 1 ${granularity === 'day' ? 'dia' : granularity === 'week' ? 'semana' : 'mês'} de dados`}
                description={
                  granularity === 'month' 
                    ? "Os dados disponíveis estão concentrados em um único mês. Para visualizar melhor a tendência, tente usar granularidade 'Por Dia' ou 'Por Semana'."
                    : "Dados insuficientes para gerar gráfico de tendência. Selecione um período maior ou use uma granularidade diferente."
                }
                type="warning"
                showIcon
                style={{ margin: '20px' }}
              />
            );
          }
          if (queryData.data.length < 3) {
            return (
              <div style={{ textAlign: 'center', padding: '10px', color: '#faad14', fontSize: '12px' }}>
                ⚠️ Poucos pontos de dados para esta granularidade ({queryData.data.length} {granularity === 'day' ? 'dias' : granularity === 'week' ? 'semanas' : 'meses'}). Considere usar uma granularidade menor para visualização mais detalhada.
              </div>
            );
          }
        }
        return null;
      })()}
    </Card>
  );
};
