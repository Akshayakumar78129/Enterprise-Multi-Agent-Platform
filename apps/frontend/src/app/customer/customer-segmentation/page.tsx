"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
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
  Skeleton,
  getShiftClickManager
} from 'components';
import { Users, TrendingUp, DollarSign, Activity, Layers, Target } from 'lucide-react';
import { useSegmentationContext } from './context';
import { useSegmentationData } from './hooks/useSegmentationData';
import { RFM_SEGMENT_OPTIONS, VALUE_CATEGORY_OPTIONS, BEHAVIOR_TYPE_OPTIONS } from '@/lib/constants/filterOptions';

// Dynamic imports for heavy components
const SegmentProfileCards = dynamic(() => import('./components').then(mod => ({ default: mod.SegmentProfileCards })), {
  loading: () => <Card className="p-6"><Skeleton height={300} className="animate-pulse" /></Card>,
  ssr: false
});

const SegmentDistributionMap = dynamic(() => import('./components').then(mod => ({ default: mod.SegmentDistributionMap })), {
  loading: () => <Card className="p-6"><Skeleton height={600} className="animate-pulse" /></Card>,
  ssr: false
});

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
    // ✅ NO HARDCODED DATA: Only use real trend data from API
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const lineColors = [
      { border: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.2)' },
      { border: 'rgb(139, 92, 246)', bg: 'rgba(139, 92, 246, 0.2)' },
      { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.2)' }
    ];

    // Debug: Log segment distribution data
    console.log('[SegmentTrends] Total segments:', segmentDistribution.length);
    console.log('[SegmentTrends] First 3 segments:', segmentDistribution.slice(0, 3).map((s: any) => ({
      name: s.segment_name,
      has_trend_data: !!s.trend_data,
      trend_data: s.trend_data
    })));

    // Filter to only segments that have real trend data
    const segmentsWithTrendData = segmentDistribution
      .slice(0, 3)
      .filter((segment: any) => segment.trend_data && Array.isArray(segment.trend_data) && segment.trend_data.length > 0);

    console.log('[SegmentTrends] Segments with trend data:', segmentsWithTrendData.length);

    return {
      labels: months,
      datasets: segmentsWithTrendData.map((segment: any, index: number) => ({
        label: segment.segment_name,
        data: segment.trend_data,
        borderColor: lineColors[index % lineColors.length].border,
        backgroundColor: lineColors[index % lineColors.length].bg,
        fill: true,
        tension: 0.4
      })),
      hasData: segmentsWithTrendData.length > 0
    };
  };

  const trendData = generateTrendData();

  // Error state
  if (error && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Error Loading Data
          </h2>
          <p className="text-muted-foreground mb-4">
            {typeof error === 'string' ? error : 'An unexpected error occurred while loading the dashboard.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
              value: filters.dateRange || { startDate: '2017-01-01', endDate: '2021-12-31' },
              onChange: (range) => {
                if (range?.startDate && range?.endDate) {
                  setFilters({
                    ...filters,
                    dateRange: {
                      startDate: range.startDate,
                      endDate: range.endDate
                    }
                  });
                }
              }
            },
            multiSelect: [
              {
                id: 'customerSegments',
                label: 'Customer Segments',
                options: RFM_SEGMENT_OPTIONS,
                value: filters.customerSegments || [],
                onChange: (values) => setFilters({ ...filters, customerSegments: values }),
                placeholder: 'Select segments...'
              },
              {
                id: 'valueCategories',
                label: 'Value Categories',
                options: VALUE_CATEGORY_OPTIONS,
                value: filters.valueCategories || [],
                onChange: (values) => setFilters({ ...filters, valueCategories: values }),
                placeholder: 'Select value categories...'
              },
              {
                id: 'behaviorTypes',
                label: 'Behavior Types',
                options: BEHAVIOR_TYPE_OPTIONS,
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
        <div className="h-full flex flex-col">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
            Customer Segment Distribution
          </h3>
          <Card
            className="glass-card flex-1 min-h-[450px]"
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Segment Distribution",
                value: `Customer segment distribution chart`,
                source: 'Segmentation Dashboard - Distribution'
              }, event.nativeEvent);
            }}
          >
            <div className="w-full h-full">
              {!segmentDistribution || segmentDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <svg className="w-16 h-16 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm">No segment data available</p>
                  </div>
                </div>
              ) : (
                <BarChart
                  data={generateSegmentChart()}
                  height={400}
                  showLegend={false}
                  options={{
                    onClick: (event: any, elements: any[]) => {
                      if (elements.length > 0 && event?.native?.shiftKey) {
                        const index = elements[0].index;
                        const segment = segmentDistribution[index];
                        shiftClickManager.addPoint({
                          label: `Segment: ${segment.segment_name}`,
                          value: `${segment.customer_count} customers (${segment.percentage?.toFixed(1)}%)`,
                          source: 'Segment Distribution Chart - Data Point'
                        }, event.native);
                      }
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: false
                      },
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgb(31, 41, 55)',
                        titleColor: 'rgb(243, 244, 246)',
                        bodyColor: 'rgb(209, 213, 219)',
                        borderColor: 'rgb(75, 85, 99)',
                        borderWidth: 1
                      }
                    },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Customer Segments',
                        color: '#7a6a7c'
                      },
                      grid: {
                        color: '#f3e8ff',
                        borderColor: '#e8d4e6'
                      },
                      ticks: {
                        color: '#7a6a7c'
                      }
                    },
                    y: {
                      title: {
                        display: true,
                        text: 'Number of Customers',
                        color: '#7a6a7c'
                      },
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
              )}
            </div>
          </Card>
        </div>

        <div className="h-full flex flex-col">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
            Segment Growth Trends Over Time
          </h3>
          <Card
            className="glass-card flex-1 min-h-[450px]"
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Segment Trends",
                value: `Segment trends over time`,
                source: 'Segmentation Dashboard - Trends'
              }, event.nativeEvent);
            }}
          >
            <div className="w-full h-full">
              {!segmentDistribution || segmentDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <svg className="w-16 h-16 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    <p className="text-sm">No trend data available</p>
                  </div>
                </div>
              ) : (
                <LineChart
                  data={generateTrendData()}
                  height={400}
                  showLegend={true}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (event: any, elements: any[]) => {
                      if (elements.length > 0 && event?.native?.shiftKey) {
                        const datasetIndex = elements[0].datasetIndex;
                        const index = elements[0].index;
                        const trendData = generateTrendData();
                        const dataset = trendData.datasets[datasetIndex];
                        const label = trendData.labels[index];
                        const value = dataset.data[index];

                        shiftClickManager.addPoint({
                          label: `${dataset.label} - ${label}`,
                          value: `${value} customers`,
                          source: 'Segment Trends Chart - Data Point'
                        }, event.native);
                      }
                    },
                    plugins: {
                      title: {
                        display: false
                      },
                      legend: {
                        labels: {
                          color: '#7a6a7c'
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgb(31, 41, 55)',
                        titleColor: 'rgb(243, 244, 246)',
                        bodyColor: 'rgb(209, 213, 219)',
                        borderColor: 'rgb(75, 85, 99)',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Time Period',
                          color: '#7a6a7c'
                        },
                        grid: {
                          color: '#f3e8ff',
                          borderColor: '#e8d4e6'
                        },
                        ticks: {
                          color: '#7a6a7c'
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Customer Count',
                          color: '#7a6a7c'
                        },
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
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Segment Distribution Map */}
      <DashboardSection className="w-full">
        <Suspense fallback={<Card className="p-6"><Skeleton height={600} className="animate-pulse" /></Card>}>
          <div
            className="w-full cursor-pointer"
            style={{ minHeight: '600px' }}
            onClick={(event) => {
              if (event.shiftKey) {
                shiftClickManager.addPoint({
                  label: "Segment Distribution Map",
                  value: `${segmentData.length} customers across ${Object.keys(segmentDistribution || {}).length} segments`,
                  source: 'Segmentation Dashboard - Distribution Map'
                }, event.nativeEvent);
              }
            }}
          >
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
        </Suspense>
      </DashboardSection>

      {/* Segment Profiles */}
      <DashboardSection>
        <Suspense fallback={<Card className="p-6"><Skeleton height={300} className="animate-pulse" /></Card>}>
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
        </Suspense>
      </DashboardSection>

      </div>
    </PageLoader>
  );
}