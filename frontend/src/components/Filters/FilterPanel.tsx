import React from 'react';
import { Card, Space, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import DateRangePicker from './DateRangePicker';
import MultiSelect from './MultiSelect';
import { useFilters } from '../../hooks/useFilters';
import './FilterPanel.css';

const FilterPanel: React.FC = () => {
  const {
    dateRange,
    selectedChannels,
    selectedStores,
    selectedProducts,
    channelOptions,
    storeOptions,
    productOptions,
    setDateRange,
    setSelectedChannels,
    setSelectedStores,
    setSelectedProducts,
    resetFilters,
    isLoading
  } = useFilters();

  return (
    <Card
      title="🔍 Filtros Globais"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={resetFilters}
          disabled={isLoading}
        >
          Resetar
        </Button>
      }
      style={{ marginBottom: '24px' }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Date Range Filter */}
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          disabled={isLoading}
        />

        {/* Channel Filter */}
        <MultiSelect
          label="Canal"
          placeholder="Selecione os canais"
          value={selectedChannels}
          options={channelOptions}
          onChange={setSelectedChannels}
          disabled={isLoading}
        />

        {/* Store Filter */}
        <MultiSelect
          label="Loja"
          placeholder="Selecione as lojas"
          value={selectedStores}
          options={storeOptions}
          onChange={setSelectedStores}
          disabled={isLoading}
        />

        {/* Product Filter */}
        <MultiSelect
          label="Produto"
          placeholder="Selecione os produtos"
          value={selectedProducts}
          options={productOptions}
          onChange={setSelectedProducts}
          disabled={isLoading}
          showSearch
        />
      </Space>
    </Card>
  );
};

export default FilterPanel;
