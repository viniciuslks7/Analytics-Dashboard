import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { analyticsAPI } from '../api/analytics';
import KPICard from '../components/KPICard';
import FilterPanel from '../components/Filters/FilterPanel';
import { PeriodComparison } from '../components/PeriodComparison';
import { DataTable } from '../components/DataTable';
import { ExportButton } from '../components/Export';
import { DashboardManager } from '../components/DashboardManager';
import { useFilters, getAPIFilters } from '../hooks/useFilters';
import { 
  SalesChannelChart, 
  TopProductsChart, 
  HourlyHeatmap, 
  DeliveryMetricsChart,
  TimeSeriesChart
} from '../components/Charts';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const filterState = useFilters();
  const apiFilters = getAPIFilters(filterState);

  const { data: kpiData, isLoading, error } = useQuery({
    queryKey: ['kpis', apiFilters],
    queryFn: () => analyticsAPI.getKPIs(apiFilters),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>{t('app.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>{t('app.error')}</h3>
        <p>{error instanceof Error ? error.message : t('app.error')}</p>
      </div>
    );
  }

  return (
    <div className="dashboard" id="dashboard-content">
      <header className="dashboard-header">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p className="period">{kpiData?.period}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <DashboardManager />
          <ExportButton 
            data={kpiData?.kpis}
            filename="dashboard-analytics"
            elementId="dashboard-content"
          />
        </div>
      </header>

      {/* Filtros Globais */}
      <FilterPanel />

      {/* Comparação de Períodos */}
      <PeriodComparison filters={apiFilters} />

      {/* KPI Cards com Valores Totais Filtrados */}
      <section className="kpi-section">
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
          Valores Totais
        </h2>
        <div className="kpi-grid">
          {kpiData?.kpis.map((kpi, index) => (
            <KPICard key={index} kpi={kpi} />
          ))}
        </div>
      </section>

      <section className="charts-section">
        <h2>Análises Visuais</h2>
        
        {/* Gráfico de Linha Temporal */}
        <div className="charts-grid">
          <div className="chart-card full-width">
            <TimeSeriesChart filters={apiFilters} />
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <SalesChannelChart filters={apiFilters} />
          </div>
          <div className="chart-card">
            <TopProductsChart filters={apiFilters} />
          </div>
        </div>
        <div className="charts-grid">
          <div className="chart-card full-width">
            <HourlyHeatmap filters={apiFilters} />
          </div>
        </div>
        <div className="charts-grid">
          <div className="chart-card full-width">
            <DeliveryMetricsChart filters={apiFilters} />
          </div>
        </div>
      </section>

      {/* Tabela Dinâmica */}
      <section className="table-section">
        <DataTable filters={apiFilters} />
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
