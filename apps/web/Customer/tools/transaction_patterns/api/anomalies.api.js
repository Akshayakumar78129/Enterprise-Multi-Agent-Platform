import { NextApiRequest, NextApiResponse } from 'next';
import { customerDatabaseConnector } from '../../../../Customer/database/connector';

export default async function handler(req, res) {
  const { start, end } = req.query;
  if (!start || !end) {
    res.status(400).json({ error: 'Missing start or end date parameters' });
    return;
  }

  try {
    await customerDatabaseConnector.connect();

    // Fetch transaction details
    const txRows = await customerDatabaseConnector.query(
      `WITH TransactionDetails AS (
         SELECT 
           t."Sales Txn Key" as transaction_id,
           t."Txn Date" as timestamp,
           t."Net Sales Amount" as total_value,
           GROUP_CONCAT(i."Item Category Hrchy Key", ';') as product_categories,
           t."Unit of Measure" as payment_method,
           t."Location Code" as location
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
      transactionId: row.transaction_id,
      timestamp: row.timestamp,
      value: Number(row.total_value),
      hour: new Date(row.timestamp).getHours(),
      dayOfWeek: new Date(row.timestamp).getDay(),
      productsCount: row.product_categories ? row.product_categories.split(';').length : 0,
      paymentMethod: row.payment_method,
      location: row.location
    }));

    // Simple anomaly detection via Z-score on value
    const values = transactions.map(t => t.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    const anomalies = [];
    transactions.forEach(t => {
      const score = std > 0 ? Math.abs(t.value - mean) / std : 0;
      if (score > 2) { // threshold: Z > 2
        anomalies.push({ ...t, isAnomaly: true, anomalyScore: score });
      }
    });

    const totalTransactions = transactions.length;
    const anomalyCount = anomalies.length;
    const anomalyRate = totalTransactions > 0 ? anomalyCount / totalTransactions : 0;

    // Distribution stats for anomalies
    const anomalyDistribution = {
      byHour: {},
      byDay: {},
      byPaymentMethod: {},
      byValue: { low: 0, medium: 0, high: 0 }
    };
    anomalies.forEach(a => {
      anomalyDistribution.byHour[a.hour] = (anomalyDistribution.byHour[a.hour] || 0) + 1;
      anomalyDistribution.byDay[a.dayOfWeek] = (anomalyDistribution.byDay[a.dayOfWeek] || 0) + 1;
      anomalyDistribution.byPaymentMethod[a.paymentMethod] = (anomalyDistribution.byPaymentMethod[a.paymentMethod] || 0) + 1;
      if (a.value < 100) anomalyDistribution.byValue.low++;
      else if (a.value < 1000) anomalyDistribution.byValue.medium++;
      else anomalyDistribution.byValue.high++;
    });

    const stats = {
      anomalyRate,
      anomalyCount,
      totalTransactions,
      anomalyDistribution
    };

    res.status(200).json({ anomalies, stats });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
} 