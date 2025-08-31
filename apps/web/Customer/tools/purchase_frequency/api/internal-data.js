/**
 * Internal API endpoint for Purchase Frequency Dashboard
 * Uses integrated data service instead of external API
 */

const PurchaseFrequencyDataService = require('../services/dataService.js');

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const dataService = new PurchaseFrequencyDataService();
    const filters = req.method === "POST" ? req.body : req.query;

    console.log('🔍 Purchase Frequency: Processing request with filters:', filters);

    // Get the complete purchase frequency data
    const result = await dataService.getCompleteData(filters);

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log('✅ Purchase Frequency: Data processed successfully');
    console.log('📊 KPIs:', result.data.kpis);
    console.log('👥 Customer Segments:', result.data.customerSegments?.length);
    console.log('💰 Value Segments:', result.data.valueSegments?.length);

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Purchase Frequency API Error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
}