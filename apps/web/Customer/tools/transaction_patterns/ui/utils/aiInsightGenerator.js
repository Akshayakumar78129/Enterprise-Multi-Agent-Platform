/**
 * AI Insight Generator for Transaction Pattern Analysis
 * Generates concise, industry-grade insights for data point interactions
 */

export class AIInsightGenerator {
  constructor(dashboardData) {
    this.data = dashboardData;
    this.insights = {
      performance: [],
      trends: [],
      anomalies: [],
      opportunities: [],
      risks: []
    };
  }

  /**
   * Generate comprehensive insights for time series data points
   */
  generateTimeSeriesInsights(dataPoint) {
    const { date, transaction_count, avg_amount } = dataPoint;
    const insights = [];
    
    // Performance Analysis
    const performanceInsight = this.analyzePerformance(dataPoint);
    if (performanceInsight) insights.push(performanceInsight);
    
    // Trend Analysis
    const trendInsight = this.analyzeTrend(dataPoint);
    if (trendInsight) insights.push(trendInsight);
    
    // Anomaly Detection
    const anomalyInsight = this.detectAnomaly(dataPoint);
    if (anomalyInsight) insights.push(anomalyInsight);
    
    // Business Opportunity
    const opportunityInsight = this.identifyOpportunity(dataPoint);
    if (opportunityInsight) insights.push(opportunityInsight);
    
    return insights.slice(0, 3); // Return top 3 most relevant insights
  }

  /**
   * Generate insights for temporal heatmap cells
   */
  generateHeatmapInsights(day, hour, transactionCount) {
    const insights = [];
    
    // Peak/Off-peak Analysis
    const peakInsight = this.analyzePeakHours(day, hour, transactionCount);
    if (peakInsight) insights.push(peakInsight);
    
    // Day Pattern Analysis
    const dayPatternInsight = this.analyzeDayPattern(day, hour, transactionCount);
    if (dayPatternInsight) insights.push(dayPatternInsight);
    
    // Operational Insight
    const operationalInsight = this.generateOperationalInsight(day, hour, transactionCount);
    if (operationalInsight) insights.push(operationalInsight);
    
    return insights.slice(0, 3);
  }

  /**
   * Generate insights for KPI tiles
   */
  generateKPIInsights(kpiType, value) {
    const insights = [];
    
    switch (kpiType) {
      case 'totalTransactions':
        insights.push(...this.analyzeTransactionVolume(value));
        break;
      case 'totalRevenue':
        insights.push(...this.analyzeRevenue(value));
        break;
      case 'averageTransactionValue':
        insights.push(...this.analyzeAverageValue(value));
        break;
      case 'uniqueCustomers':
        insights.push(...this.analyzeCustomerBase(value));
        break;
    }
    
    return insights.slice(0, 3);
  }

  /**
   * Generate insights for distribution/histogram data points
   */
  generateDistributionInsights(binRange, frequency, totalTransactions) {
    const insights = [];
    
    // Market Segment Analysis
    const segmentInsight = this.analyzeMarketSegment(binRange, frequency, totalTransactions);
    if (segmentInsight) insights.push(segmentInsight);
    
    // Revenue Concentration
    const concentrationInsight = this.analyzeRevenueConcentration(binRange, frequency);
    if (concentrationInsight) insights.push(concentrationInsight);
    
    // Customer Behavior
    const behaviorInsight = this.analyzePurchaseBehavior(binRange, frequency);
    if (behaviorInsight) insights.push(behaviorInsight);
    
    return insights.slice(0, 3);
  }

  // Performance Analysis Methods
  analyzePerformance(dataPoint) {
    const { transaction_count, avg_amount } = dataPoint;
    const dailyAverage = this.calculateDailyAverage();
    const revenueAverage = this.calculateRevenueAverage();
    
    const volumePerformance = ((transaction_count / dailyAverage - 1) * 100).toFixed(1);
    const revenuePerformance = ((avg_amount / revenueAverage - 1) * 100).toFixed(1);
    
    if (Math.abs(volumePerformance) > 20) {
      const direction = volumePerformance > 0 ? 'above' : 'below';
      const impact = Math.abs(volumePerformance) > 50 ? 'significantly' : 'moderately';
      return {
        type: 'performance',
        priority: 'high',
        insight: `📊 Volume is ${impact} ${direction} average (${volumePerformance > 0 ? '+' : ''}${volumePerformance}%), indicating ${volumePerformance > 0 ? 'strong' : 'weak'} customer activity.`
      };
    }
    
    return null;
  }

