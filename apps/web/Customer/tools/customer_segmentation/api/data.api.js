const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

/**
 * API endpoint to fetch customer segmentation data from the SQLite database
 *
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 */
export default async function handler(req, res) {
  try {
    // Open database connection
    const dbPath = path.join(process.cwd(), 'Customer/database/customers.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Fetch customer features for segmentation
    const query = `
      SELECT 
        c."Customer Key" as customer_id,
        c."Customer Type Desc" as customer_type,
        c."Customer Status" as status,
        c."Customer State/Prov" as region,
        c."Industry Code" as industry,
        COUNT(DISTINCT t."Sales Txn Key") as transaction_count,
        ROUND(AVG(t."Net Sales Amount"), 2) as avg_order_value,
        ROUND(SUM(t."Net Sales Amount"), 2) as total_spend,
        MAX(t."Txn Date") as last_purchase_date,
        ROUND(AVG(c."Credit Limit Amount"), 2) as credit_limit
      FROM dbo_D_Customer c
      LEFT JOIN dbo_F_Sales_Transaction t 
        ON c."Customer Key" = t."Customer Key"
      WHERE c."Customer Key" > 0
      GROUP BY 
        c."Customer Key",
        c."Customer Type Desc",
        c."Customer Status",
        c."Customer State/Prov",
        c."Industry Code",
        c."Credit Limit Amount"
      HAVING COUNT(DISTINCT t."Sales Txn Key") > 0
    `;
    const customers = await db.all(query);

    // Basic JS KMeans (for demo, not production scale)
    // We'll cluster on [recency, transaction_count, total_spend]
    const now = new Date();
    customers.forEach(c => {
      c.recency = (now - new Date(c.last_purchase_date)) / (1000 * 60 * 60 * 24);
    });
    const features = customers.map(c => [c.recency, c.transaction_count, c.total_spend]);
    // Simple kmeans: assign by quantiles for now (real kmeans would need a lib)
    const quantile = (arr, q) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const pos = (sorted.length - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
      } else {
        return sorted[base];
      }
    };
    const recencyQ = [quantile(features.map(f => f[0]), 0.33), quantile(features.map(f => f[0]), 0.66)];
    const freqQ = [quantile(features.map(f => f[1]), 0.33), quantile(features.map(f => f[1]), 0.66)];
    const valueQ = [quantile(features.map(f => f[2]), 0.33), quantile(features.map(f => f[2]), 0.66)];
    customers.forEach(c => {
      let seg = 0;
      if (c.recency <= recencyQ[0]) seg += 1;
      else if (c.recency <= recencyQ[1]) seg += 2;
      else seg += 3;
      if (c.transaction_count <= freqQ[0]) seg += 10;
      else if (c.transaction_count <= freqQ[1]) seg += 20;
      else seg += 30;
      if (c.total_spend <= valueQ[0]) seg += 100;
      else if (c.total_spend <= valueQ[1]) seg += 200;
      else seg += 300;
      c.segment = seg;
    });
    // Group by segment
    const segments = {};
    customers.forEach(c => {
      if (!segments[c.segment]) segments[c.segment] = [];
      segments[c.segment].push(c);
    });
    // Prepare segment summaries
    const segmentSummaries = Object.entries(segments).map(([segment, members]) => {
      return {
        segment,
        count: members.length,
        avg_order_value: members.reduce((a, b) => a + b.avg_order_value, 0) / members.length,
        avg_recency: members.reduce((a, b) => a + b.recency, 0) / members.length,
        avg_total_spend: members.reduce((a, b) => a + b.total_spend, 0) / members.length,
        customer_types: [...new Set(members.map(m => m.customer_type))],
        regions: [...new Set(members.map(m => m.region))],
      };
    });
    // KPIs
    const kpis = {
      totalSegments: segmentSummaries.length,
      largestSegment: segmentSummaries.reduce((a, b) => a.count > b.count ? a : b, segmentSummaries[0]),
      mostValuableSegment: segmentSummaries.reduce((a, b) => a.avg_total_spend > b.avg_total_spend ? a : b, segmentSummaries[0]),
      avgSegmentSize: customers.length / segmentSummaries.length,
    };
    // For scatter plot: use recency, transaction_count, total_spend, segment
    const scatterData = customers.map(c => ({
      x: c.recency,
      y: c.transaction_count,
      z: c.total_spend,
      segment: c.segment,
      customer_id: c.customer_id
    }));
    await db.close();
    res.status(200).json({
      status: 'success',
      segmentSummaries,
      kpis,
      scatterData,
      customers
    });
  } catch (error) {
    console.error('Error fetching customer segmentation data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer segmentation data',
      error: error.message
    });
  }
} 