import React, { useState, useEffect } from "react";
import InventoryKPITiles from "../components/kpi/InventoryKPITiles";
import InventoryHealthMatrix from "../components/visualizations/InventoryHealthMatrix";
import ItemLevelAnalyzer from "../components/visualizations/ItemLevelAnalyzer";

const InventoryLevelDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    warehouse_id: '',
    time_period: 'last_quarter',
    min_stock_threshold: 0.1
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/inventory-level-analyzer/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching inventory data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleHealthMatrixCellClick = (category, warehouse, cell) => {
    console.log("Health matrix cell clicked:", { category, warehouse, cell });
  };

  const handleItemSelection = (selectedItems) => {
    console.log("Items selected:", selectedItems);
  };

  if (error) {
    return (
      <div 
        style={{ 
          padding: "24px", 
          backgroundColor: "#0a1224", 
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div
          style={{
            backgroundColor: "#232a36",
            borderRadius: "16px",
            padding: "32px",
            textAlign: "center",
            border: "1px solid #e930ff"
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <div style={{ 
            color: "#e930ff", 
            fontSize: "18px", 
            fontWeight: "600",
            marginBottom: "8px"
          }}>
            Error Loading Dashboard
          </div>
          <div style={{ color: "#f7f9fb80", fontSize: "14px" }}>
            {error}
          </div>
          <button
            onClick={fetchData}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              backgroundColor: "#00e0ff",
              color: "#0a1224",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
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
        padding: "clamp(16px, 4vw, 24px)",
        backgroundColor: "#0a1224",
        minHeight: "100vh",
        color: "#f7f9fb",
        fontFamily: "Inter, sans-serif",
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box",
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ 
          margin: "0 0 8px 0", 
          fontSize: "28px", 
          fontWeight: "700", 
          color: "#00e0ff" 
        }}>
          Inventory Level Analyzer
        </h1>
        <p style={{ 
          margin: 0, 
          fontSize: "16px", 
          color: "#f7f9fb80" 
        }}>
          Monitor inventory levels, identify risks, and optimize stock management
        </p>
      </div>

      {/* Filters Bar */}
      <div
        className="filters-bar"
        style={{
          backgroundColor: "#232a36",
          borderRadius: "12px",
          padding: "clamp(12px, 3vw, 16px)",
          marginBottom: "24px",
          display: "flex",
          gap: "clamp(8px, 2vw, 16px)",
          alignItems: "center",
          flexWrap: "wrap",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        <div className="filter-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "14px", color: "#f7f9fb", minWidth: "80px" }}>
            Time Period:
          </label>
          <select
            value={filters.time_period}
            onChange={(e) => handleFilterChange({ time_period: e.target.value })}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #3a4459",
              backgroundColor: "#1e2738",
              color: "#f7f9fb",
              fontSize: "14px",
              outline: "none",
              cursor: "pointer",
              flex: "1"
            }}
          >
            <option value="last_quarter">Last Quarter</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="last_year">Last Year</option>
          </select>
        </div>

        <div className="filter-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "14px", color: "#f7f9fb", minWidth: "80px" }}>
            Category:
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange({ category: e.target.value })}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #3a4459",
              backgroundColor: "#1e2738",
              color: "#f7f9fb",
              fontSize: "14px",
              outline: "none",
              cursor: "pointer",
              flex: "1"
            }}
          >
            <option value="">All Categories</option>
            <option value="Widgets">Widgets</option>
            <option value="Gadgets">Gadgets</option>
            <option value="Tools">Tools</option>
          </select>
        </div>

        <div className="filter-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "14px", color: "#f7f9fb", minWidth: "120px" }}>
            Stock Threshold:
          </label>
          <input
            type="range"
            min="0.05"
            max="0.3"
            step="0.05"
            value={filters.min_stock_threshold}
            onChange={(e) => handleFilterChange({ min_stock_threshold: parseFloat(e.target.value) })}
            style={{
              width: "100px",
              cursor: "pointer",
              flex: "1"
            }}
          />
          <span style={{ fontSize: "14px", color: "#00e0ff", minWidth: "40px" }}>
            {(filters.min_stock_threshold * 100).toFixed(0)}%
          </span>
        </div>

        <button
          onClick={fetchData}
          style={{
            padding: "8px 16px",
            backgroundColor: "#00e0ff",
            color: "#0a1224",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            marginLeft: "auto"
          }}
        >
          Refresh Data
        </button>
      </div>

      {/* KPI Tiles */}
      <InventoryKPITiles 
        kpis={data?.kpis} 
        isLoading={isLoading} 
      />

      {/* Responsive Visualizations Grid */}
      <div
        className="dashboard-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "24px",
          marginBottom: "24px",
          width: "100%"
        }}
      >
        {/* Inventory Health Matrix - spans full width when details panel is active */}
        <div style={{ 
          gridColumn: "1 / -1",
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden"
        }}>
          <InventoryHealthMatrix
            data={data?.visualizations?.healthMatrix || {}}
            isLoading={isLoading}
            onCellClick={handleHealthMatrixCellClick}
            threshold={filters.min_stock_threshold}
            onThresholdChange={(threshold) => handleFilterChange({ min_stock_threshold: threshold })}
          />
        </div>

        {/* Stockout Risk Radar */}
        <div
          style={{
            width: "100%",
            height: "480px",
            backgroundColor: "#232a36",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#f7f9fb",
            border: "2px dashed #3a4459",
            minWidth: "0"
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</div>
          <div style={{ fontSize: "18px", marginBottom: "8px", fontWeight: "600" }}>
            Stockout Risk Radar
          </div>
          <div style={{ fontSize: "14px", color: "#f7f9fb80", textAlign: "center" }}>
            Risk visualization component<br />will be implemented here
          </div>
        </div>

        {/* Inventory Distribution Map */}
        <div
          style={{
            width: "100%",
            height: "480px",
            backgroundColor: "#232a36",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#f7f9fb",
            border: "2px dashed #3a4459",
            minWidth: "0"
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗺️</div>
          <div style={{ fontSize: "18px", marginBottom: "8px", fontWeight: "600" }}>
            Inventory Distribution Map
          </div>
          <div style={{ fontSize: "14px", color: "#f7f9fb80", textAlign: "center" }}>
            Warehouse distribution visualization<br />will be implemented here
          </div>
        </div>

        {/* Inventory Trend Analyzer */}
        <div
          style={{
            width: "100%",
            height: "400px",
            backgroundColor: "#232a36",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#f7f9fb",
            border: "2px dashed #3a4459",
            minWidth: "0"
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📈</div>
          <div style={{ fontSize: "18px", marginBottom: "8px", fontWeight: "600" }}>
            Inventory Trend Analyzer
          </div>
          <div style={{ fontSize: "14px", color: "#f7f9fb80", textAlign: "center" }}>
            Temporal trend visualization<br />will be implemented here
          </div>
        </div>
      </div>

      {/* Item Level Analyzer - Full Width */}
      <div style={{ 
        marginBottom: "24px",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden"
      }}>
        <ItemLevelAnalyzer
          data={data?.visualizations?.itemAnalyzer || []}
          isLoading={isLoading}
          onItemSelect={handleItemSelection}
          onSort={(column, direction) => console.log("Sort:", column, direction)}
          onFilter={(filterState) => console.log("Filter:", filterState)}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          padding: "16px",
          color: "#f7f9fb60",
          fontSize: "12px"
        }}
      >
        Last updated: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "Loading..."}
      </div>

      {/* Responsive CSS */}
      <style jsx>{`
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .filters-bar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .filter-item {
            justify-content: space-between !important;
            width: 100% !important;
          }
        }
        
        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)) !important;
          }
        }
        
        @media (min-width: 1800px) {
          .dashboard-grid {
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InventoryLevelDashboard; 