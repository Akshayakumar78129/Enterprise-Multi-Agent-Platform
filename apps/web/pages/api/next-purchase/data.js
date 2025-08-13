import { NextPurchaseQueries } from "../../../Customer/tools/next_purchase/database/queries.js";
// Extended handler: enriches response with category performance & revenue series

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

    // Derive category performance (top categories by revenue)
    const categoryAggregates = {};
    const totalRevenue = mainData.reduce((acc, row) => {
      const cat = row.product_category || 'UNKNOWN';
      const rev = Number(row['Sales Amount']) || 0;
      if (!categoryAggregates[cat]) {
        categoryAggregates[cat] = {
          category: cat,
            revenue: 0,
            orders: 0,
            customers: new Set(),
            repeatCustomers: new Set(),
            customerPurchaseCounts: {},
            revenueBuckets: [] // for time series later
        };
      }
      const bucket = categoryAggregates[cat];
      bucket.revenue += rev;
      bucket.orders += 1;
      bucket.customers.add(row['Customer Key']);
      bucket.customerPurchaseCounts[row['Customer Key']] = (bucket.customerPurchaseCounts[row['Customer Key']] || 0) + 1;
      return acc + rev;
    }, 0);

    // Build time buckets (monthly) for sparkline / series (last 6 months or distinct month count)
    mainData.forEach(r => {
      const cat = r.product_category || 'UNKNOWN';
      const date = new Date(r['Txn Date']);
      if (isNaN(date.getTime())) return;
      const label = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      const rev = Number(r['Sales Amount']) || 0;
      const agg = categoryAggregates[cat];
      if (!agg) return;
      let bucket = agg.revenueBuckets.find(b => b.label === label);
      if (!bucket) { bucket = { label, revenue: 0 }; agg.revenueBuckets.push(bucket); }
      bucket.revenue += rev;
    });

    Object.values(categoryAggregates).forEach(cat => {
      Object.entries(cat.customerPurchaseCounts).forEach(([cust, count]) => {
        if (count > 1) cat.repeatCustomers.add(cust);
      });
    });

    // Compute growth metrics using simple heuristic: compare last month vs previous month
    const categoryPerformance = Object.values(categoryAggregates).map(cat => {
      // Sort buckets chronologically
      cat.revenueBuckets.sort((a,b)=> a.label.localeCompare(b.label));
      const buckets = cat.revenueBuckets;
      const last = buckets[buckets.length - 1]?.revenue || 0;
      const prev = buckets[buckets.length - 2]?.revenue || 0;
      const growthAbs = last - prev;
      const growthPercent = prev === 0 ? (last > 0 ? 100 : 0) : Math.round(((growthAbs) / prev) * 100);
      const repeatRate = cat.customers.size === 0 ? 0 : Math.round((cat.repeatCustomers.size / cat.customers.size) * 100);
      return {
        category: cat.category,
        revenue: Math.round(cat.revenue),
        revenueShare: totalRevenue === 0 ? 0 : +( (cat.revenue / totalRevenue) * 100 ).toFixed(1),
        orders: cat.orders,
        customers: cat.customers.size,
        repeatRate,
        growthPercent,
        growthAbs: Math.round(growthAbs)
      };
    })
      .sort((a,b)=> b.revenue - a.revenue)
      .slice(0, 12);

    const categoryRevenueSeries = categoryPerformance.map(cat => {
      const rawBuckets = categoryAggregates[cat.category].revenueBuckets
        .sort((a,b)=> a.label.localeCompare(b.label))
        .slice(-8); // last 8 periods for sparkline
      return {
        category: cat.category,
        points: rawBuckets.map(b => ({ period: b.label, revenue: Math.round(b.revenue) }))
      };
    });

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
          purchaseTiming: transformToTimingData(predictionData),
          categoryPerformance,
          categoryRevenueSeries
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
        : 0; // no synthetic randomness – reflect absence of data
      
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
  const nodeWeights = {}; // accumulate co-occurrence counts to size nodes deterministically
  
  productAssociations.forEach(assoc => {
    nodes.add(assoc.product_a);
    nodes.add(assoc.product_b);
    
    links.push({
      source: assoc.product_a,
      target: assoc.product_b,
      strength: assoc.association_strength,
      count: assoc.co_occurrence_count
    });
    nodeWeights[assoc.product_a] = (nodeWeights[assoc.product_a] || 0) + (assoc.co_occurrence_count || 0);
    nodeWeights[assoc.product_b] = (nodeWeights[assoc.product_b] || 0) + (assoc.co_occurrence_count || 0);
  });
  // derive min/max for scaling
  const weights = Object.values(nodeWeights);
  const minW = weights.length ? Math.min(...weights) : 0;
  const maxW = weights.length ? Math.max(...weights) : 1;
  const scale = (w) => {
    if (maxW === minW) return 40; // uniform
    // map weight to 28..70 px radius range
    return 28 + ((w - minW) / (maxW - minW)) * 42;
  };
  
  return {
    nodes: Array.from(nodes).map(node => ({
      id: node,
      category: node,
      size: scale(nodeWeights[node] || 0)
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