import { Card, Typography } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import { useQueryBuilder } from '../../hooks/useQueryBuilder';
import './QueryPreview.css';

const { Paragraph } = Typography;

export const QueryPreview = () => {
  const { config } = useQueryBuilder();

  // Build API request object
  const apiRequest = {
    metrics: config.metrics,
    dimensions: config.dimensions,
    filters: config.filters.reduce((acc, filter) => {
      acc[filter.field] = `${filter.operator}${filter.value}`;
      return acc;
    }, {} as Record<string, string>),
    order_by: config.orderBy,
    limit: config.limit,
  };

  return (
    <Card
      title={
        <span>
          <CodeOutlined /> Preview da Query
        </span>
      }
      size="small"
      className="query-preview-card"
    >
      <div className="preview-section">
        <h4>JSON (Request Body):</h4>
        <Paragraph
          copyable
          code
          className="json-preview"
        >
          <pre>{JSON.stringify(apiRequest, null, 2)}</pre>
        </Paragraph>
      </div>

      <div className="preview-section">
        <h4>SQL Aproximado:</h4>
        <Paragraph
          copyable
          code
          className="sql-preview"
        >
          <pre>{generateSQLPreview(config)}</pre>
        </Paragraph>
      </div>
    </Card>
  );
};

// Helper to generate SQL preview
function generateSQLPreview(config: any): string {
  const metrics = config.metrics.length > 0 
    ? config.metrics.join(', ') 
    : '*';
  
  const dimensions = config.dimensions.length > 0 
    ? `, ${config.dimensions.join(', ')}` 
    : '';
  
  const groupBy = config.dimensions.length > 0 
    ? `\nGROUP BY ${config.dimensions.join(', ')}` 
    : '';
  
  const where = config.filters.length > 0 
    ? `\nWHERE ${config.filters.map((f: any) => `${f.field} ${f.operator} '${f.value}'`).join('\n  AND ')}` 
    : '';
  
  const orderBy = config.orderBy.length > 0 
    ? `\nORDER BY ${config.orderBy.map((o: any) => `${o.field} ${o.direction.toUpperCase()}`).join(', ')}` 
    : '';
  
  const limit = `\nLIMIT ${config.limit}`;

  return `SELECT ${metrics}${dimensions}
FROM sales${where}${groupBy}${orderBy}${limit};`;
}
