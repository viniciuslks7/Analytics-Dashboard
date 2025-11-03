import { Row, Col, Card, Statistic, Spin } from 'antd';
import { ShoppingOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';
import type { DrillDownContext } from './DrillDownModal';
import { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { useTheme } from '../../hooks/useTheme';
import { getEChartsTheme } from '../../styles/theme';

interface DrillDownContentProps {
  context: DrillDownContext;
  onDrillDeeper: (context: DrillDownContext) => void;
}

export const DrillDownContent = ({ context }: DrillDownContentProps) => {
  const { theme } = useTheme();
  
  // Usar useMemo para memoizar os filtros e evitar recriação desnecessária
  const filters = useMemo(() => {
    const baseFilters: Record<string, any> = { ...context.filters };
    
    switch (context.type) {
      case 'channel':
        // Backend espera array para filtros IN
        baseFilters.canal_venda = [context.value];
        break;
      case 'product':
        baseFilters.nome_produto = [context.value];
        break;
      case 'neighborhood':
        baseFilters.bairro = [context.value];
        break;
      case 'segment':
        // Para segmentos, não temos filtro direto, mas podemos mostrar dados gerais
        break;
    }
    
    return baseFilters;
  }, [context.type, context.value, context.filters]);

  // Serializar filtros para usar como chave única
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  // Query para métricas principais
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['drill-down-metrics', context.type, context.value, filtersKey],
    queryFn: async () => {
      const result = await analyticsAPI.query({
        metrics: ['faturamento', 'qtd_vendas', 'ticket_medio', 'clientes_unicos'],
        dimensions: [],
        filters: filters,
      });
      return result;
    },
    staleTime: 0, // Sempre considerar dados como stale para revalidar
    gcTime: 0, // Não manter cache após unmount (cacheTime no React Query v4)
  });

  // Query para produtos (se não for drill-down de produto)
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['drill-down-products', context.type, context.value, filtersKey],
    queryFn: () => analyticsAPI.query({
      metrics: ['qtd_vendas', 'faturamento'],
      dimensions: ['nome_produto'],
      filters: filters,
      order_by: [{ field: 'faturamento', direction: 'desc' }],
      limit: 10,
    }),
    enabled: context.type !== 'product',
    staleTime: 0,
    gcTime: 0,
  });

  // Query para horários de pico
  const { data: hoursData, isLoading: hoursLoading } = useQuery({
    queryKey: ['drill-down-hours', context.type, context.value, filtersKey],
    queryFn: () => analyticsAPI.query({
      metrics: ['qtd_vendas', 'faturamento'],
      dimensions: ['hora'],
      filters: filters,
      order_by: [{ field: 'hora', direction: 'asc' }],
    }),
    staleTime: 0,
    gcTime: 0,
  });

  // Query para evolução temporal
  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['drill-down-timeline', context.type, context.value, filtersKey],
    queryFn: () => analyticsAPI.query({
      metrics: ['faturamento', 'qtd_vendas'],
      dimensions: ['data'],
      filters: filters,
      order_by: [{ field: 'data', direction: 'asc' }],
    }),
    staleTime: 0,
    gcTime: 0,
  });

  const metrics = metricsData?.data?.[0] || {};

  // Gráfico de produtos
  const productsChartRef = useRef<HTMLDivElement>(null);
  const productsChartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (productsLoading || !productsData?.data || productsData.data.length === 0) {
      return;
    }

    // Retry se o ref não estiver pronto ainda
    if (!productsChartRef.current) {
      const timer = setTimeout(() => {
        if (productsChartRef.current && !productsChartInstance.current) {
          productsChartInstance.current = echarts.init(productsChartRef.current);
          const products = productsData.data.map((row: any) => row.nome_produto || 'Desconhecido');
          const values = productsData.data.map((row: any) => Number(row.faturamento) || 0);
          
          const option = {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: products, axisLabel: { rotate: 45, interval: 0 } },
            yAxis: { type: 'value' },
            series: [{ name: 'Faturamento', type: 'bar', data: values, itemStyle: { color: '#1890ff' } }]
          };
          productsChartInstance.current.setOption(option);
        }
      }, 50);
      return () => clearTimeout(timer);
    }

    if (!productsChartInstance.current) {
      productsChartInstance.current = echarts.init(productsChartRef.current);
    }

    const products = productsData.data.map((row: any) => row.nome_produto || 'Desconhecido');
    const values = productsData.data.map((row: any) => Number(row.faturamento) || 0);

    const baseTheme = getEChartsTheme(theme);
    const option: echarts.EChartsOption = {
      ...baseTheme,
      title: {
        text: 'Top 10 Produtos',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const value = params[0].value;
          return `<strong>${params[0].name}</strong><br/>Faturamento: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `R$ ${(value / 1000).toFixed(0)}k`
        }
      },
      yAxis: {
        type: 'category',
        data: products,
        axisLabel: {
          formatter: (value: string) => value.length > 20 ? value.substring(0, 20) + '...' : value
        }
      },
      series: [{
        type: 'bar',
        data: values,
        itemStyle: { color: '#1890ff' }
      }]
    };

    productsChartInstance.current.setOption(option);

    const handleResize = () => productsChartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [productsData, productsLoading, theme]);

  // Gráfico de horários
  const hoursChartRef = useRef<HTMLDivElement>(null);
  const hoursChartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (hoursLoading || !hoursData?.data || hoursData.data.length === 0) {
      return;
    }

    // Retry se o ref não estiver pronto ainda
    if (!hoursChartRef.current) {
      const timer = setTimeout(() => {
        if (hoursChartRef.current && !hoursChartInstance.current) {
          hoursChartInstance.current = echarts.init(hoursChartRef.current);
          const hours = hoursData.data.map((row: any) => `${row.hora}h`);
          const quantities = hoursData.data.map((row: any) => Number(row.qtd_vendas) || 0);
          
          const option = {
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: hours },
            yAxis: { type: 'value' },
            series: [{ name: 'Quantidade', type: 'line', data: quantities, smooth: true, itemStyle: { color: '#52c41a' } }]
          };
          hoursChartInstance.current.setOption(option);
        }
      }, 50);
      return () => clearTimeout(timer);
    }

    if (!hoursChartInstance.current) {
      hoursChartInstance.current = echarts.init(hoursChartRef.current);
    }

    const hours = hoursData.data.map((row: any) => `${row.hora}h`);
    const quantities = hoursData.data.map((row: any) => Number(row.qtd_vendas) || 0);

    const baseTheme = getEChartsTheme(theme);
    const option: echarts.EChartsOption = {
      ...baseTheme,
      title: {
        text: 'Vendas por Hora do Dia',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          return `<strong>${params[0].name}</strong><br/>Vendas: ${params[0].value}`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: hours,
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        type: 'line',
        data: quantities,
        smooth: true,
        itemStyle: { color: '#52c41a' },
        areaStyle: { opacity: 0.3 }
      }]
    };

    hoursChartInstance.current.setOption(option);

    const handleResize = () => hoursChartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [hoursData, hoursLoading, theme]);

  // Gráfico de timeline
  const timelineChartRef = useRef<HTMLDivElement>(null);
  const timelineChartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (timelineLoading || !timelineData?.data || timelineData.data.length === 0) {
      return;
    }

    // Retry se o ref não estiver pronto ainda
    if (!timelineChartRef.current) {
      const timer = setTimeout(() => {
        if (timelineChartRef.current && !timelineChartInstance.current) {
          timelineChartInstance.current = echarts.init(timelineChartRef.current);
          const dates = timelineData.data.map((row: any) => {
            const dateValue = row.data_venda || row.data || row.created_at;
            if (!dateValue) return 'Data inválida';
            try {
              return new Date(dateValue).toLocaleDateString('pt-BR');
            } catch {
              return 'Data inválida';
            }
          });
          const revenues = timelineData.data.map((row: any) => Number(row.faturamento) || 0);
          const quantities = timelineData.data.map((row: any) => Number(row.qtd_vendas) || 0);
          
          const option = {
            tooltip: { trigger: 'axis' },
            legend: { data: ['Faturamento', 'Quantidade'] },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: dates, axisLabel: { rotate: 45 } },
            yAxis: [
              { type: 'value', name: 'Faturamento', position: 'left' },
              { type: 'value', name: 'Quantidade', position: 'right' }
            ],
            series: [
              { name: 'Faturamento', type: 'line', data: revenues, smooth: true, itemStyle: { color: '#1890ff' } },
              { name: 'Quantidade', type: 'line', data: quantities, smooth: true, yAxisIndex: 1, itemStyle: { color: '#52c41a' } }
            ]
          };
          timelineChartInstance.current.setOption(option);
        }
      }, 50);
      return () => clearTimeout(timer);
    }

    if (!timelineChartInstance.current) {
      timelineChartInstance.current = echarts.init(timelineChartRef.current);
    }

    const dates = timelineData.data.map((row: any) => {
      const dateValue = row.data_venda || row.data || row.created_at;
      if (!dateValue) return 'Data inválida';
      try {
        return new Date(dateValue).toLocaleDateString('pt-BR');
      } catch {
        return 'Data inválida';
      }
    });
    const revenues = timelineData.data.map((row: any) => Number(row.faturamento) || 0);
    const quantities = timelineData.data.map((row: any) => Number(row.qtd_vendas) || 0);

    const baseTheme = getEChartsTheme(theme);
    const option: echarts.EChartsOption = {
      ...baseTheme,
      title: {
        text: 'Evolução Temporal',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['Faturamento', 'Quantidade'],
        bottom: 0
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { rotate: 45 }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Faturamento',
          axisLabel: {
            formatter: (value: number) => `R$ ${(value / 1000).toFixed(0)}k`
          }
        },
        {
          type: 'value',
          name: 'Quantidade'
        }
      ],
      series: [
        {
          name: 'Faturamento',
          type: 'line',
          data: revenues,
          smooth: true,
          itemStyle: { color: '#1890ff' }
        },
        {
          name: 'Quantidade',
          type: 'bar',
          yAxisIndex: 1,
          data: quantities,
          itemStyle: { color: '#52c41a' }
        }
      ]
    };

    timelineChartInstance.current.setOption(option);

    const handleResize = () => timelineChartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [timelineData, timelineLoading, theme]);

  // Cleanup dos gráficos quando o componente desmonta
  useEffect(() => {
    return () => {
      if (productsChartInstance.current) {
        productsChartInstance.current.dispose();
        productsChartInstance.current = null;
      }
      if (hoursChartInstance.current) {
        hoursChartInstance.current.dispose();
        hoursChartInstance.current = null;
      }
      if (timelineChartInstance.current) {
        timelineChartInstance.current.dispose();
        timelineChartInstance.current = null;
      }
    };
  }, []);

  if (metricsLoading) {
    return <Spin tip="Carregando dados detalhados..." style={{ display: 'block', textAlign: 'center', padding: '50px' }} />;
  }

  return (
    <div className="drill-down-content">
      {/* KPIs Principais */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Faturamento Total"
              value={Number(metrics.faturamento) || 0}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Quantidade de Vendas"
              value={Number(metrics.qtd_vendas) || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Ticket Médio"
              value={Number(metrics.ticket_medio) || 0}
              precision={2}
              prefix="R$"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Clientes Únicos"
              value={Number(metrics.clientes_unicos) || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gráficos */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Evolução ao Longo do Tempo" loading={timelineLoading}>
            <div ref={timelineChartRef} style={{ height: '300px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Horários de Pico" loading={hoursLoading}>
            <div ref={hoursChartRef} style={{ height: '300px' }} />
          </Card>
        </Col>
      </Row>

      {context.type !== 'product' && (
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24}>
            <Card title="Produtos Mais Vendidos" loading={productsLoading}>
              <div ref={productsChartRef} style={{ height: '400px' }} />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};
