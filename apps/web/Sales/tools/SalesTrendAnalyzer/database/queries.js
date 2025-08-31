import { db } from '../../../../lib/db/connector';
import { sql } from 'drizzle-orm';

class SalesTrendQueries {
  constructor() {
    // Using Drizzle connection instead of pg Pool
  }

  async getMainData(filters = {}) {
    const {
      startDate,
      endDate,
      timePeriod = 'monthly',
      metric = 'revenue',
      dimension = null,
      topN = 5
    } = filters;

    const timeGroup = this._getTimeGrouping(timePeriod);
    const dimensionFields = this._getDimensionFields(dimension);

    const selectClause = [
      `${timeGroup} as period`,
      'SUM("Net Sales Amount") as revenue',
      'SUM("Net Sales Quantity") as units',
      'COUNT(DISTINCT "Sales Txn Number") as orders'
    ];

    if (dimensionFields) {
      selectClause.push(
        `${dimensionFields.id} as dimension_id`,
        `${dimensionFields.name} as dimension_name`
      );
    }

    let query = `
      SELECT ${selectClause.join(', ')}
      FROM dbo_f_sales_transaction
      WHERE "Txn Date"::date >= $1::date AND "Txn Date"::date <= $2::date
        AND "Deleted Flag" = 0 
        AND "Excluded Flag" = 0
      ${dimensionFields ? `GROUP BY period, ${dimensionFields.id}, ${dimensionFields.name}` : 'GROUP BY period'}
      ${dimensionFields ? `ORDER BY SUM("Net Sales Amount") DESC LIMIT ${topN}` : 'ORDER BY period'}
    `;

    try {
      const finalQuery = query.replace('$1', `'${startDate}'`).replace('$2', `'${endDate}'`);
      const result = await db.execute(sql`${sql.raw(finalQuery)}`);
      
      // Convert BigInt values to numbers
      const rows = result.rows || result;
      return rows.map(row => ({
        ...row,
        revenue: parseFloat(row.revenue) || 0,
        units: parseFloat(row.units) || 0,
        orders: parseInt(row.orders) || 0,
        dimension_id: row.dimension_id ? parseInt(row.dimension_id) : null
      }));
    } catch (error) {
      console.error('Error executing main data query:', error);
      throw error;
    }
  }

  async getKPIData(filters = {}) {
    const { startDate, endDate } = filters;

    const query = `
      SELECT 
        SUM("Net Sales Amount") as total_revenue,
        SUM("Net Sales Quantity") as total_units,
        COUNT(DISTINCT "Sales Txn Number") as total_orders,
        ROUND((SUM("Net Sales Amount") / NULLIF(COUNT(DISTINCT "Sales Txn Number"), 0))::numeric, 2) as avg_order_value,
        ROUND(((SUM("Net Sales Amount" - "Cost Amount") / NULLIF(SUM("Net Sales Amount"), 0)) * 100)::numeric, 2) as margin_percentage
      FROM dbo_f_sales_transaction
      WHERE "Txn Date"::date >= $1::date AND "Txn Date"::date <= $2::date
        AND "Deleted Flag" = 0 
        AND "Excluded Flag" = 0
    `;

    try {
      const finalQuery = query.replace('$1', `'${startDate}'`).replace('$2', `'${endDate}'`);
      const result = await db.execute(sql`${sql.raw(finalQuery)}`);
      const rows = result.rows || result;
      const row = rows[0];
      
      return {
        total_revenue: parseFloat(row.total_revenue) || 0,
        total_units: parseFloat(row.total_units) || 0,
        total_orders: parseInt(row.total_orders) || 0,
        avg_order_value: parseFloat(row.avg_order_value) || 0,
        margin_percentage: parseFloat(row.margin_percentage) || 0
      };
    } catch (error) {
      console.error('Error executing KPI query:', error);
      throw error;
    }
  }

