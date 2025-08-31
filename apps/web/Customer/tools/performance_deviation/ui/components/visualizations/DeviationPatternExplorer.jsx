import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import InfoTip from "../../../../../../ui-common/design-system/components/InfoTip";
import AIInsightPopover from "../../../../../../ui-common/insights/AIInsightPopover";

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
function explainCalendarDeviation({ date, magnitude }) {
  const d = new Date(date).toISOString().slice(0, 10);
  const mag = Number(magnitude || 0);
  const dir = mag === 0 ? "no deviation" : mag > 0 ? "positive deviation" : "negative deviation";
  return `${d}: ${dir} of ${mag.toFixed(2)}. Consider seasonality, promos, or one-off events around this day.`;
}

export default function DeviationPatternExplorer({
  data = { calendar: {}, monthlyStats: {}, patterns: [] },
  selectedYear = null,
  onYearSelect = null,
  significanceThreshold = 0.5,
  onThresholdChange = null,
  isLoading = false,
}) {
  const [pop, setPop] = useState({ open: false, x: 0, y: 0, title: "AI Insight", text: "…", payload: null });

  const years = Object.keys(data.calendar || {})
    .map(Number)
    .sort((a, b) => a - b);
  const year = selectedYear || years[0] || new Date().getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const heat = useMemo(() => {
    const monthMap = data.calendar?.[year] || {};
    const maxDays = 31;
    const z = monthNames.map((_, mi) => {
      const arr = new Array(maxDays).fill(0);
      const md = monthMap[mi + 1] || [];
      md.forEach((d) => {
        const idx = (d.day || 0) - 1;
        if (idx >= 0 && idx < maxDays) arr[idx] = d.magnitude || 0;
      });
      return arr;
    });
    return { z, x: Array.from({ length: maxDays }, (_, i) => i + 1), y: monthNames };
  }, [data, year]);

  const info =
    "Calendar heatmap of deviation magnitude by Month × Day. Cyan = positive; Magenta = negative. Click for AI; Shift+Click for chat bullets.";
  const layout = {
    height: 420,
    margin: { t: 85, b: 40, l: 60, r: 80 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#f7f9fb" },
    annotations: [{ xref: "paper", yref: "paper", x: 1, y: 1.25, xanchor: "right", text: `ℹ️ ${info}`, showarrow: false, font: { size: 12, color: "var(--muted)" } }],
  };
  const dataHM = [
    {
      z: heat.z,
      x: heat.x,
      y: heat.y,
      type: "heatmap",
      colorscale: [
        [0, "#e930ff"],
        [0.48, "#aa45dd"],
        [0.5, "#232a36"],
        [0.52, "#5fd4d6"],
        [1, "#00e0ff"],
      ],
      hovertemplate: "%{y} %{x}, " + year + "<br>Deviation: %{z:.2f}<extra></extra>",
    },
  ];

  const onClick = (ev) => {
    const p = ev?.points?.[0];
    if (!p) return;
    const day = p?.x;
    const mi = monthNames.indexOf(p?.y ?? "");
    if (mi < 0) return;
    const date = new Date(year, mi, day);
    const magnitude = Number(p?.z || 0);
    const x = (ev?.event?.clientX ?? 240) + 12;
    const y = (ev?.event?.clientY ?? 120) + 12;

    const payload = { tool: "performance_deviation", intent: "calendar_deviation", date: date.toISOString().slice(0, 10), magnitude };

    if (ev?.event?.shiftKey) {
      const bullets = `• Date: ${payload.date}\n• Deviation: ${magnitude.toFixed(2)}`;
      setPop({ open: true, x, y, title: "Context for Chatbot", text: bullets });
      emitToChat(payload);
      return;
    }

    const text = explainCalendarDeviation(payload);
    setPop({ open: true, x, y, title: "AI Insight", text });
  };

  if (isLoading) return (<Card title="Deviation Pattern Explorer" isLoading><div style={{ height: 460 }} /></Card>);
  if (!years.length)
    return (
      <Card title="Deviation Pattern Explorer">
        <div style={{ height: 460, display: "grid", placeItems: "center", color: "#5891cb" }}>No deviation pattern data available</div>
      </Card>
    );

  const sigCnt = (data.patterns || []).filter((p) => Math.abs(p.deviation_magnitude) >= significanceThreshold && p.year === year).length;

  return (
    <Card title="Deviation Pattern Explorer" subtitle={`${sigCnt} significant deviations in ${year}`} actions={<InfoTip label="Anomaly Detection">{info}</InfoTip>}>
      {/* controls */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ color: "#f7f9fb", fontSize: 14, fontWeight: 500 }}>Year:</label>
          <select
            value={year}
            onChange={(e) => onYearSelect?.(Number(e.target.value))}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #3a4459", background: "#232a36", color: "#f7f9fb", fontSize: 14 }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ color: "#f7f9fb", fontSize: 14, fontWeight: 500 }}>Threshold: {Number(significanceThreshold).toFixed(1)}</label>
          <input type="range" min="0" max="2" step="0.1" value={significanceThreshold} onChange={(e) => onThresholdChange?.(Number(e.target.value))} style={{ width: 100, accentColor: "#00e0ff" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Plot data={dataHM} layout={layout} config={{ displayModeBar: false, responsive: true }} onClick={onClick} />
      </div>
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ color: "#fff", fontSize: 12 }}>Strong Negative</span>
        <div style={{ width: 200, height: 12, background: "linear-gradient(90deg, #e930ff, #aa45dd, #232a36, #5fd4d6, #00e0ff)", borderRadius: 6 }} />
        <span style={{ color: "#fff", fontSize: 12 }}>Strong Positive</span>
      </div>
      <AIInsightPopover open={pop.open} x={pop.x} y={pop.y} title={pop.title} body={pop.text} onClose={() => setPop((p) => ({ ...p, open: false }))} />
    </Card>
  );
}
