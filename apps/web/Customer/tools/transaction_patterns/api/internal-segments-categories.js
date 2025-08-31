/**
 * Internal API endpoint for Transaction Patterns segments and categories
 * Uses integrated data service instead of external API
 */

const TransactionPatternsDataService = require('../services/dataService.js');

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const dataService = new TransactionPatternsDataService();
    
    console.log('🔍 Getting segments and categories from integrated service...');
    
    const { segments, categories } = await dataService.getSegmentsAndCategories();
    
    const response = {
      success: true,
      segments,
      categories
    };

    console.log('✅ Segments and categories response:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error getting segments and categories:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}