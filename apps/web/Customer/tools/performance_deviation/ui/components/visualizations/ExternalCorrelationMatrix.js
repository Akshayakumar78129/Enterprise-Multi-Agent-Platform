// apps/web/Customer/tools/performance_deviation/ui/components/visualizations/ExternalCorrelationMatrix.js
import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
const Plot = dynamic(() => import("react-plotly.js"), { ssr:false });

export default function ExternalCorrelationMatrix({ base=[] }) {
  const info = "Correlation of KPI with engineered temporal factors (DoW, Month, Weekend, EoM).";
  // compute correlations
  const names = ["DoW","Month","Weekend","EoM"];
  const cols = {
    "DoW": base.map(p=>new Date(p.t).getDay()),
    "Month": base.map(p=>new Date(p.t).getMonth()+1),
    "Weekend": base.map(p=>([0,6].includes(new Date(p.t).getDay()) ? 1:0)),
    "EoM": base.map(p=> {
      const d = new Date(p.t);
      const eom = new Date(d.getFullYear(), d.getMonth()+1, 0);
      return (d.toDateString()===eom.toDateString()) ? 1 : 0;
    }),
    "KPI": base.map(p=>p.y)
  };
  const corr = names.map(n=>{
    const x = cols[n]; const y = cols["KPI"];
    const mx = x.reduce((a,b)=>a+b,0)/x.length;
    const my = y.reduce((a,b)=>a+b,0)/y.length;
    const num = x.reduce((s,xi,i)=> s + (xi-mx)*(y[i]-my), 0);
    const den = Math.sqrt(x.reduce((s,xi)=> s + (xi-mx)**2,0) * y.reduce((s,yi)=> s + (yi-my)**2,0)) || 1;
    return num/den;
  });

  const data = [{
    z:[corr], x:names, y:["KPI vs Factors"], type:"heatmap",
    colorscale:[
      [0,"#e930ff"], [0.5,"#232a36"], [1,"#00e0ff"]
    ]
  }];
  const layout = {
    height:400, margin:{t:40,l:120,r:20,b:60}, paper_bgcolor:"rgba(0,0,0,0)", plot_bgcolor:"rgba(0,0,0,0)",
    font:{color:"var(--text)"}, annotations:[{xref:"paper",yref:"paper",x:1,y:1.15,xanchor:"right",text:`ℹ️ ${info}`,showarrow:false,font:{size:12,color:"var(--muted)"}}]
  };

  return (
    <Card title="External Factor Correlation" subtitle="Factor Relationship Heatmap">
      <Plot data={data} layout={layout} config={{displayModeBar:false,responsive:true}}/>
    </Card>
  );
}
