// Engagement Classifier dashboard components
import React, { useState, useMemo } from 'react';
import { Skeleton, FilterBar, KPIRow, MetricsRow, RiskPyramid, ChartCard, getShiftClickManager } from 'components/index';
import { useEngagementClassifierContext } from '../context';
import { ENGAGEMENT_LEVEL_OPTIONS, LOYALTY_STATUS_OPTIONS } from '@/lib/constants/filterOptions';
import dynamic from 'next/dynamic';

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface EngagementFiltersProps {
  filters: {
    dateRange: {
      startDate: string;
      endDate: string;
    };
    engagementLevels: string[];
    loyaltyStatus: string[];
    minTransactions?: number;
    minLTVAmount?: number;
    rfmScoreMin?: number;
    rfmScoreMax?: number;
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

export function EngagementFilters({
  filters,
  onFiltersChange,
  onReset
}: EngagementFiltersProps) {
  return (
    <FilterBar
      config={{
        dateRange: {
          enabled: true,
          value: filters.dateRange,
          onChange: (range) => onFiltersChange({
            ...filters,
            dateRange: range
          }),
        },
        multiSelect: [
          {
            id: "engagement",
            label: "Engagement Level",
            type: "dropdown",
            options: ENGAGEMENT_LEVEL_OPTIONS,
            value: filters.engagementLevels || [],
            onChange: (values) => onFiltersChange({ ...filters, engagementLevels: values }),
          },
          {
            id: "loyalty",
            label: "Loyalty Status",
            type: "dropdown",
            options: LOYALTY_STATUS_OPTIONS,
            value: filters.loyaltyStatus || [],
            onChange: (values) => onFiltersChange({ ...filters, loyaltyStatus: values }),
          },
        ],
        numberInput: [
          {
            id: "minTransactions",
            label: "Min Transactions",
            placeholder: "Minimum transaction count",
            value: filters.minTransactions || "",
            onChange: (value) => onFiltersChange({ ...filters, minTransactions: parseInt(value) || 0 }),
          },
          {
            id: "minLTVAmount",
            label: "Min LTV Amount",
            placeholder: "Minimum LTV value",
            value: filters.minLTVAmount || "",
            onChange: (value) => onFiltersChange({ ...filters, minLTVAmount: parseInt(value) || 0 }),
          },
        ],
        rangeSlider: {
          enabled: true,
          label: "RFM Score Range",
          min: 0,
          max: 10,
          value: [filters.rfmScoreMin, filters.rfmScoreMax],
          onChange: ([min, max]) => onFiltersChange({
            ...filters,
            rfmScoreMin: min,
            rfmScoreMax: max
          }),
        },
      }}
      onReset={onReset}
    />
  );
}

export function EngagementKPIs({ metrics, loading }: { metrics: any; loading?: boolean }) {
  const shiftClickManager = getShiftClickManager();

  const kpis = useMemo(() => {
    // Return empty/zero KPIs when no data
    if (!metrics) {
      return [
        {
          id: "total-customers",
          title: "Total Customers",
          value: 0,
          format: "number" as const,
          color: "#3b82f6", // Blue
        },
        {
          id: "highly-engaged",
          title: "Highly Engaged",
          value: 0,
          format: "number" as const,
          color: "#10b981", // Emerald
        },
        {
          id: "low-engagement",
          title: "Low Engagement",
          value: 0,
          format: "number" as const,
          color: "#ef4444", // Red
        },
        {
          id: "avg-engagement-score",
          title: "Avg Engagement Score",
          value: 0,
          format: "decimal" as const,
          color: "#8b5cf6", // Purple
        },
        {
          id: "engagement-trend",
          title: "Engagement Trend",
          value: "N/A",
          format: "text" as const,
          color: "#3b82f6", // Blue
        },
      ];
    }

    // Calculate engagement trend text
    const trendValue = metrics.engagementTrend || 0;
    let trendText = "Stable";
    let trendColor = "#3b82f6"; // Blue

    if (typeof trendValue === 'string') {
      // Handle string values like "Improving", "Declining", "Stable"
      trendText = trendValue;
      trendColor = trendValue === 'Improving' ? "#10b981" : // Emerald
                   trendValue === 'Declining' ? "#ef4444" : "#3b82f6"; // Red : Blue
    } else if (typeof trendValue === 'number') {
      // Handle numeric percentage values
      trendText = trendValue > 0
        ? `+${trendValue.toFixed(1)}%`
        : trendValue < 0
        ? `${trendValue.toFixed(1)}%`
        : "Stable";
      trendColor = trendValue > 0 ? "#10b981" : trendValue < 0 ? "#ef4444" : "#3b82f6"; // Emerald : Red : Blue
    }

    return [
      {
        id: "total-customers",
        title: "Total Customers",
        value: metrics.totalCustomers || 0,
        format: "number" as const,
        color: "#3b82f6", // Blue
      },
      {
        id: "highly-engaged",
        title: "Highly Engaged",
        value: metrics.highlyEngaged || 0,
        format: "number" as const,
        color: "#10b981", // Emerald
      },
      {
        id: "low-engagement",
        title: "Low Engagement",
        value: metrics.atRiskCount || 0,
        format: "number" as const,
        color: "#ef4444", // Red
      },
      {
        id: "avg-engagement-score",
        title: "Avg Engagement Score",
        value: (metrics.avgEngagementScore || 0),
        format: "decimal" as const,
        color: "#8b5cf6", // Purple
      },
      {
        id: "engagement-trend",
        title: "Engagement Trend",
        value: trendText,
        format: "text" as const,
        color: trendColor,
      },
    ];
  }, [metrics]);

  if (loading) {
    return (
      <MetricsRow>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={120} className="animate-pulse" />
        ))}
      </MetricsRow>
    );
  }

  return (
    <KPIRow
      kpis={kpis}
      columns={5}
      animationDelay={50}
      onKPIShiftClick={(kpi, event) => {
        shiftClickManager.addPoint({
          label: kpi.title,
          value: typeof kpi.value === 'number' ? kpi.value.toString() : kpi.value.toString(),
          source: 'Engagement KPIs'
        }, event.nativeEvent);
      }}
    />
  );
}

