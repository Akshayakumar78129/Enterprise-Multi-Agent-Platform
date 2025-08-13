// Context Packer for Sales Trend Analyzer
import { DashboardState } from '../types';

export interface SalesContext {
  currentData: {
    kpis?: any;
    mainData?: any[];
    seasonality?: any[];
    growthRates?: any[];
  };
  filters: {
    startDate: string;
    endDate: string;
    timePeriod: string;
    metric: string;
    dimension?: string;
  };
  userInteractions: {
    lastClickedPoint?: any;
    currentView?: string;
    focusArea?: string;
  };
  dataInsights: {
    trends?: string[];
    anomalies?: string[];
    patterns?: string[];
  };
}

/**
 * Packs current dashboard context for agent communication
 */
export const packSalesContext = (
  dashboardState: DashboardState,
  lastClickedPoint?: any,
  userQuery?: string
): SalesContext => {
  const context: SalesContext = {
    currentData: {
      kpis: dashboardState.data?.kpis,
      mainData: dashboardState.data?.mainData?.slice(0, 50), // Limit for API efficiency
      seasonality: dashboardState.data?.seasonality?.slice(0, 24), // Last 2 years
      growthRates: dashboardState.data?.growthRates?.slice(0, 12) // Last year
    },
    filters: {
      startDate: dashboardState.filters.startDate,
      endDate: dashboardState.filters.endDate,
      timePeriod: dashboardState.filters.timePeriod,
      metric: dashboardState.filters.metric,
      dimension: dashboardState.filters.dimension || undefined
    },
    userInteractions: {
      lastClickedPoint,
      currentView: 'sales-trends',
      focusArea: determineFocusArea(userQuery, dashboardState.filters.metric)
    },
    dataInsights: {
      trends: extractTrends(dashboardState.data?.mainData),
      anomalies: detectAnomalies(dashboardState.data?.mainData),
      patterns: identifyPatterns(dashboardState.data?.seasonality)
    }
  };

  return context;
};

/**
 * Determines the user's area of focus based on query and current metric
 */
const determineFocusArea = (userQuery?: string, currentMetric?: string): string => {
  if (!userQuery) return currentMetric || 'general';

  const query = userQuery.toLowerCase();
  
  if (query.includes('revenue') || query.includes('sales') || query.includes('income')) {
    return 'revenue';
  }
  
  if (query.includes('growth') || query.includes('increase') || query.includes('decline')) {
    return 'growth-analysis';
  }
  
  if (query.includes('seasonal') || query.includes('pattern') || query.includes('cycle')) {
    return 'seasonality';
  }
  
  if (query.includes('forecast') || query.includes('predict') || query.includes('future')) {
    return 'forecasting';
  }
  
  if (query.includes('compare') || query.includes('vs') || query.includes('versus')) {
    return 'comparison';
  }
  
  if (query.includes('anomaly') || query.includes('unusual') || query.includes('spike')) {
    return 'anomaly-detection';
  }

  return currentMetric || 'general';
};

/**
 * Extracts key trends from main data
 */
const extractTrends = (mainData?: any[]): string[] => {
  if (!mainData || mainData.length < 3) return [];

  const trends: string[] = [];
  const recentData = mainData.slice(-6); // Last 6 periods
  
  // Check for overall trend
  const firstValue = recentData[0]?.revenue || 0;
  const lastValue = recentData[recentData.length - 1]?.revenue || 0;
  const trendDirection = lastValue > firstValue ? 'upward' : 'downward';
  const trendMagnitude = Math.abs((lastValue - firstValue) / firstValue * 100);
  
  if (trendMagnitude > 10) {
    trends.push(`Strong ${trendDirection} trend (${trendMagnitude.toFixed(1)}% change)`);
  } else if (trendMagnitude > 5) {
    trends.push(`Moderate ${trendDirection} trend (${trendMagnitude.toFixed(1)}% change)`);
  } else {
    trends.push('Relatively stable performance');
  }

  // Check for volatility
  const values = recentData.map(d => d.revenue || 0);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;
  
  if (coefficientOfVariation > 0.3) {
    trends.push('High volatility in recent periods');
  } else if (coefficientOfVariation > 0.15) {
    trends.push('Moderate volatility detected');
  }

  return trends;
};

