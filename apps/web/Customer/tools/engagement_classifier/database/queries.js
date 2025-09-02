const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

class EngagementClassifierQueries {
  constructor() {
    // Resolve DB path robustly: env override -> shared Customer/database -> local copy -> legacy cwd
    const candidates = [];

    const envPath = process.env.ENGAGEMENT_DB_PATH || process.env.DATABASE_PATH;
    if (envPath) {
      candidates.push(path.resolve(envPath));
      candidates.push(path.resolve(__dirname, envPath));
      candidates.push(path.resolve(process.cwd(), envPath));
    }

    // Shared location under Customer/database (customers.db is the canonical file created by setup_db.py)
    candidates.push(path.resolve(__dirname, "../../../database/customers.db"));
    
    // Local copies next to this file
    candidates.push(path.resolve(__dirname, "customers.db"));

    // Legacy cwd-based paths
    candidates.push(path.resolve(process.cwd(), "Customer/database/customers.db"));

    const picked = candidates.find(p => fs.existsSync(p));
    this.dbPath = picked || candidates[0];

    console.log("[EngagementClassifierQueries] DB candidates:", candidates);
    console.log("[EngagementClassifierQueries] Using DB:", this.dbPath, "exists:", fs.existsSync(this.dbPath));
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

      // Build additional filters
      let additionalFilters = "";
      
      // Loyalty status filter
      if (filters.loyaltyStatus && filters.loyaltyStatus.length > 0) {
        const statuses = filters.loyaltyStatus.map(s => `'${s}'`).join(',');
        additionalFilters += ` AND cl."Loyalty Status" IN (${statuses})`;
      }
      
      // Customer search filter
      if (filters.customerSearch) {
        const searchTerm = filters.customerSearch.replace(/'/g, "''"); // Escape single quotes
        additionalFilters += ` AND (c."Customer Name" LIKE '%${searchTerm}%' OR c."Customer Number" LIKE '%${searchTerm}%')`;
      }
      
      // Minimum transactions filter
      if (filters.minTransactions) {
        additionalFilters += ` AND cl."Number Sales Txns" >= ${filters.minTransactions}`;
      }
      
      // Minimum LTV amount filter
      if (filters.minLTVAmount) {
        additionalFilters += ` AND cl."LTD Sales Amount" >= ${filters.minLTVAmount}`;
      }
      
      // RFM Score range filter
      if (filters.rfmScoreMin !== undefined && filters.rfmScoreMax !== undefined) {
        additionalFilters += ` AND cl."RFM Score" BETWEEN ${filters.rfmScoreMin} AND ${filters.rfmScoreMax}`;
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
            ${filters.endDate ? `CASE 
              WHEN CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER) <= 30 THEN 'High'
              WHEN CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER) <= 90 THEN 'Medium'
              ELSE 'Low'
            END` : `CASE 
              WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
              WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
              ELSE 'Low'
            END`} as engagement_level,
            ${filters.endDate ? `CASE 
              WHEN CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER) <= 30 THEN 1
              WHEN CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER) <= 90 THEN 2
              ELSE 3
            END` : `CASE 
              WHEN cl."Days Since Last Activity" <= 30 THEN 1
              WHEN cl."Days Since Last Activity" <= 90 THEN 2
              ELSE 3
            END`} as engagement_sort
          FROM 
            dbo_D_Customer c
          LEFT JOIN 
            dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" IS NOT NULL
            ${dateFilter}
            ${engagementFilter}
            ${additionalFilters}
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

      // Build additional filters
      let additionalFilters = "";
      
      // Loyalty status filter
      if (filters.loyaltyStatus && filters.loyaltyStatus.length > 0) {
        const statuses = filters.loyaltyStatus.map(s => `'${s}'`).join(',');
        additionalFilters += ` AND cl."Loyalty Status" IN (${statuses})`;
      }
      
      // Customer search filter
      if (filters.customerSearch) {
        const searchTerm = filters.customerSearch.replace(/'/g, "''"); // Escape single quotes
        additionalFilters += ` AND (c."Customer Name" LIKE '%${searchTerm}%' OR c."Customer Number" LIKE '%${searchTerm}%')`;
      }
      
      // Minimum transactions filter
      if (filters.minTransactions) {
        additionalFilters += ` AND cl."Number Sales Txns" >= ${filters.minTransactions}`;
      }
      
      // Minimum LTV amount filter
      if (filters.minLTVAmount) {
        additionalFilters += ` AND cl."LTD Sales Amount" >= ${filters.minLTVAmount}`;
      }
      
      // RFM Score range filter
      if (filters.rfmScoreMin !== undefined && filters.rfmScoreMax !== undefined) {
        additionalFilters += ` AND cl."RFM Score" BETWEEN ${filters.rfmScoreMin} AND ${filters.rfmScoreMax}`;
      }

      console.log('KPI Query Filters:', {
        dateFilter,
        engagementFilter,
        additionalFilters
      });

      const query = `
        WITH EngagementKPIs AS (
          SELECT 
            COUNT(*) as total_customers,
            AVG(cl."RFM Score") as avg_engagement_score,
            AVG(CASE 
                  WHEN ${filters.endDate ? `CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER)` : `cl."Days Since Last Activity"`} IS NULL THEN NULL
                  ELSE ${filters.endDate ? `CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER)` : `cl."Days Since Last Activity"`}
                END) as avg_days_since_activity,
            COUNT(CASE WHEN ${filters.endDate ? `CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER)` : `cl."Days Since Last Activity"`} <= 30 THEN 1 END) as high_engagement_count,
            COUNT(CASE WHEN ${filters.endDate ? `CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER)` : `cl."Days Since Last Activity"`} > 30 AND ${filters.endDate ? `CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER)` : `cl."Days Since Last Activity"`} <= 90 THEN 1 END) as medium_engagement_count,
            COUNT(CASE WHEN ${filters.endDate ? `CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER)` : `cl."Days Since Last Activity"`} > 90 THEN 1 END) as low_engagement_count,
            AVG(cl."Avg Sales Amount") as avg_purchase_value,
            AVG(cl."Number Sales Txns") as avg_transaction_frequency,
            COUNT(CASE WHEN cl."Loyalty Status" IN ('Active', 'Active, Loyal') AND ${filters.endDate ? `CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER)` : `cl."Days Since Last Activity"`} > 90 THEN 1 END) as reengagement_opportunities
          FROM 
            dbo_D_Customer c
          LEFT JOIN 
            dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" IS NOT NULL
            ${dateFilter}
            ${engagementFilter}
            ${additionalFilters}
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

      // Build additional filters
      let additionalFilters = "";
      
      // Loyalty status filter
      if (filters.loyaltyStatus && filters.loyaltyStatus.length > 0) {
        const statuses = filters.loyaltyStatus.map(s => `'${s}'`).join(',');
        additionalFilters += ` AND cl."Loyalty Status" IN (${statuses})`;
      }
      
      // Customer search filter
      if (filters.customerSearch) {
        const searchTerm = filters.customerSearch.replace(/'/g, "''"); // Escape single quotes
        additionalFilters += ` AND (c."Customer Name" LIKE '%${searchTerm}%' OR c."Customer Number" LIKE '%${searchTerm}%')`;
      }
      
      // Minimum transactions filter
      if (filters.minTransactions) {
        additionalFilters += ` AND cl."Number Sales Txns" >= ${filters.minTransactions}`;
      }
      
      // Minimum LTV amount filter
      if (filters.minLTVAmount) {
        additionalFilters += ` AND cl."LTD Sales Amount" >= ${filters.minLTVAmount}`;
      }
      
      // RFM Score range filter
      if (filters.rfmScoreMin !== undefined && filters.rfmScoreMax !== undefined) {
        additionalFilters += ` AND cl."RFM Score" BETWEEN ${filters.rfmScoreMin} AND ${filters.rfmScoreMax}`;
      }

      const query = `
        WITH EngagementDistribution AS (
          SELECT 
            CASE 
              WHEN ${(filters.endDate ? `CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER)` : `cl."Days Since Last Activity"`)} <= 30 THEN 'High'
              WHEN ${(filters.endDate ? `CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER)` : `cl."Days Since Last Activity"`)} <= 90 THEN 'Medium'
              ELSE 'Low'
            END as engagement_level,
            COUNT(*) as customer_count,
            AVG(cl."Number Sales Txns") as avg_transactions,
            AVG(cl."Avg Sales Amount") as avg_purchase_value,
            AVG(${(filters.endDate ? `CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER)` : `cl."Days Since Last Activity"`)}) as avg_days_since_activity,
            AVG(cl."RFM Score") as avg_rfm_score,
            COUNT(CASE WHEN cl."Loyalty Status" = 'Active, Loyal' THEN 1 END) as loyal_customers,
            SUM(COALESCE(cl."LTD Sales Amount", 0)) as total_ltd_sales
          FROM 
            dbo_D_Customer c
          LEFT JOIN 
            dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
          WHERE 
            cl."Days Since Last Activity" IS NOT NULL
            ${dateFilter}
            ${engagementFilter}
            ${additionalFilters}
          GROUP BY 
            CASE 
              WHEN ${(filters.endDate ? `CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER)` : `cl."Days Since Last Activity"`)} <= 30 THEN 'High'
              WHEN ${(filters.endDate ? `CAST((julianday('${filters.endDate}') - julianday(cl."Last Activity Date")) AS INTEGER)` : `cl."Days Since Last Activity"`)} <= 90 THEN 'Medium'
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
              WHEN cl."Loyalty Status" = 'Active, Loyal' AND cl."Days Since Last Activity" > 60 THEN 'Loyal Customer Recovery'
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

  async searchCustomers(searchTerm) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      // Clean search term for better matching
      const cleanTerm = searchTerm.trim().toLowerCase();
      
      const query = `
        SELECT 
          c."Customer Key",
          c."Customer Number",
          c."Customer Name",
          c."Salesperson Name",
          cl."Loyalty Status",
          cl."LTD Sales Amount",
          cl."Days Since Last Activity",
          cl."RFM Score",
          cl."Number Sales Txns",
          cl."Avg Sales Amount",
          CASE 
            WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
            WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
            ELSE 'Low'
          END as engagement_level,
          -- Calculate relevance score for better sorting
          CASE 
            WHEN LOWER(c."Customer Name") LIKE '${cleanTerm}%' THEN 100
            WHEN LOWER(c."Customer Name") LIKE '%${cleanTerm}%' THEN 90
            WHEN LOWER(c."Salesperson Name") LIKE '${cleanTerm}%' THEN 80
            WHEN LOWER(c."Salesperson Name") LIKE '%${cleanTerm}%' THEN 70
            WHEN c."Customer Number" LIKE '%${searchTerm}%' THEN 60
            ELSE 50
          END as relevance_score
        FROM 
          dbo_D_Customer c
        LEFT JOIN 
          dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
        WHERE 
          (
            LOWER(c."Customer Name") LIKE '%${cleanTerm}%' OR 
            LOWER(c."Salesperson Name") LIKE '%${cleanTerm}%' OR
            c."Customer Number" LIKE '%${searchTerm}%'
          )
          AND c."Customer Name" IS NOT NULL
          AND c."Customer Name" != ''
        ORDER BY 
          relevance_score DESC,
          cl."LTD Sales Amount" DESC
        LIMIT 15;
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

  async getCustomerAnalytics(customerKey) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      // Get customer summary analytics
      const summaryQuery = `
        SELECT 
          c."Customer Name",
          c."Customer Number",
          cl."Loyalty Status",
          cl."LTD Sales Amount" as total_purchases,
          cl."Number Sales Txns" as total_transactions,
          cl."Avg Sales Amount" as avg_purchase_amount,
          cl."Days Since Last Activity",
          cl."RFM Score",
          CASE 
            WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
            WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
            ELSE 'Low'
          END as engagement_level,
          -- Calculate purchases in last 60 days (simulated based on activity)
          CASE 
            WHEN cl."Days Since Last Activity" <= 60 THEN 
              ROUND(cl."Number Sales Txns" * 0.3)
            ELSE 0
          END as purchases_last_60_days
        FROM 
          dbo_D_Customer c
        LEFT JOIN 
          dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
        WHERE 
          c."Customer Key" = '${customerKey}';
      `;

      db.get(summaryQuery, (err, summary) => {
        if (err) {
          db.close();
          reject(err);
          return;
        }

        // Generate mock timeline data based on customer's transaction pattern
        const timelineData = this.generateCustomerTimeline(summary);
        const frequencyData = this.generateFrequencyData(summary);

        const analytics = {
          ...summary,
          timeline: timelineData,
          frequency_data: frequencyData
        };

        db.close();
        resolve(analytics);
      });
    });
  }

  generateCustomerTimeline(customer) {
    if (!customer) return [];

    const timeline = [];
    const baseAmount = customer.avg_purchase_amount || 1000;
    const totalTransactions = customer.total_transactions || 1;
    
    // Use actual database date range: 2018-2021 (based on our database analysis)
    // Generate timeline working backwards from 2021 to 2018
    const endYear = 2021;
    const startYear = 2018;
    const totalMonths = (endYear - startYear + 1) * 12;
    
    // Generate timeline from Jan 2018 to Dec 2021
    for (let monthOffset = 0; monthOffset < totalMonths; monthOffset++) {
      const date = new Date(startYear, monthOffset, 1);
      const year = date.getFullYear();
      const month = date.toLocaleString('default', { month: 'short' });
      const period = `${month} ${year}`;
      
      // Simulate purchase amounts based on customer's pattern
      // More activity in recent years (2020-2021), less in earlier years (2018-2019)
      let purchaseAmount = 0;
      const yearProgress = (year - startYear) / (endYear - startYear); // 0 to 1
      
      if (year >= 2020) {
        // Higher activity in 2020-2021
        purchaseAmount = baseAmount * (0.6 + Math.random() * 1.4) * (totalTransactions / totalMonths);
      } else if (year === 2019) {
        // Moderate activity in 2019
        purchaseAmount = baseAmount * (0.4 + Math.random() * 0.8) * (totalTransactions / totalMonths);
      } else {
        // Lower activity in 2018
        purchaseAmount = baseAmount * (0.2 + Math.random() * 0.6) * (totalTransactions / totalMonths);
      }
      
      // Add seasonal variation (higher in Q4, lower in Q1)
      const month_num = date.getMonth() + 1;
      if (month_num >= 10) { // Q4 - holiday season
        purchaseAmount *= 1.3;
      } else if (month_num <= 3) { // Q1 - slower period
        purchaseAmount *= 0.8;
      }
      
      // Add some randomness for realistic variation
      if (Math.random() > 0.7) {
        purchaseAmount *= (1.2 + Math.random() * 1.5); // Occasional spikes
      }
      
      // Some months might have no activity
      if (Math.random() > 0.85) {
        purchaseAmount = 0;
      }
      
      // Generate individual transactions for drill-down
      const individualTransactions = this.generateIndividualTransactions(date, Math.round(Math.max(0, purchaseAmount)), baseAmount);
      
      timeline.push({
        period: period,
        purchase_amount: Math.round(Math.max(0, purchaseAmount)),
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        individual_transactions: individualTransactions
      });
    }
    
    return timeline;
  }

  generateIndividualTransactions(monthDate, totalAmount, baseAmount) {
    if (totalAmount <= 0) return [];
    
    const transactions = [];
    const numTransactions = Math.max(1, Math.floor(Math.random() * 5) + 1); // 1-5 transactions per month
    let remainingAmount = totalAmount;
    
    for (let i = 0; i < numTransactions; i++) {
      const isLastTransaction = i === numTransactions - 1;
      let transactionAmount;
      
      if (isLastTransaction) {
        transactionAmount = remainingAmount;
      } else {
        // Random split of remaining amount
        const maxAmount = Math.min(remainingAmount * 0.8, baseAmount * 2);
        transactionAmount = Math.max(50, Math.floor(Math.random() * maxAmount));
        remainingAmount -= transactionAmount;
      }
      
      // Generate random day within the month
      const transactionDate = new Date(monthDate);
      const daysInMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 0).getDate();
      const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
      transactionDate.setDate(randomDay);
      
      // Generate transaction details
      const transactionTypes = ['Product Sale', 'Service Fee', 'Bulk Order', 'Subscription', 'Consultation'];
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      
      transactions.push({
        date: transactionDate.toISOString().split('T')[0],
        amount: transactionAmount,
        type: transactionType,
        transaction_id: `TXN-${transactionDate.getFullYear()}${String(transactionDate.getMonth() + 1).padStart(2, '0')}${String(randomDay).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      });
    }
    
    // Sort transactions by date
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return transactions;
  }

  generateFrequencyData(customer) {
    if (!customer) return [];

    const totalTransactions = customer.total_transactions || 1;
    
    // Use actual database years: 2018-2021
    const frequencyData = [];
    const years = [2018, 2019, 2020, 2021];
    
    years.forEach(year => {
      for (let quarter = 1; quarter <= 4; quarter++) {
        const period = `Q${quarter} ${year}`;
        let transactionCount = 0;
        
        // Distribute transactions based on year (more recent = more activity)
        if (year === 2021) {
          // Most recent year - highest activity
          transactionCount = Math.round(totalTransactions * 0.35 * (0.2 + Math.random() * 0.3));
        } else if (year === 2020) {
          // Second most recent
          transactionCount = Math.round(totalTransactions * 0.3 * (0.15 + Math.random() * 0.25));
        } else if (year === 2019) {
          // Third most recent
          transactionCount = Math.round(totalTransactions * 0.2 * (0.1 + Math.random() * 0.2));
        } else { // 2018
          // Oldest year - lowest activity
          transactionCount = Math.round(totalTransactions * 0.15 * (0.05 + Math.random() * 0.15));
        }
        
        // Seasonal adjustment (Q4 higher, Q1 lower)
        if (quarter === 4) {
          transactionCount = Math.round(transactionCount * 1.3); // Holiday season
        } else if (quarter === 1) {
          transactionCount = Math.round(transactionCount * 0.8); // Slower start
        }
        
        frequencyData.push({
          period: period,
          transaction_count: Math.max(0, transactionCount)
        });
      }
    });
    
    return frequencyData;
  }

}

module.exports = { EngagementClassifierQueries }; 