export function EngagementPyramid({ data, loading, onLevelClick }: {
  data: any;
  loading?: boolean;
  onLevelClick?: (level: string) => void;
}) {
  const { selectionManager } = useEngagementClassifierContext();
  const shiftClickManager = getShiftClickManager();

  if (loading) return <Skeleton height={350} className="glass-card animate-pulse" />;

  // Transform data for RiskPyramid component with soft pastel colors
  const pyramidData = Array.isArray(data) ? data.map(item => {
    let color;
    switch (item.engagement_level) {
      case 'High':
        color = '#10b981'; // Emerald
        break;
      case 'Medium':
        color = '#f59e0b'; // Amber
        break;
      case 'Low':
        color = '#ef4444'; // Red
        break;
      default:
        color = '#64748b'; // Slate gray
    }

    return {
      level: item.engagement_level,
      count: item.customer_count || 0,
      percentage: item.percentage || 0,
      color
    };
  }).sort((a, b) => {
    // Sort by engagement level for pyramid display (High at top)
    const order = { 'High': 0, 'Medium': 1, 'Low': 2 };
    return order[a.level as keyof typeof order] - order[b.level as keyof typeof order];
  }) : [];

  const handleSegmentClick = (level: any, event: React.MouseEvent) => {
    // Regular click: Filter
    if (onLevelClick) {
      onLevelClick(level.level);
    }
  };

  const handleShiftClick = (level: any, event: React.MouseEvent) => {
    // Shift+click: Add to selection for chat using the new ShiftClickSelectionManager
    shiftClickManager.addPoint({
      label: `Engagement: ${level.level}`,
      value: `${level.count} customers (${Number(level.percentage).toFixed(1)}%)`,
      source: 'Engagement Pyramid'
    }, event.nativeEvent);
  };

  return (
    <RiskPyramid
      data={pyramidData}
      onSegmentClick={handleSegmentClick}
      onShiftClick={handleShiftClick}
      height={350}
      showLabels={true}
      showPercentages={true}
      className="w-full"
    />
  );
}

