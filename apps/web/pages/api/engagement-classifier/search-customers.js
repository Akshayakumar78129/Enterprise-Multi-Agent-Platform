import { EngagementClassifierQueries } from "../../../Customer/tools/engagement_classifier/database/queries.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { searchTerm } = req.body;
    
    if (!searchTerm || searchTerm.length < 2) {
      return res.status(400).json({ error: "Search term must be at least 2 characters" });
    }

    const queries = new EngagementClassifierQueries();
    
    // Search for customers by name or number
    const customers = await queries.searchCustomers(searchTerm);

    res.status(200).json({
      success: true,
      customers: customers,
      count: customers.length
    });
  } catch (error) {
    console.error(`Error in search-customers API:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
}