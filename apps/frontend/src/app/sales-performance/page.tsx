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
import { DollarSign, TrendingUp, ShoppingBag, Target } from 'lucide-react';

// Mock data generator
const generateSalesData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return {
    labels: months,
    datasets: [
      {
        label: 'Revenue',
        data: [450000, 520000, 480000, 590000, 620000, 680000],
        borderColor: 'rgba(0, 224, 255, 1)',
        backgroundColor: 'rgba(0, 224, 255, 0.1)',
        fill: true
      },
      {
        label: 'Target',
        data: [500000, 500000, 550000, 550000, 600000, 650000],
        borderColor: 'rgba(34, 197, 94, 1)',
        borderDash: [5, 5],
        fill: false
      }
    ]
  };
};

const generateProductSales = () => {
  const products = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'];
  return {
    labels: products,
    datasets: [{
      label: 'Units Sold',
      data: [2340, 1890, 1650, 1420, 980],
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }, {
      label: 'Revenue ($K)',
      data: [234, 189, 165, 142, 98],
      backgroundColor: 'rgba(0, 224, 255, 0.8)'
    }]
  };
};

const generateSalesByRegion = () => {
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  return {
    labels: regions,
    datasets: [{
      label: 'Q1 Sales',
      data: [320000, 280000, 410000, 350000, 290000],
      backgroundColor: 'rgba(34, 197, 94, 0.8)'
    }, {
      label: 'Q2 Sales',
      data: [350000, 310000, 450000, 380000, 320000],
      backgroundColor: 'rgba(0, 224, 255, 0.8)'
    }]
  };
};

