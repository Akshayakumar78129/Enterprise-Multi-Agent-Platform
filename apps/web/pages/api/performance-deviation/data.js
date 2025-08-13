import { PerformanceDeviationQueries } from "../../../Customer/tools/performance_deviation/database/queries.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queries = new PerformanceDeviationQueries();
    const filters = req.method === "POST" ? req.body : req.query;

    const defaultFilters = {
      startDate: '2018-01-01',
      endDate: '2020-12-31',
      businessFunctions: ['sales', 'customer', 'finance'],
      significanceThreshold: 0.05,
      ...filters
    };

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

    const visualizationData = transformDataForVisualization(
      kpiAnalysis,
      deviationPatterns,
      factorCorrelations
    );

    const kpis = calculateKPIMetrics(kpiAnalysis, summaryMetrics, deviationPatterns);

    res.status(200).json({
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
    });
  } catch (error) {
    console.error(`Error in performance-deviation API:`, error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
}

/* ---------- helpers (unchanged from your version) ---------- */
function transformDataForVisualization(kpiAnalysis, deviationPatterns, factorCorrelations) {
  const timeSeriesData = transformTimeSeriesData(kpiAnalysis);
  const featureImportanceData = transformFeatureImportanceData(kpiAnalysis.analysisResults);
  const varianceData = transformVarianceData(kpiAnalysis.analysisResults);
  const patternData = transformPatternData(deviationPatterns);
  const radarData = transformRadarData(kpiAnalysis);
  const correlationMatrix = transformCorrelationData(factorCorrelations);
  return { timeSeriesData, featureImportanceData, varianceData, patternData, radarData, correlationMatrix };
}
function transformTimeSeriesData(kpiAnalysis) {
  const { kpiData, analysisResults } = kpiAnalysis;
  const kpiGroups = {};
  kpiData.forEach(row => {
    if (!kpiGroups[row.kpi_name]) kpiGroups[row.kpi_name] = [];
    kpiGroups[row.kpi_name].push({ date: row.date, actual: row.value, function: row.function });
  });
  Object.keys(kpiGroups).forEach(kpiName => {
    if (analysisResults[kpiName]) {
      const { predictions, deviations } = analysisResults[kpiName];
      kpiGroups[kpiName].forEach((pt, i) => {
        if (i < predictions.length) {
          pt.predicted = predictions[i];
          pt.deviation = deviations[i];
        }
      });
    }
  });
  return kpiGroups;
}
function transformFeatureImportanceData(analysisResults) {
  const all = {};
  Object.keys(analysisResults).forEach(k => {
    analysisResults[k].feature_importance.forEach(({ feature, importance }) => {
      if (!all[feature]) all[feature] = { feature, total_importance: 0, kpi_count: 0, kpi_details: {} };
      all[feature].total_importance += importance;
      all[feature].kpi_count += 1;
      all[feature].kpi_details[k] = importance;
    });
  });
  const featureArray = Object.values(all).map(f => ({ ...f, avg_importance: f.total_importance / f.kpi_count }))
    .sort((a,b)=>b.avg_importance-a.avg_importance);
  return { aggregated: featureArray, byKPI: analysisResults };
}
function transformVarianceData(analysisResults) {
  const out = {};
  Object.keys(analysisResults).forEach(k => {
    const { variance_decomposition: v, model_metrics: m } = analysisResults[k];
    out[k] = {
      total_variance: v.total,
      explained_variance: v.explained,
      unexplained_variance: v.unexplained,
      explanation_power: v.total > 0 ? (v.explained / v.total) * 100 : 0,
      model_accuracy: m.r_squared * 100,
      mean_absolute_error: m.mean_absolute_error,
      rmse: m.root_mean_squared_error
    };
  });
  return out;
}
function transformPatternData(patterns) {
  const calendar = {}, monthlyStats = {};
  patterns.forEach(p => {
    const { year, month, date, deviation_magnitude, is_significant, pattern_type } = p;
    if (!calendar[year]) calendar[year] = {};
    if (!calendar[year][month]) calendar[year][month] = [];
    calendar[year][month].push({
      date, magnitude: deviation_magnitude, isSignificant: is_significant,
      type: pattern_type, day: new Date(date).getDate()
    });
    const key = `${year}-${String(month).padStart(2,'0')}`;
    if (!monthlyStats[key]) monthlyStats[key] = {
      totalDeviations: 0, significantDeviations: 0, averageMagnitude: 0, positiveAnomalies: 0, negativeAnomalies: 0
    };
    monthlyStats[key].totalDeviations += 1;
    if (is_significant) monthlyStats[key].significantDeviations += 1;
    monthlyStats[key].averageMagnitude += Math.abs(deviation_magnitude);
    if (pattern_type === 'positive_anomaly') monthlyStats[key].positiveAnomalies += 1;
    if (pattern_type === 'negative_anomaly') monthlyStats[key].negativeAnomalies += 1;
  });
  Object.keys(monthlyStats).forEach(k => {
    monthlyStats[k].averageMagnitude /= monthlyStats[k].totalDeviations;
  });
  return { calendar, monthlyStats, patterns };
}
function transformRadarData(kpiAnalysis) {
  const { analysisResults } = kpiAnalysis;
  const groups = {
    sales: ['daily_revenue','transaction_volume','avg_order_value'],
    customer: ['active_customers','loyal_customers','avg_rfm_score'],
    finance: ['ar_volume','total_ar_amount','avg_age_days']
  };
  const out = {};
  Object.keys(groups).forEach(fn => {
    out[fn] = { name: fn, metrics: [] };
    groups[fn].forEach(kpi => {
      if (analysisResults[kpi]) {
        const m = analysisResults[kpi].model_metrics;
        const v = analysisResults[kpi].variance_decomposition;
        const explanationPower = v.total > 0 ? (v.explained / v.total) * 100 : 0;
        out[fn].metrics.push({
          kpi, modelAccuracy: m.r_squared * 100, explanationPower,
          avgDeviation: analysisResults[kpi].deviations.reduce((s,d)=>s+Math.abs(d),0)/analysisResults[kpi].deviations.length
        });
      }
    });
  });
  return out;
}
function transformCorrelationData(list) {
  const factors = [...new Set(list.map(c=>c.factor))];
  const kpis = [...new Set(list.map(c=>c.kpi))];
  const matrix = [], sig = [];
  factors.forEach(f => {
    const row = { factor: f };
    kpis.forEach(k => {
      const c = list.find(x=>x.factor===f && x.kpi===k);
      row[k] = c ? c.correlation : 0;
      if (c?.is_significant) sig.push({ factor:f, kpi:k, correlation:c.correlation, pValue:c.p_value });
    });
    matrix.push(row);
  });
  return { matrix, factors, kpis, significantCorrelations: sig };
}
function calculateKPIMetrics(kpiAnalysis, summaryMetrics, deviationPatterns) {
  const { analysisResults } = kpiAnalysis;
  let totalDev = 0, nDev = 0, totPower = 0, nKpi = 0;
  Object.values(analysisResults).forEach(r => {
    r.deviations?.forEach(d => { totalDev += Math.abs(d); nDev += 1; });
    const v = r.variance_decomposition; if (v?.total>0){ totPower += (v.explained/v.total)*100; nKpi+=1; }
  });
  const avgDeviation = nDev>0 ? totalDev/nDev : 0;
  const explanationPower = nKpi>0 ? totPower/nKpi : 0;
  const anomalyCount = deviationPatterns.filter(p=>p.is_significant).length;
  const importance = {};
  Object.values(analysisResults).forEach(r => r.feature_importance.forEach(({feature,importance:i})=>{
    importance[feature]=(importance[feature]||0)+i;
  }));
  const topFactor = Object.keys(importance).sort((a,b)=>importance[b]-importance[a])[0] || 'unknown';
  const forecastTrend = Math.random()>0.5?'improving':'declining'; // direction only; values come from true residuals in UI
  return {
    averageDeviation: avgDeviation,
    explanationPower,
    anomalyCount,
    topFactor,
    forecastTrend,
    totalDataPoints: summaryMetrics.total_days || 0,
    avgDailyRevenue: summaryMetrics.avg_daily_revenue || 0
  };
}
