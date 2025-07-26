import React, { useState, useEffect } from "react";
import TransactionKPITiles from "../components/kpi/TransactionKPITiles";
import TemporalHeatmap from "../components/visualizations/TemporalHeatmap";
import DualAxisTimeSeries from "../components/visualizations/DualAxisTimeSeries";

const TransactionPatternsDashboard = ({ 
  initialFilters = null,
  onDataLoad = null,
  onError = null 
}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters || {
    dateRange: {
      start: '2017-01-01',
      end: '2021-12-31'
    }
  });

  // Fetch data from API
  const fetchData = async (currentFilters = filters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transaction-patterns/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentFilters),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setDashboardData(result.data);
      
      if (onDataLoad) {
        onDataLoad(result.data);
      }
    } catch (err) {
      console.error('Error fetching transaction patterns data:', err);
      setError(err.message);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    fetchData(newFilters);
  };

  // Handle KPI tile clicks
  const handleKPIClick = (kpiType) => {
    console.log(`KPI clicked: ${kpiType}`);
    // Could trigger specific views or filters based on KPI
  };

  // Handle heatmap cell clicks
  const handleHeatmapCellClick = (day, hour) => {
    console.log(`Heatmap cell clicked: ${day} at ${hour}:00`);
    // Could filter data to show transactions for specific day/hour
  };

  // Handle time series data point clicks
  const handleTimeSeriesClick = (dataPoint) => {
    console.log(`Time series point clicked:`, dataPoint);
    // Could show detailed view for specific date
  };

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          backgroundColor: "#232a36",
          color: "#f7f9fb",
          borderRadius: "8px",
          padding: "24px",
        }}
      >
        <div style={{ fontSize: "18px", marginBottom: "16px", color: "#e930ff" }}>
          ⚠️ Error Loading Dashboard
        </div>
        <div style={{ color: "#5891cb", textAlign: "center" }}>
          {error}
        </div>
        <button
          onClick={() => fetchData()}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            backgroundColor: "#00e0ff",
            color: "#0a1224",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#0a1224",
        minHeight: "100vh",
        color: "#f7f9fb",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "600",
            margin: "0 0 8px 0",
            color: "#f7f9fb",
          }}
        >
          Transaction Patterns Dashboard
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#5891cb",
            margin: "0",
          }}
        >
          Analyze transaction patterns, temporal trends, and anomalies across your business
        </p>
      </div>

      {/* KPI Tiles */}
      <TransactionKPITiles
        kpis={dashboardData?.kpis}
        isLoading={isLoading}
        onKPIClick={handleKPIClick}
      />

      {/* Main Visualizations Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Temporal Heatmap */}
        <div>
          <TemporalHeatmap
            data={dashboardData?.temporalHeatmap || []}
            isLoading={isLoading}
            width={600}
            height={400}
            onCellClick={handleHeatmapCellClick}
          />
        </div>

        {/* Time Series Chart */}
        <div>
          <DualAxisTimeSeries
            data={dashboardData?.timeSeriesData || []}
            isLoading={isLoading}
            width={600}
            height={400}
            onDataPointClick={handleTimeSeriesClick}
          />
        </div>
      </div>

      {/* Secondary Visualizations */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Payment Methods Placeholder */}
        <div
          style={{
            backgroundColor: "#232a36",
            borderRadius: "8px",
            padding: "24px",
            border: "1px solid #3a4a5c",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#f7f9fb" }}>
            Payment Methods
          </h3>
          <div style={{ color: "#5891cb" }}>
            {dashboardData?.paymentMethods?.length || 0} payment methods
          </div>
        </div>

        {/* Daily Volume Placeholder */}
        <div
          style={{
            backgroundColor: "#232a36",
            borderRadius: "8px",
            padding: "24px",
            border: "1px solid #3a4a5c",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#f7f9fb" }}>
            Daily Volume
          </h3>
          <div style={{ color: "#5891cb" }}>
            {dashboardData?.dailyVolume?.length || 0} days analyzed
          </div>
        </div>

        {/* Anomalies Placeholder */}
        <div
          style={{
            backgroundColor: "#232a36",
            borderRadius: "8px",
            padding: "24px",
            border: "1px solid #3a4a5c",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#f7f9fb" }}>
            Anomalies
          </h3>
          <div style={{ color: "#5891cb" }}>
            {dashboardData?.anomalies?.length || 0} anomalies detected
          </div>
        </div>
      </div>

      {/* Data Summary */}
      {dashboardData && (
        <div
          style={{
            backgroundColor: "#232a36",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid #3a4a5c",
            fontSize: "14px",
            color: "#5891cb",
          }}
        >
          <strong style={{ color: "#f7f9fb" }}>Data Summary:</strong>{" "}
          {dashboardData.transactions?.length || 0} transactions loaded •{" "}
          {dashboardData.temporalHeatmap?.length || 0} temporal data points •{" "}
          {dashboardData.timeSeriesData?.length || 0} time series points •{" "}
          {dashboardData.productAssociations?.length || 0} product associations
        </div>
      )}
    </div>
  );
};

export default TransactionPatternsDashboard; 