export default function SalesPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState(generateSalesData());
  const [productSales, setProductSales] = useState(generateProductSales());
  const [regionalSales, setRegionalSales] = useState(generateSalesByRegion());

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const kpiData = [
    {
      title: 'Total Revenue',
      value: '$3.34M',
      change: 23.5,
      icon: <DollarSign className="w-5 h-5" />,
      trend: 'up' as const
    },
    {
      title: 'Sales Growth',
      value: '18.2%',
      change: 5.3,
      icon: <TrendingUp className="w-5 h-5" />,
      trend: 'up' as const
    },
    {
      title: 'Units Sold',
      value: '8,280',
      change: 12.4,
      icon: <ShoppingBag className="w-5 h-5" />,
      trend: 'up' as const
    },
    {
      title: 'Target Achievement',
      value: '104.6%',
      change: 8.9,
      icon: <Target className="w-5 h-5" />,
      trend: 'up' as const
    }
  ];

  const topSalesReps = [
    {
      name: 'Sarah Johnson',
      sales: '$456,230',
      deals: 87,
      conversion: '34.2%',
      quota: '112%'
    },
    {
      name: 'Michael Chen',
      sales: '$412,180',
      deals: 76,
      conversion: '31.5%',
      quota: '108%'
    },
    {
      name: 'Emily Davis',
      sales: '$389,450',
      deals: 92,
      conversion: '28.7%',
      quota: '102%'
    },
    {
      name: 'James Wilson',
      sales: '$367,890',
      deals: 68,
      conversion: '36.1%',
      quota: '97%'
    },
    {
      name: 'Lisa Anderson',
      sales: '$345,120',
      deals: 81,
      conversion: '29.3%',
      quota: '91%'
    }
  ];

  return (
    <DashboardLayout
      title="Sales Performance"
      currentPath="/sales-performance">
      {/* KPIs */}
      <DashboardSection title="Sales Metrics">
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
              id: 'team',
              label: 'Sales Team',
              type: 'select',
              value: 'all',
              options: [
                { value: 'all', label: 'All Teams' },
                { value: 'enterprise', label: 'Enterprise' },
                { value: 'smb', label: 'SMB' },
                { value: 'retail', label: 'Retail' }
              ]
            },
            {
              id: 'product',
              label: 'Product Line',
              type: 'select',
              value: 'all',
              options: [
                { value: 'all', label: 'All Products' },
                { value: 'software', label: 'Software' },
                { value: 'hardware', label: 'Hardware' },
                { value: 'services', label: 'Services' }
              ]
            }
          ]}
          onFilterChange={(filters) => console.log('Filters changed:', filters)}
        />
      </DashboardSection>

      {/* Main Charts */}
      <DashboardSection title="Revenue Trend">
        <LineChart
          data={salesData}
          height={350}
          showLegend={true}
        />
      </DashboardSection>

      <DashboardGrid cols={2}>
        <DashboardSection title="Product Performance">
          <BarChart
            data={productSales}
            height={300}
            showLegend={true}
          />
        </DashboardSection>

        <DashboardSection title="Regional Sales">
          <BarChart
            data={regionalSales}
            height={300}
            showLegend={true}
            stacked={false}
          />
        </DashboardSection>
      </DashboardGrid>

      {/* AI Insights */}
      <DashboardSection title="AI-Generated Sales Insights">
        <AIInsightBlock
          title="Q2 Sales Momentum Building - Exceeding Targets"
          riskLevel="low"
          revenue={680000}
          trend="increasing"
          breakdown="June sales hit $680K, representing 104.6% of target achievement. Strong performance driven by Enterprise segment growth and successful product launches."
          insights={[
            "Enterprise segment sales up 45% YoY, contributing $380K to June revenue",
            "New product line exceeded launch targets by 23% in first month",
            "Sales team conversion rate improved from 28% to 32% after training initiative",
            "Average deal size increased by $12,450 (18%) compared to Q1"
          ]}
          actionPlan={[
            "Scale successful Enterprise sales strategies to SMB segment",
            "Increase inventory for top-performing products to meet demand",
            "Launch referral incentive program to capitalize on momentum",
            "Hire 3 additional sales reps to handle increased pipeline",
            "Implement advanced sales analytics for better forecasting"
          ]}
          timestamp={new Date().toISOString()}
        />
      </DashboardSection>

      {/* Top Sales Reps Table */}
      <DashboardSection title="Top Sales Representatives">
        <Card className="p-4">
          <DataTable
            columns={[
              { id: 'name', header: 'Sales Rep', accessor: 'name' },
              { id: 'sales', header: 'Total Sales', accessor: 'sales' },
              { id: 'deals', header: 'Deals Closed', accessor: 'deals' },
              { id: 'conversion', header: 'Conversion Rate', accessor: 'conversion' },
              {
                id: 'quota',
                header: 'Quota Achievement',
                accessor: 'quota',
                render: (value) => (
                  <span className={`font-medium ${
                    parseInt(value) >= 100 ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {value}
                  </span>
                )
              }
            ]}
            data={topSalesReps}
            showPagination={false}
            searchable={false}
          />
        </Card>
      </DashboardSection>

      {/* Additional Insights */}
      <DashboardGrid cols={2}>
        <DashboardSection>
          <AIInsightBlock
            title="Cross-Sell Opportunity Identified"
            riskLevel="low"
            revenue={125000}
            trend="stable"
            insights={[
              "68% of Product A buyers also purchase Product C within 30 days",
              "Potential revenue impact: $125K per quarter",
              "Current cross-sell rate: 23% (industry avg: 35%)"
            ]}
            actionPlan={[
              "Create bundled pricing for Product A + C",
              "Train sales team on cross-sell techniques",
              "Implement automated cross-sell recommendations in CRM"
            ]}
          />
        </DashboardSection>

        <DashboardSection>
          <AIInsightBlock
            title="Pipeline Acceleration Needed"
            riskLevel="medium"
            revenue={450000}
            trend="stable"
            insights={[
              "Average sales cycle increased from 32 to 41 days",
              "$450K in pipeline stuck at negotiation stage",
              "Deal velocity decreased by 18% in past month"
            ]}
            actionPlan={[
              "Implement deal acceleration program",
              "Provide negotiation training for sales team",
              "Create time-limited promotional offers",
              "Assign senior reps to high-value stuck deals"
            ]}
          />
        </DashboardSection>
      </DashboardGrid>
    </DashboardLayout>
  );
}