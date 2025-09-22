"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Brain,
  TrendingDown,
  AlertTriangle,
  Target,
  DollarSign,
  Users,
  Zap,
  Shield,
  ChevronRight,
  CheckCircle,
  Clock,
  Eye
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../ui/Button";

export interface ChurnCustomer {
  customer_id: number | string;
  name?: string;
  risk_level: "Low" | "Medium" | "High" | "Very High";
  churn_probability: number;
  avg_order_value?: number;
  frequency?: number;
  lifetime_value?: number;
}

interface RiskAssessment {
  toleranceLevel: "Low" | "Medium" | "High" | "Critical";
  impactScore: number;
  revenueAtRisk: number;
  affectedCustomers: number;
  segmentValue: string;
  recommendation: string;
}

interface PredictedOutcome {
  scenario: string;
  revenueImpact: number;
  churnRate: number;
  brandImpact: "Minimal" | "Moderate" | "Severe";
  timeframe: string;
  icon: string;
}

interface RetentionStrategy {
  id: string;
  name: string;
  type: "Discount" | "Outreach" | "Loyalty" | "Feedback" | "Premium";
  description: string;
  expectedROI: number;
  implementationCost: number;
  successProbability: number;
  timeToImplement: string;
  icon: React.ReactNode;
}

export interface BusinessIntelligenceModalProps {
  isVisible: boolean;
  onClose: () => void;
  customers?: ChurnCustomer[];
  dashboardContext?: string;
}

