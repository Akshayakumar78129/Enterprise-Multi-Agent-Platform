const { Pool } = require('pg');

class SalesTrendPostgresQueries {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.POSTGRES_DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
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

    try {
      const timeGroup = this._getTimeGrouping(timePeriod);
      const dimensionFields = this._getDimensionFields(dimension);

      let selectClause = [
        `${timeGroup} as period`,
        `SUM("Net Sales Amount") as revenue`,
        `SUM("Net Sales Quantity") as units`,
        `COUNT(DISTINCT "Sales Txn Number") as orders`
      ];

      if (dimensionFields) {
        selectClause.push(
          `"${dimensionFields.id}" as dimension_id`,
          `"${dimensionFields.name}" as dimension_name`
        );
      }

      let query;
      const params = [startDate, endDate];
      
      if (dimensionFields) {
        query = `
          SELECT ${selectClause.join(', ')}
          FROM dbo_f_sales_transaction
          WHERE "Txn Date"::date >= $1::date AND "Txn Date"::date <= $2::date
            AND "Deleted Flag" = 0 
            AND "Excluded Flag" = 0
          GROUP BY period, "${dimensionFields.id}", "${dimensionFields.name}"
          ORDER BY SUM("Net Sales Amount") DESC 
          LIMIT ${topN}
        `;
      } else {
        query = `
          SELECT ${selectClause.join(', ')}
          FROM dbo_f_sales_transaction
          WHERE "Txn Date"::date >= $1::date AND "Txn Date"::date <= $2::date
            AND "Deleted Flag" = 0 
            AND "Excluded Flag" = 0
          GROUP BY period
          ORDER BY period
        `;
      }

      const result = await this.pool.query(query, params);
      return result.rows.map(row => ({
        ...row,
        revenue: parseFloat(row.revenue) || 0,
        units: parseFloat(row.units) || 0,
        orders: parseInt(row.orders) || 0
      }));
    } catch (error) {
      console.error('Error in getMainData:', error);
      throw error;
    }
  }

  async getKPIData(filters = {}) {
    const { startDate, endDate } = filters;

    try {
      const query = `
        SELECT 
          SUM("Net Sales Amount") as total_revenue,
          SUM("Net Sales Quantity") as total_units,
          COUNT(DISTINCT "Sales Txn Number") as total_orders,
          CASE 
            WHEN COUNT(DISTINCT "Sales Txn Number") > 0 
            THEN ROUND((SUM("Net Sales Amount") / COUNT(DISTINCT "Sales Txn Number"))::numeric, 2)
            ELSE 0
          END as avg_order_value,
          CASE 
            WHEN SUM("Net Sales Amount") > 0 
            THEN ROUND(((SUM("Net Sales Amount" - "Cost Amount") / SUM("Net Sales Amount")) * 100)::numeric, 2)
            ELSE 0
          END as margin_percentage
        FROM dbo_f_sales_transaction
        WHERE "Txn Date"::date >= $1::date AND "Txn Date"::date <= $2::date
          AND "Deleted Flag" = 0 
          AND "Excluded Flag" = 0
      `;

      const result = await this.pool.query(query, [startDate, endDate]);
      const row = result.rows[0];
      
      return {
        total_revenue: parseFloat(row.total_revenue) || 0,
        total_units: parseFloat(row.total_units) || 0,
        total_orders: parseInt(row.total_orders) || 0,
        avg_order_value: parseFloat(row.avg_order_value) || 0,
        margin_percentage: parseFloat(row.margin_percentage) || 0
      };
    } catch (error) {
      console.error('Error in getKPIData:', error);
      throw error;
    }
  }

  async getSeasonalityData(filters = {}) {
    const { startDate, endDate, timePeriod = 'monthly' } = filters;

    try {
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

      const result = await this.pool.query(query, [startDate, endDate]);
      return result.rows.map(row => ({
        ...row,
        revenue: parseFloat(row.revenue) || 0
      }));
    } catch (error) {
      console.error('Error in getSeasonalityData:', error);
      throw error;
    }
  }

  async getGrowthRates(filters = {}) {
    const { startDate, endDate, timePeriod = 'monthly' } = filters;

    try {
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
            CASE 
              WHEN LAG(revenue) OVER (ORDER BY period) > 0
              THEN ROUND(((revenue - LAG(revenue) OVER (ORDER BY period)) / LAG(revenue) OVER (ORDER BY period) * 100)::numeric, 2)
              ELSE 0
            END as growth_rate
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

      const result = await this.pool.query(query, [startDate, endDate]);
      return result.rows.map(row => ({
        period: row.period,
        revenue: parseFloat(row.revenue) || 0,
        growth_rate: parseFloat(row.growth_rate) || 0,
        avg_growth_rate: parseFloat(row.avg_growth_rate) || 0,
        min_growth_rate: parseFloat(row.min_growth_rate) || 0,
        max_growth_rate: parseFloat(row.max_growth_rate) || 0
      }));
    } catch (error) {
      console.error('Error in getGrowthRates:', error);
      throw error;
    }
  }

  _getTimeGrouping(timePeriod) {
    const groupings = {
      daily: `"Txn Date"::date`,
      weekly: `TO_CHAR("Txn Date"::date, 'YYYY-IW')`,
      monthly: `TO_CHAR("Txn Date"::date, 'YYYY-MM')`,
      quarterly: `TO_CHAR("Txn Date"::date, 'YYYY-"Q"Q')`,
      annual: `EXTRACT(YEAR FROM "Txn Date"::date)::text`
    };
    return groupings[timePeriod] || groupings.monthly;
  }

  _getDimensionFields(dimension) {
    const dimensions = {
      product: { id: 'Item Key', name: 'Item Number' },
      category: { id: 'Item Category Hrchy Key', name: 'Product Posting Group' },
      channel: { id: 'Sales Organization Key', name: 'Business Unit Key' },
      region: { id: 'Customer Geography Hrchy Key', name: 'Customer Geography Hrchy Key' },
      customer: { id: 'Customer Key', name: 'Customer Key' }
    };
    return dimensions[dimension] || null;
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = { SalesTrendPostgresQueries };