export function EngagementTimeline({ data, loading, onPeriodClick }: {
  data: any;
  loading?: boolean;
  onPeriodClick?: (period: string) => void;
}) {
  const { selectionManager } = useEngagementClassifierContext();
  const [viewMode, setViewMode] = useState('stacked'); // 'stacked' or 'lines'
  const shiftClickManager = getShiftClickManager();

  if (loading) return <Skeleton height={350} className="glass-card animate-pulse" />;

  // Process timeline data for visualization
  const processTimelineData = () => {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        periods: [],
        high: [],
        medium: [],
        low: []
      };
    }

    // Group data by time period
    const periods = [...new Set(data.map(item => item.time_period))];
    const sortedPeriods = periods.sort((a, b) => {
      const order = {
        'This Week': 1,
        'This Month': 2,
        'Last 3 Months': 3,
        'Last 6 Months': 4,
        'Last Year': 5,
        'Over 1 Year': 6
      };
      return (order[a as keyof typeof order] || 99) - (order[b as keyof typeof order] || 99);
    });

    const highData: number[] = [];
    const mediumData: number[] = [];
    const lowData: number[] = [];

    sortedPeriods.forEach(period => {
      const periodData = data.filter(item => item.time_period === period);

      const high = periodData.find(item => item.engagement_level === 'High')?.customer_count || 0;
      const medium = periodData.find(item => item.engagement_level === 'Medium')?.customer_count || 0;
      const low = periodData.find(item => item.engagement_level === 'Low')?.customer_count || 0;

      highData.push(high);
      mediumData.push(medium);
      lowData.push(low);
    });

    return {
      periods: sortedPeriods,
      high: highData,
      medium: mediumData,
      low: lowData
    };
  };

  const { periods, high, medium, low } = processTimelineData();

  const handlePeriodClick = (period: string, event?: any) => {
    const periodIndex = periods.indexOf(period);
    if (periodIndex !== -1) {
      // Check if shift key is pressed
      const isShiftKey = event?.event?.shiftKey || event?.shiftKey;

      if (isShiftKey) {
        // Shift+click: Add to global shift+click selection
        const total = (high[periodIndex] || 0) + (medium[periodIndex] || 0) + (low[periodIndex] || 0);
        shiftClickManager.addPoint({
          label: `Period: ${period}`,
          value: `${total} customers (H:${high[periodIndex]}, M:${medium[periodIndex]}, L:${low[periodIndex]})`,
          source: 'Engagement Timeline'
        });
      } else {
        // Regular click: Filter
        if (onPeriodClick) {
          onPeriodClick(period);
        }
      }
    }
  };

  const renderStackedAreaChart = () => {
    return [
      {
        x: periods,
        y: high,
        fill: 'tonexty',
        fillcolor: 'rgba(16, 185, 129, 0.6)', // Emerald
        line: { color: '#10b981', width: 2 },
        mode: 'lines',
        name: 'High Engagement',
        type: 'scatter',
        stackgroup: 'one'
      },
      {
        x: periods,
        y: medium,
        fill: 'tonexty',
        fillcolor: 'rgba(245, 158, 11, 0.6)', // Amber
        line: { color: '#f59e0b', width: 2 },
        mode: 'lines',
        name: 'Medium Engagement',
        type: 'scatter',
        stackgroup: 'one'
      },
      {
        x: periods,
        y: low,
        fill: 'tonexty',
        fillcolor: 'rgba(239, 68, 68, 0.6)', // Red
        line: { color: '#ef4444', width: 2 },
        mode: 'lines',
        name: 'Low Engagement',
        type: 'scatter',
        stackgroup: 'one'
      }
    ];
  };

  const renderLineChart = () => {
    return [
      {
        x: periods,
        y: high,
        line: { color: '#10b981', width: 3 }, // Emerald
        mode: 'lines+markers',
        marker: { size: 8, color: '#10b981' },
        name: 'High Engagement',
        type: 'scatter'
      },
      {
        x: periods,
        y: medium,
        line: { color: '#f59e0b', width: 3 }, // Amber
        mode: 'lines+markers',
        marker: { size: 8, color: '#f59e0b' },
        name: 'Medium Engagement',
        type: 'scatter'
      },
      {
        x: periods,
        y: low,
        line: { color: '#ef4444', width: 3 }, // Red
        mode: 'lines+markers',
        marker: { size: 8, color: '#ef4444' },
        name: 'Low Engagement',
        type: 'scatter'
      }
    ];
  };

  const layout = {
    height: 400,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: 'Inter, sans-serif',
      color: '#4b5563', // gray-600
      size: 12
    },
    margin: { l: 60, r: 40, t: 40, b: 80 },
    xaxis: {
      title: 'Time Period',
      titlefont: { size: 14, color: '#374151' }, // gray-700
      tickfont: { size: 12, color: '#4b5563' }, // gray-600
      gridcolor: 'rgba(209, 213, 219, 0.3)', // gray-300 with opacity
      showgrid: true,
      zeroline: false,
      tickangle: -45
    },
    yaxis: {
      title: 'Customer Count',
      titlefont: { size: 14, color: '#374151' }, // gray-700
      tickfont: { size: 12, color: '#4b5563' }, // gray-600
      gridcolor: 'rgba(209, 213, 219, 0.3)', // gray-300 with opacity
      showgrid: true,
      zeroline: false
    },
    legend: {
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(255, 255, 255, 0.9)',
      bordercolor: '#e5e7eb', // gray-200
      borderwidth: 1,
      font: { color: '#374151', size: 11 } // gray-700
    },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: '#ffffff',
      bordercolor: '#e5e7eb', // gray-200
      font: { color: '#374151' } // gray-700
    }
  };

  const config = {
    displayModeBar: false,
    responsive: true,
    staticPlot: false // Enable click interactions for shift-click
  };

  if (periods.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        No timeline data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Dropdown */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className="px-3 py-2 bg-card text-foreground border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          style={{
            backgroundColor: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            borderColor: 'hsl(var(--border))'
          }}
        >
          <option value="stacked">Stacked View</option>
          <option value="lines">Line View</option>
        </select>
      </div>

      {/* Chart */}
      <div style={{ height: '300px', position: 'relative' }}>
        <Plot
          data={viewMode === 'stacked' ? renderStackedAreaChart() : renderLineChart()}
          layout={{...layout, height: 300}}
          config={config}
          style={{ width: '100%', height: '100%' }}
          onInitialized={(figure, graphDiv) => {
            graphDiv.on('plotly_click', (data) => {
              if (data.points && data.points.length > 0) {
                const point = data.points[0];
                handlePeriodClick(point.x as string, data);
              }
            });
          }}
        />
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div
          style={{ textAlign: 'center', cursor: 'pointer' }}
          onClick={(e) => {
            if (e.shiftKey) {
              const total = high.reduce((sum, val) => sum + val, 0);
              shiftClickManager.addPoint({
                label: 'High Engagement Total',
                value: `${total.toLocaleString()} customers`,
                source: 'Engagement Timeline Summary'
              }, e.nativeEvent);
            }
          }}
        >
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#10b981', // Emerald
            marginBottom: '4px'
          }}>
            {high.reduce((sum, val) => sum + val, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--foreground))', opacity: 0.8 }}>
            High Engagement Total
          </div>
        </div>
        <div
          style={{ textAlign: 'center', cursor: 'pointer' }}
          onClick={(e) => {
            if (e.shiftKey) {
              const total = medium.reduce((sum, val) => sum + val, 0);
              shiftClickManager.addPoint({
                label: 'Medium Engagement Total',
                value: `${total.toLocaleString()} customers`,
                source: 'Engagement Timeline Summary'
              }, e.nativeEvent);
            }
          }}
        >
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#f59e0b', // Amber
            marginBottom: '4px'
          }}>
            {medium.reduce((sum, val) => sum + val, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--foreground))', opacity: 0.8 }}>
            Medium Engagement Total
          </div>
        </div>
        <div
          style={{ textAlign: 'center', cursor: 'pointer' }}
          onClick={(e) => {
            if (e.shiftKey) {
              const total = low.reduce((sum, val) => sum + val, 0);
              shiftClickManager.addPoint({
                label: 'Low Engagement Total',
                value: `${total.toLocaleString()} customers`,
                source: 'Engagement Timeline Summary'
              }, e.nativeEvent);
            }
          }}
        >
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#ef4444', // Red
            marginBottom: '4px'
          }}>
            {low.reduce((sum, val) => sum + val, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--foreground))', opacity: 0.8 }}>
            Low Engagement Total
          </div>
        </div>
      </div>
    </div>
  );
}


