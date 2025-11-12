"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, ChevronRight, ChevronDown, Package } from 'lucide-react';

// Component Registry with dynamic imports - using available components
const componentRegistry: Record<string, Record<string, () => Promise<any>>> = {
  'customer-segmentation': {
    distributionMap: () => import('../../../customer/customer-segmentation/components').then(mod => ({ default: mod.SegmentDistributionMap })),
    profileCards: () => import('../../../customer/customer-segmentation/components').then(mod => ({ default: mod.SegmentProfileCards })),
    metricComparison: () => import('../../../customer/customer-segmentation/components').then(mod => ({ default: mod.SegmentMetricComparison })),
    kpiTiles: () => import('components/index').then(mod => ({ default: mod.KPITiles })),
    distribution: () => import('../Visualizations/FrequencyHistogram'),
    matrix: () => import('../Visualizations/IntervalHeatmap'),
    flow: () => import('../Visualizations/FrequencyHistogram'),
    analysis: () => import('../Visualizations/IntervalHeatmap')
  },
  'customer-lifetime-value': {
    // Full names
    kpiTiles: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.LtvKPIs })),
    ltvDistribution: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.LtvDistribution })),
    customerExplorer: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.TopCustomers })),
    predictionAccuracy: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.PredictionAccuracy })),
    segmentAnalysis: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.SegmentAnalysis })),
    ltvTrends: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.LtvTrends })),
    valueContribution: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.ValueContributionAnalysis })),
    // Short aliases for agent compatibility
    kpis: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.LtvKPIs })),
    distribution: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.LtvDistribution })),
    customers: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.TopCustomers })),
    accuracy: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.PredictionAccuracy })),
    segments: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.SegmentAnalysis })),
    trends: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.LtvTrends })),
    contribution: () => import('../../../customer/customer-lifetime-value/components').then(mod => ({ default: mod.ValueContributionAnalysis }))
  },
  'churn-prediction': {
    riskPyramid: () => import('components/index').then(mod => ({ default: mod.RiskPyramid })),
    featureImportance: () => import('components/index').then(mod => ({ default: mod.AIFeatureImportance })),
    probabilityHistogram: () => import('components/index').then(mod => ({ default: mod.ProbabilityHistogram })),
    temporalRisk: () => import('components/index').then(mod => ({ default: mod.LineChart })),
    segmentMatrix: () => import('components/index').then(mod => ({ default: mod.SegmentComparisonMatrix })),
    kpiTiles: () => import('components/index').then(mod => ({ default: mod.KPITiles })),
    churnAnalysis: () => import('../../../customer/churn-prediction/components/ChurnRiskAnalysis').then(mod => ({
      default: mod.ChurnRiskAnalysis
    }))
  },
  'engagement-classifier': {
    // Full names
    kpiTiles: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.EngagementKPIs })),
    engagementPyramid: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.EngagementPyramid })),
    engagementTimeline: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.EngagementTimeline })),
    opportunityFinder: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.OpportunityFinder })),
    customerClassification: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.CustomerClassification })),
    engagementDistribution: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.EngagementDistribution })),
    engagementScore: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.EngagementScore })),
    actionableInsights: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.ActionableInsights })),
    engagementTrends: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.EngagementTrends })),
    customerSearchAnalytics: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.CustomerSearchAnalytics })),
    customerDetailModal: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.CustomerDetailModal })),
    // Short aliases for agent compatibility
    kpis: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.EngagementKPIs })),
    pyramid: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.EngagementPyramid })),
    timeline: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.EngagementTimeline })),
    opportunities: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.OpportunityFinder })),
    classification: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.CustomerClassification })),
    distribution: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.EngagementDistribution })),
    score: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.EngagementScore })),
    insights: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.ActionableInsights })),
    trends: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.EngagementTrends })),
    search: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.CustomerSearchAnalytics })),
    detailModal: () => import('../../../customer/engagement-classifier/components').then(mod => ({ default: mod.CustomerDetailModal }))
  },
  'visualization': {
    barchart: () => import('components/index').then(mod => ({ default: mod.BarChart })),
    linechart: () => import('components/index').then(mod => ({ default: mod.LineChart })),
    histogram: () => import('../Visualizations/FrequencyHistogram'),
    heatmap: () => import('../Visualizations/IntervalHeatmap')
  },
  'inventory-management': {
    levels: () => import('../Visualizations/FrequencyHistogram'),
    turnover: () => import('../Visualizations/IntervalHeatmap'),
    forecast: () => import('../Visualizations/FrequencyHistogram'),
    alerts: () => import('../Visualizations/IntervalHeatmap')
  },
  'inventory-holding-cost': {
    // Full names
    kpiTiles: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostKPIs })),
    holdingCostAnalysis: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostAnalysis })),
    holdingCostInsights: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostInsights })),
    highCostItemsTable: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HighCostItemsTable })),
    // Short aliases for agent compatibility
    kpis: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostKPIs })),
    overview: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostAnalysis })),
    analysis: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostAnalysis })),
    insights: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostInsights })),
    items: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HighCostItemsTable })),
    table: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HighCostItemsTable }))
  },
  'inventory-holding-cost-analyzer': {
    // Full names
    kpiTiles: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostKPIs })),
    holdingCostAnalysis: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostAnalysis })),
    holdingCostInsights: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostInsights })),
    highCostItemsTable: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HighCostItemsTable })),
    // Short aliases for agent compatibility
    kpis: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostKPIs })),
    overview: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostAnalysis })),
    analysis: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostAnalysis })),
    insights: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HoldingCostInsights })),
    items: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HighCostItemsTable })),
    table: () => import('../../../inventory/holding-cost/components').then(mod => ({ default: mod.HighCostItemsTable }))
  },
  'stock-optimization': {
    // Stock optimization uses KPIRow and table-based layout
    kpis: () => import('components/index').then(mod => ({ default: mod.KPIRow })),
    overview: () => import('components/index').then(mod => ({ default: mod.KPIRow })),
    recommendations: () => import('components/index').then(mod => ({ default: mod.KPIRow })),
    metrics: () => import('components/index').then(mod => ({ default: mod.KPIRow }))
  },
  'sales-performance': {
    kpis: () => import('../../../sales/sales-performance/components/SalesKPIs'),
    // Full names
    performanceOverview: () => import('../../../sales/sales-performance/components').then(mod => ({ default: mod.PerformanceOverview })),
    timeSeriesExplorer: () => import('../../../sales/sales-performance/components').then(mod => ({ default: mod.TimeSeriesExplorer })),
    distributionAnalyzer: () => import('../../../sales/sales-performance/components').then(mod => ({ default: mod.PerformanceDistributionAnalyzer })),
    comparativeGrid: () => import('../../../sales/sales-performance/components').then(mod => ({ default: mod.ComparativePerformanceGrid })),
    correlationMatrix: () => import('../../../sales/sales-performance/components').then(mod => ({ default: mod.PerformanceCorrelationMatrix })),
    driverAnalysis: () => import('../../../sales/sales-performance/components').then(mod => ({ default: mod.PerformanceDriverAnalysis })),
    // Short aliases for agent compatibility
    overview: () => import('../../../sales/sales-performance/components').then(mod => ({ default: mod.PerformanceOverview })),
    timeSeries: () => import('../../../sales/sales-performance/components').then(mod => ({ default: mod.TimeSeriesExplorer })),
    distribution: () => import('../../../sales/sales-performance/components').then(mod => ({ default: mod.PerformanceDistributionAnalyzer })),
    comparative: () => import('../../../sales/sales-performance/components').then(mod => ({ default: mod.ComparativePerformanceGrid })),
    correlation: () => import('../../../sales/sales-performance/components').then(mod => ({ default: mod.PerformanceCorrelationMatrix })),
    drivers: () => import('../../../sales/sales-performance/components').then(mod => ({ default: mod.PerformanceDriverAnalysis }))
  },
  'product-performance': {
    kpis: () => import('../../../sales/product-performance/components').then(mod => ({ default: mod.ProductKPIs })),
    overview: () => import('../../../sales/product-performance/components').then(mod => ({ default: mod.ProductPerformanceOverview })),
    topProducts: () => import('../../../sales/product-performance/components').then(mod => ({ default: mod.TopProductsTable })),
    categoryAnalysis: () => import('../../../sales/product-performance/components').then(mod => ({ default: mod.CategoryPerformanceChart })),
    marginAnalysis: () => import('../../../sales/product-performance/components').then(mod => ({ default: mod.MarginAnalysisScatter })),
    priceBands: () => import('../../../sales/product-performance/components').then(mod => ({ default: mod.PriceBandDistribution }))
  },
  'cash-flow': {
    kpis: () => import('../../../finance/cash-flow/components').then(mod => ({ default: mod.CashFlowKPIs })),
    trends: () => import('../../../finance/cash-flow/components').then(mod => ({ default: mod.CashFlowTrends })),
    operating: () => import('../../../finance/cash-flow/components').then(mod => ({ default: mod.OperatingCashFlow })),
    investing: () => import('../../../finance/cash-flow/components').then(mod => ({ default: mod.InvestmentCashFlow })),
    financing: () => import('../../../finance/cash-flow/components').then(mod => ({ default: mod.FinancingCashFlow })),
    projection: () => import('../../../finance/cash-flow/components').then(mod => ({ default: mod.CashFlowProjection })),
    table: () => import('../../../finance/cash-flow/components').then(mod => ({ default: mod.CashFlowTable })),
    'fcf-bridge': () => import('../../../finance/cash-flow/components').then(mod => ({ default: mod.FCFValueBridge })),
    'liquidity-timeline': () => import('../../../finance/cash-flow/components').then(mod => ({ default: mod.LiquidityTimeline })),
    'capital-allocation': () => import('../../../finance/cash-flow/components').then(mod => ({ default: mod.CapitalAllocationMatrix }))
  },
  'product-analytics': {
    performance: () => import('../Visualizations/FrequencyHistogram'),
    comparison: () => import('../Visualizations/IntervalHeatmap'),
    lifecycle: () => import('../Visualizations/FrequencyHistogram'),
    recommendations: () => import('../Visualizations/IntervalHeatmap')
  },
  'marketing-roi': {
    campaigns: () => import('../Visualizations/FrequencyHistogram'),
    channels: () => import('../Visualizations/IntervalHeatmap'),
    attribution: () => import('../Visualizations/FrequencyHistogram'),
    spend: () => import('../Visualizations/IntervalHeatmap')
  },
  'customer-journey': {
    map: () => import('../Visualizations/IntervalHeatmap'),
    touchpoints: () => import('../Visualizations/FrequencyHistogram'),
    conversion: () => import('../Visualizations/FrequencyHistogram'),
    dropout: () => import('../Visualizations/IntervalHeatmap')
  },
  'anomaly-detection': {
    alerts: () => import('../Visualizations/IntervalHeatmap'),
    patterns: () => import('../Visualizations/FrequencyHistogram'),
    timeline: () => import('../Visualizations/FrequencyHistogram'),
    distribution: () => import('../Visualizations/FrequencyHistogram')
  },
  'retention-planner': {
    kpiTiles: () => import('components/index').then(mod => ({ default: mod.KPITiles })),
    dashboard: () => import('../Visualizations/FrequencyHistogram'), // Using histogram as placeholder
    churnRiskGauge: () => import('../Visualizations/IntervalHeatmap'), // Using heatmap as placeholder
    valueRiskMatrix: () => import('../Visualizations/IntervalHeatmap'), // Using heatmap as placeholder
    actionSankey: () => import('../Visualizations/FrequencyHistogram'), // Using histogram as placeholder
    roiWaterfall: () => import('../Visualizations/FrequencyHistogram') // Using histogram as placeholder
  }
};

