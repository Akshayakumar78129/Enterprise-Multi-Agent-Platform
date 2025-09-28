"use client";

import React from 'react';
import { KPICard, AnimatedKPITile } from 'components/index';
import { TrendingUp, AlertTriangle, Activity, BarChart3, Clock } from 'lucide-react';

interface AnomalyKPIsProps {
  kpiMetrics: {
    anomalyRate: number | string;
    highSeverityCount: number;
    topAnomalousFeature: string;
    meanAnomalyScore: number | string;
    newAnomalies: number;
  };
  loading?: boolean;
}

export function AnomalyKPIs({ kpiMetrics, loading = false }: AnomalyKPIsProps) {
  const anomalyRate = typeof kpiMetrics.anomalyRate === 'string'
    ? parseFloat(kpiMetrics.anomalyRate)
    : kpiMetrics.anomalyRate;

  const meanScore = typeof kpiMetrics.meanAnomalyScore === 'string'
    ? parseFloat(kpiMetrics.meanAnomalyScore)
    : kpiMetrics.meanAnomalyScore;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <AnimatedKPITile
        title="Anomaly Rate"
        value={`${anomalyRate.toFixed(1)}%`}
        subtitle="of all customers"
        icon={TrendingUp}
        trend={anomalyRate > 10 ? 'up' : anomalyRate > 5 ? 'neutral' : 'down'}
        trendValue={`${Math.abs(anomalyRate - 8.5).toFixed(1)}%`}
        loading={loading}
        color={anomalyRate > 10 ? 'red' : anomalyRate > 5 ? 'yellow' : 'green'}
      />

      <AnimatedKPITile
        title="High Severity"
        value={kpiMetrics.highSeverityCount.toString()}
        subtitle="Severity 4-5"
        icon={AlertTriangle}
        loading={loading}
        color={kpiMetrics.highSeverityCount > 20 ? 'red' : 'yellow'}
        pulse={kpiMetrics.highSeverityCount > 30}
      />

      <KPICard
        title="Top Anomalous Feature"
        value={kpiMetrics.topAnomalousFeature}
        description="Most frequent deviation"
        icon={<Activity className="w-5 h-5 text-blue-400" />}
        loading={loading}
      />

      <AnimatedKPITile
        title="Mean Anomaly Score"
        value={meanScore.toFixed(2)}
        subtitle="0.0 - 1.0 scale"
        icon={BarChart3}
        loading={loading}
        progress={meanScore * 100}
        color={meanScore > 0.7 ? 'red' : meanScore > 0.4 ? 'yellow' : 'green'}
      />

      <AnimatedKPITile
        title="New Anomalies"
        value={kpiMetrics.newAnomalies.toString()}
        subtitle="Last 24h"
        icon={Clock}
        loading={loading}
        trend={kpiMetrics.newAnomalies > 10 ? 'up' : 'neutral'}
        sparkline={[5, 8, 3, 12, 7, kpiMetrics.newAnomalies]}
      />
    </div>
  );
}