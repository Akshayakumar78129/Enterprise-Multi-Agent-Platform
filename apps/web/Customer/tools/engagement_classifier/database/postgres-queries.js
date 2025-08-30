const { Pool } = require('pg');

class EngagementClassifierPostgresQueries {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.POSTGRES_DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async getEngagementData(filters = {}) {
    try {
      // Build date filter if provided
      let dateFilter = "";
      const params = [];
      let paramCount = 0;

      if (filters.startDate && filters.endDate) {
        params.push(filters.startDate, filters.endDate);
        dateFilter = `AND cl."Last Activity Date" BETWEEN $${++paramCount} AND $${++paramCount}`;
      }

      // Build engagement level filter if provided
      let engagementFilter = "";
      if (filters.engagementLevels && filters.engagementLevels.length > 0) {
        const levels = filters.engagementLevels.map((_, i) => `$${++paramCount + params.length}`);
        params.push(...filters.engagementLevels);
        engagementFilter = `AND (CASE 
          WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
          WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
          ELSE 'Low'
        END) IN (${levels.join(',')})`;
      }

      const query = `
        WITH CustomerEngagementData AS (
          SELECT 
            c."Customer Key",
            c."Customer Number",
            c."Customer Name",
            cl."Loyalty Status",
            cl."RFM Score",
            cl."Recency Band",
            cl."Frequency Band", 
            cl."Monetary Band",
            cl."Days Since Last Activity",
            cl."Number Sales Txns",
            cl."Avg Sales Amount",
            cl."LTD Sales Amount",
            cl."Last Activity Date",
            cl."First Activity Date",
            CASE 
              WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
              WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
              ELSE 'Low'
            END as engagement_level,
            CASE 
              WHEN cl."Days Since Last Activity" <= 30 THEN 1
              WHEN cl."Days Since Last Activity" <= 90 THEN 2
              ELSE 3
            END as engagement_sort
          FROM 
            dbo_d_customer c
          LEFT JOIN 
            dbo_f_customer_loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" IS NOT NULL
            ${dateFilter}
            ${engagementFilter}
        )
        SELECT 
          "Customer Key",
          "Customer Number", 
          "Customer Name",
          "Loyalty Status",
          "RFM Score",
          "Recency Band",
          "Frequency Band",
          "Monetary Band", 
          "Days Since Last Activity",
          "Number Sales Txns",
          "Avg Sales Amount",
          "LTD Sales Amount",
          "Last Activity Date",
          "First Activity Date",
          engagement_level,
          engagement_sort
        FROM CustomerEngagementData
        ORDER BY engagement_sort, "Days Since Last Activity"
        LIMIT 5000;
      `;

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error in getEngagementData:', error);
      throw error;
    }
  }

  async getKPIData(filters = {}) {
    try {
      let dateFilter = "";
      const params = [];
      let paramCount = 0;

      if (filters.startDate && filters.endDate) {
        params.push(filters.startDate, filters.endDate);
        dateFilter = `AND cl."Last Activity Date" BETWEEN $${++paramCount} AND $${++paramCount}`;
      }

      const query = `
        WITH EngagementKPIs AS (
          SELECT 
            COUNT(*) as total_customers,
            AVG(cl."RFM Score") as avg_engagement_score,
            AVG(cl."Days Since Last Activity") as avg_days_since_activity,
            COUNT(CASE WHEN cl."Days Since Last Activity" <= 30 THEN 1 END) as high_engagement_count,
            COUNT(CASE WHEN cl."Days Since Last Activity" > 30 AND cl."Days Since Last Activity" <= 90 THEN 1 END) as medium_engagement_count,
            COUNT(CASE WHEN cl."Days Since Last Activity" > 90 THEN 1 END) as low_engagement_count,
            AVG(cl."Avg Sales Amount") as avg_purchase_value,
            AVG(cl."Number Sales Txns") as avg_transaction_frequency,
            COUNT(CASE WHEN cl."Loyalty Status" IN ('Active', 'Loyal', 'Active, Loyal') AND cl."Days Since Last Activity" > 90 THEN 1 END) as reengagement_opportunities
          FROM 
            dbo_d_customer c
          LEFT JOIN 
            dbo_f_customer_loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" IS NOT NULL
            ${dateFilter}
        )
        SELECT * FROM EngagementKPIs;
      `;

      const result = await this.pool.query(query, params);
      const row = result.rows[0];
      
      // Calculate engagement trend
      const engagementTrend = parseFloat(row.avg_engagement_score) > 7 ? 'Improving' : 
                             parseFloat(row.avg_engagement_score) > 5 ? 'Stable' : 'Declining';
      
      return {
        total_customers: parseInt(row.total_customers) || 0,
        avg_engagement_score: Math.round(parseFloat(row.avg_engagement_score) || 0),
        avg_days_since_activity: Math.round(parseFloat(row.avg_days_since_activity) || 0),
        engagement_trend: engagementTrend,
        reengagement_opportunities: parseInt(row.reengagement_opportunities) || 0,
        engagement_distribution: {
          high: parseInt(row.high_engagement_count) || 0,
          medium: parseInt(row.medium_engagement_count) || 0,
          low: parseInt(row.low_engagement_count) || 0
        },
        avg_purchase_value: parseFloat(row.avg_purchase_value) || 0,
        avg_transaction_frequency: parseFloat(row.avg_transaction_frequency) || 0
      };
    } catch (error) {
      console.error('Error in getKPIData:', error);
      throw error;
    }
  }

