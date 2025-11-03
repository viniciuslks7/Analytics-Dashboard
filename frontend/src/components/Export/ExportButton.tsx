import { Button, Dropdown, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './ExportButton.css';

interface ExportButtonProps {
  data?: any[];
  filename?: string;
  elementId?: string; // ID do elemento para captura de screenshot
}

export const ExportButton = ({ data = [], filename = 'export', elementId }: ExportButtonProps) => {
  
  // Export to CSV
  const exportToCSV = () => {
    if (data.length === 0) {
      message.warning('Nenhum dado disponível para exportar');
      return;
    }

    try {
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            // Escape values with commas or quotes
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}_${new Date().getTime()}.csv`);
      message.success('CSV exportado com sucesso!');
    } catch (error) {
      message.error('Erro ao exportar CSV');
      console.error(error);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (data.length === 0) {
      message.warning('Nenhum dado disponível para exportar');
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Auto-size columns
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        ) + 2
      }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

      // Add summary sheet
      const summary = [
        { Campo: 'Total de Registros', Valor: data.length },
        { Campo: 'Data de Exportação', Valor: new Date().toLocaleString('pt-BR') },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

      XLSX.writeFile(workbook, `${filename}_${new Date().getTime()}.xlsx`);
      message.success('Excel exportado com sucesso!');
    } catch (error) {
      message.error('Erro ao exportar Excel');
      console.error(error);
    }
  };

  // Export to PNG (screenshot)
  const exportToPNG = async () => {
    if (!elementId) {
      message.warning('Elemento não especificado para captura');
      return;
    }

    const element = document.getElementById(elementId);
    if (!element) {
      message.warning('Elemento não encontrado');
      return;
    }

    try {
      message.loading('Gerando imagem...', 0);
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `${filename}_${new Date().getTime()}.png`);
          message.destroy();
          message.success('PNG exportado com sucesso!');
        }
      });
    } catch (error) {
      message.destroy();
      message.error('Erro ao exportar PNG');
      console.error(error);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!elementId) {
      message.warning('Elemento não especificado para captura');
      return;
    }

    const element = document.getElementById(elementId);
    if (!element) {
      message.warning('Elemento não encontrado');
      return;
    }

    try {
      message.loading('Gerando PDF...', 0);
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Add header
      pdf.setFontSize(16);
      pdf.text('Dashboard Analytics', pdfWidth / 2, 5, { align: 'center' });
      
      // Add image
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Add footer
      pdf.setFontSize(10);
      pdf.text(
        `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
        pdfWidth / 2,
        pdfHeight - 5,
        { align: 'center' }
      );

      pdf.save(`${filename}_${new Date().getTime()}.pdf`);
      message.destroy();
      message.success('PDF exportado com sucesso!');
    } catch (error) {
      message.destroy();
      message.error('Erro ao exportar PDF');
      console.error(error);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'csv',
      label: 'Exportar como CSV',
      onClick: exportToCSV,
      disabled: data.length === 0,
    },
    {
      key: 'excel',
      label: 'Exportar como Excel',
      onClick: exportToExcel,
      disabled: data.length === 0,
    },
    {
      type: 'divider',
    },
    {
      key: 'png',
      label: 'Exportar como PNG',
      onClick: exportToPNG,
      disabled: !elementId,
    },
    {
      key: 'pdf',
      label: 'Exportar como PDF',
      onClick: exportToPDF,
      disabled: !elementId,
    },
  ];

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <Button icon={<DownloadOutlined />} type="primary">
        Exportar
      </Button>
    </Dropdown>
  );
};
