// Retention Planner Insight Generator Utilities
export function generateRetentionPlannerInsights(data: any): string[] {
  const insights: string[] = [];

  // Add dashboard-specific insight generation logic
  if (data) {
    insights.push(`Analysis complete for Retention Planner`);

    if (data.totalRecords) {
      insights.push(`Analyzed ${data.totalRecords} customer records`);
    }

    // Add more specific insights based on dashboard type
    "retention-planner" === "customer-segmentation" && insights.push(
      "Customer segments have been identified using ML clustering"
    );

    "retention-planner" === "customer-ltv" && insights.push(
      "Lifetime value predictions are based on historical transaction patterns"
    );

    "retention-planner" === "engagement-classifier" && insights.push(
      "Engagement levels classified using behavioral metrics"
    );
  }

  return insights;
}

export function calculateMetrics(data: any[]): number {
  if (!data || data.length === 0) return 0;
  return data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length;
}
