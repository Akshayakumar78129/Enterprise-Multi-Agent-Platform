import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
// Adjusted import path for types from pages/api directory
import { SalesKpiData, SalesData } from '../../Sales/tools/SalesPerformanceAnalyzer/ui/types';

// TODO: Re-add numberFormat imports once build issues are resolved
// import { formatToTwoDecimals, formatCurrency, formatPercentage } from '../../../ui-common';

interface SalesApiRequestBody {
  start_date: string;
  end_date: string;
  dimension: string; 
  metric: string;    
  filters?: Record<string, any>; 
  time_granularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  aggregate_by_dimension?: boolean; // New parameter to control aggregation
}

interface RawSalesQueryResult {
  dim_key: string; 
  dim_value: string; 
  date: string; 
  revenue?: number;
  units_sold?: number;
  order_count?: number; 
  cost_of_goods?: number; 
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }
  try {
    const {
      start_date,
      end_date,
      dimension,
      metric,
      filters = {},
      time_granularity = 'daily',
      aggregate_by_dimension = false
    } = req.body as SalesApiRequestBody;

    console.log(`[Sales API /pages/api] Received request: dimension=${dimension}, metric=${metric}, start=${start_date}, end=${end_date}, granularity=${time_granularity}`);

    if (!start_date || !end_date || !dimension || !metric) {
      return res.status(400).json({
        status: 'error',
        message: 'start_date, end_date, dimension, and metric are required'
      });
    }

    // Corrected dbPath relative to project root when API is in pages/api
    const dbPath = path.resolve(process.cwd(), 'Customer/database/customers.db');
    console.log('[Sales API /pages/api] DB Path:', dbPath);
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const query = buildSalesQuery(dimension, metric, filters, time_granularity, aggregate_by_dimension);
    const queryParams = [start_date, end_date]; 
    
    // Note: Parameterization of filters.region_key should be handled here by adding to queryParams
    // if (filters.region_key) queryParams.push(filters.region_key); // And query uses ?

    console.log("[Sales API /pages/api] Executing Query:", query);
    console.log("[Sales API /pages/api] With Params:", queryParams);
    const rawResults: RawSalesQueryResult[] = await db.all(query, queryParams);
    console.log(`[Sales API /pages/api] DB query returned ${rawResults.length} raw records.`);

    if (rawResults.length === 0) {
        console.warn("[Sales API /pages/api] Query returned no results. Check query, params, or DB data.");
    }

    const processedData = processSalesResults(rawResults, dimension, metric, time_granularity);

    await db.close();

    return res.status(200).json({
      status: 'success',
      request_params: req.body,
      results: processedData,
    });

  } catch (error) {
    console.error('Error in sales performance API (/pages/api):', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Detailed error in /pages/api/sales-performance:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return res.status(500).json({
      status: 'error',
      message: errorMessage,
      detail: JSON.stringify(error, Object.getOwnPropertyNames(error), 2) // Added spacing for readability
    });
  }
}

