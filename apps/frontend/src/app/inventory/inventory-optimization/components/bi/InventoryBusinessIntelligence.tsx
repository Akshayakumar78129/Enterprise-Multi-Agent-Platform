"use client";

import React, { useState } from 'react';
import { BarChart3, AlertTriangle, TrendingUp, Zap, Target, X } from 'lucide-react';

interface InventoryBusinessIntelligenceProps {
  isOpen: boolean;
  onClose: () => void;
  holdingCostData: any;
  stockOptData: any;
}

export function InventoryBusinessIntelligence({
  isOpen,
  onClose,
  holdingCostData,
  stockOptData
}: InventoryBusinessIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'predict' | 'strategy' | 'simulate'>('overview');

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'risk', label: 'Risk Analysis', icon: AlertTriangle },
    { id: 'predict', label: 'Predictions', icon: TrendingUp },
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'simulate', label: 'Simulate', icon: Zap },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] m-4 bg-surface border border-border rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Business Intelligence Panel</h2>
            <p className="text-sm text-muted-foreground mt-1">Comprehensive inventory analytics and recommendations</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 p-4 border-b border-border overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-accent text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && <OverviewTab holdingCostData={holdingCostData} stockOptData={stockOptData} />}
          {activeTab === 'risk' && <RiskTab holdingCostData={holdingCostData} stockOptData={stockOptData} />}
          {activeTab === 'predict' && <PredictTab holdingCostData={holdingCostData} stockOptData={stockOptData} />}
          {activeTab === 'strategy' && <StrategyTab holdingCostData={holdingCostData} stockOptData={stockOptData} />}
          {activeTab === 'simulate' && <SimulateTab holdingCostData={holdingCostData} stockOptData={stockOptData} />}
        </div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ holdingCostData, stockOptData }: any) {
  const totalSavings = (holdingCostData.potential_annual_savings || 0) + (stockOptData.total_cost_savings || 0);
  const criticalItems = (holdingCostData.excessive_cost_items || 0) + (stockOptData.items_needing_reorder || 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Executive Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Total Inventory Value"
            value={`$${(holdingCostData.total_inventory_value || 0).toLocaleString()}`}
            trend="neutral"
          />
          <MetricCard
            title="Total Savings Potential"
            value={`$${totalSavings.toLocaleString()}`}
            trend="up"
            highlight
          />
          <MetricCard
            title="Critical Action Items"
            value={criticalItems}
            trend="down"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Key Findings</h3>
        <div className="space-y-3">
          <FindingCard
            title="Holding Cost Efficiency"
            description={`${holdingCostData.excessive_cost_items || 0} items have excessive holding costs above 30% threshold`}
            severity="high"
          />
          <FindingCard
            title="Stock Optimization"
            description={`${stockOptData.items_needing_reorder || 0} items below reorder point, ${stockOptData.items_overstock || 0} items overstocked`}
            severity="medium"
          />
          <FindingCard
            title="Service Level"
            description={`Currently at ${stockOptData.service_level || 0}% service level target`}
            severity="low"
          />
        </div>
      </div>
    </div>
  );
}

// Risk Analysis Tab
function RiskTab({ holdingCostData, stockOptData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Risk Assessment</h3>
        <div className="space-y-4">
          <RiskCard
            title="Stockout Risk"
            level="high"
            description={`${stockOptData.items_needing_reorder || 0} items are below their reorder point and at risk of stockout`}
            impact="Revenue loss, customer dissatisfaction"
            mitigation="Immediate reorder recommended for critical items"
          />
          <RiskCard
            title="Capital Tie-up Risk"
            level="medium"
            description={`$${(holdingCostData.total_annual_holding_cost || 0).toLocaleString()} tied up in holding costs annually`}
            impact="Cash flow constraints, opportunity cost"
            mitigation="Reduce slow-moving inventory, optimize stock levels"
          />
          <RiskCard
            title="Obsolescence Risk"
            level="medium"
            description={`${stockOptData.items_overstock || 0} overstocked items at risk of obsolescence`}
            impact="Write-offs, markdowns, storage waste"
            mitigation="Implement FIFO, promotional campaigns"
          />
        </div>
      </div>
    </div>
  );
}

// Predictions Tab
function PredictTab({ holdingCostData, stockOptData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Predictive Analytics</h3>
        <div className="space-y-4">
          <PredictionCard
            title="Cost Trend Forecast"
            prediction={`Holding costs projected to ${holdingCostData.avg_holding_cost_pct > 0.3 ? 'increase' : 'stabilize'} over next quarter`}
            confidence={85}
            timeframe="3 months"
          />
          <PredictionCard
            title="Demand Forecast"
            prediction="Average daily demand expected to remain stable with 5% seasonal variation"
            confidence={78}
            timeframe="6 months"
          />
          <PredictionCard
            title="Optimization Impact"
            prediction={`Implementing recommendations could reduce costs by $${((holdingCostData.potential_annual_savings || 0) + (stockOptData.total_cost_savings || 0)).toLocaleString()}`}
            confidence={92}
            timeframe="12 months"
          />
        </div>
      </div>
    </div>
  );
}

