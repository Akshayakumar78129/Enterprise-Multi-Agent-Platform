/**
 * Utility functions for formatting data in the Product Performance Analyzer
 */

/**
 * Format a number as currency
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
 * Format a number as a percentage
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

/**
 * Format a large number with shortened notation (K, M, B)
 */
export const formatShortNumber = (value: number): string => {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'B';
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
};

/**
 * Format a number with commas as thousands separators
 */
export const formatWithCommas = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

/**
 * Determine if a trend is good or bad based on the metric
 */
export const getTrendDirection = (
  change: number,
  metric: 'sales' | 'units' | 'margin' | 'cost'
): 'up-good' | 'up-bad' | 'down-good' | 'down-bad' | 'neutral' => {
  if (Math.abs(change) < 0.1) return 'neutral';
  
  // For sales, units, and margin, up is good
  if (metric === 'sales' || metric === 'units' || metric === 'margin') {
    return change > 0 ? 'up-good' : 'down-bad';
  }
  
  // For costs, down is good
  if (metric === 'cost') {
    return change > 0 ? 'up-bad' : 'down-good';
  }
  
  return 'neutral';
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Format a date as a short string (MMM D, YYYY)
 */
export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}; 