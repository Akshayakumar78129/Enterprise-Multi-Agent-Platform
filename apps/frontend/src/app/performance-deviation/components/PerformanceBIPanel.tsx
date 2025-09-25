import React from 'react';
import { BusinessIntelligencePanel } from 'components';

interface PerformanceRecord {
  id: number | string;
  kpi?: string;
  deviation?: number;
  date?: string;
  actual?: number;
  predicted?: number;
}

interface PerformanceBIPanelProps {
  onClose: () => void;
  performanceData: PerformanceRecord[];
}

export function PerformanceBIPanel({
  onClose,
  performanceData
}: PerformanceBIPanelProps) {
  // Transform performance data to match churn customer format
  const transformedData = performanceData.map((record) => {
    // Calculate risk level based on deviation
    const absDeviation = Math.abs(record.deviation || 0);
    let riskLevel: "Low" | "Medium" | "High" | "Very High" = "Low";

    if (absDeviation > 3) {
      riskLevel = "Very High";
    } else if (absDeviation > 2) {
      riskLevel = "High";
    } else if (absDeviation > 1) {
      riskLevel = "Medium";
    }

    // Convert deviation to probability (0-1 scale)
    const churnProbability = Math.min(absDeviation / 4, 1); // Max out at 4 std deviations

    return {
      customer_id: record.id,
      name: record.kpi ? `${record.kpi} - ${record.date}` : `Record ${record.id}`,
      risk_level: riskLevel,
      churn_probability: churnProbability,
      avg_order_value: record.actual,
      frequency: record.predicted,
      lifetime_value: Math.abs((record.actual || 0) - (record.predicted || 0)) * 1000
    };
  });

  return (
    <BusinessIntelligencePanel
      onClose={onClose}
      customers={transformedData}
      dashboardContext="performance_deviation"
    />
  );
}