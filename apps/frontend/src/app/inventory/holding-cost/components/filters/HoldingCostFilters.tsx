"use client";

import React from 'react';
import { Sliders } from 'lucide-react';

interface HoldingCostFiltersProps {
  annualHoldingRate: number;
  opportunityRate: number;
  riskThreshold: number;
  onAnnualHoldingRateChange: (value: number) => void;
  onOpportunityRateChange: (value: number) => void;
  onRiskThresholdChange: (value: number) => void;
}

export function HoldingCostFilters({
  annualHoldingRate,
  opportunityRate,
  riskThreshold,
  onAnnualHoldingRateChange,
  onOpportunityRateChange,
  onRiskThresholdChange,
}: HoldingCostFiltersProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Sliders className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold text-foreground">Cost Parameters</h3>
      </div>

      <div className="space-y-6">
        {/* Annual Holding Cost Rate */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">
              Annual Holding Cost Rate
            </label>
            <span className="text-sm text-accent font-semibold">{annualHoldingRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={annualHoldingRate}
            onChange={(e) => onAnnualHoldingRateChange(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span>50%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Percentage of inventory value spent annually to hold stock
          </p>
        </div>

        {/* Opportunity Cost Rate */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">
              Opportunity Cost Rate
            </label>
            <span className="text-sm text-accent font-semibold">{opportunityRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={opportunityRate}
            onChange={(e) => onOpportunityRateChange(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span>20%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Cost of capital tied up in inventory instead of other investments
          </p>
        </div>

        {/* Risk Threshold */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">
              Excessive Cost Threshold
            </label>
            <span className="text-sm text-accent font-semibold">{riskThreshold}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="50"
            step="5"
            value={riskThreshold}
            onChange={(e) => onRiskThresholdChange(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>20%</span>
            <span>50%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Items with holding cost above this percentage are flagged as excessive
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
        <p className="text-sm text-foreground">
          <span className="font-semibold">Current Cost Model:</span> Holding cost includes storage,
          opportunity, and risk costs. Adjust parameters to model your business constraints.
        </p>
      </div>
    </div>
  );
}