  async getEngagementDistribution(filters = {}) {
    try {
      let dateFilter = "";
      const params = [];
      let paramCount = 0;

      if (filters.startDate && filters.endDate) {
        params.push(filters.startDate, filters.endDate);
        dateFilter = `AND cl."Last Activity Date" BETWEEN $${++paramCount} AND $${++paramCount}`;
      }

      const query = `
        WITH EngagementDistribution AS (
          SELECT 
            CASE 
              WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
              WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
              ELSE 'Low'
            END as engagement_level,
            COUNT(*) as customer_count,
            AVG(cl."Number Sales Txns") as avg_transactions,
            AVG(cl."Avg Sales Amount") as avg_purchase_value,
            AVG(cl."Days Since Last Activity") as avg_days_since_activity,
            AVG(cl."RFM Score") as avg_rfm_score,
            COUNT(CASE WHEN cl."Loyalty Status" LIKE '%Loyal%' THEN 1 END) as loyal_customers,
            SUM(COALESCE(cl."LTD Sales Amount", 0)) as total_ltd_sales
          FROM 
            dbo_d_customer c
          LEFT JOIN 
            dbo_f_customer_loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" IS NOT NULL
            ${dateFilter}
          GROUP BY 
            CASE 
              WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
              WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
              ELSE 'Low'
            END
        ),
        TotalCount AS (
          SELECT SUM(customer_count) as total FROM EngagementDistribution
        )
        SELECT 
          ed.engagement_level,
          ed.customer_count::int,
          ed.avg_transactions,
          ed.avg_purchase_value,
          ed.avg_days_since_activity,
          ed.avg_rfm_score,
          ed.loyal_customers::int,
          ed.total_ltd_sales,
          ROUND((ed.customer_count * 100.0 / NULLIF(tc.total, 0)), 2) as percentage
        FROM EngagementDistribution ed
        CROSS JOIN TotalCount tc
        ORDER BY 
          CASE ed.engagement_level
            WHEN 'High' THEN 1
            WHEN 'Medium' THEN 2
            WHEN 'Low' THEN 3
          END;
      `;

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error in getEngagementDistribution:', error);
      throw error;
    }
  }

  async getRFMAnalysis(filters = {}) {
    try {
      let dateFilter = "";
      const params = [];
      let paramCount = 0;

      if (filters.startDate && filters.endDate) {
        params.push(filters.startDate, filters.endDate);
        dateFilter = `AND cl."Last Activity Date" BETWEEN $${++paramCount} AND $${++paramCount}`;
      }

      const query = `
        WITH RFMAnalysis AS (
          SELECT 
            CASE 
              WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
              WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
              ELSE 'Low'
            END as engagement_level,
            cl."Recency Band" as recency_band,
            cl."Frequency Band" as frequency_band,
            cl."Monetary Band" as monetary_band,
            COUNT(*) as customer_count,
            AVG(cl."RFM Score") as avg_rfm_score
          FROM 
            dbo_d_customer c
          LEFT JOIN 
            dbo_f_customer_loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" IS NOT NULL
            AND cl."Recency Band" IS NOT NULL
            AND cl."Frequency Band" IS NOT NULL 
            AND cl."Monetary Band" IS NOT NULL
            ${dateFilter}
          GROUP BY 
            CASE 
              WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
              WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
              ELSE 'Low'
            END, 
            cl."Recency Band", 
            cl."Frequency Band", 
            cl."Monetary Band"
        )
        SELECT 
          engagement_level,
          recency_band,
          frequency_band,
          monetary_band,
          customer_count::int,
          avg_rfm_score
        FROM RFMAnalysis
        ORDER BY engagement_level, avg_rfm_score DESC
        LIMIT 50;
      `;

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error in getRFMAnalysis:', error);
      throw error;
    }
  }

