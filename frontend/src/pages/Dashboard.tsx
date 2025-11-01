import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../api/analytics';
import KPICard from '../components/KPICard';
import { 
  SalesChannelChart, 
  TopProductsChart, 
  HourlyHeatmap, 
  DeliveryMetricsChart 
} from '../components/Charts';

const Dashboard: React.FC = () => {
  const { data: kpiData, isLoading, error } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => analyticsAPI.getKPIs(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>Erro ao carregar dados</h3>
        <p>{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <p className="period">{kpiData?.period}</p>
      </header>

      <section className="kpi-section">
        <div className="kpi-grid">
          {kpiData?.kpis.map((kpi, index) => (
            <KPICard key={index} kpi={kpi} />
          ))}
        </div>
      </section>

      <section className="charts-section">
        <h2>Análises Visuais</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <SalesChannelChart />
          </div>
          <div className="chart-card">
            <TopProductsChart />
          </div>
        </div>
        <div className="charts-grid">
          <div className="chart-card full-width">
            <HourlyHeatmap />
          </div>
        </div>
        <div className="charts-grid">
          <div className="chart-card full-width">
            <DeliveryMetricsChart />
          </div>
        </div>
      </section>

      {kpiData?.metadata && (
        <footer className="dashboard-footer">
          <span>Tempo de consulta: {kpiData.metadata.query_time_ms.toFixed(2)}ms</span>
          <span>Total de registros: {kpiData.metadata.total_rows}</span>
        </footer>
      )}
    </div>
  );
};

export default Dashboard;
