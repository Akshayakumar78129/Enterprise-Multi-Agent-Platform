const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../../../database/config');
const fs = require('fs');

class SalesTrendQueries {
  constructor() {
    this.dbPath = config.DATABASE.path;
    console.log('Database path:', this.dbPath);
    console.log('Database exists:', fs.existsSync(this.dbPath));
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
        `"${dimensionFields.id}" as dimension_id`,
        `"${dimensionFields.name}" as dimension_name`
      );
    }

    const query = `
      SELECT ${selectClause.join(', ')}
      FROM "dbo_F_Sales_Transaction"
      WHERE date("Txn Date") >= date(?) AND date("Txn Date") <= date(?)
        AND "Deleted Flag" = 0 
        AND "Excluded Flag" = 0
      ${dimensionFields ? `GROUP BY period, "${dimensionFields.id}", "${dimensionFields.name}"` : 'GROUP BY period'}
      ${dimensionFields ? `ORDER BY SUM("Net Sales Amount") DESC LIMIT ${topN}` : 'ORDER BY period'}
    `;

    return new Promise((resolve, reject) => {
      console.log('Connecting to database at:', this.dbPath);
      const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        console.log('Database connection successful');
        
        db.all(query, [startDate, endDate], (err, rows) => {
          if (err) {
            console.error('Error executing query:', err);
            db.close();
            reject(err);
            return;
          }
          console.log('Query executed successfully, rows:', rows?.length);
          db.close();
          resolve(rows);
        });
      });
    });
  }

  async getKPIData(filters = {}) {
    const { startDate, endDate } = filters;

    const query = `
      SELECT 
        SUM("Net Sales Amount") as total_revenue,
        SUM("Net Sales Quantity") as total_units,
        COUNT(DISTINCT "Sales Txn Number") as total_orders,
        ROUND(SUM("Net Sales Amount") / COUNT(DISTINCT "Sales Txn Number"), 2) as avg_order_value,
        ROUND(SUM("Net Sales Amount" - "Cost Amount") / SUM("Net Sales Amount") * 100, 2) as margin_percentage
      FROM "dbo_F_Sales_Transaction"
      WHERE date("Txn Date") >= date(?) AND date("Txn Date") <= date(?)
        AND "Deleted Flag" = 0 
        AND "Excluded Flag" = 0
    `;

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        
        db.get(query, [startDate, endDate], (err, row) => {
          db.close();
          if (err) {
            console.error('Error executing KPI query:', err);
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
    });
  }

  async getSeasonalityData(filters = {}) {
    const { startDate, endDate, timePeriod = 'monthly' } = filters;

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

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        
        db.all(query, [startDate, endDate], (err, rows) => {
          db.close();
          if (err) {
            console.error('Error executing seasonality query:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    });
  }

  async getGrowthRates(filters = {}) {
    const { startDate, endDate, timePeriod = 'monthly' } = filters;

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
          LAG(revenue) OVER (ORDER BY period) as prev_revenue,
          ROUND(((revenue - LAG(revenue) OVER (ORDER BY period)) / LAG(revenue) OVER (ORDER BY period)) * 100, 2) as growth_rate
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

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        
        db.all(query, [startDate, endDate], (err, rows) => {
          db.close();
          if (err) {
            console.error('Error executing growth rates query:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    });
  }

  _getTimeGrouping(timePeriod) {
    const groupings = {
      daily: 'date("Txn Date")',
      weekly: "strftime('%Y-%W', \"Txn Date\")",
      monthly: "strftime('%Y-%m', \"Txn Date\")",
      quarterly: "strftime('%Y-Q' || ((strftime('%m', \"Txn Date\") + 2) / 3)",
      annual: "strftime('%Y', \"Txn Date\")"
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
}

module.exports = { SalesTrendQueries }; 