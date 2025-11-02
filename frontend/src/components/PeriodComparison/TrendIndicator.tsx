import './TrendIndicator.css';

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'neutral';
  percentage: number;
  size?: 'small' | 'medium' | 'large';
}

export const TrendIndicator = ({ trend, percentage, size = 'medium' }: TrendIndicatorProps) => {
  const getIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const getColor = () => {
    if (trend === 'up') return 'trend-up';
    if (trend === 'down') return 'trend-down';
    return 'trend-neutral';
  };

  return (
    <span className={`trend-indicator ${getColor()} trend-${size}`}>
      <span className="trend-icon">{getIcon()}</span>
      <span className="trend-percentage">{Math.abs(percentage).toFixed(1)}%</span>
    </span>
  );
};
