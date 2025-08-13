/**
 * Number formatting utilities for consistent decimal display and alignment
 */

/**
 * Format a number to exactly 2 decimal places
 * @param {number} value - The number to format
 * @param {boolean} addCommas - Whether to add thousand separators
 * @returns {string} Formatted number string
 */
export const formatToTwoDecimals = (value, addCommas = true) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '0.00';
  }
  
  // Format to exactly 2 decimal places
  const formatted = num.toFixed(2);
  
  // Add thousand separators if requested
  if (addCommas) {
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
  
  return formatted;
};

/**
 * Format currency values with proper decimal places and currency symbol
 * @param {number} value - The currency value
 * @param {string} currency - Currency symbol (default: '$')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = '$') => {
  const formatted = formatToTwoDecimals(value, true);
  return `${currency}${formatted}`;
};

/**
 * Format percentage values with proper decimal places
 * @param {number} value - The percentage value (0-100)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '0.00%';
  }
  
  return `${num.toFixed(2)}%`;
};

/**
 * Format large numbers with K, M, B suffixes
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number with suffix
 */
export const formatLargeNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '0';
  }
  
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(decimals)}B`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(decimals)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(decimals)}K`;
  } else {
    return num.toFixed(decimals);
  }
};

/**
 * Create consistent table cell alignment styles
 * @param {string} align - Alignment type ('left', 'right', 'center')
 * @param {boolean} isNumeric - Whether the content is numeric
 * @returns {object} CSS styles object
 */
export const getTableCellStyles = (align = 'left', isNumeric = false) => {
  const baseStyles = {
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: isNumeric ? '600' : '400',
    fontFamily: isNumeric ? 'monospace' : 'inherit',
    textAlign: align,
    verticalAlign: 'middle',
    borderBottom: '1px solid rgba(58, 68, 89, 0.2)',
    whiteSpace: 'nowrap'
  };
  
  if (isNumeric) {
    baseStyles.fontVariantNumeric = 'tabular-nums';
    baseStyles.letterSpacing = '0.5px';
  }
  
  return baseStyles;
};

/**
 * Format table data with proper alignment and decimal places
 * @param {Array} data - Array of data objects
 * @param {Array} numericColumns - Array of column names that should be formatted as numbers
 * @param {Array} currencyColumns - Array of column names that should be formatted as currency
 * @param {Array} percentageColumns - Array of column names that should be formatted as percentages
 * @returns {Array} Formatted data array
 */
export const formatTableData = (data, numericColumns = [], currencyColumns = [], percentageColumns = []) => {
  return data.map(row => {
    const formattedRow = { ...row };
    
    // Format numeric columns
    numericColumns.forEach(col => {
      if (formattedRow[col] !== undefined && formattedRow[col] !== null) {
        formattedRow[col] = formatToTwoDecimals(formattedRow[col], true);
      }
    });
    
    // Format currency columns
    currencyColumns.forEach(col => {
      if (formattedRow[col] !== undefined && formattedRow[col] !== null) {
        formattedRow[col] = formatCurrency(formattedRow[col]);
      }
    });
    
    // Format percentage columns
    percentageColumns.forEach(col => {
      if (formattedRow[col] !== undefined && formattedRow[col] !== null) {
        formattedRow[col] = formatPercentage(formattedRow[col]);
      }
    });
    
    return formattedRow;
  });
};

/**
 * Get alignment class for different data types
 * @param {string} dataType - Type of data ('text', 'number', 'currency', 'percentage', 'date')
 * @returns {string} CSS class name for alignment
 */
export const getAlignmentClass = (dataType) => {
  switch (dataType) {
    case 'number':
    case 'currency':
    case 'percentage':
      return 'text-right';
    case 'date':
      return 'text-center';
    default:
      return 'text-left';
  }
};

/**
 * Format KPI values with proper decimal places and alignment
 * @param {object} kpiData - KPI data object
 * @returns {object} Formatted KPI data
 */
export const formatKPIValues = (kpiData) => {
  const formatted = {};
  
  Object.keys(kpiData).forEach(key => {
    const item = kpiData[key];
    if (item && typeof item.value === 'number') {
      formatted[key] = {
        ...item,
        value: formatToTwoDecimals(item.value, true),
        formattedValue: key.toLowerCase().includes('revenue') || key.toLowerCase().includes('amount') 
          ? formatCurrency(item.value)
          : key.toLowerCase().includes('percentage') || key.toLowerCase().includes('rate')
          ? formatPercentage(item.value)
          : formatToTwoDecimals(item.value, true)
      };
    } else {
      formatted[key] = item;
    }
  });
  
  return formatted;
};
