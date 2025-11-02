import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table';
import { Card, Button, Input, Select, Space, Checkbox, Dropdown } from 'antd';
import { 
  DownloadOutlined, 
  EyeOutlined, 
  SortAscendingOutlined,
  SortDescendingOutlined,
  TableOutlined 
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';
import './DataTable.css';

const { Option } = Select;

interface DataTableProps {
  filters?: Record<string, any>;
}

interface TableRow {
  data: string;
  nome_loja: string;
  canal_venda: string;
  qtd_vendas: number;
  faturamento: number;
  ticket_medio: number;
  clientes_unicos: number;
}

export const DataTable = ({ filters = {} }: DataTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });

  // Fetch data
  const { data, isLoading } = useQuery({
    queryKey: ['table-data', filters, pagination.pageSize],
    queryFn: () => analyticsAPI.query({
      metrics: [
        'COUNT(DISTINCT s.id) as qtd_vendas',
        'SUM(total_amount) as faturamento',
        'AVG(total_amount) as ticket_medio',
        'COUNT(DISTINCT customer_id) as clientes_unicos'
      ],
      dimensions: ['data', 'nome_loja', 'canal_venda'],
      filters: filters,
      order_by: [{ field: 'data', direction: 'desc' }],
      limit: 500
    })
  });

  // Define columns
  const columns = useMemo<ColumnDef<TableRow>[]>(
    () => [
      {
        accessorKey: 'data',
        header: 'Data',
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return new Date(value).toLocaleDateString('pt-BR');
        },
        size: 100,
      },
      {
        accessorKey: 'nome_loja',
        header: 'Loja',
        cell: ({ getValue }) => getValue() || '-',
        size: 150,
      },
      {
        accessorKey: 'canal_venda',
        header: 'Canal',
        cell: ({ getValue }) => getValue() || '-',
        size: 120,
      },
      {
        accessorKey: 'qtd_vendas',
        header: 'Qtd Vendas',
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? value.toLocaleString('pt-BR') : '0';
        },
        size: 120,
      },
      {
        accessorKey: 'faturamento',
        header: 'Faturamento',
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00';
        },
        size: 130,
      },
      {
        accessorKey: 'ticket_medio',
        header: 'Ticket Médio',
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00';
        },
        size: 130,
      },
      {
        accessorKey: 'clientes_unicos',
        header: 'Clientes Únicos',
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return value ? value.toLocaleString('pt-BR') : '0';
        },
        size: 150,
      },
    ],
    []
  );

  // Process data
  const tableData = useMemo(() => {
    if (!data?.data) return [];
    return data.data as TableRow[];
  }, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Export to CSV
  const exportToCSV = () => {
    const rows = table.getFilteredRowModel().rows;
    if (rows.length === 0) return;

    const headers = table.getVisibleFlatColumns().map(col => col.columnDef.header as string);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        table.getVisibleFlatColumns().map(col => {
          const value = row.getValue(col.id);
          if (value === null || value === undefined) return '';
          // Escape values with commas or quotes
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dados-analytics-${new Date().getTime()}.csv`;
    link.click();
  };

  // Column visibility menu
  const columnVisibilityMenu = {
    items: table.getAllColumns().map(column => ({
      key: column.id,
      label: (
        <Checkbox
          checked={column.getIsVisible()}
          onChange={(e) => column.toggleVisibility(e.target.checked)}
        >
          {column.columnDef.header as string}
        </Checkbox>
      ),
    })),
  };

  // Calculate totals
  const totals = useMemo(() => {
    const rows = table.getFilteredRowModel().rows;
    return {
      qtd_vendas: rows.reduce((sum, row) => sum + (Number(row.getValue('qtd_vendas')) || 0), 0),
      faturamento: rows.reduce((sum, row) => sum + (Number(row.getValue('faturamento')) || 0), 0),
    };
  }, [table.getFilteredRowModel().rows]);

  return (
    <Card
      className="data-table-card"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TableOutlined />
          <span>Tabela Dinâmica</span>
        </div>
      }
      extra={
        <Space>
          <Dropdown menu={columnVisibilityMenu} trigger={['click']}>
            <Button icon={<EyeOutlined />} size="small">
              Colunas
            </Button>
          </Dropdown>
          <Button
            icon={<DownloadOutlined />}
            onClick={exportToCSV}
            size="small"
            type="primary"
          >
            Exportar CSV
          </Button>
        </Space>
      }
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          Carregando dados...
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div>
                            <div
                              className={header.column.getCanSort() ? 'sortable-header' : ''}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getIsSorted() === 'asc' && (
                                <SortAscendingOutlined style={{ marginLeft: 4, fontSize: 12 }} />
                              )}
                              {header.column.getIsSorted() === 'desc' && (
                                <SortDescendingOutlined style={{ marginLeft: 4, fontSize: 12 }} />
                              )}
                            </div>
                            {header.column.getCanFilter() && (
                              <Input
                                size="small"
                                placeholder="Filtrar..."
                                value={(header.column.getFilterValue() ?? '') as string}
                                onChange={e => header.column.setFilterValue(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ marginTop: 4 }}
                              />
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="totals-row">
                  <td colSpan={3}><strong>TOTAIS</strong></td>
                  <td><strong>{totals.qtd_vendas.toLocaleString('pt-BR')}</strong></td>
                  <td><strong>R$ {totals.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="pagination-controls">
            <Space>
              <Button
                size="small"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                {'<<'}
              </Button>
              <Button
                size="small"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                {'<'}
              </Button>
              <Button
                size="small"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {'>'}
              </Button>
              <Button
                size="small"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                {'>>'}
              </Button>
              <span style={{ marginLeft: 8 }}>
                Página{' '}
                <strong>
                  {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                </strong>
              </span>
              <Select
                size="small"
                value={table.getState().pagination.pageSize}
                onChange={value => table.setPageSize(Number(value))}
                style={{ width: 120 }}
              >
                {[10, 25, 50, 100].map(pageSize => (
                  <Option key={pageSize} value={pageSize}>
                    Mostrar {pageSize}
                  </Option>
                ))}
              </Select>
              <span style={{ marginLeft: 8 }}>
                Total: <strong>{table.getFilteredRowModel().rows.length}</strong> registros
              </span>
            </Space>
          </div>
        </>
      )}
    </Card>
  );
};
