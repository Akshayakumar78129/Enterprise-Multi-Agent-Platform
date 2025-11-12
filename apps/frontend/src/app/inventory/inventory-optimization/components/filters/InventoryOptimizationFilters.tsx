"use client";

import React from 'react';
import { Settings } from 'lucide-react';

interface InventoryOptimizationFiltersProps {
  holdingRate: number;
  serviceLevel: number;
  leadTime: number;
  onHoldingRateChange: (value: number) => void;
  onServiceLevelChange: (value: number) => void;
  onLeadTimeChange: (value: number) => void;
}

export function InventoryOptimizationFilters({
  holdingRate,
  serviceLevel,
  leadTime,
  onHoldingRateChange,
  onServiceLevelChange,
  onLeadTimeChange,
}: InventoryOptimizationFiltersProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold text-foreground">Optimization Parameters</h3>
      </div>

      <div className="space-y-6">
        {/* Annual Holding Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              Annual Holding Rate
            </label>
            <span className="text-sm font-semibold text-accent">{holdingRate}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="50"
            step="1"
            value={holdingRate}
            onChange={(e) => onHoldingRateChange(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">10%</span>
            <span className="text-xs text-muted-foreground">Low Cost</span>
            <span className="text-xs text-muted-foreground">High Cost</span>
            <span className="text-xs text-muted-foreground">50%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Percentage of inventory value spent annually on storage, insurance, and capital costs
          </p>
        </div>

        {/* Target Service Level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              Target Service Level
            </label>
            <span className="text-sm font-semibold text-accent">{serviceLevel}%</span>
          </div>
          <input
            type="range"
            min="80"
            max="99"
            step="1"
            value={serviceLevel}
            onChange={(e) => onServiceLevelChange(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">80%</span>
            <span className="text-xs text-muted-foreground">Standard</span>
            <span className="text-xs text-muted-foreground">Premium</span>
            <span className="text-xs text-muted-foreground">99%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Probability of fulfilling customer orders without stockouts (higher = more safety stock)
          </p>
        </div>

        {/* Average Lead Time */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              Average Lead Time
            </label>
            <span className="text-sm font-semibold text-accent">{leadTime} days</span>
          </div>
          <input
            type="range"
            min="1"
            max="90"
            step="1"
            value={leadTime}
            onChange={(e) => onLeadTimeChange(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">1 day</span>
            <span className="text-xs text-muted-foreground">Fast</span>
            <span className="text-xs text-muted-foreground">Slow</span>
            <span className="text-xs text-muted-foreground">90 days</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Time between placing an order and receiving inventory (affects reorder points)
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-accent/10 border border-accent/30 rounded-lg">
        <p className="text-xs text-foreground">
          <span className="font-semibold">Note:</span> These parameters affect safety stock calculations, reorder points, and holding cost projections. Adjust based on your business requirements and industry standards.
        </p>
      </div>
    </div>
  );
}
