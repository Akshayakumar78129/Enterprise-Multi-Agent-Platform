"use client";

import React from "react";
import { FilterBar } from "components/index";
import { RegionalSalesFiltersState } from "../context";

interface RegionalFiltersProps {
  filters: RegionalSalesFiltersState;
  onFiltersChange: (filters: RegionalSalesFiltersState) => void;
  onReset: () => void;
  filterOptions?: {
    countries: string[];
    states: Array<{ country: string; state: string }>;
  };
}

export function RegionalFilters({ filters, onFiltersChange, onReset, filterOptions }: RegionalFiltersProps) {
  // Use filter options from summary API (via prop) or empty defaults
  const countries = filterOptions?.countries || [];
  const statesData = filterOptions?.states || [];

  // Get states filtered by selected countries
  const getAvailableStates = () => {
    if (filters.countries.length === 0) {
      // Return empty array if no country selected
      return [];
    }
    // Filter states by selected countries
    const filteredStates = statesData
      .filter(s => filters.countries.includes(s.country))
      .map(s => s.state);

    const uniqueStates = [...new Set(filteredStates)].sort();

    return uniqueStates;
  };

  const availableStates = getAvailableStates();

  return (
    <FilterBar
      config={{
        dateRange: {
          enabled: true,
          value: filters.dateRange,
          onChange: (range) => onFiltersChange({ ...filters, dateRange: range }),
          presets: [
            { label: "All Time", startDate: "2017-01-01", endDate: "2021-12-31" },
            { label: "Last Year", startDate: "2020-01-01", endDate: "2020-12-31" },
            { label: "Last 6 Months", startDate: "2021-06-01", endDate: "2021-12-31" },
            { label: "Last 3 Months", startDate: "2021-09-01", endDate: "2021-12-31" },
            { label: "Last Month", startDate: "2021-11-01", endDate: "2021-11-30" },
            { label: "This Year", startDate: "2021-01-01", endDate: "2021-12-31" },
          ],
        },
        multiSelect: [
          {
            id: "countries",
            label: "Country",
            options: countries.map(c => ({ value: c, label: c })),
            value: filters.countries,
            onChange: (values) => {
              // Reset states if countries change
              const newStates = filters.states.filter(state => {
                const stateCountries = statesData
                  .filter(s => s.state === state)
                  .map(s => s.country);
                return stateCountries.some(c => values.includes(c));
              });
              onFiltersChange({ ...filters, countries: values, states: newStates });
            },
          },
          {
            id: "states",
            label: "State/Province",
            placeholder: filters.countries.length === 0 ? "Select Country First" : "Select states...",
            options: availableStates.map(s => ({ value: s, label: s })),
            value: filters.states,
            onChange: (values) => onFiltersChange({ ...filters, states: values }),
            disabled: filters.countries.length === 0,
          },
        ],
      }}
      onReset={onReset}
    />
  );
}
