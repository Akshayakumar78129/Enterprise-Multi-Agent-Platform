"use client";

import React, { useMemo } from 'react';
import { Card, Skeleton, getShiftClickManager } from 'components/index';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from '@/lib/rechartsSetup';
interface CapitalAllocationData {
  category: string;
  amount: number;
  percentage: number;
  allocation_type: string;
}

interface CapitalAllocationMatrixProps {
  data: CapitalAllocationData[];
  loading?: boolean;
}

const ALLOCATION_COLORS: Record<string, string> = {
  growth: '#00ff88',       // Green - Value creating
  operations: '#ffc145',   // Amber - Neutral
  returns: '#00e0ff',      // Electric Cyan - Baseline
  other: '#9b59b6',        // Purple
};

export function CapitalAllocationMatrix({ data, loading }: CapitalAllocationMatrixProps) {
  const shiftClickManager = getShiftClickManager();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter(item => item.amount > 0)
      .map(item => ({
        name: item.category,
        value: item.amount,
        percentage: item.percentage,
        allocationType: item.allocation_type,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const totalAmount = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const handlePieClick = (data: any) => {
    if (!shiftClickManager.isShiftKeyPressed()) return;

    if (data && data.name) {
      shiftClickManager.addPoint({
        label: `Category: ${data.name}`,
        value: `Amount: $${(data.value / 1000000).toFixed(2)}M | ${data.percentage.toFixed(1)}% | Type: ${data.allocationType}`,
        source: 'Capital Allocation Matrix',
        chartType: 'pie'
      }, data);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton height={400} className="animate-pulse" />
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          No capital allocation data available
        </div>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm mb-2">{data.name}</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-semibold text-foreground">
              ${(data.value / 1000000).toFixed(2)}M
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Percentage:</span>
            <span className="font-semibold text-foreground">
              {data.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-semibold text-foreground capitalize">
              {data.allocationType}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage.toFixed(1)}%`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={120}
                  innerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                  onClick={handlePieClick}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={ALLOCATION_COLORS[entry.allocationType] || ALLOCATION_COLORS.other}
                      opacity={0.85}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown Table */}
          <div className="flex-1 w-full">
            <div className="bg-muted/20 rounded-lg p-4 space-y-3">
              <div className="text-center pb-3 border-b border-border">
                <p className="text-xs text-muted-foreground">Total Allocation</p>
                <p className="text-2xl font-bold text-foreground">
                  ${(totalAmount / 1000000).toFixed(2)}M
                </p>
              </div>

              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {chartData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-background/50 rounded border border-border/50"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{
                          backgroundColor: ALLOCATION_COLORS[item.allocationType] || ALLOCATION_COLORS.other,
                        }}
                      ></div>
                      <span className="text-xs font-medium text-foreground truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-semibold text-foreground">
                        ${(item.value / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Type Legend */}
        <div className="flex items-center justify-center gap-6 text-xs border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: ALLOCATION_COLORS.growth }}></div>
            <span className="text-muted-foreground">Growth Initiatives</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: ALLOCATION_COLORS.operations }}></div>
            <span className="text-muted-foreground">Operations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: ALLOCATION_COLORS.returns }}></div>
            <span className="text-muted-foreground">Returns to Shareholders</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: ALLOCATION_COLORS.other }}></div>
            <span className="text-muted-foreground">Other</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
