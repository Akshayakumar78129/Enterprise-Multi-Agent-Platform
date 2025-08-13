import React, { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import { emitInsight, insightBuilders } from "../../../../../../ui-common/utils/aiinsights";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const CURRENCY_KPI_REGEX = /(revenue|order_value|amount|ar_)/i;

function formatNumber(v, isCurrency = false) {
  if (v == null || Number.isNaN(v)) return "—";
  if (isCurrency) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(v);
  }
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(v);
}

// simple even-bucket downsample to ~maxPoints
function downsample(arr, maxPoints = 1500) {
  if (!Array.isArray(arr) || arr.length <= maxPoints) return arr;
  const step = Math.ceil(arr.length / maxPoints);
  const out = [];
  for (let i = 0; i < arr.length; i += step) out.push(arr[i]);
  return out;
}

export default function PerformanceExplorer({
  data = {},
  selectedKPIs = [],
  onKPISelect = null,
  dateRange = null,
  onDateRangeChange = null,
  isLoading = false,
}) {
  const [viewMode, setViewMode] = useState("actual_vs_predicted"); // "actual_vs_predicted" | "deviations" | "multi_kpi"
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [showMarkers, setShowMarkers] = useState(false); // toggled by zoom

  const availableKPIs = Object.keys(data);
  const currentKPI = selectedKPI || availableKPIs[0] || "daily_revenue";
  const kpiData = data[currentKPI] || [];
  const last = kpiData.length ? kpiData[kpiData.length - 1] : null;

  const fireAIExplain = () => {
    if (!last) return;
    emitInsight(
      insightBuilders.timepoint({
        kpi: currentKPI,
        date: last.date,
        actual: last.actual,
        predicted: last.predicted ?? null,
        deviation: last.deviation ?? (last.actual - (last.predicted ?? last.actual)),
        functionGroup: kpiData[0]?.function || null,
      })
    );
  };

  const isCurrency = useMemo(() => CURRENCY_KPI_REGEX.test(currentKPI), [currentKPI]);

  const buildTraces = useCallback(
    (kpiName, showMarker = false) => {
      const kpiData = data[kpiName] || [];
      const base = viewMode === "actual_vs_predicted" ? downsample(kpiData, 1500) : kpiData;

      const x = base.map((d) => d.date);
      const yActual = base.map((d) => d.actual);
      const traces = [];

      if (viewMode === "actual_vs_predicted") {
        traces.push({
          x,
          y: yActual,
          type: "scattergl",
          mode: showMarker ? "lines+markers" : "lines",
          name: "Actual",
          line: { width: 2.5, shape: "spline", smoothing: 0.6 },
          marker: { size: showMarker ? 5 : 0 },
          hovertemplate: `<b>Actual</b><br>Date: %{x}<br>Value: ${isCurrency ? "$" : ""}%{y:,.2f}<extra></extra>`,
          connectgaps: true,
          simplify: true,
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
          });

          // confidence band (illustrative)
          const upper = base.map((d) => (d.predicted ?? d.actual) * 1.1);
          const lower = base.map((d) => (d.predicted ?? d.actual) * 0.9);
          traces.push({
            x,
            y: upper,
            type: "scattergl",
            mode: "lines",
            line: { width: 0 },
            hoverinfo: "skip",
            showlegend: false,
          });
          traces.push({
            x,
            y: lower,
            type: "scattergl",
            mode: "lines",
            fill: "tonexty",
            fillcolor: "rgba(0, 224, 255, 0.15)",
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
            opacity: 0.85,
            color: base.map((d) =>
              (d.deviation ?? 0) > 0 ? "#00e0ff" : (d.deviation ?? 0) < 0 ? "#e930ff" : "#3a4459"
            ),
          },
          hovertemplate: "<b>Deviation</b><br>Date: %{x}<br>Value: %{y:,.2f}<extra></extra>",
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
        // "multi_kpi"
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
            hovertemplate: `<b>${name}</b><br>Date: %{x}<br>Value: ${
              CURRENCY_KPI_REGEX.test(name) ? "$" : ""
            }%{y:,.2f}<extra></extra>`,
            marker: { size: 0 },
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
        text: `${currentKPI
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())} — ${viewMode.replace(/_/g, " ").toUpperCase()}`,
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
      // toggle markers only when zoomed into small windows (<= ~180 points)
      try {
        const r0 = e?.["xaxis.range[0]"];
        const r1 = e?.["xaxis.range[1]"];
        if (!r0 || !r1) {
          setShowMarkers(false);
          return;
        }
        const start = new Date(r0).getTime();
        const end = new Date(r1).getTime();
        const series = data[currentKPI] || [];
        const inView = series.filter((d) => {
          const t = new Date(d.date).getTime();
          return t >= start && t <= end;
        }).length;
        setShowMarkers(inView <= 180);
      } catch {
        /* noop */
      }
    },
    [data, currentKPI]
  );

  const handleKPISelection = (kpi) => {
    setSelectedKPI(kpi);
    onKPISelect?.([kpi]);
  };

  if (isLoading) {
    return (
      <Card title="Performance Explorer" isLoading={true}>
        <div style={{ height: "480px" }} />
      </Card>
    );
  }

  if (!availableKPIs.length) {
    return (
      <Card title="Performance Explorer">
        <div
          style={{
            height: 480,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#5891cb",
          }}
        >
          No performance data available
        </div>
      </Card>
    );
  }

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
    <Card title="Performance Explorer" subtitle={`${availableKPIs.length} KPIs available`}>
      {/* controls + actions */}
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

        {/* right-side actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() =>
              alert(
                "Performance Explorer shows the KPI time series. Switch views to see:\n• Actual vs Predicted: model fit and confidence.\n• Deviations: where reality differs from the model.\n• Multi-KPI: compare multiple KPIs over time."
              )
            }
            className="icon-button"
            style={actionBtnStyle}
            title="What is this?"
          >
            i
          </button>
          <button onClick={fireAIExplain} className="icon-button" style={actionBtnStyle} title="Explain this KPI">
            💡
          </button>
        </div>
      </div>

      {/* chart */}
      <div style={{ height: 480 }}>
        <Plot
          data={traces}
          layout={{ ...layout, height: 480, autosize: true }}
          onRelayout={handleRelayout}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ["lasso2d", "select2d"],
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* quick stats */}
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
              {formatNumber(
                data[currentKPI].reduce((s, d) => s + (d.actual ?? 0), 0) / data[currentKPI].length,
                isCurrency
              )}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#5891cb", fontSize: 12 }}>Date Range</div>
            <div style={{ fontWeight: 700 }}>
              {data[currentKPI].length
                ? `${data[currentKPI][0].date.split("T")[0]} → ${
                    data[currentKPI][data[currentKPI].length - 1].date.split("T")[0]
                  }`
                : "N/A"}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
