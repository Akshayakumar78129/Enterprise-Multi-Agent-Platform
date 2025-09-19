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
  AIInsightBlock
} from 'components';
import { Users, TrendingUp, DollarSign, Activity } from 'lucide-react';

// Mock data generator
const generateSegmentData = () => {
  const segments = ['Champions', 'Loyal Customers', 'Potential Loyalists', 'New Customers', 'At Risk', 'Lost'];
  return {
    labels: segments,
    datasets: [{
      label: 'Customer Count',
      data: segments.map(() => Math.floor(Math.random() * 1000) + 200),
      backgroundColor: [
        'rgba(0, 224, 255, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ]
    }]
  };
};

const generateTrendData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return {
    labels: months,
    datasets: [
      {
        label: 'Champions',
        data: months.map(() => Math.floor(Math.random() * 500) + 300),
        borderColor: 'rgba(0, 224, 255, 1)',
        backgroundColor: 'rgba(0, 224, 255, 0.1)',
        fill: true
      },
      {
        label: 'At Risk',
        data: months.map(() => Math.floor(Math.random() * 300) + 100),
        borderColor: 'rgba(249, 115, 22, 1)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true
      }
    ]
  };
};

export default function CustomerSegmentationPage() {
  const [loading, setLoading] = useState(true);
  const [segmentData, setSegmentData] = useState(generateSegmentData());
  const [trendData, setTrendData] = useState(generateTrendData());

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const kpiData = [
    {
      title: 'Total Customers',
      value: '12,543',
      change: 12.5,
      icon: <Users className="w-5 h-5" />,
      trend: 'up' as const
    },
    {
      title: 'Champions',
      value: '2,341',
      change: 8.2,
      icon: <TrendingUp className="w-5 h-5" />,
      trend: 'up' as const
    },
    {
      title: 'At Risk',
      value: '1,234',
      change: -5.3,
      icon: <Activity className="w-5 h-5" />,
      trend: 'down' as const
    },
    {
      title: 'Customer LTV',
      value: '$4,567',
      change: 15.7,
      icon: <DollarSign className="w-5 h-5" />,
      trend: 'up' as const
    }
  ];

  return (
    <DashboardLayout
      title="Customer Segmentation"
      currentPath="/customer-segmentation">
      {/* KPIs */}
      <DashboardSection title="Key Metrics">
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
              label: 'Segment',
              type: 'select',
              value: 'all',
              options: [
                { value: 'all', label: 'All Segments' },
                { value: 'champions', label: 'Champions' },
                { value: 'loyal', label: 'Loyal Customers' },
                { value: 'at_risk', label: 'At Risk' }
              ]
            }
          ]}
          onFilterChange={(filters) => console.log('Filters changed:', filters)}
        />
      </DashboardSection>

      {/* Main Charts */}
      <DashboardGrid cols={2}>
        <DashboardSection title="Segment Distribution">
          <BarChart
            data={segmentData}
            height={350}
            showLegend={false}
          />
        </DashboardSection>

        <DashboardSection title="Segment Trends">
          <LineChart
            data={trendData}
            height={350}
            showLegend={true}
          />
        </DashboardSection>
      </DashboardGrid>

      {/* AI Insights */}
      <DashboardSection title="AI-Generated Insights">
        <AIInsightBlock
          title="Critical Segment Alert: At-Risk Customers Increasing"
          riskLevel="high"
          revenue={125000}
          trend="increasing"
          breakdown="Analysis shows a 15% increase in at-risk customers over the past month. This segment represents $125,000 in monthly recurring revenue."
          insights={[
            "234 customers moved from 'Loyal' to 'At Risk' segment in the last 30 days",
            "Primary churn indicators: Decreased purchase frequency (down 45%) and engagement (down 60%)",
            "Top affected demographics: Age 25-34, located in urban areas"
          ]}
          actionPlan={[
            "Launch targeted re-engagement campaign for at-risk segment",
            "Offer personalized incentives based on purchase history",
            "Implement proactive customer success outreach",
            "Create segment-specific retention programs"
          ]}
          timestamp={new Date().toISOString()}
        />
      </DashboardSection>

      {/* Additional Insights */}
      <DashboardGrid cols={2}>
        <DashboardSection>
          <AIInsightBlock
            title="Growth Opportunity: Potential Loyalists"
            riskLevel="low"
            revenue={75000}
            trend="stable"
            insights={[
              "456 customers identified with high conversion potential",
              "Average order value 23% higher than new customers",
              "Engagement rate increased by 30% in last quarter"
            ]}
            actionPlan={[
              "Implement loyalty program invitation",
              "Send personalized product recommendations",
              "Offer exclusive early access to new products"
            ]}
          />
        </DashboardSection>

        <DashboardSection>
          <AIInsightBlock
            title="Champion Customer Retention Success"
            riskLevel="low"
            revenue={250000}
            trend="increasing"
            insights={[
              "Champion segment grew by 8.2% this month",
              "Average customer lifetime value: $12,500",
              "Net Promoter Score: 72 (Excellent)"
            ]}
            actionPlan={[
              "Continue VIP treatment program",
              "Expand referral incentives",
              "Create exclusive champion community"
            ]}
          />
        </DashboardSection>
      </DashboardGrid>
    </DashboardLayout>
  );
}