  analyzeTrend(dataPoint) {
    const { date, transaction_count } = dataPoint;
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isMonday = dayOfWeek === 1;
    const isFriday = dayOfWeek === 5;
    
    // Weekend vs Weekday Analysis
    if (isWeekend && transaction_count > this.calculateWeekdayAverage()) {
      return {
        type: 'trend',
        priority: 'medium',
        insight: `🎯 Strong weekend performance suggests leisure/discretionary spending patterns - consider weekend-specific promotions.`
      };
    }
    
    // Monday Effect
    if (isMonday && transaction_count > this.calculateDailyAverage() * 1.2) {
      return {
        type: 'trend',
        priority: 'medium',
        insight: `🚀 Monday surge indicates pent-up demand from weekend - optimize inventory and staffing for Monday peaks.`
      };
    }
    
    // Friday Analysis
    if (isFriday && transaction_count > this.calculateDailyAverage() * 1.15) {
      return {
        type: 'trend',
        priority: 'medium',
        insight: `💼 Friday boost suggests payday effect or weekend preparation - ideal for premium product positioning.`
      };
    }
    
    return null;
  }

  detectAnomaly(dataPoint) {
    const { transaction_count, avg_amount } = dataPoint;
    const dailyAverage = this.calculateDailyAverage();
    const revenueAverage = this.calculateRevenueAverage();
    const stdDev = this.calculateStandardDeviation();
    
    // Statistical Anomaly Detection
    const zScore = Math.abs((transaction_count - dailyAverage) / stdDev);
    
    if (zScore > 2.5) {
      const direction = transaction_count > dailyAverage ? 'spike' : 'drop';
      const severity = zScore > 3 ? 'extreme' : 'significant';
      
      return {
        type: 'anomaly',
        priority: 'high',
        insight: `⚠️ ${severity.charAt(0).toUpperCase() + severity.slice(1)} ${direction} detected (${zScore.toFixed(1)}σ) - investigate external factors, campaigns, or system issues.`
      };
    }
    
    // Revenue Anomaly
    const revenueZScore = Math.abs((avg_amount - revenueAverage) / (revenueAverage * 0.3));
    if (revenueZScore > 2) {
      const direction = avg_amount > revenueAverage ? 'premium' : 'discount';
      return {
        type: 'anomaly',
        priority: 'medium',
        insight: `💰 Unusual ${direction} transaction pattern - ${avg_amount > revenueAverage ? 'high-value customers active' : 'price-sensitive behavior observed'}.`
      };
    }
    
    return null;
  }

  identifyOpportunity(dataPoint) {
    const { transaction_count, avg_amount } = dataPoint;
    const dailyAverage = this.calculateDailyAverage();
    const revenueAverage = this.calculateRevenueAverage();
    
    // High Volume, Low Value Opportunity
    if (transaction_count > dailyAverage * 1.2 && avg_amount < revenueAverage * 0.9) {
      return {
        type: 'opportunity',
        priority: 'high',
        insight: `🎯 High traffic, lower spend - prime upselling opportunity. Consider bundling or premium product recommendations.`
      };
    }
    
    // Low Volume, High Value Opportunity
    if (transaction_count < dailyAverage * 0.8 && avg_amount > revenueAverage * 1.3) {
      return {
        type: 'opportunity',
        priority: 'medium',
        insight: `💎 Premium customer segment active - focus on VIP experience and exclusive offerings to maximize retention.`
      };
    }
    
    // Balanced Growth Opportunity
    if (transaction_count > dailyAverage * 1.1 && avg_amount > revenueAverage * 1.1) {
      return {
        type: 'opportunity',
        priority: 'high',
        insight: `🚀 Optimal performance day - replicate conditions: analyze marketing, weather, events, and operational factors.`
      };
    }
    
    return null;
  }

