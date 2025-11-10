import dynamic from 'next/dynamic';

// Component registry for dynamic imports - All modules from Enterprise IQ
export const componentRegistry = {
  // Churn Prediction components
  'churn-prediction': {
    dashboard: dynamic(() => import('../churn-prediction/page'), { ssr: false }),
    riskPyramid: dynamic(() => import('components').then(mod => mod.RiskPyramid), { ssr: false }),
    featureImportance: dynamic(() => import('components').then(mod => mod.AIFeatureImportance), { ssr: false }),
    segmentMatrix: dynamic(() => import('components').then(mod => mod.SegmentComparisonMatrix), { ssr: false }),
    riskTrends: dynamic(() => import('components').then(mod => mod.RiskTrendsOverTime), { ssr: false }),
    probabilityHistogram: dynamic(() => import('components').then(mod => mod.ProbabilityHistogram), { ssr: false }),
  },

  // Customer Segmentation components
  'customer-segmentation': {
    dashboard: dynamic(() => import('../customer-segmentation/page').catch(() => null), { ssr: false }),
    distributionMap: dynamic(() => import('components').then(mod => mod.SegmentDistributionMap).catch(() => null), { ssr: false }),
    profileCards: dynamic(() => import('components').then(mod => mod.SegmentProfileCards).catch(() => null), { ssr: false }),
    metricComparison: dynamic(() => import('components').then(mod => mod.SegmentMetricComparison).catch(() => null), { ssr: false }),
    kpiTiles: dynamic(() => import('components').then(mod => mod.SegmentKPITiles).catch(() => null), { ssr: false }),
  },

  // Customer Behavior components
  'customer-behavior': {
    dashboard: dynamic(() => import('../customer-behavior/page').catch(() => null), { ssr: false }),
    radar: dynamic(() => import('components').then(mod => mod.PatternRadarChart).catch(() => null), { ssr: false }),
    histogram: dynamic(() => import('components').then(mod => mod.PatternIntervalHistogram).catch(() => null), { ssr: false }),
    treemap: dynamic(() => import('components').then(mod => mod.CategoryTreemap).catch(() => null), { ssr: false }),
    donut: dynamic(() => import('components').then(mod => mod.ChannelDonutChart).catch(() => null), { ssr: false }),
  },

  // Customer Lifetime Value components
  'customer-lifetime-value': {
    dashboard: dynamic(() => import('../customer-lifetime-value/page').catch(() => null), { ssr: false }),
    kpiTiles: dynamic(() => import('components').then(mod => mod.LTVKPITiles).catch(() => null), { ssr: false }),
    ltvDistribution: dynamic(() => import('components').then(mod => mod.LTVDistribution).catch(() => null), { ssr: false }),
    predictionAccuracy: dynamic(() => import('components').then(mod => mod.PredictionAccuracy).catch(() => null), { ssr: false }),
    geographicMap: dynamic(() => import('components').then(mod => mod.GeographicValueMap).catch(() => null), { ssr: false }),
  },

  // Anomaly Detection components
  'anomaly-detection': {
    dashboard: dynamic(() => import('../anomaly-detection/page').catch(() => null), { ssr: false }),
    severityDistribution: dynamic(() => import('components').then(mod => mod.SeverityDistribution).catch(() => null), { ssr: false }),
    featureContribution: dynamic(() => import('components').then(mod => mod.FeatureContributionPlot).catch(() => null), { ssr: false }),
    anomalyTable: dynamic(() => import('components').then(mod => mod.AnomalyTable).catch(() => null), { ssr: false }),
    kpiTiles: dynamic(() => import('components').then(mod => mod.AnomalyKPITiles).catch(() => null), { ssr: false }),
  },

  // Sales Performance components
  'sales-performance': {
    dashboard: dynamic(() => import('../sales-performance/page').catch(() => null), { ssr: false }),
    overview: dynamic(() => import('components').then(mod => mod.PerformanceOverview).catch(() => null), { ssr: false }),
    timeSeries: dynamic(() => import('components').then(mod => mod.TimeSeriesExplorer).catch(() => null), { ssr: false }),
    distribution: dynamic(() => import('components').then(mod => mod.PerformanceDistributionAnalyzer).catch(() => null), { ssr: false }),
    comparativeGrid: dynamic(() => import('components').then(mod => mod.ComparativePerformanceGrid).catch(() => null), { ssr: false }),
  },

  // Product Performance components
  'product-performance': {
    dashboard: dynamic(() => import('../product-performance/page').catch(() => null), { ssr: false }),
    salesExplorer: dynamic(() => import('components').then(mod => mod.SalesPerformanceExplorer).catch(() => null), { ssr: false }),
    marginAnalysis: dynamic(() => import('components').then(mod => mod.MarginAnalysisVisualizer).catch(() => null), { ssr: false }),
    priceBandDistribution: dynamic(() => import('components').then(mod => mod.PriceBandDistribution).catch(() => null), { ssr: false }),
    growthMatrix: dynamic(() => import('components').then(mod => mod.ProductGrowthMatrix).catch(() => null), { ssr: false }),
  },

  // Sales Trends components
  'sales-trends': {
    dashboard: dynamic(() => import('../sales-trends/page').catch(() => null), { ssr: false }),
    timeSeriesExplorer: dynamic(() => import('components').then(mod => mod.SalesTrendExplorer).catch(() => null), { ssr: false }),
    seasonalPatternAnalyzer: dynamic(() => import('components').then(mod => mod.SeasonalPatternAnalyzer).catch(() => null), { ssr: false }),
    growthRateVisualizer: dynamic(() => import('components').then(mod => mod.GrowthRateVisualizer).catch(() => null), { ssr: false }),
    kpiTiles: dynamic(() => import('components').then(mod => mod.SalesTrendKPITiles).catch(() => null), { ssr: false }),
  },

  // Regional Sales components
  'regional-sales': {
    dashboard: dynamic(() => import('../regional-sales/page').catch(() => null), { ssr: false }),
    kpiTiles: dynamic(() => import('components').then(mod => mod.RegionalKPITiles).catch(() => null), { ssr: false }),
    performanceMap: dynamic(() => import('components').then(mod => mod.RegionalPerformanceMap).catch(() => null), { ssr: false }),
    timeSeriesExplorer: dynamic(() => import('components').then(mod => mod.RegionalTimeSeriesExplorer).catch(() => null), { ssr: false }),
  },

  // Inventory Level Analyzer components
  'inventory-level': {
    dashboard: dynamic(() => import('../inventory-level/page').catch(() => null), { ssr: false }),
    healthMatrix: dynamic(() => import('components').then(mod => mod.InventoryHealthMatrix).catch(() => null), { ssr: false }),
    itemAnalyzer: dynamic(() => import('components').then(mod => mod.ItemLevelAnalyzer).catch(() => null), { ssr: false }),
    kpiTiles: dynamic(() => import('components').then(mod => mod.InventoryKPITiles).catch(() => null), { ssr: false }),
  },

  // Inventory Holding Cost components
  'inventory-holding-cost': {
    dashboard: dynamic(() => import('../inventory-cost/page').catch(() => null), { ssr: false }),
    kpiTiles: dynamic(() => import('components').then(mod => mod.HoldingCostKPITiles).catch(() => null), { ssr: false }),
    costBreakdown: dynamic(() => import('components').then(mod => mod.CostBreakdownVisualization).catch(() => null), { ssr: false }),
    excessiveCostGrid: dynamic(() => import('components').then(mod => mod.ExcessiveCostGrid).catch(() => null), { ssr: false }),
    costTrend: dynamic(() => import('components').then(mod => mod.CostTrendAnalyzer).catch(() => null), { ssr: false }),
  },

  // Inventory Optimization components
  'inventory-optimization': {
    dashboard: dynamic(() => import('../inventory-optimization/page').catch(() => null), { ssr: false }),
    healthMatrix: dynamic(() => import('components').then(mod => mod.OptimizationHealthMatrix).catch(() => null), { ssr: false }),
    costImpactWaterfall: dynamic(() => import('components').then(mod => mod.CostImpactWaterfall).catch(() => null), { ssr: false }),
    performanceTimeline: dynamic(() => import('components').then(mod => mod.PerformanceTimeline).catch(() => null), { ssr: false }),
    actionPriorityMatrix: dynamic(() => import('components').then(mod => mod.ActionPriorityMatrix).catch(() => null), { ssr: false }),
  },

  // Finance components
  'ar-aging': {
    dashboard: dynamic(() => import('../ar-aging/page').catch(() => null), { ssr: false }),
    agingBuckets: dynamic(() => import('components').then(mod => mod.AgingBuckets).catch(() => null), { ssr: false }),
    overdueAnalysis: dynamic(() => import('components').then(mod => mod.OverdueAnalysis).catch(() => null), { ssr: false }),
    collectionTrends: dynamic(() => import('components').then(mod => mod.CollectionTrends).catch(() => null), { ssr: false }),
  },

  'cash-flow': {
    dashboard: dynamic(() => import('../cash-flow/page').catch(() => null), { ssr: false }),
    waterfall: dynamic(() => import('components').then(mod => mod.CashFlowWaterfall).catch(() => null), { ssr: false }),
    projections: dynamic(() => import('components').then(mod => mod.CashFlowProjections).catch(() => null), { ssr: false }),
    workingCapital: dynamic(() => import('components').then(mod => mod.WorkingCapitalAnalysis).catch(() => null), { ssr: false }),
  },

  'revenue-forecast': {
    dashboard: dynamic(() => import('../revenue-forecast/page').catch(() => null), { ssr: false }),
    kpiTiles: dynamic(() => import('../../revenue-forecast/components').then(mod => mod.RevenueForecastKPIs).catch(() => null), { ssr: false }),
    monthlyTrend: dynamic(() => import('../../revenue-forecast/components').then(mod => mod.MonthlyTrendChart).catch(() => null), { ssr: false }),
    segmentForecast: dynamic(() => import('../../revenue-forecast/components').then(mod => mod.SegmentForecastTable).catch(() => null), { ssr: false }),
    cohortRetention: dynamic(() => import('../../revenue-forecast/components').then(mod => mod.CohortRetentionChart).catch(() => null), { ssr: false }),
  },

  // Retention Planner components
  'retention-planner': {
    dashboard: dynamic(() => import('../../retention-planner/page').catch(() => null), { ssr: false }),
    overview: dynamic(() => import('../../retention-planner/page').catch(() => null), { ssr: false }),
    kpis: dynamic(() => import('../../retention-planner/components').then(mod => mod.RetentionKPIs).catch(() => null), { ssr: false }),
    riskDistribution: dynamic(() => import('../../retention-planner/components').then(mod => mod.ChurnRiskGauge).catch(() => null), { ssr: false }),
    valueRiskMatrix: dynamic(() => import('../../retention-planner/components').then(mod => mod.ValueRiskMatrix).catch(() => null), { ssr: false }),
    interventionROI: dynamic(() => import('../../retention-planner/components').then(mod => mod.InterventionROI).catch(() => null), { ssr: false }),
    lifecycleStages: dynamic(() => import('../../retention-planner/components').then(mod => mod.LifecycleStages).catch(() => null), { ssr: false }),
  },

  // Next Purchase Predictor components
  'next-purchase': {
    dashboard: dynamic(() => import('../../next-purchase/page').catch(() => null), { ssr: false }),
    overview: dynamic(() => import('../../next-purchase/page').catch(() => null), { ssr: false }),
    kpis: dynamic(() => import('../../next-purchase/components').then(mod => mod.PredictionKPIs).catch(() => null), { ssr: false }),
    kpiTiles: dynamic(() => import('../../next-purchase/components').then(mod => mod.PredictionKPIs).catch(() => null), { ssr: false }),
    predictions: dynamic(() => import('../../next-purchase/components').then(mod => mod.NextPurchasePredictions).catch(() => null), { ssr: false }),
    customerJourney: dynamic(() => import('../../next-purchase/components').then(mod => mod.CustomerPurchaseJourney).catch(() => null), { ssr: false }),
    probability: dynamic(() => import('../../next-purchase/components').then(mod => mod.PurchaseProbability).catch(() => null), { ssr: false }),
    timing: dynamic(() => import('../../next-purchase/components').then(mod => mod.TimingForecast).catch(() => null), { ssr: false }),
    purchaseTiming: dynamic(() => import('../../next-purchase/components').then(mod => mod.PurchaseTimingPredictor).catch(() => null), { ssr: false }),
    products: dynamic(() => import('../../next-purchase/components').then(mod => mod.RecommendedProducts).catch(() => null), { ssr: false }),
    affinity: dynamic(() => import('../../next-purchase/components').then(mod => mod.ProductAffinityNetwork).catch(() => null), { ssr: false }),
    affinityNetwork: dynamic(() => import('../../next-purchase/components').then(mod => mod.ProductAffinityNetwork).catch(() => null), { ssr: false }),
    confidence: dynamic(() => import('../../next-purchase/components').then(mod => mod.PredictionConfidenceMatrix).catch(() => null), { ssr: false }),
    confidenceMatrix: dynamic(() => import('../../next-purchase/components').then(mod => mod.PredictionConfidenceMatrix).catch(() => null), { ssr: false }),
    categoryPerformance: dynamic(() => import('../../next-purchase/components').then(mod => mod.CategoryPerformanceOverview).catch(() => null), { ssr: false }),
  },
};

// Helper function to get component by path
export function getComponent(path: string) {
  const [category, component] = path.split('.');

  if (componentRegistry[category as keyof typeof componentRegistry]) {
    const categoryComponents = componentRegistry[category as keyof typeof componentRegistry];
    if (categoryComponents[component as keyof typeof categoryComponents]) {
      return categoryComponents[component as keyof typeof categoryComponents];
    }
  }

  return null;
}

// Parse visualization string from AI response
export function parseVisualization(vizString: string) {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(vizString);

    if (parsed.component) {
      const Component = getComponent(parsed.component);
      if (Component) {
        return { Component, props: parsed.props || {} };
      }
    }

    return { raw: parsed };
  } catch {
    // If not JSON, try to extract component name
    const componentMatch = vizString.match(/component:\s*"([^"]+)"/);
    if (componentMatch) {
      const Component = getComponent(componentMatch[1]);
      if (Component) {
        return { Component, props: {} };
      }
    }

    return { raw: vizString };
  }
}