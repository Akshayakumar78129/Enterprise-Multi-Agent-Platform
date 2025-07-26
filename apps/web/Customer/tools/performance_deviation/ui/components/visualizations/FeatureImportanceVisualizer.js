import React, { useState, useMemo } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";

const FeatureImportanceVisualizer = ({
  data = { aggregated: [], byKPI: {} },
  selectedKPI = null,
  onFeatureSelect = null,
  significanceThreshold = 0.1,
  isLoading = false
}) => {
  const [viewMode, setViewMode] = useState("aggregated"); // "aggregated", "by_kpi", "flow"
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Get the data to display based on view mode
  const displayData = useMemo(() => {
    if (viewMode === "aggregated") {
      return data.aggregated.filter(f => f.avg_importance >= significanceThreshold / 100);
    } else if (viewMode === "by_kpi" && selectedKPI && data.byKPI[selectedKPI]) {
      return data.byKPI[selectedKPI].feature_importance
        .filter(f => f.importance >= significanceThreshold / 100)
        .map(f => ({ ...f, avg_importance: f.importance }));
    }
    return [];
  }, [data, viewMode, selectedKPI, significanceThreshold]);

  const maxImportance = displayData.length > 0 
    ? Math.max(...displayData.map(d => d.avg_importance)) 
    : 1;

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    if (onFeatureSelect) {
      onFeatureSelect(feature.feature);
    }
  };

  if (isLoading) {
    return (
      <Card title="Feature Importance" isLoading={true}>
        <div style={{ height: "480px" }} />
      </Card>
    );
  }

  if (displayData.length === 0) {
    return (
      <Card title="Feature Importance">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "480px",
            color: "#5891cb",
          }}
        >
          No feature importance data available
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Feature Importance"
      subtitle={`${displayData.length} factors above ${significanceThreshold}% threshold`}
    >
      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '16px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* View Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '500' }}>
            View:
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { value: 'aggregated', label: 'All KPIs' },
              { value: 'by_kpi', label: 'By KPI' },
              { value: 'flow', label: 'Flow Diagram' }
            ].map(mode => (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: viewMode === mode.value ? '#00e0ff' : '#232a36',
                  color: viewMode === mode.value ? '#0a1224' : '#f7f9fb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Selector (for by_kpi view) */}
        {viewMode === 'by_kpi' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '500' }}>
              KPI:
            </label>
            <select
              value={selectedKPI || ''}
              onChange={(e) => setSelectedKPI(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #3a4459',
                backgroundColor: '#232a36',
                color: '#f7f9fb',
                fontSize: '14px'
              }}
            >
              <option value="">Select KPI</option>
              {Object.keys(data.byKPI).map(kpi => (
                <option key={kpi} value={kpi}>
                  {formatFeatureName(kpi)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Threshold Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '500' }}>
            Threshold: {significanceThreshold}%
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={significanceThreshold}
            onChange={(e) => setSignificanceThreshold(Number(e.target.value))}
            style={{
              width: '100px',
              accentColor: '#00e0ff'
            }}
          />
        </div>
      </div>

      {/* Feature Importance Bars */}
      {viewMode !== 'flow' && (
        <div style={{ 
          height: "400px", 
          overflowY: 'auto',
          padding: '8px',
          backgroundColor: 'rgba(58, 68, 89, 0.1)',
          borderRadius: '8px'
        }}>
          {displayData.map((feature, index) => {
            const barWidth = (feature.avg_importance / maxImportance) * 100;
            const isPositive = feature.avg_importance > 0;
            const isSelected = selectedFeature?.feature === feature.feature;

            return (
              <div
                key={feature.feature}
                onClick={() => handleFeatureClick(feature)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 0',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  backgroundColor: isSelected ? 'rgba(0, 224, 255, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Feature Name */}
                <div style={{
                  width: '150px',
                  color: '#f7f9fb',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'right',
                  paddingRight: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {formatFeatureName(feature.feature)}
                </div>

                {/* Bar Container */}
                <div style={{
                  flex: 1,
                  height: '36px',
                  position: 'relative',
                  backgroundColor: '#232a36',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginRight: '12px'
                }}>
                  {/* Impact Bar */}
                  <div
                    style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: isPositive 
                        ? 'linear-gradient(90deg, #00e0ff, #5fd4d6)'
                        : 'linear-gradient(90deg, #e930ff, #d442f5)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '8px'
                    }}
                  >
                    <span style={{
                      color: '#f7f9fb',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {(feature.avg_importance * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Category Icon */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  {getFeatureIcon(feature.feature)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flow Diagram View */}
      {viewMode === 'flow' && (
        <div style={{ 
          height: "400px",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(58, 68, 89, 0.1)',
          borderRadius: '8px',
          position: 'relative'
        }}>
          <FlowDiagram 
            features={displayData.slice(0, 6)} // Show top 6 features
            selectedKPI={selectedKPI}
            onFeatureSelect={handleFeatureClick}
          />
        </div>
      )}

      {/* Impact Scale Legend */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        justifyContent: 'center'
      }}>
        <span style={{ color: '#5891cb', fontSize: '12px' }}>Low Impact</span>
        <div style={{
          width: '200px',
          height: '12px',
          background: 'linear-gradient(90deg, #232a36, #00e0ff)',
          borderRadius: '6px'
        }} />
        <span style={{ color: '#5891cb', fontSize: '12px' }}>High Impact</span>
      </div>

      {/* Selected Feature Details */}
      {selectedFeature && viewMode === 'aggregated' && selectedFeature.kpi_details && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: 'rgba(58, 68, 89, 0.2)',
          borderRadius: '8px'
        }}>
          <h4 style={{ color: '#f7f9fb', marginBottom: '8px' }}>
            {formatFeatureName(selectedFeature.feature)} - KPI Breakdown
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '8px'
          }}>
            {Object.entries(selectedFeature.kpi_details).map(([kpi, importance]) => (
              <div key={kpi} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 8px',
                backgroundColor: 'rgba(26, 32, 56, 0.6)',
                borderRadius: '4px'
              }}>
                <span style={{ color: '#5891cb', fontSize: '12px' }}>
                  {formatFeatureName(kpi)}
                </span>
                <span style={{ color: '#f7f9fb', fontSize: '12px', fontWeight: '600' }}>
                  {(importance * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// Flow Diagram Component
const FlowDiagram = ({ features, selectedKPI, onFeatureSelect }) => {
  const centerX = 200;
  const centerY = 200;
  const radius = 120;

  return (
    <svg width="400" height="400" style={{ overflow: 'visible' }}>
      {/* Central KPI Node */}
      <circle
        cx={centerX}
        cy={centerY}
        r="40"
        fill="#00e0ff"
        stroke="#f7f9fb"
        strokeWidth="2"
      />
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#0a1224"
        fontSize="12"
        fontWeight="600"
      >
        KPI
      </text>

      {/* Factor Nodes */}
      {features.map((feature, index) => {
        const angle = (index / features.length) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const lineWidth = Math.max(2, feature.avg_importance * 20);

        return (
          <g key={feature.feature}>
            {/* Connection Line */}
            <line
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke={feature.avg_importance > 0 ? "#00e0ff" : "#e930ff"}
              strokeWidth={lineWidth}
              opacity="0.6"
            />
            
            {/* Factor Node */}
            <circle
              cx={x}
              cy={y}
              r="32"
              fill="#232a36"
              stroke={feature.avg_importance > 0 ? "#00e0ff" : "#e930ff"}
              strokeWidth="2"
              style={{ cursor: 'pointer' }}
              onClick={() => onFeatureSelect(feature)}
            />
            
            {/* Factor Icon */}
            <text
              x={x}
              y={y - 8}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
            >
              {getFeatureIcon(feature.feature)}
            </text>
            
            {/* Factor Importance */}
            <text
              x={x}
              y={y + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#f7f9fb"
              fontSize="10"
              fontWeight="600"
            >
              {(feature.avg_importance * 100).toFixed(0)}%
            </text>
            
            {/* Factor Label */}
            <text
              x={x}
              y={y + 50}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#5891cb"
              fontSize="10"
            >
              {formatFeatureName(feature.feature).slice(0, 10)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// Helper functions
function formatFeatureName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace('Is ', '')
    .replace('Condition ', '');
}

function getFeatureIcon(feature) {
  if (feature.includes('weekend')) return '📅';
  if (feature.includes('holiday')) return '🎉';
  if (feature.includes('season')) return '🌤️';
  if (feature.includes('market')) return '📈';
  if (feature.includes('competitor')) return '🏢';
  if (feature.includes('economic')) return '💰';
  if (feature.includes('promotional')) return '🎯';
  return '📊';
}

export default FeatureImportanceVisualizer; 