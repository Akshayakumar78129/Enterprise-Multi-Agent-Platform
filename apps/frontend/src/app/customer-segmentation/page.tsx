"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection,
  KPIRow,
  AnimatedKPITile,
  Card,
  FilterBar,
  BarChart,
  LineChart,
  PageLoader,
  getShiftClickManager
} from 'components';
import { Users, TrendingUp, DollarSign, Activity, Layers, Target } from 'lucide-react';
import { useSegmentationContext } from './context';
import { SegmentProfileCards, SegmentDistributionMap } from './components';
import { useSegmentationData } from './hooks/useSegmentationData';

export default function CustomerSegmentationPage() {
  const { filters, setFilters, setInsights, setSegments } = useSegmentationContext();
  const shiftClickManager = getShiftClickManager();

  // Use React Query data hook
  const {
    loading,
    error,
    isFetching,
    kpiData,
    segmentData,
    segmentDistribution,
    segmentComparison,
    insights,
    customers
  } = useSegmentationData(filters);

  // Update context with insights and customers for BI panel
  React.useEffect(() => {
    if (insights) {
      setInsights(insights);
    }
    if (customers) {
      setSegments(customers);
    }
  }, [insights, customers, setInsights, setSegments]);

  const kpiTiles = [
    {
      id: "total-segments",
      title: 'Total Segments',
      value: kpiData?.total_segments || 0,
      format: 'number' as const,
      color: '#8b5cf6'
    },
    {
      id: "total-customers",
      title: 'Total Customers',
      value: kpiData?.total_customers || 0,
      format: 'number' as const,
      color: '#3b82f6'
    },
    {
      id: "largest-segment",
      title: 'Largest Segment',
      value: kpiData?.largest_segment_size || 0,
      format: 'number' as const,
      color: '#10b981'
    },
    {
      id: "most-valuable",
      title: 'Most Valuable',
      value: kpiData?.most_valuable_segment || 'N/A',
      format: 'text' as const,
      color: '#f59e0b'
    },
    {
      id: "avg-segment-value",
      title: 'Avg Segment Value',
      value: kpiData?.avg_segment_value || 0,
      format: 'currency' as const,
      color: '#06b6d4'
    },
    {
      id: "segmentation-quality",
      title: 'Segmentation Quality',
      value: kpiData?.segmentation_quality || 0,
      format: 'percentage' as const,
      color: '#ef4444'
    },
    {
      id: "segment-stability",
      title: 'Segment Stability',
      value: kpiData?.segment_stability || 0,
      format: 'percentage' as const,
      color: '#8b5cf6'
    }
  ];

  // Generate chart data from API response
  const generateSegmentChart = () => {
    if (!segmentDistribution.length) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Customer Count',
          data: [0],
          backgroundColor: ['rgba(107, 114, 128, 0.8)']
        }]
      };
    }

    return {
      labels: segmentDistribution.map((s: any) => s.segment_name),
      datasets: [{
        label: 'Customer Count',
        data: segmentDistribution.map((s: any) => s.customer_count),
        backgroundColor: segmentDistribution.map((s: any, index: number) => {
          // Soft pastel colors
          const colors = [
            'rgba(16, 185, 129, 0.8)',  // Emerald
            'rgba(139, 92, 246, 0.8)',  // Purple
            'rgba(245, 158, 11, 0.8)',  // Amber
            'rgba(236, 72, 153, 0.8)',  // Pink
            'rgba(239, 68, 68, 0.8)',   // Red
            'rgba(220, 38, 38, 0.8)',   // Dark red
            'rgba(99, 102, 241, 0.8)',  // Indigo
            'rgba(107, 114, 128, 0.8)'  // Gray
          ];
          return colors[index % colors.length];
        }),
        borderColor: segmentDistribution.map((s: any, index: number) => {
          const colors = [
            'rgb(125, 211, 192)',
            'rgb(167, 139, 250)',
            'rgb(251, 191, 120)',
            'rgb(248, 180, 217)',
            'rgb(134, 239, 172)',
            'rgb(165, 180, 252)',
            'rgb(252, 211, 77)',
            'rgb(196, 181, 253)'
          ];
          return colors[index % colors.length];
        }),
        borderWidth: 2
      }]
    };
  };

  const generateTrendData = () => {
    // Mock trend data for now - should come from API
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const lineColors = [
      { border: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.2)' },
      { border: 'rgb(139, 92, 246)', bg: 'rgba(139, 92, 246, 0.2)' },
      { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.2)' }
    ];

    return {
      labels: months,
      datasets: segmentDistribution.slice(0, 3).map((segment: any, index: number) => {
        // Generate realistic mock trend data based on current customer count if API doesn't provide it
        const trendData = segment.trend_data || months.map((_, idx) => {
          const baseCount = segment.customer_count || 100;
          // Simulate gradual growth/decline with some randomness
          const trendFactor = (idx / months.length) * 0.2; // 20% growth over time
          const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% random variation
          return Math.max(0, Math.floor(baseCount * (1 - 0.1 + trendFactor + randomVariation)));
        });

        return {
          label: segment.segment_name,
          data: trendData,
          borderColor: lineColors[index % lineColors.length].border,
          backgroundColor: lineColors[index % lineColors.length].bg,
          fill: true,
          tension: 0.4
        };
      })
    };
  };

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Customer Segmentation",
      }}
    >
      <div className="space-y-6">
      {/* Enhanced Filters Section */}
      <DashboardSection>
        <FilterBar
          config={{
            dateRange: {
              enabled: true,
              value: filters.dateRange ? {
                from: new Date(filters.dateRange.startDate),
                to: new Date(filters.dateRange.endDate)
              } : { from: new Date('2017-01-01'), to: new Date('2021-12-31') },
              onChange: (range) => {
                if (range?.from && range?.to) {
                  setFilters({
                    ...filters,
                    dateRange: {
                      startDate: range.from.toISOString().split('T')[0],
                      endDate: range.to.toISOString().split('T')[0]
                    }
                  });
                }
              }
            },
            multiSelect: [
              {
                id: 'customerSegments',
                label: 'Customer Segments',
                options: [
                  { value: 'champions', label: 'Champions' },
                  { value: 'loyal_customers', label: 'Loyal Customers' },
                  { value: 'potential_loyalists', label: 'Potential Loyalists' },
                  { value: 'new_customers', label: 'New Customers' },
                  { value: 'at_risk', label: 'At Risk' },
                  { value: 'cant_lose_them', label: "Can't Lose Them" },
                  { value: 'hibernating', label: 'Hibernating' },
                  { value: 'lost', label: 'Lost' }
                ],
                value: filters.customerSegments || [],
                onChange: (values) => setFilters({ ...filters, customerSegments: values }),
                placeholder: 'Select segments...'
              },
              {
                id: 'valueCategories',
                label: 'Value Categories',
                options: [
                  { value: 'high_value', label: 'High Value' },
                  { value: 'medium_high_value', label: 'Medium-High Value' },
                  { value: 'medium_value', label: 'Medium Value' },
                  { value: 'medium_low_value', label: 'Medium-Low Value' },
                  { value: 'low_value', label: 'Low Value' }
                ],
                value: filters.valueCategories || [],
                onChange: (values) => setFilters({ ...filters, valueCategories: values }),
                placeholder: 'Select value categories...'
              },
              {
                id: 'behaviorTypes',
                label: 'Behavior Types',
                options: [
                  { value: 'frequent_purchasers', label: 'Frequent Purchasers' },
                  { value: 'regular_purchasers', label: 'Regular Purchasers' },
                  { value: 'occasional_purchasers', label: 'Occasional Purchasers' },
                  { value: 'rare_purchasers', label: 'Rare Purchasers' },
                  { value: 'new_purchasers', label: 'New Purchasers' },
                  { value: 'inactive', label: 'Inactive' }
                ],
                value: filters.behaviorTypes || [],
                onChange: (values) => setFilters({ ...filters, behaviorTypes: values }),
                placeholder: 'Select behavior types...'
              }
            ]
          }}
          onReset={() => {
            // Clear localStorage
            if (typeof window !== 'undefined') {
              localStorage.removeItem('segmentation_filters');
            }
            // Reset to defaults
            setFilters({
              dateRange: {
                startDate: '2017-01-01',
                endDate: '2021-12-31'
              },
              customerSegments: [],
              valueCategories: [],
              behaviorTypes: []
            });
          }}
          showResetButton={true}
        />
      </DashboardSection>

      {/* Background refetch indicator */}
      {isFetching && !loading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Updating...
          </div>
        </div>
      )}

      {/* KPIs */}
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Key Metrics</h3>
        <KPIRow
          kpis={kpiTiles}
          columns={4}
          animationDelay={100}
          onKPIShiftClick={(kpi, event) => {
            shiftClickManager.addPoint({
              label: kpi.title,
              value: typeof kpi.value === 'number' ? kpi.value.toString() : kpi.value.toString(),
              source: 'Segmentation KPIs'
            }, event.nativeEvent);
          }}
        />
      </DashboardSection>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSection className="w-full">
          <Card
            className="glass-card"
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Segment Distribution",
                value: `Customer segment distribution chart`,
                source: 'Segmentation Dashboard - Distribution'
              }, event.nativeEvent);
            }}
          >
            <div className="w-full">
              <BarChart
                data={generateSegmentChart()}
                height={350}
                showLegend={false}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        color: '#f3e8ff',
                        borderColor: '#e8d4e6'
                      },
                      ticks: {
                        color: '#7a6a7c'
                      }
                    },
                    y: {
                      grid: {
                        color: '#f3e8ff',
                        borderColor: '#e8d4e6'
                      },
                      ticks: {
                        color: '#7a6a7c'
                      }
                    }
                  }
                }}
              />
            </div>
          </Card>
        </DashboardSection>

        <DashboardSection className="w-full">
          <Card
            className="glass-card"
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Segment Trends",
                value: `Segment trends over time`,
                source: 'Segmentation Dashboard - Trends'
              }, event.nativeEvent);
            }}
          >
            <div className="w-full">
              <LineChart
                data={generateTrendData()}
                height={350}
                showLegend={true}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: '#7a6a7c'
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        color: '#f3e8ff',
                        borderColor: '#e8d4e6'
                      },
                      ticks: {
                        color: '#7a6a7c'
                      }
                    },
                    y: {
                      grid: {
                        color: '#f3e8ff',
                        borderColor: '#e8d4e6'
                      },
                      ticks: {
                        color: '#7a6a7c'
                      }
                    }
                  }
                }}
              />
            </div>
          </Card>
        </DashboardSection>
      </div>

      {/* Segment Distribution Map */}
      <DashboardSection className="w-full">
        <div className="w-full" style={{ minHeight: '600px' }}>
          <SegmentDistributionMap
            data={segmentData}
            selectedSegments={filters.customerSegments}
            onSegmentFilter={(segments) => setFilters({ ...filters, customerSegments: segments })}
            onCustomerSelect={(customer) => {
              console.log('Selected customer:', customer);
            }}
            width={typeof window !== 'undefined' ? window.innerWidth - 50 : 1400}
            height={600}
            performanceMode={segmentData.length > 1000}
          />
        </div>
      </DashboardSection>

      {/* Segment Profiles */}
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Segment Profiles</h3>
        <SegmentProfileCards
          segmentDistribution={segmentDistribution}
          segmentComparison={segmentComparison}
          loading={false}
          onSegmentExport={(segmentName) => {
            // Export functionality
            const exportData = segmentData.filter((c: any) => c.segment_name === segmentName);
            const csv = [
              ['Customer ID', 'Customer Name', 'RFM Score', 'Lifetime Value', 'Avg Order Value', 'Transactions', 'Days Since Last'],
              ...exportData.map((c: any) => [
                c.customer_id,
                c.customer_name,
                c.rfm_rl_score,
                c.lifetime_value,
                c.avg_order_value,
                c.transaction_count,
                c.days_since_last_activity
              ])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `segment_${segmentName}_customers.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }}
        />
      </DashboardSection>


      </div>
    </PageLoader>
  );
}