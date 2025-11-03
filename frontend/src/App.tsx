import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { DashboardOutlined, UserDeleteOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import { ChurnDashboard } from './pages/ChurnDashboard';
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
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px' }}>
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
        </div>
      </Header>
      
      <Content style={{ padding: '0' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/churn" element={<ChurnDashboard />} />
        </Routes>
      </Content>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

