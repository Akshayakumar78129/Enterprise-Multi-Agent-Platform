import QueriesModule from "../../../Customer/tools/engagement_classifier/database/queries.js";
const { EngagementClassifierQueries } = QueriesModule;

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queries = new EngagementClassifierQueries();
    const rawFilters = req.method === "POST" ? req.body : req.query;

    // Normalize filters so array-like fields are always arrays
    const toArray = (v) => {
      if (v === undefined || v === null || v === "") return undefined;
      return Array.isArray(v) ? v : [v];
    };

    const filters = {
      ...rawFilters,
      engagementLevels: toArray(rawFilters?.engagementLevels),
      loyaltyStatus: toArray(rawFilters?.loyaltyStatus)
    };

    console.log('🔍 Engagement Classifier API - Filters received:', rawFilters);
    console.log('🔍 Engagement Classifier API - Filters normalized:', filters);
    console.log('🔍 Engagement Levels specifically:', filters.engagementLevels);

    // Fetch all required data in parallel
    const [
      engagementData,
      kpis,
      engagementDistribution,
      rfmAnalysis,
      reengagementOpportunities,
      engagementTimeline
    ] = await Promise.all([
      queries.getEngagementData(filters),
      queries.getKPIData(filters),
      queries.getEngagementDistribution(filters), // Use same filtered data for pyramid
      queries.getRFMAnalysis(filters),
      queries.getReengagementOpportunities(filters),
      queries.getEngagementTimeline(filters)
    ]);

    console.log('Engagement Classifier API - Data fetched successfully');
    console.log('KPIs:', kpis);
    console.log('Distribution:', engagementDistribution);

    // Structure response according to the specification
    const response = {
      success: true,
      data: {
        // Raw customer data
        customers: engagementData,
        
        // KPI data for tiles
        kpis: {
          total_customers: kpis.total_customers,
          avg_engagement_score: kpis.avg_engagement_score,
          avg_days_since_activity: kpis.avg_days_since_activity,
          engagement_trend: kpis.engagement_trend,
          reengagement_opportunities: kpis.reengagement_opportunities,
          engagement_distribution: kpis.engagement_distribution
        },
        
        // Engagement distribution for pyramid visualization
        distribution: engagementDistribution,
        
        // RFM analysis for component breakdown
        rfm_analysis: rfmAnalysis,
        
        // Re-engagement opportunities for opportunity finder
        opportunities: reengagementOpportunities,
        
        // Timeline data for temporal analysis
        timeline: engagementTimeline,
        
        // Summary metrics
        summary: {
          total_customers: kpis.total_customers,
          high_engagement: kpis.engagement_distribution.high,
          medium_engagement: kpis.engagement_distribution.medium,
          low_engagement: kpis.engagement_distribution.low,
          avg_purchase_value: kpis.avg_purchase_value,
          avg_transaction_frequency: kpis.avg_transaction_frequency
        }
      },
      timestamp: new Date().toISOString(),
      filters_applied: filters,
      debug: {
        db_path: queries.dbPath,
        kpis_raw: kpis
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(`Error in engagement-classifier API:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
} 