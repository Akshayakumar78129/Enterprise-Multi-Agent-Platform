const TransactionPatternsDataService = require('../../../Customer/tools/transaction_patterns/services/dataService.js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dataService = new TransactionPatternsDataService();
    const { segments, categories } = await dataService.getSegmentsAndCategories();
    
    return res.status(200).json({
      success: true,
      segments,
      categories
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch segments and categories',
      message: error.message 
    });
  }
}