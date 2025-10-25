import React from 'react';
import {
  ChartCard,
  Skeleton,
  ChartTooltip,
  useChartTooltip,
  getShiftClickManager
} from 'components';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

interface BusinessComparisonProps {
  data: any;
  loading?: boolean;
}

const COLORS = {
  sales: '#00E0FF',    // Electric Cyan
  customer: '#9333EA', // Purple
  finance: '#10B981'   // Emerald
};

export function BusinessComparison({
  data,
  loading
}: BusinessComparisonProps) {
  const { tooltipData, handleMouseMove, handleMouseLeave } = useChartTooltip();
  const shiftClickManager = getShiftClickManager();

  const radarData = data?.radar || {};

  // Transform data for radar chart - MUST be before any conditional returns
  const chartData = React.useMemo(() => {
    const dimensions = new Set<string>();

    // Get all unique dimensions
    Object.values(radarData).forEach((functionData: any) => {
      functionData?.forEach((item: any) => {
        dimensions.add(item.dimension || item.t);
      });
    });

    // Create data points for each dimension
    return Array.from(dimensions).map(dimension => {
      const point: any = { dimension };

      Object.entries(radarData).forEach(([func, functionData]: [string, any]) => {
        const item = functionData?.find((d: any) => (d.dimension || d.t) === dimension);
        point[func] = item ? (item.value || item.v) * 100 : 0;
      });

      return point;
    });
  }, [radarData]);

  // Loading state - AFTER all hooks
  if (loading) {
    return (
      <ChartCard className="h-96">
        <Skeleton className="h-full" />
      </ChartCard>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span
                className="text-sm"
                style={{ color: entry.color }}
              >
                {entry.name}:
              </span>
              <span className="text-sm font-medium">
                {entry.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "Business Function Comparison",
          value: `Comparative analysis across business dimensions`,
          source: 'Performance Deviation - Business Comparison'
        }, event.nativeEvent);
      }}
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid
              stroke="#3a4459"
              strokeDasharray="3 3"
              radialLines={true}
            />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tickCount={5}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />

            {Object.keys(radarData).map(func => (
              <Radar
                key={func}
                name={func.charAt(0).toUpperCase() + func.slice(1)}
                dataKey={func}
                stroke={COLORS[func as keyof typeof COLORS] || '#6B7280'}
                fill={COLORS[func as keyof typeof COLORS] || '#6B7280'}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}

            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-sm capitalize">{value}</span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {Object.entries(radarData).map(([func, data]: [string, any]) => {
          // Calculate average score for each function
          const avgScore = data?.reduce((sum: number, item: any) =>
            sum + (item.value || item.v || 0), 0
          ) / (data?.length || 1) * 100;

          return (
            <div
              key={func}
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: `${COLORS[func as keyof typeof COLORS]}10`,
                borderColor: `${COLORS[func as keyof typeof COLORS]}40`
              }}
            >
              <p className="text-xs text-muted-foreground capitalize">{func}</p>
              <p
                className="text-lg font-bold"
                style={{ color: COLORS[func as keyof typeof COLORS] }}
              >
                {avgScore.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}