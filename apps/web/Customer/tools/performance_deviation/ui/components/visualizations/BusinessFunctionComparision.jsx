import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import AIInsightPopover from "../../../../../../ui-common/insights/AIInsightPopover";
import InfoTip from "../../../../../../ui-common/design-system/components/InfoTip";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

/* helpers */
function emitToChat(detail) {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ai:insight-request", { detail }));
      window.dispatchEvent(new CustomEvent("ai:context-add", { detail }));
      window.dispatchEvent(new CustomEvent("ai:open"));
    }
  } catch {}
}
function explainRadarPoint({ label, axis, value }) {
  const val = Number(value || 0).toFixed(2);
  return `${label} — ${axis}: ${val}. Higher radius = stronger relative performance; watch imbalances across axes.`;
}

export default function BusinessFunctionComparison({ data = {}, isLoading = false }) {
  const [pop, setPop] = useState({ open: false, x: 0, y: 0, title: "AI Insight", body: "" });
  const radar = data?.radar || {};

  const layout = {
    height: 400,
    margin: { t: 60, l: 80, r: 40, b: 60 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#fff" },
  };

  const toRadar = (arr, name, color) => ({
    type: "scatterpolar",
    r: (arr || []).map((v) => v.v),
    theta: (arr || []).map((v) => v.t),
    name,
    line: { color },
    fill: "toself",
    opacity: 0.6,
    hovertemplate: `${name}<br>%{theta}: %{r:.2f}<br><i>Click for AI; Shift+Click for chat context</i><extra></extra>`,
  });

  const dataTraces = [toRadar(radar?.sales, "Sales", "#00e0ff"), toRadar(radar?.ar, "AR Flow", "#43cad0"), toRadar(radar?.loyalty, "Loyalty", "#8b5cf6")];

  const onClick = (ev) => {
    const p = ev?.points?.[0];
    if (!p) return;
    const x = (ev?.event?.clientX ?? 240) + 12;
    const y = (ev?.event?.clientY ?? 120) + 12;
    const label = p?.data?.name;
    const axis = p?.theta;
    const value = Number(p?.r || 0);

    if (ev?.event?.shiftKey) {
      const payload = { tool: "performance_deviation", intent: "function_radar_point", function: label, axis, value };
      const bullets = `• Function: ${label}\n• Axis: ${axis}\n• Value: ${value.toFixed(2)}`;
      setPop({ open: true, x, y, title: "Context for Chatbot", body: bullets });
      emitToChat(payload);
      return;
    }

    const text = explainRadarPoint({ label, axis, value });
    setPop({ open: true, x, y, title: "AI Insight", body: text });
  };

  return (
    <Card
      title="Business Function Comparison"
      subtitle="Cross-Function Performance Map"
      actions={
        <InfoTip label="How to read this">
          <span style={{ color: "#fff" }}>
            This radar chart compares Sales, AR, and Loyalty movement. Higher radius = stronger relative performance; corners show imbalance.
          </span>
        </InfoTip>
      }
      isLoading={isLoading}
    >
      <div style={{ paddingTop: 10 }}>
        <Plot data={dataTraces} layout={layout} config={{ displayModeBar: false, responsive: true }} onClick={onClick} />
      </div>
      <AIInsightPopover open={pop.open} x={pop.x} y={pop.y} title={pop.title} body={pop.body} onClose={() => setPop((p) => ({ ...p, open: false }))} />
    </Card>
  );
}
