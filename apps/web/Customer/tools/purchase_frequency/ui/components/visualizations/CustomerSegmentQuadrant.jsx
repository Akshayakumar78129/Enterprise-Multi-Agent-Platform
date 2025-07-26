import React, { useState, useMemo } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const CustomerSegmentQuadrant = ({
  data = [],
  isLoading = false,
  onCustomerClick = null,
  onSegmentFilter = null,
  selectedCustomers = [],
  selectedSegment = null,
  width = 480,
  height = 480
}) => {
  const [hoveredCustomer, setHoveredCustomer] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const segmentColors = {
    'Champions': '#00e0ff',        // Electric Cyan
    'Loyal': '#5fd4d6',            // Lighter cyan
    'Big Spenders': '#ae76fa',     // Purple
    'At Risk': '#e930ff',          // Signal Magenta
    'Others': '#3a4459'            // Graphite
  };

  const chartData = useMemo(() => {
    console.log('👥 CustomerSegmentQuadrant data:', data);
    
    // Temporary: Use hardcoded data to test if chart works
    const testData = [
      { customerId: 1, customerName: "Acme Corp", frequency: 15, monetaryValue: 5000, segment: "Champions" },
      { customerId: 2, customerName: "Big Store", frequency: 8, monetaryValue: 3200, segment: "Loyal" },
      { customerId: 3, customerName: "Quick Shop", frequency: 25, monetaryValue: 8000, segment: "Champions" },
      { customerId: 4, customerName: "Corner Market", frequency: 3, monetaryValue: 1200, segment: "At Risk" },
      { customerId: 5, customerName: "SuperMart", frequency: 12, monetaryValue: 4800, segment: "Big Spenders" }
    ];
    
    const actualData = data && data.length > 0 ? data : testData;
    console.log('👥 Using data:', actualData);
    
    if (!actualData || actualData.length === 0) {
      console.log('❌ CustomerSegmentQuadrant: No data or empty array');
      return null;
    }

    // Calculate medians for quadrant lines
    const frequencies = actualData.map(d => d.frequency);
    const monetaryValues = actualData.map(d => d.monetaryValue);
    
    const medianFreq = frequencies.sort((a, b) => a - b)[Math.floor(frequencies.length / 2)];
    const medianValue = monetaryValues.sort((a, b) => a - b)[Math.floor(monetaryValues.length / 2)];

    // Group data by segment for multiple traces
    const segments = ['Champions', 'Loyal', 'Big Spenders', 'At Risk', 'Others'];
    
    const traces = segments.map(segment => {
      const segmentData = actualData.filter(d => d.segment === segment);
      
      if (segmentData.length === 0) return null;

      return {
        x: segmentData.map(d => d.frequency),
        y: segmentData.map(d => d.monetaryValue),
        mode: 'markers',
        type: 'scatter',
        name: segment,
        marker: {
          size: segmentData.map(d => {
            // Size based on recency (larger = more recent)
            const recencyScore = Math.max(1, 90 - d.recencyDays) / 90;
            const baseSize = 8;
            const maxSize = 20;
            return baseSize + (maxSize - baseSize) * recencyScore;
          }),
          color: segmentColors[segment],
          opacity: segmentData.map((d, index) => {
            const customerId = d.customerId;
            
            // Handle selection filtering
            if (selectedSegment && segment !== selectedSegment) {
              return 0.2; // Fade non-selected segments
            }
            
            if (selectedCustomers.length > 0 && !selectedCustomers.includes(customerId)) {
              return 0.2; // Fade non-selected customers
            }
            
            if (hoveredCustomer === customerId) {
              return 1; // Full opacity for hovered
            }
            
            return 0.8; // Default opacity
          }),
          line: {
            color: segmentData.map((d, index) => {
              const customerId = d.customerId;
              
              if (selectedCustomers.includes(customerId)) {
                return '#f7f9fb'; // Cloud White outline for selected
              }
              
              if (hoveredCustomer === customerId) {
                return '#f7f9fb'; // Cloud White outline for hovered
              }
              
              return 'transparent';
            }),
            width: 2
          }
        },
        customdata: segmentData.map(d => ({
          customerId: d.customerId,
          customerName: d.customerName,
          recencyDays: d.recencyDays,
          avgTransactionValue: d.avgTransactionValue
        })),
        hovertemplate:
          '<b>%{customdata.customerName}</b><br>' +
          'Frequency: %{x} purchases<br>' +
          'Total Value: $%{y:,.2f}<br>' +
          'Avg Transaction: $%{customdata.avgTransactionValue:,.2f}<br>' +
          'Last Purchase: %{customdata.recencyDays} days ago<br>' +
          'Segment: ' + segment + '<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: '#232a36',
          bordercolor: segmentColors[segment],
          font: { color: '#f7f9fb' }
        }
      };
    }).filter(trace => trace !== null);

    return { traces, medianFreq, medianValue };
  }, [data, selectedCustomers, selectedSegment, hoveredCustomer]);

  const handleClick = (eventData) => {
    if (onCustomerClick && eventData.points && eventData.points.length > 0) {
      const point = eventData.points[0];
      const customerId = point.customdata.customerId;
      onCustomerClick(customerId);
    }
  };

  const handleHover = (eventData) => {
    if (eventData.points && eventData.points.length > 0) {
      const customerId = eventData.points[0].customdata.customerId;
      setHoveredCustomer(customerId);
    }
  };

  const handleUnhover = () => {
    setHoveredCustomer(null);
  };

  const handleLegendClick = (eventData) => {
    if (onSegmentFilter) {
      const segment = eventData.data[eventData.curveIndex].name;
      onSegmentFilter(segment);
    }
    return false; // Prevent default legend toggle
  };

  if (!data || data.length === 0) {
    return (
      <Card title="Customer Segment Analysis" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            color: "#5891cb",
          }}
        >
          No customer segment data available
        </div>
      </Card>
    );
  }

  const layout = {
    width: width * zoomLevel,
    height: height * zoomLevel,
    margin: { t: 60, r: 80, b: 80, l: 80 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: 'Inter, sans-serif',
      color: '#f7f9fb'
    },
    xaxis: {
      title: {
        text: 'Purchase Frequency (per year)',
        font: { size: 12, color: '#f7f9fb' }
      },
      tickfont: { size: 10, color: '#f7f9fb' },
      gridcolor: 'rgba(247, 249, 251, 0.1)',
      showgrid: true,
      zeroline: false
    },
    yaxis: {
      title: {
        text: 'Average Transaction Value ($)',
        font: { size: 12, color: '#f7f9fb' }
      },
      tickfont: { size: 10, color: '#f7f9fb' },
      gridcolor: 'rgba(247, 249, 251, 0.1)',
      showgrid: true,
      zeroline: false
    },
    shapes: chartData ? [
      // Horizontal quadrant line (median value)
      {
        type: 'line',
        x0: Math.min(...data.map(d => d.frequency)) - 1,
        x1: Math.max(...data.map(d => d.frequency)) + 1,
        y0: chartData.medianValue,
        y1: chartData.medianValue,
        line: {
          color: 'rgba(247, 249, 251, 0.5)',
          width: 1,
          dash: 'dot'
        }
      },
      // Vertical quadrant line (median frequency)
      {
        type: 'line',
        x0: chartData.medianFreq,
        x1: chartData.medianFreq,
        y0: Math.min(...data.map(d => d.monetaryValue)) - 50,
        y1: Math.max(...data.map(d => d.monetaryValue)) + 50,
        line: {
          color: 'rgba(247, 249, 251, 0.5)',
          width: 1,
          dash: 'dot'
        }
      }
    ] : [],
    annotations: chartData ? [
      {
        x: Math.max(...data.map(d => d.frequency)) * 0.8,
        y: Math.max(...data.map(d => d.monetaryValue)) * 0.9,
        text: 'High Value<br/>High Frequency',
        showarrow: false,
        font: { size: 10, color: '#f7f9fb' },
        xanchor: 'center'
      },
      {
        x: Math.min(...data.map(d => d.frequency)) * 1.2,
        y: Math.max(...data.map(d => d.monetaryValue)) * 0.9,
        text: 'High Value<br/>Low Frequency',
        showarrow: false,
        font: { size: 10, color: '#f7f9fb' },
        xanchor: 'center'
      },
      {
        x: Math.max(...data.map(d => d.frequency)) * 0.8,
        y: Math.min(...data.map(d => d.monetaryValue)) * 1.5,
        text: 'Low Value<br/>High Frequency',
        showarrow: false,
        font: { size: 10, color: '#f7f9fb' },
        xanchor: 'center'
      },
      {
        x: Math.min(...data.map(d => d.frequency)) * 1.2,
        y: Math.min(...data.map(d => d.monetaryValue)) * 1.5,
        text: 'Low Value<br/>Low Frequency',
        showarrow: false,
        font: { size: 10, color: '#f7f9fb' },
        xanchor: 'center'
      }
    ] : [],
    hovermode: 'closest',
    showlegend: true,
    legend: {
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(35, 42, 54, 0.8)',
      bordercolor: 'rgba(247, 249, 251, 0.3)',
      borderwidth: 1,
      font: { size: 10, color: '#f7f9fb' }
    }
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d'],
    responsive: true
  };

  const segmentCounts = Object.keys(segmentColors).reduce((acc, segment) => {
    acc[segment] = data.filter(d => d.segment === segment).length;
    return acc;
  }, {});

  return (
    <Card 
      title="Customer Segment Quadrant (RFM)" 
      subtitle={`${data.length} customers analyzed`}
      isLoading={isLoading}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {chartData && (
          <Plot
            data={chartData.traces}
            layout={layout}
            config={config}
            onClick={handleClick}
            onHover={handleHover}
            onUnhover={handleUnhover}
            onLegendClick={handleLegendClick}
            style={{ width: '100%', height: '100%' }}
          />
        )}
        
        {/* Zoom controls */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          display: 'flex',
          gap: '4px'
        }}>
          <button
            onClick={() => setZoomLevel(Math.min(zoomLevel + 0.2, 1.2))}
            style={{
              padding: '4px 8px',
              backgroundColor: '#232a36',
              border: '1px solid #3a4459',
              borderRadius: '4px',
              color: '#f7f9fb',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            +
          </button>
          <button
            onClick={() => setZoomLevel(Math.max(zoomLevel - 0.2, 0.8))}
            style={{
              padding: '4px 8px',
              backgroundColor: '#232a36',
              border: '1px solid #3a4459',
              borderRadius: '4px',
              color: '#f7f9fb',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            -
          </button>
        </div>
      </div>
      
      {/* Segment summary */}
      <div style={{
        marginTop: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '11px'
      }}>
        {Object.entries(segmentCounts).map(([segment, count]) => (
          <div
            key={segment}
            onClick={() => onSegmentFilter && onSegmentFilter(segment)}
            style={{
              padding: '4px 8px',
              backgroundColor: selectedSegment === segment ? 'rgba(0, 224, 255, 0.2)' : 'rgba(35, 42, 54, 0.5)',
              border: `1px solid ${segmentColors[segment]}`,
              borderRadius: '12px',
              color: segmentColors[segment],
              cursor: onSegmentFilter ? 'pointer' : 'default',
              transition: 'all 0.2s ease'
            }}
          >
            {segment}: {count}
          </div>
        ))}
      </div>
      
      {selectedCustomers.length > 0 && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 224, 255, 0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(0, 224, 255, 0.3)',
          fontSize: '12px',
          color: '#00e0ff'
        }}>
          Selected: {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''}
        </div>
      )}
    </Card>
  );
};

export default CustomerSegmentQuadrant; 