import React, { useState, useMemo } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import InfoTip from "../../../../../../ui-common/design-system/components/InfoTip";
import { emitInsight, insightBuilders } from "../../../../../../ui-common/utils/aiinsights";

const FeatureImportanceVisualizer = ({
  data = { aggregated: [], byKPI: {} },
  selectedKPI = null,
  onFeatureSelect = null,
  significanceThreshold = 0.1,
  isLoading = false
}) => {
  const [viewMode, setViewMode] = useState("aggregated");
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [threshold, setThreshold] = useState(significanceThreshold);

  const displayData = useMemo(() => {
    if (viewMode === "aggregated") {
      return (data.aggregated || []).filter(f => f.avg_importance >= threshold / 100);
    } else if (viewMode === "by_kpi" && selectedKPI && data.byKPI[selectedKPI]) {
      return (data.byKPI[selectedKPI].feature_importance || [])
        .filter(f => f.importance >= threshold / 100)
        .map(f => ({ ...f, avg_importance: f.importance }));
    }
    return [];
  }, [data, viewMode, selectedKPI, threshold]);

  const maxImportance = displayData.length ? Math.max(...displayData.map(d => d.avg_importance)) : 1;

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    onFeatureSelect?.(feature.feature);
    emitInsight(
      insightBuilders.factor({
        kpi: selectedKPI || 'all_kpis',
        feature: feature.feature,
        importance: feature.avg_importance
      })
    );
  };

  if (isLoading) return (<Card title="Feature Importance" isLoading><div style={{ height: 480 }} /></Card>);
  if (!displayData.length) {
    return (
      <Card title="Feature Importance" actions={<InfoTip>Shows which factors (derived from time) explain variance—e.g., weekend vs weekday, month, and seasonality.</InfoTip>}>
        <div style={{ height: 480, display: "grid", placeItems: "center", color: "#5891cb" }}>No feature importance data available</div>
      </Card>
    );
  }

  return (
    <Card
      title="Feature Importance"
      subtitle={`${displayData.length} factors ≥ ${threshold}%`}
      actions={
        <InfoTip label="Factor Attribution">
          Impact bars show **relative contribution** of each factor to explained variance.  
          Click a bar to send it to the AI assistant for a plain-English explanation and examples.
        </InfoTip>
      }
    >
      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ color: '#f7f9fb', fontSize: 14, fontWeight: 500 }}>View:</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { value: 'aggregated', label: 'All KPIs' },
              { value: 'by_kpi', label: 'By KPI' },
              { value: 'flow', label: 'Flow Diagram' }
            ].map(m => (
              <button key={m.value} onClick={()=>setViewMode(m.value)}
                style={{ padding:'6px 12px', fontSize:12, borderRadius:4, border:'1px solid #3a4459',
                         backgroundColor: viewMode===m.value?'#00e0ff':'#232a36', color: viewMode===m.value?'#0a1224':'#f7f9fb' }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'by_kpi' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: '#f7f9fb', fontSize: 14, fontWeight: 500 }}>KPI:</label>
            <select value={selectedKPI || ''} onChange={(e)=> (e.target.value ? location && null : null, onFeatureSelect && null, setSelectedFeature(null), setSelectedKPI(e.target.value))}
              style={{ padding:'6px 12px', borderRadius:6, border:'1px solid #3a4459', background:'#232a36', color:'#f7f9fb', fontSize:14 }}>
              <option value="">Select KPI</option>
              {Object.keys(data.byKPI).map(k => (<option key={k} value={k}>{formatFeatureName(k)}</option>))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ color: '#f7f9fb', fontSize: 14, fontWeight: 500 }}>Threshold: {threshold}%</label>
          <input type="range" min="0" max="20" step="1" value={threshold}
                 onChange={(e)=> setThreshold(Number(e.target.value))} style={{ width: 100, accentColor: '#00e0ff' }} />
        </div>
      </div>

      {/* Bars */}
      {viewMode !== 'flow' && (
        <div style={{ height: 400, overflowY:'auto', padding: 8, background:'rgba(58,68,89,.1)', borderRadius:8 }}>
          {displayData.map((feature) => {
            const w = (feature.avg_importance / maxImportance) * 100;
            return (
              <div key={feature.feature} onClick={()=>handleFeatureClick(feature)}
                   style={{ display:'flex', alignItems:'center', padding:'8px 0', cursor:'pointer',
                            borderRadius:4, background: selectedFeature?.feature===feature.feature ? 'rgba(0,224,255,.1)' : 'transparent' }}>
                <div style={{ width:150, color:'#f7f9fb', fontSize:14, fontWeight:500, textAlign:'right', paddingRight:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {formatFeatureName(feature.feature)}
                </div>
                <div style={{ flex:1, height:36, position:'relative', background:'#232a36', borderRadius:4, overflow:'hidden', marginRight:12 }}>
                  <div style={{
                    height:'100%', width:`${w}%`,
                    background: 'linear-gradient(90deg, #00e0ff, #5fd4d6)',
                    borderRadius:4, transition:'width .3s ease',
                    display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:8
                  }}>
                    <span style={{ color:'#f7f9fb', fontSize:14, fontWeight:600 }}>{(feature.avg_importance*100).toFixed(1)}%</span>
                  </div>
                </div>
                <div style={{ width:24, height:24, display:'grid', placeItems:'center', fontSize:16 }}>📊</div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'flow' && (
        <div style={{ height: 400, display:'grid', placeItems:'center', background:'rgba(58,68,89,.1)', borderRadius:8 }}>
          <FlowDiagram features={displayData.slice(0,6)} selectedKPI={selectedKPI}
            onFeatureSelect={(f)=>handleFeatureClick(f)} />
        </div>
      )}
    </Card>
  );
};

const FlowDiagram = ({ features, selectedKPI, onFeatureSelect }) => {
  const centerX = 200, centerY = 200, radius = 120;
  return (
    <svg width="400" height="400" style={{ overflow: 'visible' }}>
      <circle cx={centerX} cy={centerY} r="40" fill="#00e0ff" stroke="#f7f9fb" strokeWidth="2" />
      <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="middle" fill="#0a1224" fontSize="12" fontWeight="600">KPI</text>
      {features.map((feature, index) => {
        const angle = (index / features.length) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const lineWidth = Math.max(2, feature.avg_importance * 20);
        return (
          <g key={feature.feature} onClick={()=>onFeatureSelect(feature)} style={{ cursor:'pointer' }}>
            <line x1={centerX} y1={centerY} x2={x} y2={y} stroke="#00e0ff" strokeWidth={lineWidth} opacity="0.6" />
            <circle cx={x} cy={y} r="32" fill="#232a36" stroke="#00e0ff" strokeWidth="2" />
            <text x={x} y={y + 8} textAnchor="middle" dominantBaseline="middle" fill="#f7f9fb" fontSize="10" fontWeight="600">
              {(feature.avg_importance * 100).toFixed(0)}%
            </text>
            <text x={x} y={y + 50} textAnchor="middle" dominantBaseline="middle" fill="#5891cb" fontSize="10">
              {formatFeatureName(feature.feature).slice(0, 10)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

function formatFeatureName(name) { return name.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase()).replace('Is ','').replace('Condition ',''); }

export default FeatureImportanceVisualizer;
