"use client";

import React, { useState, useEffect } from 'react';
import { useSalesTrendsContext } from '../context';
import { salesTrendsService, FilterOptions } from '../services/salesTrendsService';
import { Calendar, BarChart2, TrendingUp, RotateCcw } from 'lucide-react';

export function SalesTrendsFilters() {
  const { filters, updateFilter, resetFilters } = useSalesTrendsContext();
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    customerCategories: [],
    customerRegions: [],
    itemNames: [],
    granularities: ['daily', 'weekly', 'monthly', 'quarterly', 'annual'],
    metrics: ['revenue', 'units', 'aov', 'margin'],
    dimensions: ['product', 'category', 'region', 'customer']
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const options = await salesTrendsService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOptions();
  }, []);

  const handleResetFilters = () => {
    resetFilters();
    // Close advanced filters accordion if it's open
    const detailsElement = document.querySelector('details');
    if (detailsElement) {
      detailsElement.open = false;
    }
  };

  return (
    <div className="glass-card p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          Filters
        </h3>
        <button
          onClick={handleResetFilters}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <RotateCcw className="h-4 w-4" />
          Reset All Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Date From */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date From
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date To
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Granularity */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Time Granularity
          </label>
          <select
            value={filters.granularity}
            onChange={(e) => updateFilter('granularity', e.target.value as any)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {filterOptions.granularities.map((g) => (
              <option key={g} value={g}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Metric */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Primary Metric
          </label>
          <select
            value={filters.metric}
            onChange={(e) => updateFilter('metric', e.target.value as any)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="revenue">Revenue</option>
            <option value="units">Units</option>
            <option value="aov">Avg Order Value</option>
            <option value="margin">Margin %</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters - Collapsible */}
      <details className="space-y-4">
        <summary className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          Advanced Filters
        </summary>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Customer Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Customer Category
            </label>
            <select
              multiple
              value={filters.customerCategory || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                updateFilter('customerCategory', selected);
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              disabled={loading}
            >
              {filterOptions.customerCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Hold Ctrl/Cmd to select multiple
            </p>
          </div>

          {/* Customer Region */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Customer Region
            </label>
            <select
              multiple
              value={filters.customerRegion || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                updateFilter('customerRegion', selected);
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              disabled={loading}
            >
              {filterOptions.customerRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Hold Ctrl/Cmd to select multiple
            </p>
          </div>

          {/* Item Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Item Name
            </label>
            <select
              multiple
              value={filters.itemName || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                updateFilter('itemName', selected);
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              disabled={loading}
            >
              {filterOptions.itemNames.slice(0, 100).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Hold Ctrl/Cmd to select multiple (showing first 100)
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}
