import React, { useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import InfoTip from "../../../../../../ui-common/design-system/components/InfoTip";
import { emitInsight, insightBuilders } from "../../../../../../ui-common/utils/aiinsights";

const VarianceDecomposition = ({
  data = {},
  selectedKPI = null,
  onKPISelect = null,
  showComparison = false,
  isLoading = false
}) => {
  const [selectedVarianceKPI, setSelectedVarianceKPI] = useState(selectedKPI);
  const availableKPIs = Object.keys(data);
  const currentKPI = selectedVarianceKPI || availableKPIs[0];

  const handleKPIChange = (kpi) => { setSelectedVarianceKPI(kpi); onKPISelect?.(kpi); };
  if (isLoading) return (<Card title="Variance Decomposition" isLoading><div style={{ height: 400 }} /></Card>);
  if (!availableKPIs.length) return (<Card title="Variance Decomposition"><div style={{ height: 400, display:'grid', placeItems:'center', color:'#5891cb' }}>No variance data available</div></Card>);
  const currentData = data[currentKPI]; if (!currentData) return (<Card title="Variance Decomposition"><div style={{ height:400, display:'grid', placeItems:'center', color:'#5891cb' }}>No data available for selected KPI</div></Card>);

  const onExplainVariance = () => {
    emitInsight(
      insightBuilders.variance({
        kpi: currentKPI,
        explanationPower: currentData.explanation_power,
        explained: currentData.explained_variance,
        unexplained: currentData.unexplained_variance
      })
    );
  };

  return (
    <Card
      title="Variance Decomposition"
      subtitle={`Model explanation power for ${formatKPIName(currentKPI)}`}
      actions={
        <InfoTip label="Variance Decomposition">
          Shows how much of total variance is **explained** by the model vs **unexplained** residuals.  
          Click the donut or bars to ask the AI what’s driving the split and how to improve it.
        </InfoTip>
      }
    >
      <div style={{ display:'flex', alignItems:'center', gap: 24, marginBottom: 16 }}>
        <label style={{ color:'#f7f9fb', fontSize:14, fontWeight:500 }}>KPI:</label>
        <select value={currentKPI} onChange={(e)=>handleKPIChange(e.target.value)}
          style={{ padding:'6px 12px', borderRadius:6, border:'1px solid #3a4459', background:'#232a36', color:'#f7f9fb', fontSize:14 }}>
          {availableKPIs.map(k => (<option key={k} value={k}>{formatKPIName(k)}</option>))}
        </select>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: showComparison ? '1fr 1fr' : '400px 1fr', gap:24, alignItems:'center' }}>
        <div onClick={onExplainVariance} style={{ display:'flex', justifyContent:'center', alignItems:'center', position:'relative', cursor:'pointer' }}>
          <DonutChart
            explainedVariance={currentData.explained_variance}
            unexplainedVariance={currentData.unexplained_variance}
            totalVariance={currentData.total_variance}
            explanationPower={currentData.explanation_power}
          />
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:16, marginBottom:20 }}>
            <MetricCard label="Explanation Power" value={`${currentData.explanation_power.toFixed(1)}%`} subtitle="Model Accuracy" variant={getExplanationVariant(currentData.explanation_power)} icon="🎯" />
            <MetricCard label="Model R²" value={`${currentData.model_accuracy.toFixed(1)}%`} subtitle="Prediction Quality" variant={getAccuracyVariant(currentData.model_accuracy)} icon="📊" />
            <MetricCard label="MAE" value={currentData.mean_absolute_error.toFixed(2)} subtitle="Avg Error" variant="default" icon="📏" />
            <MetricCard label="RMSE" value={currentData.rmse.toFixed(2)} subtitle="Root Mean Sq Error" variant="default" icon="📐" />
          </div>

          <div style={{ padding:16, background:'rgba(58,68,89,.2)', borderRadius:8 }}>
            <h4 style={{ color:'#f7f9fb', margin:'0 0 12px', fontSize:16, fontWeight:600 }}>Variance Breakdown</h4>
            <div onClick={onExplainVariance}>
              <VarianceBar label="Explained Variance" value={currentData.explained_variance} total={currentData.total_variance} color="#00e0ff" />
              <VarianceBar label="Unexplained Variance" value={currentData.unexplained_variance} total={currentData.total_variance} color="#e930ff" />
            </div>
            <div style={{ marginTop:12, padding:8, background:'rgba(26,32,56,.6)', borderRadius:4, fontSize:12, color:'#5891cb' }}>
              Total Variance: {currentData.total_variance.toFixed(2)}
            </div>
          </div>

          <div style={{ marginTop:16, padding:12, background:getQualityBackgroundColor(currentData.explanation_power),
                        borderRadius:8, border:`2px solid ${getQualityBorderColor(currentData.explanation_power)}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:20 }}>{getQualityIcon(currentData.explanation_power)}</span>
              <div>
                <div style={{ color:'#f7f9fb', fontWeight:600 }}>{getQualityLabel(currentData.explanation_power)}</div>
                <div style={{ color:'#5891cb', fontSize:12 }}>{getQualityDescription(currentData.explanation_power)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop:20, padding:12, background:'rgba(58,68,89,.1)', borderRadius:8 }}>
        <h4 style={{ color:'#f7f9fb', margin:'0 0 8px', fontSize:14, fontWeight:600 }}>Model Stability Over Time</h4>
        <TimeStabilityChart explanationPower={currentData.explanation_power} />
      </div>
    </Card>
  );
};

/* --- (chart helpers unchanged from your version, omitted for brevity) --- */
const DonutChart = ({ explainedVariance, unexplainedVariance, totalVariance, explanationPower }) => {
  const size = 300, strokeWidth = 24, radius = (size - strokeWidth) / 2, circumference = 2 * Math.PI * radius;
  const explainedPct = totalVariance > 0 ? (explainedVariance / totalVariance) : 0;
  const explainedStroke = circumference * explainedPct;
  const unexplainedStroke = circumference * (1 - explainedPct);
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} stroke="#232a36" strokeWidth={strokeWidth} fill="transparent" />
        <circle cx={size/2} cy={size/2} r={radius} stroke="#00e0ff" strokeWidth={strokeWidth} fill="transparent"
                strokeDasharray={`${explainedStroke} ${circumference - explainedStroke}`} strokeLinecap="round" />
        <circle cx={size/2} cy={size/2} r={radius} stroke="#e930ff" strokeWidth={strokeWidth} fill="transparent"
                strokeDasharray={`${unexplainedStroke} ${circumference - unexplainedStroke}`} strokeDashoffset={-explainedStroke} strokeLinecap="round" />
      </svg>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
        <div style={{ color:'#f7f9fb', fontSize:24, fontWeight:700 }}>{explanationPower.toFixed(1)}%</div>
        <div style={{ color:'#5891cb', fontSize:12, marginTop:4 }}>Explained</div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, subtitle, variant, icon }) => (
  <div style={{ padding:12, background:'rgba(26,32,56,.6)', borderRadius:8, borderLeft:`4px solid ${getVariantColor(variant)}` }}>
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <span style={{ color:'#f7f9fb', fontSize:14, fontWeight:600 }}>{label}</span>
    </div>
    <div style={{ color:'#f7f9fb', fontSize:20, fontWeight:700, marginBottom:2 }}>{value}</div>
    <div style={{ color:'#5891cb', fontSize:12 }}>{subtitle}</div>
  </div>
);

const VarianceBar = ({ label, value, total, color }) => {
  const pct = total>0 ? (value/total)*100 : 0;
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ color:'#f7f9fb', fontSize:12 }}>{label}</span>
        <span style={{ color:'#f7f9fb', fontSize:12, fontWeight:600 }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height:6, background:'#232a36', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width .3s ease' }} />
      </div>
    </div>
  );
};

const TimeStabilityChart = ({ explanationPower }) => {
  const points = Array.from({ length: 30 }, (_, i) => Math.max(0, Math.min(100, explanationPower + Math.sin(i/3)*6)));
  const max = Math.max(...points), min = Math.min(...points);
  return (
    <div style={{ height:60, position:'relative' }}>
      <svg width="100%" height="60" style={{ overflow:'visible' }}>
        <polyline
          points={points.map((p,i)=> `${(i/(points.length-1))*100},${60 - ((p-min)/(max-min))*40}`).join(' ')}
          fill="none" stroke="#00e0ff" strokeWidth="2" vectorEffect="non-scaling-stroke"
        />
        <line x1="0" y1={60 - ((explanationPower-min)/(max-min))*40} x2="100" y2={60 - ((explanationPower-min)/(max-min))*40}
              stroke="#5fd4d6" strokeWidth="1" strokeDasharray="3,3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ position:'absolute', top:'50%', right:0, transform:'translateY(-50%)', color:'#5891cb', fontSize:10 }}>
        Avg: {explanationPower.toFixed(1)}%
      </div>
    </div>
  );
};

function formatKPIName(n){return n.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase());}
function getVariantColor(v){return v==='success'?'#00e0ff':v==='warning'?'#ffa500':v==='danger'?'#e930ff':'#3a4459';}
function getExplanationVariant(p){return p>=80?'success':p>=60?'warning':'danger';}
function getAccuracyVariant(a){return a>=80?'success':a>=70?'warning':'danger';}
function getQualityLabel(p){return p>=80?'Excellent Model':p>=60?'Good Model':p>=40?'Fair Model':'Poor Model';}
function getQualityDescription(p){return p>=80?'High confidence in predictions':p>=60?'Moderate confidence':p>=40?'Low confidence':'Very low confidence';}
function getQualityIcon(p){return p>=80?'🌟':p>=60?'✅':p>=40?'⚠️':'❌';}
function getQualityBackgroundColor(p){return p>=80?'rgba(0,224,255,.1)':p>=60?'rgba(255,165,0,.1)':'rgba(233,48,255,.1)';}
function getQualityBorderColor(p){return p>=80?'#00e0ff':p>=60?'#ffa500':'#e930ff';}

export default VarianceDecomposition;
