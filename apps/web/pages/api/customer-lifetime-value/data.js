import { CustomerLifetimeValueQueries } from "../../../Customer/tools/customer_lifetime_value/database/queries.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queries = new CustomerLifetimeValueQueries();
    const filters = req.method === "POST" ? req.body : req.query;

    // Parse filters
    const parsedFilters = {
      ...filters,
      region: filters.region ? (Array.isArray(filters.region) ? filters.region : [filters.region]) : undefined,
      customerType: filters.customerType ? (Array.isArray(filters.customerType) ? filters.customerType : [filters.customerType]) : undefined,
    };

    // Fetch all data in parallel for performance
    const [
      mainData,
      kpis,
      ltvDistribution,
      predictionAccuracy,
      geographicValue,
      customerExplorer,
      valueContribution,
      ltvOverTime
    ] = await Promise.all([
      queries.getMainData(parsedFilters),
      queries.getKPIData(parsedFilters),
      queries.getLTVDistributionData(parsedFilters),
      queries.getPredictionAccuracyData(parsedFilters),
      queries.getGeographicValueData(parsedFilters),
      queries.getCustomerValueExplorer({...parsedFilters, limit: 20}),
      queries.getValueContributionData(parsedFilters),
      queries.getLTVOverTimeData(parsedFilters)
    ]);

    // Calculate additional KPI metrics from the main data
    const totalCustomers = mainData.length;
    const totalLTV = mainData.reduce((sum, customer) => sum + (customer.calculated_ltv || 0), 0);
    const avgTransactionCount = mainData.reduce((sum, customer) => sum + (customer.transaction_count || 0), 0) / totalCustomers;

    // Calculate model accuracy metrics from prediction data
    const accuracyMetrics = predictionAccuracy.reduce((acc, customer) => {
      acc.totalError += customer.percentage_error || 0;
      acc.lowErrorCount += customer.error_category === 'Low' ? 1 : 0;
      acc.mediumErrorCount += customer.error_category === 'Medium' ? 1 : 0;
      acc.highErrorCount += customer.error_category === 'High' ? 1 : 0;
      return acc;
    }, { totalError: 0, lowErrorCount: 0, mediumErrorCount: 0, highErrorCount: 0 });

    const avgPredictionError = accuracyMetrics.totalError / predictionAccuracy.length;
    const predictionAccuracyScore = Math.max(0, 100 - avgPredictionError);

    // Enhanced KPIs with calculated metrics
    const enhancedKpis = {
      ...kpis,
      total_ltv: totalLTV,
      avg_transaction_count: Math.round(avgTransactionCount),
      prediction_accuracy_score: Math.round(predictionAccuracyScore),
      model_confidence: predictionAccuracyScore >= 85 ? 'High' : predictionAccuracyScore >= 70 ? 'Medium' : 'Low',
      low_error_customers: accuracyMetrics.lowErrorCount,
      medium_error_customers: accuracyMetrics.mediumErrorCount,
      high_error_customers: accuracyMetrics.highErrorCount
    };

    // Structure the complete response
    const response = {
      success: true,
      data: {
        mainData: mainData.slice(0, 100), // Limit main data for performance
        kpis: enhancedKpis,
        ltvDistribution,
        predictionAccuracy: predictionAccuracy.slice(0, 50), // Sample for visualization
        geographicValue,
        customerExplorer,
        valueContribution,
        ltvOverTime,
        metadata: {
          totalCustomers,
          dataFetched: new Date().toISOString(),
          filtersApplied: parsedFilters,
          avgPredictionError: Math.round(avgPredictionError * 100) / 100,
          predictionAccuracyScore: Math.round(predictionAccuracyScore)
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in customer-lifetime-value API:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
} 