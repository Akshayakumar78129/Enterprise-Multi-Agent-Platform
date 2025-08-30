import React, { useState, useMemo } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

// Import CSS Module for glass background
import styles from "../../styles/RegionalSalesAnalyzerDashboard.module.css";

// Dynamic import for charts to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const RegionalPerformanceMap = ({
  data = [],
  countryData = [],
  selectedMetric = 'totalSales',
  selectedRegions = [],
  onMetricChange = null,
  onRegionSelect = null,
  onRegionHover = null,
  onShowAIInsight = null,
  filters = {},
  onFilterChange = null,
  isLoading = false
}) => {
  const [viewMode, setViewMode] = useState('choropleth'); // 'choropleth', 'scatter', 'bubble'
  const [selectedCountry, setSelectedCountry] = useState(null);

  // Handle region click with AI insight support
  const handleRegionClick = (e, region) => {
    // Call the global addAIInsightToChat if available (for Shift+Click multi-selection)
    if (typeof window !== 'undefined' && window.addAIInsightToChat) {
      const metricValue = region[selectedMetric] || 0;
      const formattedValue = formatMetricValue(metricValue, selectedMetric);
      
      window.addAIInsightToChat({
        label: `${region.state}, ${region.country}`,
        value: formattedValue,
        chartType: 'Regional Map',
        metric: getMetricLabel(selectedMetric),
        originalEvent: e,
        metadata: {
          ...region,
          selectedMetric,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('📍 Region clicked for AI Insight:', {
        region: `${region.state}, ${region.country}`,
        metric: selectedMetric,
        value: formattedValue,
        shiftKey: e.shiftKey
      });
    }
    
    // Keep existing callbacks for compatibility
    if (onShowAIInsight) {
      const regionData = {
        ...region,
        selectedMetric,
        metricValue: region[selectedMetric],
        metricLabel: getMetricLabel(selectedMetric)
      };
      onShowAIInsight(e, 'region', `${region.country}-${region.state}`, regionData);
    } else if (onRegionSelect) {
      onRegionSelect(region.country, region.state);
    }
  };

  // Helper functions - defined before they're used
  const getMetricLabel = (metric) => {
    const labels = {
      totalSales: 'Total Sales',
      profitMargin: 'Profit Margin',
      customerCount: 'Customer Count',
      growthRate: 'Growth Rate',
      transactionCount: 'Transactions'
    };
    return labels[metric] || metric;
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value?.toFixed(2) || 0}`;
  };

  const formatMetricValue = (value, metric) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (metric) {
      case 'totalSales':
      case 'netSales':
      case 'grossProfit':
        return formatCurrency(value);
      case 'profitMargin':
      case 'growthRate':
        return `${value.toFixed(1)}%`;
      case 'customerCount':
      case 'transactionCount':
        return value.toLocaleString();
      default:
        return value.toLocaleString();
    }
  };

  // Prepare data for visualization
  const mapData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const metricValues = data.map(d => d[selectedMetric] || 0);
    const maxValue = Math.max(...metricValues);
    const minValue = Math.min(...metricValues);

    return data.map(region => ({
      ...region,
      normalizedValue: maxValue > minValue ? (region[selectedMetric] - minValue) / (maxValue - minValue) : 0,
      displayValue: region[selectedMetric] || 0,
      locationText: `${region.state}, ${region.country}`,
      hoverText: `${region.state}, ${region.country}<br/>
        ${getMetricLabel(selectedMetric)}: ${formatMetricValue(region[selectedMetric], selectedMetric)}<br/>
        Total Sales: ${formatCurrency(region.totalSales)}<br/>
        Customers: ${region.customerCount?.toLocaleString() || 0}<br/>
        Transactions: ${region.transactionCount?.toLocaleString() || 0}`
    }));
  }, [data, selectedMetric]);

  // Country-level data for overview
  const countryMapData = useMemo(() => {
    if (!countryData || countryData.length === 0) return [];

    const metricValues = countryData.map(d => d[selectedMetric] || 0);
    const maxValue = Math.max(...metricValues);
    const minValue = Math.min(...metricValues);

    return countryData.map(country => ({
      ...country,
      normalizedValue: maxValue > minValue ? (country[selectedMetric] - minValue) / (maxValue - minValue) : 0,
      displayValue: country[selectedMetric] || 0,
      hoverText: `${country.country}<br/>
        ${getMetricLabel(selectedMetric)}: ${formatMetricValue(country[selectedMetric], selectedMetric)}<br/>
        Total Sales: ${formatCurrency(country.totalSales)}<br/>
        States: ${country.stateCount || 0}<br/>
        Customers: ${country.customerCount?.toLocaleString() || 0}`
    }));
  }, [countryData, selectedMetric]);



  const getColorScale = () => {
    return [
      [0, '#0a1224'],      // Midnight Navy (low)
      [0.25, '#2c3e50'],   // Dark blue-gray
      [0.5, '#5fd4d6'],    // Light cyan
      [0.75, '#00e0ff'],   // Electric Cyan
      [1, '#e930ff']       // Signal Magenta (high)
    ];
  };

  const renderChoroplethMap = () => {
    // For demo purposes, we'll create a simplified representation
    // In a real implementation, you'd use proper geographic data with state/country boundaries
    return (
      <div 
        className={styles.glassBackground}
        style={{
          width: '100%',
          height: '500px',
          position: 'relative',
          overflow: 'hidden'
        }}>
        {/* Header with metric selector */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          zIndex: 10,
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {['totalSales', 'profitMargin', 'customerCount', 'transactionCount'].map(metric => (
            <button
              key={metric}
              onClick={() => onMetricChange && onMetricChange(metric)}
              style={{
                padding: '6px 12px',
                backgroundColor: selectedMetric === metric ? '#00e0ff' : '#232a36',
                color: selectedMetric === metric ? '#0a1224' : '#f7f9fb',
                border: 'none',
                borderRadius: '16px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {getMetricLabel(metric)}
            </button>
          ))}
        </div>

        {/* Simplified map representation using positioned elements */}
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '0',
          right: '0',
          bottom: '40px',
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '20px'
        }}>
          {mapData.slice(0, 20).map((region, index) => {
            const intensity = region.normalizedValue || 0;
            const baseColor = `rgba(${
              intensity > 0.7 ? '233, 48, 255' :  // Signal Magenta
              intensity > 0.4 ? '0, 224, 255' :   // Electric Cyan
              intensity > 0.2 ? '95, 212, 214' :  // Light cyan
              '58, 68, 89'                         // Graphite
            }, ${0.3 + intensity * 0.7})`;

            return (
              <div
                key={`${region.country}-${region.state}`}
                onClick={(e) => handleRegionClick(e, region)}
                onMouseEnter={() => onRegionHover && onRegionHover(region.country, region.state)}
                style={{
                  width: `${80 + intensity * 40}px`,
                  height: `${60 + intensity * 30}px`,
                  backgroundColor: baseColor,
                  border: selectedRegions.includes(`${region.country}-${region.state}`) 
                    ? '2px solid #00e0ff' 
                    : '1px solid #f7f9fb40',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                title={`${region.hoverText?.replace(/<br\/>/g, '\n')}\n\nClick for AI insight`}
              >
                <div style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#f7f9fb',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {region.state}
                </div>
                <div style={{
                  fontSize: '8px',
                  color: '#f7f9fb',
                  opacity: 0.8
                }}>
                  {formatMetricValue(region.displayValue, selectedMetric)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#f7f9fb'
        }}>
          <span>Low</span>
          <div style={{
            width: '100px',
            height: '12px',
            background: 'linear-gradient(to right, #232a36, #5fd4d6, #00e0ff, #e930ff)',
            borderRadius: '6px'
          }} />
          <span>High</span>
        </div>
      </div>
    );
  };

  const renderScatterMap = () => {
    if (!mapData || mapData.length === 0) return null;

    // Create latitude/longitude-like positions for demo
    const plotData = mapData.map((region, index) => ({
      ...region,
      // Simulate geographic distribution
      lat: 25 + (index % 10) * 5 + Math.random() * 3,
      lon: -125 + (Math.floor(index / 10)) * 15 + Math.random() * 10
    }));

    const trace = {
      type: 'scattergeo',
      mode: 'markers',
      lat: plotData.map(d => d.lat),
      lon: plotData.map(d => d.lon),
      text: plotData.map(d => d.hoverText),
      marker: {
        size: plotData.map(d => 8 + d.normalizedValue * 20),
        color: plotData.map(d => d.displayValue),
        colorscale: [
          [0, '#0a1224'],
          [0.25, '#2c3e50'],
          [0.5, '#5fd4d6'],
          [0.75, '#00e0ff'],
          [1, '#e930ff']
        ],
        colorbar: {
          title: getMetricLabel(selectedMetric),
          titlefont: { color: '#f7f9fb' },
          tickfont: { color: '#f7f9fb' }
        },
        line: {
          color: '#f7f9fb',
          width: 1
        }
      },
      hovertemplate: '%{text}<extra></extra>'
    };

    const layout = {
      geo: {
        showframe: false,
        showcoastlines: true,
        coastlinecolor: '#3a4459',
        showland: true,
        landcolor: '#0a1224',
        showocean: true,
        oceancolor: '#0a1224',
        projection: { type: 'natural earth' },
        bgcolor: '#0a1224'
      },
      paper_bgcolor: '#0a1224',
      plot_bgcolor: '#0a1224',
      font: { color: '#f7f9fb' },
      margin: { l: 0, r: 0, t: 40, b: 0 },
      height: 500
    };

    return (
      <div className={styles.glassBackground}>
        <Plot
          data={[trace]}
          layout={layout}
          style={{ width: '100%', height: '500px' }}
          config={{
            displayModeBar: false,
            responsive: true
          }}
        />
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card title="Regional Performance Map" isLoading={isLoading}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          color: "#5891cb",
        }}>
          No regional data available
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Regional Performance Map"
      subtitle={`${data.length} regions | ${getMetricLabel(selectedMetric)}`}
      isLoading={isLoading}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('choropleth')}
            style={{
              padding: '4px 8px',
              backgroundColor: viewMode === 'choropleth' ? '#00e0ff' : 'transparent',
              color: viewMode === 'choropleth' ? '#0a1224' : '#f7f9fb',
              border: '1px solid #3a4459',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Regions
          </button>
          <button
            onClick={() => setViewMode('scatter')}
            style={{
              padding: '4px 8px',
              backgroundColor: viewMode === 'scatter' ? '#00e0ff' : 'transparent',
              color: viewMode === 'scatter' ? '#0a1224' : '#f7f9fb',
              border: '1px solid #3a4459',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Geographic
          </button>
        </div>
      }
    >
      {viewMode === 'choropleth' ? renderChoroplethMap() : renderScatterMap()}
    </Card>
  );
};

export default RegionalPerformanceMap; 