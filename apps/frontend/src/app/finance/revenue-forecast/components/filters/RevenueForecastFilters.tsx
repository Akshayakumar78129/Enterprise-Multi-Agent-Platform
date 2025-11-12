"use client";

import React from 'react';
import { FilterBar } from 'components/index';
import { RevenueForecastFilters as RevenueForecastFiltersType } from '../../context';

interface RevenueForecastFiltersProps {
  filters: RevenueForecastFiltersType;
  onFiltersChange: (filters: RevenueForecastFiltersType) => void;
  onReset: () => void;
}

export function RevenueForecastFilters({
  filters,
  onFiltersChange,
  onReset
}: RevenueForecastFiltersProps) {
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
            id: "companyCode",
            label: "Company Code",
            options: [
              { value: "all", label: "All Companies" },
              { value: "1000", label: "Company 1000" },
              { value: "2000", label: "Company 2000" },
              { value: "3000", label: "Company 3000" },
            ],
            value: filters.companyCode || "all",
            onChange: (value) => onFiltersChange({ ...filters, companyCode: value }),
            placeholder: "Select Company"
          },
          {
            id: "forecastHorizon",
            label: "Forecast Horizon",
            options: [
              { value: "6", label: "6 Months" },
              { value: "12", label: "12 Months" },
              { value: "18", label: "18 Months" },
              { value: "24", label: "24 Months" },
            ],
            value: filters.forecastHorizon?.toString() || "12",
            onChange: (value) => onFiltersChange({ ...filters, forecastHorizon: parseInt(value) }),
            placeholder: "Select Horizon"
          },
          {
            id: "confidenceLevel",
            label: "Confidence Level",
            options: [
              { value: "70", label: "70%" },
              { value: "80", label: "80%" },
              { value: "90", label: "90%" },
              { value: "95", label: "95%" },
            ],
            value: filters.confidenceLevel?.toString() || "80",
            onChange: (value) => onFiltersChange({ ...filters, confidenceLevel: parseFloat(value) }),
            placeholder: "Select Level"
          },
          {
            id: "scenario",
            label: "Scenario",
            options: [
              { value: "base", label: "Base Case" },
              { value: "optimistic", label: "Optimistic" },
              { value: "pessimistic", label: "Pessimistic" },
            ],
            value: filters.scenario || "base",
            onChange: (value) => onFiltersChange({ ...filters, scenario: value }),
            placeholder: "Select Scenario"
          },
        ],
        multiSelect: [
          {
            id: "segments",
            label: "Segments",
            options: [
              { value: "Enterprise", label: "Enterprise" },
              { value: "Mid-Market", label: "Mid-Market" },
              { value: "SMB", label: "SMB" },
              { value: "Self-Serve", label: "Self-Serve" },
            ],
            value: filters.segments || [],
            onChange: (values) => onFiltersChange({ ...filters, segments: values }),
            placeholder: "All Segments"
          },
          {
            id: "regions",
            label: "Regions",
            options: [
              { value: "North America", label: "North America" },
              { value: "Europe", label: "Europe" },
              { value: "Asia Pacific", label: "Asia Pacific" },
              { value: "Latin America", label: "Latin America" },
            ],
            value: filters.regions || [],
            onChange: (values) => onFiltersChange({ ...filters, regions: values }),
            placeholder: "All Regions"
          },
        ],
      }}
      onReset={onReset}
      showResetButton={true}
    />
  );
}
