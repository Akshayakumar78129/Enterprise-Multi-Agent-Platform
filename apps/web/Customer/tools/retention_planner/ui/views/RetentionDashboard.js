import React, { useState, useEffect, useRef } from "react";
import RetentionKPITiles from "../components/kpi/RetentionKPITiles";
import ChurnRiskGauge from "../components/visualizations/ChurnRiskGauge";
import ValueRiskMatrix from "../components/visualizations/ValueRiskMatrix";
import ActionSankey from "../components/visualizations/ActionSankey";
import ROIWaterfall from "../components/visualizations/ROIWaterfall";

const RetentionDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    churn_risk_threshold: 0.5,
    customer_segments: null
  });

  // Component refs for AI control
  const riskGaugeRef = useRef();
  const matrixRef = useRef();
  const sankeyRef = useRef();
  const waterfallRef = useRef();

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/retention-planner/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThresholdChange = (newThreshold) => {
    setFilters(prev => ({ ...prev, churn_risk_threshold: newThreshold }));
  };

  const handleSegmentFilter = (segments) => {
    setFilters(prev => ({ 
      ...prev, 
      customer_segments: Array.isArray(segments) ? segments : [segments] 
    }));
  };

  const handleQuadrantClick = (quadrant) => {
    // Map quadrant to segments for filtering
    const quadrantSegmentMap = {
      'Nurture': ['Active, Loyal'],
      'Rescue': ['Active'],
      'Monitor': ['Prospect'],
      'Evaluate': ['Inactive']
    };
    
    if (quadrantSegmentMap[quadrant]) {
      handleSegmentFilter(quadrantSegmentMap[quadrant]);
    }
  };

  const handleActionClick = (action) => {
    // Highlight related components when action is selected
    if (waterfallRef.current) {
      waterfallRef.current.highlightAction(action, `Analyzing ${action} financial impact`);
    }
    if (sankeyRef.current) {
      sankeyRef.current.highlightAction(action, `Showing ${action} allocation`);
    }
  };

  const handleSegmentClick = (segment) => {
    handleSegmentFilter([segment]);
    if (sankeyRef.current) {
      sankeyRef.current.highlightSegment(segment, `Analyzing ${segment} value segment`);
    }
  };

  if (error) {
    return (
      <div style={{ 
        color: "#e930ff", 
        padding: "20px",
        backgroundColor: "#0a1224",
        minHeight: "100vh"
      }}>
        Error: {error}
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
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ 
          marginBottom: "8px", 
          color: "#00e0ff",
          fontSize: "32px",
          fontWeight: "600"
        }}>
          Retention Planner Dashboard
        </h1>
        <p style={{ 
          color: "#5891cb", 
          fontSize: "16px",
          margin: "0"
        }}>
          Strategic customer retention management and action planning
        </p>
      </div>

      {/* KPI Section */}
      <RetentionKPITiles kpis={data?.kpis} isLoading={isLoading} />

      {/* Filter Controls */}
      <div style={{
        marginBottom: "24px",
        padding: "16px",
        backgroundColor: "rgba(58, 68, 89, 0.2)",
        borderRadius: "12px",
        border: "1px solid #3a4459"
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "20px",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ color: "#f7f9fb", fontSize: "14px" }}>
              Risk Threshold:
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={filters.churn_risk_threshold}
              onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
              style={{ accentColor: "#e930ff" }}
            />
            <span style={{ color: "#00e0ff", fontSize: "12px", minWidth: "40px" }}>
              {filters.churn_risk_threshold.toFixed(2)}
            </span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ color: "#f7f9fb", fontSize: "14px" }}>
              Segments:
            </label>
            <select
              multiple
              value={filters.customer_segments || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                handleSegmentFilter(selected.length > 0 ? selected : null);
              }}
              style={{
                backgroundColor: "#232a36",
                color: "#f7f9fb",
                border: "1px solid #3a4459",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "12px"
              }}
            >
              <option value="Active">Active</option>
              <option value="Active, Loyal">Active, Loyal</option>
              <option value="Active, New">Active, New</option>
              <option value="Inactive">Inactive</option>
              <option value="Lost">Lost</option>
              <option value="Prospect">Prospect</option>
            </select>
          </div>

          <button
            onClick={() => {
              setFilters({ churn_risk_threshold: 0.5, customer_segments: null });
              // Reset all component views
              [riskGaugeRef, matrixRef, sankeyRef, waterfallRef].forEach(ref => {
                if (ref.current?.resetView) ref.current.resetView();
              });
            }}
            style={{
              padding: "6px 12px",
              backgroundColor: "rgba(0, 224, 255, 0.2)",
              color: "#00e0ff",
              border: "1px solid #00e0ff",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Primary Visualizations Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 500px 1fr",
          gap: "24px",
          marginBottom: "24px",
          alignItems: "start"
        }}
      >
        {/* Left Column: Risk Gauge */}
        <ChurnRiskGauge
          ref={riskGaugeRef}
          data={data?.visualizations?.churnRiskDistribution || []}
          avgRisk={data?.kpis?.avgChurnRisk || 0}
          threshold={filters.churn_risk_threshold}
          isLoading={isLoading}
          onThresholdChange={handleThresholdChange}
        />

        {/* Center Column: Value-Risk Matrix */}
        <ValueRiskMatrix
          ref={matrixRef}
          data={data?.visualizations?.valueRiskMatrix || {}}
          isLoading={isLoading}
          onQuadrantClick={handleQuadrantClick}
          onCustomerClick={(customerId) => {
            console.log(`Selected customer: ${customerId}`);
          }}
        />

        {/* Right Column: ROI Waterfall */}
        <ROIWaterfall
          ref={waterfallRef}
          data={data?.visualizations?.roiProjection || []}
          isLoading={isLoading}
          onActionClick={handleActionClick}
        />
      </div>

      {/* Secondary Visualizations */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "24px",
          marginBottom: "24px"
        }}
      >
        {/* Action Allocation Sankey */}
        <ActionSankey
          ref={sankeyRef}
          data={data?.visualizations?.actionAllocation || { nodes: [], links: [] }}
          isLoading={isLoading}
          onSegmentClick={handleSegmentClick}
          onActionClick={handleActionClick}
        />
      </div>

      {/* Segment Playbooks Section */}
      {data?.segmentPlaybooks && Object.keys(data.segmentPlaybooks).length > 0 && (
        <div style={{ marginTop: "32px" }}>
          <h2 style={{ 
            color: "#00e0ff", 
            fontSize: "24px", 
            marginBottom: "16px",
            fontWeight: "500"
          }}>
            Retention Playbooks
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
              gap: "20px",
            }}
          >
            {Object.entries(data.segmentPlaybooks).map(([segment, playbook]) => (
              <div
                key={segment}
                style={{
                  background: "linear-gradient(135deg, #232a36 0%, #2c3341 100%)",
                  borderRadius: "20px",
                  border: "1px solid #3a4459",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                  overflow: "hidden"
                }}
              >
                {/* Header */}
                <div style={{
                  background: "linear-gradient(135deg, #00e0ff 0%, #0080ff 100%)",
                  padding: "16px 20px",
                  color: "#0a1224"
                }}>
                  <h3 style={{ margin: "0", fontSize: "18px", fontWeight: "600" }}>
                    {segment}
                  </h3>
                  <div style={{ fontSize: "14px", opacity: 0.8 }}>
                    {Object.values(playbook).reduce((sum, cause) => sum + cause.customer_count, 0)} customers
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "20px" }}>
                  {Object.entries(playbook).map(([cause, details]) => (
                    <div key={cause} style={{ marginBottom: "16px" }}>
                      <div style={{
                        borderLeft: `4px solid ${
                          cause === 'Inactive' ? '#e930ff' :
                          cause === 'At Risk' ? '#aa45dd' : '#00e0ff'
                        }`,
                        paddingLeft: "12px",
                        marginBottom: "8px"
                      }}>
                        <h4 style={{ 
                          margin: "0 0 4px 0", 
                          fontSize: "16px", 
                          color: cause === 'Inactive' ? '#e930ff' :
                                 cause === 'At Risk' ? '#aa45dd' : '#00e0ff'
                        }}>
                          {cause}
                        </h4>
                        <div style={{ fontSize: "12px", color: "#5891cb" }}>
                          {details.customer_count} customers • {Math.round(details.avg_churn_risk * 100)}% avg risk
                        </div>
                      </div>

                      {details.recommended_actions.map((action, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 12px",
                            backgroundColor: "rgba(58, 68, 89, 0.3)",
                            borderRadius: "8px",
                            marginBottom: "6px",
                            fontSize: "12px"
                          }}
                        >
                          <div>
                            <div style={{ color: "#f7f9fb", fontWeight: "500" }}>
                              {action.action}
                            </div>
                            <div style={{ color: "#5891cb" }}>
                              {action.count} customers
                            </div>
                          </div>
                          <div style={{
                            backgroundColor: "rgba(0, 224, 255, 0.2)",
                            color: "#00e0ff",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: "600"
                          }}>
                            {Math.round(action.avg_effectiveness * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RetentionDashboard; 