import React, { useState, useMemo } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import InfoTip from "../../../../../../ui-common/design-system/components/InfoTip";
import { emitInsight, insightBuilders } from "../../../../../../ui-common/utils/aiinsights";

const DeviationPatternExplorer = ({
  data = { calendar: {}, monthlyStats: {}, patterns: [] },
  selectedYear = null,
  onYearSelect = null,
  significanceThreshold = 0.5,
  onThresholdChange = null,
  isLoading = false
}) => {
  const [viewMode, setViewMode] = useState("calendar");
  const availableYears = Object.keys(data.calendar).map(Number).sort();
  const currentYear = selectedYear || (availableYears[0] || new Date().getFullYear());

  const filteredPatterns = useMemo(() =>
    (data.patterns || []).filter(p => Math.abs(p.deviation_magnitude) >= significanceThreshold),
  [data.patterns, significanceThreshold]);

  if (isLoading) return (<Card title="Deviation Pattern Explorer" isLoading><div style={{ height: 480 }} /></Card>);
  if (!availableYears.length) {
    return (<Card title="Deviation Pattern Explorer"><div style={{ height: 480, display:'grid', placeItems:'center', color:'#5891cb' }}>No deviation pattern data available</div></Card>);
  }

  return (
    <Card
      title="Deviation Pattern Explorer"
      subtitle={`${filteredPatterns.length} significant deviations`}
      actions={
        <InfoTip label="Anomaly Detection">
          Calendar / timeline of **where** deviations cluster.  
          Colors: magenta = negative, cyan = positive. Click any cell/row to ask the AI what likely caused it and what to do next.
        </InfoTip>
      }
    >
      {/* Controls */}
      <div style={{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <label style={{ color:'#f7f9fb', fontSize:14, fontWeight:500 }}>View:</label>
          <div style={{ display:'flex', gap:4 }}>
            {[
              { value: 'calendar', label: 'Calendar' },
              { value: 'timeline', label: 'Timeline' },
              { value: 'stats', label: 'Statistics' }
            ].map(m => (
              <button key={m.value} onClick={()=>setViewMode(m.value)}
                style={{
                  padding:'6px 12px', fontSize:12, borderRadius:4, border:'1px solid #3a4459',
                  backgroundColor: viewMode===m.value?'#00e0ff':'#232a36', color: viewMode===m.value?'#0a1224':'#f7f9fb'
                }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <label style={{ color:'#f7f9fb', fontSize:14, fontWeight:500 }}>Year:</label>
          <select value={currentYear} onChange={(e)=> onYearSelect?.(Number(e.target.value))}
            style={{ padding:'6px 12px', borderRadius:6, border:'1px solid #3a4459', background:'#232a36', color:'#f7f9fb', fontSize:14 }}>
            {availableYears.map(y => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <label style={{ color:'#f7f9fb', fontSize:14, fontWeight:500 }}>Threshold: {Number(significanceThreshold).toFixed(1)}</label>
          <input type="range" min="0" max="2" step="0.1" value={significanceThreshold}
                 onChange={(e)=> onThresholdChange?.(Number(e.target.value))}
                 style={{ width: 100, accentColor:'#00e0ff' }} />
        </div>
      </div>

      <div style={{ height: 400, background:'rgba(58,68,89,.1)', borderRadius:8, padding:16 }}>
        {viewMode === 'calendar' && <CalendarView year={currentYear} data={data.calendar[currentYear] || {}} />}
        {viewMode === 'timeline' && <TimelineView patterns={filteredPatterns.filter(p=>p.year===currentYear)} />}
        {viewMode === 'stats' && <StatsView monthlyStats={data.monthlyStats} year={currentYear} />}
      </div>

      <div style={{ marginTop:16, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:12, background:'rgba(58,68,89,.1)', borderRadius:8 }}>
        <span style={{ color:'#5891cb', fontSize:12 }}>Strong Negative</span>
        <div style={{ width:200, height:12, background:'linear-gradient(90deg, #e930ff, #aa45dd, #232a36, #5fd4d6, #00e0ff)', borderRadius:6 }} />
        <span style={{ color:'#5891cb', fontSize:12 }}>Strong Positive</span>
      </div>
    </Card>
  );
};

const CalendarView = ({ year, data }) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div style={{ height:'100%', overflowY:'auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        {months.map((m, mi) => {
          const monthData = data[mi+1] || [];
          return (
            <div key={m} style={{ textAlign:'center' }}>
              <h4 style={{ color:'#f7f9fb', margin:'0 0 8px', fontSize:12, fontWeight:600 }}>{m} {year}</h4>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:1 }}>
                {['S','M','T','W','T','F','S'].map(d => (<div key={d} style={{ color:'#5891cb', textAlign:'center', padding:2, fontSize:8 }}>{d}</div>))}
                {Array.from({ length: 35 }, (_, idx) => {
                  const dayData = monthData.find(d => d.day === idx + 1);
                  const magnitude = dayData ? dayData.magnitude : 0;
                  return (
                    <div key={idx}
                      onClick={()=> dayData && emitInsight(insightBuilders.pattern({
                        date: dayData.date, magnitude: dayData.magnitude,
                        kind: magnitude>0?'positive_anomaly':magnitude<0?'negative_anomaly':'normal'
                      }))}
                      style={{ width:12, height:12, backgroundColor: getDeviationColor(magnitude), border:'1px solid #0a1224', borderRadius:2, fontSize:8, display:'flex', alignItems:'center', justifyContent:'center', cursor: dayData?'pointer':'default' }}
                      title={dayData ? `Day ${dayData.day}: ${magnitude.toFixed(2)}` : ''} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimelineView = ({ patterns }) => {
  const sorted = patterns.slice().sort((a,b)=> new Date(a.date) - new Date(b.date));
  return (
    <div style={{ height:'100%', overflowY:'auto' }}>
      {sorted.map((p, i) => (
        <div key={`${p.date}-${i}`} onClick={()=>emitInsight(insightBuilders.pattern({
          date: p.date, magnitude: p.deviation_magnitude, kind: p.pattern_type
        }))}
          style={{ display:'flex', alignItems:'center', padding:'8px 12px', marginBottom:8, background:'rgba(26,32,56,.6)', borderRadius:6, borderLeft:`4px solid ${getPatternColor(p.pattern_type)}`, cursor:'pointer' }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ color:'#f7f9fb', fontWeight:600, fontSize:14 }}>{new Date(p.date).toLocaleDateString()}</span>
              <span style={{ color:getPatternColor(p.pattern_type), fontSize:12, fontWeight:600 }}>{p.deviation_magnitude.toFixed(2)}</span>
            </div>
            <div style={{ color:'#5891cb', fontSize:12 }}>{p.pattern_type.replace('_',' ').toUpperCase()}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const StatsView = ({ monthlyStats, year }) => {
  const yearly = Object.entries(monthlyStats || {}).filter(([k])=>k.startsWith(String(year))).map(([k, s])=>({ month:k, ...s }));
  return (
    <div style={{ height:'100%', overflowY:'auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12 }}>
        {yearly.map(stat => (
          <div key={stat.month} style={{ padding:12, background:'rgba(26,32,56,.6)', borderRadius:8 }}>
            <h4 style={{ color:'#f7f9fb', margin:'0 0 8px', fontSize:12, fontWeight:600 }}>{stat.month.split('-')[1]}/'{stat.month.split('-')[0].slice(-2)}</h4>
            <div style={{ fontSize:11 }}>
              <Row l="Total" r={stat.totalDeviations} />
              <Row l="Significant" r={stat.significantDeviations} />
              <Row l="Avg Mag" r={stat.averageMagnitude.toFixed(2)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const Row = ({l,r}) => (<div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
  <span style={{ color:'#5891cb' }}>{l}:</span><span style={{ color:'#f7f9fb' }}>{r}</span></div>);

function getDeviationColor(m){ if (m>0.5) return '#00e0ff'; if (m>0.2) return '#5fd4d6'; if (m<-0.5) return '#e930ff'; if (m<-0.2) return '#aa45dd'; return '#232a36'; }
function getPatternColor(t){ return t==='positive_anomaly' ? '#00e0ff' : t==='negative_anomaly' ? '#e930ff' : '#3a4459'; }

export default DeviationPatternExplorer;
