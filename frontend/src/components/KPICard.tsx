import React from 'react';
import type { KPICard as KPICardType } from '../types/analytics';

interface KPICardProps {
  kpi: KPICardType;
}

const KPICard: React.FC<KPICardProps> = ({ kpi }) => {
  const formatValue = (value: number | string, format: string): string => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'duration':
        return `${value.toFixed(1)} min`;
      case 'number':
      default:
        return new Intl.NumberFormat('pt-BR').format(value);
    }
  };

  return (
    <div className="kpi-card">
      <div className="kpi-label">{kpi.label}</div>
      <div className="kpi-value">{formatValue(kpi.value, kpi.format)}</div>
      {kpi.change !== undefined && (
        <div className={`kpi-change ${kpi.change >= 0 ? 'positive' : 'negative'}`}>
          {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change).toFixed(1)}%
          {kpi.change_label && <span className="change-label"> {kpi.change_label}</span>}
        </div>
      )}
    </div>
  );
};

export default KPICard;
