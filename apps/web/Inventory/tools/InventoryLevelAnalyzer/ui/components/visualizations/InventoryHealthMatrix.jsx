import React, { useState } from "react";

const InventoryHealthMatrix = ({ 
  data = {}, 
  isLoading = false, 
  onCellClick = null,
  threshold = 0.1,
  onThresholdChange = null 
}) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [viewMode, setViewMode] = useState('percentage'); // 'percentage' | 'daysSupply'

  const getStockLevelColor = (stockLevel, riskCount = 0) => {
    if (riskCount > 0 || stockLevel < 0.1) return '#e930ff'; // Critical - Signal Magenta
    if (stockLevel < 0.3) return '#d45d79'; // Low - Muted magenta
    if (stockLevel < 0.6) return '#ffc145'; // Moderate - Amber
    if (stockLevel < 1.2) return '#5fd4d6'; // Adequate - Lighter cyan
    return '#00e0ff'; // Excess - Electric Cyan
  };

  const formatValue = (cell, mode) => {
    if (!cell) return 'N/A';
    
    switch (mode) {
      case 'percentage':
        return `${(cell.avgStockLevel * 100).toFixed(0)}%`;
      case 'daysSupply':
        return `${cell.avgDaysSupply.toFixed(0)}d`;
      default:
        return `${(cell.avgStockLevel * 100).toFixed(0)}%`;
    }
  };

  const handleCellClick = (category, warehouse, cell) => {
    setSelectedCell({ category, warehouse, cell });
    if (onCellClick) {
      onCellClick(category, warehouse, cell);
    }
  };

  const categories = Object.keys(data);
  const warehouses = categories.length > 0 
    ? [...new Set(categories.flatMap(cat => Object.keys(data[cat])))]
    : [];

  if (isLoading) {
    return (
      <div
        style={{
          width: "100%",
          minWidth: "400px",
          height: "480px",
          backgroundColor: "#232a36",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #00e0ff30",
            borderTop: "3px solid #00e0ff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          minWidth: "400px",
          height: "480px",
          backgroundColor: "#232a36",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#f7f9fb",
          fontFamily: "Inter, sans-serif"
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
        <div style={{ fontSize: "18px", marginBottom: "8px" }}>No Data Available</div>
        <div style={{ fontSize: "14px", color: "#f7f9fb80" }}>
          Inventory health matrix will appear here when data is available
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        minWidth: "400px",
        height: "480px",
        backgroundColor: "#232a36",
        borderRadius: "16px",
        padding: "16px",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        zIndex: "0",
        maxZIndex: "0",
        isolation: "isolate"
      }}
    >
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "16px",
        flexShrink: 0
      }}>
        <div>
          <h3 style={{ 
            margin: 0, 
            fontSize: "18px", 
            fontWeight: "600", 
            color: "#f7f9fb" 
          }}>
            Inventory Health Matrix
          </h3>
          <p style={{ 
            margin: "4px 0 0 0", 
            fontSize: "14px", 
            color: "#f7f9fb80" 
          }}>
            Stock levels across categories and warehouses
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: viewMode === 'percentage' ? "#00e0ff" : "#3a4459",
              color: viewMode === 'percentage' ? "#0a1224" : "#f7f9fb",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onClick={() => setViewMode('percentage')}
          >
            Percentage
          </button>
          <button
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: viewMode === 'daysSupply' ? "#00e0ff" : "#3a4459",
              color: viewMode === 'daysSupply' ? "#0a1224" : "#f7f9fb",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onClick={() => setViewMode('daysSupply')}
          >
            Days Supply
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        display: "flex", 
        flex: 1, 
        gap: selectedCell ? "12px" : "0",
        minHeight: "0",
        overflow: "hidden"
      }}>
        {/* Matrix Container */}
        <div style={{ 
          display: "flex", 
          flex: selectedCell ? "1" : "1",
          minWidth: "300px",
          height: "100%"
        }}>
          {/* Category Labels */}
          <div style={{ 
            width: "100px", 
            minWidth: "80px",
            display: "flex", 
            flexDirection: "column",
            justifyContent: "space-around",
            paddingRight: "12px"
          }}>
            {categories.map(category => (
                              <div
                  key={category}
                  style={{
                    fontSize: "11px",
                    fontWeight: "500",
                    color: "#f7f9fb",
                    textAlign: "right",
                    padding: "6px 0",
                    wordBreak: "break-word",
                    lineHeight: "1.2"
                  }}
                >
                {category}
              </div>
            ))}
          </div>

          {/* Matrix Grid */}
          <div style={{ flex: 1 }}>
            {/* Warehouse Headers */}
            <div style={{ 
              display: "flex", 
              marginBottom: "8px",
              height: "50px",
              alignItems: "flex-end",
              position: "relative"
            }}>
              {warehouses.map(warehouse => (
                                                    <div
                    key={warehouse}
                    style={{
                      flex: 1,
                      height: "45px",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "visible"
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "500",
                        color: "#f7f9fb",
                        textAlign: "center",
                        padding: "0 2px",
                        transform: "rotate(-45deg)",
                        transformOrigin: "center",
                        whiteSpace: "nowrap",
                        overflow: "visible",
                        textOverflow: "ellipsis",
                        position: "absolute",
                        bottom: "0px",
                        left: "50%",
                        marginLeft: "-50px",
                        width: "100px",
                        zIndex: "0"
                      }}
                    >
                      {warehouse}
                    </span>
                  </div>
              ))}
            </div>

            {/* Matrix Cells */}
            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              height: "calc(100% - 58px)"
            }}>
              {categories.map(category => (
                                  <div
                    key={category}
                    style={{
                      display: "flex",
                      flex: 1,
                      gap: "2px",
                      marginBottom: "3px"
                    }}
                  >
                  {warehouses.map(warehouse => {
                    const cell = data[category]?.[warehouse];
                    const isSelected = selectedCell?.category === category && 
                                     selectedCell?.warehouse === warehouse;
                    
                    return (
                      <div
                        key={warehouse}
                        style={{
                          flex: 1,
                          backgroundColor: cell 
                            ? getStockLevelColor(cell.avgStockLevel, cell.riskCount)
                            : "#1e2738",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: cell ? "pointer" : "default",
                          position: "relative",
                          border: isSelected ? "2px solid #f7f9fb" : "none",
                          transition: "all 0.2s ease"
                        }}
                        onClick={() => cell && handleCellClick(category, warehouse, cell)}
                        onMouseEnter={(e) => {
                          if (cell) {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.zIndex = "0";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.zIndex = "0";
                        }}
                      >
                                              <span
                        style={{
                          fontSize: "9px",
                          fontWeight: "600",
                          color: cell ? "#0a1224" : "#f7f9fb50",
                          textShadow: cell ? "0 1px 2px rgba(0,0,0,0.3)" : "none"
                        }}
                      >
                          {cell ? formatValue(cell, viewMode) : '-'}
                        </span>
                        
                        {/* Risk indicator */}
                        {cell && cell.riskCount > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              width: "6px",
                              height: "6px",
                              backgroundColor: "#e930ff",
                              borderRadius: "50%",
                              border: "1px solid #f7f9fb"
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Cell Detail Panel */}
        {selectedCell && (
          <div
            style={{
              width: "200px",
              maxWidth: "200px",
              flexShrink: 0,
              backgroundColor: "#1e2738",
              borderRadius: "8px",
              padding: "12px",
              border: "1px solid #3a4459",
              height: "100%",
              overflow: "auto",
              minWidth: "180px"
            }}
          >
            <h4 style={{ 
              margin: "0 0 10px 0", 
              fontSize: "13px", 
              fontWeight: "600", 
              color: "#f7f9fb" 
            }}>
              Selection Details
            </h4>
            
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#f7f9fb80", marginBottom: "1px" }}>
                Category
              </div>
              <div style={{ fontSize: "12px", fontWeight: "500", color: "#f7f9fb" }}>
                {selectedCell.category}
              </div>
            </div>
            
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#f7f9fb80", marginBottom: "1px" }}>
                Warehouse
              </div>
              <div style={{ fontSize: "12px", fontWeight: "500", color: "#f7f9fb" }}>
                {selectedCell.warehouse}
              </div>
            </div>
            
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#f7f9fb80", marginBottom: "1px" }}>
                Stock Level
              </div>
              <div style={{ fontSize: "12px", fontWeight: "500", color: "#f7f9fb" }}>
                {(selectedCell.cell.avgStockLevel * 100).toFixed(1)}%
              </div>
            </div>
            
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#f7f9fb80", marginBottom: "1px" }}>
                Days of Supply
              </div>
              <div style={{ fontSize: "12px", fontWeight: "500", color: "#f7f9fb" }}>
                {selectedCell.cell.avgDaysSupply.toFixed(1)} days
              </div>
            </div>
            
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#f7f9fb80", marginBottom: "1px" }}>
                Items Count
              </div>
              <div style={{ fontSize: "12px", fontWeight: "500", color: "#f7f9fb" }}>
                {selectedCell.cell.items.length}
              </div>
            </div>
            
            {selectedCell.cell.riskCount > 0 && (
              <div style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", color: "#f7f9fb80", marginBottom: "1px" }}>
                  At Risk Items
                </div>
                <div style={{ fontSize: "12px", fontWeight: "500", color: "#e930ff" }}>
                  {selectedCell.cell.riskCount}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginTop: "12px",
        flexShrink: 0
      }}>
        <span style={{ fontSize: "11px", color: "#f7f9fb80" }}>Stock Level:</span>
        {[
          { label: "Critical", color: "#e930ff" },
          { label: "Low", color: "#d45d79" },
          { label: "Moderate", color: "#ffc145" },
          { label: "Adequate", color: "#5fd4d6" },
          { label: "Excess", color: "#00e0ff" }
        ].map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: color,
                borderRadius: "2px"
              }}
            />
            <span style={{ fontSize: "10px", color: "#f7f9fb80" }}>{label}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default InventoryHealthMatrix; 