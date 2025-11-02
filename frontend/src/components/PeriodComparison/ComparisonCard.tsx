import { Card, Statistic, Row, Col } from 'antd';
import { TrendIndicator } from './TrendIndicator';
import './ComparisonCard.css';

interface MetricComparison {
  metric_name: string;
  base_value: number;
  compare_value: number;
  absolute_change: number;
  percentage_change: number;
  trend: 'up' | 'down' | 'neutral';
}

interface ComparisonCardProps {
  comparison: MetricComparison;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
}

export const ComparisonCard = ({ comparison, format = 'number' }: ComparisonCardProps) => {
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'duration':
        return `${value.toFixed(1)} min`;
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  return (
    <Card className="comparison-card" size="small">
      <div className="comparison-header">
        <h4>{comparison.metric_name}</h4>
        <TrendIndicator 
          trend={comparison.trend} 
          percentage={comparison.percentage_change}
          size="medium"
        />
      </div>
      
      <Row gutter={16} className="comparison-values">
        <Col span={12}>
          <Statistic
            title="Período Atual"
            value={formatValue(comparison.base_value)}
            valueStyle={{ fontSize: '18px', color: '#1890ff' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Período Anterior"
            value={formatValue(comparison.compare_value)}
            valueStyle={{ fontSize: '18px', color: '#8c8c8c' }}
          />
        </Col>
      </Row>
      
      <div className="comparison-change">
        <span className="change-label">Variação:</span>
        <span className={`change-value ${comparison.trend}`}>
          {formatValue(Math.abs(comparison.absolute_change))}
        </span>
      </div>
    </Card>
  );
};
