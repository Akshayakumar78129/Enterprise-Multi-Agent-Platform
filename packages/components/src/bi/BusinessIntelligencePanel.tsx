"use client";

import React, { useState, useMemo } from "react";
import { X, TrendingUp, AlertTriangle, Info, CheckCircle, Lightbulb, Target } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../ui/Button";

// ==================== Type Definitions ====================

export interface Insight {
  type?: 'positive' | 'warning' | 'info' | 'critical';
  message: string;
  category?: string;
}

export interface BusinessIntelligencePanelProps {
  onClose: () => void;
  insights?: string[] | Insight[];
  dashboardContext?:
    | 'churn'
    | 'sales'
    | 'product'
    | 'customer'
    | 'anomaly'
    | 'segmentation'
    | 'transaction'
    | 'ltv'
    | 'engagement'
    | 'retention'
    | string;
  data?: any; // Dashboard-specific data
  kpiMetrics?: Record<string, any>; // KPIs for context
  customers?: any[]; // Legacy support for churn
}

interface TabConfig {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface ContextConfig {
  tabs: TabConfig[];
  title: string;
  color: string;
}

// ==================== Helper Functions ====================

/**
 * Normalize insights from various formats to unified Insight objects
 */
function normalizeInsights(insights?: string[] | Insight[] | any[]): Insight[] {
  if (!insights || insights.length === 0) return [];

  return insights.map((insight) => {
    // Handle string format
    if (typeof insight === 'string') {
      return {
        message: insight,
        type: categorizeInsightType(insight),
        category: categorizeInsightCategory(insight)
      };
    }

    // Handle engagement-classifier format: {type, title, description, action}
    if (insight.title && insight.description) {
      const message = insight.description;
      // Map engagement types to BI Panel types
      let type: Insight['type'] = 'info';
      if (insight.type === 'success') type = 'positive';
      else if (insight.type === 'alert') type = 'critical';
      else if (insight.type === 'warning') type = 'warning';

      return {
        message: message,
        type: type,
        category: categorizeInsightCategory(message)
      };
    }

    // Handle standard format: {type, message}
    return {
      ...insight,
      type: insight.type || categorizeInsightType(insight.message || ''),
      category: insight.category || categorizeInsightCategory(insight.message || '')
    };
  });
}

/**
 * Smart categorization based on message content
 */
function categorizeInsightType(message: string): Insight['type'] {
  const lower = message.toLowerCase();
  if (/critical|urgent|immediate|severe|danger/i.test(lower)) return 'critical';
  if (/warning|risk|decline|drop|below|decrease/i.test(lower)) return 'warning';
  if (/growth|increase|top|best|exceed|above|high.*margin|success/i.test(lower)) return 'positive';
  return 'info';
}

/**
 * Categorize insights into logical groups
 */
function categorizeInsightCategory(message: string): string {
  const lower = message.toLowerCase();
  if (/revenue|sales|income|earnings/i.test(lower)) return 'Revenue';
  if (/product|item|category/i.test(lower)) return 'Products';
  if (/customer|client|buyer/i.test(lower)) return 'Customers';
  if (/margin|profit|cost/i.test(lower)) return 'Profitability';
  if (/risk|churn|threat/i.test(lower)) return 'Risk';
  if (/trend|forecast|predict/i.test(lower)) return 'Trends';
  return 'General';
}

/**
 * Get icon for insight type
 */
function getInsightIcon(type?: Insight['type']) {
  switch (type) {
    case 'positive':
      return <CheckCircle className="w-3.5 h-3.5" />;
    case 'warning':
      return <AlertTriangle className="w-3.5 h-3.5" />;
    case 'critical':
      return <AlertTriangle className="w-3.5 h-3.5" />;
    case 'info':
    default:
      return <Info className="w-3.5 h-3.5" />;
  }
}

// ==================== Context Configurations ====================

const CONTEXT_CONFIGS: Record<string, ContextConfig> = {
  churn: {
    title: 'Decision Intelligence',
    color: 'destructive',
    tabs: [
      { id: 'insights', label: 'Insights' },
      { id: 'risk', label: 'Risk' },
      { id: 'recommendations', label: 'Actions' }
    ]
  },
  sales: {
    title: 'Decision Intelligence',
    color: 'primary',
    tabs: [
      { id: 'insights', label: 'Insights' },
      { id: 'performance', label: 'Performance' },
      { id: 'recommendations', label: 'Actions' }
    ]
  },
  product: {
    title: 'Decision Intelligence',
    color: 'primary',
    tabs: [
      { id: 'insights', label: 'Insights' },
      { id: 'performance', label: 'Performance' },
      { id: 'recommendations', label: 'Optimize' }
    ]
  },
  customer: {
    title: 'Decision Intelligence',
    color: 'primary',
    tabs: [
      { id: 'insights', label: 'Insights' },
      { id: 'behavior', label: 'Behavior' },
      { id: 'recommendations', label: 'Actions' }
    ]
  },
  anomaly: {
    title: 'Decision Intelligence',
    color: 'warning',
    tabs: [
      { id: 'insights', label: 'Insights' },
      { id: 'analysis', label: 'Analysis' },
      { id: 'recommendations', label: 'Actions' }
    ]
  },
  // Default fallback
  default: {
    title: 'Decision Intelligence',
    color: 'primary',
    tabs: [
      { id: 'insights', label: 'Insights' },
      { id: 'analysis', label: 'Analysis' },
      { id: 'recommendations', label: 'Recommendations' }
    ]
  }
};

// ==================== Main Component ====================

export function BusinessIntelligencePanel({
  onClose,
  insights = [],
  dashboardContext = 'default',
  data,
  kpiMetrics
}: BusinessIntelligencePanelProps) {
  // Get context configuration
  const config = CONTEXT_CONFIGS[dashboardContext] || CONTEXT_CONFIGS.default;

  // State
  const [activeTab, setActiveTab] = useState(config.tabs[0].id);

  // Debug: log insights when received
  React.useEffect(() => {
    console.log('[BI Panel] Dashboard Context:', dashboardContext);
    console.log('[BI Panel] Raw Insights:', insights);
    console.log('[BI Panel] KPI Metrics:', kpiMetrics);
  }, [insights, kpiMetrics, dashboardContext]);

  // Normalize and group insights
  const normalizedInsights = useMemo(() => {
    const normalized = normalizeInsights(insights);
    console.log('[BI Panel] Normalized Insights:', normalized);
    return normalized;
  }, [insights]);

  const groupedInsights = useMemo(() => {
    const groups: Record<string, Insight[]> = {};
    normalizedInsights.forEach((insight) => {
      const category = insight.category || 'General';
      if (!groups[category]) groups[category] = [];
      groups[category].push(insight);
    });
    return groups;
  }, [normalizedInsights]);

  const insightsByType = useMemo(() => {
    return {
      critical: normalizedInsights.filter(i => i.type === 'critical'),
      warning: normalizedInsights.filter(i => i.type === 'warning'),
      positive: normalizedInsights.filter(i => i.type === 'positive'),
      info: normalizedInsights.filter(i => i.type === 'info')
    };
  }, [normalizedInsights]);

  // ==================== Render Functions ====================

  const renderInsightCard = (insight: Insight, index: number) => {
    const typeColors = {
      positive: 'bg-success/10 border-success/20 text-success',
      warning: 'bg-warning/10 border-warning/20 text-warning',
      critical: 'bg-destructive/10 border-destructive/20 text-destructive',
      info: 'bg-primary/10 border-primary/20 text-primary'
    };

    const color = typeColors[insight.type || 'info'];

    return (
      <div key={index} className={cn("p-3 rounded-lg border", color)}>
        <div className="flex items-start gap-2">
          <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
          <p className="text-xs leading-relaxed flex-1">{insight.message}</p>
        </div>
      </div>
    );
  };

  const renderInsightsTab = () => {
    if (normalizedInsights.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Info className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No insights available</p>
          <p className="text-xs text-muted-foreground mt-1">Check back after data is loaded</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2">
          {insightsByType.critical.length > 0 && (
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="text-xs text-muted-foreground">Critical</div>
              <div className="text-lg font-bold text-destructive">{insightsByType.critical.length}</div>
            </div>
          )}
          {insightsByType.warning.length > 0 && (
            <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
              <div className="text-xs text-muted-foreground">Warnings</div>
              <div className="text-lg font-bold text-warning">{insightsByType.warning.length}</div>
            </div>
          )}
          {insightsByType.positive.length > 0 && (
            <div className="p-2 rounded-lg bg-success/10 border border-success/20">
              <div className="text-xs text-muted-foreground">Positive</div>
              <div className="text-lg font-bold text-success">{insightsByType.positive.length}</div>
            </div>
          )}
          {insightsByType.info.length > 0 && (
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-xs text-muted-foreground">Informational</div>
              <div className="text-lg font-bold text-primary">{insightsByType.info.length}</div>
            </div>
          )}
        </div>

        {/* Grouped Insights */}
        {Object.entries(groupedInsights).map(([category, categoryInsights]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{category}</h4>
            <div className="space-y-2">
              {categoryInsights.map((insight, idx) => renderInsightCard(insight, idx))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPerformanceTab = () => {
    // Show KPIs if available
    if (!kpiMetrics || Object.keys(kpiMetrics).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No performance data available</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Key Metrics</h4>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(kpiMetrics).slice(0, 6).map(([key, value]) => (
            <div key={key} className="p-3 rounded-lg border bg-card">
              <div className="text-xs text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-lg font-bold mt-1">
                {typeof value === 'number' ? value.toLocaleString() : String(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecommendationsTab = () => {
    const recommendations = normalizedInsights.filter(
      i => i.type === 'warning' || i.type === 'critical'
    );

    if (recommendations.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle className="w-8 h-8 text-success mb-2" />
          <p className="text-xs text-muted-foreground">No immediate actions required</p>
          <p className="text-xs text-muted-foreground mt-1">All metrics are within normal ranges</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Recommended Actions</h4>
        <p className="text-xs text-muted-foreground">
          Based on {recommendations.length} insight{recommendations.length !== 1 ? 's' : ''} requiring attention
        </p>
        <div className="space-y-2">
          {recommendations.map((insight, idx) => (
            <div key={idx} className="p-3 rounded-lg border bg-card">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {insight.type === 'critical' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs leading-relaxed">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ==================== Main Render ====================

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">{config.title}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="w-7 h-7"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b px-2 overflow-x-auto">
        {config.tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center px-3 py-2 text-xs font-medium transition-colors relative whitespace-nowrap",
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'insights' && renderInsightsTab()}
        {(activeTab === 'performance' || activeTab === 'behavior' || activeTab === 'analysis') && renderPerformanceTab()}
        {(activeTab === 'recommendations' || activeTab === 'actions' || activeTab === 'risk' || activeTab === 'optimize') && renderRecommendationsTab()}
      </div>
    </div>
  );
}
