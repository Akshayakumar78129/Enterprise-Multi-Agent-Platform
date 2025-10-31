import React, { useMemo } from 'react';
import {
  ChartCard,
  Skeleton,
  getShiftClickManager
} from 'components';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ExternalFactorCorrelationProps {
  data: any;
  loading?: boolean;
}

const COLORS = {
  kpi: '#00E0FF',      // Electric Cyan
  factor1: '#9333EA',  // Purple
  factor2: '#10B981',  // Emerald
  factor3: '#F59E0B'   // Amber
};

export function ExternalFactorCorrelation({
  data,
  loading
}: ExternalFactorCorrelationProps) {
  const shiftClickManager = getShiftClickManager();

  // Transform correlation data for bar chart
  const chartData = useMemo(() => {
    const series = data?.series || {};
    const correlations: any[] = [];

    // Process each KPI's correlations
    Object.entries(series).forEach(([kpi, factors]: [string, any]) => {
      if (typeof factors === 'object' && factors !== null) {
        Object.entries(factors).forEach(([factor, value]) => {
          if (typeof value === 'number') {
            correlations.push({
              factor: factor.replace(/_/g, ' '),
              kpi: kpi.replace(/_/g, ' '),
              correlation: value,
              absCorrelation: Math.abs(value)
            });
          }
        });
      }
    });

    // Sort by absolute correlation and take top factors
    correlations.sort((a, b) => b.absCorrelation - a.absCorrelation);

    // Group by factor for better visualization
    const factorMap = new Map();
    const kpiSet = new Set<string>();

    // First pass: collect all KPI names
    correlations.forEach(item => kpiSet.add(item.kpi));

    // Second pass: group by factor
    correlations.slice(0, 10).forEach(item => {
      if (!factorMap.has(item.factor)) {
        const entry: any = { factor: item.factor };
        // Initialize all KPIs with 0
        kpiSet.forEach(kpi => {
          entry[kpi] = 0;
        });
        factorMap.set(item.factor, entry);
      }
      const entry = factorMap.get(item.factor);
      entry[item.kpi] = item.correlation;
    });

    return Array.from(factorMap.values());
  }, [data]);

  // Get strongest correlations - MUST be before any conditional returns
  const strongestCorrelation = useMemo(() => {
    const series = data?.series || {};
    let maxCorr = { factor: '', value: 0, kpi: '' };

    Object.entries(series).forEach(([kpi, factors]: [string, any]) => {
      if (typeof factors === 'object' && factors !== null) {
        Object.entries(factors).forEach(([factor, value]) => {
          if (typeof value === 'number' && Math.abs(value) > Math.abs(maxCorr.value)) {
            maxCorr = { factor, value, kpi };
          }
        });
      }
    });

    return maxCorr;
  }, [data]);

  // Loading state - AFTER all hooks
  if (loading) {
    return (
      <ChartCard className="h-96">
        <Skeleton className="h-full" />
      </ChartCard>
    );
  }

  // Get unique KPI names from chartData for dynamic bars
  const kpiNames = React.useMemo(() => {
    if (chartData.length === 0) return [];
    const firstItem = chartData[0];
    return Object.keys(firstItem).filter(key => key !== 'factor');
  }, [chartData]);

  // Empty state
  if (chartData.length === 0) {
    return (
      <ChartCard
        onShiftClick={(event) => {
          shiftClickManager.addPoint({
            label: "External Factor Correlation",
            value: `Correlation coefficients between KPIs and external factors`,
            source: 'Performance Deviation - External Factors'
          }, event.nativeEvent);
        }}
      >
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg">No correlation data available</p>
            <p className="text-sm mt-2">Try adjusting your filters or check back later</p>
          </div>
        </div>
      </ChartCard>
    );
  }

  const barColors = [COLORS.kpi, COLORS.factor1, COLORS.factor2, COLORS.factor3];

  return (
    <ChartCard
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "External Factor Correlation",
          value: `Correlation coefficients between KPIs and external factors`,
          source: 'Performance Deviation - External Factors'
        }, event.nativeEvent);
      }}
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" />
            <XAxis
              dataKey="factor"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#00E0FF' }}
              formatter={(value: number) => value.toFixed(3)}
            />
            <Legend
              verticalAlign="top"
              height={36}
            />
            {kpiNames.map((kpiName, index) => (
              <Bar
                key={kpiName}
                dataKey={kpiName}
                fill={barColors[index % barColors.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Correlation Summary */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-accent/5 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Strongest Correlation</p>
          <p className="text-lg font-semibold text-accent">
            {strongestCorrelation.factor.replace(/_/g, ' ')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            r = {strongestCorrelation.value.toFixed(3)}
          </p>
        </div>
        <div className="bg-purple-500/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Correlation Range</p>
          <p className="text-lg font-semibold text-purple-500">
            {chartData.length} Factors
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Analyzed
          </p>
        </div>
      </div>
    </ChartCard>
  );
}