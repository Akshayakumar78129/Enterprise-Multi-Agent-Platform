// Purchase Frequency Insight Generator Utilities
export function generatePurchaseFrequencyInsights(data: any): string[] {
  const insights: string[] = [];

  // Add dashboard-specific insight generation logic
  if (data) {
    insights.push(`Analysis complete for Purchase Frequency`);

    if (data.totalRecords) {
      insights.push(`Analyzed ${data.totalRecords} customer records`);
    }

    // Add more specific insights based on dashboard type
    "purchase-frequency" === "customer-segmentation" && insights.push(
      "Customer segments have been identified using ML clustering"
    );

    "purchase-frequency" === "customer-ltv" && insights.push(
      "Lifetime value predictions are based on historical transaction patterns"
    );

    "purchase-frequency" === "engagement-classifier" && insights.push(
      "Engagement levels classified using behavioral metrics"
    );
  }

  return insights;
}

export function calculateMetrics(data: any[]): number {
  if (!data || data.length === 0) return 0;
  return data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length;
}
