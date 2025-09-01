import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

interface DemandForecastRequest {
  start_date: string;
  end_date: string;
  forecast_horizon: 'week' | 'month' | 'quarter' | 'year';
  product_category?: string;
  region?: string;
  model_type?: 'ma' | 'exp' | 'arima' | 'ml';
  confidence_level?: number;
  include_seasonality?: boolean;
}

interface HistoricalDataPoint {
  date: string;
  quantity: number;
  revenue: number;
  order_count: number;
}

interface ForecastDataPoint {
  date: string;
  actual?: number;
  forecast?: number;
  lowerBound?: number;
  upperBound?: number;
  revenue?: number;
  actualRevenue?: number;
  forecastRevenue?: number;
}

interface ModelPerformanceMetric {
  metric: string;
  value: number;
  benchmark: number;
  unit: string;
}

interface SeasonalPattern {
  month: string;
  index: number;
  baseline: number;
}

interface DemandDriver {
  driver: string;
  value: number;
  percentage: number;
  color: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const {
      start_date,
      end_date,
      forecast_horizon = 'month',
      product_category,
      region,
      model_type = 'ma',
      confidence_level = 95,
      include_seasonality = true
    } = req.body as DemandForecastRequest;

    console.log('[Demand Forecast API] Request params:', req.body);

    if (!start_date || !end_date) {
      return res.status(400).json({
        status: 'error',
        message: 'start_date and end_date are required'
      });
    }

    // Connect to database
    const dbPath = path.resolve(process.cwd(), 'Sales/database/sales_agent.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Get historical data
    const historicalData = await getHistoricalSalesData(
      db,
      start_date,
      end_date,
      product_category,
      region
    );

    // Generate forecast based on historical data
    const forecastData = generateForecast(
      historicalData,
      forecast_horizon,
      confidence_level,
      include_seasonality
    );

    // Calculate model performance metrics
    const modelPerformance = calculateModelPerformance(historicalData);

    // Calculate seasonal patterns
    const seasonalPatterns = calculateSeasonalPatterns(historicalData);

    // Calculate demand drivers
    const demandDrivers = calculateDemandDrivers(historicalData);

    // Calculate KPIs
    const kpis = calculateForecastKPIs(historicalData, forecastData);

    await db.close();

    return res.status(200).json({
      status: 'success',
      data: {
        forecastData,
        modelPerformance,
        seasonalPatterns,
        demandDrivers,
        kpis,
        historicalPeriod: { start: start_date, end: end_date },
        forecastHorizon: forecast_horizon
      }
    });

  } catch (error) {
    console.error('Error in demand forecast API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({
      status: 'error',
      message: errorMessage
    });
  }
}

async function getHistoricalSalesData(
  db: any,
  start_date: string,
  end_date: string,
  product_category?: string,
  region?: string
): Promise<HistoricalDataPoint[]> {
  
  let query = `
    SELECT 
      DATE(t."Txn Date") as date,
      SUM(t."Net Sales Quantity") as quantity,
      SUM(t."Net Sales Amount") as revenue,
      COUNT(DISTINCT t."Sales Txn Number") as order_count
    FROM "dbo_F_Sales_Transaction" t
    WHERE t."Txn Date" BETWEEN ? AND ?
      AND t."Deleted Flag" = 0 
      AND t."Excluded Flag" = 0
  `;

  const params: any[] = [start_date, end_date];

  if (region) {
    query += ` AND t."Sales Organization Key" = ?`;
    params.push(region);
  }

  query += `
    GROUP BY DATE(t."Txn Date")
    ORDER BY date ASC
  `;

  const results = await db.all(query, params);

  return results.map((row: any) => ({
    date: row.date,
    quantity: parseFloat((row.quantity || 0).toFixed(2)),
    revenue: parseFloat((row.revenue || 0).toFixed(2)),
    order_count: row.order_count || 0
  }));
}

