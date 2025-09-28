"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection
} from 'components/index';
import {
  PredictionKPIs,
  NextPurchasePredictions,
  PurchaseProbability,
  RecommendedProducts,
  TimingForecast,
  PredictionAccuracy
} from './components';
import { useNextPurchaseContext } from './context';
import { useNextPurchaseData } from './hooks/useNextPurchaseData';

export default function NextPurchasePage() {
  const { filters, setPredictionData } = useNextPurchaseContext();

  const {
    loading,
    error,
    nextPurchasePredictions,
    purchaseProbability,
    recommendedProducts,
    timingForecast,
    hasNoData,
    kpiMetrics
  } = useNextPurchaseData(filters);

  React.useEffect(() => {
    setPredictionData({ nextPurchasePredictions, purchaseProbability });
  }, [nextPurchasePredictions, purchaseProbability, setPredictionData]);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Purchase Prediction Data Available
          </h2>
          <p className="text-muted-foreground">
            There's no next purchase prediction data to display for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardSection title="Next Purchase Prediction Overview">
        <PredictionKPIs metrics={kpiMetrics} loading={loading} />
      </DashboardSection>

      <DashboardGrid>
        <DashboardSection title="Purchase Predictions" description="ML-powered next purchase predictions">
          <NextPurchasePredictions data={nextPurchasePredictions} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Purchase Probability" description="Probability scores for next purchases">
          <PurchaseProbability data={purchaseProbability} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Recommended Products" description="Product recommendations">
          <RecommendedProducts data={recommendedProducts} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Timing Forecast" description="When customers are likely to purchase">
          <TimingForecast data={timingForecast} loading={loading} />
        </DashboardSection>

        <DashboardSection title="Prediction Accuracy" description="Model performance metrics" className="col-span-2">
          <PredictionAccuracy data={nextPurchasePredictions} loading={loading} />
        </DashboardSection>
      </DashboardGrid>
    </div>
  );
}