// Get component from registry
export async function getComponentFromRegistry(toolId: string, type: string) {
  const tool = componentRegistry[toolId];
  if (!tool) return null;
  
  const componentLoader = tool[type];
  if (!componentLoader) return null;
  
  try {
    const module = await componentLoader();
    return module.default || module;
  } catch (error) {
    console.error(`Failed to load component ${toolId}.${type}:`, error);
    return null;
  }
}

interface ComponentRegistryProps {
  onAddComponent: (type: string, toolId: string) => void;
}

export default function ComponentRegistry({ onAddComponent }: ComponentRegistryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTools, setExpandedTools] = useState<string[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const toggleTool = (toolId: string) => {
    setExpandedTools(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const filteredRegistry = Object.entries(componentRegistry).reduce(
    (acc, [toolId, components]) => {
      if (searchQuery) {
        const matchingComponents = Object.keys(components).filter(type =>
          type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          toolId.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (matchingComponents.length > 0) {
          acc[toolId] = Object.fromEntries(
            matchingComponents.map(type => [type, components[type]])
          );
        }
      } else {
        acc[toolId] = components;
      }
      return acc;
    },
    {} as typeof componentRegistry
  );

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="fixed left-4 top-20 z-30 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all"
        title="Component Library"
      >
        <Package className="w-5 h-5 text-cyan-400" />
      </button>

      {/* Registry Panel */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-gray-900 border-r border-gray-800 z-25 transition-transform transform ${
          isPanelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-gray-200 mb-3">
              Component Library
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search components..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Component List */}
          <div className="flex-1 overflow-y-auto p-4">
            {Object.entries(filteredRegistry).map(([toolId, components]) => (
              <div key={toolId} className="mb-3">
                <button
                  onClick={() => toggleTool(toolId)}
                  className="flex items-center justify-between w-full p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium text-gray-300">
                    {toolId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  {expandedTools.includes(toolId) ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                {expandedTools.includes(toolId) && (
                  <div className="ml-4 mt-1">
                    {Object.keys(components).map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          onAddComponent(type, toolId);
                          setIsPanelOpen(false);
                        }}
                        className="block w-full text-left px-3 py-1.5 text-sm text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50 rounded transition-colors"
                      >
                        {type.replace(/([A-Z])/g, ' $1').trim()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <div className="text-xs text-gray-500">
              {Object.keys(filteredRegistry).length} tools •{' '}
              {Object.values(filteredRegistry).reduce(
                (acc, components) => acc + Object.keys(components).length,
                0
              )}{' '}
              components
            </div>
          </div>
        </div>
      </div>
    </>
  );
}