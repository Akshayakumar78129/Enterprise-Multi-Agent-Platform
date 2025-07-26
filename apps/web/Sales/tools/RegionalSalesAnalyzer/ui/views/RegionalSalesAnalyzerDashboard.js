import React, { useState, useEffect } from "react";
import RegionalKPITiles from "../components/kpi/RegionalKPITiles";
import RegionalPerformanceMap from "../components/visualizations/RegionalPerformanceMap";
import RegionalTimeSeriesExplorer from "../components/visualizations/RegionalTimeSeriesExplorer";

const RegionalSalesAnalyzerDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: {
      start: '2017-01-01',
      end: '2021-12-31'
    },
    aggregation: 'month'
  });
  const [selectedRegions, setSelectedRegions] = useState(['overall']);
  const [selectedMetric, setSelectedMetric] = useState('totalSales');

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/regional-sales-analyzer/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching regional sales data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRegionSelect = (country, state) => {
    const regionKey = `${country}-${state}`;
    setSelectedRegions(prev => {
      if (prev.includes(regionKey)) {
        return prev.filter(r => r !== regionKey);
      } else {
        // Remove 'overall' if adding specific regions
        const filtered = prev.filter(r => r !== 'overall');
        return [...filtered, regionKey];
      }
    });
  };

  const handleRegionToggle = (regionKey) => {
    setSelectedRegions(prev => {
      if (prev.includes(regionKey)) {
        return prev.filter(r => r !== regionKey);
      } else {
        return [...prev, regionKey];
      }
    });
  };

  const handleKPIClick = (kpiType) => {
    switch (kpiType) {
      case 'totalSales':
        setSelectedMetric('totalSales');
        break;
      case 'topRegion':
        if (data?.kpis?.topRegions?.length > 0) {
          const topRegion = data.kpis.topRegions[0];
          handleRegionSelect(topRegion.country, topRegion.state);
        }
        break;
      case 'opportunities':
        // Filter to show only growth opportunity regions
        if (data?.opportunityAnalysis) {
          const opportunities = data.opportunityAnalysis
            .filter(region => region.opportunityCategory === 'Growth Opportunity')
            .slice(0, 5)
            .map(region => `${region.country}-${region.state}`);
          setSelectedRegions(opportunities);
        }
        break;
      default:
        break;
    }
  };

  const handleTimeRangeChange = (range) => {
    handleFilterChange({ dateRange: range });
  };

  const handleAggregationChange = (aggregation) => {
    handleFilterChange({ aggregation });
  };

  if (error) {
    return (
      <div style={{
        padding: "24px",
        backgroundColor: "#0a1224",
        minHeight: "100vh",
        color: "#f7f9fb",
      }}>
        <div style={{
          backgroundColor: "#232a36",
          border: "1px solid #e930ff",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
        }}>
          <h2 style={{ color: "#e930ff", marginBottom: "16px" }}>
            Error Loading Regional Sales Data
          </h2>
          <p style={{ color: "#f7f9fb", marginBottom: "16px" }}>
            {error}
          </p>
          <button
            onClick={fetchData}
            style={{
              backgroundColor: "#00e0ff",
              color: "#0a1224",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
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
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ 
          marginBottom: "8px", 
          color: "#00e0ff",
          fontSize: "28px",
          fontWeight: "600"
        }}>
          Regional Sales Analyzer
        </h1>
        <p style={{ 
          color: "#5891cb", 
          fontSize: "16px",
          margin: 0
        }}>
          Comprehensive geospatial analytics and regional performance insights
        </p>
      </div>

      {/* Date Range and Filters */}
      <div style={{
        marginBottom: "24px",
        padding: "16px",
        backgroundColor: "#232a36",
        borderRadius: "8px",
        border: "1px solid #3a4459",
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", color: "#f7f9fb", fontWeight: "bold" }}>
            Start Date
          </label>
          <input
            type="date"
            value={filters.dateRange?.start || ''}
            onChange={(e) => handleFilterChange({
              dateRange: { ...filters.dateRange, start: e.target.value }
            })}
            style={{
              padding: "6px 8px",
              backgroundColor: "#0a1224",
              color: "#f7f9fb",
              border: "1px solid #3a4459",
              borderRadius: "4px",
              fontSize: "12px"
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", color: "#f7f9fb", fontWeight: "bold" }}>
            End Date
          </label>
          <input
            type="date"
            value={filters.dateRange?.end || ''}
            onChange={(e) => handleFilterChange({
              dateRange: { ...filters.dateRange, end: e.target.value }
            })}
            style={{
              padding: "6px 8px",
              backgroundColor: "#0a1224",
              color: "#f7f9fb",
              border: "1px solid #3a4459",
              borderRadius: "4px",
              fontSize: "12px"
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", color: "#f7f9fb", fontWeight: "bold" }}>
            Country Filter
          </label>
          <select
            value={filters.country || ''}
            onChange={(e) => handleFilterChange({ country: e.target.value || undefined })}
            style={{
              padding: "6px 8px",
              backgroundColor: "#0a1224",
              color: "#f7f9fb",
              border: "1px solid #3a4459",
              borderRadius: "4px",
              fontSize: "12px",
              minWidth: "120px"
            }}
          >
            <option value="">All Countries</option>
            {data?.availableRegions && 
              [...new Set(data.availableRegions.map(r => r.country))]
                .sort()
                .map(country => (
                  <option key={country} value={country}>{country}</option>
                ))
            }
          </select>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          style={{
            padding: "8px 16px",
            backgroundColor: isLoading ? "#3a4459" : "#00e0ff",
            color: isLoading ? "#f7f9fb" : "#0a1224",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "12px",
            fontWeight: "bold",
            marginTop: "auto"
          }}
        >
          {isLoading ? "Loading..." : "Refresh Data"}
        </button>

        {data?.metadata && (
          <div style={{
            marginLeft: "auto",
            fontSize: "12px",
            color: "#5891cb",
            textAlign: "right"
          }}>
            <div>{data.metadata.totalRegions} regions analyzed</div>
            <div>
              {data.metadata.dateRange.start} to {data.metadata.dateRange.end}
            </div>
          </div>
        )}
      </div>

      {/* KPI Section */}
      <RegionalKPITiles 
        kpis={data?.kpis} 
        isLoading={isLoading}
        onKPIClick={handleKPIClick}
      />

      {/* Main Visualizations Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        marginBottom: "24px"
      }}>
        {/* Regional Performance Map */}
        <div style={{ gridColumn: "1 / 3" }}>
          <RegionalPerformanceMap
            data={data?.regionalSalesData || []}
            countryData={data?.countryLevelData || []}
            selectedMetric={selectedMetric}
            selectedRegions={selectedRegions}
            onRegionSelect={handleRegionSelect}
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Time Series Section */}
      <div style={{ marginBottom: "24px" }}>
        <RegionalTimeSeriesExplorer
          data={data?.timeSeriesData}
          selectedRegions={selectedRegions}
          dateRange={filters.dateRange}
          aggregation={filters.aggregation}
          onTimeRangeChange={handleTimeRangeChange}
          onRegionToggle={handleRegionToggle}
          onAggregationChange={handleAggregationChange}
          isLoading={isLoading}
        />
      </div>

      {/* Additional Analysis Sections */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        marginBottom: "24px"
      }}>
        {/* Regional Comparison Table */}
        <div style={{
          backgroundColor: "#232a36",
          border: "1px solid #3a4459",
          borderRadius: "8px",
          padding: "20px"
        }}>
          <h3 style={{
            color: "#00e0ff",
            marginBottom: "16px",
            fontSize: "18px"
          }}>
            Regional Performance Comparison
          </h3>
          
          {data?.regionalSalesData ? (
            <div style={{
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid #3a4459",
              borderRadius: "4px"
            }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px"
              }}>
                <thead style={{
                  backgroundColor: "#0a1224",
                  position: "sticky",
                  top: 0,
                  zIndex: 1
                }}>
                  <tr>
                    <th style={{ padding: "8px", textAlign: "left", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                      Region
                    </th>
                    <th style={{ padding: "8px", textAlign: "right", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                      Sales
                    </th>
                    <th style={{ padding: "8px", textAlign: "right", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                      Customers
                    </th>
                    <th style={{ padding: "8px", textAlign: "right", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                      Avg Order
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.regionalSalesData.slice(0, 20).map((region, index) => (
                    <tr 
                      key={`${region.country}-${region.state}`}
                      style={{
                        backgroundColor: selectedRegions.includes(`${region.country}-${region.state}`) 
                          ? "#00e0ff20" 
                          : index % 2 === 0 ? "#232a36" : "#2c3341",
                        cursor: "pointer"
                      }}
                      onClick={() => handleRegionSelect(region.country, region.state)}
                    >
                      <td style={{ padding: "8px", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                        {region.state}, {region.country}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                        ${(region.totalSales / 1000).toFixed(0)}K
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                        {region.customerCount?.toLocaleString() || 0}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                        ${region.avgSalesAmount?.toFixed(0) || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              color: "#5891cb"
            }}>
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </div>

        {/* Opportunity Analysis */}
        <div style={{
          backgroundColor: "#232a36",
          border: "1px solid #3a4459",
          borderRadius: "8px",
          padding: "20px"
        }}>
          <h3 style={{
            color: "#00e0ff",
            marginBottom: "16px",
            fontSize: "18px"
          }}>
            Growth Opportunities
          </h3>
          
          {data?.opportunityAnalysis ? (
            <div style={{
              maxHeight: "400px",
              overflowY: "auto"
            }}>
              {data.opportunityAnalysis
                .filter(region => region.opportunityCategory === 'Growth Opportunity')
                .slice(0, 10)
                .map((region, index) => (
                  <div
                    key={`${region.country}-${region.state}`}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      backgroundColor: "#0a1224",
                      border: "1px solid #3a4459",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onClick={() => handleRegionSelect(region.country, region.state)}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px"
                    }}>
                      <div style={{
                        fontWeight: "bold",
                        color: "#f7f9fb",
                        fontSize: "14px"
                      }}>
                        {region.state}, {region.country}
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: "#5fd4d6",
                        backgroundColor: "#5fd4d620",
                        padding: "2px 6px",
                        borderRadius: "4px"
                      }}>
                        Growth Opportunity
                      </div>
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: "#5891cb",
                      display: "flex",
                      justifyContent: "space-between"
                    }}>
                      <span>Sales: ${(region.totalSales / 1000).toFixed(0)}K</span>
                      <span>Margin: {region.profitMargin?.toFixed(1) || 0}%</span>
                      <span>Customers: {region.customerCount?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                ))
              }
              
              {data.opportunityAnalysis.filter(r => r.opportunityCategory === 'Growth Opportunity').length === 0 && (
                <div style={{
                  textAlign: "center",
                  color: "#5891cb",
                  padding: "20px"
                }}>
                  No growth opportunities identified
                </div>
              )}
            </div>
          ) : (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              color: "#5891cb"
            }}>
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </div>
      </div>

      {/* Footer with data info */}
      {data?.metadata && (
        <div style={{
          marginTop: "40px",
          padding: "16px",
          backgroundColor: "#232a36",
          borderRadius: "8px",
          border: "1px solid #3a4459",
          fontSize: "12px",
          color: "#5891cb",
          textAlign: "center"
        }}>
          Regional Sales Analyzer • {data.metadata.totalRegions} regions • 
          {data.metadata.dateRange.start} to {data.metadata.dateRange.end} • 
          Last updated: {new Date().toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default RegionalSalesAnalyzerDashboard; 