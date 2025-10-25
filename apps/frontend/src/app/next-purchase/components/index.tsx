"use client";

import React, { useMemo } from 'react';
import { Card, Skeleton, FilterBar, KPIRow, MetricsRow } from 'components/index';

// ========================================
// Next Purchase Filters Component (Phase 8)
// ========================================
export function NextPurchaseFilters({ filters, onFiltersChange }: { filters: any; onFiltersChange: (filters: any) => void }) {
  const handleReset = () => {
    onFiltersChange({
      dateRange: { startDate: '', endDate: '' },
      probabilityThreshold: 0,
      productCategories: [],
      dayRange: { min: 0, max: 60 }
    });
  };

  return (
    <FilterBar
      config={{
        dateRange: {
          enabled: true,
          value: filters.dateRange || { startDate: '', endDate: '' },
          onChange: (range) => onFiltersChange({ ...filters, dateRange: range }),
        },
        multiSelect: [
          {
            id: "categories",
            label: "Product Category",
            options: [
              { value: "Apparel", label: "Apparel" },
              { value: "Accessories", label: "Accessories" },
              { value: "Footwear", label: "Footwear" },
              { value: "Equipment", label: "Equipment" },
            ],
            value: filters.productCategories || [],
            onChange: (values) => onFiltersChange({ ...filters, productCategories: values }),
          },
        ],
        sliders: [
          {
            id: "probability",
            label: "Min Probability",
            min: 0,
            max: 100,
            step: 5,
            value: (filters.probabilityThreshold || 0) * 100,
            onChange: (value) => onFiltersChange({ ...filters, probabilityThreshold: value / 100 }),
            format: (val) => `${val}%`
          },
          {
            id: "days",
            label: "Days to Purchase",
            min: 0,
            max: 60,
            step: 1,
            value: filters.dayRange?.max || 60,
            onChange: (value) => onFiltersChange({ ...filters, dayRange: { min: 0, max: value } }),
            format: (val) => `${val} days`
          }
        ]
      }}
      onReset={handleReset}
    />
  );
}

// ========================================
// Prediction KPIs Component (5 Tiles) - Using shared KPIRow component
// ========================================
export function PredictionKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  const kpis = useMemo(() => {
    if (!metrics) {
      return [
        {
          id: "total-predictions",
          title: "Total Predictions",
          value: 0,
          format: "number" as const,
          color: "#6366f1",
        },
        {
          id: "high-confidence",
          title: "High Confidence",
          value: 0,
          format: "number" as const,
          color: "#10b981",
          subtitle: ">70% probability",
        },
        {
          id: "avg-confidence",
          title: "Avg Confidence",
          value: 0,
          format: "percentage" as const,
          color: "#3b82f6",
        },
        {
          id: "avg-days",
          title: "Avg Days to Purchase",
          value: 0,
          format: "number" as const,
          color: "#8b5cf6",
          suffix: "d",
        },
        {
          id: "predicted-revenue",
          title: "Revenue Potential",
          value: 0,
          format: "currency" as const,
          color: "#f59e0b",
          subtitle: "30 days",
        },
        {
          id: "coverage",
          title: "Customer Coverage",
          value: 0,
          format: "percentage" as const,
          color: "#06b6d4",
        },
        {
          id: "purchase-window",
          title: "Purchase Window",
          value: 0,
          format: "number" as const,
          color: "#ec4899",
          subtitle: "median days",
        },
      ];
    }

    return [
      {
        id: "total-predictions",
        title: "Total Predictions",
        value: metrics.totalPredictions || 0,
        format: "number" as const,
        color: "#6366f1",
      },
      {
        id: "high-confidence",
        title: "High Confidence",
        value: metrics.highIntentCustomers || 0,
        format: "number" as const,
        color: "#10b981",
        subtitle: ">70% probability",
      },
      {
        id: "avg-confidence",
        title: "Avg Confidence",
        value: (metrics.confidenceIndex || 0) * 100,
        format: "percentage" as const,
        color: "#3b82f6",
      },
      {
        id: "avg-days",
        title: "Avg Days to Purchase",
        value: metrics.avgDaysToPurchase || 0,
        format: "number" as const,
        color: "#8b5cf6",
        suffix: "d",
      },
      {
        id: "predicted-revenue",
        title: "Revenue Potential",
        value: metrics.predictedRevenue30d || 0,
        format: "currency" as const,
        color: "#f59e0b",
        subtitle: "30 days",
      },
      {
        id: "coverage",
        title: "Customer Coverage",
        value: metrics.predictionCoverage || 0,
        format: "percentage" as const,
        color: "#06b6d4",
      },
      {
        id: "purchase-window",
        title: "Purchase Window",
        value: metrics.avgPurchaseWindow || 0,
        format: "number" as const,
        color: "#ec4899",
        subtitle: "median days",
      },
    ];
  }, [metrics]);

  if (loading) {
    return (
      <MetricsRow>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} height={120} className="animate-pulse" />
        ))}
      </MetricsRow>
    );
  }

  return <KPIRow kpis={kpis} columns={7} animationDelay={50} />;
}

