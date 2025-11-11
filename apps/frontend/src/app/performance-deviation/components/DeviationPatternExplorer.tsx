import { CartesianGrid, Cell, Legend, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from '@/lib/rechartsSetup';
import React, { useMemo, useState } from 'react';
import {
  ChartCard,
  Skeleton,
  Badge,
  getShiftClickManager
} from 'components';
interface DeviationPatternExplorerProps {
  data: any;
  loading?: boolean;
}

const PATTERN_COLORS = {
  positive_anomaly: '#10B981',  // Green
  negative_anomaly: '#EF4444',  // Red
  trending_up: '#00E0FF',       // Cyan
  trending_down: '#F59E0B',     // Amber
  cyclical: '#9333EA',          // Purple
  normal: '#6B7280'             // Gray
};

export function DeviationPatternExplorer({
  data,
  loading
}: DeviationPatternExplorerProps) {
  const shiftClickManager = getShiftClickManager();
  const [selectedPattern, setSelectedPattern] = useState<string>('all');

  // Process pattern data - MUST be before conditional returns
  const scatterData = useMemo(() => {
    const patterns = data?.patterns || [];
    return patterns.map((p: any, index: number) => ({
      x: index,  // X-axis: sequence index
      y: p.deviation_magnitude || p.deviation || 0,  // Y-axis: deviation value
      size: Math.abs(p.deviation_magnitude || p.deviation || 0) * 100,  // Bubble size
      pattern_type: p.pattern_type || 'normal',
      date: p.date,
      kpi: p.kpi,
      is_significant: p.is_significant
    }));
  }, [data]);

  const filteredData = useMemo(() => {
    if (selectedPattern === 'all') return scatterData;
    return scatterData.filter((d: any) => d.pattern_type === selectedPattern);
  }, [scatterData, selectedPattern]);

  const patternStats = useMemo(() => {
    const stats: Record<string, number> = {};
    scatterData.forEach((d: any) => {
      stats[d.pattern_type] = (stats[d.pattern_type] || 0) + 1;
    });
    return stats;
  }, [scatterData]);

  // Loading state - AFTER all hooks
  if (loading) {
    return (
      <ChartCard className="h-96">
        <Skeleton className="h-full" />
      </ChartCard>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-1">{data.date}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">KPI:</span>
              <span className="font-medium">{data.kpi}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Deviation:</span>
              <span className="font-medium">{data.y.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Pattern:</span>
              <span
                className="font-medium capitalize"
                style={{ color: PATTERN_COLORS[data.pattern_type as keyof typeof PATTERN_COLORS] }}
              >
                {data.pattern_type.replace(/_/g, ' ')}
              </span>
            </div>
            {data.is_significant && (
              <Badge variant="destructive" className="mt-1">Significant</Badge>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "Deviation Pattern Explorer",
          value: `Interactive exploration of deviation patterns across time`,
          source: 'Performance Deviation - Pattern Explorer'
        }, event.nativeEvent);
      }}
      action={
        <select
          value={selectedPattern}
          onChange={(e) => setSelectedPattern(e.target.value)}
          className="px-3 py-1.5 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All Patterns</option>
          {Object.keys(patternStats).map(pattern => (
            <option key={pattern} value={pattern}>
              {pattern.replace(/_/g, ' ')} ({patternStats[pattern]})
            </option>
          ))}
        </select>
      }
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" />
            <XAxis
              type="number"
              dataKey="x"
              name="Time"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              label={{ value: 'Time Sequence', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Deviation"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              label={{ value: 'Deviation', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              data={filteredData}
              fill="#00E0FF"
            >
              {filteredData.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PATTERN_COLORS[entry.pattern_type as keyof typeof PATTERN_COLORS] || PATTERN_COLORS.normal}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Pattern Statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <p className="text-xs text-muted-foreground">Positive Anomalies</p>
          <p className="text-lg font-bold text-green-500">
            {patternStats.positive_anomaly || 0}
          </p>
        </div>

        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <p className="text-xs text-muted-foreground">Negative Anomalies</p>
          <p className="text-lg font-bold text-red-500">
            {patternStats.negative_anomaly || 0}
          </p>
        </div>

        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <p className="text-xs text-muted-foreground">Significant</p>
          <p className="text-lg font-bold text-yellow-500">
            {scatterData.filter((d: any) => d.is_significant).length}
          </p>
        </div>
      </div>
    </ChartCard>
  );
}