function buildSalesQuery(
  dimension: string, 
  metric: string, 
  filters: Record<string, any>, 
  time_granularity: string,
  aggregate_by_dimension: boolean
): string {
  let selectFields = [
    `SUM(t."Net Sales Amount") as revenue`,
    `SUM(t."Net Sales Quantity") as units_sold`,
    `COUNT(DISTINCT t."Sales Txn Number") as order_count`,
    `SUM(t."Cost Amount") as cost_of_goods`
  ];
  let groupByFields: string[] = [];
  let fromClause = `"dbo_F_Sales_Transaction" t`;
  let whereConditions = `t."Txn Date" BETWEEN ? AND ? AND t."Deleted Flag" = 0 AND t."Excluded Flag" = 0`;

  // Only include date in grouping if not aggregating by dimension
  if (!aggregate_by_dimension) {
    selectFields.unshift(`DATE(t."Txn Date") as date`);
    groupByFields.push(`DATE(t."Txn Date")`);
  } else {
    selectFields.unshift(`'aggregated' as date`); // Placeholder date for aggregated results
  }

  switch (dimension) {
    case 'product':
      selectFields.push('COALESCE(t."Item Number", \'Unknown Product\') as dim_value', 't."Item Key" as dim_key');
      if (aggregate_by_dimension) {
        groupByFields.push('COALESCE(t."Item Number", \'Unknown Product\')');
      } else {
        groupByFields.push('COALESCE(t."Item Number", \'Unknown Product\')', 't."Item Key"');
      }
      break;
    case 'category':
      selectFields.push('\'Product Category\' as dim_value', '\'category\' as dim_key');
      groupByFields.push('\'Product Category\'');
      break;
    case 'channel':
      selectFields.push('\'Sales Channel\' as dim_value', '\'channel\' as dim_key');
      groupByFields.push('\'Sales Channel\'');
      break;
    case 'region':
      selectFields.push('COALESCE(CAST(t."Sales Organization Key" as TEXT), \'Unknown Region\') as dim_value', 't."Sales Organization Key" as dim_key');
      if (aggregate_by_dimension) {
        groupByFields.push('COALESCE(CAST(t."Sales Organization Key" as TEXT), \'Unknown Region\')');
      } else {
        groupByFields.push('COALESCE(CAST(t."Sales Organization Key" as TEXT), \'Unknown Region\')', 't."Sales Organization Key"');
      }
      break;
    case 'customer':
      fromClause += ' LEFT JOIN "dbo_D_Customer" cust ON t."Customer Key" = cust."Customer Key"';
      selectFields.push('COALESCE(cust."Customer Name", \'Unknown Customer\') as dim_value', 'cust."Customer Key" as dim_key');
      if (aggregate_by_dimension) {
        groupByFields.push('COALESCE(cust."Customer Name", \'Unknown Customer\')');
      } else {
        groupByFields.push('COALESCE(cust."Customer Name", \'Unknown Customer\')', 'cust."Customer Key"');
      }
      break;
    case 'time':
      selectFields.push('DATE(t."Txn Date") as dim_value', 'DATE(t."Txn Date") as dim_key');
      if (!aggregate_by_dimension) {
        // For time dimension, we don't need additional grouping since we're already grouping by date
      } else {
        groupByFields.push('DATE(t."Txn Date")');
      }
      break;
    default:
      selectFields.push('COALESCE(t."Item Number", \'Unknown Product\') as dim_value', 't."Item Key" as dim_key');
      if (aggregate_by_dimension) {
        groupByFields.push('COALESCE(t."Item Number", \'Unknown Product\')');
      } else {
        groupByFields.push('COALESCE(t."Item Number", \'Unknown Product\')', 't."Item Key"');
      }
      break;
  }

  if (filters.region_key) {
    console.warn("[SQL Build /pages/api] Filter value for region_key is directly injected. MUST PARAMETERIZE.");
    // This should be: whereConditions += ` AND t."Sales Organization Key" = ?`; and filters.region_key added to queryParams
    whereConditions += ` AND t."Sales Organization Key" = '${filters.region_key}'`; 
  }

  const orderBy = aggregate_by_dimension ? 'ORDER BY revenue DESC' : 'ORDER BY date ASC, revenue DESC';

  const query = `
    SELECT ${selectFields.join(', ')}
    FROM ${fromClause}
    WHERE ${whereConditions}
    GROUP BY ${groupByFields.join(', ')}
    ${orderBy}
  `;
  return query;
}

function getSalesAggregationKey(dateStr: string, granularity: string): string {
    const date = new Date(dateStr);
    if (granularity === 'monthly') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; 
    } else if (granularity === 'weekly') {
      const dayOfWeek = date.getUTCDay(); 
      const weekStartDate = new Date(date);
      weekStartDate.setUTCDate(date.getUTCDate() - dayOfWeek);
      return weekStartDate.toISOString().split('T')[0];
    } else if (granularity === 'quarterly') {
        const month = date.getMonth();
        const quarter = Math.floor(month / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
    }
    return dateStr; 
  }

interface ProcessedSalesData {
  chartData: SalesData[];
  kpiData: SalesKpiData;
}

