/**
 * Shared currency formatting utility for consistent display across all dashboards
 */

/**
 * Format a number as USD currency with proper thousand separators
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted currency string (e.g., "$1,234" or "$1,234.56")
 */
export const formatCurrency = (value: number | null | undefined, decimals: number = 0): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format a large number as compact currency (e.g., "$1.2M", "$456K")
 * @param value - The numeric value to format
 * @returns Formatted compact currency string
 */
export const formatCompactCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0';
  }
  
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  
  return formatCurrency(value);
};

/**
 * Parse a currency string back to a number
 * @param currencyString - The currency string to parse (e.g., "$1,234.56")
 * @returns The numeric value
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;
  
  // Remove currency symbol and thousand separators
  const cleanedString = currencyString.replace(/[$,]/g, '');
  const value = parseFloat(cleanedString);
  
  return isNaN(value) ? 0 : value;
};

/**
 * Format a percentage with consistent precision
 * @param value - The percentage value (already in percentage form, e.g., 25 for 25%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "25.5%")
 */
export const formatPercentage = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format a number with thousand separators but no currency symbol
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string (e.g., "1,234")
 */
export const formatNumber = (value: number | null | undefined, decimals: number = 0): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};