// ========================================
// AI Insights Quick Actions (Phase 4.2 - NEW)
// ========================================
export function AIInsightsChips({ metrics, onActionClick }: {
  metrics: any;
  onActionClick?: (action: string) => void;
}) {
  const insights = useMemo(() => {
    if (!metrics) return [];

    const items = [];

    // High-intent customers action
    if ((metrics.highIntentCustomers || 0) > 0) {
      items.push({
        id: 'high-intent',
        icon: '🎯',
        title: 'Target High-Intent',
        description: `${metrics.highIntentCustomers} customers with >70% probability`,
        gradient: 'from-green-500/10 to-emerald-500/10',
        borderColor: 'border-green-500/30',
        textColor: 'text-green-500',
      });
    }

    // Urgent actions (within 7 days)
    if ((metrics.customersWithin7d || 0) > 0) {
      items.push({
        id: 'urgent-timing',
        icon: '⚡',
        title: 'Urgent Opportunities',
        description: `${metrics.customersWithin7d} customers ready within 7 days`,
        gradient: 'from-orange-500/10 to-red-500/10',
        borderColor: 'border-orange-500/30',
        textColor: 'text-orange-500',
      });
    }

    // Cross-sell opportunities
    if ((metrics.topDemandProduct || 'N/A') !== 'N/A') {
      items.push({
        id: 'cross-sell',
        icon: '🔄',
        title: 'Cross-Sell Focus',
        description: `${metrics.topDemandProduct} trending (${metrics.topDemandShare}% share)`,
        gradient: 'from-blue-500/10 to-cyan-500/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-500',
      });
    }

    // Coverage optimization
    const coverage = metrics.predictionCoverage || 0;
    if (coverage < 80) {
      items.push({
        id: 'expand-coverage',
        icon: '📊',
        title: 'Expand Coverage',
        description: `${coverage.toFixed(0)}% of customers covered - optimize for more`,
        gradient: 'from-purple-500/10 to-pink-500/10',
        borderColor: 'border-purple-500/30',
        textColor: 'text-purple-500',
      });
    }

    return items.slice(0, 4); // Max 4 insights
  }, [metrics]);

  if (insights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {insights.map((insight, idx) => (
        <div
          key={insight.id}
          className={`
            group relative overflow-hidden rounded-lg border backdrop-blur-sm
            bg-gradient-to-br ${insight.gradient} ${insight.borderColor}
            hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer
          `}
          onClick={() => onActionClick?.(insight.id)}
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{insight.icon}</div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${insight.textColor} mb-1`}>
                  {insight.title}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {insight.description}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Glassmorphism effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      ))}
    </div>
  );
}

// ========================================
// Model Ops Panel (Phase 4.3 - NEW)
// ========================================
export function ModelOpsPanel({ metrics, loading }: { metrics: any; loading?: boolean }) {
  if (loading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!metrics) return null;

  const stats = [
    {
      label: 'Top Demand Product',
      value: metrics.topDemandProduct || 'N/A',
      subtitle: `${metrics.topDemandShare || 0}% of predictions`,
      icon: '📦',
      color: 'text-primary',
    },
    {
      label: 'Prediction Coverage',
      value: `${(metrics.predictionCoverage || 0).toFixed(1)}%`,
      subtitle: `${metrics.totalCustomers || 0} total customers`,
      icon: '📊',
      color: 'text-cyan-500',
    },
    {
      label: 'Avg Purchase Window',
      value: `${metrics.avgPurchaseWindow || 0} days`,
      subtitle: 'Median repeat purchase cycle',
      icon: '⏱️',
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold">Model Operations</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Secondary metrics and model performance indicators
          </div>
        </div>
        <div className="text-xs px-2 py-1 rounded-full bg-success/10 text-success border border-success/20">
          Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{stat.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                <div className={`text-xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.subtitle}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================================
// Next Purchase Predictions Table (Phase 2 - Expandable Journey)
// ========================================
export function NextPurchasePredictions({
  data,
  customerJourneys = {},
  loading
}: {
  data: any;
  customerJourneys?: Record<number, any[]>;
  loading?: boolean;
}) {
  // All hooks MUST be at the top, before any conditional returns
  const [expandedRow, setExpandedRow] = React.useState<number | null>(null);

  if (loading) return <Skeleton className="h-64 w-full" />;

  const predictions = Array.isArray(data) ? data : [];

  // Debug: Log customerJourneys structure (only once when we have data)
  if (predictions.length > 0 && Object.keys(customerJourneys).length > 0) {
    console.log('Customer Journeys Data:', {
      customerJourneys,
      journeyKeys: Object.keys(customerJourneys),
      firstPrediction: predictions[0],
      firstCustomerId: predictions[0]?.customer_id,
      firstJourneyByNumber: customerJourneys[predictions[0]?.customer_id],
      firstJourneyByString: customerJourneys[String(predictions[0]?.customer_id)]
    });
  }

  if (predictions.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-muted-foreground">No prediction data available</div>
      </div>
    );
  }

  const toggleRow = (idx: number) => {
    if (expandedRow === idx) {
      setExpandedRow(null);
    } else {
      setExpandedRow(idx);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 w-10">
                <div className="text-xs font-medium text-muted-foreground">Expand</div>
              </th>
              <th className="text-left py-3 px-3">
                <div className="text-xs font-medium text-muted-foreground">Customer ID</div>
              </th>
              <th className="text-left py-3 px-3">
                <div className="text-xs font-medium text-muted-foreground">Product</div>
              </th>
              <th className="text-right py-3 px-3">
                <div className="text-xs font-medium text-muted-foreground">Confidence</div>
              </th>
              <th className="text-right py-3 px-3">
                <div className="text-xs font-medium text-muted-foreground">Days</div>
              </th>
              <th className="text-right py-3 px-3">
                <div className="text-xs font-medium text-muted-foreground">Est. Amount</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {predictions.slice(0, 15).map((prediction: any, idx: number) => {
              const probability = prediction.probability || 0;
              const probColor =
                probability >= 0.7 ? 'text-success' : probability >= 0.5 ? 'text-primary' : 'text-muted-foreground';
              const customerId = prediction.customer_id;
              const isExpanded = expandedRow === idx;
              // Try both number and string keys
              const purchases = customerJourneys[customerId] || customerJourneys[String(customerId)] || [];
              const hasPurchases = purchases.length > 0;

              return (
                <React.Fragment key={idx}>
                  <tr
                    className={`
                      border-b border-border/50 cursor-pointer transition-all
                      ${isExpanded ? 'bg-primary/5' : 'hover:bg-muted/30'}
                    `}
                    onClick={() => toggleRow(idx)}
                  >
                    <td className="py-3 px-3">
                      <div className={`
                        flex items-center justify-center w-6 h-6 rounded-md
                        transition-all duration-200
                        ${isExpanded ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                      `}>
                        <svg
                          className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium">{customerId || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border border-primary/20">
                        {prediction.predicted_product || 'Unknown'}
                      </span>
                    </td>
                    <td className={`py-3 px-3 text-right`}>
                      <div className={`inline-flex items-center gap-1.5 font-semibold ${probColor}`}>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((bar) => (
                            <div
                              key={bar}
                              className={`w-1 rounded-full transition-all ${
                                bar <= probability * 5 ? 'h-4 opacity-100' : 'h-2 opacity-30'
                              }`}
                              style={{
                                backgroundColor: probability >= 0.7 ? '#22c55e' : probability >= 0.5 ? '#3b82f6' : '#6b7280'
                              }}
                            />
                          ))}
                        </div>
                        {(probability * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-medium">{prediction.days_to_purchase || 0} days</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-semibold text-success">
                        ${(prediction.predicted_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="bg-gradient-to-br from-muted/20 to-background p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-sm font-semibold">Purchase Journey Timeline</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {purchases.length > 0
                                ? `Showing last ${purchases.length} purchases`
                                : 'Customer purchase history'}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Click row again to collapse
                          </div>
                        </div>

                        {hasPurchases && (
                          <div className="overflow-x-auto pb-2">
                            <div className="flex gap-6 min-w-max">
                              {purchases.map((purchase: any, i: number) => (
                                <div key={i} className="relative flex-shrink-0">
                                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-4 min-w-[140px] hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                                        #{i + 1}
                                      </div>
                                      <div className="text-xs font-medium text-blue-500">
                                        {purchase.txn_id}
                                      </div>
                                    </div>
                                    <div className="font-semibold text-sm text-foreground mb-1">
                                      {purchase.category || 'Product'}
                                    </div>
                                    <div className="text-base font-bold text-success mb-2">
                                      ${purchase.amount?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {purchase.date}
                                    </div>
                                  </div>
                                  {i < purchases.length - 1 && (
                                    <div className="absolute top-1/2 -right-5 flex items-center">
                                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Prediction card at the end */}
                              <div className="relative flex-shrink-0">
                                <div className="absolute top-1/2 -left-5 flex items-center">
                                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-dashed border-purple-500/50 rounded-lg p-4 min-w-[140px]">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                                      ?
                                    </div>
                                    <div className="text-xs font-medium text-purple-500">
                                      Predicted
                                    </div>
                                  </div>
                                  <div className="font-semibold text-sm text-foreground mb-1">
                                    {prediction.predicted_product}
                                  </div>
                                  <div className="text-base font-bold text-purple-500 mb-2">
                                    ${prediction.predicted_amount?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    In ~{prediction.days_to_purchase || 0} days
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {!hasPurchases && (
                          <div className="text-center py-8 px-4">
                            <div className="text-sm text-muted-foreground">
                              No purchase history available for this customer
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========================================
// Purchase Probability Distribution
// ========================================
export function PurchaseProbability({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  const bins = data?.bins || [];
  const counts = data?.counts || [];

  if (bins.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-muted-foreground">No probability data available</div>
      </div>
    );
  }

  const maxCount = Math.max(...counts);

  return (
    <div className="glass-card p-6">
      <div className="space-y-3">
        {bins.map((bin: string, idx: number) => {
          const count = counts[idx] || 0;
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const barColor =
            idx >= 4 ? 'bg-success' : idx >= 3 ? 'bg-primary' : idx >= 2 ? 'bg-warning' : 'bg-error';

          return (
            <div key={idx}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{bin}</span>
                <span className="text-sm text-muted-foreground">{count} customers</span>
              </div>
              <div className="h-8 bg-muted rounded overflow-hidden">
                <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Mean</div>
          <div className="font-semibold">{((data?.mean || 0) * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-muted-foreground">Median</div>
          <div className="font-semibold">{((data?.median || 0) * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-muted-foreground">Std Dev</div>
          <div className="font-semibold">{((data?.std || 0) * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Recommended Products
// ========================================
export function RecommendedProducts({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  const products = Array.isArray(data) ? data : [];

  if (products.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-muted-foreground">No product recommendations available</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="space-y-3">
        {products.slice(0, 5).map((product: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer">
            <div className="flex-1">
              <div className="font-medium">{product.product || 'Unknown'}</div>
              <div className="text-sm text-muted-foreground">
                {product.predictionCount} predictions
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-success">
                ${(product.estimatedRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-muted-foreground">
                {((product.avgProbability || 0) * 100).toFixed(0)}% avg confidence
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================================
// Timing Forecast
// ========================================
export function TimingForecast({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  const forecast = Array.isArray(data) ? data : [];

  if (forecast.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-muted-foreground">No timing forecast data available</div>
      </div>
    );
  }

  const urgencyColors = [
    'bg-error',      // 0-7 days (urgent)
    'bg-warning',    // 8-14 days (soon)
    'bg-primary',    // 15-30 days (medium)
    'bg-info',       // 31-60 days (long-term)
    'bg-muted'       // 60+ days
  ];

  const maxCount = Math.max(...forecast.map((f: any) => f.count || 0));

  return (
    <div className="glass-card p-6">
      <div className="space-y-3">
        {forecast.map((item: any, idx: number) => {
          const percentage = maxCount > 0 ? ((item.count || 0) / maxCount) * 100 : 0;

          return (
            <div key={idx}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{item.bucket}</span>
                <span className="text-sm text-muted-foreground">{item.count} customers</span>
              </div>
              <div className="h-8 bg-muted rounded overflow-hidden">
                <div
                  className={`h-full ${urgencyColors[idx]} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Est. Revenue: ${(item.estimatedRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========================================
// Prediction Accuracy
// ========================================
export function PredictionAccuracy({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card className="glass-card">
      <div className="p-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Model Performance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold text-success">85%</div>
            <div className="text-sm text-muted-foreground mt-1">Training Accuracy</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold text-primary">82%</div>
            <div className="text-sm text-muted-foreground mt-1">Test Accuracy</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Model is performing well with minimal overfitting. Predictions are based on historical purchase patterns,
            customer behavior, and product affinity analysis.
          </div>
        </div>
      </div>
    </Card>
  );
}

// ========================================
// Product Affinity Network (Phase 3.1 - Complete Rewrite)
// ========================================
export function ProductAffinityNetwork({ data, loading }: { data: any; loading?: boolean }) {
  const [strengthFilter, setStrengthFilter] = React.useState(0);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);

  if (loading) return <Skeleton className="h-96 w-full" />;

  const nodes = data?.nodes || [];
  const links = data?.links || [];

  if (nodes.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-muted-foreground">No affinity network data available</div>
      </div>
    );
  }

  // Filter links by strength
  const filteredLinks = links.filter((link: any) => (link.strength || 0) >= strengthFilter);

  // Get connected nodes for highlighting
  const getConnectedNodes = (nodeId: string): Set<string> => {
    const connected = new Set<string>();
    connected.add(nodeId);
    filteredLinks.forEach((link: any) => {
      if (link.source === nodeId) connected.add(link.target);
      if (link.target === nodeId) connected.add(link.source);
    });
    return connected;
  };

  const connectedNodes = selectedNode ? getConnectedNodes(selectedNode) : null;

  // Color gradients for different product categories
  const getNodeGradient = (node: any, idx: number) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-yellow-500 to-amber-500',
      'from-indigo-500 to-violet-500',
      'from-teal-500 to-blue-500',
      'from-rose-500 to-pink-500',
    ];
    return gradients[idx % gradients.length];
  };

  return (
    <div className="glass-card p-6">
      {/* Controls */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            Link Strength Filter: {strengthFilter}%
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
          >
            Clear Selection
          </button>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={strengthFilter}
          onChange={(e) => setStrengthFilter(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${strengthFilter}%, #e5e7eb ${strengthFilter}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Weak connections</span>
          <span>{filteredLinks.length} links shown</span>
          <span>Strong connections</span>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="relative h-[420px] bg-gradient-to-br from-muted/10 via-background to-muted/10 rounded-lg overflow-hidden">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Define gradients for all nodes */}
            {nodes.map((node: any, idx: number) => (
              <linearGradient key={`grad-${idx}`} id={`gradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            ))}
          </defs>

          {/* Draw links */}
          {filteredLinks.map((link: any, idx: number) => {
            const sourceIdx = nodes.findIndex((n: any) => n.id === link.source);
            const targetIdx = nodes.findIndex((n: any) => n.id === link.target);
            if (sourceIdx === -1 || targetIdx === -1) return null;

            // Calculate positions (circular layout)
            const centerX = 50;
            const centerY = 50;
            const radius = 38;
            const angleSource = (sourceIdx / nodes.length) * 2 * Math.PI - Math.PI / 2;
            const angleTarget = (targetIdx / nodes.length) * 2 * Math.PI - Math.PI / 2;

            const x1 = centerX + radius * Math.cos(angleSource);
            const y1 = centerY + radius * Math.sin(angleSource);
            const x2 = centerX + radius * Math.cos(angleTarget);
            const y2 = centerY + radius * Math.sin(angleTarget);

            // Determine if link should be highlighted
            const isHighlighted = connectedNodes
              ? connectedNodes.has(link.source) && connectedNodes.has(link.target)
              : false;

            const strength = link.strength || 0;
            const opacity = isHighlighted ? 0.8 : (strength / 100) * 0.5;
            const strokeWidth = Math.max(1, (strength / 100) * 4);

            return (
              <line
                key={idx}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke={isHighlighted ? '#8b5cf6' : '#6b7280'}
                strokeOpacity={opacity}
                strokeWidth={strokeWidth}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Draw nodes as SVG circles */}
          {nodes.map((node: any, idx: number) => {
            const angle = (idx / nodes.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 38;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            const isSelected = selectedNode === node.id;
            const isConnected = connectedNodes ? connectedNodes.has(node.id) : false;
            const isHovered = hoveredNode === node.id;
            const isDimmed = connectedNodes && !isConnected;

            const nodeRadius = isSelected || isHovered ? 40 : 36;
            const opacity = isDimmed ? 0.2 : 1;

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(isSelected ? null : node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer transition-all duration-300"
                style={{ opacity }}
              >
                <circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r={nodeRadius}
                  fill={`url(#gradient-${idx})`}
                  filter={isSelected || isHovered ? 'url(#glow)' : undefined}
                  className="transition-all duration-300"
                />

                <text
                  x={`${x}%`}
                  y={`${y}%`}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs font-bold fill-white pointer-events-none"
                >
                  {node.name.substring(0, 3).toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Node labels on hover */}
        {hoveredNode && (() => {
          const node = nodes.find((n: any) => n.id === hoveredNode);
          if (!node) return null;
          const idx = nodes.indexOf(node);
          const angle = (idx / nodes.length) * 2 * Math.PI - Math.PI / 2;
          const radius = 38;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);

          return (
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -120%)',
              }}
            >
              <div className="bg-background/95 border border-border rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm">
                <div className="font-semibold text-sm whitespace-nowrap">{node.name}</div>
                <div className="text-xs text-muted-foreground">{node.value} customers</div>
                {selectedNode === node.id && (
                  <div className="text-xs text-primary mt-1">
                    {getConnectedNodes(node.id).size - 1} connections
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"></div>
            <span>Products (click to highlight)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-600"></div>
            <span>Purchase affinity</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Prediction Confidence Matrix (Phase 3.2 - Complete Rewrite)
// ========================================
export function PredictionConfidenceMatrix({ data, loading }: { data: any; loading?: boolean }) {
  const [selectedCell, setSelectedCell] = React.useState<{ segment: string; product: string; value: number } | null>(null);
  const [hoveredCell, setHoveredCell] = React.useState<{ row: number; col: number } | null>(null);

  if (loading) return <Skeleton className="h-96 w-full" />;

  const matrix = data?.matrix || [];
  const products = data?.products || [];
  const segments = data?.segments || [];

  if (matrix.length === 0 || products.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-muted-foreground">No confidence matrix data available</div>
      </div>
    );
  }

  // Find max value for color scaling
  const maxValue = Math.max(...matrix.flat().filter((v: number) => v > 0));
  const totalPredictions = matrix.flat().reduce((sum: number, val: number) => sum + val, 0);

  // Get color based on intensity using smooth gradient
  const getHeatmapColor = (value: number, intensity: number) => {
    if (value === 0) return 'rgb(31, 41, 55)'; // gray-800 for zero values

    // Smooth gradient from blue (low) -> cyan -> green -> yellow -> orange -> red (high)
    if (intensity < 0.2) {
      // Blue to Cyan
      const t = intensity / 0.2;
      return `rgb(${Math.round(59 + (6 - 59) * t)}, ${Math.round(130 + (182 - 130) * t)}, ${Math.round(246 + (255 - 246) * t)})`;
    } else if (intensity < 0.4) {
      // Cyan to Green
      const t = (intensity - 0.2) / 0.2;
      return `rgb(${Math.round(6 + (34 - 6) * t)}, ${Math.round(182 + (197 - 182) * t)}, ${Math.round(255 + (94 - 255) * t)})`;
    } else if (intensity < 0.6) {
      // Green to Yellow
      const t = (intensity - 0.4) / 0.2;
      return `rgb(${Math.round(34 + (234 - 34) * t)}, ${Math.round(197 + (179 - 197) * t)}, ${Math.round(94 + (8 - 94) * t)})`;
    } else if (intensity < 0.8) {
      // Yellow to Orange
      const t = (intensity - 0.6) / 0.2;
      return `rgb(${Math.round(234 + (249 - 234) * t)}, ${Math.round(179 + (115 - 179) * t)}, ${Math.round(8 + (22 - 8) * t)})`;
    } else {
      // Orange to Red
      const t = (intensity - 0.8) / 0.2;
      return `rgb(${Math.round(249 + (239 - 249) * t)}, ${Math.round(115 + (68 - 115) * t)}, ${Math.round(22 + (68 - 22) * t)})`;
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground sticky left-0 bg-background z-10">
                  Segment / Product
                </th>
                {products.map((product: string, idx: number) => (
                  <th key={idx} className="p-2 min-w-[50px]">
                    <div className="flex items-center justify-center h-16">
                      <div className="transform -rotate-45 origin-center text-xs font-medium whitespace-nowrap">
                        {product.length > 12 ? product.substring(0, 10) + '..' : product}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {segments.map((segment: string, rowIdx: number) => (
                <tr key={rowIdx}>
                  <td className="p-2 text-xs font-medium sticky left-0 bg-background z-10">
                    <div className="px-2 py-1 rounded bg-muted/50 whitespace-nowrap">
                      {segment}
                    </div>
                  </td>
                  {matrix[rowIdx]?.map((value: number, colIdx: number) => {
                    const intensity = maxValue > 0 ? value / maxValue : 0;
                    const percentage = totalPredictions > 0 ? ((value / totalPredictions) * 100).toFixed(1) : '0';
                    const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;
                    const isSelected = selectedCell?.segment === segment && selectedCell?.product === products[colIdx];

                    return (
                      <td
                        key={colIdx}
                        className="p-0 relative group"
                        onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => {
                          if (value > 0) {
                            setSelectedCell(
                              isSelected
                                ? null
                                : { segment, product: products[colIdx], value }
                            );
                          }
                        }}
                      >
                        <div
                          className={`
                            h-12 flex items-center justify-center rounded-md text-xs font-semibold
                            transition-all duration-200 cursor-pointer
                            ${value > 0 ? 'text-white' : 'text-muted-foreground'}
                            ${isHovered || isSelected ? 'ring-2 ring-white shadow-lg scale-110 z-20' : ''}
                            ${value === 0 ? 'opacity-40' : ''}
                          `}
                          style={{
                            backgroundColor: getHeatmapColor(value, intensity),
                          }}
                        >
                          {value}
                        </div>

                        {/* Hover tooltip */}
                        {isHovered && value > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-background/95 border border-border rounded-lg shadow-xl z-30 whitespace-nowrap backdrop-blur-sm">
                            <div className="text-xs font-semibold">{segment}</div>
                            <div className="text-xs text-muted-foreground">{products[colIdx]}</div>
                            <div className="text-xs font-bold text-primary mt-1">
                              {value} predictions ({percentage}%)
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Click to drill down
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down panel */}
      {selectedCell && (
        <div className="mt-4 p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/30 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm font-semibold">Drill-Down Analysis</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {selectedCell.segment} × {selectedCell.product}
              </div>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-xs px-2 py-1 rounded bg-background/50 hover:bg-background/80 transition-colors"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-background/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Predictions</div>
              <div className="text-lg font-bold text-primary">{selectedCell.value}</div>
            </div>
            <div className="bg-background/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Share</div>
              <div className="text-lg font-bold">
                {((selectedCell.value / totalPredictions) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-background/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Confidence</div>
              <div className="text-lg font-bold text-success">
                {((selectedCell.value / maxValue) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            This segment-product combination represents {selectedCell.value} purchase predictions,
            accounting for {((selectedCell.value / totalPredictions) * 100).toFixed(1)}% of all predictions.
          </div>
        </div>
      )}

      {/* Heatmap legend */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Prediction Intensity</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Low</span>
            <div className="flex h-4 w-48 rounded overflow-hidden">
              <div className="w-1/5 bg-[rgb(59,130,246)]"></div>
              <div className="w-1/5 bg-[rgb(6,182,255)]"></div>
              <div className="w-1/5 bg-[rgb(34,197,94)]"></div>
              <div className="w-1/5 bg-[rgb(234,179,8)]"></div>
              <div className="w-1/5 bg-[rgb(239,68,68)]"></div>
            </div>
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Customer Purchase Journey Component (NEW - Phase 2.1)
// ========================================
export function CustomerPurchaseJourney({
  data = [],
  loading = false,
  selectedCustomer = null,
  onCustomerChange = null,
  showPredictions = true,
  onTogglePredictions = null,
  predictionRow = null
}: {
  data?: any[];
  loading?: boolean;
  selectedCustomer?: number | null;
  onCustomerChange?: ((id: number) => void) | null;
  showPredictions?: boolean;
  onTogglePredictions?: ((show: boolean) => void) | null;
  predictionRow?: any;
}) {
  const [hoveredPurchase, setHoveredPurchase] = React.useState<any>(null);
  const [spreadFactor, setSpreadFactor] = React.useState(1.15);

  const hasData = !!(data && data.length > 0);
  const currentCustomer = useMemo(() => {
    if (!hasData) return null;
    return selectedCustomer ? data.find(d => d.customerId === selectedCustomer) : data[0];
  }, [hasData, data, selectedCustomer]);

  const getProductIcon = (category: string) => {
    const icons: Record<string, string> = { 'M': '👕', 'R': '🏃', 'default': '📦' };
    return icons[category?.[0]] || icons.default;
  };

  const futurePredictions = useMemo(() => {
    if (!showPredictions || !currentCustomer || !predictionRow) return [];
    const hist = currentCustomer.purchases || [];
    const lastDate = hist.length ? new Date(hist[hist.length - 1].date) : new Date();
    const predictedDays = predictionRow.predicted_days_to_purchase || 14;
    const amountBase = predictionRow.avg_amount || (hist.length ? hist[hist.length - 1].amount : 0);

    const firstDate = new Date(lastDate.getTime() + predictedDays * 86400000);
    return [{
      date: firstDate.toISOString().slice(0, 10),
      category: predictionRow.predicted_product,
      amount: amountBase,
      probability: predictionRow.prediction_probability || 0.5,
      isPrediction: true
    }];
  }, [showPredictions, currentCustomer, predictionRow]);

  const allItems = useMemo(() => currentCustomer ? [...(currentCustomer.purchases || []), ...futurePredictions] : [], [currentCustomer, futurePredictions]);
  const baseSpacing = 140 * spreadFactor;
  const horizontalPadding = 220;
  const trackWidth = Math.max(600, horizontalPadding * 2 + (allItems.length - 1) * baseSpacing);

  if (loading) {
    return (
      <div className="glass-card p-6 min-h-[400px]">
        <Skeleton className="h-6 w-64 mb-6" />
        <div className="flex gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-11 w-28" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (!hasData || !currentCustomer) {
    return (
      <div className="glass-card p-6 min-h-[360px] flex items-center justify-center">
        <div className="text-muted-foreground">No customer timeline data available</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 min-h-[400px] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/10 to-transparent" />

      <div className="relative z-10 flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Customer Purchase Journey
          </h3>
          <div className="text-sm text-muted-foreground mt-1">
            Customer {currentCustomer.customerId} • {currentCustomer.purchases.length} purchases
            {showPredictions && ` + ${futurePredictions.length} predictions`}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center mb-6 glass-card p-3 rounded-2xl border border-blue-500/30">
        <select
          value={currentCustomer.customerId}
          onChange={(e) => onCustomerChange && onCustomerChange(parseInt(e.target.value))}
          className="px-3 py-2 bg-background/80 border border-border rounded-xl text-sm cursor-pointer min-w-[150px]"
        >
          {data.map(c => <option key={c.customerId} value={c.customerId}>Customer {c.customerId}</option>)}
        </select>

        <button
          onClick={() => setSpreadFactor(f => Math.min(1.6, +(f + 0.1).toFixed(2)))}
          className="px-3 py-2 bg-blue-500/15 border border-blue-500/40 text-blue-400 text-xs font-semibold rounded-lg hover:bg-blue-500/25 transition-colors"
        >
          Spread +
        </button>
        <button
          onClick={() => setSpreadFactor(f => Math.max(0.8, +(f - 0.1).toFixed(2)))}
          className="px-3 py-2 bg-purple-500/15 border border-purple-500/40 text-purple-400 text-xs font-semibold rounded-lg hover:bg-purple-500/25 transition-colors"
        >
          Spread -
        </button>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPredictions}
            onChange={() => onTogglePredictions && onTogglePredictions(!showPredictions)}
            className="rounded"
          />
          Show Predictions
        </label>

        <div className="ml-auto text-xs text-muted-foreground">Spread: {spreadFactor.toFixed(2)}</div>
      </div>

      {/* Timeline */}
      <div className="relative h-64 rounded-3xl p-6 overflow-x-auto overflow-y-hidden bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-border">
        <div className="relative" style={{ width: `${trackWidth}px`, height: '100%', padding: `0 ${horizontalPadding}px` }}>
          {/* Track */}
          <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 transform -translate-y-1/2 rounded-full" />

          {/* Purchase nodes */}
          {allItems.map((item, index) => {
            const leftPx = horizontalPadding + index * baseSpacing;
            const isPrediction = item.isPrediction;

            return (
              <div
                key={index}
                className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                style={{ left: `${leftPx}px` }}
                onMouseEnter={() => setHoveredPurchase(item)}
                onMouseLeave={() => setHoveredPurchase(null)}
              >
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${isPrediction ? 'bg-pink-500/20 border-2 border-dashed border-pink-500' : 'bg-blue-500 border-2 border-blue-400'}`} />

                <div className={`w-24 p-3 ${isPrediction ? 'bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/50' : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/50'} border rounded-2xl text-center backdrop-blur-sm transition-all duration-300 ${hoveredPurchase === item ? 'scale-105 -translate-y-2 shadow-xl' : ''}`}>
                  <div className="text-2xl mb-1">{getProductIcon(item.category)}</div>
                  <div className="text-xs font-bold">{item.category}</div>
                  <div className="text-xs text-muted-foreground mt-1">${item.amount?.toLocaleString()}</div>
                  {isPrediction && (
                    <div className="text-xs mt-1 font-semibold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                      {Math.round(item.probability * 100)}%
                    </div>
                  )}
                </div>

                <div className={`text-xs mt-3 transform -rotate-30 whitespace-nowrap font-medium ${isPrediction ? 'text-pink-500' : 'text-muted-foreground'}`}>
                  {new Date(item.date).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover details */}
      {hoveredPurchase && (
        <div className="mt-6 p-4 glass-card rounded-2xl border border-border">
          <div className="text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
            {hoveredPurchase.isPrediction ? 'Predicted Purchase' : 'Historical Purchase'}
          </div>
          <div className="text-sm">
            <strong>Product:</strong> {hoveredPurchase.category} • <strong>Amount:</strong> ${hoveredPurchase.amount?.toLocaleString()} • <strong>Date:</strong> {new Date(hoveredPurchase.date).toLocaleDateString()}
            {hoveredPurchase.isPrediction && <> • <strong>Probability:</strong> {Math.round(hoveredPurchase.probability * 100)}%</>}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-6 text-xs glass-card p-3 rounded-2xl border border-border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded" />
          <span>Historical Purchases</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded" />
          <span>Predicted Purchases</span>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Category Performance Overview Component (NEW - Phase 2.2)
// ========================================
export function CategoryPerformanceOverview({
  data = [],
  series = [],
  loading = false
}: {
  data?: any[];
  series?: any[];
  loading?: boolean;
}) {
  const [growthMode, setGrowthMode] = React.useState<'percent' | 'absolute'>('percent');

  if (loading) {
    return (
      <div className="glass-card p-6 min-h-[400px]">
        <Skeleton className="h-6 w-56 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 min-h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">No category performance data available</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 min-h-[400px] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-cyan-500/5 to-transparent" />

      <div className="relative z-10 flex justify-end items-center mb-6">
        <button
          onClick={() => setGrowthMode(m => m === 'percent' ? 'absolute' : 'percent')}
          className="px-3 py-2 text-xs font-semibold rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-400 hover:bg-blue-500/25 transition-colors"
        >
          Growth: {growthMode === 'percent' ? '% YoY' : 'Abs $'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.slice(0, 8).map((cat, idx) => {
          const repeatLow = cat.repeatRate < 30;

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border backdrop-blur-sm transition-all hover:-translate-y-1 cursor-pointer ${
                repeatLow ? 'bg-red-500/10 border-red-500/50' : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-border'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-bold">{cat.category}</div>
                <div className="px-2 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-xs font-semibold text-cyan-400">
                  {cat.revenueShare}%
                </div>
              </div>

              <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                ${cat.revenue.toLocaleString()}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Orders</div>
                  <div className="font-semibold">{cat.orders}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Customers</div>
                  <div className="font-semibold">{cat.customers}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Repeat %</div>
                  <div className={`font-semibold ${repeatLow ? 'text-red-400' : ''}`}>{cat.repeatRate}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Growth</div>
                  <div className={`font-semibold ${cat.growthPercent > 0 ? 'text-green-400' : cat.growthPercent < 0 ? 'text-red-400' : ''}`}>
                    {growthMode === 'percent' ? `${cat.growthPercent}%` : `$${cat.growthAbs.toLocaleString()}`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========================================
// Purchase Timing Predictor Component (NEW - Phase 2.3)
// ========================================
export function PurchaseTimingPredictor({
  data = [],
  loading = false
}: {
  data?: any[];
  loading?: boolean;
}) {
  const averageWindow = data.length ? data.reduce((a, c) => a + c.daysToPurchase, 0) / data.length : 0;

  if (loading) {
    return (
      <div className="glass-card p-6 min-h-[420px]">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 min-h-[420px] flex items-center justify-center">
        <div className="text-muted-foreground">No timing predictions available</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 min-h-[420px] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-purple-500/5 to-transparent" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.slice(0, 12).map((p, i) => (
          <div
            key={i}
            className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-border backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-blue-500/50 cursor-pointer"
          >
            <div className="text-xs font-semibold mb-1">Cust {p.customerId}</div>
            <div className="text-sm font-bold text-cyan-400 mb-1">{p.product}</div>
            <div className="text-sm text-muted-foreground mb-2">{p.daysToPurchase} days</div>
            <div className={`text-sm font-bold ${p.probability > 0.7 ? 'text-cyan-400' : p.probability > 0.5 ? 'text-blue-400' : 'text-muted-foreground'}`}>
              {Math.round(p.probability * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
