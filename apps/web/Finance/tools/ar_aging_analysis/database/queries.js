const Database = require('better-sqlite3');
const path = require('path');

class ARAgingQueries {
  constructor() {
    // Database path - handles both local and production paths
    let dbPath;
    if (process.cwd().includes('apps/web') || process.cwd().includes('apps\\web')) {
      // Running from apps/web directory
      dbPath = path.join(process.cwd(), 'Finance', 'database', 'financial_agent.db');
    } else {
      // Running from root directory (like Next.js server)
      dbPath = path.join(process.cwd(), 'apps', 'web', 'Finance', 'database', 'financial_agent.db');
    }
    try {
      this.db = new Database(dbPath);
      console.log('Connected to financial database at:', dbPath);
    } catch (error) {
      console.error('Failed to connect to financial database:', error);
      throw error;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }

  // Get KPI data for dashboard
  getKPIData(filters = {}) {
    try {
      const query = `
        SELECT 
          SUM([Net Sales Amount]) as total_ar,
          AVG(
            CASE 
              WHEN [Net Sales Amount] > 0 THEN 
                CASE 
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 180 THEN 45
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 90 THEN 35
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 30 THEN 25
                  ELSE 15
                END
              ELSE 0 
            END
          ) as days_sales_outstanding,
          SUM(
            CASE 
              WHEN julianday('2021-12-31') - julianday([Posting Date]) > 30 AND [Net Sales Amount] > 0 
              THEN [Net Sales Amount] 
              ELSE 0 
            END
          ) as overdue_amount,
          (
            SUM(
              CASE 
                WHEN julianday('2021-12-31') - julianday([Posting Date]) > 30 AND [Net Sales Amount] > 0 
                THEN [Net Sales Amount] 
                ELSE 0 
              END
            ) * 100.0 / NULLIF(SUM([Net Sales Amount]), 0)
          ) as overdue_percentage,
          (
            COUNT(CASE WHEN [Net Sales Amount] > 0 THEN 1 END) * 100.0 / COUNT(*)
          ) as collection_efficiency,
          SUM(
            CASE 
              WHEN julianday('2021-12-31') - julianday([Posting Date]) > 90 AND [Net Sales Amount] > 0 
              THEN [Net Sales Amount] 
              ELSE 0 
            END
          ) as high_risk_amount
        FROM """dbo_F_Sales_Transaction"""
        WHERE [Posting Date] BETWEEN ? AND ?
      `;

      const result = this.db.prepare(query).get(
        filters.startDate || '2017-01-01',
        filters.endDate || '2021-12-31'
      );

      return result;
    } catch (error) {
      console.error('Error in getKPIData:', error);
      return null;
    }
  }

  // Get aging breakdown by time periods
  getAgingBreakdown(filters = {}) {
    try {
      const query = `
        SELECT 
          CASE 
            WHEN [Net Sales Amount] = 0 THEN 'Current'
            WHEN [Net Sales Amount] > 0 AND (julianday('2021-12-31') - julianday([Posting Date])) <= 30 THEN 'Current'
            WHEN [Net Sales Amount] > 0 AND (julianday('2021-12-31') - julianday([Posting Date])) BETWEEN 31 AND 60 THEN '1-30 Days'  
            WHEN [Net Sales Amount] > 0 AND (julianday('2021-12-31') - julianday([Posting Date])) BETWEEN 61 AND 90 THEN '31-60 Days'
            WHEN [Net Sales Amount] > 0 AND (julianday('2021-12-31') - julianday([Posting Date])) BETWEEN 91 AND 120 THEN '61-90 Days'
            ELSE '90+ Days'
          END as aging_bucket,
          COUNT(*) as invoice_count,
          SUM(ABS([Net Sales Amount])) as total_amount,
          AVG(ABS([Net Sales Amount])) as avg_amount
        FROM """dbo_F_Sales_Transaction"""
        WHERE [Posting Date] BETWEEN ? AND ?
          AND [Net Sales Amount] != 0
        GROUP BY aging_bucket
        ORDER BY 
          CASE aging_bucket
            WHEN 'Current' THEN 1
            WHEN '1-30 Days' THEN 2
            WHEN '31-60 Days' THEN 3
            WHEN '61-90 Days' THEN 4
            WHEN '90+ Days' THEN 5
          END
      `;

      const results = this.db.prepare(query).all(
        filters.startDate || '2017-01-01',
        filters.endDate || '2021-12-31'
      );

      return results;
    } catch (error) {
      console.error('Error in getAgingBreakdown:', error);
      return [];
    }
  }

  // Get risk metrics analysis
  getRiskMetrics(filters = {}) {
    try {
      const query = `
        SELECT 
          [Customer Key],
          COUNT(*) as invoice_count,
          SUM([Net Sales Amount]) as total_outstanding,
          AVG(
            CASE 
              WHEN [Net Sales Amount] > 0 THEN 
                CASE
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 180 THEN 45
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 90 THEN 35
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 30 THEN 25
                  ELSE 15
                END
              ELSE 0 
            END
          ) as avg_days_overdue,
          MAX(
            CASE 
              WHEN [Net Sales Amount] > 0 THEN 
                CASE
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 180 THEN 60
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 90 THEN 45
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 30 THEN 30
                  ELSE 20
                END
              ELSE 0 
            END
          ) as max_days_overdue,
          CASE 
            WHEN AVG(CASE WHEN [Net Sales Amount] > 0 THEN julianday('2021-12-31') - julianday([Posting Date]) ELSE 0 END) > 90 THEN 'High'
            WHEN AVG(CASE WHEN [Net Sales Amount] > 0 THEN julianday('2021-12-31') - julianday([Posting Date]) ELSE 0 END) > 30 THEN 'Medium'
            ELSE 'Low'
          END as risk_level
        FROM """dbo_F_Sales_Transaction"""
        WHERE [Posting Date] BETWEEN ? AND ?
          AND [Net Sales Amount] > 0
        GROUP BY [Customer Key]
        HAVING total_outstanding > 1000
        ORDER BY total_outstanding DESC
        LIMIT 100
      `;

      const results = this.db.prepare(query).all(
        filters.startDate || '2017-01-01',
        filters.endDate || '2021-12-31'
      );

      return results;
    } catch (error) {
      console.error('Error in getRiskMetrics:', error);
      return [];
    }
  }

  // Get trend analysis over time
  getTrendAnalysis(filters = {}) {
    try {
      const query = `
        SELECT 
          strftime('%Y-%m', [Posting Date]) as month,
          COUNT(*) as invoice_count,
          SUM([Net Sales Amount]) as total_ar,
          AVG(
            CASE 
              WHEN [Net Sales Amount] > 0 THEN 
                CASE
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 180 THEN 45
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 90 THEN 35
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 30 THEN 25
                  ELSE 15
                END
              ELSE 0 
            END
          ) as avg_days_outstanding,
          SUM(
            CASE 
              WHEN julianday('2021-12-31') - julianday([Posting Date]) > 30 AND [Net Sales Amount] > 0 
              THEN [Net Sales Amount] 
              ELSE 0 
            END
          ) as overdue_amount
        FROM """dbo_F_Sales_Transaction"""
        WHERE [Posting Date] BETWEEN ? AND ?
        GROUP BY month
        ORDER BY month
      `;

      const results = this.db.prepare(query).all(
        filters.startDate || '2017-01-01',
        filters.endDate || '2021-12-31'
      );

      return results;
    } catch (error) {
      console.error('Error in getTrendAnalysis:', error);
      return [];
    }
  }

  // Get customer insights
  getCustomerInsights(filters = {}) {
    try {
      const query = `
        SELECT 
          [Customer Key],
          COUNT(*) as total_invoices,
          SUM([Net Sales Amount]) as total_outstanding,
          COUNT(CASE WHEN [Net Sales Amount] = 0 THEN 1 END) as paid_invoices,
          (COUNT(CASE WHEN [Net Sales Amount] = 0 THEN 1 END) * 100.0 / COUNT(*)) as payment_rate,
          AVG(
            CASE 
              WHEN [Net Sales Amount] > 0 THEN 
                CASE
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 180 THEN 45
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 90 THEN 35
                  WHEN julianday('2021-12-31') - julianday([Posting Date]) > 30 THEN 25
                  ELSE 15
                END
              ELSE 0 
            END
          ) as avg_days_overdue
        FROM """dbo_F_Sales_Transaction"""
        WHERE [Posting Date] BETWEEN ? AND ?
        GROUP BY [Customer Key]
        HAVING total_invoices >= 5
        ORDER BY total_outstanding DESC
        LIMIT 50
      `;

      const results = this.db.prepare(query).all(
        filters.startDate || '2017-01-01',
        filters.endDate || '2021-12-31'
      );

      return results;
    } catch (error) {
      console.error('Error in getCustomerInsights:', error);
      return [];
    }
  }

  // Get collection performance metrics
  getCollectionPerformance(filters = {}) {
    try {
      const query = `
        SELECT 
          strftime('%Y-%m', [Posting Date]) as month,
          COUNT(*) as total_invoices,
          COUNT(CASE WHEN [Net Sales Amount] = 0 THEN 1 END) as collected_invoices,
          (COUNT(CASE WHEN [Net Sales Amount] = 0 THEN 1 END) * 100.0 / COUNT(*)) as collection_rate,
          AVG(
            CASE 
              WHEN [Net Sales Amount] = 0 THEN 
                julianday([Posting Date]) - julianday([Txn Date])
              ELSE NULL 
            END
          ) as avg_collection_days
        FROM """dbo_F_Sales_Transaction"""
        WHERE [Posting Date] BETWEEN ? AND ?
        GROUP BY month
        ORDER BY month
      `;

      const results = this.db.prepare(query).all(
        filters.startDate || '2017-01-01',
        filters.endDate || '2021-12-31'
      );

      return results;
    } catch (error) {
      console.error('Error in getCollectionPerformance:', error);
      return [];
    }
  }

  // Get available regions for filters
  getRegions() {
    try {
      // Since we don't have region data in the current schema, return default regions
      return [
        { id: 'north', name: 'North' },
        { id: 'south', name: 'South' },
        { id: 'east', name: 'East' },
        { id: 'west', name: 'West' }
      ];
    } catch (error) {
      console.error('Error in getRegions:', error);
      return [];
    }
  }

  // Get available customer types for filters
  getCustomerTypes() {
    try {
      // Return default customer types based on common business categories
      return [
        { id: 'enterprise', name: 'Enterprise' },
        { id: 'smb', name: 'Small-Medium Business' },
        { id: 'retail', name: 'Retail' },
        { id: 'government', name: 'Government' }
      ];
    } catch (error) {
      console.error('Error in getCustomerTypes:', error);
      return [];
    }
  }

  // Get available segments for filters
  getSegments() {
    try {
      // Return default segments
      return [
        { id: 'high_value', name: 'High Value' },
        { id: 'medium_value', name: 'Medium Value' },
        { id: 'low_value', name: 'Low Value' },
        { id: 'new_customer', name: 'New Customer' }
      ];
    } catch (error) {
      console.error('Error in getSegments:', error);
      return [];
    }
  }
}

module.exports = { ARAgingQueries };