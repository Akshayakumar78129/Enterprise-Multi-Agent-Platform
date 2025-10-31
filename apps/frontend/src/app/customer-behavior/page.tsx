"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection,
  PageLoader
} from 'components/index';
import {
  BehaviorKPIs,
  PurchasePatterns,
  EngagementMetrics,
  CustomerTable
} from './components';
import { useBehaviorContext } from './context';
import { useBehaviorData } from './hooks/useBehaviorData';

export default function CustomerBehaviorPage() {
  const { filters, setBehaviorCustomers } = useBehaviorContext();

  const {
    loading,
    error,
    purchasePatterns,
    engagementMetrics,
    topCustomers,
    hasNoData,
    kpiMetrics
  } = useBehaviorData(filters);

  // Update context with customer data for BI panel
  React.useEffect(() => {
    setBehaviorCustomers(topCustomers);
  }, [topCustomers, setBehaviorCustomers]);

  // Handle customer selection
  const handleCustomerSelect = (customer: any) => {
    console.log('Selected customer:', customer);
    // Could open a detail modal or navigate to customer profile
  };

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-2">Unable to load data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Customer Behavior",
      }}
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
            Key Metrics
          </h3>
          <BehaviorKPIs kpiMetrics={kpiMetrics} loading={false} />
        </DashboardSection>

        {/* Purchase Patterns Section */}
        <DashboardSection>
          <PurchasePatterns
            data={purchasePatterns}
            loading={false}
          />
        </DashboardSection>

        {/* Engagement Metrics Section */}
        <DashboardSection>
          <EngagementMetrics
            data={engagementMetrics}
            loading={false}
            purchasePatternsData={purchasePatterns}
          />
        </DashboardSection>

        {/* Customer Details Table */}
        <DashboardSection>
          <CustomerTable
            data={topCustomers}
            loading={false}
            onCustomerSelect={handleCustomerSelect}
          />
        </DashboardSection>
      </div>
    </PageLoader>
  );
}