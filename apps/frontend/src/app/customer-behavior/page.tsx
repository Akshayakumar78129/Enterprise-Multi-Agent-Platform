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
import { ShoppingCart, Clock, TrendingUp, MousePointer } from 'lucide-react';

// Mock data generator
const generateBehaviorData = () => {
  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Food'];
  return {
    labels: categories,
    datasets: [{
      label: 'Page Views',
      data: categories.map(() => Math.floor(Math.random() * 5000) + 1000),
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }, {
      label: 'Add to Cart',
      data: categories.map(() => Math.floor(Math.random() * 2000) + 500),
      backgroundColor: 'rgba(34, 197, 94, 0.8)'
    }, {
      label: 'Purchases',
      data: categories.map(() => Math.floor(Math.random() * 1000) + 200),
      backgroundColor: 'rgba(0, 224, 255, 0.8)'
    }]
  };
};

const generateSessionData = () => {
  const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
  return {
    labels: hours,
    datasets: [{
      label: 'Active Sessions',
      data: hours.map(() => Math.floor(Math.random() * 1000) + 200),
      borderColor: 'rgba(0, 224, 255, 1)',
      backgroundColor: 'rgba(0, 224, 255, 0.1)',
      fill: true
    }]
  };
};

const generateConversionFunnel = () => {
  const steps = ['Homepage', 'Product View', 'Add to Cart', 'Checkout', 'Purchase'];
  const values = [10000, 6500, 3200, 1800, 1200];
  return {
    labels: steps,
    datasets: [{
      label: 'Users',
      data: values,
      backgroundColor: 'rgba(0, 224, 255, 0.8)'
    }]
  };
};

