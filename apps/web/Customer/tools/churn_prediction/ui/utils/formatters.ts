/**
 * Utility functions for consistent number and currency formatting
 */

/**
 * Round a number to specified decimal places
 * @param value - The number to round
 * @param decimals - Number of decimal places (default: 2)
 */
export const roundToDecimal = (value: number, decimals: number = 2): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Format a number as percentage with 2 decimal places
 * @param value - The decimal value (0-1) or percentage (0-100)
 * @param isDecimal - Whether the input is decimal (true) or percentage (false)
 */
export const formatPercentage = (value: number, isDecimal: boolean = false): string => {
  const percentage = isDecimal ? value * 100 : value;
  return `${roundToDecimal(percentage, 2)}%`;
};

/**
 * Format a number as USD currency
 * @param value - The amount in dollars
 * @param showCents - Whether to show cents (default: false for whole dollars)
 */
export const formatDollar = (value: number, showCents: boolean = false): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0
  });
  return formatter.format(value);
};

/**
 * Format large numbers with K, M, B suffixes
 * @param value - The number to format
 * @param decimals - Number of decimal places for the formatted value
 */
export const formatCompactNumber = (value: number, decimals: number = 1): string => {
  if (value >= 1000000000) {
    return `$${roundToDecimal(value / 1000000000, decimals)}B`;
  } else if (value >= 1000000) {
    return `$${roundToDecimal(value / 1000000, decimals)}M`;
  } else if (value >= 1000) {
    return `$${roundToDecimal(value / 1000, decimals)}K`;
  }
  return formatDollar(value);
};

/**
 * Format any numeric value appropriately based on context
 * @param value - The value to format
 * @param type - The type of formatting needed
 */
export const formatValue = (
  value: number, 
  type: 'percentage' | 'currency' | 'compact' | 'decimal' = 'decimal'
): string => {
  switch (type) {
    case 'percentage':
      return formatPercentage(value);
    case 'currency':
      return formatDollar(value);
    case 'compact':
      return formatCompactNumber(value);
    case 'decimal':
    default:
      return roundToDecimal(value, 2).toString();
  }
};

/**
 * Ensure all numeric values in an object are properly formatted
 * @param data - The object containing numeric values
 * @param config - Configuration for which fields to format and how
 */
export const formatDataObject = (
  data: any,
  config: { [key: string]: 'percentage' | 'currency' | 'compact' | 'decimal' } = {}
): any => {
  const formatted = { ...data };
  
  Object.keys(formatted).forEach(key => {
    const value = formatted[key];
    if (typeof value === 'number') {
      const formatType = config[key] || 'decimal';
      if (formatType === 'percentage' || key.includes('percentage') || key.includes('rate')) {
        formatted[key] = formatPercentage(value, value <= 1);
      } else if (formatType === 'currency' || key.includes('revenue') || key.includes('value') || key.includes('amount')) {
        formatted[key] = formatDollar(value);
      } else if (formatType === 'compact' && value > 10000) {
        formatted[key] = formatCompactNumber(value);
      } else {
        formatted[key] = roundToDecimal(value, 2);
      }
    }
  });
  
  return formatted;
};