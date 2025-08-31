// apps/web/Customer/tools/performance_deviation/ui/components/visualizations/ExternalCorrelationMatrix.jsx
import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { InfoTip } from "../../../../../../ui-common/design-system/components/InfoTip";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

function Card({ title, subtitle, children }) {
  return (
    <div style={{ background:"var(--panel)", borderRadius:10, padding:12, color:"#fff" }}>
      <div style={{ 
        display:"flex",
        justifyContent:"space-between",
        alignItems:"baseline",
        marginBottom:8,
        borderRadius:10,
        minHeight:150,
        padding:12,
        boxSizing:"border-box",
        color:"#fff"
      }}>
        <div style={{ fontWeight:800, color:"#fff" }}>{title}</div>
        {subtitle && <div style={{ color:"#fff", fontSize:12 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}


function sendCtx(detail){ try{
  window.dispatchEvent(new CustomEvent("ai:context-add",{detail}));
  window.dispatchEvent(new CustomEvent("ai:open"));
  window.dispatchEvent(new CustomEvent("ai:insight-request",{detail}));
} catch{} }

function normalizeSeries(input, selectedKPI) {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.points)) return input.points;
  if (input && input.series) {
    const s = input.series;
    if (selectedKPI && s[selectedKPI] && Array.isArray(s[selectedKPI])) return s[selectedKPI];
    if (Array.isArray(s)) return Array.isArray(s[0]) ? s[0] : s;
    if (typeof s === "object") for (const k of Object.keys(s)) if (Array.isArray(s[k])) return s[k];
  }
  if (input && typeof input === "object") for (const k of Object.keys(input)) if (Array.isArray(input[k])) return input[k];
  return [];
}
function safeDate(p){ const raw = p?.t ?? p?.date ?? p?.x ?? null; const d = raw ? new Date(raw) : new Date(NaN); return Number.isNaN(d.getTime()) ? new Date(0) : d; }
function safeValue(p){ if (typeof p?.y === "number") return p.y; if (typeof p?.actual === "number") return p.actual; const v = p?.value ?? p?.predicted ?? null; const n = Number(v); return Number.isFinite(n) ? n : NaN; }
function pearson(x, y){ const n = Math.min(x.length, y.length); if (n < 3) return 0; let sx=0,sy=0,sxx=0,syy=0,sxy=0,m=0; for (let i=0;i<n;i++){ const xi=Number(x[i]); const yi=Number(y[i]); if (!Number.isFinite(xi)||!Number.isFinite(yi)) continue; m++; sx+=xi; sy+=yi; sxx+=xi*xi; syy+=yi*yi; sxy+=xi*yi; } if (m<3) return 0; const cov=sxy-(sx*sy)/m; const vx=sxx-(sx*sx)/m; const vy=syy-(sy*sy)/m; const denom=Math.sqrt(vx*vy)||1; return cov/denom; }

function explain(factor, corr, kpi){
  const sign = corr > 0 ? "moves with" : corr < 0 ? "moves opposite to" : "shows no linear relation with";
  return `${factor} ${sign} ${kpi || "the KPI"} (r=${corr.toFixed(2)}). Treat |r|≥0.5 as strong; correlation ≠ causation.`;
}

export default function ExternalCorrelationMatrix({ base, data, selectedKPI = null, isLoading = false }) {
  const [pop, setPop] = useState({ open:false, x:0, y:0, title:"AI Insight", body:"" });
  const series = useMemo(() => normalizeSeries(base ?? data ?? [], selectedKPI), [base, data, selectedKPI]);

  if (isLoading) return <Card title="External Factor Correlation" subtitle="Factor Relationship Heatmap"><div style={{ height: 400 }} /></Card>;
  if (!Array.isArray(series) || series.length < 3)
    return <Card title="External Factor Correlation" subtitle="Factor Relationship Heatmap"><div style={{ height: 400, display:"grid", placeItems:"center", color:"#5891cb", background:"rgba(58,68,89,.1)", borderRadius:8 }}>No correlation data available</div></Card>;

  const times = series.map((p) => safeDate(p));
  const values = series.map((p) => safeValue(p)).filter((v) => Number.isFinite(v));
  if (!values.length)
    return <Card title="External Factor Correlation" subtitle="Factor Relationship Heatmap"><div style={{ height: 400, display:"grid", placeItems:"center", color:"#5891cb", background:"rgba(58,68,89,.1)", borderRadius:8 }}>No numeric KPI values to correlate</div></Card>;

  const names = ["DoW", "Month", "Weekend", "EoM"];
  const cols = {
    DoW: times.map((d) => d.getDay()),
    Month: times.map((d) => d.getMonth() + 1),
    Weekend: times.map((d) => ([0, 6].includes(d.getDay()) ? 1 : 0)),
    EoM: times.map((d) => { const eom = new Date(d.getFullYear(), d.getMonth() + 1, 0); return d.toDateString() === eom.toDateString() ? 1 : 0; }),
  };
  const corr = names.map((n) => pearson(cols[n], values)); // array length 4

  const heatmap = [{
    z: [corr], x: names, y: ["KPI vs Factors"], type: "heatmap",
    colorscale: [[0, "#e930ff"], [0.5, "#ffffffff"], [1, "#00e0ff"]],
    hovertemplate: "Factor: %{x}<br>Correlation: %{z:.2f}<extra></extra>"
  }];

  const layout = { height: 400, margin: { t: 30, l: 120, r: 20, b: 60 }, paper_bgcolor: "var(--panel)", plot_bgcolor: "var(--panel)", font: { color: "#fff" } };

  return (
    <Card title="External Factor Correlation" subtitle="Factor Relationship Heatmap" actions={ <InfoTip label="External Factor Correlation">
    Correlation shows linear relationship strength; not causation.
    <br />
    <b>Shift+Click</b> for chat context (auto-sent).
  </InfoTip>}>
      <div style={{ position:"relative" }}>
        <div style={{ position:'absolute', right:8, top:4, fontSize:12, color:'#9fb3c8' }} title="Correlation shows linear relationship strength; not causation.">ⓘ</div>
        <Plot
          data={heatmap}
          layout={layout}
          config={{ displayModeBar:false, responsive:true }}
          onClick={(ev)=>{
            const p0 = ev?.points?.[0];
            if (!p0) return;
            // Some Plotly builds don’t set p0.z on first click – reconstruct from our array if needed
            const idx = (p0?.pointNumber ?? p0?.pointIndex ?? p0?.x ?? -1);
            const value = Number((p0?.z != null) ? p0.z : (Number.isInteger(idx) ? corr[idx] : NaN)) || 0;
            const factor = String(p0.x);
            const mouse = ev?.event || {};
            const x = (mouse.clientX ?? 240) + 12; const y = (mouse.clientY ?? 120) + 12;

            if (mouse.shiftKey) {
              setPop({ open:true, x, y, title:"Context for Chatbot", body:`• Factor: ${factor}\n• Correlation: ${value.toFixed(2)}\n• KPI: ${selectedKPI || "Current"}` });
              sendCtx({ tool:"performance_deviation", intent:"kpi_factor_correlation", kpi: selectedKPI || "Current", factor, correlation: value });
            } else {
              setPop({ open:true, x, y, title:"AI Insight", body: explain(factor, value, selectedKPI || "the KPI") });
            }
          }}
        />

        {pop.open && (
          <div style={{ position:"fixed", left:pop.x, top:pop.y, width:280, background:"rgba(15,20,34,.96)", border:"1px solid #3a4459",
                        borderRadius:10, padding:"10px 12px", boxShadow:"0 12px 40px rgba(0,0,0,.4)", zIndex:1000 }}>
            <div style={{ fontWeight:800, marginBottom:6, fontSize:12, color:"#b9c2d4" }}>{pop.title}</div>
            <div style={{ whiteSpace:"pre-wrap", color:"#dfe5f2", fontSize:12, lineHeight:1.5 }}>{pop.body}</div>
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
              <button onClick={()=>setPop(s=>({...s,open:false}))}
                      style={{ padding:"6px 8px", borderRadius:8, border:"1px solid #3a4459", background:"#232a36", color:"#f7f9fb", fontSize:12, cursor:"pointer" }}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
