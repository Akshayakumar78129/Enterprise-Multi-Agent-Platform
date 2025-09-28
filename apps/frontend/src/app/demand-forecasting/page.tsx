"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection
} from 'components/index';
import {
  ForecastKPIs,
  DemandTrends,
  ForecastAccuracy,
  SeasonalPatterns,
  ProductDemand,
  RegionalDemand,
  ForecastTable
} from './components';
import { useForecastContext } from './context';
import { useForecastData } from './hooks/useForecastData';

export default function DemandForecastingPage() {
  const { filters, setForecastData } = useForecastContext();

  const {
    loading,
    error,
    demandTrends,
    forecastAccuracy,
    seasonalPatterns,
    productDemand,
    regionalDemand,
    forecastItems,
    hasNoData,
    kpiMetrics
  } = useForecastData(filters);

  // Update context with forecast data for BI panel
  React.useEffect(() => {
    setForecastData(forecastItems);
  }, [forecastItems, setForecastData]);

  // Handle forecast item selection
  const handleItemSelect = (item: any) => {
    console.log('Selected forecast item:', item);
    // Could open a detail modal or navigate to item forecast details
  };

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-2">Unable to load forecast data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* KPI Section */}
      <DashboardSection title="Forecast Metrics">
        <ForecastKPIs kpiMetrics={kpiMetrics} loading={loading} />
      </DashboardSection>

      {/* Primary Analysis Section */}
      <DashboardSection title="Demand Analysis">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Left Column - Trends and Accuracy */}
          <div className="space-y-4 lg:space-y-6">
            <DemandTrends
              data={demandTrends}
              loading={loading}
            />
            <ForecastAccuracy
              data={forecastAccuracy}
              loading={loading}
            />
          </div>

          {/* Right Column - Patterns and Regional */}
          <div className="space-y-4 lg:space-y-6">
            <SeasonalPatterns
              data={seasonalPatterns}
              loading={loading}
            />
            <RegionalDemand
              data={regionalDemand}
              loading={loading}
            />
          </div>
        </div>
      </DashboardSection>

      {/* Product Demand Section */}
      <DashboardSection title="Product Demand Forecast">
        <ProductDemand
          data={productDemand}
          loading={loading}
        />
      </DashboardSection>

      {/* Forecast Details Table */}
      <DashboardSection title="Forecast Details">
        <ForecastTable
          data={forecastItems}
          loading={loading}
          onItemSelect={handleItemSelect}
        />
      </DashboardSection>
    </>
  );
}