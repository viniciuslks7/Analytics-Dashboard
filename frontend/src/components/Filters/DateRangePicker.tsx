import React from 'react';
import { DatePicker, Space, Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

const { RangePicker } = DatePicker;

interface DateRangePickerProps {
  value: [Dayjs | null, Dayjs | null] | null;
  onChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  disabled?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  disabled
}) => {
  const presets = [
    { label: 'Últimos 7 dias', value: [dayjs().subtract(7, 'day'), dayjs()] },
    { label: 'Últimos 30 dias', value: [dayjs().subtract(30, 'day'), dayjs()] },
    { label: 'Este mês', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: 'Mês passado', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
    { label: 'Este ano', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
  ];

  const handlePresetChange = (presetLabel: string) => {
    const preset = presets.find(p => p.label === presetLabel);
    if (preset) {
      onChange([preset.value[0], preset.value[1]]);
    }
  };

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <label style={{ fontWeight: 500, fontSize: '14px' }}>Período</label>
      <Space>
        <Select
          placeholder="Selecionar período"
          style={{ width: 200 }}
          onChange={handlePresetChange}
          disabled={disabled}
          options={presets.map(p => ({ label: p.label, value: p.label }))}
        />
        <RangePicker
          value={value as [Dayjs, Dayjs]}
          onChange={onChange as any}
          format="DD/MM/YYYY"
          disabled={disabled}
          placeholder={['Data inicial', 'Data final']}
          style={{ width: 300 }}
        />
      </Space>
    </Space>
  );
};

export default DateRangePicker;
