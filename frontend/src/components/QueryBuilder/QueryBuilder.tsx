import { useState } from 'react';
import { Card, Button, Space, Row, Col, Spin, Alert, InputNumber, Select } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, SaveOutlined, FolderOpenOutlined, LockOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';
import { useQueryBuilder } from '../../hooks/useQueryBuilder';
import { MetricsSelector } from './MetricsSelector';
import { DimensionsSelector } from './DimensionsSelector';
import { FilterBuilder } from './FilterBuilder';
import { QueryPreview } from './QueryPreview';
import './QueryBuilder.css';

const { Option } = Select;

export const QueryBuilder = () => {
  const { config, setOrderBy, setLimit, resetConfig, loadConfig } = useQueryBuilder();
  const [executeQuery, setExecuteQuery] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['query-builder-result', config],
    queryFn: () => {
      // Security: Only send predefined fields, never raw SQL
      // Backend validates metrics and dimensions against whitelist
      const apiFilters = config.filters.reduce((acc, filter) => {
        // Simple conversion - backend handles validation
        acc[filter.field] = filter.value;
        return acc;
      }, {} as Record<string, any>);

      return analyticsAPI.query({
        metrics: config.metrics,
        dimensions: config.dimensions,
        filters: apiFilters,
        order_by: config.orderBy,
        limit: Math.min(config.limit, 1000), // Hard limit
      });
    },
    enabled: executeQuery && config.metrics.length > 0,
  });

  const handleExecute = () => {
    setExecuteQuery(true);
    refetch();
  };

  const handleSave = () => {
    const configStr = JSON.stringify(config);
    localStorage.setItem('savedQuery', configStr);
    alert('Query salva com sucesso!');
  };

  const handleLoad = () => {
    const configStr = localStorage.getItem('savedQuery');
    if (configStr) {
      const savedConfig = JSON.parse(configStr);
      loadConfig(savedConfig);
      alert('Query carregada com sucesso!');
    } else {
      alert('Nenhuma query salva encontrada');
    }
  };

  return (
    <div className="query-builder-container">
      {/* Security Notice */}
      <Alert
        message={
          <span>
            <LockOutlined /> Segurança Ativada
          </span>
        }
        description="Este Query Builder usa apenas métricas e dimensões pré-definidas. Queries SQL arbitrárias não são permitidas, garantindo segurança contra SQL injection."
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />
      
      <Card
        title="🔧 Query Builder - Construtor de Consultas"
        className="query-builder-card"
        extra={
          <Space>
            <Button icon={<SaveOutlined />} onClick={handleSave} size="small">
              Salvar
            </Button>
            <Button icon={<FolderOpenOutlined />} onClick={handleLoad} size="small">
              Carregar
            </Button>
            <Button icon={<ReloadOutlined />} onClick={resetConfig} size="small">
              Resetar
            </Button>
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={12}>
            <MetricsSelector />
            <DimensionsSelector />
            <FilterBuilder />
            
            {/* Order By and Limit */}
            <Card title="⚙️ Configurações Adicionais" size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
                    Ordenar por:
                  </label>
                  <Space>
                    <Select
                      value={config.orderBy[0]?.field || 'faturamento'}
                      onChange={(field) => setOrderBy([{ field, direction: config.orderBy[0]?.direction || 'desc' }])}
                      style={{ width: 200 }}
                      size="small"
                    >
                      {[...config.metrics, ...config.dimensions].map((field) => (
                        <Option key={field} value={field}>
                          {field}
                        </Option>
                      ))}
                    </Select>
                    <Select
                      value={config.orderBy[0]?.direction || 'desc'}
                      onChange={(direction: 'asc' | 'desc') => 
                        setOrderBy([{ field: config.orderBy[0]?.field || 'faturamento', direction }])
                      }
                      style={{ width: 120 }}
                      size="small"
                    >
                      <Option value="asc">Crescente ↑</Option>
                      <Option value="desc">Decrescente ↓</Option>
                    </Select>
                  </Space>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
                    Limite de registros:
                  </label>
                  <InputNumber
                    value={config.limit}
                    onChange={(value) => setLimit(value || 100)}
                    min={1}
                    max={1000}
                    style={{ width: '100%' }}
                    size="small"
                  />
                </div>
              </Space>
            </Card>

            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={handleExecute}
              disabled={config.metrics.length === 0}
              block
            >
              Executar Query
            </Button>
          </Col>

          <Col span={12}>
            <QueryPreview />
            
            {/* Results */}
            <Card title="📊 Resultados" size="small">
              {!executeQuery ? (
                <div className="empty-state">
                  Configure sua query e clique em "Executar Query" para ver os resultados
                </div>
              ) : isLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin size="large" tip="Executando query..." />
                </div>
              ) : error ? (
                <Alert
                  message="Erro ao executar query"
                  description={error instanceof Error ? error.message : 'Erro desconhecido'}
                  type="error"
                  showIcon
                />
              ) : data?.data ? (
                <div className="results-container">
                  <div className="results-header">
                    <strong>{data.data.length}</strong> registros encontrados
                    {data.metadata && (
                      <span style={{ marginLeft: 16, color: '#999', fontSize: 12 }}>
                        Tempo: {data.metadata.query_time_ms.toFixed(2)}ms
                      </span>
                    )}
                  </div>
                  <div className="results-table">
                    <pre>{JSON.stringify(data.data.slice(0, 10), null, 2)}</pre>
                    {data.data.length > 10 && (
                      <p style={{ textAlign: 'center', color: '#999', marginTop: 8 }}>
                        Mostrando primeiros 10 de {data.data.length} registros
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
