// Number formatting utilities for dashboards
export const formatCurrency = (value, options = {}) => {
  const num = Number(value) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'USD',
    ...options
  });
};

export const formatNumber = (value, decimals = 0) => {
  const num = Number(value) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatPercentage = (value, decimals = 1) => {
  const num = Number(value) || 0;
  return `${num.toFixed(decimals)}%`;
};

// Legacy support - maintain existing function names
export const fmtAmt = (value) => formatCurrency(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('$', '$');
export const num = (value) => formatNumber(value, 0);
