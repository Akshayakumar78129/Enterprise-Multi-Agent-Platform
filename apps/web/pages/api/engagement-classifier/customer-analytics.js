import { EngagementClassifierQueries } from "../../../Customer/tools/engagement_classifier/database/queries.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { customerKey } = req.body;
    
    if (!customerKey) {
      return res.status(400).json({ error: "Customer key is required" });
    }

    const queries = new EngagementClassifierQueries();
    
    // Get customer analytics data
    const analytics = await queries.getCustomerAnalytics(customerKey);

    res.status(200).json({
      success: true,
      analytics: analytics
    });
  } catch (error) {
    console.error(`Error in customer-analytics API:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
}