"use client";

import React from 'react';
import { FilterBar } from 'components/index';

interface CashFlowFiltersProps {
  filters: {
    dateRange: { startDate: string; endDate: string };
    cashFlowType?: string;
    departments?: string[];
    regions?: string[];
    minAmount?: number | null;
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

export function CashFlowFilters({ filters, onFiltersChange, onReset }: CashFlowFiltersProps) {
  const cashFlowTypeOptions = [
    { value: 'all', label: 'All Cash Flows' },
    { value: 'operating', label: 'Operating' },
    { value: 'investing', label: 'Investing' },
    { value: 'financing', label: 'Financing' }
  ];

  // Safety check - return null if filters not initialized yet
  if (!filters || !filters.dateRange) {
    return null;
  }

  return (
    <FilterBar
      config={{
        dateRange: {
          enabled: true,
          value: filters.dateRange,
          onChange: (range) => onFiltersChange({ ...filters, dateRange: range }),
        },
        singleSelect: [
          {
            id: "cashFlowType",
            label: "Cash Flow Type",
            options: cashFlowTypeOptions,
            value: filters.cashFlowType || 'all',
            onChange: (value) => onFiltersChange({ ...filters, cashFlowType: value }),
          },
        ],
      }}
      onReset={onReset}
    />
  );
}
