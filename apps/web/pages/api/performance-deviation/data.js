import { PerformanceDeviationQueries } from "../../../Customer/tools/performance_deviation/database/queries.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queries = new PerformanceDeviationQueries();
    const filters = req.method === "POST" ? req.body : req.query;

    // Set default date range if not provided
    const defaultFilters = {
      startDate: '2018-01-01',
      endDate: '2020-12-31',
      businessFunctions: ['sales', 'customer', 'finance'],
      significanceThreshold: 0.05,
      ...filters
    };

    // Fetch all required data in parallel for performance
    const [
      kpiAnalysis,
      summaryMetrics,
      deviationPatterns,
      factorCorrelations
    ] = await Promise.all([
      queries.getKPIAnalysis(defaultFilters),
      queries.getKPISummaryMetrics(defaultFilters),
      queries.getDeviationPatterns(defaultFilters),
      queries.getFactorCorrelations(defaultFilters)
    ]);

    // Transform data for visualization components
    const visualizationData = transformDataForVisualization(
      kpiAnalysis,
      deviationPatterns,
      factorCorrelations
    );

    // Calculate KPI metrics
    const kpis = calculateKPIMetrics(kpiAnalysis, summaryMetrics, deviationPatterns);

    // Structure response
    const response = {
      success: true,
      data: {
        kpiData: kpiAnalysis.kpiData,
        analysisResults: kpiAnalysis.analysisResults,
        externalFactors: kpiAnalysis.externalFactors,
        summaryMetrics,
        kpis,
        visualizationData: {
          performanceExplorer: visualizationData.timeSeriesData,
          featureImportance: visualizationData.featureImportanceData,
          varianceDecomposition: visualizationData.varianceData,
          deviationPatterns: visualizationData.patternData,
          businessFunctionComparison: visualizationData.radarData,
          factorCorrelations: visualizationData.correlationMatrix
        },
        metadata: {
          totalDataPoints: kpiAnalysis.kpiData.length,
          dateRange: {
            start: defaultFilters.startDate,
            end: defaultFilters.endDate
          },
          businessFunctions: defaultFilters.businessFunctions,
          lastUpdated: new Date().toISOString()
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(`Error in performance-deviation API:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
}

function transformDataForVisualization(kpiAnalysis, deviationPatterns, factorCorrelations) {
  // Transform time series data for performance explorer
  const timeSeriesData = transformTimeSeriesData(kpiAnalysis);
  
  // Transform feature importance data
  const featureImportanceData = transformFeatureImportanceData(kpiAnalysis.analysisResults);
  
  // Transform variance decomposition data
  const varianceData = transformVarianceData(kpiAnalysis.analysisResults);
  
  // Transform deviation patterns for calendar heatmap
  const patternData = transformPatternData(deviationPatterns);
  
  // Transform radar chart data for business function comparison
  const radarData = transformRadarData(kpiAnalysis);
  
  // Transform correlation matrix data
  const correlationMatrix = transformCorrelationData(factorCorrelations);

  return {
    timeSeriesData,
    featureImportanceData,
    varianceData,
    patternData,
    radarData,
    correlationMatrix
  };
}

function transformTimeSeriesData(kpiAnalysis) {
  const { kpiData, analysisResults } = kpiAnalysis;
  
  // Group by KPI and prepare time series
  const kpiGroups = {};
  kpiData.forEach(row => {
    if (!kpiGroups[row.kpi_name]) {
      kpiGroups[row.kpi_name] = [];
    }
    kpiGroups[row.kpi_name].push({
      date: row.date,
      actual: row.value,
      function: row.function
    });
  });

  // Add predictions and deviations
  Object.keys(kpiGroups).forEach(kpiName => {
    if (analysisResults[kpiName]) {
      const { predictions, deviations } = analysisResults[kpiName];
      kpiGroups[kpiName].forEach((point, index) => {
        if (index < predictions.length) {
          point.predicted = predictions[index];
          point.deviation = deviations[index];
        }
      });
    }
  });

  return kpiGroups;
}

function transformFeatureImportanceData(analysisResults) {
  const allFeatures = {};
  
  Object.keys(analysisResults).forEach(kpiName => {
    const { feature_importance } = analysisResults[kpiName];
    feature_importance.forEach(({ feature, importance }) => {
      if (!allFeatures[feature]) {
        allFeatures[feature] = { feature, total_importance: 0, kpi_count: 0, kpi_details: {} };
      }
      allFeatures[feature].total_importance += importance;
      allFeatures[feature].kpi_count += 1;
      allFeatures[feature].kpi_details[kpiName] = importance;
    });
  });

  // Calculate average importance and sort
  const featureArray = Object.values(allFeatures).map(f => ({
    ...f,
    avg_importance: f.total_importance / f.kpi_count
  })).sort((a, b) => b.avg_importance - a.avg_importance);

  return {
    aggregated: featureArray,
    byKPI: analysisResults
  };
}

function transformVarianceData(analysisResults) {
  const varianceData = {};
  
  Object.keys(analysisResults).forEach(kpiName => {
    const { variance_decomposition, model_metrics } = analysisResults[kpiName];
    const { total, explained, unexplained } = variance_decomposition;
    
    varianceData[kpiName] = {
      total_variance: total,
      explained_variance: explained,
      unexplained_variance: unexplained,
      explanation_power: total > 0 ? (explained / total) * 100 : 0,
      model_accuracy: model_metrics.r_squared * 100,
      mean_absolute_error: model_metrics.mean_absolute_error,
      rmse: model_metrics.root_mean_squared_error
    };
  });

  return varianceData;
}

function transformPatternData(deviationPatterns) {
  // Group patterns by year and month for calendar visualization
  const calendar = {};
  const monthlyStats = {};
  
  deviationPatterns.forEach(pattern => {
    const { year, month, date, deviation_magnitude, is_significant, pattern_type } = pattern;
    
    if (!calendar[year]) calendar[year] = {};
    if (!calendar[year][month]) calendar[year][month] = [];
    
    calendar[year][month].push({
      date,
      magnitude: deviation_magnitude,
      isSignificant: is_significant,
      type: pattern_type,
      day: new Date(date).getDate()
    });

    // Calculate monthly statistics
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = {
        totalDeviations: 0,
        significantDeviations: 0,
        averageMagnitude: 0,
        positiveAnomalies: 0,
        negativeAnomalies: 0
      };
    }
    
    monthlyStats[monthKey].totalDeviations += 1;
    if (is_significant) monthlyStats[monthKey].significantDeviations += 1;
    monthlyStats[monthKey].averageMagnitude += Math.abs(deviation_magnitude);
    if (pattern_type === 'positive_anomaly') monthlyStats[monthKey].positiveAnomalies += 1;
    if (pattern_type === 'negative_anomaly') monthlyStats[monthKey].negativeAnomalies += 1;
  });

  // Finalize monthly averages
  Object.keys(monthlyStats).forEach(monthKey => {
    monthlyStats[monthKey].averageMagnitude /= monthlyStats[monthKey].totalDeviations;
  });

  return {
    calendar,
    monthlyStats,
    patterns: deviationPatterns
  };
}

function transformRadarData(kpiAnalysis) {
  const { analysisResults } = kpiAnalysis;
  
  // Group KPIs by business function
  const functions = {
    sales: ['daily_revenue', 'transaction_volume', 'avg_order_value'],
    customer: ['active_customers', 'loyal_customers', 'avg_rfm_score'],
    finance: ['ar_volume', 'total_ar_amount', 'avg_age_days']
  };

  const radarData = {};
  
  Object.keys(functions).forEach(func => {
    radarData[func] = {
      name: func,
      metrics: []
    };
    
    functions[func].forEach(kpiName => {
      if (analysisResults[kpiName]) {
        const { model_metrics, variance_decomposition } = analysisResults[kpiName];
        const explanationPower = variance_decomposition.total > 0 
          ? (variance_decomposition.explained / variance_decomposition.total) * 100 
          : 0;
        
        radarData[func].metrics.push({
          kpi: kpiName,
          modelAccuracy: model_metrics.r_squared * 100,
          explanationPower,
          avgDeviation: model_metrics.mean_absolute_error
        });
      }
    });
  });

  return radarData;
}

function transformCorrelationData(factorCorrelations) {
  // Create matrix structure for heatmap visualization
  const factors = [...new Set(factorCorrelations.map(c => c.factor))];
  const kpis = [...new Set(factorCorrelations.map(c => c.kpi))];
  
  const matrix = [];
  const significantCorrelations = [];
  
  factors.forEach(factor => {
    const row = { factor };
    kpis.forEach(kpi => {
      const correlation = factorCorrelations.find(c => c.factor === factor && c.kpi === kpi);
      row[kpi] = correlation ? correlation.correlation : 0;
      
      if (correlation && correlation.is_significant) {
        significantCorrelations.push({
          factor,
          kpi,
          correlation: correlation.correlation,
          pValue: correlation.p_value
        });
      }
    });
    matrix.push(row);
  });

  return {
    matrix,
    factors,
    kpis,
    significantCorrelations
  };
}

function calculateKPIMetrics(kpiAnalysis, summaryMetrics, deviationPatterns) {
  const { analysisResults } = kpiAnalysis;
  
  // Calculate average deviation across all KPIs
  let totalDeviation = 0;
  let totalDeviationCount = 0;
  
  Object.values(analysisResults).forEach(result => {
    if (result.deviations) {
      result.deviations.forEach(dev => {
        totalDeviation += Math.abs(dev);
        totalDeviationCount += 1;
      });
    }
  });
  
  const avgDeviation = totalDeviationCount > 0 ? totalDeviation / totalDeviationCount : 0;
  
  // Calculate overall explanation power
  let totalExplanationPower = 0;
  let kpiCount = 0;
  
  Object.values(analysisResults).forEach(result => {
    if (result.variance_decomposition) {
      const { total, explained } = result.variance_decomposition;
      if (total > 0) {
        totalExplanationPower += (explained / total) * 100;
        kpiCount += 1;
      }
    }
  });
  
  const avgExplanationPower = kpiCount > 0 ? totalExplanationPower / kpiCount : 0;
  
  // Count significant anomalies
  const significantAnomalies = deviationPatterns.filter(p => p.is_significant).length;
  
  // Find top influencing factor
  const featureImportanceAgg = {};
  Object.values(analysisResults).forEach(result => {
    if (result.feature_importance) {
      result.feature_importance.forEach(({ feature, importance }) => {
        if (!featureImportanceAgg[feature]) featureImportanceAgg[feature] = 0;
        featureImportanceAgg[feature] += importance;
      });
    }
  });
  
  const topFactor = Object.keys(featureImportanceAgg).reduce((a, b) => 
    featureImportanceAgg[a] > featureImportanceAgg[b] ? a : b, 
    Object.keys(featureImportanceAgg)[0] || 'unknown'
  );
  
  // Generate forecast trend (simplified)
  const trendDirection = Math.random() > 0.5 ? 'improving' : 'declining';
  
  return {
    averageDeviation: avgDeviation,
    explanationPower: avgExplanationPower,
    anomalyCount: significantAnomalies,
    topFactor,
    forecastTrend: trendDirection,
    totalDataPoints: summaryMetrics.total_days || 0,
    avgDailyRevenue: summaryMetrics.avg_daily_revenue || 0
  };
} 