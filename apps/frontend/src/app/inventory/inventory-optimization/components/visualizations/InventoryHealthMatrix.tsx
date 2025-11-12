"use client";

import React from 'react';
import { Activity } from 'lucide-react';

interface InventoryHealthMatrixProps {
  holdingCostData: any;
  stockOptData: any;
  loading?: boolean;
}

interface MatrixCell {
  category: string;
  healthScore: number;
  value: number;
  issues: number;
}

export function InventoryHealthMatrix({
  holdingCostData,
  stockOptData,
  loading = false
}: InventoryHealthMatrixProps) {
  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate health scores by category
  const matrixData: MatrixCell[] = (holdingCostData.category_analysis || []).map((cat: any) => {
    const categoryItems = (stockOptData.recommendations || []).filter(
      (rec: any) => rec.category === cat.category
    );

    const needsReorder = categoryItems.filter((item: any) =>
      item.currentLevel <= item.reorderPoint
    ).length;

    const overstock = categoryItems.filter((item: any) =>
      item.currentLevel > item.recommendedLevel * 1.3
    ).length;

    // Health score calculation (0-100)
    let healthScore = 100;
    const totalCategoryItems = categoryItems.length || 1;

    // Penalties
    healthScore -= (needsReorder / totalCategoryItems) * 30;
    healthScore -= (overstock / totalCategoryItems) * 20;
    healthScore -= Math.min((cat.avg_holding_cost_pct || 0) * 100, 30);

    return {
      category: cat.category || 'Unknown',
      healthScore: Math.max(0, Math.round(healthScore)),
      value: cat.total_value || 0,
      issues: needsReorder + overstock,
    };
  });

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">Inventory Health Matrix</h3>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-muted-foreground">Excellent</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-muted-foreground">Good</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-muted-foreground">Fair</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-muted-foreground">Poor</span>
          </div>
        </div>
      </div>

      {matrixData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>No data available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {matrixData.map((cell, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-4 hover:border-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground truncate">
                  {cell.category}
                </h4>
                <div
                  className={`w-3 h-3 rounded-full ${getHealthColor(cell.healthScore)}`}
                  title={`Health Score: ${cell.healthScore}`}
                ></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Health</span>
                  <span className="text-xs font-medium text-foreground">
                    {getHealthLabel(cell.healthScore)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Score</span>
                  <span className="text-xs font-medium text-accent">
                    {cell.healthScore}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Value</span>
                  <span className="text-xs font-medium text-foreground">
                    ${(cell.value / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Issues</span>
                  <span className={`text-xs font-medium ${cell.issues > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {cell.issues}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
