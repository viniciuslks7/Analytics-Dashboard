import { Modal, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { DrillDownContent } from './DrillDownContent.tsx';
import './DrillDownModal.css';

export interface DrillDownContext {
  type: 'channel' | 'product' | 'neighborhood' | 'segment';
  value: string;
  label: string;
  filters?: Record<string, any>;
}

interface DrillDownModalProps {
  visible: boolean;
  onClose: () => void;
  context: DrillDownContext | null;
}

export const DrillDownModal = ({ visible, onClose, context }: DrillDownModalProps) => {
  const [breadcrumbs, setBreadcrumbs] = useState<DrillDownContext[]>([]);

  const handleDrillDeeper = (_newContext: DrillDownContext) => {
    setBreadcrumbs([...breadcrumbs, context!]);
    // Aqui você poderia navegar para um nível mais profundo
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Voltar ao contexto original
      setBreadcrumbs([]);
    } else {
      // Voltar para um nível específico
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    }
  };

  const handleClose = () => {
    setBreadcrumbs([]);
    onClose();
  };

  const currentContext = breadcrumbs.length > 0 
    ? breadcrumbs[breadcrumbs.length - 1] 
    : context;

  const getTitle = () => {
    if (!currentContext) return '';
    
    const typeLabels = {
      channel: 'Detalhes do Canal',
      product: 'Detalhes do Produto',
      neighborhood: 'Detalhes do Bairro',
      segment: 'Detalhes do Segmento'
    };

    return `${typeLabels[currentContext.type]}: ${currentContext.label}`;
  };

  return (
    <Modal
      title={getTitle()}
      open={visible}
      onCancel={handleClose}
      width={1200}
      footer={null}
      className="drill-down-modal"
    >
      {currentContext && (
        <>
          <Breadcrumb className="drill-down-breadcrumb">
            <Breadcrumb.Item onClick={() => handleBreadcrumbClick(-1)}>
              <HomeOutlined /> <span style={{ cursor: 'pointer' }}>Visão Geral</span>
            </Breadcrumb.Item>
            {context && (
              <Breadcrumb.Item>
                <span style={{ fontWeight: 'bold' }}>{context.label}</span>
              </Breadcrumb.Item>
            )}
            {breadcrumbs.map((crumb, index) => (
              <Breadcrumb.Item 
                key={index}
                onClick={() => handleBreadcrumbClick(index)}
              >
                <span style={{ cursor: 'pointer' }}>{crumb.label}</span>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>

          <DrillDownContent 
            context={currentContext} 
            onDrillDeeper={handleDrillDeeper}
          />
        </>
      )}
    </Modal>
  );
};
