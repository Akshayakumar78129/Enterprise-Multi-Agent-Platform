"use client";

import React, { useMemo } from 'react';
import { DashboardSection, PageLoader } from 'components/index';
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
  const { setCustomers } = useCustomerLtvContext();
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);

  // Use fixed date range for 2017-2021 data - memoized to prevent infinite loops
  const filters = useMemo(() => ({
    date_from: '2017-01-01',
    date_to: '2021-12-31'
  }), []);

  const {
    loading,
    error,
    ltvDistribution,
    segmentAnalysis,
    ltvTrends,
    topCustomers,
    predictionData,
    valueContribution,
    kpiMetrics,
    hasNoData
  } = useCustomerLtvData(filters);

  // Update customers in context for BI panel
  React.useEffect(() => {
    if (topCustomers && topCustomers.length > 0) {
      setCustomers(topCustomers);
    }
  }, [topCustomers, setCustomers]);

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
      {/* KPIs Section */}
      <DashboardSection title="Key Metrics">
        <LtvKPIs
          metrics={kpiMetrics}
          loading={false}
        />
      </DashboardSection>

      {/* Value Distribution Section - 2 graphs */}
      <DashboardSection title="Value Analysis">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <LtvDistribution
            data={ltvDistribution}
            loading={false}
          />
          <SegmentAnalysis
            data={segmentAnalysis}
            loading={false}
          />
        </div>
      </DashboardSection>


      {/* Trends Section - Full width */}
      <DashboardSection title="Temporal Analysis">
        <LtvTrends
          data={ltvTrends}
          loading={false}
        />
      </DashboardSection>

      {/* Top Customers Table */}
      <DashboardSection title="Customer Rankings">
        <TopCustomers
          data={topCustomers}
          loading={false}
          onCustomerSelect={handleCustomerSelect}
        />
      </DashboardSection>

      {/* Selected Customer Details */}
      {selectedCustomer && (
        <DashboardSection title="Customer Details">
          <div className="p-6 bg-background/50 rounded-lg border border-primary/20">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-foreground">
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