  async getSeasonalityData(filters = {}) {
    const { startDate, endDate, timePeriod = 'monthly' } = filters;

    const timeGroup = this._getTimeGrouping(timePeriod);
    const query = `
      SELECT 
        ${timeGroup} as period,
        EXTRACT(YEAR FROM "Txn Date"::date)::text as year,
        LPAD(EXTRACT(MONTH FROM "Txn Date"::date)::text, 2, '0') as month,
        SUM("Net Sales Amount") as revenue
      FROM dbo_f_sales_transaction
      WHERE "Txn Date"::date >= $1::date AND "Txn Date"::date <= $2::date
        AND "Deleted Flag" = 0 
        AND "Excluded Flag" = 0
      GROUP BY period, year, month
      ORDER BY period
    `;

    try {
      const finalQuery = query.replace('$1', `'${startDate}'`).replace('$2', `'${endDate}'`);
      const result = await db.execute(sql`${sql.raw(finalQuery)}`);
      
      const rows = result.rows || result;
      return rows.map(row => ({
        ...row,
        revenue: parseFloat(row.revenue) || 0
      }));
    } catch (error) {
      console.error('Error executing seasonality query:', error);
      throw error;
    }
  }

  async getGrowthRates(filters = {}) {
    const { startDate, endDate, timePeriod = 'monthly' } = filters;

    const timeGroup = this._getTimeGrouping(timePeriod);
    const query = `
      WITH sales_by_period AS (
        SELECT 
          ${timeGroup} as period,
          SUM("Net Sales Amount") as revenue
        FROM dbo_f_sales_transaction
        WHERE "Txn Date"::date >= $1::date AND "Txn Date"::date <= $2::date
          AND "Deleted Flag" = 0 
          AND "Excluded Flag" = 0
        GROUP BY period
        ORDER BY period
      ),
      growth_calc AS (
        SELECT 
          period,
          revenue,
          LAG(revenue) OVER (ORDER BY period) as prev_revenue,
          ROUND((((revenue - LAG(revenue) OVER (ORDER BY period)) / NULLIF(LAG(revenue) OVER (ORDER BY period), 0)) * 100)::numeric, 2) as growth_rate
        FROM sales_by_period
      )
      SELECT 
        period,
        revenue,
        growth_rate,
        AVG(growth_rate) OVER () as avg_growth_rate,
        MIN(growth_rate) OVER () as min_growth_rate,
        MAX(growth_rate) OVER () as max_growth_rate
      FROM growth_calc
      WHERE growth_rate IS NOT NULL
      ORDER BY period
    `;

    try {
      const finalQuery = query.replace('$1', `'${startDate}'`).replace('$2', `'${endDate}'`);
      const result = await db.execute(sql`${sql.raw(finalQuery)}`);
      
      const rows = result.rows || result;
      return rows.map(row => ({
        ...row,
        revenue: parseFloat(row.revenue) || 0,
        growth_rate: parseFloat(row.growth_rate) || 0,
        avg_growth_rate: parseFloat(row.avg_growth_rate) || 0,
        min_growth_rate: parseFloat(row.min_growth_rate) || 0,
        max_growth_rate: parseFloat(row.max_growth_rate) || 0
      }));
    } catch (error) {
      console.error('Error executing growth rates query:', error);
      throw error;
    }
  }

  _getTimeGrouping(timePeriod) {
    const groupings = {
      daily: '"Txn Date"::date',
      weekly: "TO_CHAR(\"Txn Date\"::date, 'IYYY-IW')",
      monthly: "TO_CHAR(\"Txn Date\"::date, 'YYYY-MM')",
      quarterly: "TO_CHAR(\"Txn Date\"::date, 'YYYY-\"Q\"Q')",
      annual: "TO_CHAR(\"Txn Date\"::date, 'YYYY')"
    };
    return groupings[timePeriod] || groupings.monthly;
  }

  _getDimensionFields(dimension) {
    const dimensions = {
      product: { id: 'item_key', name: 'item_number' },
      category: { id: 'item_category_hrchy_key', name: 'item_category_hrchy_key' },
      channel: { id: 'sales_organization_key', name: 'business_unit_key' },
      region: { id: 'customer_geography_hrchy_key', name: 'customer_geography_hrchy_key' },
      customer: { id: 'customer_key', name: 'customer_key' }
    };
    return dimensions[dimension] || null;
  }

  // Clean up connection pool when done
  async close() {
    // No need to close Drizzle connection
  }
}

export { SalesTrendQueries };