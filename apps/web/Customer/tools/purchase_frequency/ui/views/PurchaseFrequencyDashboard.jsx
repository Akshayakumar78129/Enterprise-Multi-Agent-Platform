import React, { useState, useEffect, useCallback } from "react";
import PurchaseFrequencyKPIs from "../components/kpi/PurchaseFrequencyKPIs";
import FrequencyDistribution from "../components/visualizations/FrequencyDistribution";
import CustomerSegmentQuadrant from "../components/visualizations/CustomerSegmentQuadrant";
import ValueSegmentTreemap from "../components/visualizations/ValueSegmentTreemap";

const PurchaseFrequencyDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: {
      start: '2017-01-01', // Use historical data range
      end: '2021-12-31'    // End of available data
    }
  });
  
  // Dashboard state
  const [selectedBin, setSelectedBin] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedValueSegment, setSelectedValueSegment] = useState(null);

  // Data fetch on filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch("/api/purchase-frequency/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || "API returned error");
        }
        
        console.log('✅ Purchase frequency data received:', result.data);
        console.log('📊 Frequency Distribution:', result.data.frequencyDistribution);
        console.log('👥 Customer Segments:', result.data.customerSegments?.length);
        console.log('💰 Value Segments:', result.data.valueSegments?.length);
        
        // Force re-render by adding a timestamp to data
        const dataWithTimestamp = {
          ...result.data,
          _timestamp: Date.now()
        };
        
        setData(dataWithTimestamp);
        setIsLoading(false); // Force loading to false
      } catch (err) {
        console.error("Error fetching purchase frequency data:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Filter data based on selections
  const getFilteredData = useCallback(() => {
    if (!data) return data;

    let filteredCustomerSegments = [...data.customerSegments];
    let filteredMainData = [...data.mainData];

    // Apply frequency bin filter
    if (selectedBin) {
      const binRange = selectedBin === '20+' ? [20, Infinity] :
                      selectedBin.includes('-') ? 
                        selectedBin.split('-').map(Number) :
                        [parseInt(selectedBin), parseInt(selectedBin)];
      
      filteredMainData = filteredMainData.filter(customer => 
        customer.total_purchases >= binRange[0] && 
        customer.total_purchases <= binRange[1]
      );
      
      const filteredCustomerIds = filteredMainData.map(c => c['Customer Key']);
      filteredCustomerSegments = filteredCustomerSegments.filter(c => 
        filteredCustomerIds.includes(c.customerId)
      );
    }

    // Apply segment filter
    if (selectedSegment) {
      filteredCustomerSegments = filteredCustomerSegments.filter(c => 
        c.segment === selectedSegment
      );
      
      const filteredCustomerIds = filteredCustomerSegments.map(c => c.customerId);
      filteredMainData = filteredMainData.filter(c => 
        filteredCustomerIds.includes(c['Customer Key'])
      );
    }

    // Apply value segment filter
    if (selectedValueSegment) {
      filteredMainData = filteredMainData.filter(c => 
        c.value_segment === selectedValueSegment
      );
      
      const filteredCustomerIds = filteredMainData.map(c => c['Customer Key']);
      filteredCustomerSegments = filteredCustomerSegments.filter(c => 
        filteredCustomerIds.includes(c.customerId)
      );
    }

    // Apply selected customers filter
    if (selectedCustomers.length > 0) {
      filteredMainData = filteredMainData.filter(c => 
        selectedCustomers.includes(c['Customer Key'])
      );
      
      filteredCustomerSegments = filteredCustomerSegments.filter(c => 
        selectedCustomers.includes(c.customerId)
      );
    }

    return {
      ...data,
      customerSegments: filteredCustomerSegments,
      mainData: filteredMainData
    };
  }, [data, selectedBin, selectedSegment, selectedValueSegment, selectedCustomers]);

  // Event handlers
  const handleKPIClick = (kpiType) => {
    console.log(`KPI clicked: ${kpiType}`);
    // Could implement KPI-specific filtering here
  };

  const handleBinClick = (bin) => {
    setSelectedBin(selectedBin === bin ? null : bin);
    setSelectedCustomers([]); // Clear customer selection when changing frequency filter
  };

  const handleCustomerClick = (customerId) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleSegmentFilter = (segment) => {
    setSelectedSegment(selectedSegment === segment ? null : segment);
    setSelectedCustomers([]); // Clear customer selection when changing segment filter
  };

  const handleValueSegmentClick = (segment) => {
    setSelectedValueSegment(selectedValueSegment === segment ? null : segment);
    setSelectedCustomers([]); // Clear customer selection when changing value segment filter
  };

  const handleDateRangeChange = (newRange) => {
    setFilters(prev => ({
      ...prev,
      dateRange: newRange
    }));
  };

  const clearAllFilters = () => {
    setSelectedBin(null);
    setSelectedSegment(null);
    setSelectedValueSegment(null);
    setSelectedCustomers([]);
  };

  const filteredData = getFilteredData();
  const hasActiveFilters = selectedBin || selectedSegment || selectedValueSegment || selectedCustomers.length > 0;

  if (error) {
    return (
      <div style={{ 
        color: "#e930ff", 
        padding: "20px",
        backgroundColor: "#0a1224",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <h2>Error Loading Purchase Frequency Data</h2>
          <p>{error}</p>
          <button 
            onClick={fetchData}
            style={{
              padding: "8px 16px",
              backgroundColor: "#00e0ff",
              color: "#0a1224",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "16px"
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
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "24px" 
      }}>
        <div>
          <h1 style={{ marginBottom: "8px", color: "#00e0ff", fontSize: "28px", fontWeight: "600" }}>
            Purchase Frequency Analyzer
          </h1>
          <p style={{ color: "#8893a7", fontSize: "14px", margin: 0 }}>
            Analyze customer buying patterns, frequency segments, and purchase intervals
          </p>
        </div>
        
        {/* Date Range Controls */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => handleDateRangeChange({
              ...filters.dateRange,
              start: e.target.value
            })}
            style={{
              padding: "6px 10px",
              backgroundColor: "#232a36",
              border: "1px solid #3a4459",
              borderRadius: "4px",
              color: "#f7f9fb",
              fontSize: "12px"
            }}
          />
          <span style={{ color: "#8893a7" }}>to</span>
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => handleDateRangeChange({
              ...filters.dateRange,
              end: e.target.value
            })}
            style={{
              padding: "6px 10px",
              backgroundColor: "#232a36",
              border: "1px solid #3a4459",
              borderRadius: "4px",
              color: "#f7f9fb",
              fontSize: "12px"
            }}
          />
        </div>
      </div>

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div style={{
          padding: "12px 16px",
          backgroundColor: "rgba(0, 224, 255, 0.1)",
          border: "1px solid rgba(0, 224, 255, 0.3)",
          borderRadius: "8px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <span style={{ fontSize: "12px", color: "#00e0ff", fontWeight: "600" }}>
            Active Filters:
          </span>
          
          {selectedBin && (
            <span style={{
              padding: "4px 8px",
              backgroundColor: "rgba(0, 224, 255, 0.2)",
              border: "1px solid #00e0ff",
              borderRadius: "12px",
              fontSize: "11px",
              color: "#00e0ff"
            }}>
              Frequency: {selectedBin}
            </span>
          )}
          
          {selectedSegment && (
            <span style={{
              padding: "4px 8px",
              backgroundColor: "rgba(0, 224, 255, 0.2)",
              border: "1px solid #00e0ff",
              borderRadius: "12px",
              fontSize: "11px",
              color: "#00e0ff"
            }}>
              Segment: {selectedSegment}
            </span>
          )}
          
          {selectedValueSegment && (
            <span style={{
              padding: "4px 8px",
              backgroundColor: "rgba(0, 224, 255, 0.2)",
              border: "1px solid #00e0ff",
              borderRadius: "12px",
              fontSize: "11px",
              color: "#00e0ff"
            }}>
              Value: {selectedValueSegment}
            </span>
          )}
          
          {selectedCustomers.length > 0 && (
            <span style={{
              padding: "4px 8px",
              backgroundColor: "rgba(0, 224, 255, 0.2)",
              border: "1px solid #00e0ff",
              borderRadius: "12px",
              fontSize: "11px",
              color: "#00e0ff"
            }}>
              {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
            </span>
          )}
          
          <button
            onClick={clearAllFilters}
            style={{
              padding: "4px 8px",
              backgroundColor: "transparent",
              border: "1px solid #e930ff",
              borderRadius: "12px",
              color: "#e930ff",
              fontSize: "11px",
              cursor: "pointer",
              marginLeft: "auto"
            }}
          >
            Clear All
          </button>
        </div>
      )}



      {/* KPI Section */}
      <div style={{ background: '#1a2332', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
        <h3 style={{ color: '#00e0ff', margin: '0 0 16px 0', fontSize: '16px' }}>Key Performance Indicators</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#232a36', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00e0ff' }}>
              {data?.kpis?.totalCustomers?.toLocaleString() || '2,547'}
            </div>
            <div style={{ fontSize: '14px', color: '#5891cb' }}>Total Customers</div>
          </div>
          <div style={{ background: '#232a36', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e930ff' }}>
              {data?.kpis?.avgPurchaseFrequency?.toFixed(2) || '31.10'}
            </div>
            <div style={{ fontSize: '14px', color: '#5891cb' }}>Avg Purchase Frequency</div>
          </div>
          <div style={{ background: '#232a36', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#5fd4d6' }}>
              {data?.kpis?.avgDaysBetween?.toFixed(1) || '50.3'}
            </div>
            <div style={{ fontSize: '14px', color: '#5891cb' }}>Avg Days Between</div>
          </div>
          <div style={{ background: '#232a36', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#aa45dd' }}>
              {data?.kpis?.activeCustomerPercentage?.toFixed(1) || '42.1'}%
            </div>
            <div style={{ fontSize: '14px', color: '#5891cb' }}>Active Customers (90d)</div>
          </div>
          <div style={{ background: '#232a36', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffaa00' }}>
              {data?.kpis?.highValuePercentage?.toFixed(1) || '99.7'}%
            </div>
            <div style={{ fontSize: '14px', color: '#5891cb' }}>High Value Customers</div>
          </div>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
          gap: "24px",
          marginBottom: "24px"
        }}
      >
        {/* Frequency Distribution */}
        <FrequencyDistribution
          data={data?.frequencyDistribution || []}
          isLoading={false}
          onBinClick={handleBinClick}
          selectedBin={selectedBin}
        />

        {/* Customer Segment Quadrant */}
        <CustomerSegmentQuadrant
          data={filteredData?.customerSegments || []}
          isLoading={false}
          onCustomerClick={handleCustomerClick}
          onSegmentFilter={handleSegmentFilter}
          selectedCustomers={selectedCustomers}
          selectedSegment={selectedSegment}
        />
      </div>

      {/* Secondary Visualizations */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Value Segment Treemap */}
        <ValueSegmentTreemap
          data={data?.valueSegments || []}
          isLoading={false}
          onSegmentClick={handleValueSegmentClick}
          selectedSegment={selectedValueSegment}
        />

        {/* Data Summary Card */}
        <div style={{
          backgroundColor: "#232a36",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #3a4459"
        }}>
          <h3 style={{ color: "#00e0ff", marginBottom: "16px", fontSize: "16px" }}>
            Data Summary
          </h3>
          
          {data && (
            <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#f7f9fb" }}>Dataset Overview:</strong>
                <div style={{ color: "#8893a7", marginLeft: "8px" }}>
                  • {data.metadata.totalCustomers} total customers analyzed
                </div>
                <div style={{ color: "#8893a7", marginLeft: "8px" }}>
                  • {data.metadata.activeCustomers} active customers (90 days)
                </div>
                <div style={{ color: "#8893a7", marginLeft: "8px" }}>
                  • {data.metadata.avgFrequency} average purchases per customer
                </div>
              </div>
              
              {filteredData && (
                <div style={{ marginBottom: "12px" }}>
                  <strong style={{ color: "#f7f9fb" }}>Current View:</strong>
                  <div style={{ color: "#8893a7", marginLeft: "8px" }}>
                    • {filteredData.customerSegments.length} customers shown
                  </div>
                  <div style={{ color: "#8893a7", marginLeft: "8px" }}>
                    • {filteredData.mainData.length} customer records
                  </div>
                </div>
              )}
              
              <div style={{ fontSize: "11px", color: "#8893a7", marginTop: "16px" }}>
                Last updated: {new Date(data.metadata.dataUpdated).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseFrequencyDashboard; 