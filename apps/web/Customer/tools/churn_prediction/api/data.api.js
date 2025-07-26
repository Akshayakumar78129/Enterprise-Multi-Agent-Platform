const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

export default async function handler(req, res) {
  try {
    const dbPath = path.join(process.cwd(), 'Customer/database/customers.db');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });

    // Query all customers with RFM/loyalty and latest transaction metrics
    const query = `
      SELECT 
        c."Customer Key" as customer_id,
        c."Customer" as name,
        cl."RFM Score" as rfm,
        MAX(t."Txn Date") as last_purchase_date,
        COUNT(t."Sales Txn Key") as frequency,
        ROUND(AVG(t."Net Sales Amount"), 2) as avg_order_value
      FROM dbo_D_Customer c
      LEFT JOIN dbo_F_Sales_Transaction t ON c."Customer Key" = t."Customer Key"
      LEFT JOIN dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
      WHERE c."Customer Key" > 0
      GROUP BY c."Customer Key", c."Customer", cl."RFM Score"
      HAVING COUNT(t."Sales Txn Key") > 0
    `;
    const customers = await db.all(query);

    // Add dummy churn probability and risk level for now
    customers.forEach(c => {
      c.churn_probability = Math.random();
      c.risk_level = c.churn_probability > 0.8 ? 'Very High'
        : c.churn_probability > 0.6 ? 'High'
        : c.churn_probability > 0.3 ? 'Medium'
        : 'Low';
    });

    await db.close();
    res.status(200).json({
      status: 'success',
      customers
    });
  } catch (error) {
    console.error('Error fetching churn prediction data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch churn prediction data',
      error: error.message
    });
  }
} 