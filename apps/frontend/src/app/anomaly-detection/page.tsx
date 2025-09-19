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
import { AlertTriangle, Shield, Activity, TrendingUp } from 'lucide-react';

// Mock data generator
const generateAnomalyData = () => {
  const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
  return {
    labels: hours,
    datasets: [
      {
        label: 'Normal Range',
        data: hours.map(() => Math.floor(Math.random() * 50) + 100),
        borderColor: 'rgba(34, 197, 94, 0.5)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true
      },
      {
        label: 'Actual Values',
        data: hours.map((_, i) => {
          const base = Math.floor(Math.random() * 50) + 100;
          // Inject anomalies at specific hours
          if (i === 8 || i === 14 || i === 20) {
            return base + Math.floor(Math.random() * 100) + 50;
          }
          return base;
        }),
        borderColor: 'rgba(0, 224, 255, 1)',
        backgroundColor: 'rgba(0, 224, 255, 0.1)',
        fill: false
      }
    ]
  };
};

const generateAnomalyTypes = () => {
  const types = ['Transaction Spike', 'Login Anomaly', 'Price Deviation', 'Inventory Alert', 'Payment Failure', 'Traffic Surge'];
  return {
    labels: types,
    datasets: [{
      label: 'Anomaly Count',
      data: types.map(() => Math.floor(Math.random() * 20) + 5),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ]
    }]
  };
};

