import { AlertManager } from '../components/Alerts';

export const AlertsPage = () => {
  return (
    <div style={{ 
      width: '100%',
      height: '100%',
      padding: '24px',
      overflow: 'auto',
      boxSizing: 'border-box'
    }}>
      <AlertManager />
    </div>
  );
};