  // Heatmap-specific insights
  analyzePeakHours(day, hour, transactionCount) {
    const hourlyData = this.getHourlyData();
    const dayData = this.getDayData();
    
    const hourRank = this.rankHour(hour, hourlyData);
    const dayRank = this.rankDay(day, dayData);
    
    if (hourRank <= 3 && dayRank <= 2) {
      return {
        type: 'peak',
        priority: 'high',
        insight: `🔥 Prime time slot - top ${hourRank} hour on ${day}. Maximize staffing, inventory, and promotional activities.`
      };
    }
    
    if (hourRank >= 20 && transactionCount > 0) {
      return {
        type: 'opportunity',
        priority: 'medium',
        insight: `💡 Off-peak potential - consider targeted promotions or operational cost optimization during low-traffic periods.`
      };
    }
    
    return null;
  }

  analyzeDayPattern(day, hour, transactionCount) {
    const isWeekend = day === 'Saturday' || day === 'Sunday';
    const isBusinessHour = hour >= 9 && hour <= 17;
    const isEveningRush = hour >= 17 && hour <= 20;
    const isLateNight = hour >= 21 || hour <= 6;
    
    if (isWeekend && isBusinessHour && transactionCount > this.calculateAverageForTimeSlot(day, hour) * 1.2) {
      return {
        type: 'pattern',
        priority: 'medium',
        insight: `🛍️ Weekend shopping behavior - customers prefer daytime transactions. Optimize weekend operations and marketing.`
      };
    }
    
    if (!isWeekend && isEveningRush && transactionCount > this.calculateAverageForTimeSlot(day, hour) * 1.1) {
      return {
        type: 'pattern',
        priority: 'medium',
        insight: `🌆 After-work rush detected - working professionals active. Target convenience and quick-service offerings.`
      };
    }
    
    if (isLateNight && transactionCount > this.calculateAverageForTimeSlot(day, hour) * 1.5) {
      return {
        type: 'pattern',
        priority: 'high',
        insight: `🌙 Unusual late-night activity - investigate digital channels, international customers, or 24/7 service opportunities.`
      };
    }
    
    return null;
  }

  generateOperationalInsight(day, hour, transactionCount) {
    const capacity = this.estimateCapacity(day, hour);
    const utilization = (transactionCount / capacity * 100).toFixed(1);
    
    if (utilization > 85) {
      return {
        type: 'operational',
        priority: 'high',
        insight: `⚡ High utilization (${utilization}%) - consider capacity expansion, queue management, or demand smoothing strategies.`
      };
    }
    
    if (utilization < 30 && transactionCount > 0) {
      return {
        type: 'operational',
        priority: 'medium',
        insight: `📉 Low utilization (${utilization}%) - opportunity for cost optimization or alternative revenue streams.`
      };
    }
    
    return null;
  }

  // KPI-specific insights
  analyzeTransactionVolume(totalTransactions) {
    const insights = [];
    const benchmark = this.getIndustryBenchmark('transactions');
    
    if (totalTransactions > benchmark * 1.2) {
      insights.push({
        type: 'performance',
        priority: 'high',
        insight: `🎯 Transaction volume exceeds industry benchmark by ${((totalTransactions / benchmark - 1) * 100).toFixed(1)}% - strong market position.`
      });
    }
    
    const growthRate = this.calculateGrowthRate('transactions');
    if (growthRate > 15) {
      insights.push({
        type: 'growth',
        priority: 'high',
        insight: `📈 Exceptional growth trajectory at ${growthRate.toFixed(1)}% - scale operations and customer acquisition strategies.`
      });
    }
    
    return insights;
  }

  analyzeRevenue(totalRevenue) {
    const insights = [];
    const revenuePerTransaction = totalRevenue / this.data.kpis.totalTransactions;
    const benchmark = this.getIndustryBenchmark('revenue');
    
    if (revenuePerTransaction > benchmark * 1.15) {
      insights.push({
        type: 'performance',
        priority: 'high',
        insight: `💰 Premium pricing power - average transaction value ${((revenuePerTransaction / benchmark - 1) * 100).toFixed(1)}% above market.`
      });
    }
    
    const concentration = this.calculateRevenueConcentration();
    if (concentration > 0.8) {
      insights.push({
        type: 'risk',
        priority: 'medium',
        insight: `⚠️ Revenue concentration risk - ${(concentration * 100).toFixed(1)}% from top segments. Diversify customer base.`
      });
    }
    
    return insights;
  }

