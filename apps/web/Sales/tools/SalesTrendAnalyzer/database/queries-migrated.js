const { db } = require('../../../../lib/db/connector');
const { dbo_f_sales_transaction } = require('../../../../lib/db/schema');
const { sql, eq, and, between, desc, asc, sum, count, countDistinct, avg } = require('drizzle-orm');

class SalesTrendQueries {
  constructor() {
    // No database path needed with Drizzle
  }

  // Helper function to convert BigInt values to Numbers for JSON serialization
  _convertBigIntToNumber(obj) {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'bigint') {
      return Number(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this._convertBigIntToNumber(item));
    }
    
    if (typeof obj === 'object') {
      const converted = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = this._convertBigIntToNumber(value);
      }
      return converted;
    }
    
    return obj;
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

    try {
      let selectFields = {
        period: timeGroup,
        revenue: sql`SUM(${dbo_f_sales_transaction.net_sales_amount})`,
        units: sql`SUM(${dbo_f_sales_transaction.net_sales_quantity})`,
        orders: countDistinct(dbo_f_sales_transaction.sales_txn_number)
      };

      if (dimensionFields) {
        selectFields.dimension_id = sql.identifier(dimensionFields.id);
        selectFields.dimension_name = sql.identifier(dimensionFields.name);
      }

      let query = db
        .select(selectFields)
        .from(dbo_f_sales_transaction)
        .where(and(
          sql`DATE(${dbo_f_sales_transaction.txn_date}) >= DATE(${startDate})`,
          sql`DATE(${dbo_f_sales_transaction.txn_date}) <= DATE(${endDate})`,
          eq(dbo_f_sales_transaction.deleted_flag, false),
          eq(dbo_f_sales_transaction.excluded_flag, false)
        ));

      if (dimensionFields) {
        query = query
          .groupBy(timeGroup, sql.identifier(dimensionFields.id), sql.identifier(dimensionFields.name))
          .orderBy(desc(sql`SUM(${dbo_f_sales_transaction.net_sales_amount})`))
          .limit(topN);
      } else {
        query = query
          .groupBy(timeGroup)
          .orderBy(asc(timeGroup));
      }

      const results = await query;
      return this._convertBigIntToNumber(results);
    } catch (error) {
      console.error('Error executing main data query:', error);
      throw error;
    }
  }

  async getKPIData(filters = {}) {
    const { startDate, endDate } = filters;

    try {
      const results = await db
        .select({
          total_revenue: sql`SUM(${dbo_f_sales_transaction.net_sales_amount})`,
          total_units: sql`SUM(${dbo_f_sales_transaction.net_sales_quantity})`,
          total_orders: countDistinct(dbo_f_sales_transaction.sales_txn_number),
          avg_order_value: sql`ROUND(SUM(${dbo_f_sales_transaction.net_sales_amount}) / COUNT(DISTINCT ${dbo_f_sales_transaction.sales_txn_number}), 2)`,
          margin_percentage: sql`ROUND(SUM(${dbo_f_sales_transaction.net_sales_amount} - ${dbo_f_sales_transaction.cost_amount}) / SUM(${dbo_f_sales_transaction.net_sales_amount}) * 100, 2)`
        })
        .from(dbo_f_sales_transaction)
        .where(and(
          sql`DATE(${dbo_f_sales_transaction.txn_date}) >= DATE(${startDate})`,
          sql`DATE(${dbo_f_sales_transaction.txn_date}) <= DATE(${endDate})`,
          eq(dbo_f_sales_transaction.deleted_flag, false),
          eq(dbo_f_sales_transaction.excluded_flag, false)
        ));

      return this._convertBigIntToNumber(results[0]);
    } catch (error) {
      console.error('Error executing KPI query:', error);
      throw error;
    }
  }

  async getSeasonalityData(filters = {}) {
    const { startDate, endDate, timePeriod = 'monthly' } = filters;

    const timeGroup = this._getTimeGrouping(timePeriod);

    try {
      const results = await db
        .select({
          period: timeGroup,
          year: sql`EXTRACT(YEAR FROM ${dbo_f_sales_transaction.txn_date})`,
          month: sql`EXTRACT(MONTH FROM ${dbo_f_sales_transaction.txn_date})`,
          revenue: sql`SUM(${dbo_f_sales_transaction.net_sales_amount})`
        })
        .from(dbo_f_sales_transaction)
        .where(and(
          sql`DATE(${dbo_f_sales_transaction.txn_date}) >= DATE(${startDate})`,
          sql`DATE(${dbo_f_sales_transaction.txn_date}) <= DATE(${endDate})`,
          eq(dbo_f_sales_transaction.deleted_flag, false),
          eq(dbo_f_sales_transaction.excluded_flag, false)
        ))
        .groupBy(timeGroup, sql`EXTRACT(YEAR FROM ${dbo_f_sales_transaction.txn_date})`, sql`EXTRACT(MONTH FROM ${dbo_f_sales_transaction.txn_date})`)
        .orderBy(asc(timeGroup));

      return this._convertBigIntToNumber(results);
    } catch (error) {
      console.error('Error executing seasonality query:', error);
      throw error;
    }
  }

  async getGrowthRates(filters = {}) {
    const { startDate, endDate, timePeriod = 'monthly' } = filters;

    const timeGroup = this._getTimeGrouping(timePeriod);

    try {
      // Use raw SQL for complex window functions and CTEs
      const results = await db.execute(sql`
        WITH sales_by_period AS (
          SELECT 
            ${timeGroup} as period,
            SUM(${dbo_f_sales_transaction.net_sales_amount}) as revenue
          FROM dbo_f_sales_transaction
          WHERE DATE(txn_date) >= DATE(${startDate}) 
            AND DATE(txn_date) <= DATE(${endDate})
            AND deleted_flag = false 
            AND excluded_flag = false
          GROUP BY ${timeGroup}
          ORDER BY ${timeGroup}
        ),
        growth_calc AS (
          SELECT 
            period,
            revenue,
            LAG(revenue) OVER (ORDER BY period) as prev_revenue,
            ROUND(((revenue - LAG(revenue) OVER (ORDER BY period)) / NULLIF(LAG(revenue) OVER (ORDER BY period), 0)) * 100, 2) as growth_rate
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
      `);

      return this._convertBigIntToNumber(results.rows);
    } catch (error) {
      console.error('Error executing growth rates query:', error);
      throw error;
    }
  }

  _getTimeGrouping(timePeriod) {
    const groupings = {
      daily: sql`DATE(${dbo_f_sales_transaction.txn_date})`,
      weekly: sql`TO_CHAR(${dbo_f_sales_transaction.txn_date}, 'YYYY-"W"WW')`,
      monthly: sql`TO_CHAR(${dbo_f_sales_transaction.txn_date}, 'YYYY-MM')`,
      quarterly: sql`TO_CHAR(${dbo_f_sales_transaction.txn_date}, 'YYYY-"Q"Q')`,
      annual: sql`EXTRACT(YEAR FROM ${dbo_f_sales_transaction.txn_date})`
    };
    return groupings[timePeriod] || groupings.monthly;
  }

  _getDimensionFields(dimension) {
    const dimensions = {
      product: { id: 'item_key', name: 'item_number' },
      category: { id: 'item_category_hrchy_key', name: 'item_category_hrchy_key' }, // Note: may need adjustment based on actual schema
      channel: { id: 'sales_organization_key', name: 'sales_organization_key' },
      region: { id: 'customer_geography_hrchy_key', name: 'customer_geography_hrchy_key' }, // Note: may need adjustment
      customer: { id: 'customer_key', name: 'customer_key' }
    };
    return dimensions[dimension] || null;
  }
}

module.exports = { SalesTrendQueries };