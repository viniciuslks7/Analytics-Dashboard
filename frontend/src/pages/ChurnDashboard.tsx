import { useState } from 'react';
import { Card, Row, Col, Statistic, Select, DatePicker, Space } from 'antd';
import {
  UserDeleteOutlined,
  WarningOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  RFMScatterChart,
  ChurnTrendChart,
  AtRiskCustomersTable,
  SegmentDistributionChart
} from '../components/ChurnAnalysis';
import './ChurnDashboard.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

// API client
const churnAPI = {
  async getMetrics(daysInactive: number) {
    const response = await fetch(
      `http://localhost:8000/api/v1/analytics/churn/metrics?days_inactive=${daysInactive}`
    );
    if (!response.ok) throw new Error('Failed to fetch churn metrics');
    return response.json();
  },

  async getAtRiskCustomers(minPurchases: number, daysInactive: number, limit: number) {
    const response = await fetch(
      `http://localhost:8000/api/v1/analytics/churn/at-risk?min_purchases=${minPurchases}&days_inactive=${daysInactive}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Failed to fetch at-risk customers');
    return response.json();
  },

  async getRFMSegments() {
    const response = await fetch(
      'http://localhost:8000/api/v1/analytics/churn/rfm-segments'
    );
    if (!response.ok) throw new Error('Failed to fetch RFM segments');
    return response.json();
  },

  async getChurnTrend(startDate?: string, endDate?: string, granularity: string = 'week') {
    let url = `http://localhost:8000/api/v1/analytics/churn/trend?granularity=${granularity}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch churn trend');
    return response.json();
  }
};

export const ChurnDashboard = () => {
  const [daysInactive, setDaysInactive] = useState(30);
  const [minPurchases, setMinPurchases] = useState(2);
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(90, 'days').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]);
  const [granularity, setGranularity] = useState('week');

  // Fetch churn metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['churn-metrics', daysInactive],
    queryFn: () => churnAPI.getMetrics(daysInactive),
    refetchInterval: 60000
  });

  // Fetch at-risk customers
  const { data: atRiskData, isLoading: atRiskLoading } = useQuery({
    queryKey: ['at-risk-customers', minPurchases, daysInactive],
    queryFn: () => churnAPI.getAtRiskCustomers(minPurchases, daysInactive, 100),
    refetchInterval: 60000
  });

  // Fetch RFM segments
  const { data: rfmData, isLoading: rfmLoading } = useQuery({
    queryKey: ['rfm-segments'],
    queryFn: () => churnAPI.getRFMSegments(),
    refetchInterval: 60000
  });

  // Fetch churn trend
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['churn-trend', dateRange, granularity],
    queryFn: () => churnAPI.getChurnTrend(dateRange[0], dateRange[1], granularity),
    refetchInterval: 60000
  });

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD')
      ]);
    }
  };

  return (
    <div className="churn-dashboard">
      {/* Header */}
      <div className="churn-header">
        <div>
          <h1>
            <UserDeleteOutlined /> Customer Churn Analysis
          </h1>
          <p className="subtitle">
            Análise de retenção e clientes em risco de churn
          </p>
        </div>
        
        {/* Filters */}
        <Space size="large" className="churn-filters">
          <Space>
            <label>Dias de Inatividade:</label>
            <Select
              value={daysInactive}
              onChange={setDaysInactive}
              style={{ width: 120 }}
            >
              <Option value={15}>15 dias</Option>
              <Option value={30}>30 dias</Option>
              <Option value={45}>45 dias</Option>
              <Option value={60}>60 dias</Option>
              <Option value={90}>90 dias</Option>
            </Select>
          </Space>

          <Space>
            <label>Min. Compras:</label>
            <Select
              value={minPurchases}
              onChange={setMinPurchases}
              style={{ width: 100 }}
            >
              <Option value={1}>1+</Option>
              <Option value={2}>2+</Option>
              <Option value={3}>3+</Option>
              <Option value={5}>5+</Option>
            </Select>
          </Space>

          <Space>
            <label>Período:</label>
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
            />
          </Space>

          <Space>
            <label>Granularidade:</label>
            <Select
              value={granularity}
              onChange={setGranularity}
              style={{ width: 100 }}
            >
              <Option value="day">Dia</Option>
              <Option value="week">Semana</Option>
              <Option value="month">Mês</Option>
            </Select>
          </Space>
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} className="churn-kpis">
        <Col xs={24} sm={12} md={6}>
          <Card loading={metricsLoading}>
            <Statistic
              title="Taxa de Churn"
              value={metricsData?.churn_rate || 0}
              suffix="%"
              prefix={<UserDeleteOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card loading={metricsLoading}>
            <Statistic
              title="Clientes em Risco"
              value={metricsData?.at_risk_customers || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card loading={metricsLoading}>
            <Statistic
              title="Valor em Risco"
              value={metricsData?.value_at_risk || 0}
              prefix="R$"
              precision={2}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card loading={metricsLoading}>
            <Statistic
              title="Clientes Ativos"
              value={metricsData?.active_customers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24} lg={12}>
          <ChurnTrendChart 
            data={trendData?.data || []} 
            loading={trendLoading}
            granularity={granularity}
          />
        </Col>
        
        <Col xs={24} lg={12}>
          <SegmentDistributionChart 
            data={rfmData?.segments || []} 
            loading={rfmLoading}
          />
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24}>
          <RFMScatterChart 
            data={rfmData?.segments || []} 
            loading={rfmLoading}
          />
        </Col>
      </Row>

      {/* At-Risk Customers Table */}
      <Row style={{ marginTop: '16px' }}>
        <Col xs={24}>
          <AtRiskCustomersTable 
            data={atRiskData?.customers || []} 
            loading={atRiskLoading}
          />
        </Col>
      </Row>
    </div>
  );
};
