import { Card, Button, Space, Input, Select, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQueryBuilder } from '../../hooks/useQueryBuilder';
import type { FilterCondition } from '../../hooks/useQueryBuilder';
import './FilterBuilder.css';

const { Option } = Select;

const FILTER_FIELDS = [
  { value: 'total_amount', label: 'Valor Total' },
  { value: 'customer_id', label: 'ID do Cliente' },
  { value: 'channel_id', label: 'ID do Canal' },
  { value: 'store_id', label: 'ID da Loja' },
];

const OPERATORS = [
  { value: '=', label: 'Igual a (=)' },
  { value: '!=', label: 'Diferente de (≠)' },
  { value: '>', label: 'Maior que (>)' },
  { value: '>=', label: 'Maior ou igual (≥)' },
  { value: '<', label: 'Menor que (<)' },
  { value: '<=', label: 'Menor ou igual (≤)' },
  { value: 'LIKE', label: 'Contém (LIKE)' },
];

export const FilterBuilder = () => {
  const { config, addFilter, removeFilter, updateFilter } = useQueryBuilder();

  const handleAddFilter = () => {
    const newFilter: FilterCondition = {
      id: `filter_${Date.now()}`,
      field: 'total_amount',
      operator: '>',
      value: '0',
    };
    addFilter(newFilter);
  };

  return (
    <Card
      title="🔍 Filtros"
      size="small"
      className="filter-builder-card"
      extra={
        <Button
          icon={<PlusOutlined />}
          onClick={handleAddFilter}
          size="small"
          type="dashed"
        >
          Adicionar Filtro
        </Button>
      }
    >
      <div className="filters-container">
        {config.filters.length === 0 ? (
          <div className="empty-state">
            Nenhum filtro configurado. Clique em "Adicionar Filtro" para criar condições.
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {config.filters.map((filter) => (
              <Row key={filter.id} gutter={8} align="middle">
                <Col span={7}>
                  <Select
                    value={filter.field}
                    onChange={(value) => updateFilter(filter.id, { field: value })}
                    style={{ width: '100%' }}
                    size="small"
                  >
                    {FILTER_FIELDS.map((field) => (
                      <Option key={field.value} value={field.value}>
                        {field.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={6}>
                  <Select
                    value={filter.operator}
                    onChange={(value) => updateFilter(filter.id, { operator: value })}
                    style={{ width: '100%' }}
                    size="small"
                  >
                    {OPERATORS.map((op) => (
                      <Option key={op.value} value={op.value}>
                        {op.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={8}>
                  <Input
                    value={filter.value}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                    placeholder="Valor"
                    size="small"
                  />
                </Col>
                <Col span={3}>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={() => removeFilter(filter.id)}
                    danger
                    size="small"
                    type="text"
                  />
                </Col>
              </Row>
            ))}
          </Space>
        )}
      </div>
    </Card>
  );
};
