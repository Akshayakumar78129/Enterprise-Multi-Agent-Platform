import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const ChurnRiskGauge = forwardRef(({
  data = [],
  avgRisk = 0,
  threshold = 0.5,
  isLoading = false,
  onThresholdChange = null,
  highlightZone = null
}, ref) => {
  const [selectedZone, setSelectedZone] = useState(null);
  const [localThreshold, setLocalThreshold] = useState(threshold);

  useImperativeHandle(ref, () => ({
    highlightRiskZone: (zone, explanation) => {
      setSelectedZone({ zone, explanation });
    },
    updateThreshold: (newThreshold) => {
      setLocalThreshold(newThreshold);
      if (onThresholdChange) onThresholdChange(newThreshold);
    },
    resetView: () => {
      setSelectedZone(null);
      setLocalThreshold(0.5);
    }
  }));

  // Debug logging
  console.log('🚨 ChurnRiskGauge component received data:', {
    data,
    hasData: !!data,
    isArray: Array.isArray(data),
    dataLength: data?.length,
    avgRisk,
    threshold,
    isLoading
  });

  // TEMPORARY: Let's try fetching data directly in the component to bypass spawning issues
  const [directApiData, setDirectApiData] = React.useState(null);
  const [directAvgRisk, setDirectAvgRisk] = React.useState(0.5);
  React.useEffect(() => {
    fetch('/api/retention-planner/data')
      .then(res => res.json())
      .then(result => {
        console.log('🔧 ChurnRiskGauge DIRECT API call result:', result.data?.visualizations?.churnRiskDistribution);
        setDirectApiData(result.data?.visualizations?.churnRiskDistribution);
        setDirectAvgRisk(result.data?.kpis?.avgChurnRisk || 0.5);
      })
      .catch(err => console.error('🔧 ChurnRiskGauge DIRECT API error:', err));
  }, []);

  // Use direct API data if available and spawned data is empty
  const actualData = (data?.length > 0) ? data : directApiData || data;
  const actualAvgRisk = (data?.length > 0) ? avgRisk : directAvgRisk;
  console.log('🔧 ChurnRiskGauge using data:', {
    usingSpawnedData: data?.length > 0,
    spawnedDataLength: data?.length,
    directDataLength: directApiData?.length,
    finalDataLength: actualData?.length,
    finalAvgRisk: actualAvgRisk
  });

  if (!actualData || actualData.length === 0) {
    return (
      <Card title="Churn Risk Distribution" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "320px",
            color: "#5891cb",
          }}
        >
          No risk data available
          <br/>
          <small style={{marginTop: '10px', fontSize: '12px', opacity: 0.7}}>
            Debug: hasData={String(!!actualData)}, isArray={String(Array.isArray(actualData))}, length={actualData?.length || 0}
          </small>
        </div>
      </Card>
    );
  }

  // Prepare gauge data
  const gaugeData = [{
    type: "indicator",
    mode: "gauge+number",
    value: actualAvgRisk,
    domain: { x: [0, 1], y: [0.3, 1] },
    title: { text: "Average Risk", font: { color: "#f7f9fb", size: 16 } },
    gauge: {
      axis: { 
        range: [null, 1], 
        tickcolor: "#f7f9fb",
        tickfont: { color: "#f7f9fb", size: 10 }
      },
      bar: { color: "#e930ff", thickness: 0.15 },
      bgcolor: "rgba(255,255,255,0.1)",
      borderwidth: 4,
      bordercolor: "#f7f9fb",
      steps: [
        { range: [0, 0.3], color: "rgba(58, 68, 89, 0.8)" },
        { range: [0.3, 0.7], color: "rgba(62, 123, 151, 0.8)" },
        { range: [0.7, 1], color: "rgba(0, 227, 255, 0.8)" }
      ],
      threshold: {
        line: { color: "#e930ff", width: 4 },
        thickness: 0.75,
        value: localThreshold
      }
    },
    number: { 
      font: { color: "#f7f9fb", size: 20 },
      valueformat: ".2f"
    }
  }];

  // Prepare histogram data
  const histogramColors = actualData.map(item => {
    const midpoint = parseFloat(item.range.split('-')[0]) + 0.1;
    if (midpoint < 0.3) return "rgba(58, 68, 89, 0.8)";
    if (midpoint < 0.7) return "rgba(62, 123, 151, 0.8)";
    return "rgba(0, 227, 255, 0.8)";
  });

  const histogramData = [{
    x: actualData.map(item => item.range),
    y: actualData.map(item => item.count),
    type: 'bar',
    name: 'Customer Count',
    marker: {
      color: histogramColors,
      line: {
        color: selectedZone ? "#e930ff" : "#f7f9fb",
        width: 1
      }
    },
    text: actualData.map(item => `${item.count} (${item.percentage.toFixed(1)}%)`),
    textposition: 'outside',
    textfont: { color: "#f7f9fb", size: 10 }
  }];

  // Add threshold line to histogram
  if (localThreshold > 0) {
    histogramData.push({
      x: actualData.map(item => item.range),
      y: actualData.map(() => Math.max(...actualData.map(d => d.count)) * 1.1),
      type: 'scatter',
      mode: 'lines',
      name: 'Risk Threshold',
      line: {
        color: "#e930ff",
        width: 2,
        dash: 'dash'
      },
      showlegend: false
    });
  }

  const gaugeLayout = {
    width: 420,
    height: 200,
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#f7f9fb" },
    margin: { t: 20, b: 20, l: 40, r: 40 }
  };

  const histogramLayout = {
    width: 420,
    height: 120,
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#f7f9fb" },
    xaxis: {
      title: "Risk Range",
      titlefont: { color: "#f7f9fb", size: 12 },
      tickfont: { color: "#f7f9fb", size: 10 },
      gridcolor: "rgba(247, 249, 251, 0.2)",
      zerolinecolor: "rgba(247, 249, 251, 0.2)"
    },
    yaxis: {
      title: "Count",
      titlefont: { color: "#f7f9fb", size: 12 },
      tickfont: { color: "#f7f9fb", size: 10 },
      gridcolor: "rgba(247, 249, 251, 0.2)",
      zerolinecolor: "rgba(247, 249, 251, 0.2)"
    },
    margin: { t: 10, b: 40, l: 50, r: 20 },
    bargap: 0.2
  };

  const plotConfig = {
    displayModeBar: false,
    staticPlot: false,
    responsive: true
  };

  const handleBarClick = (event) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const riskRange = point.x;
      setSelectedZone({ zone: riskRange, explanation: `Selected risk range: ${riskRange}` });
    }
  };

  return (
    <Card 
      title="Churn Risk Distribution" 
      subtitle={`${actualData.reduce((sum, item) => sum + item.count, 0)} customers analyzed`}
      isLoading={isLoading}
    >
      <div style={{ position: "relative" }}>
        {/* Gauge Chart */}
        <div style={{ marginBottom: "10px" }}>
          <Plot
            data={gaugeData}
            layout={gaugeLayout}
            config={plotConfig}
          />
        </div>

        {/* Histogram */}
        <div>
          <Plot
            data={histogramData}
            layout={histogramLayout}
            config={plotConfig}
            onClick={handleBarClick}
          />
        </div>

        {/* Selection indicator */}
        {selectedZone && (
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
            {selectedZone.explanation}
          </div>
        )}

        {/* Threshold control */}
        <div style={{ 
          marginTop: "10px", 
          padding: "10px",
          backgroundColor: "rgba(58, 68, 89, 0.3)",
          borderRadius: "8px"
        }}>
          <label style={{ color: "#f7f9fb", fontSize: "12px", marginRight: "10px" }}>
            Risk Threshold: {localThreshold.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localThreshold}
            onChange={(e) => {
              const newThreshold = parseFloat(e.target.value);
              setLocalThreshold(newThreshold);
              if (onThresholdChange) onThresholdChange(newThreshold);
            }}
            style={{
              width: "150px",
              accentColor: "#e930ff"
            }}
          />
        </div>
      </div>
    </Card>
  );
});

ChurnRiskGauge.displayName = 'ChurnRiskGauge';

export default ChurnRiskGauge; 