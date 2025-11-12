"use client";

import React, { useState, useMemo } from 'react';
import { Card, getShiftClickManager } from 'components';
import { BarChart2, TrendingUp, Users, DollarSign, ShoppingCart, Clock, Hash, Activity, Calendar } from 'lucide-react';

interface SegmentMetricComparisonProps {
  data: any[];
  loading?: boolean;
}

export function SegmentMetricComparison({ data = [], loading = false }: SegmentMetricComparisonProps) {
  const [selectedMetric, setSelectedMetric] = useState('avg_lifetime_value');
  const [showPercentage, setShowPercentage] = useState(false);
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const shiftClickManager = getShiftClickManager();

  // All 9 available metrics
  const availableMetrics = [
    {
      value: 'avg_lifetime_value',
      label: 'Average Lifetime Value',
      icon: <DollarSign className="w-4 h-4" />,
      format: 'currency'
    },
    {
      value: 'avg_order_value',
      label: 'Average Order Value',
      icon: <ShoppingCart className="w-4 h-4" />,
      format: 'currency'
    },
    {
      value: 'avg_frequency',
      label: 'Purchase Frequency',
      icon: <Activity className="w-4 h-4" />,
      format: 'number'
    },
    {
      value: 'avg_recency',
      label: 'Recency (Days)',
      icon: <Clock className="w-4 h-4" />,
      format: 'number'
    },
    {
      value: 'transaction_count',
      label: 'Transaction Count',
      icon: <Hash className="w-4 h-4" />,
      format: 'number'
    },
    {
      value: 'customer_count',
      label: 'Customer Count',
      icon: <Users className="w-4 h-4" />,
      format: 'number'
    },
    {
      value: 'rfm_rl_score',
      label: 'RFM-RL Score',
      icon: <BarChart2 className="w-4 h-4" />,
      format: 'number'
    },
    {
      value: 'total_spend',
      label: 'Total Revenue',
      icon: <TrendingUp className="w-4 h-4" />,
      format: 'currency'
    },
    {
      value: 'days_since_last_activity',
      label: 'Days Since Last Activity',
      icon: <Calendar className="w-4 h-4" />,
      format: 'number'
    }
  ];

  const currentMetric = availableMetrics.find(m => m.value === selectedMetric) || availableMetrics[0];

  // Process and sort data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let sorted = [...data];

    // Sort data
    sorted.sort((a, b) => {
      let aVal = a[selectedMetric] || 0;
      let bVal = b[selectedMetric] || 0;

      if (sortBy === 'name') {
        const comparison = (a.segment_name || '').localeCompare(b.segment_name || '');
        return sortOrder === 'desc' ? -comparison : comparison;
      } else if (sortBy === 'size') {
        aVal = a.customer_count || 0;
        bVal = b.customer_count || 0;
      }

      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Calculate average for percentage view
    const validValues = sorted
      .map(s => s[selectedMetric])
      .filter(val => val !== undefined && val !== null && !isNaN(val));

    const average = validValues.length > 0
      ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
      : 0;

    return sorted.map(segment => ({
      ...segment,
      displayValue: showPercentage && average > 0
        ? ((segment[selectedMetric] || 0) / average) * 100
        : segment[selectedMetric] || 0,
      percentageOfTotal: segment.customer_count && data.length > 0
        ? (segment.customer_count / data.reduce((sum, s) => sum + (s.customer_count || 0), 0)) * 100
        : 0
    }));
  }, [data, selectedMetric, showPercentage, sortBy, sortOrder]);

  const formatValue = (value: number, format: string) => {
    if (value === undefined || value === null) return 'N/A';

    if (showPercentage) {
      return `${value.toFixed(1)}%`;
    }

    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  // Find max value for bar width calculation
  const maxValue = Math.max(...processedData.map(d => d.displayValue || 0));

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Segment Metric Comparison</h3>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Metric Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full p-2 rounded-lg border border-border bg-background"
            >
              {availableMetrics.map(metric => (
                <option key={metric.value} value={metric.value}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2">Display Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPercentage(false)}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  !showPercentage
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                }`}
              >
                Absolute
              </button>
              <button
                onClick={() => setShowPercentage(true)}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  showPercentage
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                }`}
              >
                Percentage
              </button>
            </div>
          </div>

          {/* Sort Controls */}
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder as 'asc' | 'desc');
              }}
              className="w-full p-2 rounded-lg border border-border bg-background"
            >
              <option value="value-desc">Value (High to Low)</option>
              <option value="value-asc">Value (Low to High)</option>
              <option value="name-asc">Name (A to Z)</option>
              <option value="name-desc">Name (Z to A)</option>
              <option value="size-desc">Size (Large to Small)</option>
              <option value="size-asc">Size (Small to Large)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Bars */}
      <div className="space-y-3">
        {processedData.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No segment data available
          </div>
        ) : (
          processedData.map((segment, index) => (
            <div
              key={segment.segment_name || index}
              className="group cursor-pointer"
              onClick={(e) => {
                if (e.shiftKey) {
                  // Shift+click: Add to global shift+click selection
                  shiftClickManager.addPoint({
                    label: `Segment: ${segment.segment_name}`,
                    value: `${currentMetric.label}: ${formatValue(segment.displayValue, currentMetric.format)}, ${segment.customer_count} customers`,
                    source: 'Segment Metrics'
                  }, e.nativeEvent);
                }
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{segment.segment_name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({segment.customer_count || 0} customers, {segment.percentageOfTotal.toFixed(1)}%)
                  </span>
                </div>
                <span className="font-semibold">
                  {formatValue(segment.displayValue, currentMetric.format)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-out hover:opacity-80"
                  style={{
                    width: maxValue > 0 ? `${(segment.displayValue / maxValue) * 100}%` : '0%',
                    backgroundColor: segment.color || '#00e0ff'
                  }}
                />
              </div>

              {/* Additional Info on Hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                <div className="text-xs text-muted-foreground flex gap-4">
                  <span>LTV: ${segment.avg_lifetime_value?.toLocaleString() || 0}</span>
                  <span>AOV: ${segment.avg_order_value?.toLocaleString() || 0}</span>
                  <span>Frequency: {segment.avg_frequency?.toFixed(1) || 0}</span>
                  <span>Recency: {segment.avg_recency?.toFixed(0) || 0} days</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistics Summary */}
      {processedData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Min:</span>
              <span className="ml-2 font-medium">
                {formatValue(Math.min(...processedData.map(d => d[selectedMetric] || 0)), currentMetric.format)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Max:</span>
              <span className="ml-2 font-medium">
                {formatValue(Math.max(...processedData.map(d => d[selectedMetric] || 0)), currentMetric.format)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Average:</span>
              <span className="ml-2 font-medium">
                {formatValue(
                  processedData.reduce((sum, d) => sum + (d[selectedMetric] || 0), 0) / processedData.length,
                  currentMetric.format
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Segments:</span>
              <span className="ml-2 font-medium">{processedData.length}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}