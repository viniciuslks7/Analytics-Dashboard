import { Modal, Form, Input, Select, InputNumber, Switch, message } from 'antd';
import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsAPI } from '../../api/alerts';
import type { Alert, AlertCreate, AlertCondition } from '../../api/alerts';

interface CreateAlertModalProps {
  visible: boolean;
  alert: Alert | null;
  onClose: () => void;
}

export const CreateAlertModal = ({ visible, alert, onClose }: CreateAlertModalProps) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Reset form quando modal abre/fecha ou alert muda
  useEffect(() => {
    if (visible && alert) {
      // Modo edição
      form.setFieldsValue({
        name: alert.name,
        description: alert.description,
        metric: alert.condition.metric,
        operator: alert.condition.operator,
        threshold: alert.condition.threshold,
        enabled: alert.enabled,
        notification_channels: alert.notification_channels,
      });
    } else if (visible) {
      // Modo criação
      form.resetFields();
      form.setFieldsValue({
        enabled: true,
        notification_channels: ['toast'],
        operator: 'gt',
      });
    }
  }, [visible, alert, form]);

  // Mutation para criar/atualizar
  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      const alertData: AlertCreate = {
        name: values.name,
        description: values.description,
        condition: {
          metric: values.metric,
          operator: values.operator,
          threshold: values.threshold,
        } as AlertCondition,
        enabled: values.enabled,
        notification_channels: values.notification_channels,
      };

      if (alert) {
        // Atualizar
        return alertsAPI.update(alert.id, alertData);
      } else {
        // Criar
        return alertsAPI.create(alertData);
      }
    },
    onSuccess: () => {
      message.success(alert ? 'Alerta atualizado com sucesso!' : 'Alerta criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      onClose();
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(`Erro ao salvar alerta: ${error.message}`);
    }
  });

  const handleOk = () => {
    form.validateFields().then((values) => {
      saveMutation.mutate(values);
    });
  };

  const handleCancel = () => {
    onClose();
    form.resetFields();
  };

  const metricOptions = [
    { label: 'Faturamento', value: 'faturamento' },
    { label: 'Ticket Médio', value: 'ticket_medio' },
    { label: 'Quantidade de Vendas', value: 'qtd_vendas' },
    { label: 'Tempo Médio de Entrega', value: 'tempo_medio_entrega' },
  ];

  const operatorOptions = [
    { label: 'Maior que (>)', value: 'gt' },
    { label: 'Menor que (<)', value: 'lt' },
    { label: 'Igual a (=)', value: 'eq' },
    { label: 'Maior ou igual (≥)', value: 'gte' },
    { label: 'Menor ou igual (≤)', value: 'lte' },
  ];

  const channelOptions = [
    { label: 'Notificação Toast', value: 'toast' },
    { label: 'Email (em breve)', value: 'email', disabled: true },
    { label: 'Webhook (em breve)', value: 'webhook', disabled: true },
  ];

  return (
    <Modal
      title={alert ? 'Editar Alerta' : 'Criar Novo Alerta'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={saveMutation.isPending}
      okText={alert ? 'Salvar' : 'Criar'}
      cancelText="Cancelar"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          enabled: true,
          notification_channels: ['toast'],
          operator: 'gt',
        }}
      >
        <Form.Item
          name="name"
          label="Nome do Alerta"
          rules={[{ required: true, message: 'Por favor, insira um nome' }]}
        >
          <Input placeholder="Ex: Faturamento Baixo" />
        </Form.Item>

        <Form.Item name="description" label="Descrição (opcional)">
          <Input.TextArea
            rows={2}
            placeholder="Ex: Alerta quando faturamento diário está abaixo de R$1000"
          />
        </Form.Item>

        <Form.Item
          name="metric"
          label="Métrica a Monitorar"
          rules={[{ required: true, message: 'Selecione uma métrica' }]}
        >
          <Select options={metricOptions} placeholder="Selecione a métrica" />
        </Form.Item>

        <Form.Item
          name="operator"
          label="Operador de Comparação"
          rules={[{ required: true, message: 'Selecione um operador' }]}
        >
          <Select options={operatorOptions} placeholder="Selecione o operador" />
        </Form.Item>

        <Form.Item
          name="threshold"
          label="Valor Limite"
          rules={[{ required: true, message: 'Insira um valor' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Ex: 1000"
            min={0}
            precision={2}
          />
        </Form.Item>

        <Form.Item
          name="notification_channels"
          label="Canais de Notificação"
          rules={[{ required: true, message: 'Selecione ao menos um canal' }]}
        >
          <Select
            mode="multiple"
            options={channelOptions}
            placeholder="Selecione os canais"
          />
        </Form.Item>

        <Form.Item name="enabled" label="Status" valuePropName="checked">
          <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
