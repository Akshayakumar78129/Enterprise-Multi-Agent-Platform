import React, { useState, useEffect } from "react";
import HoldingCostKPITiles from "../components/kpi/HoldingCostKPITiles";
import CostBreakdownVisualization from "../components/visualizations/CostBreakdownVisualization";
import ExcessiveCostGrid from "../components/visualizations/ExcessiveCostGrid";
import CostTrendAnalyzer from "../components/visualizations/CostTrendAnalyzer";
import WarehouseCostComparison from "../components/visualizations/WarehouseCostComparison.jsx";
import { UniversalDashboardFilters, inventoryFilters } from "../../../../../ui-common/filters";
import { 
  HoldingCostAnalysisData, 
  FilterState, 
  DashboardState,
  APIResponse 
} from "../types";

const HoldingCostDashboard: React.FC = () => {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    data: null,
    isLoading: true,
    error: null,
    filters: {
      annualHoldingCostPercentage: 0.25,
      opportunityCostRate: 0.08,
      excessiveThreshold: 0.30
    },
    selectedView: 'dashboard',
    selectedItems: [],
    lastUpdated: null
  });

  const [costBreakdownView, setCostBreakdownView] = useState<'component' | 'category' | 'warehouse'>('component');
  const [excessiveGridSort, setExcessiveGridSort] = useState<'cost' | 'percentage' | 'savings' | 'value'>('cost');
  const [excessiveGridGroup, setExcessiveGridGroup] = useState<'category' | 'warehouse' | 'component'>('category');

  // Enterprise IQ color scheme
  const colors = {
    background: '#0a1224',    // Midnight Navy
    cardBackground: '#232a36', // Graphite
    text: '#f7f9fb',         // Cloud White
    accent: '#00e0ff',       // Electric Cyan
    secondary: '#e930ff',    // Signal Magenta
    border: '#3a4459'        // Light Graphite
  };

  useEffect(() => {
    fetchData();
  }, [dashboardState.filters]);

  const fetchData = async () => {
    setDashboardState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch("/api/inventory-holding-cost-analyzer/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dashboardState.filters),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.error || "API request failed");
      }

      setDashboardState(prev => ({
        ...prev,
        data: result.data,
        isLoading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      }));

    } catch (err) {
      console.error("Error fetching holding cost data:", err);
      setDashboardState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Unknown error occurred"
      }));
    }
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setDashboardState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  };

  const handleUniversalFilterChange = (filters: Record<string, any>) => {
    const newFilters: any = {};
    
    // Map universal filters to dashboard-specific filters
    if (filters.dateRange) {
      // Handle date range if needed
    }
    if (filters.warehouses?.length > 0) {
      // Handle warehouse selection
    }
    if (filters.stockStatus) {
      // Handle stock status
    }
    if (filters.holdingCostRange) {
      // Handle cost range
    }
    if (filters.turnoverRate) {
      // Handle turnover rate
    }
    if (filters.slowMoving !== undefined) {
      // Handle slow-moving filter
    }
    
    setDashboardState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleExportData = () => {
    if (!dashboardState.data) return;
    
    // Create CSV export
    const csvData = dashboardState.data.excessiveItems.map(item => ({
      'Item Number': item.Item_Number,
      'Item Name': item.Item_Name,
      'Category': item.Item_Category,
      'Warehouse': item.Warehouse_Name,
      'Inventory Value': item.Average_Inventory_Value,
      'Holding Cost': item.Total_Holding_Cost,
      'Holding Cost %': (item.Holding_Cost_Percentage * 100).toFixed(2) + '%',
      'Potential Savings': item.Potential_Savings,
      'Severity': item.Severity
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-holding-cost-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderHeader = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      padding: '0 4px'
    }}>
      <div>
        <h1 style={{ 
          color: colors.accent, 
          fontSize: '28px', 
          fontWeight: 'bold',
          margin: 0,
          marginBottom: '4px'
        }}>
          Inventory Holding Cost Analyzer
        </h1>
        <p style={{ 
          color: colors.text, 
          opacity: 0.7,
          margin: 0,
          fontSize: '14px'
        }}>
          Analyze and optimize inventory carrying costs across your organization
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {dashboardState.lastUpdated && (
          <span style={{ 
            color: colors.text, 
            fontSize: '12px',
            opacity: 0.7
          }}>
            Last updated: {new Date(dashboardState.lastUpdated).toLocaleTimeString()}
          </span>
        )}
        
        <button
          onClick={handleRefresh}
          disabled={dashboardState.isLoading}
          style={{
            backgroundColor: colors.accent,
            color: colors.background,
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: dashboardState.isLoading ? 'not-allowed' : 'pointer',
            opacity: dashboardState.isLoading ? 0.6 : 1
          }}
        >
          {dashboardState.isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
        
        <button
          onClick={handleExportData}
          disabled={!dashboardState.data || dashboardState.isLoading}
          style={{
            backgroundColor: colors.secondary,
            color: colors.background,
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: !dashboardState.data || dashboardState.isLoading ? 'not-allowed' : 'pointer',
            opacity: !dashboardState.data || dashboardState.isLoading ? 0.6 : 1
          }}
        >
          Export Data
        </button>
      </div>
    </div>
  );

  const renderFilterPanel = () => (
    <div style={{
      backgroundColor: colors.cardBackground,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      border: `1px solid ${colors.border}`
    }}>
      <h3 style={{ 
        color: colors.text, 
        fontSize: '16px', 
        fontWeight: 'bold',
        marginBottom: '12px'
      }}>
        Analysis Parameters
      </h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px'
      }}>
        <div>
          <label style={{ 
            color: colors.text, 
            fontSize: '12px',
            display: 'block',
            marginBottom: '4px'
          }}>
            Annual Holding Cost Rate
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="0.15"
              max="0.35"
              step="0.01"
              value={dashboardState.filters.annualHoldingCostPercentage || 0.25}
              onChange={(e) => handleFiltersChange({ 
                annualHoldingCostPercentage: parseFloat(e.target.value) 
              })}
              style={{ flex: 1 }}
            />
            <span style={{ 
              color: colors.text, 
              fontSize: '12px',
              minWidth: '40px'
            }}>
              {Math.round((dashboardState.filters.annualHoldingCostPercentage || 0.25) * 100)}%
            </span>
          </div>
        </div>
        
        <div>
          <label style={{ 
            color: colors.text, 
            fontSize: '12px',
            display: 'block',
            marginBottom: '4px'
          }}>
            Opportunity Cost Rate
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="0.05"
              max="0.15"
              step="0.01"
              value={dashboardState.filters.opportunityCostRate || 0.08}
              onChange={(e) => handleFiltersChange({ 
                opportunityCostRate: parseFloat(e.target.value) 
              })}
              style={{ flex: 1 }}
            />
            <span style={{ 
              color: colors.text, 
              fontSize: '12px',
              minWidth: '40px'
            }}>
              {Math.round((dashboardState.filters.opportunityCostRate || 0.08) * 100)}%
            </span>
          </div>
        </div>
        
        <div>
          <label style={{ 
            color: colors.text, 
            fontSize: '12px',
            display: 'block',
            marginBottom: '4px'
          }}>
            Excessive Cost Threshold
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="0.25"
              max="0.40"
              step="0.01"
              value={dashboardState.filters.excessiveThreshold || 0.30}
              onChange={(e) => handleFiltersChange({ 
                excessiveThreshold: parseFloat(e.target.value) 
              })}
              style={{ flex: 1 }}
            />
            <span style={{ 
              color: colors.text, 
              fontSize: '12px',
              minWidth: '40px'
            }}>
              {Math.round((dashboardState.filters.excessiveThreshold || 0.30) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSummaryInsights = () => {
    if (!dashboardState.data) return null;

    const { recommendations, summary } = dashboardState.data;

    return (
      <div style={{
        backgroundColor: colors.cardBackground,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        border: `1px solid ${colors.border}`
      }}>
        <h3 style={{ 
          color: colors.text, 
          fontSize: '16px', 
          fontWeight: 'bold',
          marginBottom: '12px'
        }}>
          Key Insights & Recommendations
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px'
        }}>
          <div>
            <h4 style={{ 
              color: colors.accent, 
              fontSize: '14px', 
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Priority: {recommendations.priority.toUpperCase()}
            </h4>
            <p style={{ 
              color: colors.text, 
              fontSize: '12px',
              opacity: 0.8,
              lineHeight: '1.4'
            }}>
              {summary.highImpactOpportunities} high-impact opportunities identified 
              across {summary.categoriesAnalyzed} categories and {summary.warehousesAnalyzed} warehouses.
            </p>
          </div>
          
          <div>
            <h4 style={{ 
              color: colors.secondary, 
              fontSize: '14px', 
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Immediate Actions
            </h4>
            <ul style={{ 
              color: colors.text, 
              fontSize: '12px',
              opacity: 0.8,
              lineHeight: '1.4',
              paddingLeft: '16px',
              margin: 0
            }}>
              {recommendations.immediate.slice(0, 2).map((action, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {action.action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (dashboardState.error) {
    return (
      <div style={{
        padding: '24px',
        backgroundColor: colors.background,
        minHeight: '100vh',
        color: colors.text
      }}>
        <div style={{ 
          color: colors.secondary, 
          padding: '20px',
          textAlign: 'center',
          backgroundColor: colors.cardBackground,
          borderRadius: '8px',
          border: `1px solid ${colors.secondary}`
        }}>
          <h2 style={{ marginBottom: '12px' }}>Error Loading Dashboard</h2>
          <p style={{ marginBottom: '16px' }}>{dashboardState.error}</p>
          <button
            onClick={handleRefresh}
            style={{
              backgroundColor: colors.accent,
              color: colors.background,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
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
    <div
      style={{
        padding: '24px',
        backgroundColor: colors.background,
        minHeight: '100vh',
        color: colors.text
      }}
    >
      {renderHeader()}
      
      {/* Universal Filters */}
      <UniversalDashboardFilters
        filters={inventoryFilters}
        onFilterChange={handleUniversalFilterChange}
        onReset={() => setDashboardState(prev => ({
          ...prev,
          filters: {
            annualHoldingCostPercentage: 0.25,
            opportunityCostRate: 0.08,
            excessiveThreshold: 0.30
          }
        }))}
        title="Inventory Analysis Filters"
      />
      
      {renderFilterPanel()}
      {renderSummaryInsights()}
      
      {/* KPI Section */}
      <HoldingCostKPITiles 
        kpis={dashboardState.data?.kpis || null}
        isLoading={dashboardState.isLoading}
        error={dashboardState.error}
      />

      {/* Main Visualizations Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "24px"
        }}
      >
        <CostBreakdownVisualization
          data={dashboardState.data?.costBreakdown || null}
          isLoading={dashboardState.isLoading}
          viewType={costBreakdownView}
          onViewTypeChange={(viewType) => setCostBreakdownView(viewType as 'component' | 'category' | 'warehouse')}
          width={600}
          height={480}
        />
        
        <ExcessiveCostGrid
          data={dashboardState.data?.excessiveItems || []}
          isLoading={dashboardState.isLoading}
          threshold={dashboardState.filters.excessiveThreshold || 0.30}
          onThresholdChange={(threshold) => handleFiltersChange({ excessiveThreshold: threshold })}
          sortBy={excessiveGridSort}
          onSortChange={(sortBy) => setExcessiveGridSort(sortBy as 'cost' | 'percentage' | 'savings' | 'value')}
          groupBy={excessiveGridGroup}
          onGroupByChange={(groupBy) => setExcessiveGridGroup(groupBy as 'category' | 'warehouse' | 'component')}
          width={600}
          height={480}
        />
      </div>

      {/* Secondary Visualizations Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "24px"
        }}
      >
        <CostTrendAnalyzer
          data={dashboardState.data?.trendData?.map(item => ({
            date: item.Snapshot_Date,
            total_cost: item.Estimated_Holding_Cost,
            cost_percentage: item.Holding_Cost_Percentage,
            capital_cost: item.Estimated_Holding_Cost * 0.4, // Approximate breakdown
            storage_cost: item.Estimated_Holding_Cost * 0.2,
            risk_cost: item.Estimated_Holding_Cost * 0.2,
            opportunity_cost: item.Estimated_Holding_Cost * 0.2
          })) || []}
          isLoading={dashboardState.isLoading}
          width={600}
          height={400}
        />
        
        <WarehouseCostComparison
          data={dashboardState.data?.costBreakdown ? 
            Object.entries(dashboardState.data.costBreakdown.byWarehouse).map(([warehouseId, warehouse]) => ({
              warehouse_id: warehouseId,
              warehouse_name: warehouse.warehouseName,
              warehouse_type: warehouse.warehouseType,
              total_cost: warehouse.totalCost,
              cost_percentage: warehouse.totalCost / warehouse.totalValue,
              capital_cost: warehouse.components.capital,
              storage_cost: warehouse.components.storage,
              risk_cost: warehouse.components.risk,
              opportunity_cost: warehouse.components.opportunity,
              item_count: warehouse.itemCount,
              cost_per_item: warehouse.totalCost / warehouse.itemCount,
              inventory_value: warehouse.totalValue
            })) : []
          }
          isLoading={dashboardState.isLoading}
          width={600}
          height={400}
          onWarehouseSelect={(warehouse) => {
            console.log('Selected warehouse:', warehouse);
          }}
          onSortChange={(sortBy) => {
            console.log('Sort changed:', sortBy);
          }}
        />
      </div>

      {/* Status footer */}
      <div style={{
        textAlign: 'center',
        padding: '16px',
        borderTop: `1px solid ${colors.border}`,
        color: colors.text,
        opacity: 0.6,
        fontSize: '12px'
      }}>
        Enterprise IQ • Inventory Holding Cost Analyzer • 
        {dashboardState.data && ` ${dashboardState.data.summary.totalItems} items analyzed`}
      </div>
    </div>
  );
};

export default HoldingCostDashboard; 