export function BusinessIntelligenceModal({
  isVisible,
  onClose,
  customers = [],
  dashboardContext = "churn"
}: BusinessIntelligenceModalProps) {
  const [activeView, setActiveView] = useState<"overview" | "assessment" | "prediction" | "strategy" | "simulation">("overview");
  const [selectedStrategy, setSelectedStrategy] = useState<RetentionStrategy | null>(null);
  const [actionTaken, setActionTaken] = useState<{ [key: string]: "accepted" | "snoozed" | "reviewed" }>({});

  // Calculate metrics
  const highRiskCustomers = customers.filter(
    c => c.risk_level === "High" || c.risk_level === "Very High"
  );
  const mediumRiskCustomers = customers.filter(c => c.risk_level === "Medium");
  const avgCustomerValue = 45000; // Average LTV
  const totalRevenueAtRisk = highRiskCustomers.length * avgCustomerValue;

  // Risk Assessment Logic
  const assessRisk = useCallback((): RiskAssessment => {
    const impactScore = customers.length > 0 ? (highRiskCustomers.length / customers.length) * 100 : 0;
    const toleranceLevel =
      impactScore > 30 ? "Critical" :
      impactScore > 20 ? "High" :
      impactScore > 10 ? "Medium" : "Low";

    const hasEnterpriseCustomers = highRiskCustomers.some(
      c => (c.avg_order_value || 0) > 100000
    );
    const segmentValue = hasEnterpriseCustomers ? "Enterprise & Mid-Market" : "SMB & Consumer";

    return {
      toleranceLevel,
      impactScore,
      revenueAtRisk: totalRevenueAtRisk,
      affectedCustomers: highRiskCustomers.length,
      segmentValue,
      recommendation:
        toleranceLevel === "Critical"
          ? "IMMEDIATE INTERVENTION REQUIRED - Risk exceeds tolerance levels"
          : toleranceLevel === "High"
          ? "URGENT ACTION NEEDED - Proactive engagement critical"
          : "MONITOR CLOSELY - Prepare retention strategies"
    };
  }, [highRiskCustomers, customers, totalRevenueAtRisk]);

  // Predict Outcomes
  const predictOutcomes = (): PredictedOutcome[] => {
    return [
      {
        scenario: "No Action Taken",
        revenueImpact: -(totalRevenueAtRisk * 0.7),
        churnRate: 65,
        brandImpact: "Severe",
        timeframe: "3 months",
        icon: ""
      },
      {
        scenario: "Partial Intervention",
        revenueImpact: -(totalRevenueAtRisk * 0.3),
        churnRate: 35,
        brandImpact: "Moderate",
        timeframe: "3 months",
        icon: ""
      },
      {
        scenario: "Full Strategy Implementation",
        revenueImpact: -(totalRevenueAtRisk * 0.1),
        churnRate: 15,
        brandImpact: "Minimal",
        timeframe: "3 months",
        icon: ""
      }
    ];
  };

  // Generate Retention Strategies
  const generateStrategies = (): RetentionStrategy[] => {
    return [
      {
        id: "discount-campaign",
        name: "Targeted Discount Campaign",
        type: "Discount",
        description: "Offer 20-30% discounts to high-risk segments with personalized messaging",
        expectedROI: 320,
        implementationCost: 50000,
        successProbability: 75,
        timeToImplement: "1 week",
        icon: <Target className="w-5 h-5" />
      },
      {
        id: "vip-outreach",
        name: "VIP Customer Outreach",
        type: "Outreach",
        description: "Personal calls from account managers to top 50 at-risk customers",
        expectedROI: 450,
        implementationCost: 20000,
        successProbability: 85,
        timeToImplement: "3 days",
        icon: <Users className="w-5 h-5" />
      },
      {
        id: "loyalty-program",
        name: "Enhanced Loyalty Rewards",
        type: "Loyalty",
        description: "Double loyalty points and exclusive perks for next 60 days",
        expectedROI: 280,
        implementationCost: 75000,
        successProbability: 70,
        timeToImplement: "2 weeks",
        icon: <Shield className="w-5 h-5" />
      }
    ];
  };

  const riskData = assessRisk();
  const outcomes = predictOutcomes();
  const strategies = generateStrategies();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] mx-4 bg-background rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Business Intelligence Analysis</h2>
              <p className="text-sm text-muted-foreground">
                AI-powered insights and recommendations
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b px-6 overflow-x-auto">
          {[
            { id: "overview", label: "Overview" },
            { id: "assessment", label: "Risk Assessment" },
            { id: "prediction", label: "Predictions" },
            { id: "strategy", label: "Strategies" },
            { id: "simulation", label: "Simulation" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-colors relative",
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Overview View */}
          {activeView === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span className="font-semibold">High Risk Customers</span>
                  </div>
                  <div className="text-2xl font-bold">{highRiskCustomers.length}</div>
                  <div className="text-sm text-muted-foreground">
                    {((highRiskCustomers.length / Math.max(customers.length, 1)) * 100).toFixed(1)}% of total
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-warning" />
                    <span className="font-semibold">Revenue at Risk</span>
                  </div>
                  <div className="text-2xl font-bold">
                    ${(totalRevenueAtRisk / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-muted-foreground">Next 3 months</div>
                </div>

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Action Required</span>
                  </div>
                  <div className="text-2xl font-bold">{riskData.toleranceLevel}</div>
                  <div className="text-sm text-muted-foreground">Risk tolerance level</div>
                </div>
              </div>

              <div className="p-6 rounded-lg border bg-card">
                <h3 className="font-semibold mb-3">Executive Summary</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your customer base shows a {riskData.toleranceLevel.toLowerCase()} risk profile with{" "}
                  <span className="font-semibold text-foreground">
                    {highRiskCustomers.length} customers
                  </span>{" "}
                  at high risk of churning. This represents{" "}
                  <span className="font-semibold text-foreground">
                    ${(totalRevenueAtRisk / 1000).toFixed(0)}K
                  </span>{" "}
                  in potential revenue loss over the next quarter.
                  {riskData.toleranceLevel === "Critical" && (
                    <span className="text-destructive font-semibold">
                      {" "}Immediate intervention is required to prevent significant business impact.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Risk Assessment View */}
          {activeView === "assessment" && (
            <div className="space-y-6">
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="font-semibold mb-4">Risk Tolerance Analysis</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Impact Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            riskData.impactScore > 30
                              ? "bg-destructive"
                              : riskData.impactScore > 20
                              ? "bg-warning"
                              : "bg-success"
                          )}
                          style={{ width: `${Math.min(riskData.impactScore, 100)}%` }}
                        />
                      </div>
                      <span className="font-semibold">{riskData.impactScore.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Segment Value</span>
                    <span className="font-semibold">{riskData.segmentValue}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Affected Customers</span>
                    <span className="font-semibold">{riskData.affectedCustomers}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="font-semibold text-sm mb-1">Recommendation</div>
                  <div className="text-sm">{riskData.recommendation}</div>
                </div>
              </div>
            </div>
          )}

          {/* Prediction View */}
          {activeView === "prediction" && (
            <div className="space-y-6">
              <h3 className="font-semibold">Projected Outcomes (3-Month Horizon)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {outcomes.map((outcome) => (
                  <div
                    key={outcome.scenario}
                    className={cn(
                      "p-4 rounded-lg border transition-all duration-300",
                      outcome.scenario.includes("No Action")
                        ? "border-destructive/20 bg-destructive/5"
                        : outcome.scenario.includes("Full")
                        ? "border-success/20 bg-success/5"
                        : "border-warning/20 bg-warning/5"
                    )}
                  >
                    <h4 className="font-semibold mb-2">{outcome.scenario}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue Impact</span>
                        <span className={cn(
                          "font-semibold",
                          outcome.revenueImpact < 0 ? "text-destructive" : "text-success"
                        )}>
                          ${(Math.abs(outcome.revenueImpact) / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Churn Rate</span>
                        <span className="font-semibold">{outcome.churnRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Brand Impact</span>
                        <span className={cn(
                          "font-semibold",
                          outcome.brandImpact === "Severe"
                            ? "text-destructive"
                            : outcome.brandImpact === "Moderate"
                            ? "text-warning"
                            : "text-success"
                        )}>
                          {outcome.brandImpact}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategy View */}
          {activeView === "strategy" && (
            <div className="space-y-6">
              <h3 className="font-semibold">Recommended Retention Strategies</h3>
              <div className="space-y-4">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all duration-300 cursor-pointer",
                      selectedStrategy?.id === strategy.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    )}
                    onClick={() => setSelectedStrategy(strategy)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {strategy.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{strategy.name}</h4>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-success font-semibold">
                              {strategy.expectedROI}% ROI
                            </span>
                            <span className="text-muted-foreground">
                              {strategy.successProbability}% success rate
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {strategy.description}
                        </p>
                        <div className="flex items-center gap-6 text-xs">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>${(strategy.implementationCost / 1000).toFixed(0)}K cost</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{strategy.timeToImplement}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!actionTaken[strategy.id] ? (
                          <>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionTaken({ ...actionTaken, [strategy.id]: "accepted" });
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionTaken({ ...actionTaken, [strategy.id]: "snoozed" });
                              }}
                            >
                              Snooze
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            {actionTaken[strategy.id] === "accepted" ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-success" />
                                <span className="text-success">Accepted</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4 text-warning" />
                                <span className="text-warning">Snoozed</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simulation View */}
          {activeView === "simulation" && selectedStrategy && (
            <div className="space-y-6">
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="font-semibold mb-4">Strategy Simulation: {selectedStrategy.name}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Simulation Inputs */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">SIMULATION PARAMETERS</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Base Retention Rate</span>
                        <span className="font-semibold">30%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Strategy Boost</span>
                        <span className="font-semibold text-success">+{(selectedStrategy.successProbability * 0.5).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Implementation Cost</span>
                        <span className="font-semibold">${(selectedStrategy.implementationCost / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Time to Deploy</span>
                        <span className="font-semibold">{selectedStrategy.timeToImplement}</span>
                      </div>
                    </div>
                  </div>

                  {/* Simulation Results */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">EXPECTED OUTCOMES</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Retention Increase</span>
                        <span className="font-semibold text-success">{(30 + selectedStrategy.successProbability * 0.5).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Preserved Revenue</span>
                        <span className="font-semibold text-success">
                          ${Math.floor(totalRevenueAtRisk * ((30 + selectedStrategy.successProbability * 0.5) / 100) / 1000)}K
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Prevented Churn</span>
                        <span className="font-semibold text-success">
                          {Math.floor(highRiskCustomers.length * ((30 + selectedStrategy.successProbability * 0.5) / 100))} customers
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">ROI</span>
                        <span className="font-semibold text-primary">{selectedStrategy.expectedROI}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="font-semibold text-sm">Simulation Summary</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Implementing this strategy has a {selectedStrategy.successProbability}% chance of retaining an additional{" "}
                    {Math.floor(highRiskCustomers.length * ((30 + selectedStrategy.successProbability * 0.5) / 100))} customers,
                    preserving ${Math.floor(totalRevenueAtRisk * ((30 + selectedStrategy.successProbability * 0.5) / 100) / 1000)}K in revenue
                    with a {selectedStrategy.expectedROI}% return on investment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeView === "simulation" && !selectedStrategy && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No Strategy Selected</h3>
              <p className="text-muted-foreground mb-4">Please select a strategy from the Strategies tab to run simulations</p>
              <Button
                onClick={() => setActiveView("strategy")}
                variant="outline"
              >
                View Strategies
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <div className="text-sm text-muted-foreground">
            Analysis based on {customers.length} customers
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => {
              // Export or take action
              console.log("Strategies accepted:", Object.entries(actionTaken).filter(([_, v]) => v === "accepted"));
            }}>
              Apply Strategies
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}