import { RetentionPlannerQueries } from "../../../Customer/tools/retention_planner/database/queries.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queries = new RetentionPlannerQueries();
    const filters = req.method === "POST" ? req.body : req.query;

    // Parse filters
    const parsedFilters = {
      customer_segments: filters.customer_segments ? 
        (Array.isArray(filters.customer_segments) ? filters.customer_segments : [filters.customer_segments]) : 
        null,
      churn_risk_threshold: filters.churn_risk_threshold ? parseFloat(filters.churn_risk_threshold) : 0.5,
      dateRange: filters.dateRange || null
    };

    // Fetch all required data in parallel
    const [
      customerData,
      kpis,
      retentionActions,
      segmentPlaybooks,
      roiProjection
    ] = await Promise.all([
      queries.getCustomerData(parsedFilters),
      queries.getKPIData(parsedFilters),
      queries.getRetentionActionsData(parsedFilters),
      queries.getSegmentPlaybooks(parsedFilters),
      queries.getRoiProjectionData(parsedFilters)
    ]);

    // Calculate additional metrics for visualizations
    const churnRiskDistribution = calculateChurnRiskDistribution(customerData);
    const valueRiskMatrix = calculateValueRiskMatrix(customerData);
    const actionAllocation = calculateActionAllocation(retentionActions);

    // Structure response
    const response = {
      success: true,
      data: {
        customerData,
        kpis: {
          ...kpis,
          actionCount: retentionActions.length,
          expectedEffectiveness: calculateOverallEffectiveness(retentionActions),
          totalROI: calculateTotalROI(roiProjection)
        },
        visualizations: {
          churnRiskDistribution,
          valueRiskMatrix,
          actionAllocation,
          roiProjection
        },
        segmentPlaybooks,
        retentionActions
      },
      filters: parsedFilters
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(`Error in retention-planner API:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
}

function calculateChurnRiskDistribution(customerData) {
  const risks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const distribution = [];

  for (let i = 0; i < risks.length - 1; i++) {
    const min = risks[i];
    const max = risks[i + 1];
    const count = customerData.filter(customer => {
      const risk = customer.churn_indicator === 1 ? 0.8 : 0.2; // Simple risk calculation
      return risk >= min && risk < max;
    }).length;

    distribution.push({
      range: `${min}-${max}`,
      count,
      percentage: customerData.length > 0 ? (count / customerData.length) * 100 : 0
    });
  }

  return distribution;
}

function calculateValueRiskMatrix(customerData) {
  const quadrants = {
    highValueLowRisk: [],
    highValueHighRisk: [],
    lowValueLowRisk: [],
    lowValueHighRisk: []
  };

  customerData.forEach(customer => {
    const risk = customer.churn_indicator === 1 ? 0.8 : 0.2;
    const isHighRisk = risk > 0.5;
    const isHighValue = customer.customer_value === 'High';

    if (isHighValue && !isHighRisk) {
      quadrants.highValueLowRisk.push({
        id: customer["Customer Key"],
        name: customer["Customer Name"],
        value: customer.customer_value,
        risk: risk,
        recency: customer["Days Since Last Activity"]
      });
    } else if (isHighValue && isHighRisk) {
      quadrants.highValueHighRisk.push({
        id: customer["Customer Key"],
        name: customer["Customer Name"],
        value: customer.customer_value,
        risk: risk,
        recency: customer["Days Since Last Activity"]
      });
    } else if (!isHighValue && !isHighRisk) {
      quadrants.lowValueLowRisk.push({
        id: customer["Customer Key"],
        name: customer["Customer Name"],
        value: customer.customer_value,
        risk: risk,
        recency: customer["Days Since Last Activity"]
      });
    } else {
      quadrants.lowValueHighRisk.push({
        id: customer["Customer Key"],
        name: customer["Customer Name"],
        value: customer.customer_value,
        risk: risk,
        recency: customer["Days Since Last Activity"]
      });
    }
  });

  return quadrants;
}

function calculateActionAllocation(retentionActions) {
  const segments = ['High', 'Medium', 'Low'];
  const actions = [
    'Premium package',
    'Loyalty upgrade', 
    'Standard package',
    'Targeted discount',
    'Basic offer',
    'Standard comm',
    'No action needed'
  ];

  const flows = [];
  
  retentionActions.forEach(action => {
    flows.push({
      source: action.customer_value,
      target: action.recommended_action,
      value: action.customer_count,
      effectiveness: action.expected_effectiveness
    });
  });

  return {
    nodes: [
      ...segments.map(segment => ({ id: segment, type: 'segment' })),
      ...actions.map(action => ({ id: action, type: 'action' }))
    ],
    links: flows
  };
}

function calculateOverallEffectiveness(retentionActions) {
  if (retentionActions.length === 0) return 0;
  
  const totalCustomers = retentionActions.reduce((sum, action) => sum + action.customer_count, 0);
  const weightedEffectiveness = retentionActions.reduce((sum, action) => 
    sum + (action.expected_effectiveness * action.customer_count), 0);
  
  return totalCustomers > 0 ? Math.round((weightedEffectiveness / totalCustomers) * 100) : 0;
}

function calculateTotalROI(roiProjection) {
  if (roiProjection.length === 0) return 0;
  
  const totalCost = roiProjection.reduce((sum, item) => sum + item.total_cost, 0);
  const totalBenefit = roiProjection.reduce((sum, item) => sum + item.total_benefit, 0);
  
  return totalCost > 0 ? Math.round(((totalBenefit - totalCost) / totalCost) * 100) : 0;
} 