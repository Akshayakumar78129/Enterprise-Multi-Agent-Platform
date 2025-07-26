import React, { useState, useEffect } from 'react';
import { DashboardState, FilterState, THEME, Metric } from '../types';
import KPITiles from '../components/kpi/KPITiles';
import TimeSeriesExplorer from '../components/visualizations/TimeSeriesExplorer';
import SeasonalPatternAnalyzer from '../components/visualizations/SeasonalPatternAnalyzer';
import GrowthRateVisualizer from '../components/visualizations/GrowthRateVisualizer';

const initialFilters: FilterState = {
  startDate: '2020-01-01',
  endDate: '2020-12-31',
  timePeriod: 'monthly',
  metric: 'revenue',
  dimension: null
};

const GRANULARITY_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
];

const SalesTrendDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    filters: initialFilters,
    data: null,
    isLoading: true,
    error: null
  });

  const fetchData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/sales-trends/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.filters)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setState(prev => ({
        ...prev,
        data: result.data,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [state.filters]);

  useEffect(() => {
    if (state.data?.kpis) {
      console.log('KPI data received:', state.data.kpis);
    }
  }, [state.data?.kpis]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  };

  const handleDataPointClick = (point: any) => {
    console.log('Data point clicked:', point);
    // Implement drill-down or detail view logic here
  };

  const handleMetricSelect = (metric: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, metric: metric as Metric }
    }));
  };

  if (state.error) {
    return (
      <div
        style={{
          padding: '24px',
          color: THEME.colors.signalMagenta,
          backgroundColor: THEME.colors.midnightNavy,
          minHeight: '100vh'
        }}
      >
        Error: {state.error}
      </div>
    );
  }

  // Debug: log before rendering KPI tiles
  console.log('Rendering KPI Tiles with:', {
    kpis: state.data?.kpis,
    isLoading: state.isLoading,
    selectedMetric: state.filters.metric
  });

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: THEME.colors.midnightNavy,
        minHeight: '100vh',
        color: THEME.colors.cloudWhite
      }}
    >
      <h1 style={{ marginBottom: '24px', color: THEME.colors.electricCyan }}>
        Sales Trend Analysis
      </h1>

      {/* Filter Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
        <div>
          <label style={{ fontWeight: 500, marginRight: 8 }}>Start Date:</label>
          <input
            type="date"
            value={state.filters.startDate}
            onChange={e => handleFilterChange({ startDate: e.target.value })}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #222', background: THEME.colors.graphite, color: THEME.colors.cloudWhite }}
          />
        </div>
        <div>
          <label style={{ fontWeight: 500, marginRight: 8 }}>End Date:</label>
          <input
            type="date"
            value={state.filters.endDate}
            onChange={e => handleFilterChange({ endDate: e.target.value })}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #222', background: THEME.colors.graphite, color: THEME.colors.cloudWhite }}
          />
        </div>
        <div>
          <label style={{ fontWeight: 500, marginRight: 8 }}>Granularity:</label>
          <select
            value={state.filters.timePeriod}
            onChange={e => handleFilterChange({ timePeriod: e.target.value as import('../types').TimePeriod })}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #222', background: THEME.colors.graphite, color: THEME.colors.cloudWhite }}
          >
            {GRANULARITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Section - always at the top */}
      <KPITiles
        data={state.data?.kpis}
        isLoading={state.isLoading}
        selectedMetric={state.filters.metric}
        onMetricSelect={handleMetricSelect}
      />

      {/* Main Visualizations Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
          marginBottom: '24px'
        }}
      >
        {/* Time Series Explorer */}
        <div style={{ gridColumn: '1 / -1' }}>
          <TimeSeriesExplorer
            data={state.data?.mainData}
            isLoading={state.isLoading}
            filters={state.filters}
            onFilterChange={handleFilterChange}
            onDataPointClick={handleDataPointClick}
          />
        </div>

        {/* Seasonal Pattern Analyzer */}
        <div>
          <SeasonalPatternAnalyzer
            data={state.data?.seasonality}
            isLoading={state.isLoading}
            timePeriod={state.filters.timePeriod}
            onTimePeriodChange={(period) => handleFilterChange({ timePeriod: period })}
          />
        </div>

        {/* Growth Rate Visualizer */}
        <div>
          <GrowthRateVisualizer
            data={state.data?.growthRates}
            isLoading={state.isLoading}
            timePeriod={state.filters.timePeriod}
            onTimePeriodChange={(period) => handleFilterChange({ timePeriod: period })}
          />
        </div>
      </div>
    </div>
  );
};

export default SalesTrendDashboard; 