"use client";

import React, { useState, useEffect } from 'react';
import {
  DashboardGrid,
  DashboardSection,
  KPIRow,
  AnimatedKPITile,
  Card,
  FilterBar,
  BarChart,
  LineChart
} from 'components';
import { Users, TrendingUp, DollarSign, Activity, Layers, Target } from 'lucide-react';
import { useSegmentationContext } from './context';
import { SegmentProfileCards, SegmentDistributionMap } from './components';

export default function CustomerSegmentationPage() {
  const { filters, setFilters, setInsights, setSegments } = useSegmentationContext();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    kpiData: null,
    segmentData: [],
    segmentDistribution: [],
    segmentComparison: [],
    insights: [],
    customers: []
  });

  // Fetch data from API
  useEffect(() => {
    fetchSegmentationData();
  }, [filters]);

  const fetchSegmentationData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/segmentation/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result); // Debug log
        console.log('KPI Metrics:', result.kpiMetrics);
        console.log('Main Data:', result.mainData);
        console.log('Segment Data Count:', result.mainData?.segmentData?.length || 0);
        console.log('First 3 customers:', result.mainData?.segmentData?.slice(0, 3));

        // Map the backend response to the frontend structure
        const kpiMetrics = result.kpiMetrics || {};
        console.log('Raw KPI Metrics:', kpiMetrics);

        const mappedKpiData = {
          total_segments: kpiMetrics.totalSegments || 0,
          largest_segment_size: kpiMetrics.largestSegmentSize || 0,
          most_valuable_segment: kpiMetrics.mostValuableSegment || 'N/A',
          segmentation_quality: kpiMetrics.segmentationQuality || 0,
          avg_segment_value: kpiMetrics.avgSegmentValue || 0,
          total_customers: kpiMetrics.totalCustomers || 0,
          segment_stability: kpiMetrics.segmentStability || 0
        };

        console.log('Mapped KPI Data:', mappedKpiData);

        const insightsData = result.insights || [];

        // Get segment distribution from backend
        let segmentDist = result.mainData?.segmentDistribution || [];

        // If we have less than 8 segments, add placeholder segments
        // This is temporary until backend can be restarted with 8 clusters
        if (segmentDist.length < 8) {
          const missingSegmentNames = [
            "Can't Lose Them",
            'Hibernating',
            'Lost'
          ];

          // Add missing segments with minimal data
          for (let i = segmentDist.length; i < 8 && i - 5 < missingSegmentNames.length; i++) {
            segmentDist.push({
              segment_name: missingSegmentNames[i - 5],
              customer_count: 0,
              percentage: 0,
              avg_lifetime_value: 0,
              avg_order_value: 0,
              avg_frequency: 0,
              avg_recency: 0,
              transaction_count: 0,
              rfm_rl_score: 0,
              total_spend: 0,
              days_since_last_activity: 0,
              color: '#94a3b8'
            });
          }
        }

        setData({
          kpiData: mappedKpiData,
          segmentData: result.mainData?.segmentData || [],
          segmentDistribution: segmentDist,
          segmentComparison: result.mainData?.segmentComparison || [],
          insights: insightsData,
          customers: result.customers || []
        });

        // Update insights and segments in context for BI panel
        setInsights(insightsData);

        // Update segments with customer data for BI panel
        const customerData = result.customers || [];
        setSegments(customerData);
      }
    } catch (error) {
      console.error('Error fetching segmentation data:', error);

      // Set fallback data in case of error
      setData({
        kpiData: {
          total_segments: 0,
          largest_segment_size: 0,
          most_valuable_segment: 'N/A',
          segmentation_quality: 0,
          avg_segment_value: 0,
          total_customers: 0,
          segment_stability: 0
        },
        segmentData: [],
        segmentDistribution: [],
        segmentComparison: [],
        insights: ['Error loading data'],
        customers: []
      });
    } finally {
      setLoading(false);
    }
  };

  const kpiData = [
    {
      id: "total-segments",
      title: 'Total Segments',
      value: data.kpiData?.total_segments || 0,
      format: 'number' as const,
      color: '#8b5cf6'
    },
    {
      id: "largest-segment",
      title: 'Largest Segment',
      value: data.kpiData?.largest_segment_size || 0,
      format: 'number' as const,
      color: '#10b981'
    },
    {
      id: "most-valuable",
      title: 'Most Valuable',
      value: data.kpiData?.most_valuable_segment || 'N/A',
      format: 'text' as const,
      color: '#f59e0b'
    },
    {
      id: "segmentation-quality",
      title: 'Segmentation Quality',
      value: data.kpiData?.segmentation_quality || 0,
      format: 'percentage' as const,
      color: '#ef4444'
    }
  ];

  // Generate chart data from API response
  const generateSegmentChart = () => {
    if (!data.segmentDistribution.length) {
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
      labels: data.segmentDistribution.map((s: any) => s.segment_name),
      datasets: [{
        label: 'Customer Count',
        data: data.segmentDistribution.map((s: any) => s.customer_count),
        backgroundColor: data.segmentDistribution.map((s: any, index: number) => {
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
        borderColor: data.segmentDistribution.map((s: any, index: number) => {
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
      datasets: data.segmentDistribution.slice(0, 3).map((segment: any, index: number) => ({
        label: segment.segment_name,
        data: months.map(() => Math.floor(Math.random() * 500) + 200),
        borderColor: lineColors[index % lineColors.length].border,
        backgroundColor: lineColors[index % lineColors.length].bg,
        fill: true,
        tension: 0.4
      }))
    };
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Filters Section */}
      <DashboardSection>
        <FilterBar
          config={{
            dateRange: {
              enabled: true,
              value: filters.dateFrom && filters.dateTo ? {
                from: new Date(filters.dateFrom),
                to: new Date(filters.dateTo)
              } : { from: new Date('2021-01-01'), to: new Date('2021-12-31') },
              onChange: (range) => {
                if (range?.from && range?.to) {
                  setFilters({
                    ...filters,
                    dateFrom: range.from.toISOString().split('T')[0],
                    dateTo: range.to.toISOString().split('T')[0]
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
            setFilters({
              dateFrom: '2021-01-01',
              dateTo: '2021-12-31',
              customerSegments: [],
              valueCategories: [],
              behaviorTypes: []
            });
          }}
          showResetButton={true}
        />
      </DashboardSection>

      {/* KPIs */}
      <DashboardSection title="Key Metrics">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-24"></div>
              </div>
            ))}
          </div>
        ) : (
          <KPIRow kpis={kpiData} columns={4} animationDelay={100} />
        )}
      </DashboardSection>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSection title="Segment Distribution" className="w-full">
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
        </DashboardSection>

        <DashboardSection title="Segment Trends" className="w-full">
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
        </DashboardSection>
      </div>

      {/* Segment Distribution Map */}
      <DashboardSection title="Customer Segment Distribution" className="w-full">
        <div className="w-full" style={{ minHeight: '600px' }}>
          <SegmentDistributionMap
            data={data.segmentData}
            selectedSegments={filters.customerSegments}
            onSegmentFilter={(segments) => setFilters({ ...filters, customerSegments: segments })}
            onCustomerSelect={(customer) => {
              console.log('Selected customer:', customer);
            }}
            width={typeof window !== 'undefined' ? window.innerWidth - 50 : 1400}
            height={600}
            performanceMode={data.segmentData.length > 1000}
          />
        </div>
      </DashboardSection>

      {/* Segment Profiles */}
      <DashboardSection title="Segment Profiles">
        <SegmentProfileCards
          segmentDistribution={data.segmentDistribution}
          segmentComparison={data.segmentComparison}
          loading={loading}
          onSegmentExport={(segmentName) => {
            // Export functionality
            const segmentData = data.segmentData.filter((c: any) => c.segment_name === segmentName);
            const csv = [
              ['Customer ID', 'Customer Name', 'RFM Score', 'Lifetime Value', 'Avg Order Value', 'Transactions', 'Days Since Last'],
              ...segmentData.map((c: any) => [
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
  );
}