"use client";

import React, { useEffect } from 'react';
import { DashboardSection, PageLoader, FilterBar } from 'components/index';
import {
  LtvKPIs,
  LtvDistribution,
  SegmentAnalysis,
  LtvTrends,
  TopCustomers
} from './components';
import { useCustomerLtvData } from './hooks/useCustomerLtvData';
import { useCustomerLtvContext } from './context';

export default function CustomerLtvPage() {
  const { filters, setFilters, setCustomers, setInsights } = useCustomerLtvContext();
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);

  const {
    loading,
    error,
    isFetching,
    ltvDistribution,
    segmentAnalysis,
    ltvTrends,
    topCustomers,
    predictionData,
    valueContribution,
    kpiMetrics,
    insights,
    hasNoData
  } = useCustomerLtvData(filters);

  // Update customers and insights in context for BI panel
  useEffect(() => {
    if (topCustomers && topCustomers.length > 0) {
      setCustomers(topCustomers);
    }
  }, [topCustomers, setCustomers]);

  useEffect(() => {
    if (insights) {
      setInsights(insights);
    }
  }, [insights, setInsights]);

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    console.log('Selected customer:', customer);
  };

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No LTV Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no lifetime value data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Customer Lifetime Value",
      }}
    >
      <div className="space-y-6">
      {/* Filters Section */}
      <DashboardSection>
        <FilterBar
          config={{
            dateRange: {
              enabled: true,
              value: filters.date_from && filters.date_to ? {
                from: new Date(filters.date_from),
                to: new Date(filters.date_to)
              } : { from: new Date('2017-01-01'), to: new Date('2021-12-31') },
              onChange: (range) => {
                if (range?.from && range?.to) {
                  setFilters({
                    ...filters,
                    date_from: range.from.toISOString().split('T')[0],
                    date_to: range.to.toISOString().split('T')[0]
                  });
                }
              }
            },
            multiSelect: [
              {
                id: 'regions',
                label: 'Regions',
                options: [
                  { value: 'north_america', label: 'North America' },
                  { value: 'europe', label: 'Europe' },
                  { value: 'asia_pacific', label: 'Asia Pacific' },
                  { value: 'latin_america', label: 'Latin America' },
                  { value: 'middle_east_africa', label: 'Middle East & Africa' }
                ],
                value: filters.regions || [],
                onChange: (values) => setFilters({ ...filters, regions: values }),
                placeholder: 'Select regions...'
              },
              {
                id: 'customerTypes',
                label: 'Customer Types',
                options: [
                  { value: 'enterprise', label: 'Enterprise' },
                  { value: 'mid_market', label: 'Mid-Market' },
                  { value: 'smb', label: 'Small Business' },
                  { value: 'startup', label: 'Startup' },
                  { value: 'individual', label: 'Individual' }
                ],
                value: filters.customerTypes || [],
                onChange: (values) => setFilters({ ...filters, customerTypes: values }),
                placeholder: 'Select customer types...'
              }
            ]
          }}
          onReset={() => {
            setFilters({
              date_from: '2017-01-01',
              date_to: '2021-12-31',
              regions: [],
              customerTypes: []
            });
          }}
          showResetButton={true}
        />
      </DashboardSection>

      {/* Background refetch indicator */}
      {isFetching && !loading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Updating...
          </div>
        </div>
      )}

      {/* KPIs Section */}
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Key Metrics</h3>
        <LtvKPIs
          metrics={kpiMetrics}
          loading={false}
        />
      </DashboardSection>

      {/* Value Distribution Section - 2 graphs */}
      <DashboardSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">LTV Distribution</h3>
            <LtvDistribution
              data={ltvDistribution}
              loading={false}
            />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Segment Analysis</h3>
            <SegmentAnalysis
              data={segmentAnalysis}
              loading={false}
            />
          </div>
        </div>
      </DashboardSection>


      {/* Trends Section - Full width */}
      <DashboardSection>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">LTV Trends Over Time</h3>
          <LtvTrends
            data={ltvTrends}
            loading={false}
          />
        </div>
      </DashboardSection>

      {/* Top Customers Table */}
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Customer Rankings</h3>
        <TopCustomers
          data={topCustomers}
          loading={false}
          onCustomerSelect={handleCustomerSelect}
        />
      </DashboardSection>

      {/* Selected Customer Details */}
      {selectedCustomer && (
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Customer Details</h3>
          <div className="p-6 bg-background/50 rounded-lg border border-primary/20">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                {selectedCustomer.name || selectedCustomer.customer_name}
              </h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-3 py-1 text-sm bg-background hover:bg-muted border border-border rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Customer ID</div>
                <div className="text-base font-medium">{selectedCustomer.id || selectedCustomer.customer_id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Lifetime Value</div>
                <div className="text-base font-medium text-primary">
                  ${(selectedCustomer.ltv || selectedCustomer.predicted_ltv || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Transactions</div>
                <div className="text-base font-medium">
                  {selectedCustomer.transactions || selectedCustomer.transaction_count || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Average Order</div>
                <div className="text-base font-medium">
                  ${(selectedCustomer.avgOrder || selectedCustomer.avg_order_value || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Segment</div>
                <div className="text-base font-medium">
                  {selectedCustomer.segment || selectedCustomer.customerType || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Trend</div>
                <div className={`text-base font-medium ${
                  (selectedCustomer.trend || 0) > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {selectedCustomer.trend || 0}%
                </div>
              </div>
              {selectedCustomer.percentage_error !== undefined && (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">Prediction Error</div>
                    <div className="text-base font-medium">
                      {selectedCustomer.percentage_error.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Error Category</div>
                    <div className="text-base font-medium">
                      {selectedCustomer.error_category}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </DashboardSection>
      )}
      </div>
    </PageLoader>
  );
}