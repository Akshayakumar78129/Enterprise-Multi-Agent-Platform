import React from 'react';
import {
  Skeleton,
  Badge,
  ChartTooltip,
  useChartTooltip
} from 'components';

interface DeviationPatternsProps {
  data: any;
  loading?: boolean;
}

export function DeviationPatterns({
  data,
  loading
}: DeviationPatternsProps) {
  const { tooltipData, showTooltip, hideTooltip } = useChartTooltip();

  const patterns = data?.patterns || [];
  const monthlyStats = data?.monthlyStats || {};

  // Get top significant patterns - MUST be calculated before any conditional returns
  const significantPatterns = React.useMemo(() =>
    patterns
      .filter((p: any) => p.is_significant)
      .slice(0, 10), [patterns]);

  // Loading state - AFTER all hooks
  if (loading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div>
      {/* Pattern Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Positive Anomalies</span>
          </div>
          <p className="text-2xl font-bold text-green-500 mt-1">
            {patterns.filter((p: any) => p.pattern_type === 'positive_anomaly').length}
          </p>
        </div>

        <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Negative Anomalies</span>
          </div>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {patterns.filter((p: any) => p.pattern_type === 'negative_anomaly').length}
          </p>
        </div>

        <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Total Significant</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500 mt-1">
            {significantPatterns.length}
          </p>
        </div>
      </div>

      {/* Pattern List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {significantPatterns.length > 0 ? (
          significantPatterns.map((pattern: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-surface-light rounded-lg border border-border hover:border-accent/50 transition-colors"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                showTooltip(
                  rect.left + rect.width / 2,
                  rect.top,
                  pattern.date,
                  [
                    {
                      label: 'KPI',
                      value: pattern.kpi?.replace('_', ' ') || 'Unknown',
                      color: '#00E0FF'
                    },
                    {
                      label: 'Deviation',
                      value: `${(pattern.deviation_magnitude * 100).toFixed(1)}%`,
                      color: pattern.pattern_type === 'positive_anomaly' ? '#10B981' : '#EF4444'
                    },
                    {
                      label: 'Type',
                      value: pattern.pattern_type.replace('_', ' '),
                      color: '#9333EA'
                    }
                  ]
                );
              }}
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium">{pattern.date}</p>
                  <p className="text-xs text-muted-foreground">
                    {pattern.kpi?.replace('_', ' ') || 'Multiple KPIs'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={pattern.pattern_type === 'positive_anomaly' ? 'success' : 'destructive'}
                >
                  {(pattern.deviation_magnitude * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No significant deviation patterns detected
          </div>
        )}
      </div>

      {/* Monthly Summary */}
      {Object.keys(monthlyStats).length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Monthly Volatility</h4>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(monthlyStats)
              .slice(-6)
              .map(([month, stats]: [string, any]) => (
                <div
                  key={month}
                  className="px-3 py-1 bg-surface-light rounded-lg text-xs"
                >
                  <span className="font-medium">{month}:</span>
                  <span className="ml-1 text-muted-foreground">
                    {(stats.avg_magnitude * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Custom Tooltip */}
      <ChartTooltip
        visible={tooltipData.visible}
        x={tooltipData.x}
        y={tooltipData.y}
        title={tooltipData.title}
        items={tooltipData.items}
      />
    </div>
  );
}