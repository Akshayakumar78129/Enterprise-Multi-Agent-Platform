// apps/web/components/kpi/PerformanceKPITiles.jsx
import React, { useState } from "react";
import AIInsightPopover from "../../../../../../ui-common/insights/AIInsightPopover";
import { ensureAISession, buildSimplePrompt } from "../../../../../../ui-common/insights/InsightUtils";

async function requestInsight({ kpiKey, value, snapshot }) {
  const brief = "In one or two lines, explain this KPI in plain English: what it measures, current level, and whether it's good/bad vs typical.";
  const session = ensureAISession({ app_name: 'orchestrator' });
  const text = `${brief}\nKPI: ${kpiKey}\nValue: ${value}`;
  const prompt = buildSimplePrompt({ text, agent: 'orchestrator', mode: 'concise', extras: { snapshot } });
  const chunks = [];
  const { AIResponseDashboardWithViz } = await import("../../../../../../ui-common/ai-interaction/aiResponse");
  for await (const part of AIResponseDashboardWithViz(prompt, session)) {
    if (part === '[DONE]') break;
    if (typeof part === 'object') { const t = (part.text||'').trim(); if (t) chunks.push(t); }
    else if (typeof part === 'string' && part.trim()) { chunks.push(part.trim()); }
  }
  return chunks.join("\n\n") || "No insight.";
}

export default function PerformanceKPITiles({ kpis = {}, isLoading=false, snapshot=null }) {
  const [pop, setPop] = useState({ open:false, x:0, y:0, title:"AI Insight", body:"", payload:null });

  const items = [
    { key:"averageDeviation", label:"Avg Deviation", fmt:(v)=> (v*100).toFixed(1)+"%" },
    { key:"anomalyCount", label:"Anomalies", fmt:(v)=> String(v) },
    { key:"topFactor", label:"Top Factor", fmt:(v)=> String(v).replace(/_/g," ") },
    { key:"explanationPower", label:"Explained (toy)", fmt:(v)=> (v*100).toFixed(0)+"%" },
    { key:"forecastTrend", label:"Trend", fmt:(v)=> String(v) },
  ].filter(i => kpis[i.key] !== undefined);

  if (isLoading) {
    return <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10 }}>
      {new Array(5).fill(0).map((_,i)=> <div key={i} style={{ height:72, background:"rgba(58,68,89,.3)", borderRadius:10 }}/>)}
    </div>;
  }

  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10 }}>
        {items.map((it) => {
          const val = kpis[it.key];
          const pretty = it.fmt(val);
          const conciseHover = `${it.label}: ${pretty}. Click for AI; Shift+Click adds context.`;
          return (
            <div
              key={it.key}
              title={conciseHover}
              onClick={async (e) => {
                const x = e.clientX + 10, y = e.clientY + 10;
                if (e.shiftKey) {
                  // small context chip appended to chat input; no removal
                  try { window.dispatchEvent(new CustomEvent('ai:insight-request', { detail: { tool:'performance_deviation', intent:'kpi_tile', kpi: it.key, value: val, label: it.label } })); } catch {}
                  setPop({ open:true, x, y, title:"Added to context", body:`Added: ${it.label} is ${pretty}.`, payload:null });
                  return;
                }
                try {
                  setPop({ open:true, x, y, title:"AI Insight", body:"Thinking…", payload:null });
                  // on tile click
                  const text = await requestInsight({ kpiKey: it.key, value: val, snapshot });
                  setPop(s=>({ ...s, body:text }));
                } catch (err) {
                  setPop(s=>({ ...s, body:`⚠️ ${err.message}` }));
                }
              }}
              style={{
                padding:12, background:"rgba(26,32,56,.6)", borderRadius:10, border:"1px solid #3a4459",
                display:"grid", alignContent:"center", cursor:"pointer"
              }}
            >
              <div style={{ color:"#5891cb", fontSize:12 }}>{it.label}</div>
              <div style={{ fontSize:20, fontWeight:800 }}>{pretty}</div>
            </div>
          );
        })}
      </div>

      <AIInsightPopover
        open={pop.open}
        x={pop.x}
        y={pop.y}
        title={pop.title}
        body={pop.body}
        actions={null}
        onClose={()=>setPop(p=>({...p, open:false}))}
      />
    </>
  );
}
