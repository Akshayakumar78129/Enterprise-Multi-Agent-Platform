import React from 'react';
import { 
  formatToTwoDecimals, 
  formatCurrency, 
  formatPercentage, 
  formatLargeNumber,
  getTableCellStyles,
  getAlignmentClass 
} from '../utils/numberFormat';

/**
 * FormattedTable component for displaying data with proper decimal formatting and alignment
 */
const FormattedTable = ({ 
  data, 
  columns, 
  numericColumns = [], 
  currencyColumns = [], 
  percentageColumns = [],
  className = '',
  style = {}
}) => {
  // Format data based on column types
  const formatCellValue = (value, columnKey) => {
    if (value === null || value === undefined) {
      return '-';
    }

    // Format based on column type
    if (currencyColumns.includes(columnKey)) {
      return formatCurrency(value);
    } else if (percentageColumns.includes(columnKey)) {
      return formatPercentage(value);
    } else if (numericColumns.includes(columnKey)) {
      return formatToTwoDecimals(value, true);
    }
    
    return value;
  };

  // Get alignment for column
  const getColumnAlignment = (columnKey) => {
    if (currencyColumns.includes(columnKey) || percentageColumns.includes(columnKey) || numericColumns.includes(columnKey)) {
      return 'right';
    }
    return 'left';
  };

  // Get cell styles
  const getCellStyle = (columnKey) => {
    const isNumeric = numericColumns.includes(columnKey) || 
                     currencyColumns.includes(columnKey) || 
                     percentageColumns.includes(columnKey);
    const align = getColumnAlignment(columnKey);
    return getTableCellStyles(align, isNumeric);
  };

  return (
    <div 
      className={`formatted-table-container ${className}`}
      style={{
        overflowX: 'auto',
        borderRadius: '8px',
        border: '1px solid rgba(58, 68, 89, 0.3)',
        background: 'rgba(30, 39, 56, 0.6)',
        backdropFilter: 'blur(10px)',
        ...style
      }}
    >
      <table 
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        <thead>
          <tr style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
            borderBottom: '2px solid rgba(58, 68, 89, 0.4)'
          }}>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  ...getCellStyle(column.key),
                  fontWeight: '600',
                  color: '#f8fafc',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  background: 'transparent'
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    ...getCellStyle(column.key),
                    color: '#f1f5f9',
                    borderBottom: '1px solid rgba(58, 68, 89, 0.2)'
                  }}
                >
                  {formatCellValue(row[column.key], column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * KPI Card component for displaying formatted metrics
 */
export const KPICard = ({ 
  title, 
  value, 
  trend, 
  trendDirection = 'neutral',
  formatType = 'number',
  currency = '$',
  className = '',
  style = {}
}) => {
  const formatValue = (val) => {
    if (val === null || val === undefined) return '0';
    
    switch (formatType) {
      case 'currency':
        return formatCurrency(val, currency);
      case 'percentage':
        return formatPercentage(val);
      case 'number':
        return formatToTwoDecimals(val, true);
      case 'large':
        return formatLargeNumber(val);
      default:
        return val;
    }
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  const getTrendColor = (direction) => {
    switch (direction) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div
      className={`kpi-card ${className}`}
      style={{
        padding: '20px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(30, 39, 56, 0.8), rgba(44, 51, 65, 0.8))',
        border: '1px solid rgba(58, 68, 89, 0.3)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        ...style
      }}
    >
      <div style={{
        fontSize: '12px',
        color: '#94a3b8',
        fontWeight: '500',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {title}
      </div>
      
      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color: '#f8fafc',
        marginBottom: '8px',
        fontFamily: formatType === 'currency' || formatType === 'number' ? 'monospace' : 'inherit',
        fontVariantNumeric: 'tabular-nums'
      }}>
        {formatValue(value)}
      </div>
      
      {trend !== undefined && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          color: getTrendColor(trendDirection)
        }}>
          <span style={{ fontSize: '14px' }}>{getTrendIcon(trendDirection)}</span>
          <span>{formatPercentage(Math.abs(trend))}</span>
        </div>
      )}
    </div>
  );
};

/**
 * DataGrid component for displaying large datasets with pagination
 */
export const DataGrid = ({ 
  data, 
  columns, 
  numericColumns = [], 
  currencyColumns = [], 
  percentageColumns = [],
  pageSize = 10,
  className = '',
  style = {}
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = data.slice(startIndex, endIndex);

  return (
    <div className={`data-grid ${className}`} style={style}>
      <FormattedTable
        data={currentData}
        columns={columns}
        numericColumns={numericColumns}
        currencyColumns={currencyColumns}
        percentageColumns={percentageColumns}
      />
      
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderTop: '1px solid rgba(58, 68, 89, 0.3)',
          background: 'rgba(30, 39, 56, 0.4)'
        }}>
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>
            Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} records
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(58, 68, 89, 0.5)',
                background: currentPage === 1 ? 'rgba(58, 68, 89, 0.3)' : 'rgba(59, 130, 246, 0.1)',
                color: currentPage === 1 ? '#6b7280' : '#3b82f6',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              Previous
            </button>
            
            <span style={{
              padding: '8px 12px',
              color: '#f8fafc',
              fontSize: '14px'
            }}>
              {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(58, 68, 89, 0.5)',
                background: currentPage === totalPages ? 'rgba(58, 68, 89, 0.3)' : 'rgba(59, 130, 246, 0.1)',
                color: currentPage === totalPages ? '#6b7280' : '#3b82f6',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormattedTable;
