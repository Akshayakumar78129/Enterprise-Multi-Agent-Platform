"use client";

import React, { useState, useEffect } from 'react';
import {
  DashboardLayout,
  DashboardGrid,
  DashboardSection,
  KPIRow,
  AnimatedKPITile,
  Card,
  FilterBar,
  BarChart,
  LineChart,
  AIInsightBlock,
  DataTable
} from 'components';
import { DollarSign, TrendingUp, Users, Percent } from 'lucide-react';

// Mock data generator
const generateLTVDistribution = () => {
  const ranges = ['$0-100', '$100-500', '$500-1k', '$1k-5k', '$5k-10k', '$10k+'];
  return {
    labels: ranges,
    datasets: [{
      label: 'Customer Count',
      data: [2500, 3200, 1800, 1200, 450, 125],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(0, 224, 255, 0.8)'
      ]
    }]
  };
};

const generateLTVTrend = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return {
    labels: months,
    datasets: [
      {
        label: 'Average LTV',
        data: [850, 920, 980, 1050, 1120, 1200],
        borderColor: 'rgba(0, 224, 255, 1)',
        backgroundColor: 'rgba(0, 224, 255, 0.1)',
        fill: true
      },
      {
        label: 'Target LTV',
        data: [900, 950, 1000, 1050, 1100, 1150],
        borderColor: 'rgba(34, 197, 94, 1)',
        borderDash: [5, 5],
        fill: false
      }
    ]
  };
};

const generateCohortData = () => {
  const cohorts = ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024'];
  return {
    labels: ['Month 1', 'Month 3', 'Month 6', 'Month 9', 'Month 12'],
    datasets: cohorts.map((cohort, index) => ({
      label: cohort,
      data: [100, 250 + index * 50, 450 + index * 80, 680 + index * 100, 850 + index * 120],
      borderColor: `hsl(${200 + index * 30}, 70%, 50%)`,
      fill: false
    }))
  };
};

