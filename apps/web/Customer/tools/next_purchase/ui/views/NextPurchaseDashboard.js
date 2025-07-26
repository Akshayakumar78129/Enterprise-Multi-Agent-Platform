import React, { useState, useEffect } from "react";
import NextPurchaseKPITiles from "../components/kpi/NextPurchaseKPITiles";
import PredictionConfidenceMatrix from "../components/visualizations/PredictionConfidenceMatrix";
import CustomerPurchaseJourney from "../components/visualizations/CustomerPurchaseJourney";
import ProductAffinityNetwork from "../components/visualizations/ProductAffinityNetwork";

const NextPurchaseDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    timeframe: "30days",
    confidenceThreshold: 0.5,
    selectedCustomer: null,
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/next-purchase/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeframeChange = (timeframe) => {
    setFilters(prev => ({ ...prev, timeframe }));
  };

  const handleCustomerChange = (customerId) => {
    setFilters(prev => ({ ...prev, selectedCustomer: customerId }));
  };

  const handleCellClick = (segment, product) => {
    console.log(`Selected: ${segment} → ${product}`);
    // Could filter other components based on selection
  };

  const handleNodeClick = (nodeId) => {
    console.log(`Selected product: ${nodeId}`);
    // Could highlight product across other components
  };

  if (error) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "#0a1224",
          minHeight: "100vh",
          color: "#f7f9fb",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "#232a36",
            borderRadius: "8px",
            border: "1px solid #e930ff",
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "16px", color: "#e930ff" }}>
            ⚠️ Error Loading Dashboard
          </div>
          <div style={{ fontSize: "16px", color: "#b0c4d6" }}>
            {error}
          </div>
          <button
            onClick={fetchData}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              backgroundColor: "#00e0ff",
              color: "#0a1224",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
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
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: "32px",
            fontWeight: "700",
            color: "#00e0ff",
            textShadow: "0 2px 4px rgba(0, 224, 255, 0.3)",
          }}
        >
          Next Purchase Predictor
        </h1>
        <p
          style={{
            margin: "0",
            fontSize: "16px",
            color: "#b0c4d6",
            fontWeight: "400",
          }}
        >
          AI-powered customer purchase prediction and recommendation system
        </p>
      </div>

      {/* KPI Tiles */}
      <NextPurchaseKPITiles kpis={data?.kpis} isLoading={isLoading} />

      {/* Main Visualizations Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Prediction Confidence Matrix */}
        <PredictionConfidenceMatrix
          data={data?.visualizationData?.confidenceMatrix}
          isLoading={isLoading}
          timeframe={filters.timeframe}
          onTimeframeChange={handleTimeframeChange}
          onCellClick={handleCellClick}
        />

        {/* Product Affinity Network */}
        <ProductAffinityNetwork
          data={data?.visualizationData?.affinityNetwork}
          isLoading={isLoading}
          onNodeClick={handleNodeClick}
          filterStrength={5}
        />
      </div>

      {/* Customer Journey Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        <CustomerPurchaseJourney
          data={data?.visualizationData?.customerTimeline}
          isLoading={isLoading}
          selectedCustomer={filters.selectedCustomer}
          onCustomerChange={handleCustomerChange}
          showPredictions={true}
        />
      </div>

      {/* Prediction Data Table */}
      <div
        style={{
          backgroundColor: "#232a36",
          borderRadius: "8px",
          padding: "24px",
          border: "1px solid #3a4459",
        }}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "20px",
            fontWeight: "600",
            color: "#00e0ff",
          }}
        >
          Top Predictions
        </h3>
        
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#5891cb" }}>
            Loading predictions...
          </div>
        ) : data?.predictionData?.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #3a4459" }}>
                  <th style={{ padding: "12px", textAlign: "left", color: "#f7f9fb", fontWeight: "600" }}>
                    Customer
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", color: "#f7f9fb", fontWeight: "600" }}>
                    Predicted Product
                  </th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#f7f9fb", fontWeight: "600" }}>
                    Probability
                  </th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#f7f9fb", fontWeight: "600" }}>
                    Days to Purchase
                  </th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#f7f9fb", fontWeight: "600" }}>
                    Total Purchases
                  </th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#f7f9fb", fontWeight: "600" }}>
                    Avg Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.predictionData.slice(0, 10).map((prediction, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: "1px solid #3a4459",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#3a445920";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={{ padding: "12px", color: "#f7f9fb" }}>
                      {prediction['Customer Key']}
                    </td>
                    <td style={{ padding: "12px", color: "#f7f9fb" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#00e0ff20",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {prediction.predicted_product}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <span
                        style={{
                          color: prediction.prediction_probability > 0.7 ? "#00e0ff" : 
                                 prediction.prediction_probability > 0.5 ? "#5fd4d6" : "#b0c4d6",
                          fontWeight: "600",
                        }}
                      >
                        {Math.round(prediction.prediction_probability * 100)}%
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#f7f9fb" }}>
                      {prediction.predicted_days_to_purchase} days
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#b0c4d6" }}>
                      {prediction.total_purchases}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#b0c4d6" }}>
                      ${Math.round(prediction.avg_amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#5891cb" }}>
            No prediction data available
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "32px",
          padding: "16px",
          textAlign: "center",
          fontSize: "12px",
          color: "#5891cb",
          borderTop: "1px solid #3a4459",
        }}
      >
        Next Purchase Predictor Dashboard • Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default NextPurchaseDashboard; 