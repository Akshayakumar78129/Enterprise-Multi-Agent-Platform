import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

/**
 * API handler for Product Performance Analyzer
 * 
 * This API route directly queries the database to retrieve product performance analysis data
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const {
      start_date,
      end_date,
      metrics = ['sales', 'units', 'margin'],
      category_level = 'product',
      min_sales_threshold,
      time_granularity = 'daily'
    } = req.body;

    // Log received dates and granularity
    console.log(`[API] Received start_date: ${start_date}, end_date: ${end_date}, time_granularity: ${time_granularity}`);

    // Validate dates
    if (!start_date || !end_date) {
      return res.status(400).json({
        status: 'error',
        message: 'start_date and end_date are required in the request body'
      });
    }

    // Validate metrics
    if (!Array.isArray(metrics)) {
      return res.status(400).json({
        status: 'error',
        message: 'metrics must be an array'
      });
    }

    // Open database connection
    const dbPath = path.resolve('Customer/database/customers.db');
    console.log('[API DEBUG] Current Working Directory:', process.cwd());
    console.log('[API DEBUG] Resolved DB Path:', dbPath);
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Build and execute the query
    const query = buildQuery(category_level, metrics, min_sales_threshold);
    const results = await db.all(query, [start_date, end_date]);

    // Log database query results
    console.log(`[API] Database query returned ${results.length} records.`);
    const uniqueDatesSet = new Set(results.map(r => r.date));
    const uniqueDatesArray = Array.from(uniqueDatesSet);
    console.log(`[API] Unique dates in results (before aggregation): ${uniqueDatesArray.join(', ')}`);

    // Process results
    const analysisResults = processResults(results, metrics, category_level, time_granularity);

    // Log the price_bands data before sending response
    if (analysisResults.price_bands) {
      console.log('[API DEBUG] Price Bands Data:', JSON.stringify(analysisResults.price_bands, null, 2));
    } else {
      console.log('[API DEBUG] Price Bands Data: Not available');
    }

    // Close database connection
    await db.close();

    // Return the analysis results
    return res.status(200).json({
      status: 'success',
      period: { start: start_date, end: end_date },
      results: analysisResults
    });

  } catch (error) {
    console.error('Error in product performance API:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

function buildQuery(categoryLevel: string, metrics: string[], minSalesThreshold: number | null): string {
  let query = `
    SELECT 
      t."Item Key" as product_id,
      t."Item Number" as product_name,
      'General' as category,
      'Product' as subcategory,
      DATE(t."Txn Date") as date,
      SUM(t."Net Sales Amount") as sales_amount,
      SUM(t."Net Sales Quantity") as quantity,
      SUM(t."Cost Amount") as cost
    FROM "dbo_F_Sales_Transaction" t
    WHERE t."Txn Date" BETWEEN ? AND ?
      AND t."Deleted Flag" = 0
      AND t."Excluded Flag" = 0
  `;

  // Add grouping based on category level
  if (categoryLevel === 'product') {
    query += `
      GROUP BY t."Item Key", t."Item Number", DATE(t."Txn Date")
    `;
  } else if (categoryLevel === 'category') {
    query += `
      GROUP BY 'General', DATE(t."Txn Date")
    `;
  } else {  // subcategory
    query += `
      GROUP BY 'Product', DATE(t."Txn Date")
    `;
  }

  // Add HAVING clause after GROUP BY
  if (typeof minSalesThreshold === 'number' && !isNaN(minSalesThreshold)) {
    query += ` HAVING SUM(t."Net Sales Amount") >= ${minSalesThreshold}`;
  }

  // Add ORDER BY clause
  query += ` ORDER BY date ASC, sales_amount DESC`;

  return query;
}

function getAggregationKey(dateStr: string, granularity: string): string {
  const date = new Date(dateStr);
  if (granularity === 'monthly') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
  } else if (granularity === 'weekly') {
    const dayOfWeek = date.getUTCDay(); // 0 (Sun) - 6 (Sat) - Use UTC to be consistent
    const weekStartDate = new Date(date);
    weekStartDate.setUTCDate(date.getUTCDate() - dayOfWeek);
    return weekStartDate.toISOString().split('T')[0]; // YYYY-MM-DD (start of week, UTC)
  }
  return dateStr; // daily
}

function processResults(results: any[], metrics: string[], categoryLevel: string, time_granularity: string) {
  const analysisResults: any = {};

  // Temporary log to inspect raw sales_amount and cost from DB query
  if (results.length > 0) {
    console.log('[API DEBUG] First 5 results for sales_amount vs cost:');
    for (let i = 0; i < Math.min(5, results.length); i++) {
      console.log(`  Record ${i + 1}: sales_amount = ${results[i].sales_amount}, cost = ${results[i].cost}`);
    }
  }

  // Process raw data for visualization & scatter plot
  const productScatterData = results.map(row => {
    const salesAmount = row.sales_amount || 0;
    const cost = row.cost || 0;
    const quantity = row.quantity || 0;
    let marginPct = 0;
    if (salesAmount !== 0) {
      marginPct = ((salesAmount - cost) / salesAmount) * 100;
    }
    // Ensure marginPct is a finite number, default to 0 otherwise
    marginPct = isFinite(marginPct) ? marginPct : 0;

    return {
      product_name: row.product_name,
      sales_amount: salesAmount,
      quantity: quantity,
      category: row.category,
      subcategory: row.subcategory,
      margin_pct: marginPct,
      avg_price: quantity !== 0 ? salesAmount / quantity : 0,
      date: row.date // Retain date if needed, though scatter plot might not use it directly
    };
  });
  analysisResults.product_scatter_data = productScatterData;

  // Create a daily summary for trend charts, potentially aggregated
  const aggregatedSummaryMap = new Map<string, { date: string, sales: number, quantity: number }>();
  // Use productScatterData for aggregation input to ensure consistent calculations
  productScatterData.forEach(row => {
    const key = getAggregationKey(row.date, time_granularity);
    const existing = aggregatedSummaryMap.get(key);
    if (existing) {
      existing.sales += row.sales_amount;
      existing.quantity += row.quantity;
    } else {
      aggregatedSummaryMap.set(key, { date: key, sales: row.sales_amount, quantity: row.quantity });
    }
  });
  analysisResults.daily_summary = Array.from(aggregatedSummaryMap.values())
                                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (metrics.includes('sales')) {
    const totalSales = results.reduce((sum, row) => sum + row.sales_amount, 0);
    const avgSales = totalSales / results.length;

    analysisResults.sales = {
      total_sales: totalSales,
      average_sales: avgSales,
      top_products: results.slice(0, 10).map(row => ({
        product_name: row.product_name,
        sales_amount: row.sales_amount,
        category: row.category,
        date: row.date
      })),
      category_distribution: calculateCategoryDistribution(results, 'sales_amount'),
    };
  }

  if (metrics.includes('units')) {
    const totalUnits = results.reduce((sum, row) => sum + row.quantity, 0);
    const avgUnits = totalUnits / results.length;

    analysisResults.units = {
      total_units: totalUnits,
      average_units: avgUnits,
      top_products: results.slice(0, 10).map(row => ({
        product_name: row.product_name,
        quantity: row.quantity,
        category: row.category,
        date: row.date
      })),
      category_distribution: calculateCategoryDistribution(results, 'quantity'),
    };
  }

  if (metrics.includes('margin')) {
    const margins = results.map(row => {
      const margin = ((row.sales_amount - row.cost) / row.sales_amount) * 100;
      return { ...row, margin_pct: margin };
    });

    analysisResults.margin = {
      average_margin: margins.reduce((sum, row) => sum + row.margin_pct, 0) / margins.length,
      margin_distribution: calculateMarginDistribution(margins),
      top_margin_products: margins
        .sort((a, b) => b.margin_pct - a.margin_pct)
        .slice(0, 10)
        .map(row => ({
          product_name: row.product_name,
          margin_pct: row.margin_pct,
          category: row.category,
          date: row.date
        })),
    };
  }

  if (metrics.includes('price_bands')) {
    analysisResults.price_bands = {
      ...calculatePriceBands(results),
    };
  }

  // Add KPI data
  analysisResults.kpi = {
    totalSales: {
      value: results.reduce((sum, row) => sum + row.sales_amount, 0),
      trend: 0, // TODO: Calculate trend when we have historical data
      direction: 'neutral'
    },
    averageMargin: (() => {
      const totalMarginSum = results.reduce((sum, row, index) => {
        let margin = 0;
        if (row.sales_amount !== 0) { // Guard against division by zero
          margin = ((row.sales_amount - row.cost) / row.sales_amount) * 100;
        } else if (row.sales_amount === 0 && row.cost === 0) {
          margin = 0;
        } else if (row.sales_amount === 0 && row.cost !== 0) {
          margin = -Infinity;
        }
        
        if (index < 5) { 
          console.log(`  [KPI MARGIN DEBUG] Record ${index + 1}: sales=${row.sales_amount}, cost=${row.cost}, margin_pct=${margin}`);
        }
        
        if (isNaN(margin) || !isFinite(margin)) {
            return sum; 
        }
        return sum + margin;
      }, 0);

      const validResultsCount = results.length > 0 ? results.filter(r => r.sales_amount !== 0).length || 1 : 1;
      const calculatedAverageMargin = totalMarginSum / validResultsCount;
      
      console.log(`[KPI MARGIN FINAL DEBUG] Total Sum of Margins: ${totalMarginSum}, Count of Valid Results: ${validResultsCount}, Calculated Avg Margin: ${calculatedAverageMargin}`);

      return {
        value: calculatedAverageMargin,
        trend: 0,
        direction: 'neutral'
      };
    })(),
    totalUnits: {
      value: results.reduce((sum, row) => sum + row.quantity, 0),
      trend: 0,
      direction: 'neutral'
    },
    topCategory: {
      value: Object.entries(calculateCategoryDistribution(results, 'sales_amount'))
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown',
      percentage: Object.entries(calculateCategoryDistribution(results, 'sales_amount'))
        .sort((a, b) => b[1] - a[1])[0]?.[1] || 0
    },
    priceDistribution: {
      dominant: Object.entries(calculatePriceBands(results).distribution)
        .sort((a, b) => (b[1] as { count: number }).count - (a[1] as { count: number }).count)[0]?.[0] || 'Unknown',
      percentage: ((Object.entries(calculatePriceBands(results).distribution)
        .sort((a, b) => (b[1] as { count: number }).count - (a[1] as { count: number }).count)[0]?.[1] as { count: number })?.count || 0) / results.length * 100
    }
  };

  return analysisResults;
}

function calculateCategoryDistribution(results: any[], metric: string): Record<string, number> {
  const total = results.reduce((sum, row) => sum + row[metric], 0);
  const distribution: Record<string, number> = {};

  results.forEach(row => {
    const category = row.category;
    if (!distribution[category]) {
      distribution[category] = 0;
    }
    distribution[category] += (row[metric] / total) * 100;
  });

  return distribution;
}

function calculateMarginDistribution(results: any[]): Record<string, number> {
  const distribution: Record<string, number> = {
    '0-10%': 0,
    '10-20%': 0,
    '20-30%': 0,
    '30-40%': 0,
    '40-50%': 0,
    '50%+': 0
  };

  results.forEach(row => {
    const margin = row.margin_pct;
    if (margin < 10) distribution['0-10%']++;
    else if (margin < 20) distribution['10-20%']++;
    else if (margin < 30) distribution['20-30%']++;
    else if (margin < 40) distribution['30-40%']++;
    else if (margin < 50) distribution['40-50%']++;
    else distribution['50%+']++;
  });

  // Convert to percentages
  const total = results.length;
  Object.keys(distribution).forEach(key => {
    distribution[key] = (distribution[key] / total) * 100;
  });

  return distribution;
}

function calculatePriceBands(results: any[]): any {
  const bands = [
    '0-10', '10-20', '20-50', '50-100', '100-200', // Existing lower bands
    '200-300', '300-500', '500-1000', '1000-2500', '2500+' // New more granular high-end bands
  ];
  const distribution: Record<string, { count: number; total_sales: number; avg_price: number }> = {};

  // Initialize bands
  bands.forEach(band => {
    distribution[band] = { count: 0, total_sales: 0, avg_price: 0 };
  });

  // Calculate distribution
  results.forEach(row => {
    const avgPrice = (row.quantity && row.quantity !== 0) ? (row.sales_amount / row.quantity) : 0;
    let band: string;

    if (avgPrice < 10) band = '0-10';
    else if (avgPrice < 20) band = '10-20';
    else if (avgPrice < 50) band = '20-50';
    else if (avgPrice < 100) band = '50-100';
    else if (avgPrice < 200) band = '100-200';
    else if (avgPrice < 300) band = '200-300';
    else if (avgPrice < 500) band = '300-500';
    else if (avgPrice < 1000) band = '500-1000';
    else if (avgPrice < 2500) band = '1000-2500';
    else band = '2500+';

    if (distribution[band]) { // Ensure band exists, though it should with above logic
        distribution[band].count++;
        distribution[band].total_sales += row.sales_amount;
    }
  });

  // Calculate average price for each band, safely handling zero counts
  bands.forEach(band => {
    if (distribution[band].count > 0) {
      distribution[band].avg_price = distribution[band].total_sales / distribution[band].count;
    } else {
      distribution[band].avg_price = 0; // Or handle as NaN or skip if preferred
    }
  });

  return {
    bands,
    distribution
  };
} 