/**
 * Detects potential anomalies in the data
 */
const detectAnomalies = (mainData?: any[]): string[] => {
  if (!mainData || mainData.length < 5) return [];

  const anomalies: string[] = [];
  const values = mainData.map(d => d.revenue || 0);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
  
  // Find outliers (values beyond 2 standard deviations)
  mainData.forEach((dataPoint, index) => {
    const value = dataPoint.revenue || 0;
    const zScore = Math.abs((value - mean) / stdDev);
    
    if (zScore > 2) {
      const direction = value > mean ? 'spike' : 'dip';
      anomalies.push(`Significant ${direction} in ${dataPoint.period} (${zScore.toFixed(1)}σ from mean)`);
    }
  });

  return anomalies.slice(0, 3); // Limit to top 3 anomalies
};

/**
 * Identifies seasonal patterns
 */
const identifyPatterns = (seasonalData?: any[]): string[] => {
  if (!seasonalData || seasonalData.length < 12) return [];

  const patterns: string[] = [];
  
  // Group by month and calculate averages
  const monthlyAverages: { [key: string]: number[] } = {};
  
  seasonalData.forEach(dataPoint => {
    const month = dataPoint.month || '01';
    if (!monthlyAverages[month]) {
      monthlyAverages[month] = [];
    }
    monthlyAverages[month].push(dataPoint.revenue || 0);
  });

  // Calculate monthly averages
  const monthlyStats = Object.entries(monthlyAverages).map(([month, values]) => ({
    month,
    average: values.reduce((sum, v) => sum + v, 0) / values.length,
    count: values.length
  })).filter(stat => stat.count >= 2); // At least 2 data points

  if (monthlyStats.length >= 6) {
    // Find peak and low months
    const sortedByRevenue = [...monthlyStats].sort((a, b) => b.average - a.average);
    const peakMonth = sortedByRevenue[0];
    const lowMonth = sortedByRevenue[sortedByRevenue.length - 1];
    
    patterns.push(`Peak performance typically in month ${peakMonth.month}`);
    patterns.push(`Lowest performance typically in month ${lowMonth.month}`);
    
    // Check for seasonal variance
    const maxAvg = peakMonth.average;
    const minAvg = lowMonth.average;
    const seasonalVariance = ((maxAvg - minAvg) / minAvg) * 100;
    
    if (seasonalVariance > 30) {
      patterns.push(`High seasonal variation (${seasonalVariance.toFixed(1)}% difference)`);
    } else if (seasonalVariance > 15) {
      patterns.push(`Moderate seasonal variation (${seasonalVariance.toFixed(1)}% difference)`);
    }
  }

  return patterns;
};

/**
 * Creates a summary context for quick agent consumption
 */
export const createContextSummary = (context: SalesContext): string => {
  const summary: string[] = [];
  
  // Current performance summary
  if (context.currentData.kpis) {
    const kpis = context.currentData.kpis;
    summary.push(`Current KPIs: Revenue: ${kpis.total_revenue?.toLocaleString() || 'N/A'}, Units: ${kpis.total_units?.toLocaleString() || 'N/A'}, AOV: ${kpis.avg_order_value?.toFixed(2) || 'N/A'}`);
  }
  
  // Filter context
  summary.push(`Analyzing ${context.filters.metric} from ${context.filters.startDate} to ${context.filters.endDate} (${context.filters.timePeriod} granularity)`);
  
  // Data insights
  if (context.dataInsights.trends?.length) {
    summary.push(`Key trends: ${context.dataInsights.trends.join('; ')}`);
  }
  
  if (context.dataInsights.anomalies?.length) {
    summary.push(`Anomalies detected: ${context.dataInsights.anomalies.join('; ')}`);
  }
  
  if (context.dataInsights.patterns?.length) {
    summary.push(`Seasonal patterns: ${context.dataInsights.patterns.join('; ')}`);
  }
  
  // User interaction context
  if (context.userInteractions.lastClickedPoint) {
    const point = context.userInteractions.lastClickedPoint;
    summary.push(`User recently clicked: ${point.period} - ${point.metricName}: ${point.value?.toLocaleString()}`);
  }

  return summary.join('\n\n');
};