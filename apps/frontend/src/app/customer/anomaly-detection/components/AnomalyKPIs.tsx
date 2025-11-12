"use client";

import React from 'react';
import { KPICard, AnimatedKPITile, getShiftClickManager } from 'components/index';
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
  const shiftClickManager = getShiftClickManager();

  // Add null safety checks for all metrics
  const anomalyRate = typeof kpiMetrics?.anomalyRate === 'string'
    ? parseFloat(kpiMetrics.anomalyRate) || 0
    : (kpiMetrics?.anomalyRate ?? 0);

  const meanScore = typeof kpiMetrics?.meanAnomalyScore === 'string'
    ? parseFloat(kpiMetrics.meanAnomalyScore) || 0
    : (kpiMetrics?.meanAnomalyScore ?? 0);

  const highSeverityCount = kpiMetrics?.highSeverityCount ?? 0;
  const topAnomalousFeature = kpiMetrics?.topAnomalousFeature ?? 'Unknown';
  const newAnomalies = kpiMetrics?.newAnomalies ?? 0;

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
        onShiftClick={(event) => {
          shiftClickManager.addPoint({
            label: "Anomaly Rate",
            value: `${anomalyRate.toFixed(1)}%`,
            source: 'Anomaly KPIs'
          }, event.nativeEvent);
        }}
      />

      <AnimatedKPITile
        title="High Severity"
        value={highSeverityCount.toString()}
        subtitle="Severity 4-5"
        icon={AlertTriangle}
        loading={loading}
        color={highSeverityCount > 20 ? 'red' : 'yellow'}
        pulse={highSeverityCount > 30}
        onShiftClick={(event) => {
          shiftClickManager.addPoint({
            label: "High Severity",
            value: highSeverityCount.toString(),
            source: 'Anomaly KPIs'
          }, event.nativeEvent);
        }}
      />

      <KPICard
        title="Top Anomalous Feature"
        value={topAnomalousFeature}
        description="Most frequent deviation"
        icon={<Activity className="w-5 h-5 text-blue-400" />}
        loading={loading}
        onShiftClick={(event) => {
          shiftClickManager.addPoint({
            label: "Top Anomalous Feature",
            value: topAnomalousFeature,
            source: 'Anomaly KPIs'
          }, event.nativeEvent);
        }}
      />

      <AnimatedKPITile
        title="Mean Anomaly Score"
        value={meanScore.toFixed(2)}
        subtitle="0.0 - 1.0 scale"
        icon={BarChart3}
        loading={loading}
        progress={meanScore * 100}
        color={meanScore > 0.7 ? 'red' : meanScore > 0.4 ? 'yellow' : 'green'}
        onShiftClick={(event) => {
          shiftClickManager.addPoint({
            label: "Mean Anomaly Score",
            value: meanScore.toFixed(2),
            source: 'Anomaly KPIs'
          }, event.nativeEvent);
        }}
      />

      <AnimatedKPITile
        title="New Anomalies"
        value={newAnomalies.toString()}
        subtitle="Last 24h"
        icon={Clock}
        loading={loading}
        trend={newAnomalies > 10 ? 'up' : 'neutral'}
        onShiftClick={(event) => {
          shiftClickManager.addPoint({
            label: "New Anomalies",
            value: newAnomalies.toString(),
            source: 'Anomaly KPIs'
          }, event.nativeEvent);
        }}
      />
    </div>
  );
}