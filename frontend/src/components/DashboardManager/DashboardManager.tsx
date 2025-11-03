import { useState } from 'react';
import { Button, Dropdown, Modal, Input, Form, List, Space, Popconfirm, message } from 'antd';
import {
  DashboardOutlined,
  PlusOutlined,
  SaveOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useDashboardStore } from '../../stores/dashboardStore';
import type { MenuProps } from 'antd';
import './DashboardManager.css';

interface DashboardManagerProps {
  onDashboardChange?: (dashboardId: string) => void;
}

export const DashboardManager = ({ onDashboardChange }: DashboardManagerProps) => {
  const {
    dashboards,
    currentDashboardId,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    setCurrentDashboard,
    getCurrentDashboard,
    duplicateDashboard
  } = useDashboardStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<string | null>(null);
  const [form] = Form.useForm();

  const currentDashboard = getCurrentDashboard();

  const handleCreateDashboard = (values: { name: string; description?: string }) => {
    const id = createDashboard(values.name, values.description);
    setCurrentDashboard(id);
    onDashboardChange?.(id);
    setIsCreateModalOpen(false);
    form.resetFields();
    message.success('Dashboard criado com sucesso!');
  };

  const handleEditDashboard = (values: { name: string; description?: string }) => {
    if (editingDashboard) {
      updateDashboard(editingDashboard, values);
      setIsEditModalOpen(false);
      setEditingDashboard(null);
      form.resetFields();
      message.success('Dashboard atualizado!');
    }
  };

  const handleDeleteDashboard = (id: string) => {
    deleteDashboard(id);
    message.success('Dashboard removido!');
  };

  const handleDuplicateDashboard = (id: string) => {
    const newId = duplicateDashboard(id);
    if (newId) {
      message.success('Dashboard duplicado!');
    }
  };

  const handleSelectDashboard = (id: string) => {
    setCurrentDashboard(id);
    onDashboardChange?.(id);
    message.info(`Dashboard "${dashboards.find(d => d.id === id)?.name}" carregado`);
  };

  const openEditModal = (id: string) => {
    const dashboard = dashboards.find(d => d.id === id);
    if (dashboard) {
      setEditingDashboard(id);
      form.setFieldsValue({
        name: dashboard.name,
        description: dashboard.description
      });
      setIsEditModalOpen(true);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'create',
      label: 'Novo Dashboard',
      icon: <PlusOutlined />,
      onClick: () => setIsCreateModalOpen(true)
    },
    {
      key: 'manage',
      label: 'Gerenciar Dashboards',
      icon: <EditOutlined />,
      onClick: () => setIsListModalOpen(true)
    },
    {
      type: 'divider'
    },
    ...dashboards.map(dashboard => ({
      key: dashboard.id,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '200px' }}>
          <span>{dashboard.name}</span>
          {dashboard.id === currentDashboardId && (
            <span style={{ color: '#52c41a', fontSize: '12px', marginLeft: '8px' }}>●</span>
          )}
        </div>
      ),
      onClick: () => handleSelectDashboard(dashboard.id)
    }))
  ];

  return (
    <>
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <Button icon={<DashboardOutlined />}>
          {currentDashboard?.name || 'Selecionar Dashboard'} <DownOutlined />
        </Button>
      </Dropdown>

      {/* Create Dashboard Modal */}
      <Modal
        title="Criar Novo Dashboard"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateDashboard}>
          <Form.Item
            name="name"
            label="Nome do Dashboard"
            rules={[{ required: true, message: 'Por favor, insira um nome' }]}
          >
            <Input placeholder="Ex: Dashboard Mensal" />
          </Form.Item>
          <Form.Item name="description" label="Descrição (opcional)">
            <Input.TextArea 
              rows={3} 
              placeholder="Descrição do dashboard..."
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Criar
              </Button>
              <Button onClick={() => {
                setIsCreateModalOpen(false);
                form.resetFields();
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Dashboard Modal */}
      <Modal
        title="Editar Dashboard"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingDashboard(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleEditDashboard}>
          <Form.Item
            name="name"
            label="Nome do Dashboard"
            rules={[{ required: true, message: 'Por favor, insira um nome' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Descrição (opcional)">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Salvar
              </Button>
              <Button onClick={() => {
                setIsEditModalOpen(false);
                setEditingDashboard(null);
                form.resetFields();
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Manage Dashboards Modal */}
      <Modal
        title="Gerenciar Dashboards"
        open={isListModalOpen}
        onCancel={() => setIsListModalOpen(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={dashboards}
          renderItem={(dashboard) => (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(dashboard.id)}
                >
                  Editar
                </Button>,
                <Button
                  key="duplicate"
                  type="link"
                  icon={<CopyOutlined />}
                  onClick={() => handleDuplicateDashboard(dashboard.id)}
                >
                  Duplicar
                </Button>,
                dashboard.id !== 'default' && (
                  <Popconfirm
                    key="delete"
                    title="Tem certeza que deseja excluir este dashboard?"
                    onConfirm={() => handleDeleteDashboard(dashboard.id)}
                    okText="Sim"
                    cancelText="Não"
                  >
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                    >
                      Excluir
                    </Button>
                  </Popconfirm>
                )
              ]}
            >
              <List.Item.Meta
                avatar={<DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                title={
                  <Space>
                    {dashboard.name}
                    {dashboard.id === currentDashboardId && (
                      <span style={{ color: '#52c41a', fontSize: '12px' }}>● Ativo</span>
                    )}
                  </Space>
                }
                description={
                  <div>
                    <div>{dashboard.description || 'Sem descrição'}</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                      Criado em: {new Date(dashboard.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};
