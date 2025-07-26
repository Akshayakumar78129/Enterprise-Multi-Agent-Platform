const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class PurchaseFrequencyQueries {
  constructor() {
    this.dbPath = path.resolve(
      process.cwd(),
      "Customer/database/customers.db"
    );
  }

  async getMainData(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let dateFilter = "";
      const params = [];

      if (filters.dateRange) {
        if (filters.dateRange.start && filters.dateRange.end) {
          dateFilter = "WHERE st.[Txn Date] >= ? AND st.[Txn Date] <= ?";
          params.push(filters.dateRange.start, filters.dateRange.end);
        }
      } else {
        // Default to last 2 years of available data (2020-2021)
        dateFilter = "WHERE st.[Txn Date] >= '2020-01-01'";
      }

      const query = `
        WITH customer_purchases AS (
          SELECT 
            st.[Customer Key],
            c.[Customer Name],
            st.[Txn Date],
            st.[Sales Amount],
            ROW_NUMBER() OVER (PARTITION BY st.[Customer Key] ORDER BY st.[Txn Date]) as purchase_number
          FROM dbo_F_Sales_Transaction st
          INNER JOIN dbo_D_Customer c ON st.[Customer Key] = c.[Customer Key]
          ${dateFilter}
          AND st.[Sales Amount] > 0
        ),
        customer_intervals AS (
          SELECT 
            [Customer Key],
            [Customer Name],
            COUNT(*) as total_purchases,
            MIN([Txn Date]) as first_purchase,
            MAX([Txn Date]) as last_purchase,
            SUM([Sales Amount]) as total_spent,
            AVG([Sales Amount]) as avg_transaction_value,
            julianday(MAX([Txn Date])) - julianday(MIN([Txn Date])) as days_span,
            CASE 
              WHEN COUNT(*) > 1 THEN 
                (julianday(MAX([Txn Date])) - julianday(MIN([Txn Date]))) / (COUNT(*) - 1)
              ELSE NULL 
            END as avg_days_between
          FROM customer_purchases
          GROUP BY [Customer Key], [Customer Name]
        )
        SELECT 
          *,
          CASE 
            WHEN total_purchases = 1 THEN 'One-time'
            WHEN avg_days_between <= 30 THEN 'High Frequency'
            WHEN avg_days_between <= 90 THEN 'Medium Frequency'
            ELSE 'Low Frequency'
          END as frequency_segment,
          CASE 
            WHEN total_spent >= 1000 THEN 'Premium'
            WHEN total_spent >= 500 THEN 'Standard'
            WHEN total_spent >= 100 THEN 'Budget'
            ELSE 'Occasional'
          END as value_segment,
          CASE 
            WHEN julianday('2021-12-31') - julianday(last_purchase) <= 90 THEN 'Active'
            ELSE 'Inactive'
          END as recency_status
        FROM customer_intervals
        ORDER BY total_purchases DESC, total_spent DESC
      `;

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  async getKPIData(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let dateFilter = "";
      const params = [];

      if (filters.dateRange) {
        if (filters.dateRange.start && filters.dateRange.end) {
          dateFilter = "WHERE st.[Txn Date] >= ? AND st.[Txn Date] <= ?";
          params.push(filters.dateRange.start, filters.dateRange.end);
        }
      } else {
        // Default to last 2 years of available data (2020-2021)
        dateFilter = "WHERE st.[Txn Date] >= '2020-01-01'";
      }

      const query = `
        WITH customer_stats AS (
          SELECT 
            st.[Customer Key],
            COUNT(*) as purchase_count,
            MIN(st.[Txn Date]) as first_purchase,
            MAX(st.[Txn Date]) as last_purchase,
            SUM(st.[Sales Amount]) as total_spent,
            CASE 
              WHEN COUNT(*) > 1 THEN 
                (julianday(MAX(st.[Txn Date])) - julianday(MIN(st.[Txn Date]))) / (COUNT(*) - 1)
              ELSE NULL 
            END as avg_days_between,
            CASE 
              WHEN julianday('2021-12-31') - julianday(MAX(st.[Txn Date])) <= 90 THEN 1
              ELSE 0
            END as is_active
          FROM dbo_F_Sales_Transaction st
          ${dateFilter}
          AND st.[Sales Amount] > 0
          GROUP BY st.[Customer Key]
        )
        SELECT 
          COUNT(*) as total_customers,
          AVG(purchase_count) as avg_purchase_frequency,
          AVG(avg_days_between) as avg_days_between_purchases,
          (SUM(is_active) * 100.0 / COUNT(*)) as active_customer_percentage,
          (SUM(CASE WHEN total_spent >= 1000 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as high_value_percentage,
          AVG(total_spent) as avg_customer_value
        FROM customer_stats
      `;

      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
        db.close();
      });
    });
  }

  async getFrequencyDistribution(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let dateFilter = "";
      const params = [];

      if (filters.dateRange) {
        if (filters.dateRange.start && filters.dateRange.end) {
          dateFilter = "WHERE st.[Txn Date] >= ? AND st.[Txn Date] <= ?";
          params.push(filters.dateRange.start, filters.dateRange.end);
        }
      } else {
        // Default to last 2 years of available data (2020-2021)
        dateFilter = "WHERE st.[Txn Date] >= '2020-01-01'";
      }

      const query = `
        WITH customer_purchases AS (
          SELECT 
            [Customer Key],
            COUNT(*) as purchase_count
          FROM dbo_F_Sales_Transaction st
          ${dateFilter}
          AND [Sales Amount] > 0
          GROUP BY [Customer Key]
        ),
        frequency_bins AS (
          SELECT 
            CASE 
              WHEN purchase_count = 1 THEN '1'
              WHEN purchase_count = 2 THEN '2'
              WHEN purchase_count = 3 THEN '3'
              WHEN purchase_count BETWEEN 4 AND 5 THEN '4-5'
              WHEN purchase_count BETWEEN 6 AND 10 THEN '6-10'
              WHEN purchase_count BETWEEN 11 AND 20 THEN '11-20'
              ELSE '20+'
            END as frequency_bin,
            purchase_count
          FROM customer_purchases
        )
        SELECT 
          frequency_bin,
          COUNT(*) as customer_count,
          AVG(purchase_count) as avg_purchases_in_bin
        FROM frequency_bins
        GROUP BY frequency_bin
        ORDER BY 
          CASE frequency_bin
            WHEN '1' THEN 1
            WHEN '2' THEN 2
            WHEN '3' THEN 3
            WHEN '4-5' THEN 4
            WHEN '6-10' THEN 5
            WHEN '11-20' THEN 6
            ELSE 7
          END
      `;

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  async getIntervalHeatmap(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let dateFilter = "";
      const params = [];

      if (filters.dateRange) {
        if (filters.dateRange.start && filters.dateRange.end) {
          dateFilter = "WHERE [Txn Date] >= ? AND [Txn Date] <= ?";
          params.push(filters.dateRange.start, filters.dateRange.end);
        }
      } else {
        // Default to last 2 years of available data (2020-2021)
        dateFilter = "WHERE [Txn Date] >= '2020-01-01'";
      }

      const query = `
        SELECT 
          strftime('%w', [Txn Date]) as day_of_week,
          strftime('%W', [Txn Date]) as week_number,
          [Txn Date] as transaction_date,
          COUNT(*) as transaction_count,
          SUM([Sales Amount]) as total_sales,
          AVG([Sales Amount]) as avg_transaction_value
        FROM dbo_F_Sales_Transaction
        ${dateFilter}
        AND [Sales Amount] > 0
        GROUP BY strftime('%w', [Txn Date]), strftime('%W', [Txn Date]), [Txn Date]
        ORDER BY [Txn Date]
      `;

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  async getCustomerSegments(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let dateFilter = "";
      const params = [];

      if (filters.dateRange) {
        if (filters.dateRange.start && filters.dateRange.end) {
          dateFilter = "WHERE st.[Txn Date] >= ? AND st.[Txn Date] <= ?";
          params.push(filters.dateRange.start, filters.dateRange.end);
        }
      } else {
        // Default to last 2 years of available data (2020-2021)
        dateFilter = "WHERE st.[Txn Date] >= '2020-01-01'";
      }

      const query = `
        WITH customer_metrics AS (
          SELECT 
            st.[Customer Key],
            c.[Customer Name],
            COUNT(*) as frequency,
            SUM(st.[Sales Amount]) as monetary_value,
            julianday('2021-12-31') - julianday(MAX(st.[Txn Date])) as recency_days,
            AVG(st.[Sales Amount]) as avg_transaction_value
          FROM dbo_F_Sales_Transaction st
          INNER JOIN dbo_D_Customer c ON st.[Customer Key] = c.[Customer Key]
          ${dateFilter}
          AND st.[Sales Amount] > 0
          GROUP BY st.[Customer Key], c.[Customer Name]
        )
        SELECT 
          [Customer Key],
          [Customer Name],
          frequency,
          monetary_value,
          recency_days,
          avg_transaction_value,
          CASE 
            WHEN frequency >= 5 AND monetary_value >= 1000 THEN 'Champions'
            WHEN frequency >= 3 AND monetary_value >= 500 THEN 'Loyal'
            WHEN frequency <= 2 AND monetary_value >= 1000 THEN 'Big Spenders'
            WHEN recency_days > 90 THEN 'At Risk'
            ELSE 'Others'
          END as segment
        FROM customer_metrics
        ORDER BY monetary_value DESC, frequency DESC
      `;

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  async getValueSegments(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let dateFilter = "";
      const params = [];

      if (filters.dateRange) {
        if (filters.dateRange.start && filters.dateRange.end) {
          dateFilter = "WHERE st.[Txn Date] >= ? AND st.[Txn Date] <= ?";
          params.push(filters.dateRange.start, filters.dateRange.end);
        }
      } else {
        // Default to last 2 years of available data (2020-2021)
        dateFilter = "WHERE st.[Txn Date] >= '2020-01-01'";
      }

      const query = `
        WITH customer_values AS (
          SELECT 
            [Customer Key],
            SUM([Sales Amount]) as total_spent,
            COUNT(*) as purchase_count
          FROM dbo_F_Sales_Transaction st
          ${dateFilter}
          AND [Sales Amount] > 0
          GROUP BY [Customer Key]
        ),
        value_segments AS (
          SELECT 
            CASE 
              WHEN total_spent >= 2000 THEN 'Premium'
              WHEN total_spent >= 1000 THEN 'Standard'
              WHEN total_spent >= 300 THEN 'Budget'
              ELSE 'Occasional'
            END as segment,
            total_spent,
            purchase_count
          FROM customer_values
        )
        SELECT 
          segment,
          COUNT(*) as customer_count,
          AVG(total_spent) as avg_value,
          SUM(total_spent) as total_segment_value,
          AVG(purchase_count) as avg_purchases
        FROM value_segments
        GROUP BY segment
        ORDER BY 
          CASE segment
            WHEN 'Premium' THEN 1
            WHEN 'Standard' THEN 2
            WHEN 'Budget' THEN 3
            ELSE 4
          END
      `;

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }
}

module.exports = { PurchaseFrequencyQueries }; 