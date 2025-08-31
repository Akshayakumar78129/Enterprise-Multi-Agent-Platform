/**
 * Integrated data service for Transaction Patterns Dashboard
 * Consolidates API functionality directly into the dashboard
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class TransactionPatternsDataService {
  constructor() {
    this.dbPath = path.join(process.cwd(), 'Customer/database/customers.db');
  }

  /**
   * Get available date range from database
   */
  async getDateRange() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      const query = `
        SELECT 
          MIN(date(t."Txn Date")) as minDate,
          MAX(date(t."Txn Date")) as maxDate,
          COUNT(*) as totalRecords,
          COUNT(DISTINCT t."Customer Key") as uniqueCustomers
        FROM dbo_F_Sales_Transaction t
        WHERE t."Txn Date" IS NOT NULL 
          AND t."Txn Date" != ''
          AND date(t."Txn Date") IS NOT NULL
      `;

      db.get(query, [], (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve({
            minDate: row.minDate || '2017-01-01',
            maxDate: row.maxDate || new Date().toISOString().split('T')[0],
            totalRecords: row.totalRecords || 0,
            uniqueCustomers: row.uniqueCustomers || 0
          });
        }
      });
    });
  }

  /**
   * Get available customer segments and product categories
   */
  async getSegmentsAndCategories() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);

      // Get unique values for each segment type
      const segmentPromises = [
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

      // Check if product table exists
      const checkTableQuery = `
        SELECT name FROM sqlite_master WHERE type='table' AND name = 'dbo_D_Product'
      `;

      db.get(checkTableQuery, [], (err, tableRow) => {
        if (err) {
          db.close();
          return reject(err);
        }

        const productTableExists = !!tableRow;

        Promise.all(segmentPromises)
          .then(segmentResults => {
            // Format segments for the filter component
            const segments = {
              market: [],
              monetary: [],
              loyalty: [],
              country: []
            };
            
            segmentResults.forEach(({ type, values }) => {
              segments[type] = values.map((value, idx) => ({
                id: `${type}_${idx}`,
                label: value,
                count: null
              }));
            });

            if (productTableExists) {
              const categoryQuery = `
                SELECT DISTINCT "Item Category" as category
                FROM dbo_D_Product
                WHERE "Item Category" IS NOT NULL
              `;

              db.all(categoryQuery, [], (err, categoryRows) => {
                db.close();
                if (err) {
                  reject(err);
                } else {
                  // Format categories properly
                  const categories = categoryRows.map((row, idx) => ({
                    id: `cat_${idx}`,
                    label: row.category,
                    count: null
                  }));
                  resolve({ segments, categories });
                }
              });
            } else {
              db.close();
              // Fallback categories - properly formatted
              const fallbackCategories = [
                'Road Bikes',
                'Mountain Bikes', 
                'Touring Bikes',
                'Accessories',
                'Components',
                'Apparel'
              ].map((cat, idx) => ({
                id: `cat_${idx}`,
                label: cat,
                count: null
              }));
              resolve({ segments, categories: fallbackCategories });
            }
          })
          .catch(err => {
            db.close();
            reject(err);
          });
      });
    });
  }

  /**
   * Get transaction patterns data with filters
   */
  async getTransactionData(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);

      try {
        // Build base query
        let query = `
          SELECT 
            st."Customer Key" as customer_key,
            st."Txn Date" as transaction_date,
            st."Sales Amount" as sales_amount,
            st."Net Sales Amount" as net_sales_amount,
            c."Market Desc" as market,
            c."Monetary Band" as monetary_band,
            c."Loyalty Status" as loyalty_status,
            c."Customer Country" as country
          FROM dbo_F_Sales_Transaction st
          INNER JOIN dbo_D_Customer c ON st."Customer Key" = c."Customer Key"
          WHERE st."Sales Amount" > 0
        `;

        const params = [];

        // Add date filters
        if (filters.dateRange) {
          if (filters.dateRange.start) {
            query += ` AND st."Txn Date" >= ?`;
            params.push(filters.dateRange.start);
          }
          if (filters.dateRange.end) {
            query += ` AND st."Txn Date" <= ?`;
            params.push(filters.dateRange.end);
          }
        }

        // Add customer segment filters
        if (filters.customerSegments && filters.customerSegments.length > 0) {
          const segmentConditions = [];
          for (const segment of filters.customerSegments) {
            const category = String(segment.category || '').toLowerCase();
            const label = segment.label;
            if (!label) continue;

            if (category === 'market') {
              segmentConditions.push(`c."Market Desc" = ?`);
              params.push(label);
            } else if (category === 'monetary') {
              segmentConditions.push(`c."Monetary Band" = ?`);
              params.push(label);
            } else if (category === 'loyalty') {
              segmentConditions.push(`c."Loyalty Status" = ?`);
              params.push(label);
            } else if (category === 'country') {
              segmentConditions.push(`c."Customer Country" = ?`);
              params.push(label);
            }
          }
          if (segmentConditions.length > 0) {
            query += ` AND (${segmentConditions.join(' OR ')})`;
          }
        }

        query += ` ORDER BY st."Txn Date", st."Customer Key"`;

        db.all(query, params, (err, rows) => {
          db.close();
          if (err) {
            reject(err);
          } else {
            // Process the raw data into the required format
            const processedData = this.processTransactionData(rows);
            resolve(processedData);
          }
        });
      } catch (error) {
        db.close();
        reject(error);
      }
    });
  }

  /**
   * Process raw transaction data into dashboard format
   */
  processTransactionData(transactions) {
    if (!transactions || transactions.length === 0) {
      return {
        kpis: {
          totalTransactions: 0,
          avgTransactionValue: 0,
          uniqueCustomers: 0,
          yoyGrowth: 0,
          momGrowth: 0
        },
        timeSeriesData: [],
        heatmapData: [],
        histogramData: [],
        scatterData: []
      };
    }

    // Calculate KPIs
    const totalTransactions = transactions.length;
    const totalValue = transactions.reduce((sum, t) => sum + (parseFloat(t.sales_amount) || 0), 0);
    const avgTransactionValue = totalValue / totalTransactions;
    const uniqueCustomers = new Set(transactions.map(t => t.customer_key)).size;

    // Process time series data (daily aggregation)
    const dailyData = {};
    transactions.forEach(t => {
      const date = t.transaction_date.split(' ')[0]; // Get date part
      if (!dailyData[date]) {
        dailyData[date] = { transaction_count: 0, total_amount: 0 };
      }
      dailyData[date].transaction_count++;
      dailyData[date].total_amount += parseFloat(t.sales_amount) || 0;
    });

    const timeSeriesData = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        transaction_count: data.transaction_count,
        avg_amount: data.total_amount / data.transaction_count
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Process heatmap data (day of week vs hour)
    const heatmapData = this.processHeatmapData(transactions);

    // Process histogram data (transaction amount distribution)
    const histogramData = this.processHistogramData(transactions);

    // Process scatter plot data (customer vs transaction patterns)
    const scatterData = this.processScatterData(transactions);

    return {
      kpis: {
        totalTransactions,
        avgTransactionValue,
        uniqueCustomers,
        yoyGrowth: 0, // Would need historical data to calculate
        momGrowth: 0  // Would need historical data to calculate
      },
      timeSeriesData,
      heatmapData,
      histogramData,
      scatterData
    };
  }

  processHeatmapData(transactions) {
    const heatmapMap = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const dayOfWeek = dayNames[date.getDay()];
      const hour = date.getHours();
      const key = `${dayOfWeek}-${hour}`;

      if (!heatmapMap[key]) {
        heatmapMap[key] = { count: 0, totalValue: 0 };
      }
      heatmapMap[key].count++;
      heatmapMap[key].totalValue += parseFloat(t.sales_amount) || 0;
    });

    return Object.entries(heatmapMap).map(([key, data]) => {
      const [day, hour] = key.split('-');
      return {
        day,
        hour: parseInt(hour),
        transactionCount: data.count,
        avgValue: data.totalValue / data.count
      };
    });
  }

  processHistogramData(transactions) {
    const amounts = transactions.map(t => parseFloat(t.sales_amount) || 0);
    const bins = [
      { min: 0, max: 50, label: '$0-50' },
      { min: 50, max: 100, label: '$50-100' },
      { min: 100, max: 200, label: '$100-200' },
      { min: 200, max: 500, label: '$200-500' },
      { min: 500, max: 1000, label: '$500-1000' },
      { min: 1000, max: Infinity, label: '$1000+' }
    ];

    return bins.map(bin => {
      const count = amounts.filter(amount => amount >= bin.min && amount < bin.max).length;
      return {
        range: bin.label,
        count,
        percentage: ((count / amounts.length) * 100).toFixed(1)
      };
    });
  }

  processScatterData(transactions) {
    const customerData = {};
    
    transactions.forEach(t => {
      const customerId = t.customer_key;
      if (!customerData[customerId]) {
        customerData[customerId] = {
          totalValue: 0,
          transactionCount: 0,
          market: t.market,
          monetaryBand: t.monetary_band
        };
      }
      customerData[customerId].totalValue += parseFloat(t.sales_amount) || 0;
      customerData[customerId].transactionCount++;
    });

    return Object.entries(customerData).map(([customerId, data]) => ({
      customer_id: customerId,
      total_value: data.totalValue,
      transaction_count: data.transactionCount,
      avg_value: data.totalValue / data.transactionCount,
      market: data.market,
      monetary_band: data.monetaryBand
    }));
  }
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TransactionPatternsDataService;
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.TransactionPatternsDataService = TransactionPatternsDataService;
}