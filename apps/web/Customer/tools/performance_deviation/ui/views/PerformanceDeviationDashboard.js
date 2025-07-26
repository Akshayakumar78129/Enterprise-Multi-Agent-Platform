import React, { useState, useEffect, useCallback } from "react";
import PerformanceKPITiles from "../components/kpi/PerformanceKPITiles";
import PerformanceExplorer from "../components/visualizations/PerformanceExplorer";
import FeatureImportanceVisualizer from "../components/visualizations/FeatureImportanceVisualizer";
import VarianceDecomposition from "../components/visualizations/VarianceDecomposition";
import DeviationPatternExplorer from "../components/visualizations/DeviationPatternExplorer";

const PerformanceDeviationDashboard = () => {
  // State management
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '2018-01-01',
    endDate: '2020-12-31',
    businessFunctions: ['sales', 'customer', 'finance'],
    significanceThreshold: 0.05
  });
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/performance-deviation/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        // Set default selected KPI if none selected
        if (!selectedKPI && result.data.visualizationData.performanceExplorer) {
          const availableKPIs = Object.keys(result.data.visualizationData.performanceExplorer);
          if (availableKPIs.length > 0) {
            setSelectedKPI(availableKPIs[0]);
          }
        }
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching performance deviation data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedKPI]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Event handlers
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleKPISelection = useCallback((kpis) => {
    if (Array.isArray(kpis) && kpis.length > 0) {
      setSelectedKPI(kpis[0]);
    } else if (typeof kpis === 'string') {
      setSelectedKPI(kpis);
    }
  }, []);

  const handleTimeRangeChange = useCallback((range) => {
    setSelectedTimeRange(range);
    if (range) {
      handleFiltersChange({
        startDate: range.start,
        endDate: range.end
      });
    }
  }, [handleFiltersChange]);

  const handleFeatureSelect = useCallback((feature) => {
    console.log('Selected feature:', feature);
    // Could trigger additional analysis or highlighting
  }, []);

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        backgroundColor: '#0a1224',
        color: '#f7f9fb',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <h2 style={{ color: '#e930ff', marginBottom: '16px' }}>
            Error Loading Performance Deviation Dashboard
          </h2>
          <p style={{ color: '#5891cb', marginBottom: '16px' }}>
            {error}
          </p>
          <button
            onClick={fetchData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#00e0ff',
              color: '#0a1224',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#0a1224',
      minHeight: '100vh',
      padding: '20px',
      color: '#f7f9fb'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        borderBottom: '2px solid #1a2038',
        paddingBottom: '16px'
      }}>
        <h1 style={{
          color: '#f7f9fb',
          fontSize: '28px',
          fontWeight: '700',
          margin: '0 0 8px 0'
        }}>
          Performance Deviation Analysis
        </h1>
        <p style={{
          color: '#5891cb',
          fontSize: '16px',
          margin: 0
        }}>
          ML-powered analysis of KPI performance variations and external factor influences
        </p>
      </div>

      {/* Dashboard Controls */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: '#1a2038',
        borderRadius: '8px'
      }}>
        {/* Date Range Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '500' }}>
            Date Range:
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFiltersChange({ startDate: e.target.value })}
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid #3a4459',
              backgroundColor: '#232a36',
              color: '#f7f9fb',
              fontSize: '12px'
            }}
          />
          <span style={{ color: '#5891cb' }}>to</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFiltersChange({ endDate: e.target.value })}
            style={{
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid #3a4459',
              backgroundColor: '#232a36',
              color: '#f7f9fb',
              fontSize: '12px'
            }}
          />
        </div>

        {/* Business Function Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '500' }}>
            Functions:
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['sales', 'customer', 'finance'].map(func => (
              <button
                key={func}
                onClick={() => {
                  const currentFunctions = filters.businessFunctions || [];
                  const newFunctions = currentFunctions.includes(func)
                    ? currentFunctions.filter(f => f !== func)
                    : [...currentFunctions, func];
                  handleFiltersChange({ businessFunctions: newFunctions });
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: filters.businessFunctions?.includes(func) ? '#00e0ff' : '#232a36',
                  color: filters.businessFunctions?.includes(func) ? '#0a1224' : '#f7f9fb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {func.charAt(0).toUpperCase() + func.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Significance Threshold */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '500' }}>
            Significance: {filters.significanceThreshold}
          </label>
          <input
            type="range"
            min="0.01"
            max="0.1"
            step="0.01"
            value={filters.significanceThreshold}
            onChange={(e) => handleFiltersChange({ significanceThreshold: Number(e.target.value) })}
            style={{
              width: '100px',
              accentColor: '#00e0ff'
            }}
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchData}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: isLoading ? '#3a4459' : '#00e0ff',
            color: isLoading ? '#5891cb' : '#0a1224',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* KPI Tiles */}
      <div style={{ marginBottom: '24px' }}>
        <PerformanceKPITiles
          kpis={data?.kpis || {}}
          isLoading={isLoading}
        />
      </div>

      {/* Main Visualizations Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Performance Explorer */}
        <div style={{ gridColumn: '1 / -1' }}>
          <PerformanceExplorer
            data={data?.visualizationData?.performanceExplorer || {}}
            selectedKPIs={selectedKPI ? [selectedKPI] : []}
            onKPISelect={handleKPISelection}
            dateRange={selectedTimeRange}
            onDateRangeChange={handleTimeRangeChange}
            isLoading={isLoading}
          />
        </div>

        {/* Feature Importance */}
        <FeatureImportanceVisualizer
          data={data?.visualizationData?.featureImportance || { aggregated: [], byKPI: {} }}
          selectedKPI={selectedKPI}
          onFeatureSelect={handleFeatureSelect}
          significanceThreshold={10} // 10% for visualization
          isLoading={isLoading}
        />

        {/* Variance Decomposition */}
        <VarianceDecomposition
          data={data?.visualizationData?.varianceDecomposition || {}}
          selectedKPI={selectedKPI}
          onKPISelect={handleKPISelection}
          showComparison={false}
          isLoading={isLoading}
        />
      </div>

      {/* Bottom Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px'
      }}>
        {/* Deviation Pattern Explorer */}
        <DeviationPatternExplorer
          data={data?.visualizationData?.deviationPatterns || { calendar: {}, monthlyStats: {}, patterns: [] }}
          selectedYear={selectedTimeRange ? new Date(selectedTimeRange.start).getFullYear() : 2020}
          onYearSelect={(year) => {
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            handleTimeRangeChange({ start: startDate, end: endDate });
          }}
          significanceThreshold={0.5}
          onThresholdChange={(threshold) => {
            console.log('Threshold changed:', threshold);
          }}
          isLoading={isLoading}
        />
      </div>

      {/* Data Summary Footer */}
      {data && (
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#1a2038',
          borderRadius: '8px',
          borderTop: '3px solid #00e0ff'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ color: '#00e0ff', fontSize: '20px', fontWeight: '700' }}>
                {data.metadata?.totalDataPoints || 0}
              </div>
              <div style={{ color: '#5891cb', fontSize: '12px' }}>Total Data Points</div>
            </div>
            <div>
              <div style={{ color: '#00e0ff', fontSize: '20px', fontWeight: '700' }}>
                {data.metadata?.businessFunctions?.length || 0}
              </div>
              <div style={{ color: '#5891cb', fontSize: '12px' }}>Business Functions</div>
            </div>
            <div>
              <div style={{ color: '#00e0ff', fontSize: '20px', fontWeight: '700' }}>
                {Object.keys(data.visualizationData?.performanceExplorer || {}).length}
              </div>
              <div style={{ color: '#5891cb', fontSize: '12px' }}>KPIs Analyzed</div>
            </div>
            <div>
              <div style={{ color: '#00e0ff', fontSize: '20px', fontWeight: '700' }}>
                {data.metadata?.lastUpdated ? new Date(data.metadata.lastUpdated).toLocaleDateString() : 'N/A'}
              </div>
              <div style={{ color: '#5891cb', fontSize: '12px' }}>Last Updated</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDeviationDashboard; 