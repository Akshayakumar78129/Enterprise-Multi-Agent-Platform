import { NextApiRequest, NextApiResponse } from 'next';

interface CollectionForecast {
  date: string;
  predictedAmount: number;
  upperBound: number;
  lowerBound: number;
  confidence: number;
}

function generateCollectionForecast(scenario: string, wacc: number): CollectionForecast[] {
  const baseCollectionRate = scenario === 'optimistic' ? 0.85 : scenario === 'conservative' ? 0.65 : 0.75;
  const volatility = scenario === 'optimistic' ? 0.1 : scenario === 'conservative' ? 0.25 : 0.15;
  
  const forecast: CollectionForecast[] = [];
  const periods = [
    { label: 'Week 1', days: 7 },
    { label: 'Week 2', days: 14 },
    { label: 'Week 3', days: 21 },
    { label: 'Week 4', days: 28 },
    { label: 'Month 2', days: 56 },
    { label: 'Month 3', days: 84 }
  ];

  // Simulate outstanding AR amounts in different aging buckets
  const arBuckets = [
    { range: '0-30', amount: 15000000, collectionRate: 0.95 },
    { range: '31-45', amount: 8000000, collectionRate: 0.80 },
    { range: '46-60', amount: 5000000, collectionRate: 0.65 },
    { range: '61-90', amount: 3000000, collectionRate: 0.45 },
    { range: '90+', amount: 2000000, collectionRate: 0.25 }
  ];

  const totalAR = arBuckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  
  periods.forEach((period, index) => {
    // Calculate collection probability decay over time
    const timeDecayFactor = Math.exp(-index * 0.15);
    
    // Calculate predicted collections from each bucket
    let predictedAmount = 0;
    arBuckets.forEach(bucket => {
      const periodCollectionRate = bucket.collectionRate * baseCollectionRate * timeDecayFactor;
      const bucketCollection = bucket.amount * periodCollectionRate * (1 / periods.length);
      predictedAmount += bucketCollection;
    });

    // Add some seasonality and randomness
    const seasonalFactor = 1 + 0.1 * Math.sin((index + 1) * Math.PI / 6);
    predictedAmount *= seasonalFactor;

    // Calculate confidence bounds
    const confidenceLevel = Math.max(60, 90 - index * 5); // Decreasing confidence over time
    const standardError = predictedAmount * volatility;
    const marginOfError = standardError * 1.96; // 95% confidence interval

    forecast.push({
      date: period.label,
      predictedAmount: Math.round(predictedAmount),
      upperBound: Math.round(predictedAmount + marginOfError),
      lowerBound: Math.round(Math.max(0, predictedAmount - marginOfError)),
      confidence: confidenceLevel
    });
  });

  return forecast;
}

function applyMachineLearningAdjustments(forecast: CollectionForecast[], wacc: number): CollectionForecast[] {
  // Simulate ML model adjustments based on:
  // - Historical payment patterns
  // - Economic indicators
  // - Customer behavior analysis
  // - Seasonal trends
  
  return forecast.map((item, index) => {
    // Economic adjustment factor (higher WACC might indicate economic stress)
    const economicFactor = wacc > 12 ? 0.95 : wacc < 8 ? 1.05 : 1.0;
    
    // Customer behavior patterns (simulated)
    const behaviorFactor = 1 + (Math.random() - 0.5) * 0.1; // ±5% adjustment
    
    // Industry benchmark adjustment
    const benchmarkFactor = 0.98; // Slight conservative adjustment
    
    const adjustedAmount = item.predictedAmount * economicFactor * behaviorFactor * benchmarkFactor;
    const adjustmentRatio = adjustedAmount / item.predictedAmount;
    
    return {
      ...item,
      predictedAmount: Math.round(adjustedAmount),
      upperBound: Math.round(item.upperBound * adjustmentRatio),
      lowerBound: Math.round(item.lowerBound * adjustmentRatio),
      confidence: Math.max(50, item.confidence - Math.abs(adjustmentRatio - 1) * 100) // Reduce confidence if adjustment is large
    };
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { scenario = 'realistic', wacc = 10 } = req.body;

    // Validate inputs
    if (!['optimistic', 'realistic', 'conservative'].includes(scenario)) {
      return res.status(400).json({ error: 'Invalid scenario. Must be optimistic, realistic, or conservative' });
    }

    if (wacc < 0 || wacc > 50) {
      return res.status(400).json({ error: 'WACC must be between 0 and 50' });
    }

    // Generate base forecast
    let forecast = generateCollectionForecast(scenario, wacc);
    
    // Apply ML-based adjustments
    forecast = applyMachineLearningAdjustments(forecast, wacc);

    // Add metadata
    const response = {
      forecast,
      scenario,
      parameters: {
        wacc,
        generatedAt: new Date().toISOString(),
        modelVersion: '2.1.0'
      },
      summary: {
        totalPredicted: forecast.reduce((sum, item) => sum + item.predictedAmount, 0),
        avgConfidence: forecast.reduce((sum, item) => sum + item.confidence, 0) / forecast.length,
        forecastHorizon: '90 days'
      },
      recommendations: [
        'Focus collection efforts on 30-45 day aging bucket for optimal returns',
        'Implement early payment discounts to accelerate cash conversion',
        'Consider collection agency for accounts 90+ days past due',
        'Review credit terms for customers showing payment deterioration'
      ]
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Collection Forecast API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate collection forecast',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}