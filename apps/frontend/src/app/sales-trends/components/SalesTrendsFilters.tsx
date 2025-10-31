"use client";

import React from 'react';
import { FilterBar } from "components/index";
import { useSalesTrendsContext } from '../context';

export function SalesTrendsFilters() {
  const { filters, updateFilter, resetFilters } = useSalesTrendsContext();

  // Transform context filters to FilterBar format
  const filterBarFilters = {
    dateRange: {
      startDate: filters.dateFrom,
      endDate: filters.dateTo
    },
    granularity: filters.granularity,
    metric: filters.metric,
    categories: filters.customerCategory || [],
    regions: filters.customerRegion || [],
    items: filters.itemName || []
  };

  const handleFiltersChange = (newFilters: any) => {
    // Transform FilterBar format back to context format
    if (newFilters.dateRange) {
      updateFilter('dateFrom', newFilters.dateRange.startDate);
      updateFilter('dateTo', newFilters.dateRange.endDate);
    }
    if (newFilters.categories !== undefined) {
      updateFilter('customerCategory', newFilters.categories);
    }
    if (newFilters.regions !== undefined) {
      updateFilter('customerRegion', newFilters.regions);
    }
    if (newFilters.granularity !== undefined) {
      updateFilter('granularity', newFilters.granularity);
    }
    if (newFilters.metric !== undefined) {
      updateFilter('metric', newFilters.metric);
    }
  };

  return (
    <FilterBar
      config={{
        dateRange: {
          enabled: true,
          value: filterBarFilters.dateRange,
          onChange: (range) => {
            updateFilter('dateFrom', range.startDate);
            updateFilter('dateTo', range.endDate);
          },
          presets: [
            { label: "All Time", startDate: "2017-01-01", endDate: "2021-12-31" },
            { label: "Last Year", startDate: "2020-01-01", endDate: "2020-12-31" },
            { label: "2019", startDate: "2019-01-01", endDate: "2019-12-31" },
            { label: "2018", startDate: "2018-01-01", endDate: "2018-12-31" },
          ],
        },
        singleSelect: [
          {
            id: "metric",
            label: "Primary Metric",
            options: [
              { value: "revenue", label: "Revenue" },
              { value: "units", label: "Units" },
              { value: "aov", label: "Avg Order Value" },
              { value: "margin", label: "Margin %" },
            ],
            value: filters.metric,
            onChange: (value) => updateFilter('metric', value),
          },
        ],
        multiSelect: [
          {
            id: "categories",
            label: "Category",
            options: [
              { value: "Bikes", label: "Bikes" },
              { value: "Cargo", label: "Cargo" },
              { value: "Racks", label: "Racks" },
            ],
            value: filters.customerCategory || [],
            onChange: (values) => updateFilter('customerCategory', values),
          },
          {
            id: "regions",
            label: "Region",
            options: [
              { value: "Canada", label: "Canada" },
              { value: "Mexico", label: "Mexico" },
              { value: "United States", label: "United States" },
            ],
            value: filters.customerRegion || [],
            onChange: (values) => updateFilter('customerRegion', values),
          },
        ],
      }}
      onReset={resetFilters}
    />
  );
}
