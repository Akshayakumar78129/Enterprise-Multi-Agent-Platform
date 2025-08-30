/**
 * Integrated data service for Purchase Frequency Dashboard
 * Consolidates API functionality directly into the dashboard
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class PurchaseFrequencyDataService {
  constructor() {
    this.dbPath = path.join(process.cwd(), 'Customer/database/customers.db');
  }

  /**
   * Get main customer purchase data
   */
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
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get KPI data
   */
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
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Get frequency distribution data
   */
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
          (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM frequency_bins)) as percentage
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
            WHEN '20+' THEN 7
          END
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

  /**
   * Get customer segments data
   */
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
        dateFilter = "WHERE st.[Txn Date] >= '2020-01-01'";
      }

      const query = `
        WITH customer_metrics AS (
          SELECT 
            st.[Customer Key] as customer_id,
            c.[Customer Name] as customer_name,
            COUNT(*) as frequency,
            SUM(st.[Sales Amount]) as monetary_value,
            AVG(st.[Sales Amount]) as avg_transaction_value,
            MAX(st.[Txn Date]) as last_purchase_date,
            julianday('2021-12-31') - julianday(MAX(st.[Txn Date])) as recency_days
          FROM dbo_F_Sales_Transaction st
          INNER JOIN dbo_D_Customer c ON st.[Customer Key] = c.[Customer Key]
          ${dateFilter}
          AND st.[Sales Amount] > 0
          GROUP BY st.[Customer Key], c.[Customer Name]
        )
        SELECT 
          customer_id,
          customer_name,
          frequency,
          monetary_value,
          avg_transaction_value,
          recency_days,
          CASE 
            WHEN frequency >= 10 AND monetary_value >= 1000 THEN 'Champions'
            WHEN frequency >= 5 AND monetary_value >= 500 THEN 'Loyal Customers'
            WHEN frequency >= 3 AND recency_days <= 90 THEN 'Potential Loyalists'
            WHEN monetary_value >= 1000 THEN 'Big Spenders'
            WHEN recency_days <= 30 THEN 'New Customers'
            WHEN recency_days > 180 THEN 'At Risk'
            ELSE 'Regular'
          END as segment
        FROM customer_metrics
        ORDER BY monetary_value DESC, frequency DESC
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

  /**
   * Get value segments data
   */
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
        dateFilter = "WHERE st.[Txn Date] >= '2020-01-01'";
      }

      const query = `
        WITH customer_values AS (
          SELECT 
            st.[Customer Key],
            SUM(st.[Sales Amount]) as total_spent,
            COUNT(*) as total_purchases
          FROM dbo_F_Sales_Transaction st
          ${dateFilter}
          AND st.[Sales Amount] > 0
          GROUP BY st.[Customer Key]
        ),
        value_segments AS (
          SELECT 
            CASE 
              WHEN total_spent >= 1000 THEN 'Premium'
              WHEN total_spent >= 500 THEN 'Standard'
              WHEN total_spent >= 100 THEN 'Budget'
              ELSE 'Occasional'
            END as segment,
            total_spent,
            total_purchases
          FROM customer_values
        )
        SELECT 
          segment,
          COUNT(*) as customer_count,
          AVG(total_spent) as avg_value,
          SUM(total_spent) as total_segment_value,
          AVG(total_purchases) as avg_purchases,
          (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM value_segments)) as percentage
        FROM value_segments
        GROUP BY segment
        ORDER BY avg_value DESC
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

  /**
   * Get interval heatmap data
   */
  async getIntervalHeatmap(filters = {}) {
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
        dateFilter = "WHERE st.[Txn Date] >= '2020-01-01'";
      }

      const query = `
        SELECT 
          strftime('%w', st.[Txn Date]) as day_of_week,
          strftime('%W', st.[Txn Date]) as week_number,
          date(st.[Txn Date]) as transaction_date,
          COUNT(*) as transaction_count,
          SUM(st.[Sales Amount]) as total_sales,
          AVG(st.[Sales Amount]) as avg_transaction_value
        FROM dbo_F_Sales_Transaction st
        ${dateFilter}
        AND st.[Sales Amount] > 0
        GROUP BY strftime('%w', st.[Txn Date]), strftime('%W', st.[Txn Date]), date(st.[Txn Date])
        ORDER BY transaction_date
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

  /**
   * Get segments and categories for filtering
   */
  async getSegmentsAndCategories() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);

      // Get unique values for each segment type
      const promises = [
        new Promise((res, rej) => {
          db.all(`SELECT DISTINCT "Market Desc" as value FROM dbo_D_Customer WHERE "Market Desc" IS NOT NULL`, (err, rows) => {
            if (err) rej(err);
            else res({ type: 'market', values: rows.map(r => r.value) });
          });
        }),
        new Promise((res, rej) => {
          db.all(`SELECT DISTINCT "Monetary Band" as value FROM dbo_D_Customer WHERE "Monetary Band" IS NOT NULL`, (err, rows) => {
            if (err) rej(err);
            else res({ type: 'monetary', values: rows.map(r => r.value) });
          });
        }),
        new Promise((res, rej) => {
          db.all(`SELECT DISTINCT "Loyalty Status" as value FROM dbo_D_Customer WHERE "Loyalty Status" IS NOT NULL`, (err, rows) => {
            if (err) rej(err);
            else res({ type: 'loyalty', values: rows.map(r => r.value) });
          });
        }),
        new Promise((res, rej) => {
          db.all(`SELECT DISTINCT "Customer Country" as value FROM dbo_D_Customer WHERE "Customer Country" IS NOT NULL`, (err, rows) => {
            if (err) rej(err);
            else res({ type: 'country', values: rows.map(r => r.value) });
          });
        })
      ];

      Promise.all(promises)
        .then(results => {
          db.close();
          
          // Format segments for the filter component
          const segments = {
            market: [],
            monetary: [],
            loyalty: [],
            country: []
          };
          
          results.forEach(({ type, values }) => {
            segments[type] = values.map((value, idx) => ({
              id: `${type}_${idx}`,
              label: value,
              count: null // Can be populated if needed
            }));
          });

          // For purchase frequency, we'll return empty categories
          // but format them properly
          const categories = [];

          resolve({ segments, categories });
        })
        .catch(err => {
          db.close();
          reject(err);
        });
    });
  }

  /**
   * Get complete purchase frequency data with all components
   */
  async getCompleteData(filters = {}) {
    try {
      const [
        mainData,
        kpis,
        frequencyDistribution,
        intervalHeatmap,
        customerSegments,
        valueSegments
      ] = await Promise.all([
        this.getMainData(filters),
        this.getKPIData(filters),
        this.getFrequencyDistribution(filters),
        this.getIntervalHeatmap(filters),
        this.getCustomerSegments(filters),
        this.getValueSegments(filters)
      ]);

      // Process and format the data
      const totalCustomers = mainData.length;
      const activeCustomers = mainData.filter(c => c.recency_status === 'Active').length;
      const avgFrequency = totalCustomers > 0 ? 
        (mainData.reduce((sum, customer) => sum + (customer.total_purchases || 0), 0) / totalCustomers) : 0;

      // Format frequency distribution
      const frequencyData = frequencyDistribution.map(item => ({
        bin: item.frequency_bin,
        count: item.customer_count,
        percentage: parseFloat(item.percentage.toFixed(1))
      }));

      // Format heatmap data
      const heatmapData = intervalHeatmap.map(item => ({
        dayOfWeek: parseInt(item.day_of_week),
        weekNumber: parseInt(item.week_number),
        date: item.transaction_date,
        transactionCount: item.transaction_count,
        totalSales: item.total_sales,
        avgTransactionValue: item.avg_transaction_value
      }));

      // Format customer segments
      const segmentData = customerSegments.map(customer => ({
        customerId: customer.customer_id,
        customerName: customer.customer_name,
        frequency: customer.frequency,
        monetaryValue: customer.monetary_value,
        recencyDays: customer.recency_days,
        segment: customer.segment,
        avgTransactionValue: customer.avg_transaction_value
      }));

      // Format value segments
      const valueSegmentData = valueSegments.map(segment => ({
        segment: segment.segment,
        customerCount: segment.customer_count,
        avgValue: parseFloat((segment.avg_value || 0).toFixed(2)),
        totalValue: parseFloat((segment.total_segment_value || 0).toFixed(2)),
        avgPurchases: parseFloat((segment.avg_purchases || 0).toFixed(1)),
        percentage: parseFloat(segment.percentage.toFixed(1))
      }));

      return {
        success: true,
        data: {
          kpis: {
            totalCustomers: totalCustomers,
            avgPurchaseFrequency: parseFloat((avgFrequency || 0).toFixed(2)),
            avgDaysBetween: parseFloat((kpis.avg_days_between_purchases || 0).toFixed(1)),
            activeCustomerPercentage: parseFloat(((activeCustomers * 100.0) / totalCustomers).toFixed(1)),
            highValuePercentage: parseFloat((kpis.high_value_percentage || 0).toFixed(1)),
            avgCustomerValue: parseFloat((kpis.avg_customer_value || 0).toFixed(2))
          },
          frequencyDistribution: frequencyData,
          intervalHeatmap: heatmapData,
          customerSegments: segmentData,
          valueSegments: valueSegmentData,
          metadata: {
            totalCustomers: totalCustomers,
            activeCustomers: activeCustomers,
            avgFrequency: parseFloat((avgFrequency || 0).toFixed(2)),
            dataUpdated: new Date().toISOString(),
            filters: filters
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PurchaseFrequencyDataService;
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.PurchaseFrequencyDataService = PurchaseFrequencyDataService;
}