  // Utility calculation methods
  calculateDailyAverage() {
    if (!this.data.timeSeries || this.data.timeSeries.length === 0) return 0;
    const total = this.data.timeSeries.reduce((sum, d) => sum + d.transaction_count, 0);
    return total / this.data.timeSeries.length;
  }

  calculateRevenueAverage() {
    if (!this.data.timeSeries || this.data.timeSeries.length === 0) return 0;
    const total = this.data.timeSeries.reduce((sum, d) => sum + d.avg_amount, 0);
    return total / this.data.timeSeries.length;
  }

  calculateStandardDeviation() {
    if (!this.data.timeSeries || this.data.timeSeries.length === 0) return 0;
    const mean = this.calculateDailyAverage();
    const squaredDiffs = this.data.timeSeries.map(d => Math.pow(d.transaction_count - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, d) => sum + d, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  }

  calculateWeekdayAverage() {
    if (!this.data.timeSeries) return 0;
    const weekdayData = this.data.timeSeries.filter(d => {
      const dayOfWeek = new Date(d.date).getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    });
    if (weekdayData.length === 0) return 0;
    return weekdayData.reduce((sum, d) => sum + d.transaction_count, 0) / weekdayData.length;
  }

  getHourlyData() {
    if (!this.data.temporalHeatmap) return [];
    return this.data.temporalHeatmap.reduce((acc, d) => {
      if (!acc[d.hour]) acc[d.hour] = 0;
      acc[d.hour] += d.transactionCount;
      return acc;
    }, {});
  }

  getDayData() {
    if (!this.data.temporalHeatmap) return [];
    return this.data.temporalHeatmap.reduce((acc, d) => {
      if (!acc[d.day]) acc[d.day] = 0;
      acc[d.day] += d.transactionCount;
      return acc;
    }, {});
  }

  rankHour(hour, hourlyData) {
    const hours = Object.entries(hourlyData).sort((a, b) => b[1] - a[1]);
    return hours.findIndex(([h]) => parseInt(h) === hour) + 1;
  }

  rankDay(day, dayData) {
    const days = Object.entries(dayData).sort((a, b) => b[1] - a[1]);
    return days.findIndex(([d]) => d === day) + 1;
  }

  calculateAverageForTimeSlot(day, hour) {
    if (!this.data.temporalHeatmap) return 0;
    const point = this.data.temporalHeatmap.find(d => d.day === day && d.hour === hour);
    return point ? point.transactionCount : 0;
  }

  estimateCapacity(day, hour) {
    // Simplified capacity estimation based on peak performance
    const maxObserved = Math.max(...(this.data.temporalHeatmap || []).map(d => d.transactionCount));
    return maxObserved * 1.2; // Assume 20% headroom above observed peak
  }

  getIndustryBenchmark(metric) {
    // Simplified industry benchmarks - in production, these would come from external data
    const benchmarks = {
      transactions: this.calculateDailyAverage() * 0.85,
      revenue: this.calculateRevenueAverage() * 0.9
    };
    return benchmarks[metric] || 0;
  }

  calculateGrowthRate(metric) {
    // Simplified growth calculation - in production, this would use historical data
    return Math.random() * 30; // Placeholder for demo
  }

  calculateRevenueConcentration() {
    // Simplified concentration calculation
    return 0.6 + Math.random() * 0.3; // Placeholder for demo
  }
}

/**
 * Factory function to create AI insights for different chart types
 */
export function generateAIInsights(chartType, dataPoint, dashboardData) {
  const generator = new AIInsightGenerator(dashboardData);
  
  switch (chartType) {
    case 'timeSeries':
      return generator.generateTimeSeriesInsights(dataPoint);
    case 'heatmap':
      return generator.generateHeatmapInsights(dataPoint.day, dataPoint.hour, dataPoint.transactionCount);
    case 'kpi':
      return generator.generateKPIInsights(dataPoint.type, dataPoint.value);
    case 'distribution':
      return generator.generateDistributionInsights(dataPoint.binRange, dataPoint.frequency, dataPoint.total);
    default:
      return [];
  }
}