  async getReengagementOpportunities(filters = {}) {
    try {
      const query = `
        WITH ReengagementOpportunities AS (
          SELECT 
            c."Customer Key",
            c."Customer Name",
            cl."Loyalty Status",
            cl."Days Since Last Activity",
            cl."LTD Sales Amount",
            cl."Avg Sales Amount",
            cl."Number Sales Txns",
            cl."RFM Score",
            CASE 
              WHEN cl."LTD Sales Amount" > 10000 AND cl."Days Since Last Activity" BETWEEN 31 AND 180 THEN 'High Value Winback'
              WHEN cl."LTD Sales Amount" > 5000 AND cl."Days Since Last Activity" BETWEEN 31 AND 120 THEN 'Medium Value Nurture'
              WHEN cl."Number Sales Txns" > 5 AND cl."Days Since Last Activity" BETWEEN 31 AND 90 THEN 'Frequent Buyer Reactivation'
              WHEN cl."Loyalty Status" LIKE '%Loyal%' AND cl."Days Since Last Activity" > 60 THEN 'Loyal Customer Recovery'
              ELSE 'Standard Reengagement'
            END as opportunity_type,
            CASE 
              WHEN cl."LTD Sales Amount" > 10000 THEN 'High'
              WHEN cl."LTD Sales Amount" > 2000 THEN 'Medium'
              ELSE 'Low'
            END as value_tier,
            CASE 
              WHEN cl."Days Since Last Activity" BETWEEN 31 AND 60 THEN 'High'
              WHEN cl."Days Since Last Activity" BETWEEN 61 AND 120 THEN 'Medium'
              ELSE 'Low'
            END as reengagement_potential
          FROM 
            dbo_d_customer c
          LEFT JOIN 
            dbo_f_customer_loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" > 30
            AND cl."Days Since Last Activity" <= 365
            AND cl."LTD Sales Amount" > 0
        )
        SELECT 
          opportunity_type,
          value_tier,
          reengagement_potential,
          COUNT(*)::int as customer_count,
          AVG("LTD Sales Amount") as avg_customer_value,
          AVG("Days Since Last Activity") as avg_days_inactive
        FROM ReengagementOpportunities
        GROUP BY opportunity_type, value_tier, reengagement_potential
        ORDER BY customer_count DESC
        LIMIT 50;
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in getReengagementOpportunities:', error);
      throw error;
    }
  }

  async getEngagementTimeline(filters = {}) {
    try {
      const query = `
        WITH EngagementTimeline AS (
          SELECT 
            CASE 
              WHEN cl."Days Since Last Activity" <= 7 THEN 'This Week'
              WHEN cl."Days Since Last Activity" <= 30 THEN 'This Month'
              WHEN cl."Days Since Last Activity" <= 90 THEN 'Last 3 Months'
              WHEN cl."Days Since Last Activity" <= 180 THEN 'Last 6 Months'
              WHEN cl."Days Since Last Activity" <= 365 THEN 'Last Year'
              ELSE 'Over 1 Year'
            END as time_period,
            CASE 
              WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
              WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
              ELSE 'Low'
            END as engagement_level,
            COUNT(*)::int as customer_count
          FROM 
            dbo_d_customer c
          LEFT JOIN 
            dbo_f_customer_loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" IS NOT NULL
          GROUP BY 
            CASE 
              WHEN cl."Days Since Last Activity" <= 7 THEN 'This Week'
              WHEN cl."Days Since Last Activity" <= 30 THEN 'This Month'
              WHEN cl."Days Since Last Activity" <= 90 THEN 'Last 3 Months'
              WHEN cl."Days Since Last Activity" <= 180 THEN 'Last 6 Months'
              WHEN cl."Days Since Last Activity" <= 365 THEN 'Last Year'
              ELSE 'Over 1 Year'
            END,
            CASE 
              WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
              WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
              ELSE 'Low'
            END
        )
        SELECT 
          time_period,
          engagement_level,
          customer_count,
          CASE time_period
            WHEN 'This Week' THEN 1
            WHEN 'This Month' THEN 2
            WHEN 'Last 3 Months' THEN 3
            WHEN 'Last 6 Months' THEN 4
            WHEN 'Last Year' THEN 5
            ELSE 6
          END as sort_order
        FROM EngagementTimeline
        ORDER BY sort_order, engagement_level;
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in getEngagementTimeline:', error);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = { EngagementClassifierPostgresQueries };