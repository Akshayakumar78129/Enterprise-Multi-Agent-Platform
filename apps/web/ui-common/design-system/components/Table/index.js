import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../theme';

/**
 * Table Component
 * 
 * A responsive table component for displaying data in rows and columns.
 * Supports sorting, pagination, and customizable column rendering.
 */
export const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  onRowClick = null,
  onSort = null,
  sortBy = null,
  sortDirection = 'asc',
  emptyMessage = 'No data available',
  className = '',
  style = {},
  fullWidth = true,
  variant = 'default',
  density = 'md',
  isVirtualized = false,
  virtualizedHeight = 400,
}) => {
  const theme = useTheme();
  
  // Density configurations
  const densities = {
    sm: {
      cellPadding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      fontSize: theme.typography.fontSize.sm,
    },
    md: {
      cellPadding: `${theme.spacing[2]} ${theme.spacing[3]}`,
      fontSize: theme.typography.fontSize.base,
    },
    lg: {
      cellPadding: `${theme.spacing[3]} ${theme.spacing[4]}`,
      fontSize: theme.typography.fontSize.base,
    },
  };
  
  // Variant styles
  const variants = {
    default: {
      backgroundColor: theme.colors.graphite,
      borderColor: theme.colors.graphiteLight,
      headerBgColor: theme.colors.midnightNavy,
      rowHoverBgColor: `${theme.colors.electricCyan}10`,
    },
    minimal: {
      backgroundColor: 'transparent',
      borderColor: `${theme.colors.graphiteLight}50`,
      headerBgColor: 'transparent',
      rowHoverBgColor: `${theme.colors.electricCyan}10`,
    },
  };
  
  // Container styles
  const containerStyle = {
    width: fullWidth ? '100%' : 'auto',
    overflow: 'auto',
    backgroundColor: variants[variant].backgroundColor,
    borderRadius: theme.borderRadius.md,
    border: `1px solid ${variants[variant].borderColor}`,
    ...style,
  };
  
  // Table styles
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: densities[density].fontSize,
  };
  
  // Header styles
  const headerStyle = {
    backgroundColor: variants[variant].headerBgColor,
    color: theme.colors.cloudWhite,
    fontWeight: theme.typography.fontWeight.semibold,
  };
  
  // Header cell styles
  const headerCellStyle = {
    padding: densities[density].cellPadding,
    textAlign: 'left',
    borderBottom: `1px solid ${variants[variant].borderColor}`,
    position: 'relative',
    transition: theme.transitions.default,
  };
  
  // Row styles
  const rowStyle = {
    borderBottom: `1px solid ${variants[variant].borderColor}`,
    color: theme.colors.cloudWhite,
    cursor: onRowClick ? 'pointer' : 'default',
    transition: theme.transitions.default,
    '&:hover': {
      backgroundColor: onRowClick ? variants[variant].rowHoverBgColor : 'inherit',
    },
  };
  
  // Cell styles
  const cellStyle = {
    padding: densities[density].cellPadding,
    borderBottom: `1px solid ${variants[variant].borderColor}`,
  };
  
  // Empty state styles
  const emptyStateStyle = {
    padding: theme.spacing[8],
    textAlign: 'center',
    color: `${theme.colors.cloudWhite}70`,
    backgroundColor: variants[variant].backgroundColor,
  };
  
  // Loading state container
  const renderLoading = () => (
    <tr>
      <td colSpan={columns.length} style={emptyStateStyle}>
        Loading data...
      </td>
    </tr>
  );
  
  // Empty state container
  const renderEmptyState = () => (
    <tr>
      <td colSpan={columns.length} style={emptyStateStyle}>
        {emptyMessage}
      </td>
    </tr>
  );
  
  // Handle row click
  const handleRowClick = (row, index) => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  };
  
  // Handle column header click for sorting
  const handleHeaderClick = (column) => {
    if (onSort && column.sortable !== false) {
      onSort(column.key);
    }
  };
  
  // Render sort indicator
  const renderSortIndicator = (column) => {
    if (onSort && column.sortable !== false && sortBy === column.key) {
      return sortDirection === 'asc' ? ' ↑' : ' ↓';
    }
    return null;
  };
  
  return (
    <div 
      className={`enterprise-iq-table ${className}`}
      style={containerStyle}
    >
      <table style={tableStyle}>
        <thead style={headerStyle}>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={`header-${index}`}
                style={{
                  ...headerCellStyle,
                  width: column.width || 'auto',
                  cursor: onSort && column.sortable !== false ? 'pointer' : 'default',
                }}
                onClick={() => handleHeaderClick(column)}
              >
                {column.title}
                {renderSortIndicator(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            renderLoading()
          ) : data.length === 0 ? (
            renderEmptyState()
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={`row-${rowIndex}`}
                style={rowStyle}
                onClick={() => handleRowClick(row, rowIndex)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={`cell-${rowIndex}-${colIndex}`}
                    style={{
                      ...cellStyle,
                      textAlign: column.align || 'left',
                    }}
                  >
                    {column.render ? column.render(row[column.key], row, rowIndex) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

Table.propTypes = {
  /** Array of column definitions */
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.node.isRequired,
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      align: PropTypes.oneOf(['left', 'center', 'right']),
      sortable: PropTypes.bool,
      render: PropTypes.func,
    })
  ),
  /** Array of data objects */
  data: PropTypes.array,
  /** Whether the table is in loading state */
  isLoading: PropTypes.bool,
  /** Row click handler */
  onRowClick: PropTypes.func,
  /** Sort handler */
  onSort: PropTypes.func,
  /** Current sort column key */
  sortBy: PropTypes.string,
  /** Current sort direction */
  sortDirection: PropTypes.oneOf(['asc', 'desc']),
  /** Message to display when table is empty */
  emptyMessage: PropTypes.node,
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Custom styles for the table container */
  style: PropTypes.object,
  /** Whether the table should take up the full width of its container */
  fullWidth: PropTypes.bool,
  /** Visual variant */
  variant: PropTypes.oneOf(['default', 'minimal']),
  /** Row density */
  density: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Whether to use virtualized scrolling for large datasets */
  isVirtualized: PropTypes.bool,
  /** Height for virtualized table */
  virtualizedHeight: PropTypes.number,
};

export default Table; 