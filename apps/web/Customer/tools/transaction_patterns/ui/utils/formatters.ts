/**
 * Utility functions for formatting data in the Transaction Patterns UI
 */

/**
 * Format a number with thousand separators
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat().format(value);
};

/**
 * Format a number as a percentage
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
};

/**
 * Format a number as currency (USD)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

/**
 * Format a time string to a readable format
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

/**
 * Format an hour (0-23) to a readable format
 */
export const formatHour = (hour: number): string => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    hour12: true
  }).format(date);
};

/**
 * Get the appropriate icon for a trend direction
 */
export const getTrendDirectionIcon = (trendDirection: string): string => {
  if (trendDirection.includes('up')) {
    return '↑';
  } else if (trendDirection.includes('down')) {
    return '↓';
  }
  return '→';
};

/**
 * Get the appropriate color for a trend direction based on whether it's good or bad
 */
export const getTrendDirectionColor = (trendDirection: string, theme: any): string => {
  if (trendDirection.includes('good')) {
    return theme.colors.success || '#00C853';
  } else if (trendDirection.includes('bad')) {
    return theme.colors.error || '#FF5252';
  }
  return theme.colors.neutral || '#757575';
};

/**
 * Get color for a data point based on anomaly status
 */
export const getPointColor = (isAnomaly: boolean, theme: any): string => {
  return isAnomaly ? theme.colors.signalMagenta : theme.colors.electricCyan;
}; 