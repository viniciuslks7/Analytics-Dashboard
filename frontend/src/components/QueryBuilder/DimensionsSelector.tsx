import { Card, Select, Space, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQueryBuilder } from '../../hooks/useQueryBuilder';
import './DimensionsSelector.css';

const { Option } = Select;

const AVAILABLE_DIMENSIONS = [
  { value: 'data', label: 'Data', color: '#1890ff' },
  { value: 'semana', label: 'Semana', color: '#096dd9' },
  { value: 'mes', label: 'Mês', color: '#0050b3' },
  { value: 'canal_venda', label: 'Canal de Venda', color: '#52c41a' },
  { value: 'nome_loja', label: 'Loja', color: '#faad14' },
  { value: 'hora', label: 'Hora do Dia', color: '#722ed1' },
  { value: 'dia_semana', label: 'Dia da Semana', color: '#eb2f96' },
  { value: 'periodo_dia', label: 'Período do Dia', color: '#13c2c2' },
];

export const DimensionsSelector = () => {
  const { config, setDimensions } = useQueryBuilder();

  const handleAdd = (value: string | undefined) => {
    if (value && !config.dimensions.includes(value)) {
      setDimensions([...config.dimensions, value]);
    }
  };

  const handleRemove = (value: string) => {
    setDimensions(config.dimensions.filter((d) => d !== value));
  };

  const availableOptions = AVAILABLE_DIMENSIONS.filter(
    (d) => !config.dimensions.includes(d.value)
  );

  return (
    <Card
      title="📁 Dimensões (Agrupar por)"
      size="small"
      className="dimensions-selector-card"
      extra={
        <Select
          placeholder="Adicionar dimensão"
          style={{ width: 200 }}
          onSelect={handleAdd}
          value={undefined}
          suffixIcon={<PlusOutlined />}
        >
          {availableOptions.map((dimension) => (
            <Option key={dimension.value} value={dimension.value}>
              {dimension.label}
            </Option>
          ))}
        </Select>
      }
    >
      <div className="selected-dimensions">
        {config.dimensions.length === 0 ? (
          <div className="empty-state">
            Nenhuma dimensão selecionada. Adicione dimensões para agrupar os dados.
          </div>
        ) : (
          <Space wrap>
            {config.dimensions.map((dimension) => {
              const dimensionInfo = AVAILABLE_DIMENSIONS.find((d) => d.value === dimension);
              return (
                <Tag
                  key={dimension}
                  color={dimensionInfo?.color || 'default'}
                  closable
                  onClose={() => handleRemove(dimension)}
                  icon={<DeleteOutlined />}
                  style={{ fontSize: '13px', padding: '4px 8px' }}
                >
                  {dimensionInfo?.label || dimension}
                </Tag>
              );
            })}
          </Space>
        )}
      </div>
    </Card>
  );
};
