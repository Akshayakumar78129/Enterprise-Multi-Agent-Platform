"use client";

import React, { useEffect } from 'react';
import { DashboardSection, FilterBar, PageLoader } from 'components/index';
import {
  PurchaseFrequencyKPIs,
  FrequencyDistribution,
  FrequencyTable,
  CustomerSegmentChart,
  PurchaseIntervalChart,
  LifecycleStagesChart
} from './components';
import { usePurchaseFrequencyData } from './hooks/usePurchaseFrequencyData';
import { usePurchaseFrequencyContext } from './context';

export default function PurchaseFrequencyPage() {
  const { filters, setFilters, setInsights, setKpiMetrics } = usePurchaseFrequencyContext();

  const { data, isLoading, error } = usePurchaseFrequencyData(filters);

  // DEBUG: Log everything
  useEffect(() => {
    console.log('=== PURCHASE FREQUENCY DEBUG ===');
    console.log('isLoading:', isLoading);
    console.log('error:', error);
    console.log('data:', data);
    console.log('frequencyDistribution length:', data?.frequencyDistribution?.length);
    console.log('customerSegmentation length:', data?.customerSegmentation?.length);
    console.log('customerDetails length:', data?.customerDetails?.length);
  }, [data, isLoading, error]);

  // Update context with insights and KPI metrics
  useEffect(() => {
    if (data?.insights) {
      setInsights(data.insights);
    }
    if (data?.kpiMetrics) {
      setKpiMetrics(data.kpiMetrics);
    }
  }, [data?.insights, data?.kpiMetrics, setInsights, setKpiMetrics]);

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('purchase_frequency_filters');
    }
    setFilters({
      dateRange: {
        startDate: '2017-01-01',
        endDate: '2021-12-31',
      },
      customerSegments: [],
      productCategories: [],
    });
  };

  // Error state with proper UI
  if (error && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Purchase Frequency Data Available
          </h2>
          <p className="text-muted-foreground mb-4">
            {error.message || "There's no purchase frequency data to display for the selected filters. Try adjusting your filters or check back later."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      isLoading={isLoading}
      loaderProps={{
        title: "Purchase Frequency",
      }}
    >
      <div className="space-y-6">
        {/* Filters */}
        <DashboardSection>
          <FilterBar
            config={{
              dateRange: {
                enabled: true,
                value: filters.dateRange || { startDate: '2017-01-01', endDate: '2021-12-31' },
                onChange: (range) => {
                  if (range?.startDate && range?.endDate) {
                    setFilters({
                      ...filters,
                      dateRange: {
                        startDate: range.startDate,
                        endDate: range.endDate
                      }
                    });
                  }
                }
              },
            multiSelect: [
              {
                id: 'customerSegments',
                label: 'Customer Segments',
                options: [
                  { label: 'High Frequency', value: 'High' },
                  { label: 'Medium Frequency', value: 'Medium' },
                  { label: 'Low Frequency', value: 'Low' },
                ],
                value: filters.customerSegments || [],
                onChange: (values) => setFilters({ ...filters, customerSegments: values }),
                placeholder: 'Select segments...'
              }
            ]
          }}
          onReset={handleReset}
          showResetButton={true}
        />
      </DashboardSection>

      {/* KPIs */}
      <div id="key-metrics" />
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Key Metrics</h3>
        <PurchaseFrequencyKPIs
          data={data?.kpiMetrics || {
            total_customers: 0,
            avg_frequency: 0,
            high_frequency_customers: 0,
            medium_frequency_customers: 0,
            low_frequency_customers: 0,
            total_revenue: 0
          }}
          loading={isLoading}
        />
      </DashboardSection>

      {/* Frequency Distribution */}
      <div id="frequency-distribution" />
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          Purchase Frequency Distribution
        </h3>
        <FrequencyDistribution
          data={data?.frequencyDistribution || []}
          loading={isLoading}
        />
      </DashboardSection>

      {/* Customer Segmentation */}
      <div id="customer-segmentation" />
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          Customer Segmentation Analysis
        </h3>
        <CustomerSegmentChart
          data={data?.customerSegmentation || []}
          loading={isLoading}
        />
      </DashboardSection>

      {/* Purchase Intervals */}
      <div id="purchase-intervals" />
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          Purchase Interval Distribution
        </h3>
        <PurchaseIntervalChart
          data={data?.purchaseIntervals || []}
          loading={isLoading}
        />
      </DashboardSection>

      {/* Lifecycle Stages */}
      <div id="lifecycle-stages" />
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          Customer Lifecycle Stages
        </h3>
        <LifecycleStagesChart
          data={data?.lifecycleStages || []}
          loading={isLoading}
        />
      </DashboardSection>

      {/* Customer Details Table */}
      <div id="customer-details" />
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          Customer Details
        </h3>
        <FrequencyTable
          data={data?.customerDetails || []}
          loading={isLoading}
        />
      </DashboardSection>
      </div>
    </PageLoader>
  );
}
