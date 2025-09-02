const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

export default async function handler(req, res) {
  try {
    // Use the customers database (same as other tools)
    const dbPath = path.join(process.cwd(), 'Customer/database/customers.db');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });

    // Get filters from request body
    const filters = req.body || {};
    console.log('API: Received filters:', filters);

    // Build WHERE clause for filters
    let whereClause = 'WHERE c."Customer Key" > 0';
    const params = [];

    if (filters.startDate) {
      whereClause += ' AND cl."Last Activity Date" >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereClause += ' AND cl."Last Activity Date" <= ?';
      params.push(filters.endDate);
    }

    // Engagement level filter (calculated dynamically)
    let engagementLevelFilter = '';
    if (filters.engagementLevels && filters.engagementLevels.length > 0) {
      const levelConditions = filters.engagementLevels.map(level => {
        switch(level) {
          case 'High': return 'cl."Days Since Last Activity" <= 30';
          case 'Medium': return 'cl."Days Since Last Activity" > 30 AND cl."Days Since Last Activity" <= 90';
          case 'Low': return 'cl."Days Since Last Activity" > 90';
          default: return '1=0';
        }
      }).join(' OR ');
      engagementLevelFilter = ` AND (${levelConditions})`;
    }

    if (filters.minValue) {
      whereClause += ' AND cl."Customer Lifetime Value" >= ?';
      params.push(filters.minValue);
    }

    if (filters.maxValue) {
      whereClause += ' AND cl."Customer Lifetime Value" <= ?';
      params.push(filters.maxValue);
    }

    // Combine WHERE clause with engagement level filter
    const fullWhereClause = whereClause + engagementLevelFilter;

    // 1. KPI Metrics
    const kpiQuery = `
      SELECT 
        COUNT(*) as total_customers,
        ROUND(AVG(cl."RFM Score"), 2) as avg_engagement_score,
        ROUND(AVG(cl."Days Since Last Activity"), 1) as avg_days_since_activity,
        ROUND(SUM(cl."Customer Lifetime Value"), 2) as total_customer_value,
        ROUND(AVG(cl."Customer Lifetime Value"), 2) as avg_customer_value
      FROM dbo_D_Customer c
      LEFT JOIN dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
      ${fullWhereClause}
    `;
    const kpiResult = await db.get(kpiQuery, params);

    // 2. Engagement Distribution (for pyramid)
    const distributionQuery = `
      SELECT 
        CASE 
          WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
          WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
          ELSE 'Low'
        END as engagement_level,
        COUNT(*) as customer_count,
        ROUND(AVG(cl."RFM Score"), 2) as avg_score,
        ROUND(SUM(cl."Customer Lifetime Value"), 2) as total_value,
        ROUND(AVG(cl."Customer Lifetime Value"), 2) as avg_value
      FROM dbo_D_Customer c
      LEFT JOIN dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
      ${fullWhereClause}
      GROUP BY 
        CASE 
          WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
          WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
          ELSE 'Low'
        END
      ORDER BY 
        CASE 
          WHEN cl."Days Since Last Activity" <= 30 THEN 1
          WHEN cl."Days Since Last Activity" <= 90 THEN 2
          ELSE 3
        END
    `;
    const distribution = await db.all(distributionQuery, params);

    // 3. Timeline Data (engagement over time periods)
    const timelineQuery = `
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
      FROM dbo_D_Customer c
      LEFT JOIN dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
      ${fullWhereClause}
      GROUP BY time_period, engagement_level
      ORDER BY 
        CASE time_period
          WHEN 'This Week' THEN 1
          WHEN 'This Month' THEN 2
          WHEN 'Last 3 Months' THEN 3
          WHEN 'Last 6 Months' THEN 4
          WHEN 'Last Year' THEN 5
          WHEN 'Over 1 Year' THEN 6
        END,
        CASE engagement_level 
          WHEN 'High' THEN 1 
          WHEN 'Medium' THEN 2 
          WHEN 'Low' THEN 3 
        END
    `;
    const timeline = await db.all(timelineQuery, params);

    // 4. Re-engagement Opportunities
    const opportunitiesQuery = `
      SELECT 
        c."Customer Key" as customer_id,
        CASE 
          WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
          WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
          ELSE 'Low'
        END as engagement_level,
        cl."RFM Score" as engagement_score,
        cl."Days Since Last Activity" as days_since_last_activity,
        cl."Customer Lifetime Value" as customer_lifetime_value,
        cl."RFM Score" as rfm_score,
        CASE 
          WHEN cl."Customer Lifetime Value" >= 5000 AND cl."Days Since Last Activity" > 60 THEN 'High Value Winback'
          WHEN cl."Customer Lifetime Value" >= 2000 AND cl."Days Since Last Activity" > 45 THEN 'Medium Value Nurture'
          WHEN cl."RFM Score" >= 8 AND cl."Days Since Last Activity" > 30 THEN 'Loyal Customer Recovery'
          WHEN cl."Days Since Last Activity" > 30 AND cl."Days Since Last Activity" <= 90 THEN 'Standard Reengagement'
          ELSE 'Low Priority'
        END as opportunity_type
      FROM dbo_D_Customer c
      LEFT JOIN dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
      ${whereClause}
      AND cl."Days Since Last Activity" > 30
      AND (cl."Days Since Last Activity" <= 90 OR cl."Days Since Last Activity" > 90)
      ORDER BY cl."Customer Lifetime Value" DESC, cl."Days Since Last Activity" DESC
      LIMIT 100
    `;
    const opportunities = await db.all(opportunitiesQuery, params);

    // 5. Customer Details for modals (sample of customers for each engagement level)
    const customerDetailsQuery = `
      SELECT 
        c."Customer Key" as customer_id,
        CASE 
          WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
          WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
          ELSE 'Low'
        END as engagement_level,
        cl."RFM Score" as engagement_score,
        cl."Days Since Last Activity" as days_since_last_activity,
        cl."Customer Lifetime Value" as customer_lifetime_value,
        cl."RFM Score" as rfm_score,
        cl."Last Activity Date" as last_activity_date
      FROM dbo_D_Customer c
      LEFT JOIN dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
      ${fullWhereClause}
      ORDER BY cl."Customer Lifetime Value" DESC
      LIMIT 500
    `;
    const customerDetails = await db.all(customerDetailsQuery, params);

    await db.close();

    // Format response
    const response = {
      success: true,
      data: {
        kpis: kpiResult,
        distribution: distribution,
        timeline: timeline,
        opportunities: opportunities,
        customerDetails: customerDetails,
        filters: filters,
        timestamp: new Date().toISOString()
      }
    };

    console.log('API: Sending response with', {
      kpis: !!response.data.kpis,
      distribution: response.data.distribution?.length || 0,
      timeline: response.data.timeline?.length || 0,
      opportunities: response.data.opportunities?.length || 0,
      customerDetails: response.data.customerDetails?.length || 0
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
}