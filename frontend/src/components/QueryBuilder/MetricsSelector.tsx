import { Card, Select, Space, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQueryBuilder } from '../../hooks/useQueryBuilder';
import './MetricsSelector.css';

const { Option } = Select;

const AVAILABLE_METRICS = [
  { value: 'faturamento', label: 'Faturamento Total', color: '#1890ff' },
  { value: 'ticket_medio', label: 'Ticket Médio', color: '#52c41a' },
  { value: 'qtd_vendas', label: 'Quantidade de Vendas', color: '#faad14' },
  { value: 'qtd_produtos', label: 'Quantidade de Produtos', color: '#722ed1' },
  { value: 'clientes_unicos', label: 'Clientes Únicos', color: '#eb2f96' },
  { value: 'tempo_medio_entrega', label: 'Tempo Médio de Entrega', color: '#13c2c2' },
  { value: 'tempo_medio_preparo', label: 'Tempo Médio de Preparo', color: '#fa8c16' },
  { value: 'valor_total_desconto', label: 'Total de Descontos', color: '#f5222d' },
];

export const MetricsSelector = () => {
  const { config, setMetrics } = useQueryBuilder();

  const handleAdd = (value: string | undefined) => {
    if (value && !config.metrics.includes(value)) {
      setMetrics([...config.metrics, value]);
    }
  };

  const handleRemove = (value: string) => {
    setMetrics(config.metrics.filter((m) => m !== value));
  };

  const availableOptions = AVAILABLE_METRICS.filter(
    (m) => !config.metrics.includes(m.value)
  );

  return (
    <Card
      title="📊 Métricas"
      size="small"
      className="metrics-selector-card"
      extra={
        <Select
          placeholder="Adicionar métrica"
          style={{ width: 200 }}
          onSelect={handleAdd}
          value={undefined}
          suffixIcon={<PlusOutlined />}
        >
          {availableOptions.map((metric) => (
            <Option key={metric.value} value={metric.value}>
              {metric.label}
            </Option>
          ))}
        </Select>
      }
    >
      <div className="selected-metrics">
        {config.metrics.length === 0 ? (
          <div className="empty-state">
            Nenhuma métrica selecionada. Adicione pelo menos uma métrica.
          </div>
        ) : (
          <Space wrap>
            {config.metrics.map((metric) => {
              const metricInfo = AVAILABLE_METRICS.find((m) => m.value === metric);
              return (
                <Tag
                  key={metric}
                  color={metricInfo?.color || 'default'}
                  closable
                  onClose={() => handleRemove(metric)}
                  icon={<DeleteOutlined />}
                  style={{ fontSize: '13px', padding: '4px 8px' }}
                >
                  {metricInfo?.label || metric}
                </Tag>
              );
            })}
          </Space>
        )}
      </div>
    </Card>
  );
};
