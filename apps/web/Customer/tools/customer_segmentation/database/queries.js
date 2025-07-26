const Database = require('better-sqlite3');
const path = require('path');

class CustomerSegmentationQueries {
  constructor() {
    const dbPath = path.join(process.cwd(), 'Customer/database/customers.db');
    this.db = new Database(dbPath);
  }

  // Get segmented customer data with RFM-RL scoring
  getSegmentData() {
    const query = `
      SELECT 
        cl."Customer Number" as customer_number,
        cl."Entity Name" as customer_name,
        cl."RFM-RL Score" as rfm_rl_score,
        cl."RFM Score" as rfm_score,
        cl."Recency Band" as recency_band,
        cl."Frequency Band" as frequency_band,
        cl."Monetary Band" as monetary_band,
        cl."Relationship Length Band" as relationship_band,
        cl."LTD Sales Amount" as lifetime_value,
        cl."Avg Sales Amount" as avg_order_value,
        cl."Number Sales Txns" as transaction_count,
        cl."Days Since Last Activity" as days_since_last_activity,
        cl."CY Sales Amount" as current_year_sales,
        cl."Loyalty Status" as loyalty_status,
        c."Customer Type Desc" as customer_type,
        c."Customer State/Prov" as state,
        c."Customer Country" as country,
        CASE 
          WHEN cl."RFM-RL Score" >= 10 THEN 'Champions'
          WHEN cl."RFM-RL Score" >= 8 THEN 'Loyal Customers'
          WHEN cl."RFM-RL Score" >= 6 THEN 'Potential Loyalists'
          WHEN cl."RFM-RL Score" >= 4 THEN 'At Risk'
          WHEN cl."RFM-RL Score" >= 2 THEN 'Cannot Lose Them'
          ELSE 'Lost Customers'
        END as segment_name,
        CASE 
          WHEN cl."RFM-RL Score" >= 10 THEN 1
          WHEN cl."RFM-RL Score" >= 8 THEN 2
          WHEN cl."RFM-RL Score" >= 6 THEN 3
          WHEN cl."RFM-RL Score" >= 4 THEN 4
          WHEN cl."RFM-RL Score" >= 2 THEN 5
          ELSE 6
        END as segment_id
      FROM dbo_F_Customer_Loyalty cl
      LEFT JOIN dbo_D_Customer c ON cl."Customer Number" = c."Customer Number"
      WHERE cl."RFM-RL Score" IS NOT NULL
      ORDER BY cl."RFM-RL Score" DESC, cl."LTD Sales Amount" DESC
    `;
    
    return this.db.prepare(query).all();
  }

  // Get KPI data for segmentation overview
  getKPIData() {
    const query = `
      WITH segment_stats AS (
        SELECT 
          CASE 
            WHEN "RFM-RL Score" >= 10 THEN 'Champions'
            WHEN "RFM-RL Score" >= 8 THEN 'Loyal Customers'
            WHEN "RFM-RL Score" >= 6 THEN 'Potential Loyalists'
            WHEN "RFM-RL Score" >= 4 THEN 'At Risk'
            WHEN "RFM-RL Score" >= 2 THEN 'Cannot Lose Them'
            ELSE 'Lost Customers'
          END as segment_name,
          COUNT(*) as customer_count,
          SUM("LTD Sales Amount") as total_value,
          AVG("RFM-RL Score") as avg_score
        FROM dbo_F_Customer_Loyalty
        WHERE "RFM-RL Score" IS NOT NULL
        GROUP BY segment_name
      )
      SELECT 
        COUNT(DISTINCT segment_name) as total_segments,
        (SELECT COUNT(*) FROM dbo_F_Customer_Loyalty WHERE "RFM-RL Score" IS NOT NULL) as total_customers,
        ROUND(AVG(avg_score), 2) as segmentation_quality,
        ROUND(MAX(customer_count) * 100.0 / SUM(customer_count), 1) as largest_segment_percentage,
        (SELECT segment_name FROM segment_stats ORDER BY total_value DESC LIMIT 1) as most_valuable_segment,
        ROUND(
          (SELECT COUNT(*) FROM dbo_F_Customer_Loyalty WHERE "Days Since Last Activity" <= 90) * 100.0 / 
          (SELECT COUNT(*) FROM dbo_F_Customer_Loyalty WHERE "RFM-RL Score" IS NOT NULL), 1
        ) as stability_percentage
      FROM segment_stats
    `;
    
    return this.db.prepare(query).get();
  }

