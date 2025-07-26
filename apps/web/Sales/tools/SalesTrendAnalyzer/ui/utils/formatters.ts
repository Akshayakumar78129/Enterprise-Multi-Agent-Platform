/**
 * Formats a number as currency (USD)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formats a number with thousands separators
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formats a number as a percentage
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

/**
 * Formats a growth rate with a + or - prefix
 */
export const formatGrowth = (value: number): string => {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatPercentage(value)}`;
}; 