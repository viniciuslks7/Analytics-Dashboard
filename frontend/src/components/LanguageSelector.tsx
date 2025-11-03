import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const languages = [
  { value: 'pt', label: '🇧🇷 Português', flag: '🇧🇷' },
  { value: 'en', label: '🇺🇸 English', flag: '🇺🇸' },
  { value: 'es', label: '🇪🇸 Español', flag: '🇪🇸' },
];

export const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <Select
      value={i18n.language}
      onChange={handleChange}
      style={{ width: 160 }}
      options={languages}
      suffixIcon={<GlobalOutlined />}
    />
  );
};
