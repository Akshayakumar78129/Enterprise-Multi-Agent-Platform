"use client";

import React from 'react';
import {
  DashboardSection,
  PageLoader,
  FilterBar,
  ChartCard,
  getShiftClickManager
} from 'components/index';
import {
  RetentionKPIs,
  ChurnRiskGauge,
  ValueRiskMatrix,
  InterventionROI,
  LifecycleStages
} from './components';
import { useRetentionPlannerContext } from './context';
import { useRetentionPlannerData } from './hooks/useRetentionPlannerData';
import { LOYALTY_STATUS_OPTIONS, DEFAULT_DATE_RANGE } from '@/lib/constants/filterOptions';

export default function RetentionPlannerPage() {
  const { filters, setFilters, setRetentionData, setInsights, setKpiMetrics } = useRetentionPlannerContext();
  const shiftClickManager = getShiftClickManager();

  // Initialize default filters
  React.useEffect(() => {
    if (!filters.dateRange) {
      setFilters({
        dateRange: DEFAULT_DATE_RANGE,
        loyaltyStatus: [],
        riskThreshold: 0.5
      });
    }
  }, []);

  const {
    loading,
    error,
    kpiMetrics,
    insights,
    riskDistribution,
    valueRiskMatrix,
    interventionROI,
    lifecycleStages,
    hasNoData
  } = useRetentionPlannerData(filters);

  React.useEffect(() => {
    setRetentionData({
      riskDistribution,
      valueRiskMatrix,
      interventionROI,
      lifecycleStages
    });
    setKpiMetrics(kpiMetrics);
    setInsights(insights || []);
  }, [riskDistribution, valueRiskMatrix, interventionROI, lifecycleStages, kpiMetrics, insights]); // setRetentionData, setKpiMetrics, setInsights are stable, no need in deps

  // Error state with proper UI
  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Retention Planning Data Available
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "There's no retention planning data to display for the selected filters. Try adjusting your filters or check back later."}
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
      isLoading={loading}
      loaderProps={{
        title: "Retention Planning",
      }}
    >
      <div className="space-y-6">
        {/* Filters */}
        <DashboardSection>
          <FilterBar
            config={{
              dateRange: {
                enabled: true,
                value: filters.dateRange || DEFAULT_DATE_RANGE,
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
                  id: 'loyaltyStatus',
                  label: 'Loyalty Status',
                  options: LOYALTY_STATUS_OPTIONS,
                  value: filters.loyaltyStatus || [],
                  onChange: (values) => setFilters({ ...filters, loyaltyStatus: values }),
                  placeholder: 'Select loyalty status...'
                }
              ],
              customFilters: (
                <div className="w-full">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Risk Threshold
                  </label>
                  <div className="w-full px-3 py-2 bg-surface border-0 rounded-lg min-h-[48px] flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted">0.0</span>
                      <span className="text-sm font-medium text-foreground">{(filters.riskThreshold || 0.5).toFixed(2)}</span>
                      <span className="text-xs text-muted">1.0</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={filters.riskThreshold || 0.5}
                      onChange={(e) => setFilters({ ...filters, riskThreshold: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              )
            }}
            onReset={() => {
              setFilters({
                dateRange: DEFAULT_DATE_RANGE,
                loyaltyStatus: [],
                riskThreshold: 0.5
              });
            }}
            showResetButton={true}
          />
        </DashboardSection>

        <div id="key-metrics" />
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Key Metrics</h3>
          <RetentionKPIs
            data={kpiMetrics}
            loading={loading}
            onKPIShiftClick={(kpi, event) => {
              shiftClickManager.addPoint({
                label: kpi.label,
                value: kpi.value,
                source: 'Retention Planning - KPIs'
              }, event.nativeEvent);
            }}
          />
        </DashboardSection>

      <div id="retention-analysis" />
      <DashboardSection>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Churn Risk Distribution</h3>
            <ChartCard
              className="glass-card card-hover"
              onShiftClick={(event) => {
                shiftClickManager.addPoint({
                  label: "Churn Risk Distribution",
                  value: `Risk distribution visualization`,
                  source: 'Retention Planning - Risk Distribution'
                }, event.nativeEvent);
              }}
            >
              <ChurnRiskGauge data={riskDistribution} loading={loading} />
            </ChartCard>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Customer Lifecycle Stages</h3>
            <ChartCard
              className="glass-card card-hover"
              onShiftClick={(event) => {
                shiftClickManager.addPoint({
                  label: "Customer Lifecycle Stages",
                  value: `Lifecycle stages visualization`,
                  source: 'Retention Planning - Lifecycle'
                }, event.nativeEvent);
              }}
            >
              <LifecycleStages data={lifecycleStages} loading={loading} />
            </ChartCard>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Customer Value-Risk Matrix</h3>
        <ChartCard
          className="glass-card card-hover"
          onShiftClick={(event) => {
            shiftClickManager.addPoint({
              label: "Customer Value-Risk Matrix",
              value: `Value-risk matrix visualization`,
              source: 'Retention Planning - Value-Risk Matrix'
            }, event.nativeEvent);
          }}
        >
          <ValueRiskMatrix data={valueRiskMatrix} loading={loading} />
        </ChartCard>
      </DashboardSection>

      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Intervention ROI Analysis</h3>
        <ChartCard
          className="glass-card card-hover"
          onShiftClick={(event) => {
            shiftClickManager.addPoint({
              label: "Intervention ROI Analysis",
              value: `ROI analysis visualization`,
              source: 'Retention Planning - ROI'
            }, event.nativeEvent);
          }}
        >
          <InterventionROI data={interventionROI} loading={loading} />
        </ChartCard>
      </DashboardSection>
      </div>
    </PageLoader>
  );
}