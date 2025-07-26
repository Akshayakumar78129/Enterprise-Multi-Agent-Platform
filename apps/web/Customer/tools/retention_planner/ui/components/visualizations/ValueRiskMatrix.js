import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const ValueRiskMatrix = forwardRef(({
  data = {},
  isLoading = false,
  onQuadrantClick = null,
  onCustomerClick = null,
  highlightQuadrant = null,
  highlightCustomers = []
}, ref) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useImperativeHandle(ref, () => ({
    highlightQuadrant: (quadrant, explanation) => {
      setSelectedQuadrant({ quadrant, explanation });
    },
    highlightCustomers: (customerIds, explanation) => {
      setSelectedCustomers(customerIds);
    },
    resetView: () => {
      setSelectedQuadrant(null);
      setSelectedCustomers([]);
    }
  }));

  if (!data || Object.keys(data).length === 0) {
    return (
      <Card title="Customer Value-Risk Matrix" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "500px",
            color: "#5891cb",
          }}
        >
          No customer data available
        </div>
      </Card>
    );
  }

  // Prepare scatter plot data for each quadrant
  const quadrants = [
    { 
      key: 'highValueLowRisk', 
      name: 'Nurture', 
      color: '#00e0ff', 
      position: { x: [0, 0.5], y: [0.5, 1] } 
    },
    { 
      key: 'highValueHighRisk', 
      name: 'Rescue', 
      color: '#e930ff', 
      position: { x: [0.5, 1], y: [0.5, 1] } 
    },
    { 
      key: 'lowValueLowRisk', 
      name: 'Monitor', 
      color: '#3a4459', 
      position: { x: [0, 0.5], y: [0, 0.5] } 
    },
    { 
      key: 'lowValueHighRisk', 
      name: 'Evaluate', 
      color: '#aa45dd', 
      position: { x: [0.5, 1], y: [0, 0.5] } 
    }
  ];

  const scatterData = quadrants.map(quadrant => {
    const quadrantData = data[quadrant.key] || [];
    
    return {
      x: quadrantData.map(point => point.risk),
      y: quadrantData.map(point => {
        // Map value to y-axis: High=0.75, Medium=0.5, Low=0.25
        const valueMap = { 'High': 0.75, 'Medium': 0.5, 'Low': 0.25 };
        return valueMap[point.value] || 0.25;
      }),
      mode: 'markers',
      type: 'scatter',
      name: `${quadrant.name} (${quadrantData.length})`,
      marker: {
        size: quadrantData.map(point => Math.max(8, Math.min(20, 100 - point.recency))), // Size based on recency
        color: quadrant.color,
        opacity: selectedQuadrant && selectedQuadrant.quadrant !== quadrant.name ? 0.3 : 0.8,
        line: {
          width: selectedCustomers.some(id => quadrantData.find(p => p.id === id)) ? 3 : 1,
          color: '#f7f9fb'
        }
      },
      text: quadrantData.map(point => 
        `${point.name}<br>Risk: ${point.risk.toFixed(2)}<br>Value: ${point.value}<br>Recency: ${point.recency} days`
      ),
      hovertemplate: '%{text}<extra></extra>',
      customdata: quadrantData.map(point => ({ ...point, quadrant: quadrant.name }))
    };
  });

  // Add quadrant background rectangles
  const shapes = quadrants.map(quadrant => ({
    type: 'rect',
    x0: quadrant.position.x[0],
    x1: quadrant.position.x[1], 
    y0: quadrant.position.y[0],
    y1: quadrant.position.y[1],
    fillcolor: selectedQuadrant && selectedQuadrant.quadrant === quadrant.name 
      ? `${quadrant.color}40` 
      : `${quadrant.color}10`,
    line: { width: 0 },
    layer: 'below'
  }));

  // Add dividing lines
  shapes.push(
    {
      type: 'line',
      x0: 0.5, x1: 0.5, y0: 0, y1: 1,
      line: { color: '#f7f9fb', width: 2, opacity: 0.3 }
    },
    {
      type: 'line', 
      x0: 0, x1: 1, y0: 0.5, y1: 0.5,
      line: { color: '#f7f9fb', width: 2, opacity: 0.3 }
    }
  );

  // Add quadrant labels
  const annotations = quadrants.map(quadrant => ({
    x: (quadrant.position.x[0] + quadrant.position.x[1]) / 2,
    y: (quadrant.position.y[0] + quadrant.position.y[1]) / 2 + 0.35,
    text: `<b>${quadrant.name}</b><br>${(data[quadrant.key] || []).length} customers`,
    showarrow: false,
    font: { color: quadrant.color, size: 14 },
    bgcolor: 'rgba(10, 18, 36, 0.8)',
    bordercolor: quadrant.color,
    borderwidth: 1
  }));

  const layout = {
    width: 500,
    height: 500,
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#f7f9fb" },
    xaxis: {
      title: "Churn Risk",
      titlefont: { color: "#f7f9fb", size: 14 },
      tickfont: { color: "#f7f9fb", size: 12 },
      range: [0, 1],
      gridcolor: "rgba(247, 249, 251, 0.1)",
      zerolinecolor: "rgba(247, 249, 251, 0.1)",
      tickformat: '.1f'
    },
    yaxis: {
      title: "Customer Value",
      titlefont: { color: "#f7f9fb", size: 14 },
      tickfont: { color: "#f7f9fb", size: 12 },
      range: [0, 1],
      tickvals: [0.25, 0.5, 0.75],
      ticktext: ['Low', 'Medium', 'High'],
      gridcolor: "rgba(247, 249, 251, 0.1)",
      zerolinecolor: "rgba(247, 249, 251, 0.1)"
    },
    margin: { t: 40, b: 60, l: 80, r: 40 },
    showlegend: true,
    legend: {
      x: 1.02,
      y: 1,
      bgcolor: "rgba(35, 42, 54, 0.8)",
      bordercolor: "#3a4459",
      borderwidth: 1,
      font: { color: "#f7f9fb", size: 10 }
    },
    shapes: shapes,
    annotations: annotations
  };

  const plotConfig = {
    displayModeBar: false,
    staticPlot: false,
    responsive: true
  };

  const handlePlotClick = (event) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const customData = point.customdata;
      
      if (customData) {
        if (onCustomerClick) {
          onCustomerClick(customData.id);
        }
        setSelectedCustomers([customData.id]);
      }
    }
  };

  const handlePlotHover = (event) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      setHoveredPoint(point.customdata);
    }
  };

  const handleQuadrantClick = (quadrantName) => {
    setSelectedQuadrant({ 
      quadrant: quadrantName, 
      explanation: `Selected ${quadrantName} quadrant` 
    });
    if (onQuadrantClick) {
      onQuadrantClick(quadrantName);
    }
  };

  return (
    <Card 
      title="Customer Value-Risk Matrix" 
      subtitle={`${Object.values(data).flat().length} customers plotted`}
      isLoading={isLoading}
    >
      <div style={{ position: "relative" }}>
        <Plot
          data={scatterData}
          layout={layout}
          config={plotConfig}
          onClick={handlePlotClick}
          onHover={handlePlotHover}
        />

        {/* Quadrant selection overlay */}
        <div style={{
          position: "absolute",
          top: "50px",
          left: "80px",
          width: "420px",
          height: "400px",
          pointerEvents: "none"
        }}>
          {quadrants.map(quadrant => (
            <div
              key={quadrant.key}
              style={{
                position: "absolute",
                left: `${quadrant.position.x[0] * 100}%`,
                top: `${(1 - quadrant.position.y[1]) * 100}%`,
                width: `${(quadrant.position.x[1] - quadrant.position.x[0]) * 100}%`,
                height: `${(quadrant.position.y[1] - quadrant.position.y[0]) * 100}%`,
                pointerEvents: "auto",
                cursor: "pointer",
                backgroundColor: "transparent"
              }}
              onClick={() => handleQuadrantClick(quadrant.name)}
            />
          ))}
        </div>

        {/* Selection indicator */}
        {selectedQuadrant && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              backgroundColor: "rgba(233, 48, 255, 0.9)",
              color: "#f7f9fb",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              maxWidth: "200px"
            }}
          >
            {selectedQuadrant.explanation}
          </div>
        )}

        {/* Hover info */}
        {hoveredPoint && (
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              backgroundColor: "rgba(35, 42, 54, 0.9)",
              color: "#f7f9fb",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "11px",
              border: "1px solid #3a4459"
            }}
          >
            <strong>{hoveredPoint.name}</strong><br/>
            Risk: {hoveredPoint.risk.toFixed(2)} | Value: {hoveredPoint.value}<br/>
            Days since activity: {hoveredPoint.recency}
          </div>
        )}
      </div>
    </Card>
  );
});

ValueRiskMatrix.displayName = 'ValueRiskMatrix';

export default ValueRiskMatrix; 