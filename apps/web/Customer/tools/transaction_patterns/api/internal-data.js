/**
 * Internal API endpoint for Transaction Patterns Dashboard
 * Uses integrated data service instead of external API
 */

const TransactionPatternsDataService = require('../services/dataService.js');

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const dataService = new TransactionPatternsDataService();
    const filters = req.method === "POST" ? req.body : req.query;

    console.log('🔍 Transaction Patterns: Processing request with filters:', filters);

    // Get the transaction data
    const data = await dataService.getTransactionData(filters);

    console.log('✅ Transaction Patterns: Data processed successfully');

    const response = {
      success: true,
      data: data,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'Integrated Data Service',
        filters: filters
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Transaction Patterns API Error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
}