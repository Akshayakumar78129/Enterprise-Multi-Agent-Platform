/**
 * Internal API endpoint for Transaction Patterns date range
 * Uses integrated data service instead of external API
 */

const TransactionPatternsDataService = require('../services/dataService.js');

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const dataService = new TransactionPatternsDataService();
    
    console.log('🔍 Getting date range from integrated service...');
    
    const dateRange = await dataService.getDateRange();
    
    const response = {
      success: true,
      dateRange: dateRange,
      metadata: {
        query: 'Successfully retrieved date range from integrated service',
        timestamp: new Date().toISOString(),
        source: 'Integrated Data Service'
      }
    };

    console.log('✅ Date range response:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error getting date range:', error);
    
    // Fallback to known safe range
    const fallbackResponse = {
      success: false,
      error: error.message,
      dateRange: {
        minDate: '2017-01-01',
        maxDate: '2021-12-31',
        totalRecords: 0,
        uniqueCustomers: 0
      },
      metadata: {
        query: 'Fallback due to service error',
        timestamp: new Date().toISOString(),
        source: 'Fallback Data'
      }
    };

    res.status(200).json(fallbackResponse);
  }
}