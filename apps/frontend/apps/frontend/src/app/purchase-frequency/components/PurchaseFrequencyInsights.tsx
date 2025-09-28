// Purchase Frequency Insights Component - Following churn pattern
import React from "react";
import { ChartCard } from "components";

interface PurchaseFrequencyInsightsProps {
  insights: string[];
  mlResults: any;
  loading: boolean;
}

export function PurchaseFrequencyInsights({ insights, mlResults, loading }: PurchaseFrequencyInsightsProps) {

  if (loading) {
    return (
      <ChartCard title="AI Insights" className="glass-card">
        <div className="h-64 flex items-center justify-center">
          <div className="text-muted">Generating insights...</div>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="AI Insights" className="glass-card card-hover">
      <div className="space-y-4">
        {insights && insights.length > 0 ? (
          insights.map((insight, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-background/50 border border-border/50"
            >
              <p className="text-sm text-foreground">{insight}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted">
            No insights available at this time
          </div>
        )}
      </div>
    </ChartCard>
  );
}
