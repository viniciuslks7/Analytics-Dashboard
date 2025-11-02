import React from 'react';
import { Select, Space } from 'antd';

interface MultiSelectProps {
  label: string;
  placeholder: string;
  value: string[];
  options: { label: string; value: string }[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  showSearch?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled,
  showSearch = false
}) => {
  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <label style={{ fontWeight: 500, fontSize: '14px' }}>{label}</label>
      <Select
        mode="multiple"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        options={options}
        disabled={disabled}
        showSearch={showSearch}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        style={{ width: '100%', minWidth: 200 }}
        maxTagCount="responsive"
      />
    </Space>
  );
};

export default MultiSelect;
