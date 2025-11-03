import { Card, Table, Tag, Space, Button, Tooltip } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  ShoppingOutlined,
  WarningOutlined,
  MailOutlined,
  GiftOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface AtRiskCustomer {
  customer_id: string;
  customer_name: string;
  total_purchases: number;
  lifetime_value: number;
  avg_order_value: number;
  last_purchase_date: string;
  days_since_last_purchase: number;
  favorite_stores: string;
  risk_score: number;
}

interface AtRiskCustomersTableProps {
  data: AtRiskCustomer[];
  loading?: boolean;
}

export const AtRiskCustomersTable = ({ data, loading }: AtRiskCustomersTableProps) => {
  const getRiskLevel = (score: number): { text: string; color: string } => {
    if (score >= 70) return { text: 'Alto', color: '#cf1322' };
    if (score >= 40) return { text: 'Médio', color: '#fa8c16' };
    return { text: 'Baixo', color: '#fadb14' };
  };

  const columns: ColumnsType<AtRiskCustomer> = [
    {
      title: 'Cliente',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 200,
      render: (name: string, record: AtRiskCustomer) => (
        <Space>
          <UserOutlined />
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ID: {record.customer_id}
            </div>
          </div>
        </Space>
      ),
      sorter: (a, b) => a.customer_name.localeCompare(b.customer_name)
    },
    {
      title: 'Nível de Risco',
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 120,
      render: (score: number) => {
        const risk = getRiskLevel(score);
        return (
          <Tag color={risk.color} style={{ minWidth: '60px', textAlign: 'center' }}>
            {risk.text} ({score})
          </Tag>
        );
      },
      sorter: (a, b) => b.risk_score - a.risk_score,
      defaultSortOrder: 'ascend'
    },
    {
      title: 'Compras',
      dataIndex: 'total_purchases',
      key: 'total_purchases',
      width: 100,
      align: 'center',
      render: (value: number) => (
        <Space>
          <ShoppingOutlined />
          {value}
        </Space>
      ),
      sorter: (a, b) => b.total_purchases - a.total_purchases
    },
    {
      title: 'Valor Total',
      dataIndex: 'lifetime_value',
      key: 'lifetime_value',
      width: 120,
      render: (value: number) => (
        <Space>
          <DollarOutlined />
          R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Space>
      ),
      sorter: (a, b) => b.lifetime_value - a.lifetime_value
    },
    {
      title: 'Ticket Médio',
      dataIndex: 'avg_order_value',
      key: 'avg_order_value',
      width: 120,
      render: (value: number) => (
        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ),
      sorter: (a, b) => b.avg_order_value - a.avg_order_value
    },
    {
      title: 'Última Compra',
      dataIndex: 'last_purchase_date',
      key: 'last_purchase_date',
      width: 130,
      render: (date: string, record: AtRiskCustomer) => (
        <div>
          <div>{new Date(date).toLocaleDateString('pt-BR')}</div>
          <div style={{ fontSize: '12px', color: '#fa8c16' }}>
            <WarningOutlined /> há {record.days_since_last_purchase} dias
          </div>
        </div>
      ),
      sorter: (a, b) => b.days_since_last_purchase - a.days_since_last_purchase
    },
    {
      title: 'Lojas Favoritas',
      dataIndex: 'favorite_stores',
      key: 'favorite_stores',
      width: 150,
      ellipsis: {
        showTitle: false
      },
      render: (stores: string) => (
        <Tooltip placement="topLeft" title={stores}>
          {stores}
        </Tooltip>
      )
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: AtRiskCustomer) => (
        <Space size="small">
          <Tooltip title="Enviar email de reativação">
            <Button 
              size="small" 
              icon={<MailOutlined />}
              onClick={() => handleSendEmail(record)}
            >
              Email
            </Button>
          </Tooltip>
          <Tooltip title="Oferecer cupom de desconto">
            <Button 
              size="small" 
              type="primary"
              icon={<GiftOutlined />}
              onClick={() => handleSendCoupon(record)}
            >
              Cupom
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  const handleSendEmail = (customer: AtRiskCustomer) => {
    console.log('Send reactivation email to:', customer.customer_name);
    // TODO: Implement email sending
  };

  const handleSendCoupon = (customer: AtRiskCustomer) => {
    console.log('Send coupon to:', customer.customer_name);
    // TODO: Implement coupon sending
  };

  return (
    <Card 
      title={
        <Space>
          <WarningOutlined style={{ color: '#fa8c16' }} />
          <span>Clientes em Risco de Churn</span>
          <Tag color="orange">{data.length} clientes</Tag>
        </Space>
      }
      loading={loading}
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="customer_id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total de ${total} clientes em risco`,
          pageSizeOptions: ['10', '25', '50', '100']
        }}
        scroll={{ x: 1200 }}
        size="small"
      />
    </Card>
  );
};
