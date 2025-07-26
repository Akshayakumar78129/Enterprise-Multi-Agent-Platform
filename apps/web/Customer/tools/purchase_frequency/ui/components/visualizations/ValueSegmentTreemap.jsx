import React, { useState, useMemo } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const ValueSegmentTreemap = ({
  data = [],
  isLoading = false,
  onSegmentClick = null,
  selectedSegment = null,
  width = 360,
  height = 300
}) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const segmentColors = {
    'Premium': '#ae76fa',     // Purple
    'Standard': '#00e0ff',    // Electric Cyan
    'Budget': '#5fd4d6',      // Lighter cyan
    'Occasional': '#3a4459'   // Graphite
  };

  const chartData = useMemo(() => {
    console.log('💰 ValueSegmentTreemap data:', data);
    
    // Temporary: Use hardcoded data to test if chart works
    const testData = [
      { segment: "Premium", customerCount: 1200, avgValue: 25000, totalValue: 30000000, percentage: "48.0" },
      { segment: "Standard", customerCount: 800, avgValue: 8000, totalValue: 6400000, percentage: "32.0" },
      { segment: "Budget", customerCount: 400, avgValue: 3000, totalValue: 1200000, percentage: "16.0" },
      { segment: "Occasional", customerCount: 100, avgValue: 1000, totalValue: 100000, percentage: "4.0" }
    ];
    
    const actualData = data && data.length > 0 ? data : testData;
    console.log('💰 Using data:', actualData);
    
    if (!actualData || actualData.length === 0) {
      console.log('❌ ValueSegmentTreemap: No data or empty array');
      return null;
    }

    // Filter out zero-value segments
    const validData = actualData.filter(segment => segment.customerCount > 0);
    
    if (validData.length === 0) return null;

    const trace = {
      type: 'treemap',
      labels: validData.map(segment => `${segment.segment}<br/>${segment.customerCount} customers<br/>$${segment.avgValue.toLocaleString()}`),
      parents: validData.map(() => ''), // All are root level
      values: validData.map(segment => segment.totalValue),
      ids: validData.map(segment => segment.segment),
      
      textinfo: 'label+value+percent parent',
      texttemplate: '<b>%{label}</b><br/>$%{value:,.0f}<br/>%{percentParent}',
      textfont: {
        size: 11,
        color: '#f7f9fb'
      },
      textposition: 'middle center',
      
      marker: {
        colors: validData.map((segment, index) => {
          if (selectedSegment && segment.segment === selectedSegment) {
            return segmentColors[segment.segment] || '#3a4459';
          }
          if (hoveredSegment === index) {
            // Lighter version for hover
            const color = segmentColors[segment.segment] || '#3a4459';
            return color + 'CC'; // Add transparency
          }
          return segmentColors[segment.segment] || '#3a4459';
        }),
        line: {
          color: validData.map((segment, index) => {
            if (selectedSegment && segment.segment === selectedSegment) {
              return '#00e0ff'; // Electric cyan border for selected
            }
            if (hoveredSegment === index) {
              return '#f7f9fb'; // White border for hover
            }
            return 'rgba(247, 249, 251, 0.2)';
          }),
          width: validData.map((segment, index) => {
            if (selectedSegment && segment.segment === selectedSegment) {
              return 3; // Thicker border for selected
            }
            if (hoveredSegment === index) {
              return 2; // Medium border for hover
            }
            return 1;
          })
        }
      },
      
      hovertemplate:
        '<b>%{id}</b><br>' +
        'Customers: %{customdata.customerCount:,}<br>' +
        'Total Value: $%{value:,.2f}<br>' +
        'Avg Value: $%{customdata.avgValue:,.2f}<br>' +
        'Avg Purchases: %{customdata.avgPurchases}<br>' +
        'Percentage: %{customdata.percentage}%<br>' +
        '<extra></extra>',
        
      customdata: validData.map(segment => ({
        customerCount: segment.customerCount,
        avgValue: segment.avgValue,
        avgPurchases: segment.avgPurchases,
        percentage: segment.percentage
      })),
      
      hoverlabel: {
        bgcolor: '#232a36',
        bordercolor: '#00e0ff',
        font: { color: '#f7f9fb', size: 12 }
      }
    };

    return { trace, validData };
  }, [data, selectedSegment, hoveredSegment]);

  const handleClick = (eventData) => {
    if (onSegmentClick && eventData.points && eventData.points.length > 0) {
      const clickedSegment = eventData.points[0].id;
      onSegmentClick(clickedSegment);
    }
  };

  const handleHover = (eventData) => {
    if (eventData.points && eventData.points.length > 0) {
      setHoveredSegment(eventData.points[0].pointIndex);
    }
  };

  const handleUnhover = () => {
    setHoveredSegment(null);
  };

  if (!data || data.length === 0) {
    return (
      <Card title="Value Segment Distribution" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "250px",
            color: "#5891cb",
          }}
        >
          No value segment data available
        </div>
      </Card>
    );
  }

  const layout = {
    width: width,
    height: height,
    margin: { t: 20, r: 10, b: 10, l: 10 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: 'Inter, sans-serif',
      color: '#f7f9fb'
    }
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  // Calculate total customers and revenue for summary
  const totalCustomers = data.reduce((sum, segment) => sum + segment.customerCount, 0);
  const totalRevenue = data.reduce((sum, segment) => sum + segment.totalValue, 0);

  return (
    <Card 
      title="Value Segment Distribution" 
      subtitle={`${totalCustomers} customers, $${totalRevenue.toLocaleString()} total`}
      isLoading={isLoading}
    >
      <div style={{ width: '100%', height: '100%' }}>
        {chartData && (
          <Plot
            data={[chartData.trace]}
            layout={layout}
            config={config}
            onClick={handleClick}
            onHover={handleHover}
            onUnhover={handleUnhover}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
      
      {/* Segment details below treemap */}
      <div style={{
        marginTop: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '8px',
        fontSize: '11px'
      }}>
        {data.map((segment) => (
          <div
            key={segment.segment}
            onClick={() => onSegmentClick && onSegmentClick(segment.segment)}
            style={{
              padding: '8px',
              backgroundColor: selectedSegment === segment.segment 
                ? 'rgba(0, 224, 255, 0.2)' 
                : 'rgba(35, 42, 54, 0.5)',
              border: `1px solid ${segmentColors[segment.segment]}`,
              borderRadius: '6px',
              cursor: onSegmentClick ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              transform: selectedSegment === segment.segment ? 'translateY(-2px)' : 'none',
              boxShadow: selectedSegment === segment.segment 
                ? '0 4px 8px rgba(0, 0, 0, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ 
              fontWeight: '600', 
              color: segmentColors[segment.segment],
              marginBottom: '4px'
            }}>
              {segment.segment}
            </div>
            <div style={{ color: '#f7f9fb', lineHeight: '1.3' }}>
              <div>{segment.customerCount} customers ({segment.percentage}%)</div>
              <div>Avg: ${segment.avgValue.toLocaleString()}</div>
              <div>{segment.avgPurchases} purchases</div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedSegment && (
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 224, 255, 0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(0, 224, 255, 0.3)',
          fontSize: '12px',
          color: '#00e0ff'
        }}>
          Selected: {selectedSegment} segment
        </div>
      )}
    </Card>
  );
};

export default ValueSegmentTreemap; 