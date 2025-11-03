import { useState } from 'react';
import { Card, Button, Table, Tag, Space, Switch, Popconfirm, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BellOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsAPI } from '../../api/alerts';
import type { Alert } from '../../api/alerts';
import { CreateAlertModal } from './CreateAlertModal.tsx';
import type { ColumnsType } from 'antd/es/table';

export const AlertManager = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const queryClient = useQueryClient();

  // Query para listar alertas
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsAPI.list(),
  });

  // Mutation para deletar alerta
  const deleteMutation = useMutation({
    mutationFn: (alertId: string) => alertsAPI.delete(alertId),
    onSuccess: () => {
      message.success('Alerta deletado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => {
      message.error('Erro ao deletar alerta');
    }
  });

  // Mutation para ativar/desativar alerta
  const toggleMutation = useMutation({
    mutationFn: ({ alertId, enabled }: { alertId: string; enabled: boolean }) =>
      alertsAPI.update(alertId, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => {
      message.error('Erro ao atualizar alerta');
    }
  });

  const handleCreate = () => {
    setEditingAlert(null);
    setModalVisible(true);
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setModalVisible(true);
  };

  const handleDelete = (alertId: string) => {
    deleteMutation.mutate(alertId);
  };

  const handleToggle = (alertId: string, enabled: boolean) => {
    toggleMutation.mutate({ alertId, enabled });
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingAlert(null);
  };

  const operatorLabels: Record<string, string> = {
    gt: '>',
    lt: '<',
    eq: '=',
    gte: '≥',
    lte: '≤'
  };

  const columns: ColumnsType<Alert> = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Alert) => (
        <Space>
          <BellOutlined style={{ color: record.enabled ? '#1890ff' : '#d9d9d9' }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Condição',
      key: 'condition',
      render: (_: any, record: Alert) => (
        <Tag color="blue">
          {record.condition.metric} {operatorLabels[record.condition.operator]} {record.condition.threshold}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean, record: Alert) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggle(record.id, checked)}
          checkedChildren="Ativo"
          unCheckedChildren="Inativo"
        />
      ),
    },
    {
      title: 'Disparos',
      dataIndex: 'trigger_count',
      key: 'trigger_count',
      width: 100,
      align: 'center',
      render: (count: number) => (
        <Tag color={count > 0 ? 'orange' : 'default'}>{count}</Tag>
      ),
    },
    {
      title: 'Último Disparo',
      dataIndex: 'last_triggered_at',
      key: 'last_triggered_at',
      width: 180,
      render: (date?: string) => {
        if (!date) return <span style={{ color: '#999' }}>Nunca</span>;
        return new Date(date).toLocaleString('pt-BR');
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 120,
      render: (_: any, record: Alert) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Deletar alerta?"
            description="Esta ação não pode ser desfeita."
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Tooltip title="Deletar">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <Space>
            <BellOutlined />
            <span>Gerenciamento de Alertas</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Novo Alerta
          </Button>
        }
      >
        {alerts && alerts.length === 0 && !isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <CheckCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>Nenhum alerta configurado ainda.</p>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Criar Primeiro Alerta
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={alerts}
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <CreateAlertModal
        visible={modalVisible}
        alert={editingAlert}
        onClose={handleModalClose}
      />
    </>
  );
};