export function OpportunityFinder({ data, loading }: {
  data: any;
  loading?: boolean;
}) {
  const { selectionManager } = useEngagementClassifierContext();
  const shiftClickManager = getShiftClickManager();

  if (loading) return <Skeleton height={350} className="glass-card animate-pulse" />;

  const opportunities = Array.isArray(data) ? data : [];

  const getOpportunityPriority = (opportunity: any) => {
    const value = opportunity.avg_customer_value || 0;
    const daysInactive = opportunity.avg_days_inactive || 999;

    if (value > 5000 && daysInactive < 60) return { label: 'High', color: 'text-green-500' };
    if (value > 2500 || daysInactive < 90) return { label: 'Medium', color: 'text-yellow-500' };
    return { label: 'Low', color: 'text-red-500' };
  };

  const handleOpportunityClick = (opportunity: any, event: React.MouseEvent) => {
    if (event.shiftKey) {
      // Shift+click: Add to global shift+click selection
      const potentialValue = (opportunity.customer_count || 0) * (opportunity.avg_customer_value || 0);
      shiftClickManager.addPoint({
        label: `Opportunity: ${opportunity.engagement_level}`,
        value: `${opportunity.customer_count} customers, $${potentialValue.toFixed(0)} potential`,
        source: 'Opportunity Finder'
      }, event.nativeEvent);
    } else {
      // Regular click: Add to selection
      selectionManager.addPoint({
        id: `opportunity-${opportunity.engagement_level}`,
        type: 'opportunity',
        level: opportunity.engagement_level,
        count: opportunity.customer_count,
        avgValue: opportunity.avg_customer_value
      });
    }
  };

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No re-engagement opportunities available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-sm font-medium text-muted-foreground">
            <th className="text-left py-2">Engagement Level</th>
            <th className="text-right py-2">Customers</th>
            <th className="text-right py-2">Avg Value</th>
            <th className="text-right py-2">Avg Transactions</th>
            <th className="text-right py-2">Days Inactive</th>
            <th className="text-right py-2">Priority</th>
            <th className="text-right py-2">Potential Value</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opportunity, idx) => {
            const priority = getOpportunityPriority(opportunity);

            return (
              <tr
                key={idx}
                className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={(e) => handleOpportunityClick(opportunity, e)}
              >
                <td className="py-3 text-sm font-medium">
                  {opportunity.engagement_level}
                </td>
                <td className="text-right py-3 text-sm">
                  {opportunity.customer_count?.toLocaleString() || 0}
                </td>
                <td className="text-right py-3 text-sm">
                  ${opportunity.avg_customer_value?.toFixed(0) || 0}
                </td>
                <td className="text-right py-3 text-sm">
                  {opportunity.avg_transactions?.toFixed(1) || 0}
                </td>
                <td className="text-right py-3 text-sm">
                  {opportunity.avg_days_inactive || 0}
                </td>
                <td className={`text-right py-3 text-sm font-medium ${priority.color}`}>
                  {priority.label}
                </td>
                <td className="text-right py-3 text-sm font-medium">
                  ${(opportunity.total_potential_value || 0).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="font-medium">
            <td className="py-3 text-sm">Total</td>
            <td className="text-right py-3 text-sm">
              {opportunities.reduce((sum, o) => sum + (o.customer_count || 0), 0).toLocaleString()}
            </td>
            <td colSpan={4}></td>
            <td className="text-right py-3 text-sm">
              ${opportunities.reduce((sum, o) => sum + (o.total_potential_value || 0), 0).toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function EngagementDistribution({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  // Transform data for visualization
  const chartData = Array.isArray(data) ? data.map(item => ({
    name: item.engagement_level,
    value: item.customer_count || 0,
    percentage: item.percentage || 0,
    avgTransactions: item.avg_transactions || 0,
    avgPurchaseValue: item.avg_purchase_value || 0
  })) : [];

  return (
    <Card>
      <div className="space-y-4">
        {chartData.map((level, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{level.name}</span>
              <span className="text-sm text-muted-foreground">
                {level.value} customers ({level.percentage?.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  level.name === 'High' ? 'bg-green-600' :
                  level.name === 'Medium' ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}
                style={{ width: `${level.percentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Avg Transactions: {level.avgTransactions?.toFixed(0)} |
              Avg Value: ${level.avgPurchaseValue?.toFixed(0)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CustomerClassification({ data, loading }: { data: any; loading?: boolean }) {
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const shiftClickManager = getShiftClickManager();

  if (loading) return <Skeleton height={350} className="glass-card animate-pulse" />;

  // Group RFM data by engagement level
  const rfmByLevel: Record<string, any[]> = {};
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (!rfmByLevel[item.engagement_level]) {
        rfmByLevel[item.engagement_level] = [];
      }
      rfmByLevel[item.engagement_level].push(item);
    });
  }

  if (Object.keys(rfmByLevel).length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No RFM classification data available
      </div>
    );
  }

  const toggleExpanded = (level: string) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  return (
    <div className="space-y-4">
      {Object.entries(rfmByLevel).map(([level, items]) => {
        const isExpanded = expandedLevels.has(level);
        const displayItems = isExpanded ? items : items.slice(0, 3);

        return (
          <div key={level} className="border rounded-lg p-3">
            <h4 className={`font-medium mb-2 ${
              level === 'High' ? 'text-green-500' :
              level === 'Medium' ? 'text-yellow-500' :
              'text-red-500'
            }`}>{level} Engagement</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {displayItems.map((item, idx) => (
                <div
                  key={idx}
                  className="cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded transition-colors"
                  onClick={(e) => {
                    if (e.shiftKey) {
                      // Shift+click: Add to global shift+click selection
                      shiftClickManager.addPoint({
                        label: `RFM: ${level} R${item['Recency Band']}-F${item['Frequency Band']}-M${item['Monetary Band']}`,
                        value: `${item.customer_count} customers (Score: ${item.avg_rfm_score?.toFixed(1)})`,
                        source: 'Customer Classification'
                      }, e.nativeEvent);
                    }
                  }}
                >
                  R{item['Recency Band']}-F{item['Frequency Band']}-M{item['Monetary Band']}: {' '}
                  <span className="font-medium">{item.customer_count} customers</span>
                  {' '}(Score: {item.avg_rfm_score?.toFixed(1)})
                </div>
              ))}
              {items.length > 3 && (
                <button
                  onClick={() => toggleExpanded(level)}
                  className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
                >
                  <span>{isExpanded ? '▼' : '▶'}</span>
                  {isExpanded ? 'Show less' : `Show ${items.length - 3} more segments`}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EngagementScore({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton height={350} className="glass-card animate-pulse" />;

  const score = data?.current || 0;
  const previousScore = data?.previous || 0;
  const trend = data?.trend || 'stable';
  const change = score - previousScore;

  // Calculate percentage for circular progress
  const percentage = (score / 10) * 100;

  return (
    <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
              className={`transition-all duration-500 ${
                score >= 7 ? 'text-green-600' :
                score >= 4 ? 'text-yellow-600' :
                'text-red-600'
              }`}
            />
          </svg>
          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold">{score.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">out of 10</div>
          </div>
        </div>

        {/* Trend indicator */}
        <div className={`mt-4 text-sm font-medium ${
          trend === 'up' ? 'text-green-600' :
          trend === 'down' ? 'text-red-600' :
          'text-gray-600'
        }`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          {' '}
          {Math.abs(change).toFixed(1)} from previous period
        </div>
    </div>
  );
}

export function ActionableInsights({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton height={350} className="glass-card animate-pulse" />;

  const insights = Array.isArray(data) ? data : [];

  if (insights.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No insights available at this time
      </div>
    );
  }

  return (
    <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-3 ${
              insight.type === 'success' ? 'border-green-200 bg-green-50' :
              insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
              insight.type === 'alert' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className={`text-lg ${
                insight.type === 'success' ? 'text-green-600' :
                insight.type === 'warning' ? 'text-yellow-600' :
                insight.type === 'alert' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {insight.type === 'success' ? '✓' :
                 insight.type === 'warning' ? '!' :
                 insight.type === 'alert' ? '✗' : 'i'}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{insight.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {insight.description}
                </div>
                {insight.action && (
                  <div className="text-xs font-medium mt-2 text-primary">
                    → {insight.action}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

export function EngagementTrends({ data, loading }: { data: any; loading?: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;

  // Group timeline data by period
  const timelineData: Record<string, Record<string, number>> = {};

  if (Array.isArray(data)) {
    data.forEach(item => {
      if (!timelineData[item.time_period]) {
        timelineData[item.time_period] = {};
      }
      timelineData[item.time_period][item.engagement_level] = item.customer_count || 0;
    });
  }

  // Sort periods
  const sortedPeriods = Object.keys(timelineData).sort((a, b) => {
    const order = ['This Week', 'This Month', 'Last 3 Months', 'Last 6 Months', 'Last Year', 'Over 1 Year'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <Card>
      <div className="space-y-3">
        {sortedPeriods.map(period => {
          const total = (timelineData[period].High || 0) +
                       (timelineData[period].Medium || 0) +
                       (timelineData[period].Low || 0);

          return (
            <div key={period} className="border rounded-lg p-3">
              <div className="font-medium text-sm mb-2">
                {period}
                <span className="text-muted-foreground text-xs ml-2">
                  ({total} total)
                </span>
              </div>
              <div className="flex gap-1 h-6">
                {timelineData[period].High > 0 && (
                  <div
                    className="bg-green-600 rounded-sm flex items-center justify-center text-xs text-white"
                    style={{
                      width: `${(timelineData[period].High / total) * 100}%`,
                      minWidth: timelineData[period].High > 0 ? '30px' : '0'
                    }}
                  >
                    {timelineData[period].High}
                  </div>
                )}
                {timelineData[period].Medium > 0 && (
                  <div
                    className="bg-yellow-600 rounded-sm flex items-center justify-center text-xs text-white"
                    style={{
                      width: `${(timelineData[period].Medium / total) * 100}%`,
                      minWidth: timelineData[period].Medium > 0 ? '30px' : '0'
                    }}
                  >
                    {timelineData[period].Medium}
                  </div>
                )}
                {timelineData[period].Low > 0 && (
                  <div
                    className="bg-red-600 rounded-sm flex items-center justify-center text-xs text-white"
                    style={{
                      width: `${(timelineData[period].Low / total) * 100}%`,
                      minWidth: timelineData[period].Low > 0 ? '30px' : '0'
                    }}
                  >
                    {timelineData[period].Low}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                <div>
                  <span className="text-green-600 font-medium">High:</span> {timelineData[period].High || 0}
                </div>
                <div>
                  <span className="text-yellow-600 font-medium">Medium:</span> {timelineData[period].Medium || 0}
                </div>
                <div>
                  <span className="text-red-600 font-medium">Low:</span> {timelineData[period].Low || 0}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
// Additional Search Components
export { CustomerSearchAnalytics } from './CustomerSearchAnalytics';
export { CustomerDetailModal } from './CustomerDetailModal';
