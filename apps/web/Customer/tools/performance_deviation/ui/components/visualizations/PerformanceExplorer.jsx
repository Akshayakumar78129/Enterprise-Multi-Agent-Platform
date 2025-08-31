import React, { useMemo, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import InfoTip from "../../../../../../ui-common/design-system/components/InfoTip";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
const CURRENCY_KPI_REGEX = /(revenue|order_value|amount|ar_)/i;
const nf2 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/* ---------- helpers ---------- */
function emitToChat(detail) {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ai:insight-request", { detail }));
      window.dispatchEvent(new CustomEvent("ai:context-add", { detail }));
      window.dispatchEvent(new CustomEvent("ai:open"));
    }
  } catch {}
}
function formatNumber(v, currency = false) {
  return v == null || Number.isNaN(v)
    ? "—"
    : currency
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v)
    : nf2.format(v);
}
function downsample(arr, maxPoints = 1500) {
  if (!Array.isArray(arr) || arr.length <= maxPoints) return arr;
  const step = Math.ceil(arr.length / maxPoints);
  const out = [];
  for (let i = 0; i < arr.length; i += step) out.push(arr[i]);
  return out;
}
function localExplainTimepoint({ kpi, date, actual, predicted, deviation }) {
  const parts = [];
  const d = new Date(date).toLocaleDateString();
  parts.push(`${kpi.replace(/_/g, " ")} on ${d}`);
  if (actual != null) parts.push(`Actual ${formatNumber(actual, CURRENCY_KPI_REGEX.test(kpi))}`);
  if (predicted != null) parts.push(`Pred ${formatNumber(predicted, CURRENCY_KPI_REGEX.test(kpi))}`);
  if (deviation != null) {
    const dev = Number(deviation);
    const dir = dev === 0 ? "no deviation" : dev > 0 ? "above prediction" : "below prediction";
    parts.push(`Deviation ${formatNumber(dev)} (${dir})`);
  }
  return parts.join(" • ");
}

/* ---------- minimal card ---------- */
function Card({ title, subtitle, isLoading, children }) {
  return (
    <div style={{ background: "var(--panel)", borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontWeight: 800, color: "var(--cloudWhite)" }}>{title}</div>
        {subtitle && <div style={{ color: "var(--muted)", fontSize: 12 }}>{subtitle}</div>}
      </div>
      {isLoading ? <div style={{ height: 480 }} /> : children}
    </div>
  );
}