export default function CustomerBehaviorPage() {
  const [loading, setLoading] = useState(true);
  const [behaviorData, setBehaviorData] = useState(generateBehaviorData());
  const [sessionData, setSessionData] = useState(generateSessionData());
  const [funnelData, setFunnelData] = useState(generateConversionFunnel());

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const kpiData = [
    {
      title: 'Avg Session Duration',
      value: '5m 42s',
      change: 12.3,
      icon: <Clock className="w-5 h-5" />,
      trend: 'up' as const
    },
    {
      title: 'Pages per Session',
      value: '4.8',
      change: 8.5,
      icon: <MousePointer className="w-5 h-5" />,
      trend: 'up' as const
    },
    {
      title: 'Cart Abandonment',
      value: '68.2%',
      change: -3.2,
      icon: <ShoppingCart className="w-5 h-5" />,
      trend: 'down' as const
    },
    {
      title: 'Conversion Rate',
      value: '3.4%',
      change: 15.2,
      icon: <TrendingUp className="w-5 h-5" />,
      trend: 'up' as const
    }
  ];

  const behaviorPatterns = [
    {
      pattern: 'Browse → Add to Cart → Exit',
      frequency: '34%',
      avgValue: '$89',
      trend: 'increasing'
    },
    {
      pattern: 'Search → Product View → Purchase',
      frequency: '23%',
      avgValue: '$156',
      trend: 'stable'
    },
    {
      pattern: 'Homepage → Category → Product → Cart → Purchase',
      frequency: '18%',
      avgValue: '$234',
      trend: 'increasing'
    },
    {
      pattern: 'Direct Product → Add to Cart → Purchase',
      frequency: '12%',
      avgValue: '$78',
      trend: 'decreasing'
    }
  ];

  return (
    <DashboardLayout
      title="Customer Behavior Analytics"
      currentPath="/customer-behavior">
      {/* KPIs */}
      <DashboardSection title="Behavioral Metrics">
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
              id: 'userType',
              label: 'User Type',
              type: 'select',
              value: 'all',
              options: [
                { value: 'all', label: 'All Users' },
                { value: 'new', label: 'New Users' },
                { value: 'returning', label: 'Returning Users' },
                { value: 'vip', label: 'VIP Users' }
              ]
            },
            {
              id: 'device',
              label: 'Device',
              type: 'select',
              value: 'all',
              options: [
                { value: 'all', label: 'All Devices' },
                { value: 'desktop', label: 'Desktop' },
                { value: 'mobile', label: 'Mobile' },
                { value: 'tablet', label: 'Tablet' }
              ]
            }
          ]}
          onFilterChange={(filters) => console.log('Filters changed:', filters)}
        />
      </DashboardSection>

      {/* Main Charts */}
      <DashboardGrid cols={2}>
        <DashboardSection title="Category Engagement">
          <BarChart
            data={behaviorData}
            height={350}
            showLegend={true}
          />
        </DashboardSection>

        <DashboardSection title="Session Activity (24h)">
          <LineChart
            data={sessionData}
            height={350}
            showLegend={false}
          />
        </DashboardSection>
      </DashboardGrid>

      {/* Conversion Funnel */}
      <DashboardSection title="Conversion Funnel">
        <BarChart
          data={funnelData}
          height={300}
          horizontal={true}
          showLegend={false}
        />
      </DashboardSection>

      {/* AI Insights */}
      <DashboardSection title="AI-Generated Behavioral Insights">
        <AIInsightBlock
          title="Cart Abandonment Spike Detected"
          riskLevel="high"
          revenue={45000}
          trend="increasing"
          breakdown="Analysis reveals a 15% increase in cart abandonment rate over the past week, particularly affecting mobile users during checkout."
          insights={[
            "68% of abandonments occur at the payment step, up from 53% last month",
            "Mobile users show 2.3x higher abandonment rate than desktop users",
            "Average abandoned cart value: $124.50 (23% higher than completed purchases)"
          ]}
          actionPlan={[
            "Implement simplified mobile checkout process",
            "Add guest checkout option to reduce friction",
            "Deploy cart recovery email campaign within 2 hours of abandonment",
            "Offer limited-time discount codes for abandoned carts over $100"
          ]}
          timestamp={new Date().toISOString()}
        />
      </DashboardSection>

      {/* Behavior Patterns Table */}
      <DashboardSection title="Common Behavior Patterns">
        <Card className="p-4">
          <DataTable
            columns={[
              { id: 'pattern', header: 'User Journey Pattern', accessor: 'pattern' },
              { id: 'frequency', header: 'Frequency', accessor: 'frequency' },
              { id: 'avgValue', header: 'Avg Order Value', accessor: 'avgValue' },
              { id: 'trend', header: 'Trend', accessor: 'trend' }
            ]}
            data={behaviorPatterns}
            showPagination={false}
            searchable={false}
          />
        </Card>
      </DashboardSection>

      {/* Additional Insights */}
      <DashboardGrid cols={2}>
        <DashboardSection>
          <AIInsightBlock
            title="High-Value User Segment Identified"
            riskLevel="low"
            revenue={125000}
            trend="stable"
            insights={[
              "523 users contribute to 41% of total revenue",
              "These users visit 3x more frequently than average",
              "Primary interest: Electronics and Home categories"
            ]}
            actionPlan={[
              "Create VIP loyalty program for high-value users",
              "Provide personalized product recommendations",
              "Offer early access to new products"
            ]}
          />
        </DashboardSection>

        <DashboardSection>
          <AIInsightBlock
            title="Search Behavior Optimization Opportunity"
            riskLevel="medium"
            revenue={35000}
            trend="stable"
            insights={[
              "32% of searches result in no clicks",
              "Top failed searches: 'wireless earbuds', 'smart watch', 'yoga mat'",
              "Users who use search have 2.1x higher conversion rate"
            ]}
            actionPlan={[
              "Improve search algorithm for better relevance",
              "Add auto-suggestions and filters",
              "Create landing pages for top search terms"
            ]}
          />
        </DashboardSection>
      </DashboardGrid>
    </DashboardLayout>
  );
}