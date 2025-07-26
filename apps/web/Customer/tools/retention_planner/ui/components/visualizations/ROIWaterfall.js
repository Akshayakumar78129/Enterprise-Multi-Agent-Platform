import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const ROIWaterfall = forwardRef(({
  data = [],
  isLoading = false,
  onActionClick = null
}, ref) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [viewMode, setViewMode] = useState('cumulative'); // 'cumulative' or 'individual'

  useImperativeHandle(ref, () => ({
    highlightAction: (action, explanation) => {
      setSelectedAction({ action, explanation });
    },
    setViewMode: (mode) => {
      setViewMode(mode);
    },
    resetView: () => {
      setSelectedAction(null);
      setViewMode('cumulative');
    }
  }));

  // Debug logging
  console.log('🚨 ROIWaterfall component received data:', {
    data,
    hasData: !!data,
    isArray: Array.isArray(data),
    dataLength: data?.length,
    firstItem: data?.[0],
    isLoading
  });

  // TEMPORARY: Let's try fetching data directly in the component to bypass spawning issues
  const [directApiData, setDirectApiData] = React.useState(null);
  React.useEffect(() => {
    fetch('/api/retention-planner/data')
      .then(res => res.json())
      .then(result => {
        console.log('🔧 ROIWaterfall DIRECT API call result:', result.data?.visualizations?.roiProjection);
        setDirectApiData(result.data?.visualizations?.roiProjection);
      })
      .catch(err => console.error('🔧 ROIWaterfall DIRECT API error:', err));
  }, []);

  // Use direct API data if available and spawned data is empty
  const actualData = (data?.length > 0) ? data : directApiData || data;
  console.log('🔧 ROIWaterfall using data:', {
    usingSpawnedData: data?.length > 0,
    spawnedDataLength: data?.length,
    directDataLength: directApiData?.length,
    finalDataLength: actualData?.length
  });

  if (!actualData || actualData.length === 0) {
    return (
      <Card title="ROI Projection" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "360px",
            color: "#5891cb",
          }}
        >
          No ROI data available
          <br/>
          <small style={{marginTop: '10px', fontSize: '12px', opacity: 0.7}}>
            Debug: hasData={String(!!actualData)}, isArray={String(Array.isArray(actualData))}, length={actualData?.length || 0}
          </small>
        </div>
      </Card>
    );
  }

  // Prepare waterfall data
  const sortedData = actualData.sort((a, b) => b.total_benefit - a.total_benefit);
  
  let cumulativeCost = 0;
  let cumulativeBenefit = 0;
  let cumulativeNet = 0;

  const waterfallData = [];
  const colors = [];
  const textLabels = [];

  // Process each action
  sortedData.forEach((item, index) => {
    const cost = item.total_cost;
    const benefit = item.total_benefit;
    const net = benefit - cost;

    if (viewMode === 'cumulative') {
      // Cumulative waterfall
      cumulativeCost += cost;
      cumulativeBenefit += benefit;
      cumulativeNet += net;

      // Cost bar (negative)
      waterfallData.push(-cost);
      colors.push('#e930ff');
      textLabels.push(`Cost: $${cost.toLocaleString()}`);

      // Benefit bar (positive)  
      waterfallData.push(benefit);
      colors.push('#00e0ff');
      textLabels.push(`Benefit: $${benefit.toLocaleString()}`);
    } else {
      // Individual action view
      waterfallData.push(net);
      colors.push(net > 0 ? '#00e0ff' : '#e930ff');
      textLabels.push(`ROI: ${item.roi_percentage.toFixed(1)}%`);
    }
  });

  // Add total ROI bar
  const totalCost = sortedData.reduce((sum, item) => sum + item.total_cost, 0);
  const totalBenefit = sortedData.reduce((sum, item) => sum + item.total_benefit, 0);
  const totalROI = totalCost > 0 ? ((totalBenefit - totalCost) / totalCost) * 100 : 0;

  if (viewMode === 'cumulative') {
    waterfallData.push(totalBenefit - totalCost);
    colors.push(totalROI > 0 ? '#92edf0' : '#e930ff');
    textLabels.push(`Total ROI: ${totalROI.toFixed(1)}%`);
  }

  // Prepare chart data
  const xLabels = viewMode === 'cumulative' 
    ? [...sortedData.flatMap(item => [`${item.action} Cost`, `${item.action} Benefit`]), 'Net ROI']
    : [...sortedData.map(item => item.action)];

  const chartData = [{
    x: xLabels,
    y: waterfallData,
    type: 'bar',
    marker: {
      color: colors,
      opacity: selectedAction ? colors.map((_, idx) => {
        const actionName = viewMode === 'cumulative' 
          ? xLabels[idx].replace(' Cost', '').replace(' Benefit', '')
          : xLabels[idx];
        return selectedAction.action === actionName ? 0.9 : 0.5;
      }) : 0.8,
      line: {
        color: '#f7f9fb',
        width: 1
      }
    },
    text: textLabels,
    textposition: 'outside',
    textfont: { color: '#f7f9fb', size: 10 },
    hovertemplate: viewMode === 'cumulative' 
      ? '%{text}<br>Value: $%{y:,.0f}<extra></extra>'
      : '%{x}<br>%{text}<br>Net: $%{y:,.0f}<extra></extra>'
  }];

  const layout = {
    width: 480,
    height: 360,
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#f7f9fb" },
    title: {
      text: `ROI Projection (${viewMode === 'cumulative' ? 'Cumulative' : 'Individual'})`,
      font: { color: "#f7f9fb", size: 16 },
      x: 0.5
    },
    xaxis: {
      title: viewMode === 'cumulative' ? "Cost & Benefit Components" : "Retention Actions",
      titlefont: { color: "#f7f9fb", size: 12 },
      tickfont: { color: "#f7f9fb", size: 9 },
      tickangle: -45,
      gridcolor: "rgba(247, 249, 251, 0.1)",
      zerolinecolor: "rgba(247, 249, 251, 0.2)"
    },
    yaxis: {
      title: "Amount ($)",
      titlefont: { color: "#f7f9fb", size: 12 },
      tickfont: { color: "#f7f9fb", size: 11 },
      gridcolor: "rgba(247, 249, 251, 0.1)",
      zerolinecolor: "rgba(247, 249, 251, 0.3)",
      zeroline: true,
      zerolinewidth: 2
    },
    margin: { t: 60, b: 120, l: 80, r: 40 },
    showlegend: false,
    bargap: 0.3
  };

  const plotConfig = {
    displayModeBar: false,
    staticPlot: false,
    responsive: true
  };

  const handleBarClick = (event) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const actionName = viewMode === 'cumulative' 
        ? point.x.replace(' Cost', '').replace(' Benefit', '')
        : point.x;
      
      setSelectedAction({ 
        action: actionName, 
        explanation: `Selected ${actionName} for detailed analysis` 
      });
      
      if (onActionClick) onActionClick(actionName);
    }
  };

  return (
    <Card 
      title="ROI Projection" 
      subtitle={`Total ROI: ${totalROI > 0 ? '+' : ''}${totalROI.toFixed(1)}%`}
      isLoading={isLoading}
    >
      <div style={{ position: "relative" }}>
        {/* View mode toggle */}
        <div style={{ 
          marginBottom: "15px",
          display: "flex",
          justifyContent: "center",
          gap: "10px"
        }}>
          <button
            onClick={() => setViewMode('cumulative')}
            style={{
              padding: "6px 12px",
              backgroundColor: viewMode === 'cumulative' ? "#e930ff" : "rgba(58, 68, 89, 0.5)",
              color: "#f7f9fb",
              border: "1px solid #3a4459",
              borderRadius: "6px",
              fontSize: "11px",
              cursor: "pointer"
            }}
          >
            Waterfall View
          </button>
          <button
            onClick={() => setViewMode('individual')}
            style={{
              padding: "6px 12px",
              backgroundColor: viewMode === 'individual' ? "#e930ff" : "rgba(58, 68, 89, 0.5)",
              color: "#f7f9fb",
              border: "1px solid #3a4459",
              borderRadius: "6px",
              fontSize: "11px",
              cursor: "pointer"
            }}
          >
            Individual ROI
          </button>
        </div>

        <Plot
          data={chartData}
          layout={layout}
          config={plotConfig}
          onClick={handleBarClick}
        />

        {/* Summary statistics */}
        <div style={{ 
          marginTop: "15px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          fontSize: "11px"
        }}>
          <div style={{
            backgroundColor: "rgba(233, 48, 255, 0.2)",
            padding: "8px",
            borderRadius: "6px",
            textAlign: "center"
          }}>
            <div style={{ color: "#e930ff", fontWeight: "bold" }}>Total Cost</div>
            <div style={{ color: "#f7f9fb" }}>${totalCost.toLocaleString()}</div>
          </div>
          <div style={{
            backgroundColor: "rgba(0, 224, 255, 0.2)",
            padding: "8px",
            borderRadius: "6px",
            textAlign: "center"
          }}>
            <div style={{ color: "#00e0ff", fontWeight: "bold" }}>Total Benefit</div>
            <div style={{ color: "#f7f9fb" }}>${totalBenefit.toLocaleString()}</div>
          </div>
          <div style={{
            backgroundColor: totalROI > 0 ? "rgba(146, 237, 240, 0.2)" : "rgba(233, 48, 255, 0.2)",
            padding: "8px",
            borderRadius: "6px",
            textAlign: "center"
          }}>
            <div style={{ color: totalROI > 0 ? "#92edf0" : "#e930ff", fontWeight: "bold" }}>
              Net ROI
            </div>
            <div style={{ color: "#f7f9fb" }}>
              {totalROI > 0 ? '+' : ''}{totalROI.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Detailed breakdown for selected action */}
        {selectedAction && (
          <div style={{
            marginTop: "15px",
            backgroundColor: "rgba(58, 68, 89, 0.3)",
            padding: "10px",
            borderRadius: "8px",
            fontSize: "11px"
          }}>
            <h5 style={{ color: "#00e0ff", margin: "0 0 8px 0" }}>
              {selectedAction.action} Details
            </h5>
            {(() => {
              const actionData = data.find(item => item.action === selectedAction.action);
              if (!actionData) return null;
              
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  <div>
                    <span style={{ color: "#5891cb" }}>Customers:</span> {actionData.customer_count}
                  </div>
                  <div>
                    <span style={{ color: "#5891cb" }}>Effectiveness:</span> {Math.round(actionData.expected_effectiveness * 100)}%
                  </div>
                  <div>
                    <span style={{ color: "#5891cb" }}>Total Cost:</span> ${actionData.total_cost.toLocaleString()}
                  </div>
                  <div>
                    <span style={{ color: "#5891cb" }}>Total Benefit:</span> ${actionData.total_benefit.toLocaleString()}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Selection indicator */}
        {selectedAction && (
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
            {selectedAction.explanation}
          </div>
        )}
      </div>
    </Card>
  );
});

ROIWaterfall.displayName = 'ROIWaterfall';

export default ROIWaterfall; 