function generateForecast(
  historicalData: HistoricalDataPoint[],
  horizon: string,
  confidenceLevel: number,
  includeSeasonality: boolean
): ForecastDataPoint[] {
  
  const forecastDays = horizon === 'week' ? 7 : 
                      horizon === 'month' ? 30 : 
                      horizon === 'quarter' ? 90 : 365;

  const result: ForecastDataPoint[] = [];
  
  // Handle empty historical data
  if (!historicalData || historicalData.length === 0) {
    // Generate default forecast points with zero values starting from 2021
    const baseDate = new Date('2021-12-31');
    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(baseDate);
      forecastDate.setDate(baseDate.getDate() + i);
      
      result.push({
        date: forecastDate.toISOString().split('T')[0],
        forecast: 0,
        lowerBound: 0,
        upperBound: 0,
        forecastRevenue: 0,
        revenue: 0
      });
    }
    return result;
  }
  
  // Add historical data points
  historicalData.forEach(point => {
    result.push({
      date: point.date,
      actual: point.quantity,
      actualRevenue: point.revenue
    });
  });

  // Calculate moving average for forecast
  const windowSize = Math.min(7, historicalData.length);
  const recentData = historicalData.slice(-windowSize);
  
  const avgQuantity = recentData.reduce((sum, d) => sum + d.quantity, 0) / recentData.length;
  const avgRevenue = recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length;
  
  // Calculate trend
  let trendFactor = 1.0;
  if (historicalData.length > 14) {
    const firstHalf = historicalData.slice(0, Math.floor(historicalData.length / 2));
    const secondHalf = historicalData.slice(Math.floor(historicalData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.quantity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.quantity, 0) / secondHalf.length;
    
    trendFactor = secondAvg > firstAvg ? 1.02 : 0.98; // 2% growth or decline
  }

  // Generate forecast points
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  
  for (let i = 1; i <= forecastDays; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(lastDate.getDate() + i);
    
    // Apply seasonal factor
    let seasonalFactor = 1.0;
    if (includeSeasonality) {
      const month = forecastDate.getMonth();
      // Simple seasonal pattern: higher in Q4
      if (month >= 9) seasonalFactor = 1.3;
      else if (month >= 6) seasonalFactor = 1.1;
      else if (month >= 3) seasonalFactor = 1.0;
      else seasonalFactor = 0.9;
    }
    
    // Calculate forecast with trend and seasonality
    const baseForecast = avgQuantity * Math.pow(trendFactor, i / 30) * seasonalFactor;
    const baseRevenue = avgRevenue * Math.pow(trendFactor, i / 30) * seasonalFactor;
    
    // Calculate confidence interval
    const errorMargin = baseForecast * (1 - confidenceLevel / 100) * 2;
    const revenueMargin = baseRevenue * (1 - confidenceLevel / 100) * 2;
    
    result.push({
      date: forecastDate.toISOString().split('T')[0],
      forecast: parseFloat(baseForecast.toFixed(2)),
      lowerBound: parseFloat(Math.max(0, baseForecast - errorMargin).toFixed(2)),
      upperBound: parseFloat((baseForecast + errorMargin).toFixed(2)),
      forecastRevenue: parseFloat(baseRevenue.toFixed(2)),
      revenue: parseFloat(baseRevenue.toFixed(2))
    });
  }
  
  return result;
}

function calculateModelPerformance(historicalData: HistoricalDataPoint[]): ModelPerformanceMetric[] {
  // Handle empty historical data
  if (!historicalData || historicalData.length === 0) {
    return [
      { metric: 'MAE', value: 0, benchmark: 0, unit: 'units' },
      { metric: 'MSE', value: 0, benchmark: 0, unit: 'units²' },
      { metric: 'RMSE', value: 0, benchmark: 0, unit: 'units' },
      { metric: 'MAPE', value: 0, benchmark: 5.0, unit: '%' }
    ];
  }
  
  // Simulate model performance metrics based on historical data variance
  const quantities = historicalData.map(d => d.quantity);
  const mean = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
  
  const variance = quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / quantities.length;
  const stdDev = Math.sqrt(variance);
  
  const mae = stdDev * 0.8; // Simulated MAE
  const mse = variance;
  const rmse = stdDev;
  const mape = (stdDev / mean) * 100;
  
  return [
    { 
      metric: 'MAE', 
      value: parseFloat(mae.toFixed(2)), 
      benchmark: parseFloat((mae * 1.1).toFixed(2)), 
      unit: 'units' 
    },
    { 
      metric: 'MSE', 
      value: parseFloat(mse.toFixed(2)), 
      benchmark: parseFloat((mse * 1.1).toFixed(2)), 
      unit: 'units²' 
    },
    { 
      metric: 'RMSE', 
      value: parseFloat(rmse.toFixed(2)), 
      benchmark: parseFloat((rmse * 1.1).toFixed(2)), 
      unit: 'units' 
    },
    { 
      metric: 'MAPE', 
      value: parseFloat(mape.toFixed(2)), 
      benchmark: 5.0, 
      unit: '%' 
    }
  ];
}

