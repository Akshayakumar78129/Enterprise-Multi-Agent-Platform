"use client";

import React, { useState } from 'react';
import { getShiftClickManager } from 'components/index';

interface HeatmapCell {
  category: string;
  warehouse: string;
  healthScore: number;
  itemCount: number;
  totalCurrent: number;
  totalRecommended: number;
  totalSavings: number;
  avgServiceLevel: number;
}

interface InventoryHealthHeatmapProps {
  data: {
    cells: HeatmapCell[];
    categories: string[];
    warehouses: string[];
  };
  loading?: boolean;
}

export function InventoryHealthHeatmap({ data, loading = false }: InventoryHealthHeatmapProps) {
  const shiftClickManager = getShiftClickManager();
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface/50 rounded w-1/2"></div>
          <div className="h-96 bg-surface/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.cells || data.cells.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="h-96 flex items-center justify-center text-muted-foreground">
          No heatmap data available
        </div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/80';
    if (score >= 60) return 'bg-cyan-500/80';
    if (score >= 40) return 'bg-yellow-500/80';
    if (score >= 20) return 'bg-orange-500/80';
    return 'bg-red-500/80';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  };

  const handleCellClick = (cell: HeatmapCell, event: React.MouseEvent) => {
    if (event.shiftKey) {
      shiftClickManager.addPoint({
        label: `${cell.category} - ${cell.warehouse}`,
        value: `Health: ${cell.healthScore}, Items: ${cell.itemCount}, Savings: $${cell.totalSavings.toFixed(2)}`,
        source: 'Inventory Health Heatmap'
      }, event.nativeEvent);
    } else {
      setSelectedCell(cell);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="mb-6 flex items-center justify-end gap-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 bg-green-500/80 rounded"></div>
          <span>Excellent (80+)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 bg-cyan-500/80 rounded"></div>
          <span>Good (60-79)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 bg-yellow-500/80 rounded"></div>
          <span>Fair (40-59)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 bg-red-500/80 rounded"></div>
          <span>Poor (&lt;40)</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-border bg-muted/30 p-3 text-left text-sm font-medium text-foreground sticky left-0 z-10">
                  Category
                </th>
                {data.warehouses.map((warehouse) => (
                  <th key={warehouse} className="border border-border bg-muted/30 p-3 text-center text-sm font-medium text-foreground min-w-[120px]">
                    {warehouse}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.categories.map((category) => (
                <tr key={category}>
                  <td className="border border-border bg-muted/30 p-3 text-sm font-medium text-foreground sticky left-0 z-10">
                    {category}
                  </td>
                  {data.warehouses.map((warehouse) => {
                    const cell = data.cells.find(
                      c => c.category === category && c.warehouse === warehouse
                    );

                    if (!cell) {
                      return (
                        <td key={`${category}-${warehouse}`} className="border border-border p-3 bg-muted/10">
                          <div className="text-center text-xs text-muted-foreground">-</div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${category}-${warehouse}`}
                        className={`border border-border p-3 cursor-pointer transition-all hover:opacity-80 ${
                          selectedCell === cell ? 'ring-2 ring-accent' : ''
                        }`}
                        onClick={(e) => handleCellClick(cell, e)}
                      >
                        <div className={`${getHealthColor(cell.healthScore)} rounded-lg p-3`}>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white mb-1">
                              {cell.healthScore}
                            </div>
                            <div className="text-xs text-white/90">
                              {getHealthLabel(cell.healthScore)}
                            </div>
                            <div className="text-xs text-white/75 mt-1">
                              {cell.itemCount} items
                            </div>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Cell Details */}
      {selectedCell && (
        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
          <h5 className="text-sm font-semibold text-foreground mb-3">
            {selectedCell.category} - {selectedCell.warehouse}
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Health Score</p>
              <p className="text-lg font-semibold text-foreground">{selectedCell.healthScore}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Items</p>
              <p className="text-lg font-semibold text-foreground">{selectedCell.itemCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
              <p className="text-lg font-semibold text-foreground">{selectedCell.totalCurrent.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recommended Stock</p>
              <p className="text-lg font-semibold text-foreground">{selectedCell.totalRecommended.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Potential Savings</p>
              <p className="text-lg font-semibold text-green-500">${selectedCell.totalSavings.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Service Level</p>
              <p className="text-lg font-semibold text-foreground">{selectedCell.avgServiceLevel}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
