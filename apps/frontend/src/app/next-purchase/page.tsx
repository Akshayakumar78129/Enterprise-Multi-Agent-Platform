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
  AIInsightsChips,
  ModelOpsPanel,
  CustomerPurchaseJourney,
  CategoryPerformanceOverview,
  PurchaseTimingPredictor
} from './components';
import { useNextPurchaseContext } from './context';
import { useNextPurchaseData } from './hooks/useNextPurchaseData';

export default function NextPurchasePage() {
  const { filters, setFilters } = useNextPurchaseContext();

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
    purchaseTimingData,
    categorySeries
  } = useNextPurchaseData(filters);

  const handleAIActionClick = (action: string) => {
    console.log('AI Action clicked:', action);
    // TODO: Implement action handlers (filter updates, navigation, etc.)
  };

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
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

        {/* 2. KPIs (7 tiles) */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Key Metrics</h3>
          <PredictionKPIs metrics={kpiMetrics} loading={loading} />
        </DashboardSection>

        {/* 3. Model Ops Panel */}
        <DashboardSection>
          <ModelOpsPanel metrics={kpiMetrics} loading={loading} />
        </DashboardSection>

        {/* 4. AI Insights Quick Actions */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">AI-Powered Insights</h3>
          <AIInsightsChips metrics={kpiMetrics} onActionClick={handleAIActionClick} />
        </DashboardSection>

        {/* 5. Top Predictions Table (with expandable journey) */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Top Purchase Predictions</h3>
          <NextPurchasePredictions
            data={nextPurchasePredictions}
            customerJourneys={customerJourneys}
            loading={loading}
          />
        </DashboardSection>

        {/* 6. Customer Purchase Journey (standalone) */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Customer Purchase Journey</h3>
          <CustomerPurchaseJourney
            data={customerJourneys ? Object.values(customerJourneys).flat() : []}
            loading={loading}
            predictionRow={nextPurchasePredictions?.[0]}
          />
        </DashboardSection>

        {/* 7. Grid: Product Affinity Network + Category Performance */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DashboardSection>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Product Affinity Network</h3>
            <ProductAffinityNetwork data={productAffinityNetwork} loading={loading} />
          </DashboardSection>

          <DashboardSection>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Category Performance</h3>
            <CategoryPerformanceOverview
              data={categoryPerformance}
              series={categorySeries}
              loading={loading}
            />
          </DashboardSection>
        </div>

        {/* 8. Grid: Confidence Matrix + Time-to-Purchase Predictor */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DashboardSection>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Prediction Confidence Matrix</h3>
            <PredictionConfidenceMatrix data={confidenceMatrix} loading={loading} />
          </DashboardSection>

          <DashboardSection>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Purchase Timing Predictor</h3>
            <PurchaseTimingPredictor data={purchaseTimingData} loading={loading} />
          </DashboardSection>
        </div>

        {/* 9. Recommended Products */}
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Top Recommended Products</h3>
          <RecommendedProducts data={recommendedProducts} loading={loading} />
        </DashboardSection>
      </div>
    </PageLoader>
  );
}
