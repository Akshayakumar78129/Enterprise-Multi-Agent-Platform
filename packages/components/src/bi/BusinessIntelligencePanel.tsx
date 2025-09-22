"use client";

import React, { useState, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../ui/Button";

interface ChurnCustomer {
  customer_id: number | string;
  name?: string;
  risk_level: "Low" | "Medium" | "High" | "Very High";
  churn_probability: number;
  avg_order_value?: number;
  frequency?: number;
  lifetime_value?: number;
}

interface BusinessIntelligencePanelProps {
  onClose: () => void;
  customers?: ChurnCustomer[];
  dashboardContext?: string;
}

export function BusinessIntelligencePanel({
  onClose,
  customers = [],
  dashboardContext = "churn"
}: BusinessIntelligencePanelProps) {
  const [activeView, setActiveView] = useState<"overview" | "assessment" | "prediction" | "strategy" | "simulation">("overview");
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [actionTaken, setActionTaken] = useState<{ [key: string]: "accepted" | "snoozed" }>({});

  // Calculate metrics
  const highRiskCustomers = customers.filter(
    c => c.risk_level === "High" || c.risk_level === "Very High"
  );
  const avgCustomerValue = 45000;
  const totalRevenueAtRisk = highRiskCustomers.length * avgCustomerValue;

  // Risk Assessment
  const assessRisk = useCallback(() => {
    const impactScore = customers.length > 0 ? (highRiskCustomers.length / customers.length) * 100 : 0;
    const toleranceLevel =
      impactScore > 30 ? "Critical" :
      impactScore > 20 ? "High" :
      impactScore > 10 ? "Medium" : "Low";

    return {
      toleranceLevel,
      impactScore,
      revenueAtRisk: totalRevenueAtRisk,
      affectedCustomers: highRiskCustomers.length,
      recommendation:
        toleranceLevel === "Critical"
          ? "IMMEDIATE ACTION REQUIRED"
          : toleranceLevel === "High"
          ? "URGENT ACTION NEEDED"
          : "MONITOR CLOSELY"
    };
  }, [highRiskCustomers, customers, totalRevenueAtRisk]);

  const riskData = assessRisk();

  // Simplified strategies for panel view
  const strategies = [
    {
      id: "discount",
      name: "Discount Campaign",
      roi: "320%",
      cost: "$50K",
      time: "1 week"
    },
    {
      id: "outreach",
      name: "VIP Outreach",
      roi: "450%",
      cost: "$20K",
      time: "3 days"
    },
    {
      id: "loyalty",
      name: "Loyalty Program",
      roi: "280%",
      cost: "$75K",
      time: "2 weeks"
    }
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - simplified without icons */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Business Intelligence</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="w-7 h-7"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Compact Tab Navigation */}
      <div className="flex border-b px-2 overflow-x-auto">
        {[
          { id: "overview", label: "Overview" },
          { id: "assessment", label: "Risk" },
          { id: "prediction", label: "Predict" },
          { id: "strategy", label: "Strategy" },
          { id: "simulation", label: "Simulate" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={cn(
              "px-3 py-2 text-xs font-medium transition-colors relative whitespace-nowrap",
              activeView === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {activeView === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Overview */}
        {activeView === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="mb-1">
                  <span className="font-semibold text-sm">High Risk</span>
                </div>
                <div className="text-xl font-bold">{highRiskCustomers.length}</div>
                <div className="text-xs text-muted-foreground">
                  {((highRiskCustomers.length / Math.max(customers.length, 1)) * 100).toFixed(1)}% of total
                </div>
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="mb-1">
                  <span className="font-semibold text-sm">Revenue Risk</span>
                </div>
                <div className="text-xl font-bold">
                  ${(totalRevenueAtRisk / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-muted-foreground">Next 3 months</div>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="mb-1">
                  <span className="font-semibold text-sm">Action Level</span>
                </div>
                <div className="text-xl font-bold">{riskData.toleranceLevel}</div>
                <div className="text-xs text-muted-foreground">Risk tolerance</div>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-card">
              <h4 className="font-semibold text-sm mb-2">Summary</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {highRiskCustomers.length} customers at high risk, representing
                ${(totalRevenueAtRisk / 1000).toFixed(0)}K in potential loss.
                {riskData.toleranceLevel === "Critical" && (
                  <span className="text-destructive font-semibold"> Immediate intervention required.</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        {activeView === "assessment" && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border bg-card">
              <h4 className="font-semibold text-sm mb-3">Risk Analysis</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Impact Score</span>
                  <span className="font-semibold">{riskData.impactScore.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      riskData.impactScore > 30 ? "bg-destructive" :
                      riskData.impactScore > 20 ? "bg-warning" : "bg-success"
                    )}
                    style={{ width: `${Math.min(riskData.impactScore, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Affected</span>
                  <span className="font-semibold">{riskData.affectedCustomers} customers</span>
                </div>
                <div className="p-2 rounded bg-primary/10 border border-primary/20">
                  <div className="text-xs font-semibold">{riskData.recommendation}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Predictions */}
        {activeView === "prediction" && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">3-Month Outcomes</h4>
            {[
              { scenario: "No Action", impact: -70, rate: 65, severity: "Severe" },
              { scenario: "Partial Action", impact: -30, rate: 35, severity: "Moderate" },
              { scenario: "Full Action", impact: -10, rate: 15, severity: "Minimal" }
            ].map((outcome) => (
              <div key={outcome.scenario} className="p-3 rounded-lg border text-xs">
                <div className="font-semibold mb-2">{outcome.scenario}</div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Revenue Impact</span>
                  <span className={cn("font-semibold", outcome.impact < -30 ? "text-destructive" : "text-warning")}>
                    {outcome.impact}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Churn Rate</span>
                  <span className="font-semibold">{outcome.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Strategies */}
        {activeView === "strategy" && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Retention Strategies</h4>
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  selectedStrategy?.id === strategy.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                )}
                onClick={() => setSelectedStrategy(strategy)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="font-semibold text-xs mb-1">{strategy.name}</div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>ROI: {strategy.roi}</span>
                      <span>{strategy.cost}</span>
                      <span>{strategy.time}</span>
                    </div>
                  </div>
                  {!actionTaken[strategy.id] ? (
                    <Button
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionTaken({ ...actionTaken, [strategy.id]: "accepted" });
                      }}
                    >
                      Accept
                    </Button>
                  ) : (
                    <div className="text-xs text-success">
                      <span>Accepted</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Simulation */}
        {activeView === "simulation" && selectedStrategy && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border bg-card">
              <h4 className="font-semibold text-sm mb-3">Simulation: {selectedStrategy.name}</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected ROI</span>
                  <span className="font-semibold text-success">{selectedStrategy.roi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investment</span>
                  <span className="font-semibold">{selectedStrategy.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time to Deploy</span>
                  <span className="font-semibold">{selectedStrategy.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customers Saved</span>
                  <span className="font-semibold text-success">
                    ~{Math.floor(highRiskCustomers.length * 0.65)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue Preserved</span>
                  <span className="font-semibold text-success">
                    ${Math.floor(totalRevenueAtRisk * 0.65 / 1000)}K
                  </span>
                </div>
              </div>
              <div className="mt-3 p-2 rounded bg-success/10 border border-success/20">
                <p className="text-xs">
                  High probability of retaining {Math.floor(highRiskCustomers.length * 0.65)} customers
                  and preserving ${Math.floor(totalRevenueAtRisk * 0.65 / 1000)}K in revenue.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeView === "simulation" && !selectedStrategy && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-muted-foreground">
              Select a strategy to run simulation
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 text-xs"
              onClick={() => setActiveView("strategy")}
            >
              View Strategies
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}