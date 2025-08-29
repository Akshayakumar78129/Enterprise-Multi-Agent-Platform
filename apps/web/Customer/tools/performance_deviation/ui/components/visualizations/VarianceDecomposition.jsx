// apps/web/Customer/tools/performance_deviation/ui/components/visualizations/VarianceDecomposition.jsx
import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import InfoTip from "../../../../../../ui-common/design-system/components/InfoTip";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

function Card({ title, subtitle, children, actions }) {
  return (
    <div
      style={{
        background: "var(--panel)",
        borderRadius: 10,
        padding: 12,
        minHeight: 520, // Match FeatureImportanceVisualizer height
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontWeight: 800, color: "var(--cloudWhite)" }}>{title}</div>
        {subtitle && <div style={{ color: "var(--muted)", fontSize: 12 }}>{subtitle}</div>}
        {actions}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

function sendCtx(detail){
  try {
    window.dispatchEvent(new CustomEvent("ai:context-add",{detail}));
    window.dispatchEvent(new CustomEvent("ai:open"));
    window.dispatchEvent(new CustomEvent("ai:insight-request",{detail}));
  } catch {}
}

function explain(component, pct, kpi){
  const p = Number(pct||0).toFixed(1);
  const scope = kpi ? ` for ${kpi}` : "";
  return `${component}${scope} accounts for ~${p}% of the variance. Large shares suggest structural drivers; monitor for regime shifts.`;
}

export default function VarianceDecomposition({ data = {}, selectedKPI = null, isLoading = false }) {
  const [pop, setPop] = useState({ open:false, x:0, y:0, title:"AI Insight", body:"" });

  const comps = useMemo(() => (data.components || []).map(c => ({...c, share: Number(c.share||0)})), [data]);
  const labels = comps.map(c => c.name);
  const values = comps.map(c => Math.max(0, Math.round(c.share * 1000)/10)); // percent values (0..100)

  const layout = {
    height: 360,
    margin: { t: 30, b: 20, l: 20, r: 20 },
    paper_bgcolor: "var(--panel)",
    plot_bgcolor: "var(--panel)",
    font: { color: "#f7f9fb" }
  };
  const dataPie = [{ type:"pie", labels, values, hole:.35, textinfo:"label+percent", hovertemplate:"%{label}: %{percent}<extra></extra>" }];

  if (isLoading)
    return (
      <Card title="Variance Decomposition">
        <div style={{ height: 400 }} />
      </Card>
    );
  if (!comps.length)
    return (
      <Card title="Variance Decomposition">
        <div style={{ height: 400, display: "grid", placeItems: "center", color: "#5891cb" }}>No data</div>
      </Card>
    );

  return (
    <Card title="Variance Decomposition" subtitle={`${labels.length} components`} actions={ <InfoTip label="Variance Decomposition">
    Shows the share each component contributes to overall variance.
    <br />
    <b>Shift+Click</b> for chat context (auto-sent).
  </InfoTip>}>
      <div style={{ position: "relative" }}>
        <div style={{ position:'absolute', right:8, top:4, fontSize:12, color:'#9fb3c8' }} title="Shows the share each component contributes to overall variance.">ⓘ</div>
        <Plot
          data={dataPie}
          layout={layout}
          config={{ displayModeBar: false, responsive: true }}
          onClick={(ev) =>{
            const p0 = ev?.points?.[0];
            const i = (p0?.pointIndex ?? p0?.pointNumber ?? -1); // <- FIX: use pointNumber fallback
            if (i < 0) return;
            const label = labels[i];
            const pct = values[i]; // already 0..100
            const x = (ev?.event?.clientX ?? 200)+10, y = (ev?.event?.clientY ?? 120)+10;

            if (ev?.event?.shiftKey) {
              setPop({ open:true, x, y, title:"Context for Chatbot", body:`• Component: ${label}\n• Share: ${pct.toFixed(1)}%\n• KPI: ${selectedKPI||"Current"}` });
              sendCtx({ tool:"performance_deviation", intent:"variance_component", component:label, share:pct/100, kpi:selectedKPI||"Current" });
            } else {
              setPop({ open:true, x, y, title:"AI Insight", body: explain(label, pct, selectedKPI||"current KPI") });
            }
          }}
        />
        {pop.open && (
          <div style={{ position:"fixed", left:pop.x, top:pop.y, width:260, background:"rgba(15,20,34,.96)", border:"1px solid #3a4459",
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
