import { useState } from 'react';
import { Card, Row, Col, Button, DatePicker, Space, Divider, Spin, Alert } from 'antd';
import { SwapOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { ComparisonCard } from './ComparisonCard';
import './PeriodComparison.css';

const { RangePicker } = DatePicker;

interface PeriodComparisonProps {
  defaultBasePeriod?: [Dayjs, Dayjs];
  defaultComparePeriod?: [Dayjs, Dayjs];
}

export const PeriodComparison = ({ 
  defaultBasePeriod = [dayjs('2025-05-13'), dayjs('2025-05-20')],
  defaultComparePeriod = [dayjs('2025-05-05'), dayjs('2025-05-12')]
}: PeriodComparisonProps) => {
  const [basePeriod, setBasePeriod] = useState<[Dayjs, Dayjs]>(defaultBasePeriod);
  const [comparePeriod, setComparePeriod] = useState<[Dayjs, Dayjs]>(defaultComparePeriod);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['period-comparison', basePeriod, comparePeriod],
    queryFn: async () => {
      const params = new URLSearchParams({
        base_start: basePeriod[0].format('YYYY-MM-DD'),
        base_end: basePeriod[1].format('YYYY-MM-DD'),
        compare_start: comparePeriod[0].format('YYYY-MM-DD'),
        compare_end: comparePeriod[1].format('YYYY-MM-DD')
      });

      const response = await fetch(`http://localhost:8000/api/v1/analytics/compare?${params}`);
      if (!response.ok) throw new Error('Failed to fetch comparison data');
      return response.json();
    }
  });

  const handleQuickCompare = (days: number) => {
    const end = dayjs('2025-05-20');
    const start = end.subtract(days - 1, 'day');
    const compareEnd = start.subtract(1, 'day');
    const compareStart = compareEnd.subtract(days - 1, 'day');
    
    setBasePeriod([start, end]);
    setComparePeriod([compareStart, compareEnd]);
  };

  const metricFormats: Record<string, 'currency' | 'number' | 'duration'> = {
    'Faturamento Total': 'currency',
    'Ticket Médio': 'currency',
    'Total de Vendas': 'number',
    'Clientes Únicos': 'number',
    'Tempo Médio de Entrega (min)': 'duration'
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SwapOutlined />
          <span>Comparação de Períodos</span>
        </div>
      }
      extra={
        <Button 
          icon={<ReloadOutlined />} 
          onClick={() => refetch()}
          size="small"
        >
          Atualizar
        </Button>
      }
      className="period-comparison-container"
    >
      {/* Period Selectors */}
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div className="period-selectors">
          <Row gutter={16}>
            <Col span={12}>
              <div className="period-selector">
                <label>Período Atual:</label>
                <RangePicker
                  value={basePeriod}
                  onChange={(dates) => dates && setBasePeriod([dates[0]!, dates[1]!])}
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                />
              </div>
            </Col>
            <Col span={12}>
              <div className="period-selector">
                <label>Período Anterior:</label>
                <RangePicker
                  value={comparePeriod}
                  onChange={(dates) => dates && setComparePeriod([dates[0]!, dates[1]!])}
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                />
              </div>
            </Col>
          </Row>
        </div>

        {/* Quick Compare Buttons */}
        <div className="quick-compare-buttons">
          <Space>
            <Button onClick={() => handleQuickCompare(7)} size="small">
              Últimos 7 dias
            </Button>
            <Button onClick={() => handleQuickCompare(14)} size="small">
              Últimos 14 dias
            </Button>
          </Space>
        </div>

        <Divider />

        {/* Comparison Results */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" tip="Carregando comparação..." />
          </div>
        )}

        {error && (
          <Alert
            message="Erro ao carregar comparação"
            description={error instanceof Error ? error.message : 'Erro desconhecido'}
            type="error"
            showIcon
          />
        )}

        {data && data.comparisons && (
          <Row gutter={[16, 16]}>
            {data.comparisons.map((comparison: any, index: number) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <ComparisonCard
                  comparison={comparison}
                  format={metricFormats[comparison.metric_name] || 'number'}
                />
              </Col>
            ))}
          </Row>
        )}
      </Space>
    </Card>
  );
};