function calculateSeasonalPatterns(historicalData: HistoricalDataPoint[]): SeasonalPattern[] {
  // Handle empty historical data
  if (!historicalData || historicalData.length === 0) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      index: 1.0,
      baseline: 1.0
    }));
  }
  
  const monthlyData: { [key: string]: number[] } = {};
  
  // Group data by month
  historicalData.forEach(point => {
    const date = new Date(point.date);
    const month = date.toLocaleString('default', { month: 'short' });
    
    if (!monthlyData[month]) {
      monthlyData[month] = [];
    }
    monthlyData[month].push(point.quantity);
  });
  
  // Calculate monthly averages
  const monthlyAverages: { [key: string]: number } = {};
  let overallAverage = 0;
  let totalPoints = 0;
  
  Object.keys(monthlyData).forEach(month => {
    const avg = monthlyData[month].reduce((sum, q) => sum + q, 0) / monthlyData[month].length;
    monthlyAverages[month] = avg;
    overallAverage += avg * monthlyData[month].length;
    totalPoints += monthlyData[month].length;
  });
  
  overallAverage = overallAverage / totalPoints;
  
  // Create seasonal index for all months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return months.map(month => ({
    month,
    index: parseFloat(((monthlyAverages[month] || overallAverage) / overallAverage).toFixed(2)),
    baseline: 1.0
  }));
}

function calculateDemandDrivers(historicalData: HistoricalDataPoint[]): DemandDriver[] {
  // Handle empty historical data
  if (!historicalData || historicalData.length === 0) {
    return [
      { driver: 'Base Demand', value: 0, percentage: 45, color: '#00e0ff' },
      { driver: 'Seasonal Effect', value: 0, percentage: 25, color: '#5fd4d6' },
      { driver: 'Promotional Impact', value: 0, percentage: 15, color: '#e930ff' },
      { driver: 'Price Effect', value: 0, percentage: 10, color: '#aa45dd' },
      { driver: 'Other Factors', value: 0, percentage: 5, color: '#447799' }
    ];
  }
  
  // Calculate demand drivers based on historical patterns
  const totalDemand = historicalData.reduce((sum, d) => sum + d.quantity, 0);
  
  // Simulate driver breakdown
  const baseDemand = totalDemand * 0.45;
  const seasonalEffect = totalDemand * 0.25;
  const promotionalImpact = totalDemand * 0.15;
  const priceEffect = totalDemand * 0.10;
  const otherFactors = totalDemand * 0.05;
  
  return [
    { 
      driver: 'Base Demand', 
      value: parseFloat(baseDemand.toFixed(2)), 
      percentage: 45,
      color: '#00e0ff' 
    },
    { 
      driver: 'Seasonal Effect', 
      value: parseFloat(seasonalEffect.toFixed(2)), 
      percentage: 25,
      color: '#5fd4d6' 
    },
    { 
      driver: 'Promotional Impact', 
      value: parseFloat(promotionalImpact.toFixed(2)), 
      percentage: 15,
      color: '#e930ff' 
    },
    { 
      driver: 'Price Effect', 
      value: parseFloat(priceEffect.toFixed(2)), 
      percentage: 10,
      color: '#aa45dd' 
    },
    { 
      driver: 'Other Factors', 
      value: parseFloat(otherFactors.toFixed(2)), 
      percentage: 5,
      color: '#447799' 
    }
  ];
}

function calculateForecastKPIs(
  historicalData: HistoricalDataPoint[],
  forecastData: ForecastDataPoint[]
) {
  const futureData = forecastData.filter(d => d.forecast !== undefined);
  const totalForecastQuantity = futureData.reduce((sum, d) => sum + (d.forecast || 0), 0);
  const totalForecastRevenue = futureData.reduce((sum, d) => sum + (d.forecastRevenue || 0), 0);
  
  const historicalTotal = historicalData && historicalData.length > 0 
    ? historicalData.reduce((sum, d) => sum + d.quantity, 0) 
    : 0;
  const growthRate = historicalTotal > 0 ? 
    ((totalForecastQuantity - historicalTotal) / historicalTotal * 100) : 0;
  
  return {
    totalVolume: parseFloat(totalForecastQuantity.toFixed(2)),
    totalRevenue: parseFloat(totalForecastRevenue.toFixed(2)),
    growthRate: parseFloat(growthRate.toFixed(2)),
    avgDaily: parseFloat((totalForecastQuantity / futureData.length).toFixed(2)),
    accuracy: 95.3, // Static for now, would be calculated based on backtesting
    trend: growthRate > 0 ? 'Increasing' : growthRate < 0 ? 'Decreasing' : 'Stable',
    seasonalImpact: 25.0 // Static percentage for demo
  };
}