  // Get segment distribution for visualization
  getSegmentDistribution() {
    const query = `
      SELECT 
        CASE 
          WHEN "RFM-RL Score" >= 10 THEN 'Champions'
          WHEN "RFM-RL Score" >= 8 THEN 'Loyal Customers'
          WHEN "RFM-RL Score" >= 6 THEN 'Potential Loyalists'
          WHEN "RFM-RL Score" >= 4 THEN 'At Risk'
          WHEN "RFM-RL Score" >= 2 THEN 'Cannot Lose Them'
          ELSE 'Lost Customers'
        END as segment_name,
        CASE 
          WHEN "RFM-RL Score" >= 10 THEN 1
          WHEN "RFM-RL Score" >= 8 THEN 2
          WHEN "RFM-RL Score" >= 6 THEN 3
          WHEN "RFM-RL Score" >= 4 THEN 4
          WHEN "RFM-RL Score" >= 2 THEN 5
          ELSE 6
        END as segment_id,
        COUNT(*) as customer_count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM dbo_F_Customer_Loyalty WHERE "RFM-RL Score" IS NOT NULL), 2) as percentage,
        SUM("LTD Sales Amount") as total_value,
        AVG("LTD Sales Amount") as avg_customer_value,
        AVG("RFM-RL Score") as avg_rfm_score,
        AVG("Days Since Last Activity") as avg_recency
      FROM dbo_F_Customer_Loyalty
      WHERE "RFM-RL Score" IS NOT NULL
      GROUP BY segment_name, segment_id
      ORDER BY segment_id
    `;
    
    return this.db.prepare(query).all();
  }

  // Get segment comparison metrics
  getSegmentComparison() {
    const query = `
      SELECT 
        CASE 
          WHEN "RFM-RL Score" >= 10 THEN 'Champions'
          WHEN "RFM-RL Score" >= 8 THEN 'Loyal Customers'
          WHEN "RFM-RL Score" >= 6 THEN 'Potential Loyalists'
          WHEN "RFM-RL Score" >= 4 THEN 'At Risk'
          WHEN "RFM-RL Score" >= 2 THEN 'Cannot Lose Them'
          ELSE 'Lost Customers'
        END as segment_name,
        ROUND(AVG("Avg Sales Amount"), 2) as avg_order_value,
        ROUND(AVG("Number Sales Txns"), 1) as avg_frequency,
        ROUND(AVG("LTD Sales Amount"), 2) as avg_lifetime_value,
        ROUND(AVG("Days Since Last Activity"), 1) as avg_recency_days,
        ROUND(AVG("RFM-RL Score"), 2) as avg_loyalty_score,
        ROUND(
          SUM(CASE WHEN "Days Since Last Activity" <= 30 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1
        ) as engagement_rate
      FROM dbo_F_Customer_Loyalty
      WHERE "RFM-RL Score" IS NOT NULL
      GROUP BY segment_name
      ORDER BY avg_loyalty_score DESC
    `;
    
    return this.db.prepare(query).all();
  }