export default function AnomalyDetectionPage() {
  const [loading, setLoading] = useState(true);
  const [anomalyData, setAnomalyData] = useState(generateAnomalyData());
  const [anomalyTypes, setAnomalyTypes] = useState(generateAnomalyTypes());

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const kpiData = [
    {
      title: 'Active Anomalies',
      value: '24',
      change: 33.3,
      icon: <AlertTriangle className="w-5 h-5" />,
      trend: 'up' as const
    },
    {
      title: 'Detection Rate',
      value: '98.5%',
      change: 2.1,
      icon: <Shield className="w-5 h-5" />,
      trend: 'up' as const
    },
    {
      title: 'False Positive Rate',
      value: '2.3%',
      change: -15.4,
      icon: <Activity className="w-5 h-5" />,
      trend: 'down' as const
    },
    {
      title: 'Avg Resolution Time',
      value: '4.2h',
      change: -8.7,
      icon: <TrendingUp className="w-5 h-5" />,
      trend: 'down' as const
    }
  ];

  const recentAnomalies = [
    {
      id: 'ANM-001',
      timestamp: '2024-01-15 14:23:00',
      type: 'Transaction Spike',
      severity: 'Critical',
      status: 'Active',
      impact: '$45,000'
    },
    {
      id: 'ANM-002',
      timestamp: '2024-01-15 13:45:00',
      type: 'Login Anomaly',
      severity: 'High',
      status: 'Investigating',
      impact: '234 accounts'
    },
    {
      id: 'ANM-003',
      timestamp: '2024-01-15 12:30:00',
      type: 'Price Deviation',
      severity: 'Medium',
      status: 'Resolved',
      impact: '$12,300'
    },
    {
      id: 'ANM-004',
      timestamp: '2024-01-15 11:15:00',
      type: 'Inventory Alert',
      severity: 'Low',
      status: 'Monitoring',
      impact: '45 SKUs'
    },
    {
      id: 'ANM-005',
      timestamp: '2024-01-15 10:00:00',
      type: 'Payment Failure',
      severity: 'High',
      status: 'Active',
      impact: '$23,000'
    }
  ];

  return (
    <DashboardLayout
      title="Anomaly Detection"
      currentPath="/anomaly-detection">
      {/* KPIs */}
      <DashboardSection title="Detection Metrics">
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
              id: 'severity',
              label: 'Severity',
              type: 'select',
              value: 'all',
              options: [
                { value: 'all', label: 'All Severities' },
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]
            },
            {
              id: 'type',
              label: 'Anomaly Type',
              type: 'select',
              value: 'all',
              options: [
                { value: 'all', label: 'All Types' },
                { value: 'transaction', label: 'Transaction' },
                { value: 'login', label: 'Login' },
                { value: 'price', label: 'Price' },
                { value: 'inventory', label: 'Inventory' }
              ]
            }
          ]}
          onFilterChange={(filters) => console.log('Filters changed:', filters)}
        />
      </DashboardSection>

      {/* Main Charts */}
      <DashboardGrid cols={2}>
        <DashboardSection title="Anomaly Detection Timeline (24h)">
          <LineChart
            data={anomalyData}
            height={350}
            showLegend={true}
          />
        </DashboardSection>

        <DashboardSection title="Anomalies by Type">
          <BarChart
            data={anomalyTypes}
            height={350}
            showLegend={false}
          />
        </DashboardSection>
      </DashboardGrid>

      {/* AI Insights */}
      <DashboardSection title="AI-Powered Anomaly Analysis">
        <AIInsightBlock
          title="Critical: Unusual Transaction Pattern Detected"
          riskLevel="critical"
          revenue={125000}
          trend="increasing"
          breakdown="ML models have detected an unusual spike in high-value transactions from new accounts, suggesting potential fraudulent activity. Pattern matches known fraud signatures with 94% confidence."
          insights={[
            "24 transactions totaling $125,000 from accounts created within last 48 hours",
            "Transaction velocity 5x higher than normal baseline for new accounts",
            "Geographic dispersion pattern indicates coordinated activity across 12 regions",
            "Payment methods: 67% prepaid cards, 33% virtual credit cards"
          ]}
          actionPlan={[
            "Immediately flag and review all transactions from affected accounts",
            "Implement enhanced verification for new account transactions over $1,000",
            "Deploy real-time velocity checks for transaction patterns",
            "Contact payment processors for additional fraud screening",
            "Prepare incident response team for potential escalation"
          ]}
          timestamp={new Date().toISOString()}
        />
      </DashboardSection>

      {/* Recent Anomalies Table */}
      <DashboardSection title="Recent Anomalies">
        <Card className="p-4">
          <DataTable
            columns={[
              { id: 'id', header: 'Anomaly ID', accessor: 'id' },
              { id: 'timestamp', header: 'Timestamp', accessor: 'timestamp' },
              { id: 'type', header: 'Type', accessor: 'type' },
              {
                id: 'severity',
                header: 'Severity',
                accessor: 'severity',
                render: (value) => (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    value === 'Critical' ? 'bg-red-500/20 text-red-500' :
                    value === 'High' ? 'bg-orange-500/20 text-orange-500' :
                    value === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {value}
                  </span>
                )
              },
              { id: 'status', header: 'Status', accessor: 'status' },
              { id: 'impact', header: 'Impact', accessor: 'impact' }
            ]}
            data={recentAnomalies}
            showPagination={false}
            searchable={false}
          />
        </Card>
      </DashboardSection>

      {/* Additional Insights */}
      <DashboardGrid cols={2}>
        <DashboardSection>
          <AIInsightBlock
            title="Login Pattern Anomaly Cluster"
            riskLevel="high"
            revenue={0}
            trend="stable"
            insights={[
              "234 accounts showing unusual login patterns",
              "Multiple failed attempts followed by successful login from different IP",
              "Time-based pattern suggests automated attack"
            ]}
            actionPlan={[
              "Enable 2FA for affected accounts",
              "Implement IP-based rate limiting",
              "Send security alerts to account owners"
            ]}
          />
        </DashboardSection>

        <DashboardSection>
          <AIInsightBlock
            title="Inventory Discrepancy Detection"
            riskLevel="medium"
            revenue={23000}
            trend="decreasing"
            insights={[
              "45 SKUs showing unexpected inventory changes",
              "Discrepancy between POS and warehouse systems",
              "Pattern suggests data sync issues"
            ]}
            actionPlan={[
              "Initiate physical inventory count",
              "Review recent system updates",
              "Implement real-time inventory reconciliation"
            ]}
          />
        </DashboardSection>
      </DashboardGrid>
    </DashboardLayout>
  );
}