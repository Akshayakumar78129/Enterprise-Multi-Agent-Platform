/**
 * Data transformation utilities for Sales Performance visualizations
 */

export type Granularity = 'daily' | 'weekly' | 'monthly';

/**
 * Aggregate time-series data by granularity
 */
export function aggregateByGranularity(data: any[], granularity: Granularity): any[] {
  if (!data || data.length === 0) return [];

  if (granularity === 'daily') {
    // Return as-is for daily
    return data;
  }

  const aggregated: Record<string, any> = {};

  data.forEach(item => {
    if (!item.date) return;

    const date = new Date(item.date);
    let key: string;

    if (granularity === 'weekly') {
      // Get the start of the week (Sunday)
      const dayOfWeek = date.getDay();
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - dayOfWeek);
      key = weekStart.toISOString().split('T')[0];
    } else { // monthly
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    }

    if (!aggregated[key]) {
      aggregated[key] = {
        date: key,
        revenue: 0,
        units: 0,
        customers: 0,
        count: 0
      };
    }

    aggregated[key].revenue += item.revenue || 0;
    aggregated[key].units += item.units || 0;
    aggregated[key].customers += item.customers || 0;
    aggregated[key].count += 1;
  });

  // Convert to array and sort by date
  return Object.values(aggregated)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Transform data for horizontal bar chart with performance-based gradient coloring
 */
export function transformForHorizontalBar(data: any[], limit: number = 20): any[] {
  if (!data || data.length === 0) return [];

  // Sort by revenue descending
  const sorted = [...data].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

  // Take top items
  const topItems = sorted.slice(0, limit);

  // Group remaining as "Others" if there are more items
  if (sorted.length > limit) {
    const others = sorted.slice(limit);
    const othersSum = {
      name: 'Others',
      revenue: others.reduce((sum, item) => sum + (item.revenue || 0), 0),
      units: others.reduce((sum, item) => sum + (item.unitsSold || item.units || 0), 0),
      avgPrice: 0,
      count: others.length
    };
    topItems.push(othersSum);
  }

  return topItems;
}

/**
 * Calculate performance-based color for gradient visualization
 */
export function getPerformanceColor(value: number, min: number, max: number): string {
  if (max === min) return '#00e0ff'; // All same value

  const range = max - min;
  const normalized = (value - min) / range;

  if (normalized < 0.33) return '#5fd4d6'; // Low performance (light cyan)
  if (normalized < 0.66) return '#00e0ff'; // Medium performance (electric cyan)
  return '#e930ff'; // High performance (magenta)
}

/**
 * Filter data by show limit (Top 10, Top 20, All)
 */
export function filterByLimit(data: any[], limitType: 'top10' | 'top20' | 'all'): any[] {
  if (!data || data.length === 0) return [];

  const limits = {
    top10: 10,
    top20: 20,
    all: data.length
  };

  const limit = limits[limitType];
  return data.slice(0, limit);
}

/**
 * Get metric value from data item by metric type
 */
export function getMetricValue(item: any, metric: string): number {
  switch (metric) {
    case 'revenue': return item.revenue || 0;
    case 'units': return item.unitsSold || item.units || 0;
    case 'aov': return item.avgPrice || item.avgOrderValue || 0;
    case 'growth': return item.growthRate || 0;
    case 'margin': return item.margin || item.profitMargin || 0;
    default: return 0;
  }
}

/**
 * Calculate Pearson correlation coefficient between two metric arrays
 */
export function calculateCorrelation(data: any[], xMetric: string, yMetric: string): {
  coefficient: number;
  strength: string;
  direction: string;
} {
  if (!data || data.length < 2) {
    return { coefficient: 0, strength: 'No data', direction: '' };
  }

  const xValues = data.map(item => getMetricValue(item, xMetric));
  const yValues = data.map(item => getMetricValue(item, yMetric));
  const n = data.length;

  // Calculate means
  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;

  // Calculate correlation coefficient
  const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean), 0);
  const xVariance = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);
  const yVariance = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);

  const denominator = Math.sqrt(xVariance * yVariance);
  const r = denominator === 0 ? 0 : numerator / denominator;

  // Determine strength and direction
  const absR = Math.abs(r);
  let strength = '';
  if (absR < 0.3) strength = 'Weak';
  else if (absR < 0.7) strength = 'Moderate';
  else strength = 'Strong';

  const direction = r > 0 ? 'Positive' : r < 0 ? 'Negative' : 'None';

  return { coefficient: r, strength, direction };
}

/**
 * Calculate driver analysis with positive/negative categorization
 */
export function calculateDrivers(data: any[], filterPositiveOnly: boolean = false): any[] {
  if (!data || data.length === 0) return [];

  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0) || 1;

  let drivers = data.slice(0, 10).map(item => ({
    name: item.productName || item.category || item.regionName || 'Unknown',
    contribution: Number((((item.revenue || 0) / totalRevenue) * 100).toFixed(2)),
    impact: item.growthRate || 0,
    revenue: item.revenue || 0,
    isPositive: (item.growthRate || 0) >= 0
  }));

  if (filterPositiveOnly) {
    drivers = drivers.filter(d => d.isPositive);
  }

  return drivers;
}

/**
 * Calculate summary metrics for driver analysis
 */
export function calculateDriverSummary(drivers: any[]): {
  positiveDrivers: number;
  negativeDrivers: number;
  netImpact: number;
  totalDrivers: number;
} {
  if (!drivers || drivers.length === 0) {
    return {
      positiveDrivers: 0,
      negativeDrivers: 0,
      netImpact: 0,
      totalDrivers: 0
    };
  }

  const positiveSum = drivers
    .filter(d => d.isPositive)
    .reduce((sum, d) => sum + d.revenue, 0);

  const negativeSum = drivers
    .filter(d => !d.isPositive)
    .reduce((sum, d) => sum + d.revenue, 0);

  return {
    positiveDrivers: positiveSum,
    negativeDrivers: negativeSum,
    netImpact: positiveSum - negativeSum,
    totalDrivers: drivers.length
  };
}
