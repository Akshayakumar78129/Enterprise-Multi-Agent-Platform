const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class EngagementClassifierQueries {
  constructor() {
    this.dbPath = path.resolve(
      process.cwd(),
      "Customer/database/customers.db"
    );
  }

  async getEngagementData(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      // Build date filter if provided
      let dateFilter = "";
      if (filters.startDate && filters.endDate) {
        dateFilter = `AND cl."Last Activity Date" BETWEEN '${filters.startDate}' AND '${filters.endDate}'`;
      }

      // Build engagement level filter if provided
      let engagementFilter = "";
      if (filters.engagementLevels && filters.engagementLevels.length > 0) {
        const levels = filters.engagementLevels.map(l => `'${l}'`).join(',');
        engagementFilter = `AND (CASE 
          WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
          WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
          ELSE 'Low'
        END) IN (${levels})`;
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
            dbo_D_Customer c
          LEFT JOIN 
            dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
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
        ORDER BY engagement_sort, "Days Since Last Activity";
      `;

      db.all(query, (err, rows) => {
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
      
      let dateFilter = "";
      if (filters.startDate && filters.endDate) {
        dateFilter = `AND cl."Last Activity Date" BETWEEN '${filters.startDate}' AND '${filters.endDate}'`;
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
            COUNT(CASE WHEN cl."Loyalty Status" IN ('Active', 'Loyal') AND cl."Days Since Last Activity" > 90 THEN 1 END) as reengagement_opportunities
          FROM 
            dbo_D_Customer c
          LEFT JOIN 
            dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" IS NOT NULL
            ${dateFilter}
        )
        SELECT * FROM EngagementKPIs;
      `;

      db.get(query, (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          // Calculate engagement trend (simplified as positive/negative based on score)
          const engagementTrend = row.avg_engagement_score > 7 ? 'Improving' : 
                                 row.avg_engagement_score > 5 ? 'Stable' : 'Declining';
          
          resolve({
            total_customers: row.total_customers || 0,
            avg_engagement_score: Math.round(row.avg_engagement_score || 0),
            avg_days_since_activity: Math.round(row.avg_days_since_activity || 0),
            engagement_trend: engagementTrend,
            reengagement_opportunities: row.reengagement_opportunities || 0,
            engagement_distribution: {
              high: row.high_engagement_count || 0,
              medium: row.medium_engagement_count || 0,
              low: row.low_engagement_count || 0
            },
            avg_purchase_value: row.avg_purchase_value || 0,
            avg_transaction_frequency: row.avg_transaction_frequency || 0
          });
        }
      });
    });
  }

  async getEngagementDistribution(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let dateFilter = "";
      if (filters.startDate && filters.endDate) {
        dateFilter = `AND cl."Last Activity Date" BETWEEN '${filters.startDate}' AND '${filters.endDate}'`;
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
            COUNT(CASE WHEN cl."Loyalty Status" = 'Loyal' THEN 1 END) as loyal_customers,
            SUM(COALESCE(cl."LTD Sales Amount", 0)) as total_ltd_sales
          FROM 
            dbo_D_Customer c
          LEFT JOIN 
            dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" IS NOT NULL
            ${dateFilter}
          GROUP BY 
            CASE 
              WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
              WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
              ELSE 'Low'
            END
        )
        SELECT 
          engagement_level,
          customer_count,
          avg_transactions,
          avg_purchase_value,
          avg_days_since_activity,
          avg_rfm_score,
          loyal_customers,
          total_ltd_sales,
          ROUND((customer_count * 100.0 / (SELECT SUM(customer_count) FROM EngagementDistribution)), 2) as percentage
        FROM EngagementDistribution
        ORDER BY 
          CASE engagement_level
            WHEN 'High' THEN 1
            WHEN 'Medium' THEN 2
            WHEN 'Low' THEN 3
          END;
      `;

      db.all(query, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getRFMAnalysis(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      let dateFilter = "";
      if (filters.startDate && filters.endDate) {
        dateFilter = `AND cl."Last Activity Date" BETWEEN '${filters.startDate}' AND '${filters.endDate}'`;
      }

      const query = `
        WITH RFMAnalysis AS (
          SELECT 
            CASE 
              WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
              WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
              ELSE 'Low'
            END as engagement_level,
            cl."Recency Band",
            cl."Frequency Band",
            cl."Monetary Band",
            COUNT(*) as customer_count,
            AVG(cl."RFM Score") as avg_rfm_score
          FROM 
            dbo_D_Customer c
          LEFT JOIN 
            dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" IS NOT NULL
            AND cl."Recency Band" IS NOT NULL
            AND cl."Frequency Band" IS NOT NULL 
            AND cl."Monetary Band" IS NOT NULL
            ${dateFilter}
          GROUP BY 
            engagement_level, cl."Recency Band", cl."Frequency Band", cl."Monetary Band"
        )
        SELECT * FROM RFMAnalysis
        ORDER BY engagement_level, avg_rfm_score DESC;
      `;

      db.all(query, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getReengagementOpportunities(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
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
              WHEN cl."Loyalty Status" = 'Loyal' AND cl."Days Since Last Activity" > 60 THEN 'Loyal Customer Recovery'
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
            dbo_D_Customer c
          LEFT JOIN 
            dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" > 30
            AND cl."Days Since Last Activity" <= 365
            AND cl."LTD Sales Amount" > 0
        )
        SELECT 
          opportunity_type,
          value_tier,
          reengagement_potential,
          COUNT(*) as customer_count,
          AVG("LTD Sales Amount") as avg_customer_value,
          AVG("Days Since Last Activity") as avg_days_inactive
        FROM ReengagementOpportunities
        GROUP BY opportunity_type, value_tier, reengagement_potential
        ORDER BY customer_count DESC;
      `;

      db.all(query, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getEngagementTimeline(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      // For timeline, we'll simulate temporal data by grouping by activity date ranges
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
            COUNT(*) as customer_count
          FROM 
            dbo_D_Customer c
          LEFT JOIN 
            dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" IS NOT NULL
          GROUP BY 
            time_period, engagement_level
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

      db.all(query, (err, rows) => {
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

module.exports = { EngagementClassifierQueries }; 