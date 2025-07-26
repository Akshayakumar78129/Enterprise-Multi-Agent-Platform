import React, { useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";

const CustomerPurchaseJourney = ({
  data = [],
  isLoading = false,
  selectedCustomer = null,
  onCustomerChange = null,
  onPurchaseClick = null,
  showPredictions = true,
}) => {
  const [hoveredPurchase, setHoveredPurchase] = useState(null);

  if (!data || data.length === 0) {
    return (
      <Card title="Customer Purchase Journey" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "320px",
            color: "#5891cb",
          }}
        >
          No customer timeline data available
        </div>
      </Card>
    );
  }

  const currentCustomer = selectedCustomer 
    ? data.find(d => d.customerId === selectedCustomer) 
    : data[0];

  if (!currentCustomer) {
    return (
      <Card title="Customer Purchase Journey" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "320px",
            color: "#5891cb",
          }}
        >
          Customer not found
        </div>
      </Card>
    );
  }

  const getProductIcon = (category) => {
    const icons = {
      'M': '👕', // Clothing/Merchandise
      'R': '🏃', // Running/Sports
      'default': '📦'
    };
    return icons[category?.[0]] || icons.default;
  };

  const getTimelinePosition = (index, total) => {
    return (index / Math.max(1, total - 1)) * 100;
  };

  // Generate mock future predictions
  const futurePredictions = showPredictions ? [
    {
      date: '2024-01-15',
      category: 'M-3003',
      amount: 1200,
      probability: 0.85,
      sequenceOrder: currentCustomer.purchases.length + 1,
      isPrediction: true
    },
    {
      date: '2024-02-20',
      category: 'R-4003',
      amount: 800,
      probability: 0.62,
      sequenceOrder: currentCustomer.purchases.length + 2,
      isPrediction: true
    }
  ] : [];

  const allItems = [...currentCustomer.purchases, ...futurePredictions];

  return (
    <Card
      title="Customer Purchase Journey"
      subtitle={`Customer ${currentCustomer.customerId} - ${currentCustomer.purchases.length} purchases`}
      isLoading={isLoading}
    >
      <div style={{ padding: "16px" }}>
        {/* Customer Selector */}
        <div style={{ marginBottom: "20px" }}>
          <select
            value={currentCustomer.customerId}
            onChange={(e) => onCustomerChange && onCustomerChange(parseInt(e.target.value))}
            style={{
              padding: "8px 12px",
              backgroundColor: "#3a4459",
              color: "#f7f9fb",
              border: "1px solid #5891cb",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {data.map((customer) => (
              <option key={customer.customerId} value={customer.customerId}>
                Customer {customer.customerId} ({customer.purchases.length} purchases)
              </option>
            ))}
          </select>
          
          <label style={{ marginLeft: "16px", color: "#f7f9fb", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={showPredictions}
              onChange={() => {}} // Would be controlled by parent
              style={{ marginRight: "8px" }}
            />
            Show Predictions
          </label>
        </div>

        {/* Timeline Container */}
        <div
          style={{
            position: "relative",
            height: "200px",
            backgroundColor: "#232a36",
            borderRadius: "8px",
            padding: "20px",
            overflow: "auto",
          }}
        >
          {/* Timeline Track */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "40px",
              right: "40px",
              height: "4px",
              backgroundColor: "#3a4459",
              borderRadius: "2px",
              transform: "translateY(-50%)",
            }}
          />

          {/* Current Date Marker */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${60 + (currentCustomer.purchases.length / allItems.length) * 70}%`,
              width: "2px",
              height: "80px",
              backgroundColor: "#00e0ff",
              transform: "translate(-50%, -50%)",
              zIndex: 2,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-30px",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "10px",
                color: "#00e0ff",
                fontWeight: "600",
                whiteSpace: "nowrap",
              }}
            >
              NOW
            </div>
          </div>

          {/* Purchase Nodes */}
          {allItems.map((item, index) => {
            const position = getTimelinePosition(index, allItems.length);
            const isPrediction = item.isPrediction;
            
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${Math.max(10, Math.min(90, 20 + position * 0.6))}%`,
                  transform: "translate(-50%, -50%)",
                  cursor: "pointer",
                  zIndex: 3,
                }}
                onClick={() => onPurchaseClick && onPurchaseClick(item)}
                onMouseEnter={() => setHoveredPurchase(item)}
                onMouseLeave={() => setHoveredPurchase(null)}
              >
                {/* Timeline Marker */}
                <div
                  style={{
                    width: isPrediction ? "16px" : "12px",
                    height: isPrediction ? "16px" : "12px",
                    borderRadius: "50%",
                    backgroundColor: isPrediction ? "transparent" : "#5fd4d6",
                    border: isPrediction ? "2px dashed #e930ff" : "2px solid #5fd4d6",
                    marginBottom: "8px",
                    margin: "0 auto 8px auto",
                    opacity: isPrediction ? item.probability : 1,
                  }}
                />

                {/* Purchase Node */}
                <div
                  style={{
                    width: "80px",
                    padding: "8px",
                    backgroundColor: isPrediction ? "#3a445950" : "#232a36",
                    border: isPrediction ? "1px dashed #e930ff" : "1px solid #3a4459",
                    borderRadius: "8px",
                    textAlign: "center",
                    opacity: isPrediction ? 0.8 : 1,
                    transform: hoveredPurchase === item ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                    {getProductIcon(item.category)}
                  </div>
                  <div style={{ fontSize: "10px", color: "#f7f9fb", fontWeight: "600" }}>
                    {item.category}
                  </div>
                  <div style={{ fontSize: "9px", color: "#b0c4d6" }}>
                    ${item.amount?.toLocaleString()}
                  </div>
                  {isPrediction && (
                    <div style={{ fontSize: "8px", color: "#e930ff", marginTop: "2px" }}>
                      {Math.round(item.probability * 100)}%
                    </div>
                  )}
                </div>

                {/* Date Label */}
                <div
                  style={{
                    fontSize: "10px",
                    color: isPrediction ? "#e930ff" : "#b0c4d6",
                    textAlign: "center",
                    marginTop: "8px",
                    transform: "rotate(-45deg)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {new Date(item.date).toLocaleDateString()}
                </div>
              </div>
            );
          })}

          {/* Connection Lines */}
          {allItems.slice(0, -1).map((item, index) => {
            const startPos = getTimelinePosition(index, allItems.length);
            const endPos = getTimelinePosition(index + 1, allItems.length);
            const nextItem = allItems[index + 1];
            const isPredictionLine = nextItem.isPrediction;
            
            return (
              <div
                key={`line-${index}`}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${20 + startPos * 0.6}%`,
                  width: `${(endPos - startPos) * 0.6}%`,
                  height: "2px",
                  backgroundColor: isPredictionLine ? "#e930ff" : "#5fd4d6",
                  borderStyle: isPredictionLine ? "dashed" : "solid",
                  transform: "translateY(-50%)",
                  zIndex: 1,
                  opacity: isPredictionLine ? 0.6 : 1,
                }}
              />
            );
          })}
        </div>

        {/* Hovered Purchase Details */}
        {hoveredPurchase && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#3a4459",
              borderRadius: "8px",
              borderLeft: hoveredPurchase.isPrediction ? "4px solid #e930ff" : "4px solid #5fd4d6",
            }}
          >
            <div style={{ fontSize: "14px", color: "#f7f9fb", fontWeight: "600" }}>
              {hoveredPurchase.isPrediction ? "Predicted Purchase" : "Historical Purchase"}
            </div>
            <div style={{ fontSize: "12px", color: "#b0c4d6", marginTop: "4px" }}>
              Product: {hoveredPurchase.category} • 
              Amount: ${hoveredPurchase.amount?.toLocaleString()} • 
              Date: {new Date(hoveredPurchase.date).toLocaleDateString()}
              {hoveredPurchase.isPrediction && (
                <span> • Probability: {Math.round(hoveredPurchase.probability * 100)}%</span>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: "16px", display: "flex", gap: "24px", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#5fd4d6",
                borderRadius: "50%",
              }}
            />
            <span style={{ color: "#f7f9fb" }}>Historical Purchases</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                border: "2px dashed #e930ff",
                borderRadius: "50%",
              }}
            />
            <span style={{ color: "#f7f9fb" }}>Predicted Purchases</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CustomerPurchaseJourney; 