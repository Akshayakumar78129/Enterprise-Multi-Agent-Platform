import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
// Import directly from the database connector
const { customerDatabaseConnector } = require('../../../../Customer/database/connector.js');

export default async function handler(req, res) {
  const { start, end } = req.query;
  if (!start || !end) {
    res.status(400).json({ error: 'Missing start or end date parameters' });
    return;
  }

  try {
    await customerDatabaseConnector.connect();

    // Fetch transactions with their details
    const txRows = await customerDatabaseConnector.query(
      `WITH TransactionDetails AS (
         SELECT 
           t."Sales Txn Key" as transaction_id,
           t."Customer Key" as customer_id,
           t."Txn Date" as timestamp,
           t."Net Sales Amount" as total_value,
           t."Unit of Measure" as payment_method,
           GROUP_CONCAT(i."Item Category Hrchy Key", ';') as product_categories,
           t."Location Code" as location,
           t."Discount Reason" as promotion_applied
         FROM dbo_F_Sales_Transaction t
         LEFT JOIN dbo_F_Sales_Transaction i
           ON t."Item Category Hrchy Key" = i."Item Category Hrchy Key"
         WHERE t."Txn Date" BETWEEN ? AND ?
         GROUP BY t."Sales Txn Key"
       )
       SELECT * FROM TransactionDetails;`,
      [start, end]
    );

    const transactions = txRows.map(row => ({
      id: row.transaction_id,
      customerId: row.customer_id,
      timestamp: row.timestamp,
      value: row.total_value,
      totalValue: row.total_value,
      products: row.product_categories ? row.product_categories.split(';') : [],
      paymentMethod: row.payment_method,
      location: row.location
    }));

    // Total transactions
    const totalRows = await customerDatabaseConnector.query(
      `SELECT COUNT(*) as count
         FROM dbo_F_Sales_Transaction
         WHERE "Txn Date" BETWEEN ? AND ?`,
      [start, end]
    );
    const totalTransactions = totalRows[0]?.count || transactions.length;

    // Peak hours (top 3)
    const peakRows = await customerDatabaseConnector.query(
      `SELECT strftime('%H', "Txn Date") as hour, COUNT(*) as count
         FROM dbo_F_Sales_Transaction
         WHERE "Txn Date" BETWEEN ? AND ?
         GROUP BY hour
         ORDER BY count DESC
         LIMIT 3`,
      [start, end]
    );
    const peakHours = peakRows.map(r => ({
      hour: parseInt(r.hour, 10),
      count: r.count,
      percentage: totalTransactions > 0 ? r.count / totalTransactions : 0
    }));

    // Daily distribution
    const dailyRows = await customerDatabaseConnector.query(
      `SELECT strftime('%w', "Txn Date") as dow, COUNT(*) as count
         FROM dbo_F_Sales_Transaction
         WHERE "Txn Date" BETWEEN ? AND ?
         GROUP BY dow
         ORDER BY dow`,
      [start, end]
    );
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dailyDistribution = dailyRows.map(r => ({
      day: dayNames[parseInt(r.dow, 10)],
      count: r.count,
      percentage: totalTransactions > 0 ? r.count / totalTransactions : 0
    }));

    // Payment method distribution
    const paymentRows = await customerDatabaseConnector.query(
      `SELECT "Unit of Measure" as method, COUNT(*) as count
         FROM dbo_F_Sales_Transaction
         WHERE "Txn Date" BETWEEN ? AND ?
         GROUP BY method`,
      [start, end]
    );
    const paymentDistribution = paymentRows.map(r => ({
      method: r.method,
      count: r.count,
      percentage: totalTransactions > 0 ? r.count / totalTransactions : 0
    }));

    // Temporal heatmap matrix
    const heatmapRows = await customerDatabaseConnector.query(
      `SELECT strftime('%w', "Txn Date") as dow, strftime('%H', "Txn Date") as hour, COUNT(*) as count
         FROM dbo_F_Sales_Transaction
         WHERE "Txn Date" BETWEEN ? AND ?
         GROUP BY dow, hour
         ORDER BY dow, hour`,
      [start, end]
    );
    const days = dayNames;
    const hoursArr = Array.from({ length: 24 }, (_, i) => i);
    const hourlyMatrix = days.map(() => hoursArr.map(() => 0));
    heatmapRows.forEach(r => {
      const d = parseInt(r.dow, 10);
      const h = parseInt(r.hour, 10);
      hourlyMatrix[d][h] = r.count;
    });
    const temporalHeatmap = { hourlyMatrix, days, hours: hoursArr };

    // Prepare baskets of products per transaction
    const baskets = transactions.map(tx => tx.products || []);
    const totalBaskets = baskets.length;
    // Count individual product support
    const productCounts = {};
    baskets.forEach(basket => {
      basket.forEach(prod => {
        if (!prod) return;
        productCounts[prod] = (productCounts[prod] || 0) + 1;
      });
    });
    const support = {};
    Object.keys(productCounts).forEach(prod => {
      support[prod] = productCounts[prod] / totalBaskets;
    });
    // Count pair occurrences
    const pairCounts = {};
    baskets.forEach(basket => {
      for (let i = 0; i < basket.length; i++) {
        for (let j = i + 1; j < basket.length; j++) {
          const a = basket[i];
          const b = basket[j];
          if (!a || !b) continue;
          const key = a < b ? `${a}|${b}` : `${b}|${a}`;
          pairCounts[key] = (pairCounts[key] || 0) + 1;
        }
      }
    });
    // Calculate lift and filter
    let productAssociations = Object.entries(pairCounts)
      .map(([key, count]) => {
        const [a, b] = key.split('|');
        const pA = support[a] || 0;
        const pB = support[b] || 0;
        const pAB = count / totalBaskets;
        const lift = pA && pB ? pAB / (pA * pB) : 0;
        return { sourceProduct: a, targetProduct: b, strength: lift, count };
      })
      // require at least 1% support and lift >= 1
      .filter(item => (item.count / totalBaskets >= 0.01) && item.strength >= 1)
      .sort((x, y) => y.strength - x.strength);

    // Build stats object
    const stats = {
      totalTransactions,
      startDate: start,
      endDate: end,
      anomalyRate: 0,
      peakHours,
      dailyDistribution,
      paymentDistribution
    };

    res.status(200).json({ transactions, stats, temporalHeatmap, productAssociations });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
} 