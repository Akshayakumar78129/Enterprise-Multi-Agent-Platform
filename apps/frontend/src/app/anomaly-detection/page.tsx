"use client";

import React from 'react';
import {
  DashboardGrid,
  DashboardSection,
  Card,
  PageLoader,
  getShiftClickManager
} from 'components/index';
import { Bar } from 'react-chartjs-2';
import {
  AnomalyKPIs,
  CustomerAnomaliesTable,
  SeverityDistribution,
  TimeSeriesChart,
  FeatureContributionPlot
} from './components';
import { useAnomalyContext } from './context';
import { useAnomalyData } from './hooks/useAnomalyData';

export default function AnomalyDetectionPage() {
  const { filters, setAnomalyCustomers } = useAnomalyContext();
  const shiftClickManager = getShiftClickManager();
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const prevCustomerAnomaliesRef = React.useRef<any[]>([]);

  const {
    loading,
    error,
    customerAnomalies,
    segmentDistribution,
    regionDistribution,
    severityDistribution,
    featureImportance,
    featureContribution,
    timeSeriesAnomalies,
    kpiMetrics,
    hasNoData
  } = useAnomalyData(filters);

  // Update context with customer data for BI panel
  // CRITICAL FIX: Use ref to prevent infinite loop - only update if data actually changed
  React.useEffect(() => {
    if (JSON.stringify(customerAnomalies) !== JSON.stringify(prevCustomerAnomaliesRef.current)) {
      prevCustomerAnomaliesRef.current = customerAnomalies;
      setAnomalyCustomers(customerAnomalies);
    }
  }, [customerAnomalies, setAnomalyCustomers]);

  // Memoize callback functions to prevent infinite loops in child components
  const handleCustomerSelect = React.useCallback((customer: any) => {
    setSelectedCustomer(customer);
    console.log('Selected customer:', customer);
  }, []);

  const handleFeatureSelect = React.useCallback((features: { x: string; y: string }) => {
    console.log('Selected features:', features);
  }, []);

  if (error && !loading && hasNoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-2">Unable to load data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Memoize expensive chart data computations to prevent re-calculations on every render
  const segmentChartData = React.useMemo(() => ({
    labels: segmentDistribution.map(s => s.segment),
    datasets: [
      {
        label: 'Anomaly Count',
        data: segmentDistribution.map(s => s.anomaly_count),
        backgroundColor: 'rgba(233, 48, 255, 0.8)',
        borderColor: '#e930ff',
        borderWidth: 1
      }
    ]
  }), [segmentDistribution]);

  // Memoize region chart data
  const regionChartData = React.useMemo(() => ({
    labels: regionDistribution.map(r => r.region),
    datasets: [
      {
        data: regionDistribution.map(r => r.anomaly_count),
        backgroundColor: [
          '#00e0ff',
          '#5fd4d6',
          '#5891cb',
          '#aa45dd',
          '#e930ff',
          '#f59e0b'
        ]
      }
    ]
  }), [regionDistribution]);

  // Memoize chart options to prevent unnecessary re-renders
  const segmentChartOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(139, 92, 246, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e8d4e6',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(232, 212, 230, 0.1)'
        },
        ticks: { color: '#8b5cf6' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#8b5cf6' }
      }
    }
  }), []);

  const regionChartOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(139, 92, 246, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e8d4e6',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(232, 212, 230, 0.1)' },
        ticks: { color: '#8b5cf6' }
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#8b5cf6',
          autoSkip: false
        }
      }
    }
  }), []);

  return (
    <PageLoader
      isLoading={loading}
      loaderProps={{
        title: "Anomaly Detection",
      }}
    >
      {/* KPI Section */}
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Key Metrics</h3>
        <AnomalyKPIs kpiMetrics={kpiMetrics} loading={false} />
      </DashboardSection>

      {/* Time Series and Severity Analysis */}
      <DashboardSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Anomaly Trend</h3>
            <TimeSeriesChart
              data={timeSeriesAnomalies}
              loading={false}
            />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Severity Distribution</h3>
            <SeverityDistribution
              data={severityDistribution}
              loading={false}
            />
          </div>
        </div>
      </DashboardSection>

      {/* Feature Analysis Section */}
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Feature Contribution Analysis</h3>
        <FeatureContributionPlot
          anomalies={customerAnomalies}
          featureContributions={featureContribution || []}
          loading={false}
          onPointClick={handleCustomerSelect}
          onFeatureSelect={handleFeatureSelect}
        />
      </DashboardSection>

      {/* Distribution Analysis */}
      <DashboardSection>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Segment Distribution */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Segment Distribution</h3>
            <Card
              onShiftClick={(event) => {
                shiftClickManager.addPoint({
                  label: "Segment Distribution",
                  value: `Anomalies by customer segment`,
                  source: 'Anomaly Dashboard - Segment Distribution'
                }, event.nativeEvent);
              }}
            >
            <div className="h-80 p-4">
              <Bar
                data={segmentChartData}
                options={segmentChartOptions}
              />
            </div>
            </Card>
          </div>

          {/* Region Distribution */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Regional Distribution</h3>
            <Card
              onShiftClick={(event) => {
                shiftClickManager.addPoint({
                  label: "Regional Distribution",
                  value: `Geographic anomaly distribution`,
                  source: 'Anomaly Dashboard - Regional Distribution'
                }, event.nativeEvent);
              }}
            >
            <div className="h-80 p-4">
              <Bar
                data={regionChartData}
                options={regionChartOptions}
              />
            </div>
            </Card>
          </div>
        </div>
      </DashboardSection>

      {/* Customer Details Table */}
      <DashboardSection>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Anomaly Details</h3>
        <CustomerAnomaliesTable
          data={customerAnomalies}
          loading={false}
          onCustomerSelect={handleCustomerSelect}
        />
      </DashboardSection>

      {/* Selected Customer Details Panel */}
      {selectedCustomer && (
        <DashboardSection>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">Selected Customer Details</h3>
          <Card
            onShiftClick={(event) => {
              shiftClickManager.addPoint({
                label: "Selected Customer Details",
                value: `Customer details panel`,
                source: 'Anomaly Dashboard - Customer Details'
              }, event.nativeEvent);
            }}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="text-2xl">🔍</span>
                  {selectedCustomer.customer_name || selectedCustomer.customerName || `Customer ${selectedCustomer.customer_id || selectedCustomer.customerId}`}
                </h3>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-3 py-1 text-sm bg-background hover:bg-muted border border-border rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Customer ID</div>
                  <div className="text-base font-medium">
                    {selectedCustomer.customer_id || selectedCustomer.customerId}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Anomaly Score</div>
                  <div className="text-base font-medium text-primary">
                    {(selectedCustomer.anomaly_score || selectedCustomer.anomalyScore || 0).toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Severity Level</div>
                  <div className="text-base font-medium">
                    Level {selectedCustomer.severity_level || selectedCustomer.severity || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Region</div>
                  <div className="text-base font-medium">
                    {selectedCustomer.region || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Segment</div>
                  <div className="text-base font-medium">
                    {selectedCustomer.segment || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Transactions</div>
                  <div className="text-base font-medium">
                    {selectedCustomer.transaction_count || selectedCustomer.transactionCount || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Spend</div>
                  <div className="text-base font-medium">
                    ${(selectedCustomer.total_spend || selectedCustomer.totalSpend || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Days Since Last</div>
                  <div className="text-base font-medium">
                    {selectedCustomer.days_since_last_txn || selectedCustomer.daysSinceLastTxn || 0} days
                  </div>
                </div>
              </div>

              {/* Anomalous Features */}
              {selectedCustomer.anomalous_features && selectedCustomer.anomalous_features.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Anomalous Features</h4>
                  <div className="space-y-2">
                    {selectedCustomer.anomalous_features.slice(0, 5).map((feature: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-background/50 rounded">
                        <span className="text-sm">{feature.feature}</span>
                        <div className="flex gap-4">
                          <span className="text-sm text-muted-foreground">Value: {feature.value?.toFixed(2)}</span>
                          <span className="text-sm font-medium text-primary">Z-Score: {feature.zscore?.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </DashboardSection>
      )}
    </PageLoader>
  );
}