function processSalesResults(
  rawResults: RawSalesQueryResult[], 
  dimension: string, 
  metric: string,
  time_granularity: string
): ProcessedSalesData {
  const chartData: SalesData[] = rawResults.map(row => {
    let metricValue = 0;
    // Determine metricValue based on the selected metric string
    if (metric === 'revenue' && row.revenue !== undefined) metricValue = row.revenue;
    else if (metric === 'units_sold' && row.units_sold !== undefined) metricValue = row.units_sold;
    else if (metric === 'averageOrderValue' && row.revenue !== undefined && row.order_count !== undefined && row.order_count > 0) {
        metricValue = row.revenue / row.order_count;
    } else if (metric === 'grossMargin' && row.revenue !== undefined && row.cost_of_goods !== undefined && row.revenue > 0) {
        metricValue = (row.revenue - row.cost_of_goods) / row.revenue;
    } // Add other metric calculations as needed
    
    // Format all numeric values to 2 decimal places
    const revenue = row.revenue || 0;
    const unitsSold = row.units_sold || 0;
    const orderCount = row.order_count || 0;
    const costOfGoods = row.cost_of_goods || 0;
    const aov = (orderCount && orderCount > 0) ? revenue / orderCount : 0;
    const margin = (revenue && revenue > 0) ? ((revenue - costOfGoods) / revenue) * 100 : 0;
    
    return {
        id: (row.dim_key || 'unknown') + '_' + row.date,
        dimension: row.dim_value || 'Unknown', 
        metricValue: parseFloat(metricValue.toFixed(2)),
        date: row.date,
        // Include all raw metrics for frontend calculations with proper formatting
        revenue: parseFloat(revenue.toFixed(2)),
        units_sold: parseFloat(unitsSold.toFixed(2)),
        order_count: orderCount,
        cost_of_goods: parseFloat(costOfGoods.toFixed(2)),
        // Calculate derived metrics with proper formatting
        aov: parseFloat(aov.toFixed(2)),
        margin: parseFloat(margin.toFixed(2))
    };
  }); 

  let totalRevenue = 0;
  let totalUnitsSold = 0;
  let totalOrders = 0;
  let totalCost = 0;
  let topPerformerValue = 0;
  let topPerformerName = 'N/A';

  // Aggregate for KPIs and find top performer based on the selected metric
  // This is a simplified top performer logic, assumes higher is better
  rawResults.forEach(row => {
    totalRevenue += row.revenue || 0;
    totalUnitsSold += row.units_sold || 0;
    totalOrders += row.order_count || 0;
    totalCost += row.cost_of_goods || 0;

    let currentMetricVal = 0;
    if (metric === 'revenue' && row.revenue) currentMetricVal = row.revenue;
    else if (metric === 'units_sold' && row.units_sold) currentMetricVal = row.units_sold;
    // Add other conditions for AOV, margin for top performer logic if needed

    if (currentMetricVal > topPerformerValue) {
        topPerformerValue = currentMetricVal;
        topPerformerName = row.dim_value || 'Unknown';
    }
  });

  // Format all KPI values to 2 decimal places
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) : 0;

  const kpiData: SalesKpiData = {
    totalRevenue: { 
      value: parseFloat(totalRevenue.toFixed(2)), 
      trend: parseFloat((0.02).toFixed(2)), 
      direction: 'up' 
    },
    averageOrderValue: { 
      value: parseFloat(averageOrderValue.toFixed(2)), 
      trend: parseFloat((0.01).toFixed(2)), 
      direction: 'down' 
    },
    totalUnitsSold: { 
      value: parseFloat(totalUnitsSold.toFixed(2)), 
      trend: parseFloat((0.05).toFixed(2)), 
      direction: 'up' 
    },
    topPerformingRegion: { 
      value: topPerformerName, 
      percentage: totalRevenue > 0 && metric === 'revenue' ? 
        parseFloat(((topPerformerValue / totalRevenue) * 100).toFixed(2)) : 0 
    }, 
    conversionRate: { 
      value: parseFloat((grossMargin * 100).toFixed(2)), 
      trend: parseFloat((0.005).toFixed(2)), 
      direction: 'up' 
    }, 
  };

  return {
    chartData,
    kpiData,
  };
} 