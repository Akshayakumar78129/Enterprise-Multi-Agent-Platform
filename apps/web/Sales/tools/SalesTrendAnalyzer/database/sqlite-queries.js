const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SalesTrendSQLiteQueries {
  constructor() {
    // Use path relative to Next.js working directory
    this.dbPath = path.resolve(process.cwd(), 'Sales', 'database', 'sales_agent.db');
    console.log('🗃️ SQLite Database path:', this.dbPath);
    console.log('📁 Working directory:', process.cwd());
    
    // Check if file exists and get stats
    const fs = require('fs');
    const exists = fs.existsSync(this.dbPath);
    console.log('✅ Database file exists:', exists);
    if (exists) {
      const stats = fs.statSync(this.dbPath);
      console.log('📊 Database file size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('📅 Database last modified:', stats.mtime.toISOString());
    } else {
      console.error('❌ Database file not found at:', this.dbPath);
    }
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

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('❌ SQLite connection error in getMainData:', err.message);
          reject(new Error(`Failed to connect to SQLite database: ${err.message}`));
          return;
        }
        console.log('✅ SQLite database connected successfully for getMainData');
      });

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
            FROM "dbo_F_Sales_Transaction"
            WHERE date("Txn Date") >= date(?) AND date("Txn Date") <= date(?)
              AND "Deleted Flag" = 0 
              AND "Excluded Flag" = 0
            GROUP BY period, "${dimensionFields.id}", "${dimensionFields.name}"
            ORDER BY SUM("Net Sales Amount") DESC 
            LIMIT ${topN}
          `;
        } else {
          query = `
            SELECT ${selectClause.join(', ')}
            FROM "dbo_F_Sales_Transaction"
            WHERE date("Txn Date") >= date(?) AND date("Txn Date") <= date(?)
              AND "Deleted Flag" = 0 
              AND "Excluded Flag" = 0
            GROUP BY period
            ORDER BY period
          `;
        }

        console.log('🔍 Executing query:', query);
        console.log('📝 Query params:', params);
        
        db.all(query, params, (err, rows) => {
          if (err) {
            console.error('❌ Query execution error:', err.message);
            console.error('💥 Query:', query);
            db.close();
            reject(err);
            return;
          }

          console.log('✅ Query executed successfully, rows returned:', rows?.length || 0);
          
          // Log sample data to verify source
          if (rows && rows.length > 0) {
            console.log('📋 Sample data from sales_agent.db:', {
              firstRow: rows[0],
              totalRevenue: rows.reduce((sum, row) => sum + (parseFloat(row.revenue) || 0), 0),
              dateRange: {
                first: rows[0]?.period,
                last: rows[rows.length - 1]?.period
              }
            });
          }
          
          const results = rows.map(row => ({
            ...row,
            revenue: parseFloat(row.revenue) || 0,
            units: parseFloat(row.units) || 0,
            orders: parseInt(row.orders) || 0
          }));

          db.close();
          resolve(results);
        });
      } catch (error) {
        db.close();
        reject(error);
      }
    });
  }

  async getKPIData(filters = {}) {
    const { startDate, endDate } = filters;

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(new Error(`Failed to connect to SQLite database: ${err.message}`));
          return;
        }
      });

      const query = `
        SELECT 
          SUM("Net Sales Amount") as total_revenue,
          SUM("Net Sales Quantity") as total_units,
          COUNT(DISTINCT "Sales Txn Number") as total_orders,
          CASE 
            WHEN COUNT(DISTINCT "Sales Txn Number") > 0 
            THEN ROUND((SUM("Net Sales Amount") / COUNT(DISTINCT "Sales Txn Number")), 2)
            ELSE 0
          END as avg_order_value,
          CASE 
            WHEN SUM("Net Sales Amount") > 0 
            THEN ROUND(((SUM("Net Sales Amount") - SUM("Cost Amount")) / SUM("Net Sales Amount") * 100), 2)
            ELSE 0
          END as margin_percentage
        FROM "dbo_F_Sales_Transaction"
        WHERE date("Txn Date") >= date(?) AND date("Txn Date") <= date(?)
          AND "Deleted Flag" = 0 
          AND "Excluded Flag" = 0
      `;

      db.get(query, [startDate, endDate], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        const result = {
          total_revenue: parseFloat(row.total_revenue) || 0,
          total_units: parseFloat(row.total_units) || 0,
          total_orders: parseInt(row.total_orders) || 0,
          avg_order_value: parseFloat(row.avg_order_value) || 0,
          margin_percentage: parseFloat(row.margin_percentage) || 0
        };

        db.close();
        resolve(result);
      });
    });
  }

  async getSeasonalityData(filters = {}) {
    const { startDate, endDate, timePeriod = 'monthly' } = filters;

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(new Error(`Failed to connect to SQLite database: ${err.message}`));
          return;
        }
      });

      const timeGroup = this._getTimeGrouping(timePeriod);
      const query = `
        SELECT 
          ${timeGroup} as period,
          strftime('%Y', "Txn Date") as year,
          strftime('%m', "Txn Date") as month,
          SUM("Net Sales Amount") as revenue
        FROM "dbo_F_Sales_Transaction"
        WHERE date("Txn Date") >= date(?) AND date("Txn Date") <= date(?)
          AND "Deleted Flag" = 0 
          AND "Excluded Flag" = 0
        GROUP BY period, year, month
        ORDER BY period
      `;

      db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const results = rows.map(row => ({
          ...row,
          revenue: parseFloat(row.revenue) || 0
        }));

        db.close();
        resolve(results);
      });
    });
  }

  async getGrowthRates(filters = {}) {
    const { startDate, endDate, timePeriod = 'monthly' } = filters;

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(new Error(`Failed to connect to SQLite database: ${err.message}`));
          return;
        }
      });

      const timeGroup = this._getTimeGrouping(timePeriod);
      const query = `
        WITH sales_by_period AS (
          SELECT 
            ${timeGroup} as period,
            SUM("Net Sales Amount") as revenue
          FROM "dbo_F_Sales_Transaction"
          WHERE date("Txn Date") >= date(?) AND date("Txn Date") <= date(?)
            AND "Deleted Flag" = 0 
            AND "Excluded Flag" = 0
          GROUP BY period
          ORDER BY period
        ),
        growth_calc AS (
          SELECT 
            period,
            revenue,
            LAG(revenue, 1, revenue) OVER (ORDER BY period) as prev_revenue,
            CASE 
              WHEN LAG(revenue, 1, revenue) OVER (ORDER BY period) > 0
              THEN ROUND(((revenue - LAG(revenue, 1, revenue) OVER (ORDER BY period)) / LAG(revenue, 1, revenue) OVER (ORDER BY period) * 100), 2)
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

      db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const results = rows.map(row => ({
          period: row.period,
          revenue: parseFloat(row.revenue) || 0,
          growth_rate: parseFloat(row.growth_rate) || 0,
          avg_growth_rate: parseFloat(row.avg_growth_rate) || 0,
          min_growth_rate: parseFloat(row.min_growth_rate) || 0,
          max_growth_rate: parseFloat(row.max_growth_rate) || 0
        }));

        db.close();
        resolve(results);
      });
    });
  }

  _getTimeGrouping(timePeriod) {
    const groupings = {
      daily: `date("Txn Date")`,
      weekly: `strftime('%Y-%W', "Txn Date")`,
      monthly: `strftime('%Y-%m', "Txn Date")`,
      quarterly: `strftime('%Y-Q' || CAST((CAST(strftime('%m', "Txn Date") AS INTEGER) + 2) / 3 AS TEXT), "Txn Date")`,
      annual: `strftime('%Y', "Txn Date")`
    };
    return groupings[timePeriod] || groupings.monthly;
  }

  _getDimensionFields(dimension) {
    const dimensions = {
      product: { id: 'Item Key', name: 'Item Number' },
      category: { id: 'Item Key', name: 'Item Number' },
      channel: { id: 'Customer Key', name: 'Customer Key' },
      region: { id: 'Customer Key', name: 'Customer Key' },
      customer: { id: 'Customer Key', name: 'Customer Key' }
    };
    return dimensions[dimension] || null;
  }

  async close() {
    // SQLite connections are closed after each query
    return Promise.resolve();
  }
}

module.exports = { SalesTrendSQLiteQueries };