export default function PerformanceExplorer({
  data = {},
  selectedKPIs = [],
  onKPISelect = null,
  dateRange = null,
  onDateRangeChange = null,
  isLoading = false,
}) {
  const [viewMode, setViewMode] = useState("actual_vs_predicted");
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [showMarkers, setShowMarkers] = useState(false);
  const containerRef = useRef(null);
  const [pop, setPop] = useState({ open: false, x: 0, y: 0, title: "AI Insight", text: "", bullets: null });

  const availableKPIs = Object.keys(data);
  const currentKPI = selectedKPI || availableKPIs[0] || "daily_revenue";
  const isCurrency = useMemo(() => CURRENCY_KPI_REGEX.test(currentKPI), [currentKPI]);

  const buildTraces = useCallback(
    (kpiName, showMarker = false) => {
      const kpiData = data[kpiName] || [];
      const base = viewMode === "actual_vs_predicted" ? downsample(kpiData, 1500) : kpiData;
      const x = base.map((d) => d.date);
      const yActual = base.map((d) => d.actual);
      const traces = [];
      const common = { customdata: base, hoverlabel: { bgcolor: "rgba(12,16,30,.9)" } };

      if (viewMode === "actual_vs_predicted") {
        traces.push({
          x,
          y: yActual,
          type: "scattergl",
          mode: showMarker ? "lines+markers" : "lines",
          name: "Actual",
          line: { width: 2.5, shape: "spline", smoothing: 0.6 },
          marker: { size: showMarker ? 5 : 0 },
          hovertemplate: `<b>Actual</b><br>Date: %{x}<br>Value: ${isCurrency ? "$" : ""}%{y:,.2f}<br><i>Click: AI insight; Shift+Click: context</i><extra></extra>`,
          connectgaps: true,
          simplify: true,
          ...common,
        });

        if (base.some((d) => d.predicted !== undefined)) {
          traces.push({
            x,
            y: base.map((d) => d.predicted ?? null),
            type: "scattergl",
            mode: "lines",
            name: "Predicted",
            line: { width: 2, dash: "dash" },
            hovertemplate: `<b>Predicted</b><br>Date: %{x}<br>Value: ${isCurrency ? "$" : ""}%{y:,.2f}<extra></extra>`,
            connectgaps: true,
            simplify: true,
            ...common,
          });

          const upper = base.map((d) => (d.predicted ?? d.actual) * 1.1);
          const lower = base.map((d) => (d.predicted ?? d.actual) * 0.9);
          traces.push({ x, y: upper, type: "scattergl", mode: "lines", line: { width: 0 }, hoverinfo: "skip", showlegend: false });
          traces.push({
            x,
            y: lower,
            type: "scattergl",
            mode: "lines",
            fill: "tonexty",
            fillcolor: "rgba(0,224,255,0.15)",
            line: { width: 0 },
            name: "Confidence",
            hoverinfo: "skip",
          });
        }
      } else if (viewMode === "deviations") {
        traces.push({
          x,
          y: base.map((d) => d.deviation ?? 0),
          type: "bar",
          name: "Deviation",
          marker: {
            opacity: 0.9,
            color: base.map((d) => ((d.deviation ?? 0) > 0 ? "#00e0ff" : (d.deviation ?? 0) < 0 ? "#e930ff" : "#3a4459")),
          },
          hovertemplate: "<b>Deviation</b><br>Date: %{x}<br>Value: %{y:,.2f}<br><i>Click for AI insight</i><extra></extra>",
          ...common,
        });
        traces.push({
          x,
          y: base.map(() => 0),
          type: "scattergl",
          mode: "lines",
          showlegend: false,
          line: { width: 1, dash: "dot" },
          hoverinfo: "skip",
        });
      } else {
        (selectedKPIs.length ? selectedKPIs : [kpiName]).forEach((name) => {
          if (!data[name]) return;
          const d = downsample(data[name], 1500);
          traces.push({
            x: d.map((p) => p.date),
            y: d.map((p) => p.actual),
            type: "scattergl",
            mode: "lines",
            name,
            line: { width: 2 },
            marker: { size: 0 },
            hovertemplate: `<b>${name}</b><br>Date: %{x}<br>Value: ${CURRENCY_KPI_REGEX.test(name) ? "$" : ""}%{y:,.2f}<br><i>Click for AI insight</i><extra></extra>`,
            customdata: d,
          });
        });
      }
      return traces;
    },
    [data, viewMode, selectedKPIs, isCurrency]
  );

  const layout = useMemo(
    () => ({
      title: {
        text: `${currentKPI.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} — ${viewMode.replace(/_/g, " ").toUpperCase()}`,
        font: { color: "#f7f9fb", size: 16 },
      },
      xaxis: { title: "Date", color: "#f7f9fb", gridcolor: "rgba(58,68,89,0.2)", type: "date" },
      yaxis: {
        title: "Value",
        color: "#f7f9fb",
        gridcolor: "rgba(58,68,89,0.2)",
        ...(isCurrency ? { tickprefix: "$", tickformat: ",.2f" } : { tickformat: ",.2f" }),
      },
      plot_bgcolor: "transparent",
      paper_bgcolor: "transparent",
      font: { color: "#f7f9fb" },
      legend: { bgcolor: "rgba(26,32,56,0.75)" },
      margin: { l: 60, r: 40, t: 60, b: 60 },
      hovermode: "x unified",
      uirevision: "keep-zoom",
    }),
    [currentKPI, viewMode, isCurrency]
  );

  const traces = useMemo(() => buildTraces(currentKPI, showMarkers), [buildTraces, currentKPI, showMarkers]);

  const handleRelayout = useCallback(
    (e) => {
      try {
        const r0 = e?.["xaxis.range[0]"],
          r1 = e?.["xaxis.range[1]"];
        if (!r0 || !r1) {
          setShowMarkers(false);
          return;
        }
        const start = new Date(r0).getTime(),
          end = new Date(r1).getTime();
        const series = data[currentKPI] || [];
        const inView = series.filter((d) => {
          const t = new Date(d.date).getTime();
          return t >= start && t <= end;
        }).length;
        setShowMarkers(inView <= 180);
      } catch {}
    },
    [data, currentKPI]
  );

  const handleClick = useCallback(
    async (ev) => {
      const pt = ev?.points?.[0];
      if (!pt?.customdata) return;
      const d = pt.customdata;
      const rect = containerRef.current?.getBoundingClientRect?.();
      const x = (ev?.event?.clientX ?? 0) - (rect?.left ?? 0);
      const y = (ev?.event?.clientY ?? 0) - (rect?.top ?? 0);

      const ctx = {
        tool: "performance_deviation",
        intent: "timepoint",
        kpi: currentKPI,
        date: d.date,
        actual: d.actual ?? null,
        predicted: d.predicted ?? null,
        deviation: d.deviation ?? null,
        functionGroup: d.function ?? null,
      };

      if (ev?.event?.shiftKey) {
        const bullets = [
          `KPI: ${currentKPI}`,
          `Date: ${new Date(d.date).toLocaleDateString()}`,
          `Actual: ${formatNumber(d.actual, isCurrency)}`,
          `Predicted: ${formatNumber(d.predicted, isCurrency)}`,
          `Deviation: ${formatNumber(ctx.deviation)}`,
        ];
        setPop({ open: true, x, y, title: "Context for Chatbot", text: bullets.join("\n"), bullets });
        emitToChat(ctx);
        return;
      }

      // local concise explanation (no backend calls)
      const text = localExplainTimepoint(ctx);
      setPop({ open: true, x, y, title: "AI Insight", text, bullets: null });
    },
    [currentKPI, isCurrency]
  );

  const handleKPISelection = (kpi) => {
    setSelectedKPI(kpi);
    onKPISelect?.([kpi]);
  };

  if (isLoading) return <Card title="Performance Explorer" isLoading><div style={{ height: 480 }} actions={<InfoTip label="Performance Explorer">
    Shows actual vs predicted values for a selected KPI over time, helping identify trends, seasonality, and deviations in performance.
    <br />
    <b>Shift+Click</b> for chat context (auto-sent).
  </InfoTip>}/></Card>;
  if (!availableKPIs.length)
    return (
      <Card title="Performance Explorer">
        <div style={{ height: 480, display: "grid", placeItems: "center", color: "#5891cb" }}>No performance data available</div>
      </Card>
    );

  const actionBtnStyle = {
    background: "var(--graphite)",
    color: "var(--cloudWhite)",
    border: "1px solid var(--graphiteLight)",
    borderRadius: 8,
    padding: "4px 8px",
    fontSize: 12,
    cursor: "pointer",
  };

  return (
    <Card title="Performance Explorer" subtitle={`${availableKPIs.length} KPIs available`} actions={<InfoTip label="Performance Explorer">
                 Shows actual vs predicted values for a selected KPI over time, helping identify trends, seasonality, and deviations in performance.
                  <br />
                  <b>Shift+Click</b> for chat context (auto-sent).
                </InfoTip> }>
      {/* controls */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>KPI:</label>
            <select value={currentKPI} onChange={(e) => handleKPISelection(e.target.value)} style={{ padding: "6px 12px" }}>
              {availableKPIs.map((k) => (
                <option key={k} value={k}>
                  {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>View:</label>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { value: "actual_vs_predicted", label: "Actual vs Predicted" },
                { value: "deviations", label: "Deviations" },
                { value: "multi_kpi", label: "Multi-KPI" },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setViewMode(m.value)}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    borderRadius: 4,
                    border: "1px solid #3a4459",
                    backgroundColor: viewMode === m.value ? "#00e0ff" : "#232a36",
                    color: viewMode === m.value ? "#0a1224" : "#f7f9fb",
                    cursor: "pointer",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => alert("Tip: Click a point for an AI explanation; Shift+Click to send context to the chat.")}
            className="icon-button"
            style={actionBtnStyle}
            title="Tips"
          >
            i
          </button>
        </div>
      </div>

      {/* chart */}
      <div ref={containerRef} style={{ position: "relative", height: 480 }}>
        <Plot
          data={traces}
          layout={{ ...layout, height: 480, autosize: true }}
          onRelayout={handleRelayout}
          onClick={handleClick}
          config={{ responsive: true, displayModeBar: true, displaylogo: false, modeBarButtonsToRemove: ["lasso2d", "select2d"] }}
          style={{ width: "100%", height: "100%" }}
        />

        {pop.open && (
          <div
            style={{
              position: "absolute",
              left: Math.min(Math.max(pop.x - 10, 8), (containerRef.current?.clientWidth || 360) - 260),
              top: Math.max(pop.y - 120, 8),
              width: 260,
              background: "rgba(15,20,34,.96)",
              border: "1px solid #3a4459",
              borderRadius: 10,
              padding: "10px 12px",
              boxShadow: "0 12px 40px rgba(0,0,0,.4)",
              zIndex: 10,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 12, color: "#b9c2d4" }}>{pop.title}</div>
            <div style={{ whiteSpace: "pre-wrap", color: "#dfe5f2", fontSize: 12, lineHeight: 1.5 }}>{pop.text}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setPop((s) => ({ ...s, open: false }))}
                style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #3a4459", background: "#232a36", color: "#f7f9fb", fontSize: 12, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* stats */}
      {data[currentKPI] && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "rgba(58,68,89,0.2)",
            borderRadius: 8,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#5891cb", fontSize: 12 }}>Data Points</div>
            <div style={{ fontWeight: 700 }}>{data[currentKPI].length}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#5891cb", fontSize: 12 }}>Avg Value</div>
            <div style={{ fontWeight: 700 }}>
              {formatNumber(data[currentKPI].reduce((s, d) => s + (d.actual ?? 0), 0) / data[currentKPI].length, isCurrency)}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#5891cb", fontSize: 12 }}>Date Range</div>
            <div style={{ fontWeight: 700 }}>
              {data[currentKPI].length
                ? `${data[currentKPI][0].date.split("T")[0]} → ${data[currentKPI][data[currentKPI].length - 1].date.split("T")[0]}`
                : "N/A"}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
