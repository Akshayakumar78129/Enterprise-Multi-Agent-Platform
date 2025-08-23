const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require('fs');

class NextPurchaseQueries {
  constructor() {
    // Attempt multiple candidate paths to locate customers.db to avoid CWD brittleness.
    const candidates = [
      path.resolve(process.cwd(), 'Customer', 'database', 'customers.db'),
      path.resolve(process.cwd(), 'apps', 'web', 'Customer', 'database', 'customers.db'),
      path.resolve(__dirname, '..', '..', 'database', 'customers.db'),
      path.resolve(__dirname, '..', '..', '..', 'database', 'customers.db')
    ];
    this.dbPath = candidates.find(p => fs.existsSync(p));
    if (!this.dbPath) {
      // Keep a best-effort default (first) for error messaging
      this.dbPath = candidates[0];
      console.warn('[NextPurchaseQueries] customers.db not found at expected locations:', candidates);
    }
  }

  async getMainData(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let whereClause = "WHERE [Net Sales Quantity] > 0";
      let params = [];
      
      if (filters.dateRange?.start) {
        whereClause += " AND [Txn Date] >= ?";
        params.push(filters.dateRange.start);
      }
      
      if (filters.dateRange?.end) {
        whereClause += " AND [Txn Date] <= ?";
        params.push(filters.dateRange.end);
      }
      
      if (filters.customerKey) {
        whereClause += " AND [Customer Key] = ?";
        params.push(filters.customerKey);
      }

      const query = `
        SELECT 
          t.[Customer Key],
          c.[Customer Name],
          t.[Txn Date],
          t.[Item Number],
          t.[Sales Amount],
          t.[Net Sales Quantity],
          SUBSTR(t.[Item Number], 1, INSTR(t.[Item Number], '-') - 1) as product_category,
          ROW_NUMBER() OVER (PARTITION BY t.[Customer Key] ORDER BY t.[Txn Date]) as purchase_sequence
        FROM dbo_F_Sales_Transaction t
        LEFT JOIN dbo_D_Customer c ON t.[Customer Key] = c.[Customer Key]
        ${whereClause}
        ORDER BY t.[Customer Key], t.[Txn Date]
      `;

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          console.error("Error in getMainData:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getKPIData(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let whereClause = "WHERE [Net Sales Quantity] > 0";
      let params = [];
      
      if (filters.dateRange?.start) {
        whereClause += " AND [Txn Date] >= ?";
        params.push(filters.dateRange.start);
      }
      
      if (filters.dateRange?.end) {
        whereClause += " AND [Txn Date] <= ?";
        params.push(filters.dateRange.end);
      }

      const query = `
        WITH customer_stats AS (
          SELECT 
            [Customer Key],
            COUNT(*) as total_purchases,
            AVG([Sales Amount]) as avg_amount,
            MIN([Txn Date]) as first_purchase,
            MAX([Txn Date]) as last_purchase,
            COUNT(DISTINCT SUBSTR([Item Number], 1, INSTR([Item Number], '-') - 1)) as unique_categories
          FROM dbo_F_Sales_Transaction 
          ${whereClause}
          GROUP BY [Customer Key]
        ),
        purchase_intervals AS (
          SELECT 
            [Customer Key],
            [Txn Date],
            LAG([Txn Date]) OVER (PARTITION BY [Customer Key] ORDER BY [Txn Date]) as prev_date,
            julianday([Txn Date]) - julianday(LAG([Txn Date]) OVER (PARTITION BY [Customer Key] ORDER BY [Txn Date])) as days_between
          FROM dbo_F_Sales_Transaction 
          ${whereClause}
        ),
        prediction_stats AS (
          SELECT 
            COUNT(DISTINCT [Customer Key]) as active_customers,
            AVG(days_between) as avg_days_between,
            COUNT(*) as total_transactions
          FROM purchase_intervals 
          WHERE days_between IS NOT NULL
        )
        SELECT 
          (SELECT COUNT(DISTINCT [Customer Key]) FROM dbo_F_Sales_Transaction ${whereClause}) as total_customers,
          p.active_customers,
          p.avg_days_between,
          p.total_transactions,
          (SELECT AVG(unique_categories) FROM customer_stats) as avg_categories_per_customer,
          CAST(p.active_customers AS FLOAT) / (SELECT COUNT(DISTINCT [Customer Key]) FROM dbo_F_Sales_Transaction ${whereClause}) * 100 as prediction_coverage
        FROM prediction_stats p
      `;

      db.get(query, params, (err, row) => {
        db.close();
        if (err) {
          console.error("Error in getKPIData:", err);
          reject(err);
        } else {
          resolve({
            totalCustomers: row?.total_customers || 0,
            activeCustomers: row?.active_customers || 0,
            avgDaysBetween: Math.round(row?.avg_days_between || 0),
            totalTransactions: row?.total_transactions || 0,
            avgCategoriesPerCustomer: Math.round((row?.avg_categories_per_customer || 0) * 10) / 10,
            predictionCoverage: Math.round((row?.prediction_coverage || 0) * 10) / 10,
            modelAccuracy: 85.2, // Simulated - would come from ML model
            topRecommendation: "M-3003", // Simulated - would come from ML model
            avgPurchaseWindow: 28 // Simulated - would come from ML model
          });
        }
      });
    });
  }

  async getPurchaseSequences(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let whereClause = "WHERE [Net Sales Quantity] > 0";
      let params = [];
      
      if (filters.customerKey) {
        whereClause += " AND [Customer Key] = ?";
        params.push(filters.customerKey);
      }

      const query = `
        WITH customer_sequences AS (
          SELECT 
            [Customer Key],
            [Txn Date],
            [Item Number],
            SUBSTR([Item Number], 1, INSTR([Item Number], '-') - 1) as product_category,
            [Sales Amount],
            ROW_NUMBER() OVER (PARTITION BY [Customer Key] ORDER BY [Txn Date]) as sequence_order,
            LAG([Txn Date]) OVER (PARTITION BY [Customer Key] ORDER BY [Txn Date]) as prev_date,
            julianday([Txn Date]) - julianday(LAG([Txn Date]) OVER (PARTITION BY [Customer Key] ORDER BY [Txn Date])) as days_since_last
          FROM dbo_F_Sales_Transaction 
          ${whereClause}
        )
        SELECT 
          [Customer Key],
          [Txn Date],
          product_category,
          [Sales Amount],
          sequence_order,
          COALESCE(days_since_last, 0) as days_since_last
        FROM customer_sequences
        ORDER BY [Customer Key], sequence_order
        LIMIT 1000
      `;

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          console.error("Error in getPurchaseSequences:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getProductAssociations(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      const query = `
        WITH customer_products AS (
          SELECT 
            [Customer Key],
            SUBSTR([Item Number], 1, INSTR([Item Number], '-') - 1) as product_category,
            COUNT(*) as purchase_count
          FROM dbo_F_Sales_Transaction 
          WHERE [Net Sales Quantity] > 0
          GROUP BY [Customer Key], SUBSTR([Item Number], 1, INSTR([Item Number], '-') - 1)
        ),
        product_pairs AS (
          SELECT 
            p1.product_category as product_a,
            p2.product_category as product_b,
            COUNT(*) as co_occurrence_count
          FROM customer_products p1
          JOIN customer_products p2 ON p1.[Customer Key] = p2.[Customer Key] 
            AND p1.product_category < p2.product_category
          GROUP BY p1.product_category, p2.product_category
        )
        SELECT 
          product_a,
          product_b,
          co_occurrence_count,
          CAST(co_occurrence_count AS FLOAT) / (
            SELECT COUNT(DISTINCT [Customer Key]) FROM dbo_F_Sales_Transaction WHERE [Net Sales Quantity] > 0
          ) * 100 as association_strength
        FROM product_pairs
        WHERE co_occurrence_count >= 5
        ORDER BY co_occurrence_count DESC
        LIMIT 50
      `;

      db.all(query, [], (err, rows) => {
        db.close();
        if (err) {
          console.error("Error in getProductAssociations:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getPredictionData(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      // Simulate prediction data - in real implementation this would come from ML model
      const query = `
        WITH customer_features AS (
          SELECT 
            [Customer Key],
            COUNT(*) as total_purchases,
            AVG([Sales Amount]) as avg_amount,
            MIN([Txn Date]) as first_purchase,
            MAX([Txn Date]) as last_purchase,
            COUNT(DISTINCT SUBSTR([Item Number], 1, INSTR([Item Number], '-') - 1)) as unique_categories,
            julianday('now') - julianday(MAX([Txn Date])) as days_since_last_purchase
          FROM dbo_F_Sales_Transaction 
          WHERE [Net Sales Quantity] > 0
          GROUP BY [Customer Key]
          HAVING COUNT(*) >= 2
        )
        SELECT 
          [Customer Key],
          total_purchases,
          avg_amount,
          unique_categories,
          days_since_last_purchase,
          -- Simulated predictions
          CASE 
            WHEN days_since_last_purchase < 30 THEN 0.8 + (RANDOM() % 20) / 100.0
            WHEN days_since_last_purchase < 60 THEN 0.6 + (RANDOM() % 30) / 100.0
            ELSE 0.3 + (RANDOM() % 40) / 100.0
          END as prediction_probability,
          CASE 
            WHEN days_since_last_purchase < 30 THEN 15 + (RANDOM() % 20)
            WHEN days_since_last_purchase < 60 THEN 25 + (RANDOM() % 30)
            ELSE 40 + (RANDOM() % 50)
          END as predicted_days_to_purchase,
          CASE (RANDOM() % 4)
            WHEN 0 THEN 'M-3003'
            WHEN 1 THEN 'M-2001'
            WHEN 2 THEN 'R-4003'
            ELSE 'M-3004'
          END as predicted_product
        FROM customer_features
        ORDER BY prediction_probability DESC
        LIMIT 100
      `;

      db.all(query, [], (err, rows) => {
        db.close();
        if (err) {
          console.error("Error in getPredictionData:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getCustomerTimeline(customerKey) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      const query = `
        SELECT 
          [Txn Date],
          [Item Number],
          SUBSTR([Item Number], 1, INSTR([Item Number], '-') - 1) as product_category,
          [Sales Amount],
          [Net Sales Quantity],
          ROW_NUMBER() OVER (ORDER BY [Txn Date]) as sequence_order
        FROM dbo_F_Sales_Transaction 
        WHERE [Customer Key] = ? AND [Net Sales Quantity] > 0
        ORDER BY [Txn Date]
      `;

      db.all(query, [customerKey], (err, rows) => {
        db.close();
        if (err) {
          console.error("Error in getCustomerTimeline:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = { NextPurchaseQueries }; 