"use client";

import React from 'react';
import { ChartCard, getShiftClickManager } from 'components/index';

interface SegmentForecastTableProps {
  data: any[];
  loading?: boolean;
}

export function SegmentForecastTable({ data, loading }: SegmentForecastTableProps) {
  const shiftClickManager = getShiftClickManager();

  if (loading) {
    return (
      <ChartCard loading={loading}>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ChartCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ChartCard>
        <div className="h-64 flex items-center justify-center text-muted">
          No segment forecast data available
        </div>
      </ChartCard>
    );
  }

  const totalRevenue = data.reduce((sum, seg) => sum + (seg.total_revenue || 0), 0);

  return (
    <ChartCard
      onShiftClick={(event) => {
        const topSegment = data[0];
        shiftClickManager.addPoint({
          label: "Segment Forecast Breakdown",
          value: `${data.length} segments | Top: ${topSegment?.segment} ($${(topSegment?.total_revenue || 0).toLocaleString(undefined, { notation: 'compact' })})`,
          source: 'Revenue Forecast - Segment Breakdown'
        }, event.nativeEvent);
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Segment</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Avg Monthly Revenue</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Total Revenue</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Months</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Volatility</th>
            </tr>
          </thead>
          <tbody>
            {data.map((segment, index) => (
              <tr
                key={index}
                className="border-b border-border/50 hover:bg-card/50 transition-colors"
              >
              <td className="py-3 px-4 text-sm font-medium text-foreground">
                {segment.segment}
              </td>
              <td className="py-3 px-4 text-sm text-right text-foreground">
                ${(segment.avg_monthly_revenue || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </td>
              <td className="py-3 px-4 text-sm text-right text-foreground">
                ${(segment.total_revenue || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </td>
              <td className="py-3 px-4 text-sm text-right text-muted">
                {segment.month_count || 0}
              </td>
              <td className="py-3 px-4 text-sm text-right">
                <span className={`
                  ${(segment.volatility_pct || 0) > 50 ? 'text-error' :
                    (segment.volatility_pct || 0) > 25 ? 'text-warning' : 'text-success'}
                `}>
                  {(segment.volatility_pct || 0).toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </ChartCard>
  );
}
