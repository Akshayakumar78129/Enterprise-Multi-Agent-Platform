import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const ActionSankey = forwardRef(({
  data = { nodes: [], links: [] },
  isLoading = false,
  onSegmentClick = null,
  onActionClick = null
}, ref) => {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);

  useImperativeHandle(ref, () => ({
    highlightSegment: (segment, explanation) => {
      setSelectedSegment({ segment, explanation });
    },
    highlightAction: (action, explanation) => {
      setSelectedAction({ action, explanation });
    },
    resetView: () => {
      setSelectedSegment(null);
      setSelectedAction(null);
    }
  }));

  // Debug logging
  console.log('🚨 ActionSankey component received data:', {
    data,
    hasData: !!data,
    hasLinks: !!data.links,
    linkCount: data.links?.length,
    hasNodes: !!data.nodes,
    nodeCount: data.nodes?.length,
    isLoading,
    rawData: JSON.stringify(data)
  });

  // TEMPORARY: Let's try fetching data directly in the component to bypass spawning issues
  const [directApiData, setDirectApiData] = React.useState(null);
  React.useEffect(() => {
    fetch('/api/retention-planner/data')
      .then(res => res.json())
      .then(result => {
        console.log('🔧 ActionSankey DIRECT API call result:', result.data?.visualizations?.actionAllocation);
        setDirectApiData(result.data?.visualizations?.actionAllocation);
      })
      .catch(err => console.error('🔧 ActionSankey DIRECT API error:', err));
  }, []);

  // Use direct API data if available and spawned data is empty
  const actualData = (data.links?.length > 0) ? data : directApiData || data;
  console.log('🔧 ActionSankey using data:', {
    usingSpawnedData: data.links?.length > 0,
    spawnedLinkCount: data.links?.length,
    directLinkCount: directApiData?.links?.length,
    finalLinkCount: actualData?.links?.length
  });

  if (!actualData?.links || actualData.links.length === 0) {
    return (
      <Card title="Retention Action Allocation" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            color: "#5891cb",
          }}
        >
          No action allocation data available
          <br/>
          <small style={{marginTop: '10px', fontSize: '12px', opacity: 0.7}}>
            Debug: hasData={String(!!actualData)}, hasLinks={String(!!actualData?.links)}, linkCount={actualData?.links?.length || 0}
          </small>
        </div>
      </Card>
    );
  }

  // Group data by segment for stacked bar chart
  const segments = ['High', 'Medium', 'Low'];
  const actions = [...new Set(actualData.links.map(link => link.target))];
  
  const segmentColors = {
    'High': '#00e0ff',
    'Medium': '#5fd4d6', 
    'Low': '#3a4459'
  };

  const actionColors = {
    'Premium package': '#d442f5',
    'Loyalty upgrade': '#aa45dd',
    'Standard package': '#5891cb',
    'Targeted discount': '#43cad0',
    'Basic offer': '#68809f',
    'Standard comm': '#3a4459',
    'No action needed': '#232a36'
  };

  // Create stacked bar data
  const stackedData = actions.map(action => {
    const actionData = segments.map(segment => {
      const link = actualData.links.find(l => l.source === segment && l.target === action);
      return link ? link.value : 0;
    });

    return {
      x: segments,
      y: actionData,
      name: action,
      type: 'bar',
      marker: {
        color: actionColors[action] || '#68809f',
        opacity: (selectedAction && selectedAction.action !== action) ? 0.3 : 0.85,
        line: {
          color: '#f7f9fb',
          width: 1
        }
      },
      text: actionData.map((value, idx) => value > 0 ? `${value}` : ''),
      textposition: 'inside',
      textfont: { color: '#f7f9fb', size: 10 },
      hovertemplate: `<b>%{fullData.name}</b><br>Segment: %{x}<br>Customers: %{y}<extra></extra>`
    };
  });

  // Create side-by-side comparison chart
  const sankeyTraces = [];
  
  // Left side - segments
  const segmentTotals = segments.map(segment => 
            actualData.links.filter(l => l.source === segment).reduce((sum, l) => sum + l.value, 0)
  );

  sankeyTraces.push({
    x: Array(segments.length).fill('Segments'),
    y: segmentTotals,
    name: 'Customer Segments',
    type: 'bar',
    marker: {
      color: segments.map(segment => segmentColors[segment]),
      opacity: 0.8
    },
    text: segments.map((segment, idx) => `${segment}<br>${segmentTotals[idx]}`),
    textposition: 'inside',
    textfont: { color: '#f7f9fb', size: 11 },
    offsetgroup: 1,
    hovertemplate: `<b>%{text}</b> customers<extra></extra>`
  });

  // Right side - actions  
  const actionTotals = actions.map(action =>
            actualData.links.filter(l => l.target === action).reduce((sum, l) => sum + l.value, 0)
  );

  sankeyTraces.push({
    x: Array(actions.length).fill('Actions'),
    y: actionTotals,
    name: 'Retention Actions',
    type: 'bar',
    marker: {
      color: actions.map(action => actionColors[action] || '#68809f'),
      opacity: 0.8
    },
    text: actions.map((action, idx) => `${action}<br>${actionTotals[idx]}`),
    textposition: 'inside',
    textfont: { color: '#f7f9fb', size: 9 },
    offsetgroup: 2,
    hovertemplate: `<b>%{text}</b> customers<extra></extra>`
  });

  const layout = {
    width: 620,
    height: 400,
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#f7f9fb" },
    title: {
      text: "Customer Flow: Segments → Actions",
      font: { color: "#f7f9fb", size: 16 },
      x: 0.5
    },
    xaxis: {
      title: "",
      titlefont: { color: "#f7f9fb", size: 12 },
      tickfont: { color: "#f7f9fb", size: 11 },
      gridcolor: "rgba(247, 249, 251, 0.1)",
      zerolinecolor: "rgba(247, 249, 251, 0.1)"
    },
    yaxis: {
      title: "Customer Count",
      titlefont: { color: "#f7f9fb", size: 12 },
      tickfont: { color: "#f7f9fb", size: 11 },
      gridcolor: "rgba(247, 249, 251, 0.1)",
      zerolinecolor: "rgba(247, 249, 251, 0.1)"
    },
    margin: { t: 50, b: 60, l: 60, r: 20 },
    barmode: 'group',
    bargap: 0.4,
    bargroupgap: 0.8,
    showlegend: false
  };

  const plotConfig = {
    displayModeBar: false,
    staticPlot: false,
    responsive: true
  };

  const handleBarClick = (event) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const traceName = point.fullData.name;
      
      if (traceName === 'Customer Segments') {
        const segment = segments[point.pointIndex];
        setSelectedSegment({ segment, explanation: `Selected ${segment} value segment` });
        if (onSegmentClick) onSegmentClick(segment);
      } else if (traceName === 'Retention Actions') {
        const action = actions[point.pointIndex];
        setSelectedAction({ action, explanation: `Selected ${action} action` });
        if (onActionClick) onActionClick(action);
      }
    }
  };

  return (
    <Card 
      title="Retention Action Allocation" 
      subtitle={`${actualData.links.reduce((sum, link) => sum + link.value, 0)} customers assigned actions`}
      isLoading={isLoading}
    >
      <div style={{ position: "relative" }}>
        <Plot
          data={sankeyTraces}
          layout={layout}
          config={plotConfig}
          onClick={handleBarClick}
        />

        {/* Detailed breakdown below */}
        <div style={{ marginTop: "20px" }}>
          <h4 style={{ color: "#00e0ff", fontSize: "14px", marginBottom: "10px" }}>
            Action Breakdown by Segment
          </h4>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
            fontSize: "11px"
          }}>
            {actualData.links.map((link, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "rgba(58, 68, 89, 0.3)",
                  padding: "8px",
                  borderRadius: "6px",
                  border: `1px solid ${segmentColors[link.source] || '#3a4459'}`,
                  opacity: (selectedSegment && selectedSegment.segment !== link.source) ||
                           (selectedAction && selectedAction.action !== link.target) ? 0.5 : 1
                }}
              >
                <div style={{ color: segmentColors[link.source], fontWeight: "bold" }}>
                  {link.source}
                </div>
                <div style={{ color: "#f7f9fb", fontSize: "10px" }}>
                  → {link.target}
                </div>
                <div style={{ color: actionColors[link.target] || '#68809f', fontWeight: "bold" }}>
                  {link.value} customers
                </div>
                {link.effectiveness && (
                  <div style={{ color: "#5891cb", fontSize: "9px" }}>
                    {Math.round(link.effectiveness * 100)}% effective
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selection indicators */}
        {(selectedSegment || selectedAction) && (
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
            {selectedSegment?.explanation || selectedAction?.explanation}
          </div>
        )}
      </div>
    </Card>
  );
});

ActionSankey.displayName = 'ActionSankey';

export default ActionSankey; 