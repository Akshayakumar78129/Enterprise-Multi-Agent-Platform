import { NextPurchaseQueries } from "../../../Customer/tools/next_purchase/database/queries.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queries = new NextPurchaseQueries();
    const filters = req.method === "POST" ? req.body : req.query;

    // Fetch all required data
    const [
      mainData,
      kpis,
      purchaseSequences,
      productAssociations,
      predictionData
    ] = await Promise.all([
      queries.getMainData(filters),
      queries.getKPIData(filters),
      queries.getPurchaseSequences(filters),
      queries.getProductAssociations(filters),
      queries.getPredictionData(filters)
    ]);

    // Structure response
    const response = {
      success: true,
      data: {
        mainData,
        kpis,
        purchaseSequences,
        productAssociations,
        predictionData,
        visualizationData: {
          confidenceMatrix: transformToConfidenceMatrix(predictionData),
          customerTimeline: transformToTimelineData(purchaseSequences),
          affinityNetwork: transformToNetworkData(productAssociations),
          purchaseTiming: transformToTimingData(predictionData)
        }
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(`Error in next-purchase API:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

// Data transformation functions
function transformToConfidenceMatrix(predictionData) {
  const products = ['M-3003', 'M-2001', 'R-4003', 'M-3004', 'M-3005'];
  const segments = ['High Value', 'Medium Value', 'Low Value', 'New Customer'];
  
  const matrix = segments.map(segment => ({
    segment,
    predictions: products.map(product => {
      const predictions = predictionData.filter(p => p.predicted_product === product);
      const avgConfidence = predictions.length > 0 
        ? predictions.reduce((sum, p) => sum + p.prediction_probability, 0) / predictions.length 
        : Math.random() * 0.5 + 0.2;
      
      return {
        product,
        confidence: Math.round(avgConfidence * 100) / 100,
        count: predictions.length
      };
    })
  }));
  
  return matrix;
}

function transformToTimelineData(purchaseSequences) {
  const customerGroups = {};
  
  purchaseSequences.forEach(purchase => {
    if (!customerGroups[purchase['Customer Key']]) {
      customerGroups[purchase['Customer Key']] = {
        customerId: purchase['Customer Key'],
        purchases: []
      };
    }
    
    customerGroups[purchase['Customer Key']].purchases.push({
      date: purchase['Txn Date'],
      category: purchase.product_category,
      amount: purchase['Sales Amount'],
      sequenceOrder: purchase.sequence_order,
      daysSinceLast: purchase.days_since_last
    });
  });
  
  // Return top 5 customers by purchase count
  return Object.values(customerGroups)
    .sort((a, b) => b.purchases.length - a.purchases.length)
    .slice(0, 5);
}

function transformToNetworkData(productAssociations) {
  const nodes = new Set();
  const links = [];
  
  productAssociations.forEach(assoc => {
    nodes.add(assoc.product_a);
    nodes.add(assoc.product_b);
    
    links.push({
      source: assoc.product_a,
      target: assoc.product_b,
      strength: assoc.association_strength,
      count: assoc.co_occurrence_count
    });
  });
  
  return {
    nodes: Array.from(nodes).map(node => ({
      id: node,
      category: node,
      size: Math.random() * 50 + 30 // Simulated size based on frequency
    })),
    links
  };
}

function transformToTimingData(predictionData) {
  return predictionData.map(prediction => ({
    customerId: prediction['Customer Key'],
    product: prediction.predicted_product,
    daysToPurchase: prediction.predicted_days_to_purchase,
    probability: prediction.prediction_probability,
    confidence: {
      min: Math.max(0, prediction.predicted_days_to_purchase - 10),
      max: prediction.predicted_days_to_purchase + 15
    }
  }));
} 