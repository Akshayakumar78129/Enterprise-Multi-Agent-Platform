import React, { useState, useEffect, useCallback } from "react";
import LTVKPITiles from "../components/kpi/LTVKPITiles";
import LTVDistribution from "../components/visualizations/LTVDistribution";
import PredictionAccuracy from "../components/visualizations/PredictionAccuracy";
import GeographicValueMap from "../components/visualizations/GeographicValueMap";
import CustomerValueExplorer from "../components/visualizations/CustomerValueExplorer";
import ValueContributionAnalysis from "../components/visualizations/ValueContributionAnalysis";
import LTVTimeProjection from "../components/visualizations/LTVTimeProjection";
import FilterPanel from "../components/controls/FilterPanel";

const LTVDashboard = ({ 
  initialFilters = {},
  onDataChange = null,
  autoRefresh = false,
  refreshInterval = 300000 // 5 minutes
}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: null,
    region: [],
    customerType: [],
    valueRange: null,
    ...initialFilters
  });
  
  // UI state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [highlightedRange, setHighlightedRange] = useState(null);
  const [highlightedErrorCategory, setHighlightedErrorCategory] = useState(null);
  const [activeView, setActiveView] = useState('overview'); // overview, accuracy, geographic

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/customer-lifetime-value/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch data");
      }

      setData(result.data);
      
      if (onDataChange) {
        onDataChange(result.data);
      }
    } catch (err) {
      console.error("Error fetching LTV data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, onDataChange]);

  // Initial data fetch and auto-refresh setup
  useEffect(() => {
    fetchData();
    
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  // Event handlers
  const handleKPITileClick = useCallback((metric) => {
    switch (metric) {
      case 'avg_ltv':
      case 'median_ltv':
        setActiveView('overview');
        setHighlightedRange(null);
        break;
      case 'prediction_accuracy':
        setActiveView('accuracy');
        break;
      case 'top_region':
        setActiveView('geographic');
        break;
      case 'premium_customers':
        setHighlightedRange('500K+');
        break;
      case 'model_confidence':
        setActiveView('accuracy');
        setHighlightedErrorCategory('Low');
        break;
      default:
        break;
    }
  }, []);

  const handleDistributionBinClick = useCallback((range) => {
    setHighlightedRange(range === highlightedRange ? null : range);
    // Could trigger filtering to show only customers in this range
  }, [highlightedRange]);

  const handlePredictionPointClick = useCallback((customer) => {
    setSelectedCustomer(customer);
    // Could open customer detail modal or highlight customer across all views
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (error) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "#0a1224",
          minHeight: "100vh",
          color: "#f7f9fb",
        }}
      >
        <div
          style={{
            backgroundColor: "#2c1810",
            border: "1px solid #e930ff",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ color: "#e930ff", marginBottom: "8px" }}>
            Error Loading Customer Lifetime Value Data
          </h2>
          <p style={{ color: "#f7f9fb", marginBottom: "16px" }}>{error}</p>
          <button
            onClick={fetchData}
            style={{
              backgroundColor: "#e930ff",
              color: "#f7f9fb",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "Inter",
            }}
          >
            Retry
          </button>
        </div>
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
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            color: "#00e0ff",
            fontSize: "28px",
            fontWeight: "600",
            marginBottom: "8px",
            fontFamily: "Inter",
          }}
        >
          Customer Lifetime Value Analytics
        </h1>
        <p
          style={{
            color: "#5891cb",
            fontSize: "16px",
            fontFamily: "Inter",
          }}
        >
          Predictive analytics and insights for customer value optimization
        </p>
      </div>

      {/* View Tabs */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: 'overview', label: 'LTV Overview', icon: '📊' },
            { id: 'accuracy', label: 'Model Accuracy', icon: '🎯' },
            { id: 'geographic', label: 'Geographic Analysis', icon: '🗺️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              style={{
                backgroundColor: activeView === tab.id ? "#00e0ff" : "transparent",
                color: activeView === tab.id ? "#0a1224" : "#f7f9fb",
                border: `1px solid ${activeView === tab.id ? "#00e0ff" : "#3a4459"}`,
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "Inter",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease"
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Tiles - Always visible */}
      <LTVKPITiles
        kpis={data?.kpis}
        isLoading={isLoading}
        onTileClick={handleKPITileClick}
      />

      {/* Main Content Area */}
      {activeView === 'overview' && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(600px, 1fr))",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          {/* LTV Distribution */}
          <LTVDistribution
            data={data?.ltvDistribution || []}
            isLoading={isLoading}
            onBinClick={handleDistributionBinClick}
            highlightedRange={highlightedRange}
            showPercentage={false}
          />

          {/* Customer Value Explorer placeholder */}
          <div
            style={{
              backgroundColor: "#232a36",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #3a4459",
            }}
          >
            <h3
              style={{
                color: "#f7f9fb",
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "16px",
                fontFamily: "Inter",
              }}
            >
              Top Value Customers
            </h3>
            {data?.customerExplorer && data.customerExplorer.length > 0 ? (
              <div style={{ color: "#f7f9fb" }}>
                {data.customerExplorer.slice(0, 8).map((customer, index) => (
                  <div
                    key={customer.customer_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: index < 7 ? "1px solid #3a4459" : "none",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease"
                    }}
                    onClick={() => handlePredictionPointClick(customer)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(0, 224, 255, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "500" }}>
                        {customer.customer_name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#5891cb" }}>
                        {customer.region} • {customer.transaction_count} transactions
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#00e0ff" }}>
                        {formatCurrency(customer.calculated_ltv)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#5891cb" }}>
                        {customer.value_tier}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#5891cb", textAlign: "center", padding: "40px 0" }}>
                {isLoading ? "Loading customers..." : "No customer data available"}
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'accuracy' && (
        <div style={{ marginBottom: "24px" }}>
          <PredictionAccuracy
            data={data?.predictionAccuracy || []}
            isLoading={isLoading}
            onPointClick={handlePredictionPointClick}
            highlightErrorCategory={highlightedErrorCategory}
            showErrorBands={true}
          />
        </div>
      )}

      {activeView === 'geographic' && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          {/* Geographic Value Table/Map placeholder */}
          <div
            style={{
              backgroundColor: "#232a36",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #3a4459",
            }}
          >
            <h3
              style={{
                color: "#f7f9fb",
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "16px",
                fontFamily: "Inter",
              }}
            >
              Geographic Value Distribution
            </h3>
            {data?.geographicValue && data.geographicValue.length > 0 ? (
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {data.geographicValue.slice(0, 15).map((region, index) => (
                  <div
                    key={region.region}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: index < 14 ? "1px solid #3a4459" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "500", color: "#f7f9fb" }}>
                        {region.region}
                      </div>
                      <div style={{ fontSize: "12px", color: "#5891cb" }}>
                        {region.customer_count} customers • {region.total_transactions} transactions
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#00e0ff" }}>
                        {formatCurrency(region.avg_ltv)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#5891cb" }}>
                        Avg LTV
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#5891cb", textAlign: "center", padding: "40px 0" }}>
                {isLoading ? "Loading regional data..." : "No regional data available"}
              </div>
            )}
          </div>

          {/* Value Contribution */}
          <div
            style={{
              backgroundColor: "#232a36",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #3a4459",
            }}
          >
            <h3
              style={{
                color: "#f7f9fb",
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "16px",
                fontFamily: "Inter",
              }}
            >
              Top Value Contributors
            </h3>
            {data?.valueContribution && data.valueContribution.length > 0 ? (
              <div>
                {data.valueContribution.slice(0, 8).map((contributor, index) => (
                  <div
                    key={contributor.region}
                    style={{
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px"
                    }}>
                      <span style={{ fontSize: "12px", color: "#f7f9fb" }}>
                        {contributor.region}
                      </span>
                      <span style={{ fontSize: "12px", color: "#00e0ff" }}>
                        {contributor.value_percentage}%
                      </span>
                    </div>
                    <div style={{
                      width: "100%",
                      height: "6px",
                      backgroundColor: "#3a4459",
                      borderRadius: "3px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${contributor.value_percentage}%`,
                        height: "100%",
                        backgroundColor: index === 0 ? "#e930ff" : 
                                      index === 1 ? "#00e0ff" : "#5fd4d6",
                        borderRadius: "3px"
                      }} />
                    </div>
                    <div style={{ fontSize: "11px", color: "#5891cb", marginTop: "2px" }}>
                      {formatCurrency(contributor.region_ltv)} • {contributor.customer_count} customers
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#5891cb", textAlign: "center", padding: "40px 0" }}>
                {isLoading ? "Loading contribution data..." : "No contribution data available"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Summary Footer */}
      {data?.metadata && (
        <div
          style={{
            backgroundColor: "#232a36",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid #3a4459",
            marginTop: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "12px",
              color: "#5891cb",
            }}
          >
            <span>
              Data updated: {new Date(data.metadata.dataFetched).toLocaleString()}
            </span>
            <span>
              {data.metadata.totalCustomers} customers analyzed • 
              Model accuracy: {data.metadata.predictionAccuracyScore}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LTVDashboard; 