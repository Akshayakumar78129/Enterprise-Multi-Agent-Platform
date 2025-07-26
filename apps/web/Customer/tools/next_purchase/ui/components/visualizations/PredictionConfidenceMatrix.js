import React, { useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";

const PredictionConfidenceMatrix = ({
  data = [],
  isLoading = false,
  onCellClick = null,
  highlightProduct = null,
  timeframe = "30days",
  onTimeframeChange = null,
}) => {
  const [selectedCell, setSelectedCell] = useState(null);

  if (!data || data.length === 0) {
    return (
      <Card title="Prediction Confidence Matrix" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            color: "#5891cb",
          }}
        >
          No prediction data available
        </div>
      </Card>
    );
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "#e930ff"; // Signal Magenta for very high
    if (confidence >= 0.6) return "#00e0ff"; // Electric Cyan for high
    if (confidence >= 0.4) return "#3e7b97"; // Blue-gray for medium
    return "#0a1224"; // Midnight Navy for low
  };

  const getConfidenceOpacity = (confidence) => {
    return Math.max(0.3, confidence); // Minimum 30% opacity
  };

  const handleCellClick = (segment, product, confidence) => {
    setSelectedCell({ segment, product, confidence });
    if (onCellClick) {
      onCellClick(segment, product);
    }
  };

  const timeframeOptions = [
    { value: "7days", label: "7 days" },
    { value: "30days", label: "30 days" },
    { value: "90days", label: "90 days" },
  ];

  // Get all unique products for the header
  const products = data[0]?.predictions?.map(p => p.product) || [];

  return (
    <Card
      title="Prediction Confidence Matrix"
      subtitle={`Confidence levels across segments (${timeframe})`}
      isLoading={isLoading}
    >
      <div style={{ padding: "16px" }}>
        {/* Timeframe Selector */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "8px" }}>
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onTimeframeChange && onTimeframeChange(option.value)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: timeframe === option.value ? "#00e0ff" : "#3a4459",
                color: timeframe === option.value ? "#0a1224" : "#f7f9fb",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: timeframe === option.value ? "600" : "400",
                transition: "all 0.2s ease",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Matrix Container */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "160px repeat(" + products.length + ", 80px)",
            gap: "4px",
            backgroundColor: "#232a36",
            padding: "16px",
            borderRadius: "8px",
            overflow: "auto",
          }}
        >
          {/* Header Row */}
          <div></div> {/* Empty corner */}
          {products.map((product) => (
            <div
              key={product}
              style={{
                fontSize: "12px",
                color: "#f7f9fb",
                fontWeight: "600",
                textAlign: "center",
                padding: "8px 4px",
                backgroundColor: highlightProduct === product ? "#00e0ff20" : "transparent",
                borderRadius: "4px",
                writingMode: "vertical-rl",
                textOrientation: "mixed",
              }}
            >
              {product}
            </div>
          ))}

          {/* Data Rows */}
          {data.map((row) => (
            <React.Fragment key={row.segment}>
              {/* Segment Label */}
              <div
                style={{
                  fontSize: "14px",
                  color: "#f7f9fb",
                  fontWeight: "600",
                  padding: "8px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {row.segment}
              </div>

              {/* Confidence Cells */}
              {row.predictions.map((prediction) => (
                <div
                  key={`${row.segment}-${prediction.product}`}
                  onClick={() => handleCellClick(row.segment, prediction.product, prediction.confidence)}
                  style={{
                    width: "64px",
                    height: "40px",
                    backgroundColor: getConfidenceColor(prediction.confidence),
                    opacity: getConfidenceOpacity(prediction.confidence),
                    border: selectedCell?.segment === row.segment && selectedCell?.product === prediction.product
                      ? "2px solid #00e0ff"
                      : "1px solid #3a4459",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    color: "#f7f9fb",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                    transform: selectedCell?.segment === row.segment && selectedCell?.product === prediction.product
                      ? "scale(1.05)"
                      : "scale(1)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = selectedCell?.segment === row.segment && selectedCell?.product === prediction.product
                      ? "scale(1.05)"
                      : "scale(1)";
                  }}
                  title={`${row.segment} → ${prediction.product}: ${(prediction.confidence * 100).toFixed(1)}% confidence (${prediction.count} predictions)`}
                >
                  {(prediction.confidence * 100).toFixed(0)}%
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* Confidence Scale Legend */}
        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "#f7f9fb", fontWeight: "600" }}>
            Confidence:
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "linear-gradient(to right, #0a1224, #3e7b97, #00e0ff, #e930ff)",
              width: "200px",
              height: "16px",
              borderRadius: "8px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "0px",
                fontSize: "10px",
                color: "#f7f9fb",
                top: "18px",
              }}
            >
              0%
            </div>
            <div
              style={{
                position: "absolute",
                right: "0px",
                fontSize: "10px",
                color: "#f7f9fb",
                top: "18px",
              }}
            >
              100%
            </div>
          </div>
        </div>

        {/* Selected Cell Details */}
        {selectedCell && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#3a4459",
              borderRadius: "8px",
              borderLeft: "4px solid #00e0ff",
            }}
          >
            <div style={{ fontSize: "14px", color: "#f7f9fb", fontWeight: "600" }}>
              {selectedCell.segment} → {selectedCell.product}
            </div>
            <div style={{ fontSize: "12px", color: "#b0c4d6", marginTop: "4px" }}>
              Confidence: {(selectedCell.confidence * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PredictionConfidenceMatrix; 