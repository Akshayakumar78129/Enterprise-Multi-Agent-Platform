const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class TransactionPatternsQueries {
  constructor() {
    this.dbPath = path.resolve(
      process.cwd(),
      "Customer/database/customers.db"
    );
  }

  async getMainData(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let whereClause = "WHERE 1=1";
      let params = [];
      
      if (filters.dateRange) {
        whereClause += " AND [Txn Date] BETWEEN ? AND ?";
        params.push(filters.dateRange.start, filters.dateRange.end);
      }
      
      if (filters.customerKey) {
        whereClause += " AND [Customer Key] = ?";
        params.push(filters.customerKey);
      }

      const query = `
        SELECT 
          [Sales Txn Key],
          [Customer Key],
          [Item Key],
          [Item Number],
          [Txn Date],
          [Posting Time],
          [Sales Amount],
          [Sales Quantity],
          [Net Sales Amount],
          [Discount Reason],
          [Sales Txn Type],
          [Sales Txn Number],
          strftime('%H', [Txn Date] || ' ' || printf('%02d:00:00', CAST([Posting Time] AS INTEGER))) as hour,
          strftime('%w', [Txn Date]) as day_of_week,
          strftime('%Y-%m-%d', [Txn Date]) as date_only
        FROM dbo_F_Sales_Transaction 
        ${whereClause}
        AND [Sales Amount] IS NOT NULL 
        AND [Txn Date] IS NOT NULL
        ORDER BY [Txn Date] DESC, [Posting Time] DESC
        LIMIT 10000
      `;

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getTemporalData(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let whereClause = "WHERE 1=1";
      let params = [];
      
      if (filters.dateRange) {
        whereClause += " AND [Txn Date] BETWEEN ? AND ?";
        params.push(filters.dateRange.start, filters.dateRange.end);
      }

      const query = `
        SELECT 
          strftime('%w', [Txn Date]) as day_of_week,
          CASE 
            WHEN [Posting Time] IS NULL THEN 12
            ELSE CAST([Posting Time] AS INTEGER) 
          END as hour,
          COUNT(*) as transaction_count,
          SUM([Sales Amount]) as total_amount,
          AVG([Sales Amount]) as avg_amount
        FROM dbo_F_Sales_Transaction 
        ${whereClause}
        AND [Sales Amount] IS NOT NULL 
        AND [Txn Date] IS NOT NULL
        GROUP BY day_of_week, hour
        ORDER BY day_of_week, hour
      `;

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          // Transform to heatmap format
          const heatmapData = [];
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          
          for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
              const dataPoint = rows.find(r => r.day_of_week == day && r.hour == hour);
              heatmapData.push({
                day: days[day],
                dayIndex: day,
                hour: hour,
                transactionCount: dataPoint ? dataPoint.transaction_count : 0,
                totalAmount: dataPoint ? dataPoint.total_amount : 0,
                avgAmount: dataPoint ? dataPoint.avg_amount : 0
              });
            }
          }
          
          resolve(heatmapData);
        }
      });
    });
  }

  async getTimeSeriesData(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let whereClause = "WHERE 1=1";
      let params = [];
      
      if (filters.dateRange) {
        whereClause += " AND [Txn Date] BETWEEN ? AND ?";
        params.push(filters.dateRange.start, filters.dateRange.end);
      }

      const query = `
        SELECT 
          strftime('%Y-%m-%d', [Txn Date]) as date,
          COUNT(*) as transaction_count,
          SUM([Sales Amount]) as total_amount,
          AVG([Sales Amount]) as avg_amount,
          COUNT(DISTINCT [Customer Key]) as unique_customers,
          COUNT(DISTINCT [Item Key]) as unique_items
        FROM dbo_F_Sales_Transaction 
        ${whereClause}
        AND [Sales Amount] IS NOT NULL 
        AND [Txn Date] IS NOT NULL
        GROUP BY strftime('%Y-%m-%d', [Txn Date])
        ORDER BY date
      `;

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
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
      
      let whereClause = "WHERE 1=1";
      let params = [];
      
      if (filters.dateRange) {
        whereClause += " AND [Txn Date] BETWEEN ? AND ?";
        params.push(filters.dateRange.start, filters.dateRange.end);
      }

      // Get product co-occurrences within same transaction documents
      const query = `
        WITH product_transactions AS (
          SELECT DISTINCT
            [Sales Txn Document],
            [Item Number],
            [Customer Key],
            [Txn Date]
          FROM dbo_F_Sales_Transaction 
          ${whereClause}
          AND [Item Number] IS NOT NULL
          AND [Sales Txn Document] IS NOT NULL
        ),
        product_pairs AS (
          SELECT 
            p1.[Item Number] as product_a,
            p2.[Item Number] as product_b,
            COUNT(*) as co_occurrence_count
          FROM product_transactions p1
          JOIN product_transactions p2 ON p1.[Sales Txn Document] = p2.[Sales Txn Document]
          WHERE p1.[Item Number] < p2.[Item Number]
          GROUP BY p1.[Item Number], p2.[Item Number]
          HAVING COUNT(*) >= 2
        ),
        product_totals AS (
          SELECT 
            [Item Number],
            COUNT(DISTINCT [Sales Txn Document]) as total_transactions
          FROM product_transactions
          GROUP BY [Item Number]
        )
        SELECT 
          pp.product_a,
          pp.product_b,
          pp.co_occurrence_count,
          pt1.total_transactions as product_a_total,
          pt2.total_transactions as product_b_total,
          ROUND(
            CAST(pp.co_occurrence_count AS FLOAT) / 
            CAST(pt1.total_transactions AS FLOAT), 3
          ) as confidence_a_to_b,
          ROUND(
            CAST(pp.co_occurrence_count AS FLOAT) / 
            CAST(pt2.total_transactions AS FLOAT), 3
          ) as confidence_b_to_a
        FROM product_pairs pp
        JOIN product_totals pt1 ON pp.product_a = pt1.[Item Number]
        JOIN product_totals pt2 ON pp.product_b = pt2.[Item Number]
        ORDER BY pp.co_occurrence_count DESC
        LIMIT 50
      `;

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getAnomalousTransactions(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let whereClause = "WHERE 1=1";
      let params = [];
      
      if (filters.dateRange) {
        whereClause += " AND [Txn Date] BETWEEN ? AND ?";
        params.push(filters.dateRange.start, filters.dateRange.end);
      }

      // Simple anomaly detection based on statistical outliers
      const query = `
        WITH transaction_stats AS (
          SELECT 
            AVG([Sales Amount]) as avg_amount,
            AVG([Sales Quantity]) as avg_quantity,
            (SELECT AVG(x) FROM (
              SELECT ABS([Sales Amount] - AVG([Sales Amount]) OVER()) as x 
              FROM dbo_F_Sales_Transaction
            )) as mad_amount
          FROM dbo_F_Sales_Transaction 
          ${whereClause}
          AND [Sales Amount] IS NOT NULL
        ),
        scored_transactions AS (
          SELECT 
            [Sales Txn Key],
            [Customer Key],
            [Item Number],
            [Txn Date],
            [Sales Amount],
            [Sales Quantity],
            [Sales Txn Number],
            ABS([Sales Amount] - ts.avg_amount) / NULLIF(ts.mad_amount, 0) as amount_anomaly_score,
            ABS([Sales Quantity] - ts.avg_quantity) / NULLIF(ts.avg_quantity, 0) as quantity_anomaly_score
          FROM dbo_F_Sales_Transaction, transaction_stats ts
          ${whereClause}
          AND [Sales Amount] IS NOT NULL
        )
        SELECT 
          *,
          (amount_anomaly_score + quantity_anomaly_score) / 2 as combined_anomaly_score,
          CASE 
            WHEN (amount_anomaly_score + quantity_anomaly_score) / 2 > 3 THEN 'High'
            WHEN (amount_anomaly_score + quantity_anomaly_score) / 2 > 2 THEN 'Medium'
            ELSE 'Low'
          END as anomaly_level
        FROM scored_transactions
        WHERE (amount_anomaly_score + quantity_anomaly_score) / 2 > 1.5
        ORDER BY combined_anomaly_score DESC
        LIMIT 100
      `;

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getPaymentMethodDistribution(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let whereClause = "WHERE 1=1";
      let params = [];
      
      if (filters.dateRange) {
        whereClause += " AND [Txn Date] BETWEEN ? AND ?";
        params.push(filters.dateRange.start, filters.dateRange.end);
      }

      // Use discount reason as proxy for payment method/transaction type
      const query = `
        SELECT 
          COALESCE([Discount Reason], 'Standard') as payment_method,
          COUNT(*) as transaction_count,
          SUM([Sales Amount]) as total_amount,
          AVG([Sales Amount]) as avg_amount,
          ROUND(COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM dbo_F_Sales_Transaction 
            ${whereClause} AND [Sales Amount] IS NOT NULL
          ), 2) as percentage
        FROM dbo_F_Sales_Transaction 
        ${whereClause}
        AND [Sales Amount] IS NOT NULL
        GROUP BY COALESCE([Discount Reason], 'Standard')
        ORDER BY transaction_count DESC
      `;

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
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
      
      // Simplified query first to ensure it works
      const query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM([Sales Amount]) as total_amount,
          AVG([Sales Amount]) as avg_amount,
          COUNT(DISTINCT [Customer Key]) as unique_customers,
          COUNT(DISTINCT [Item Key]) as unique_items,
          MIN([Txn Date]) as earliest_date,
          MAX([Txn Date]) as latest_date,
          (SELECT CAST([Posting Time] AS INTEGER) FROM dbo_F_Sales_Transaction WHERE [Posting Time] IS NOT NULL GROUP BY CAST([Posting Time] AS INTEGER) ORDER BY COUNT(*) DESC LIMIT 1) as peak_hour,
          (SELECT COALESCE([Discount Reason], 'Standard') FROM dbo_F_Sales_Transaction WHERE [Sales Amount] IS NOT NULL GROUP BY COALESCE([Discount Reason], 'Standard') ORDER BY COUNT(*) DESC LIMIT 1) as top_payment_method,
          (SELECT ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM dbo_F_Sales_Transaction WHERE [Sales Amount] IS NOT NULL), 1) FROM dbo_F_Sales_Transaction WHERE [Sales Amount] IS NOT NULL GROUP BY COALESCE([Discount Reason], 'Standard') ORDER BY COUNT(*) DESC LIMIT 1) as top_payment_percentage
        FROM dbo_F_Sales_Transaction 
        WHERE [Sales Amount] IS NOT NULL
      `;

      db.all(query, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          const kpis = rows[0] || {};
          resolve({
            totalTransactions: kpis.total_transactions || 0,
            totalAmount: kpis.total_amount || 0,
            avgAmount: kpis.avg_amount || 0,
            uniqueCustomers: kpis.unique_customers || 0,
            uniqueItems: kpis.unique_items || 0,
            peakHour: kpis.peak_hour || 12,
            topPaymentMethod: kpis.top_payment_method || 'Standard',
            topPaymentPercentage: kpis.top_payment_percentage || 0,
            anomalyRate: 5.2, // Placeholder value
            dateRange: {
              start: kpis.earliest_date,
              end: kpis.latest_date
            }
          });
        }
      });
    });
  }

  async getDailyVolumeDistribution(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let whereClause = "WHERE 1=1";
      let params = [];
      
      if (filters.dateRange) {
        whereClause += " AND [Txn Date] BETWEEN ? AND ?";
        params.push(filters.dateRange.start, filters.dateRange.end);
      }

      const query = `
        SELECT 
          strftime('%w', [Txn Date]) as day_of_week,
          CASE strftime('%w', [Txn Date])
            WHEN '0' THEN 'Sunday'
            WHEN '1' THEN 'Monday'
            WHEN '2' THEN 'Tuesday'
            WHEN '3' THEN 'Wednesday'
            WHEN '4' THEN 'Thursday'
            WHEN '5' THEN 'Friday'
            WHEN '6' THEN 'Saturday'
          END as day_name,
          COUNT(*) as transaction_count,
          SUM([Sales Amount]) as total_amount,
          AVG([Sales Amount]) as avg_amount
        FROM dbo_F_Sales_Transaction 
        ${whereClause}
        AND [Sales Amount] IS NOT NULL 
        AND [Txn Date] IS NOT NULL
        GROUP BY strftime('%w', [Txn Date])
        ORDER BY day_of_week
      `;

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = { TransactionPatternsQueries }; 