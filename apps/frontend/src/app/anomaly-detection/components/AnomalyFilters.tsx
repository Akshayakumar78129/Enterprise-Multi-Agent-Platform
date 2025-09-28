"use client";

import React from 'react';
import { FilterBar } from 'components/index';

interface AnomalyFilters {
  dateFrom: string;
  dateTo: string;
  severityLevels: number[];
  segments: string[];
  regions: string[];
  contamination: number;
  search: string;
}

interface AnomalyFiltersProps {
  filters: AnomalyFilters;
  onFiltersChange: (filters: AnomalyFilters) => void;
  onReset: () => void;
}

export function AnomalyFilters({
  filters,
  onFiltersChange,
  onReset
}: AnomalyFiltersProps) {
  const filterConfig = {
    dateRange: {
      enabled: true,
      value: {
        startDate: filters.dateFrom,
        endDate: filters.dateTo
      },
      onChange: (range) => {
        onFiltersChange({
          ...filters,
          dateFrom: range.startDate,
          dateTo: range.endDate
        });
      }
    },
    search: {
      enabled: true,
      value: filters.search,
      onChange: (value) => {
        onFiltersChange({
          ...filters,
          search: value
        });
      },
      placeholder: 'Search customers...'
    },
    multiSelect: [
      {
        id: 'severity',
        label: 'Severity Level',
        options: [
          { value: '5', label: 'Critical (5)' },
          { value: '4', label: 'High (4)' },
          { value: '3', label: 'Medium (3)' },
          { value: '2', label: 'Low (2)' },
          { value: '1', label: 'Minimal (1)' }
        ],
        value: filters.severityLevels.map(String),
        onChange: (value) => {
          onFiltersChange({
            ...filters,
            severityLevels: value.map(Number)
          });
        },
        placeholder: 'Select severity levels'
      },
      {
        id: 'segments',
        label: 'Customer Segments',
        options: [
          { value: 'High-Value', label: 'High-Value' },
          { value: 'Mid-Value', label: 'Mid-Value' },
          { value: 'Standard', label: 'Standard' },
          { value: 'Small', label: 'Small' }
        ],
        value: filters.segments,
        onChange: (value) => {
          onFiltersChange({
            ...filters,
            segments: value
          });
        },
        placeholder: 'Select segments'
      },
      {
        id: 'regions',
        label: 'Regions',
        options: [
          { value: 'North America', label: 'North America' },
          { value: 'Europe', label: 'Europe' },
          { value: 'Asia Pacific', label: 'Asia Pacific' },
          { value: 'Latin America', label: 'Latin America' },
          { value: 'Middle East', label: 'Middle East' },
          { value: 'Africa', label: 'Africa' }
        ],
        value: filters.regions,
        onChange: (value) => {
          onFiltersChange({
            ...filters,
            regions: value
          });
        },
        placeholder: 'Select regions'
      }
    ]
  };

  return (
    <FilterBar
      config={filterConfig}
      onReset={onReset}
      showResetButton={true}
    />
  );
}