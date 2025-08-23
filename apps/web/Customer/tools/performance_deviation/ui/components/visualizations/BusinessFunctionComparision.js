// apps/web/Customer/tools/performance_deviation/ui/components/visualizations/BusinessFunctionComparison.js
import React from "react";
import dynamic from "next/dynamic";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
const Plot = dynamic(() => import("react-plotly.js"), { ssr:false });

export default function BusinessFunctionComparison({ radar }) {
  const info = "Cross-function map comparing Sales, AR, and Loyalty movement over time.";
  const x = radar?.sales?.map(r=>r.t) || [];
  const layout = {
    paper_bgcolor:"rgba(0,0,0,0)", plot_bgcolor:"rgba(0,0,0,0)",
    font:{ color:"var(--text)" }, polar:{ radialaxis:{visible:true}}, showlegend:true, height:400,
    annotations:[{xref:"paper", yref:"paper", x:1, y:1.15, xanchor:"right", text:`ℹ️ ${info}`, showarrow:false, font:{size:12, color:"var(--muted)"}}]
  };
  const toRadar = (arr, name, color) => ({
    type:"scatterpolar", r: (arr||[]).map(v=>v.v), theta:(arr||[]).map(v=>v.t), name, line:{color}, fill:"toself", opacity:0.6
  });
  const data = [
    toRadar(radar?.sales,"Sales","#00e0ff"),
    toRadar(radar?.ar,"AR Flow","#43cad0"),
    toRadar(radar?.loyalty,"Loyalty","#8b5cf6")
  ];
  return (
    <Card title="Business Function Comparison" subtitle="Cross-Function Performance Map">
      <Plot data={data} layout={layout} config={{displayModeBar:false,responsive:true}}/>
    </Card>
  );
}
