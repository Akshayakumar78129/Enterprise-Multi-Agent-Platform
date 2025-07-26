import dynamic from 'next/dynamic';

// Component Registry
export const componentRegistry = {
  'sales-trends': {
    dashboard: dynamic(() => import('../ui/views/SalesTrendDashboard'), { ssr: false }),
    timeSeriesExplorer: dynamic(() => import('../ui/components/visualizations/TimeSeriesExplorer'), { ssr: false }),
    seasonalPatternAnalyzer: dynamic(() => import('../ui/components/visualizations/SeasonalPatternAnalyzer'), { ssr: false }),
    growthRateVisualizer: dynamic(() => import('../ui/components/visualizations/GrowthRateVisualizer'), { ssr: false }),
    kpiTiles: dynamic(() => import('../ui/components/kpi/KPITiles'), { ssr: false })
  }
};

// Query parsing logic
export const parseQuery = (query) => {
  const lowerQuery = query.toLowerCase();
  let componentToSpawn = null;
  let robotMessage = '';

  if (lowerQuery.includes('sales trend') || lowerQuery.includes('sales analysis')) {
    componentToSpawn = 'sales-trends.dashboard';
    robotMessage = 'Here is the Sales Trend Analysis dashboard.';
  } else if (lowerQuery.includes('sales over time')) {
    componentToSpawn = 'sales-trends.timeSeriesExplorer';
    robotMessage = 'Here is the Sales Time Series Explorer.';
  } else if (lowerQuery.includes('seasonal') && lowerQuery.includes('sales')) {
    componentToSpawn = 'sales-trends.seasonalPatternAnalyzer';
    robotMessage = 'Here is the Seasonal Pattern Analysis for sales.';
  } else if (lowerQuery.includes('growth') && lowerQuery.includes('sales')) {
    componentToSpawn = 'sales-trends.growthRateVisualizer';
    robotMessage = 'Here is the Sales Growth Rate Analysis.';
  } else if (lowerQuery.includes('sales kpi')) {
    componentToSpawn = 'sales-trends.kpiTiles';
    robotMessage = 'Here are the Sales KPIs.';
  }

  return { componentToSpawn, robotMessage };
}; 