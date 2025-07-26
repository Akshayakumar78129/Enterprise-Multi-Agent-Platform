import React, { useState, useEffect } from 'react';
import AnomalyKPITiles from '../components/kpi/AnomalyKPITiles';
import SeverityDistribution from '../components/visualizations/SeverityDistribution';
import FeatureContributionPlot from '../components/visualizations/FeatureContributionPlot';
import AnomalyTable from '../components/visualizations/AnomalyTable';

const AnomalyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    severityLevels: [1, 2, 3, 4, 5],
    regions: [],
    segments: [],
    dateRange: { start: null, end: null },
    anomalyScoreRange: [0, 1]
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch anomaly data
  useEffect(() => {
    fetchAnomalyData();
  }, [filters]);

  const fetchAnomalyData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        severityLevels: JSON.stringify(filters.severityLevels),
        regions: JSON.stringify(filters.regions),
        segments: JSON.stringify(filters.segments),
        dateRange: JSON.stringify(filters.dateRange),
        anomalyScoreRange: JSON.stringify(filters.anomalyScoreRange)
      });

      const response = await fetch(`/api/anomaly-detection/data?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch anomaly data: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch anomaly data');
      }
    } catch (err) {
      console.error('Error fetching anomaly data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeverityClick = (severity) => {
    if (filters.severityLevels.includes(severity)) {
      // Remove severity if already selected
      if (filters.severityLevels.length > 1) {
        setFilters(prev => ({
          ...prev,
          severityLevels: prev.severityLevels.filter(s => s !== severity)
        }));
      }
    } else {
      // Add severity
      setFilters(prev => ({
        ...prev,
        severityLevels: [...prev.severityLevels, severity].sort()
      }));
    }
  };

  const handleCustomerSelect = (customerData) => {
    setSelectedCustomer(customerData);
    console.log('Selected customer:', customerData);
  };

  const handleFeatureSelect = (features) => {
    console.log('Selected features:', features);
  };

  const dashboardStyle = {
    padding: '24px',
    backgroundColor: '#0a1224',
    minHeight: '100vh',
    color: '#f7f9fb'
  };

  const headerStyle = {
    marginBottom: '32px',
    textAlign: 'center'
  };

  const titleStyle = {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#f7f9fb',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #00e0ff, #e930ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const subtitleStyle = {
    fontSize: '18px',
    color: '#5891cb',
    fontWeight: '400'
  };

  const contentStyle = {
    display: 'grid',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  };

  const rowStyle = {
    display: 'grid',
    gap: '24px'
  };

  const twoColumnStyle = {
    ...rowStyle,
    gridTemplateColumns: '1fr 1fr',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr'
    }
  };

  const errorStyle = {
    backgroundColor: '#e930ff20',
    border: '1px solid #e930ff',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0',
    color: '#f7f9fb',
    textAlign: 'center'
  };

  if (error) {
    return (
      <div style={dashboardStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Anomaly Detection</h1>
          <p style={subtitleStyle}>Advanced Customer Behavior Analysis</p>
        </div>
        <div style={errorStyle}>
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button
            onClick={fetchAnomalyData}
            style={{
              backgroundColor: '#00e0ff',
              color: '#0a1224',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              marginTop: '8px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={dashboardStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Anomaly Detection</h1>
        <p style={subtitleStyle}>Advanced Customer Behavior Analysis</p>
      </div>

      <div style={contentStyle}>
        {/* KPI Tiles Row */}
        <AnomalyKPITiles 
          kpis={dashboardData?.kpis}
          isLoading={isLoading}
        />

        {/* First Row: Severity Distribution & Feature Contribution */}
        <div style={twoColumnStyle}>
          <SeverityDistribution
            severityData={dashboardData?.severityDistribution || []}
            isLoading={isLoading}
            onSeverityClick={handleSeverityClick}
          />
          
          <FeatureContributionPlot
            anomalies={dashboardData?.anomalies || []}
            featureContributions={dashboardData?.featureContributions || []}
            isLoading={isLoading}
            onPointClick={handleCustomerSelect}
            onFeatureSelect={handleFeatureSelect}
          />
        </div>

        {/* Second Row: Anomaly Table */}
        <AnomalyTable
          anomalies={dashboardData?.anomalies || []}
          isLoading={isLoading}
          onCustomerClick={handleCustomerSelect}
          maxRows={15}
        />
        
        {/* Selected Customer Details */}
        {selectedCustomer && (
          <div style={{
            backgroundColor: '#232a36',
            borderRadius: '16px',
            padding: '16px',
            border: '2px solid #e930ff'
          }}>
            <h3 style={{
              color: '#f7f9fb',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔍 Selected Customer Details
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #5891cb',
                  borderRadius: '4px',
                  color: '#f7f9fb',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                Close
              </button>
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#5891cb' }}>Customer</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {selectedCustomer.customerName}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#5891cb' }}>Anomaly Score</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e930ff' }}>
                  {selectedCustomer.anomalyScore?.toFixed(3)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#5891cb' }}>Severity</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  Level {selectedCustomer.severity}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#5891cb' }}>Region</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {selectedCustomer.region}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info (for development) */}
        {process.env.NODE_ENV === 'development' && dashboardData && (
          <div style={{
            backgroundColor: '#232a36',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '12px',
            color: '#5891cb'
          }}>
            <h4>Debug Info</h4>
            <div>Anomalies: {dashboardData.anomalies?.length || 0}</div>
            <div>Severity Levels: {dashboardData.severityDistribution?.length || 0}</div>
            <div>Feature Contributions: {dashboardData.featureContributions?.length || 0}</div>
            <div>Filters: {JSON.stringify(filters, null, 2)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomalyDashboard; 