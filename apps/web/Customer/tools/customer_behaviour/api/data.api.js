const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

export default async function handler(req, res) {
  try {
    const dbPath = path.join(process.cwd(), 'Customer/database/customers.db');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });

    // 1. Purchase pattern metrics (frequency, recency, value, quantity, diversity, loyalty)
    const patternQuery = `
      SELECT 
        c."Customer Key" as customer_id,
        MAX(t."Txn Date") as last_purchase_date,
        COUNT(t."Sales Txn Key") as frequency,
        ROUND(AVG(t."Net Sales Amount"), 2) as avg_order_value,
        SUM(t."Sales Quantity") as quantity,
        COUNT(DISTINCT t."Item Category Hrchy Key") as diversity,
        cl."RFM Score" as loyalty
      FROM dbo_D_Customer c
      LEFT JOIN dbo_F_Sales_Transaction t ON c."Customer Key" = t."Customer Key"
      LEFT JOIN dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
      WHERE c."Customer Key" > 0
      GROUP BY c."Customer Key", cl."RFM Score"
      HAVING COUNT(t."Sales Txn Key") > 0
    `;
    const patterns = await db.all(patternQuery);

    // 2. Category affinity (category, count, spend)
    const categoryQuery = `
      SELECT t."Item Category Hrchy Key" as category, COUNT(*) as count, SUM(t."Net Sales Amount") as spend
      FROM dbo_F_Sales_Transaction t
      GROUP BY t."Item Category Hrchy Key"
      ORDER BY spend DESC
    `;
    const categories = await db.all(categoryQuery);

    // 3. Channel usage (channel, count, spend)
    const channelQuery = `
      SELECT t."Sales Organization Key" as channel, COUNT(*) as count, SUM(t."Net Sales Amount") as spend
      FROM dbo_F_Sales_Transaction t
      GROUP BY t."Sales Organization Key"
      ORDER BY spend DESC
    `;
    const channels = await db.all(channelQuery);

    // 4. Engagement (recency, frequency, spend, churn risk)
    const now = new Date();
    patterns.forEach(p => {
      p.recency = (now - new Date(p.last_purchase_date)) / (1000 * 60 * 60 * 24);
      p.churn_risk = p.recency > 90 ? 'high' : p.recency > 30 ? 'medium' : 'low';
    });

    // 5. KPI metrics
    const avgPurchaseInterval = patterns.reduce((sum, p) => sum + p.recency, 0) / patterns.length;
    const avgOrderValue = patterns.reduce((sum, p) => sum + p.avg_order_value, 0) / patterns.length;
    const categoryDiversity = patterns.reduce((sum, p) => sum + p.diversity, 0) / patterns.length;
    const dominantChannel = channels[0]?.channel || '';
    const dominantChannelPct = channels[0] ? (channels[0].count / channels.reduce((a, b) => a + b.count, 0)) * 100 : 0;
    const churnRiskPct = patterns.filter(p => p.churn_risk === 'high').length / patterns.length * 100;
    const kpis = {
      avgPurchaseInterval,
      avgOrderValue,
      categoryDiversity,
      dominantChannel,
      dominantChannelPct,
      churnRiskPct
    };

    await db.close();
    res.status(200).json({
      status: 'success',
      patterns,
      categories,
      channels,
      kpis
    });
  } catch (error) {
    console.error('Error fetching customer behaviour data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer behaviour data',
      error: error.message
    });
  }
} 