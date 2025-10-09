"use client";

import React from 'react';
import { Card, getShiftClickManager } from 'components/index';
import { formatCurrency, formatNumber } from '../../utils/formatNumber';

interface ComparativePerformanceGridProps {
  data: any[];
  loading?: boolean;
  selectedDimension?: string;
  selectedMetric?: string;
}

export function ComparativePerformanceGrid({
  data,
  loading,
  selectedDimension = 'category',
  selectedMetric = 'revenue'
}: ComparativePerformanceGridProps) {
  const shiftClickManager = getShiftClickManager();

  // Handle shift+click on table rows
  const handleRowClick = (item: any, event: React.MouseEvent) => {
    if (event.shiftKey) {
      shiftClickManager.addPoint({
        label: `${selectedDimension}: ${item.name}`,
        value: `Revenue: ${formatCurrency(item.revenue)} | Units: ${formatNumber(item.units, 0)} | Avg Price: ${formatCurrency(item.avgPrice)} | Growth: ${formatNumber(item.growth)}%`,
        source: 'Comparative Performance Grid',
        chartType: 'table'
      }, event.nativeEvent);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading comparative data...</div>
        </div>
      </Card>
    );
  }

  const gridData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => ({
      name: item.productName || item.category || item.regionName || 'Unknown',
      revenue: item.revenue || 0,
      units: item.unitsSold || item.units || 0,
      avgPrice: item.avgPrice || 0,
      growth: item.growthRate || 0,
    }));
  }, [data]);

  return (
    <Card className="glass-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-left text-muted-foreground">
              <th className="pb-3 font-semibold">{selectedDimension?.charAt(0).toUpperCase() + selectedDimension?.slice(1)}</th>
              <th className="pb-3 text-right font-semibold">Revenue ($)</th>
              <th className="pb-3 text-right font-semibold">Units Sold</th>
              <th className="pb-3 text-right font-semibold">Avg Price ($)</th>
              <th className="pb-3 text-right font-semibold">Growth Rate</th>
            </tr>
          </thead>
          <tbody>
            {gridData.map((item, index) => (
              <tr
                key={index}
                className="border-b border-border/50 hover:bg-accent/10 transition-colors cursor-pointer"
                onClick={(e) => handleRowClick(item, e)}
              >
                <td className="py-3 text-foreground font-medium">{item.name}</td>
                <td className="py-3 text-right text-foreground">{formatCurrency(item.revenue)}</td>
                <td className="py-3 text-right text-foreground">{formatNumber(item.units, 0)}</td>
                <td className="py-3 text-right text-foreground">{formatCurrency(item.avgPrice)}</td>
                <td className={`py-3 text-right font-medium ${item.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {item.growth >= 0 ? '+' : ''}{formatNumber(item.growth)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
