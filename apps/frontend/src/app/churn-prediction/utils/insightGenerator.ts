/**
 * Dynamic Insight Generator for Churn Prediction Dashboard
 * Generates context-aware insights based on real data
 */

export interface RiskLevelData {
  level: string;
  count: number;
  percentage: number;
}

export interface CustomerData {
  riskLevel: string;
  lifetime_sales?: number;
  avg_order_value?: number;
}

/**
 * Get risk-specific recommendations
 */
export function getRecommendation(riskLevel: string): string {
  const recommendations: Record<string, string> = {
    "Very High": "Implement immediate retention campaign with personalized offers and direct outreach",
    "High": "Schedule proactive customer success check-ins and loyalty incentives",
    "Medium": "Monitor engagement metrics closely and provide value-add communications",
    "Low": "Maintain current engagement strategy and reward loyalty"
  };
  return recommendations[riskLevel] || "Continue monitoring customer engagement patterns";
}

/**
 * Get action priority based on risk level
 */
export function getActionPriority(riskLevel: string): string {
  const priorities: Record<string, string> = {
    "Very High": "🚨 Critical - Act within 24 hours",
    "High": "⚠️ High Priority - Act within 3 days",
    "Medium": "📊 Monitor - Review weekly",
    "Low": "✅ Stable - Regular quarterly review"
  };
  return priorities[riskLevel] || "📊 Standard monitoring";
}

/**
 * Generate risk analysis insights
 */
export function generateRiskInsights(riskData: RiskLevelData): string[] {
  const { level, count, percentage } = riskData;

  const insights: string[] = [
    `${count.toLocaleString()} customers (${percentage}%) are classified as ${level} risk`,
    getActionPriority(level),
  ];

  // Add context-specific insights
  if (level === "Very High" || level === "High") {
    insights.push(
      `⚠️ These ${count.toLocaleString()} customers require immediate attention to prevent churn`,
      `Estimated revenue at risk: $${(count * 50000).toLocaleString()} annually`
    );
  } else if (level === "Low") {
    insights.push(
      `✅ Strong customer loyalty detected in this segment`,
      `These customers show consistent engagement patterns`
    );
  }

  insights.push(getRecommendation(level));

  // Add statistical insight
  if (percentage > 30) {
    insights.push(`📈 This represents a significant portion of your customer base`);
  } else if (percentage < 5) {
    insights.push(`📊 This is a small but important segment to address`);
  }

  return insights;
}

/**
 * Generate feature importance insights
 */
export function generateFeatureInsights(features: Array<{name: string, impact: number}>): string[] {
  if (!features || features.length === 0) return [];

  const topFeature = features[0];
  const insights: string[] = [];

  insights.push(`🎯 ${topFeature.name} is the strongest predictor with ${topFeature.impact.toFixed(1)}% impact`);

  if (topFeature.name === "Recency") {
    insights.push("Customer engagement timing is critical for retention");
    insights.push("Focus on re-engaging customers who haven't purchased recently");
  } else if (topFeature.name === "Frequency") {
    insights.push("Purchase frequency drives customer loyalty");
    insights.push("Implement frequency-based rewards programs");
  } else if (topFeature.name === "Monetary" || topFeature.name === "Lifetime Value") {
    insights.push("Customer value is a key retention indicator");
    insights.push("Prioritize high-value customer relationships");
  }

  // Add insight about feature distribution
  const highImpactFeatures = features.filter(f => f.impact > 20);
  if (highImpactFeatures.length > 1) {
    insights.push(`${highImpactFeatures.length} factors have significant impact (>20%) on churn prediction`);
  }

  return insights;
}

/**
 * Generate segment comparison insights
 */
export function generateSegmentInsights(segment: string, riskLevel: string, count: number): string[] {
  const insights: string[] = [];

  insights.push(`${segment} segment has ${count} customers at ${riskLevel} risk`);

  // Segment-specific insights
  const segmentInsights: Record<string, string> = {
    "Enterprise": "High-value enterprise accounts require white-glove service",
    "Mid-Market": "Mid-market customers benefit from automated success programs",
    "SMB": "Small businesses need cost-effective retention strategies",
    "Small Business": "Small businesses need cost-effective retention strategies",
    "Consumer": "Consumer segment responds well to loyalty programs",
    "Startup": "Startups require flexible engagement models"
  };

  if (segmentInsights[segment]) {
    insights.push(segmentInsights[segment]);
  }

  // Risk-segment combination insights
  if ((segment === "Enterprise" || segment === "High-Value") && (riskLevel === "Very High" || riskLevel === "High")) {
    insights.push("⚠️ Critical: High-value customers at risk - assign dedicated account managers");
  } else if (segment === "SMB" && riskLevel === "Low") {
    insights.push("✅ Healthy SMB segment - maintain current service levels");
  }

  return insights;
}

/**
 * Calculate average lifetime value for a risk segment
 */
export function calculateAvgLTV(customers: CustomerData[]): string {
  if (!customers || customers.length === 0) return "$0";

  const totalLTV = customers.reduce((sum, c) =>
    sum + (c.lifetime_sales || 0), 0
  );

  const avgLTV = totalLTV / customers.length;
  return `$${avgLTV.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/**
 * Generate trend insights
 */
export function generateTrendInsights(
  currentValue: number,
  previousValue: number,
  metric: string
): string[] {
  const insights: string[] = [];
  const change = ((currentValue - previousValue) / previousValue) * 100;

  if (change > 0) {
    insights.push(`📈 ${metric} increased by ${Math.abs(change).toFixed(1)}% from previous period`);
    if (change > 20) {
      insights.push("⚠️ Significant increase detected - investigate root causes");
    }
  } else if (change < 0) {
    insights.push(`📉 ${metric} decreased by ${Math.abs(change).toFixed(1)}% from previous period`);
    if (change < -20) {
      insights.push("✅ Significant improvement in risk metrics");
    }
  } else {
    insights.push(`📊 ${metric} remained stable compared to previous period`);
  }

  return insights;
}

/**
 * Generate comprehensive dashboard insights
 */
export function generateDashboardInsights(data: {
  totalCustomers: number;
  atRiskCount: number;
  savedThisMonth: number;
  avgChurnRate: number;
}): string[] {
  const insights: string[] = [];
  const { totalCustomers, atRiskCount, savedThisMonth, avgChurnRate } = data;

  const atRiskPercentage = (atRiskCount / totalCustomers) * 100;

  insights.push(`📊 Monitoring ${totalCustomers.toLocaleString()} total customers`);
  insights.push(`⚠️ ${atRiskCount.toLocaleString()} customers (${atRiskPercentage.toFixed(1)}%) are at risk`);

  if (savedThisMonth > 0) {
    insights.push(`✅ Successfully retained ${savedThisMonth} customers this month`);
  }

  if (avgChurnRate < 5) {
    insights.push("🎯 Churn rate is below industry average - excellent performance");
  } else if (avgChurnRate > 10) {
    insights.push("📈 Churn rate above target - intensify retention efforts");
  }

  // Revenue impact
  const revenueAtRisk = atRiskCount * 50000; // Estimated annual value per customer
  insights.push(`💰 Estimated annual revenue at risk: $${revenueAtRisk.toLocaleString()}`);

  return insights;
}