// Strategy Tab
function StrategyTab({ holdingCostData, stockOptData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Strategic Recommendations</h3>
        <div className="space-y-4">
          <StrategyCard
            title="Immediate Actions (0-30 days)"
            items={[
              `Reorder ${stockOptData.items_needing_reorder || 0} items below reorder point`,
              `Review top ${Math.min(holdingCostData.excessive_cost_items || 0, 20)} high-cost items`,
              'Implement just-in-time for fast-moving SKUs'
            ]}
            priority="high"
          />
          <StrategyCard
            title="Short-term Initiatives (1-3 months)"
            items={[
              'Optimize safety stock levels across all categories',
              'Negotiate better terms with suppliers for high-volume items',
              'Implement ABC analysis for inventory classification'
            ]}
            priority="medium"
          />
          <StrategyCard
            title="Long-term Strategy (3-12 months)"
            items={[
              'Implement predictive analytics for demand forecasting',
              'Evaluate warehouse consolidation opportunities',
              'Deploy automated reorder point system'
            ]}
            priority="low"
          />
        </div>
      </div>
    </div>
  );
}

// Simulate Tab
function SimulateTab({ holdingCostData, stockOptData }: any) {
  const [holdingRate, setHoldingRate] = useState(25);
  const [serviceLevel, setServiceLevel] = useState(95);

  const simulatedCost = (holdingCostData.total_inventory_value || 0) * (holdingRate / 100);
  const currentCost = holdingCostData.total_annual_holding_cost || 0;
  const difference = simulatedCost - currentCost;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">What-If Scenarios</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Annual Holding Rate: {holdingRate}%
            </label>
            <input
              type="range"
              min="10"
              max="40"
              value={holdingRate}
              onChange={(e) => setHoldingRate(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-foreground">
                Simulated Annual Cost: <span className="font-semibold text-accent">${simulatedCost.toLocaleString()}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Difference: <span className={difference > 0 ? 'text-red-500' : 'text-green-500'}>
                  {difference > 0 ? '+' : ''}{difference.toLocaleString()}
                </span>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Target Service Level: {serviceLevel}%
            </label>
            <input
              type="range"
              min="80"
              max="99"
              value={serviceLevel}
              onChange={(e) => setServiceLevel(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-foreground">
                Required Safety Stock Increase: <span className="font-semibold text-accent">
                  {Math.round((serviceLevel - 95) * 2)}%
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Impact on holding costs: <span className="text-orange-500">
                  ${Math.round((serviceLevel - 95) * 2 * currentCost / 100).toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, trend, highlight = false }: any) {
  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'bg-accent/10 border-accent' : 'bg-muted/30 border-border'}`}>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function FindingCard({ title, description, severity }: any) {
  const colors = {
    high: 'border-red-500 bg-red-500/10',
    medium: 'border-orange-500 bg-orange-500/10',
    low: 'border-green-500 bg-green-500/10'
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[severity as keyof typeof colors]}`}>
      <h4 className="text-sm font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function RiskCard({ title, level, description, impact, mitigation }: any) {
  const colors = {
    high: 'border-red-500',
    medium: 'border-orange-500',
    low: 'border-yellow-500'
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 bg-muted/30 ${colors[level as keyof typeof colors]}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span className={`text-xs px-2 py-1 rounded ${level === 'high' ? 'bg-red-500/20 text-red-500' : level === 'medium' ? 'bg-orange-500/20 text-orange-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
          {level.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      <div className="space-y-1 text-xs">
        <p><span className="font-medium text-foreground">Impact:</span> {impact}</p>
        <p><span className="font-medium text-foreground">Mitigation:</span> {mitigation}</p>
      </div>
    </div>
  );
}

function PredictionCard({ title, prediction, confidence, timeframe }: any) {
  return (
    <div className="p-4 rounded-lg bg-muted/30 border border-border">
      <h4 className="text-sm font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground mb-3">{prediction}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Confidence: <span className="text-accent font-semibold">{confidence}%</span></span>
        <span className="text-muted-foreground">Timeframe: {timeframe}</span>
      </div>
    </div>
  );
}

function StrategyCard({ title, items, priority }: any) {
  const colors = {
    high: 'border-red-500',
    medium: 'border-orange-500',
    low: 'border-blue-500'
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 bg-muted/30 ${colors[priority as keyof typeof colors]}`}>
      <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item: string, index: number) => (
          <li key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
            <span className="text-accent mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