export default function CustomerLTVPage() {
  const [loading, setLoading] = useState(true);
  const [ltvDistribution, setLtvDistribution] = useState(generateLTVDistribution());
  const [ltvTrend, setLtvTrend] = useState(generateLTVTrend());
  const [cohortData, setCohortData] = useState(generateCohortData());

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const kpiData = [
    {
      title: 'Average LTV',
      value: '$1,234',
      change: 18.5,
      icon: <DollarSign className="w-5 h-5" />,
      trend: 'up' as const
    },
    {
      title: 'LTV:CAC Ratio',
      value: '3.2:1',
      change: 12.3,
      icon: <Percent className="w-5 h-5" />,
      trend: 'up' as const
    },
    {
      title: 'High-Value Customers',
      value: '1,775',
      change: 24.7,
      icon: <Users className="w-5 h-5" />,
      trend: 'up' as const
    },
    {
      title: 'LTV Growth Rate',
      value: '23.4%',
      change: 8.2,
      icon: <TrendingUp className="w-5 h-5" />,
      trend: 'up' as const
    }
  ];

  const topCustomersByLTV = [
    {
      customer: 'Enterprise Corp',
      ltv: '$45,230',
      purchases: 156,
      avgOrderValue: '$290',
      segment: 'Enterprise'
    },
    {
      customer: 'Tech Solutions Inc',
      ltv: '$38,450',
      purchases: 142,
      avgOrderValue: '$271',
      segment: 'Enterprise'
    },
    {
      customer: 'Global Industries',
      ltv: '$32,180',
      purchases: 98,
      avgOrderValue: '$328',
      segment: 'Mid-Market'
    },
    {
      customer: 'Innovation Labs',
      ltv: '$28,900',
      purchases: 124,
      avgOrderValue: '$233',
      segment: 'Enterprise'
    },
    {
      customer: 'Digital Services Co',
      ltv: '$24,560',
      purchases: 89,
      avgOrderValue: '$276',
      segment: 'Mid-Market'
    }
  ];

  return (
    <DashboardLayout
      title="Customer Lifetime Value"
      currentPath="/customer-ltv">
      {/* KPIs */}
      <DashboardSection title="LTV Metrics">
        <KPIRow>
          {kpiData.map((kpi, index) => (
            <AnimatedKPITile
              key={index}
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              icon={kpi.icon}
              trend={kpi.trend}
              delay={index * 100}
            />
          ))}
        </KPIRow>
      </DashboardSection>

      {/* Filters */}
      <DashboardSection>
        <FilterBar
          filters={[
            {
              id: 'dateRange',
              label: 'Date Range',
              type: 'date',
              value: { from: new Date(), to: new Date() }
            },
            {
              id: 'segment',
              label: 'Customer Segment',
              type: 'select',
              value: 'all',
              options: [
                { value: 'all', label: 'All Segments' },
                { value: 'enterprise', label: 'Enterprise' },
                { value: 'mid-market', label: 'Mid-Market' },
                { value: 'small-business', label: 'Small Business' }
              ]
            },
            {
              id: 'cohort',
              label: 'Cohort',
              type: 'select',
              value: 'all',
              options: [
                { value: 'all', label: 'All Cohorts' },
                { value: 'q1-2024', label: 'Q1 2024' },
                { value: 'q4-2023', label: 'Q4 2023' },
                { value: 'q3-2023', label: 'Q3 2023' }
              ]
            }
          ]}
          onFilterChange={(filters) => console.log('Filters changed:', filters)}
        />
      </DashboardSection>

      {/* Main Charts */}
      <DashboardGrid cols={2}>
        <DashboardSection title="LTV Distribution">
          <BarChart
            data={ltvDistribution}
            height={350}
            showLegend={false}
          />
        </DashboardSection>

        <DashboardSection title="LTV Trend Over Time">
          <LineChart
            data={ltvTrend}
            height={350}
            showLegend={true}
          />
        </DashboardSection>
      </DashboardGrid>

      {/* Cohort Analysis */}
      <DashboardSection title="Cohort LTV Analysis">
        <LineChart
          data={cohortData}
          height={300}
          showLegend={true}
        />
      </DashboardSection>

      {/* AI Insights */}
      <DashboardSection title="AI-Generated LTV Insights">
        <AIInsightBlock
          title="High-Value Customer Segment Growing Rapidly"
          riskLevel="low"
          revenue={250000}
          trend="increasing"
          breakdown="Analysis shows a 24.7% growth in high-value customers (LTV > $5,000) over the past quarter. This segment now represents 35% of total revenue."
          insights={[
            "1,775 customers have LTV > $5,000, up from 1,423 last quarter",
            "Average purchase frequency for this segment: 2.8x per month",
            "Primary drivers: Product quality (42%), customer service (31%), loyalty program (27%)"
          ]}
          actionPlan={[
            "Expand VIP customer success program to maintain high satisfaction",
            "Create exclusive product lines for high-value segments",
            "Implement predictive analytics to identify potential high-LTV customers early",
            "Launch referral incentives targeting this segment"
          ]}
          timestamp={new Date().toISOString()}
        />
      </DashboardSection>

      {/* Top Customers Table */}
      <DashboardSection title="Top Customers by LTV">
        <Card className="p-4">
          <DataTable
            columns={[
              { id: 'customer', header: 'Customer Name', accessor: 'customer' },
              { id: 'ltv', header: 'Lifetime Value', accessor: 'ltv' },
              { id: 'purchases', header: 'Total Purchases', accessor: 'purchases' },
              { id: 'avgOrderValue', header: 'Avg Order Value', accessor: 'avgOrderValue' },
              { id: 'segment', header: 'Segment', accessor: 'segment' }
            ]}
            data={topCustomersByLTV}
            showPagination={false}
            searchable={false}
          />
        </Card>
      </DashboardSection>

      {/* Additional Insights */}
      <DashboardGrid cols={2}>
        <DashboardSection>
          <AIInsightBlock
            title="LTV:CAC Ratio Improvement Opportunity"
            riskLevel="medium"
            revenue={85000}
            trend="stable"
            insights={[
              "Current LTV:CAC ratio of 3.2:1 is below industry benchmark of 4:1",
              "CAC has increased 15% while LTV growth is only 12%",
              "Paid acquisition channels showing declining efficiency"
            ]}
            actionPlan={[
              "Optimize paid marketing spend allocation",
              "Increase focus on organic acquisition channels",
              "Implement retention programs to boost LTV",
              "Test new acquisition channels with lower CAC"
            ]}
          />
        </DashboardSection>

        <DashboardSection>
          <AIInsightBlock
            title="Cohort Retention Success"
            riskLevel="low"
            revenue={180000}
            trend="increasing"
            insights={[
              "Q1 2024 cohort showing 35% better retention than Q1 2023",
              "12-month LTV for recent cohorts up 28%",
              "Improved onboarding process showing results"
            ]}
            actionPlan={[
              "Document and scale successful onboarding practices",
              "Continue A/B testing retention strategies",
              "Implement cohort-specific engagement campaigns"
            ]}
          />
        </DashboardSection>
      </DashboardGrid>
    </DashboardLayout>
  );
}