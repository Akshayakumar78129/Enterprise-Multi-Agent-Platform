/**
 * Utility functions for formatting financial and numeric values consistently across the dashboard
 */

/**
 * Format currency values with proper dollar sign and 2 decimal places
 * @param value - The numeric value to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number | null | undefined, options?: {
  showCents?: boolean;
  compact?: boolean;
}): string => {
  const { showCents = true, compact = false } = options || {};

  // Handle null/undefined/NaN gracefully — return $0 as placeholder
  if (value === null || value === undefined) return '$0';
  const n = Number(value);
  if (!isFinite(n)) return '$0';

  // Preserve sign for negative values
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);

  // Handle compact formatting for large numbers (M/K)
  if (compact) {
    if (abs >= 1000000) {
      const millions = abs / 1000000;
      const mStr = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
      return `${sign}$${mStr}M`;
    } else if (abs >= 1000) {
      const thousands = abs / 1000;
      const kStr = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0);
      return `${sign}$${kStr}K`;
    }
  }

  // Use Intl.NumberFormat to show decimals only when necessary
  const hasFraction = Math.round((abs - Math.floor(abs)) * 100) !== 0;
  const minimumFractionDigits = showCents && hasFraction ? 2 : 0;
  const maximumFractionDigits = showCents && hasFraction ? 2 : 0;

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits
  });

  return `${sign}$${formatter.format(abs)}`;
};

/**
 * Format percentage values - only show decimals if necessary
 * @param value - The numeric value (0-1 for percentages, will be converted to 0-100)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0%';
  const v = Number(value);
  if (!isFinite(v)) return '0%';
  const percentage = v * 100;
  return `${percentage % 1 === 0 ? percentage.toFixed(0) : percentage.toFixed(2)}%`;
};

/**
 * Format turnover ratio - only show decimals if necessary
 * @param value - The turnover ratio
 * @returns Formatted ratio string with 'x' suffix
 */
export const formatTurnoverRatio = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0x';
  const v = Number(value);
  if (!isFinite(v)) return '0x';
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}x`;
};

/**
 * Format numbers - only show decimals if necessary
 * @param value - The numeric value
 * @returns Formatted number string
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  const v = Number(value);
  if (!isFinite(v)) return '0';
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(2);
};

/**
 * Format inventory value for display in tables (always with 2 decimals)
 * @param value - The inventory value
 * @returns Formatted currency string
 */
export const formatInventoryValue = (value: number): string => {
  return formatCurrency(value, { showCents: true });
};

/**
 * Format compact currency for KPI tiles
 * @param value - The numeric value
 * @returns Formatted currency string
 */
export const formatCurrencyCompact = (value: number): string => {
  return formatCurrency(value, { compact: true });
};