  // Get segment attributes for heatmap
  getSegmentAttributes() {
    const query = `
      SELECT 
        CASE 
          WHEN cl."RFM-RL Score" >= 10 THEN 'Champions'
          WHEN cl."RFM-RL Score" >= 8 THEN 'Loyal Customers'
          WHEN cl."RFM-RL Score" >= 6 THEN 'Potential Loyalists'
          WHEN cl."RFM-RL Score" >= 4 THEN 'At Risk'
          WHEN cl."RFM-RL Score" >= 2 THEN 'Cannot Lose Them'
          ELSE 'Lost Customers'
        END as segment_name,
        'Recency' as attribute_name,
        ROUND(AVG(CASE 
          WHEN cl."Days Since Last Activity" <= 30 THEN 5
          WHEN cl."Days Since Last Activity" <= 90 THEN 4
          WHEN cl."Days Since Last Activity" <= 180 THEN 3
          WHEN cl."Days Since Last Activity" <= 365 THEN 2
          ELSE 1
        END), 2) as attribute_value
      FROM dbo_F_Customer_Loyalty cl
      WHERE cl."RFM-RL Score" IS NOT NULL
      GROUP BY segment_name
      
      UNION ALL
      
      SELECT 
        CASE 
          WHEN cl."RFM-RL Score" >= 10 THEN 'Champions'
          WHEN cl."RFM-RL Score" >= 8 THEN 'Loyal Customers'
          WHEN cl."RFM-RL Score" >= 6 THEN 'Potential Loyalists'
          WHEN cl."RFM-RL Score" >= 4 THEN 'At Risk'
          WHEN cl."RFM-RL Score" >= 2 THEN 'Cannot Lose Them'
          ELSE 'Lost Customers'
        END as segment_name,
        'Frequency' as attribute_name,
        ROUND(AVG(CASE 
          WHEN cl."Number Sales Txns" >= 20 THEN 5
          WHEN cl."Number Sales Txns" >= 10 THEN 4
          WHEN cl."Number Sales Txns" >= 5 THEN 3
          WHEN cl."Number Sales Txns" >= 2 THEN 2
          ELSE 1
        END), 2) as attribute_value
      FROM dbo_F_Customer_Loyalty cl
      WHERE cl."RFM-RL Score" IS NOT NULL
      GROUP BY segment_name
      
      UNION ALL
      
      SELECT 
        CASE 
          WHEN cl."RFM-RL Score" >= 10 THEN 'Champions'
          WHEN cl."RFM-RL Score" >= 8 THEN 'Loyal Customers'
          WHEN cl."RFM-RL Score" >= 6 THEN 'Potential Loyalists'
          WHEN cl."RFM-RL Score" >= 4 THEN 'At Risk'
          WHEN cl."RFM-RL Score" >= 2 THEN 'Cannot Lose Them'
          ELSE 'Lost Customers'
        END as segment_name,
        'Monetary' as attribute_name,
        ROUND(AVG(CASE 
          WHEN cl."LTD Sales Amount" >= 50000 THEN 5
          WHEN cl."LTD Sales Amount" >= 20000 THEN 4
          WHEN cl."LTD Sales Amount" >= 5000 THEN 3
          WHEN cl."LTD Sales Amount" >= 1000 THEN 2
          ELSE 1
        END), 2) as attribute_value
      FROM dbo_F_Customer_Loyalty cl
      WHERE cl."RFM-RL Score" IS NOT NULL
      GROUP BY segment_name
      
      ORDER BY segment_name, attribute_name
    `;
    
    return this.db.prepare(query).all();
  }

  // Get customers for a specific segment
  getSegmentCustomers(segmentName, limit = 100) {
    const segmentCondition = this.getSegmentCondition(segmentName);
    
    const query = `
      SELECT 
        cl."Customer Number" as customer_number,
        cl."Entity Name" as customer_name,
        cl."RFM-RL Score" as rfm_rl_score,
        cl."LTD Sales Amount" as lifetime_value,
        cl."Avg Sales Amount" as avg_order_value,
        cl."Number Sales Txns" as transaction_count,
        cl."Days Since Last Activity" as days_since_last_activity,
        cl."CY Sales Amount" as current_year_sales,
        c."Customer Type Desc" as customer_type,
        c."Customer State/Prov" as state,
        c."Customer Country" as country
      FROM dbo_F_Customer_Loyalty cl
      LEFT JOIN dbo_D_Customer c ON cl."Customer Number" = c."Customer Number"
      WHERE ${segmentCondition}
      ORDER BY cl."LTD Sales Amount" DESC
      LIMIT ?
    `;
    
    return this.db.prepare(query).all(limit);
  }

  // Helper method to get segment condition
  getSegmentCondition(segmentName) {
    switch (segmentName) {
      case 'Champions':
        return 'cl."RFM-RL Score" >= 10';
      case 'Loyal Customers':
        return 'cl."RFM-RL Score" >= 8 AND cl."RFM-RL Score" < 10';
      case 'Potential Loyalists':
        return 'cl."RFM-RL Score" >= 6 AND cl."RFM-RL Score" < 8';
      case 'At Risk':
        return 'cl."RFM-RL Score" >= 4 AND cl."RFM-RL Score" < 6';
      case 'Cannot Lose Them':
        return 'cl."RFM-RL Score" >= 2 AND cl."RFM-RL Score" < 4';
      case 'Lost Customers':
        return 'cl."RFM-RL Score" < 2';
      default:
        return 'cl."RFM-RL Score" IS NOT NULL';
    }
  }

  close() {
    this.db.close();
  }
}

module.exports = CustomerSegmentationQueries; 