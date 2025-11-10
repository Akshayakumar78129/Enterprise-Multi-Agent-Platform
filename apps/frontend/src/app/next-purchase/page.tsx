"use client";
import React from 'react';
import {
  DashboardSection,
  PageLoader
} from 'components/index';
import {
  PredictionKPIs,
  NextPurchaseFilters,
  NextPurchasePredictions,
  RecommendedProducts,
  ProductAffinityNetwork,
  PredictionConfidenceMatrix,
  CustomerPurchaseJourney,
  CategoryPerformanceOverview
} from './components';
import { useNextPurchaseContext } from './context';
import { useNextPurchaseData } from './hooks/useNextPurchaseData';

export default function NextPurchasePage() {
  const { filters, setFilters } = useNextPurchaseContext();
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<number | null>(null);

  const {
    loading,
    error,
    nextPurchasePredictions,
    recommendedProducts,
    productAffinityNetwork,
    confidenceMatrix,
    hasNoData,
    kpiMetrics,
    isFetching,
    customerJourneys,
    categoryPerformance,
    categorySeries
  } = useNextPurchaseData(filters);

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Next Purchase Predictor",
        hasNoData,
        noDataMessage: "No next purchase prediction data available",
        error: error || undefined
      }}
    >
      <div className="space-y-6">
        {/* Background refetch indicator */}
        {isFetching && !loading && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Updating...
            </div>
          </div>
        )}

        {/* 1. Filters Section */}
        <DashboardSection>
          <NextPurchaseFilters filters={filters} onFiltersChange={setFilters} />
        </DashboardSection>

        {/* 2. KPIs (8 tiles) */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Key Metrics</h3>
          <PredictionKPIs metrics={kpiMetrics} loading={loading} />
        </DashboardSection>

        {/* 3. Customer Purchase Journey (standalone) */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Customer Purchase Journey</h3>
          <CustomerPurchaseJourney
            data={customerJourneys ? Object.entries(customerJourneys).map(([customerId, customerData]) => {
              const custId = parseInt(customerId);
              // Handle both old format (array) and new format (object with customer_name and purchases)
              const purchases = Array.isArray(customerData) ? customerData : customerData.purchases;
              const customerName = !Array.isArray(customerData) && customerData.customer_name
                ? customerData.customer_name
                : `Customer ${custId}`;

              return {
                customerId: custId,
                customerName: customerName,
                purchases: purchases
              };
            }) : []}
            loading={loading}
            predictionRow={nextPurchasePredictions?.[0]}
            selectedCustomer={selectedCustomerId}
            onCustomerChange={setSelectedCustomerId}
          />
        </DashboardSection>

        {/* 6. Product Affinity Network */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Product Affinity Network</h3>
          <ProductAffinityNetwork data={productAffinityNetwork} loading={loading} />
        </DashboardSection>

        {/* 7. Category Performance */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Category Performance</h3>
          <CategoryPerformanceOverview
            data={categoryPerformance}
            series={categorySeries}
            loading={loading}
          />
        </DashboardSection>

        {/* 7. Prediction Confidence Matrix */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Prediction Confidence Matrix</h3>
          <PredictionConfidenceMatrix data={confidenceMatrix} loading={loading} />
        </DashboardSection>

        {/* 8. Recommended Products */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Top Recommended Products</h3>
          <RecommendedProducts data={recommendedProducts} loading={loading} />
        </DashboardSection>

        {/* 9. Top Purchase Predictions Table */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Top Purchase Predictions</h3>
          <NextPurchasePredictions
            data={nextPurchasePredictions}
            customerJourneys={customerJourneys}
            loading={loading}
          />
        </DashboardSection>
      </div>
    </PageLoader>
  );
}
