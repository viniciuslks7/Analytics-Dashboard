import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, Switch, theme as antdTheme } from 'antd';
import { DashboardOutlined, UserDeleteOutlined, BulbOutlined, BulbFilled, BellOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import { ChurnDashboard } from './pages/ChurnDashboard';
import { AlertsPage } from './pages/AlertsPage.tsx';
import { AlertNotification } from './components/Alerts';
import { useTheme } from './hooks/useTheme';
import { lightTheme, darkTheme } from './styles/theme';
import './App.css';

const { Header, Content } = Layout;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard Principal</Link>
    },
    {
      key: '/churn',
      icon: <UserDeleteOutlined />,
      label: <Link to="/churn">Análise de Churn</Link>
    },
    {
      key: '/alerts',
      icon: <BellOutlined />,
      label: <Link to="/alerts">Alertas</Link>
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: isDark ? '#141414' : '#001529', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
            📊 Analytics Platform
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[currentPath]}
            items={menuItems}
            style={{ flex: 1, minWidth: 0, marginLeft: '24px' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isDark ? <BulbFilled style={{ color: '#faad14', fontSize: '18px' }} /> : <BulbOutlined style={{ color: 'white', fontSize: '18px' }} />}
            <Switch
              checked={isDark}
              onChange={toggleTheme}
              checkedChildren="🌙"
              unCheckedChildren="☀️"
            />
          </div>
        </div>
      </Header>
      
      <Content style={{ padding: '0' }}>
        {/* Sistema de notificação automática de alertas */}
        <AlertNotification checkInterval={60000} enabled={true} />
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/churn" element={<ChurnDashboard />} />
          <Route path="/alerts" element={<AlertsPage />} />
        </Routes>
      </Content>
    </Layout>
  );
}

function App() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const themeConfig = isDark 
    ? { ...darkTheme, algorithm: antdTheme.darkAlgorithm }
    : lightTheme;

  return (
    <ConfigProvider theme={themeConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;

