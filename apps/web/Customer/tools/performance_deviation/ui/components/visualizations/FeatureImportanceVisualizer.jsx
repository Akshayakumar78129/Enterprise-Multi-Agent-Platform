import React, { useMemo, useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import InfoTip from "../../../../../../ui-common/design-system/components/InfoTip";
import AIInsightPopover from "../../../../../../ui-common/insights/AIInsightPopover";

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
function explainFeature({ feature, importance, kpi }) {
  const pct = (importance * 100).toFixed(1);
  const pretty = String(feature || "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()).replace("Is ", "").replace("Condition ", "");
  const strength = importance >= 0.2 ? "major driver" : importance >= 0.1 ? "clear driver" : "supporting factor";
  return `${pretty} explains ${pct}% of variance for ${kpi || "the KPI"} — a ${strength}. Higher bar ⇒ stronger effect.`;
}

export default function FeatureImportanceVisualizer({
  data = { aggregated: [], byKPI: {} },
  selectedKPI = null,
  onFeatureSelect = null,
  significanceThreshold = 0.1,
  isLoading = false,
}) {
  const [viewMode, setViewMode] = useState("aggregated");
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [threshold, setThreshold] = useState(significanceThreshold);
  const [pop, setPop] = useState({ open: false, x: 0, y: 0, text: "…", title: "AI Insight" });

  const displayData = useMemo(() => {
    if (viewMode === "aggregated") return (data.aggregated || []).filter((f) => f.avg_importance >= threshold / 100);
    if (viewMode === "by_kpi" && selectedKPI && data.byKPI[selectedKPI]) {
      return (data.byKPI[selectedKPI].feature_importance || [])
        .filter((f) => f.importance >= threshold / 100)
        .map((f) => ({ ...f, avg_importance: f.importance }));
    }
    return [];
  }, [data, viewMode, selectedKPI, threshold]);

  const maxImportance = displayData.length ? Math.max(...displayData.map((d) => d.avg_importance)) : 1;

  const handleFeatureClick = (e, feature) => {
    setSelectedFeature(feature);
    onFeatureSelect?.(feature.feature);
    const mouse = e || {};
    const contextual = mouse.shiftKey;
    const x = mouse.clientX ?? 240;
    const y = mouse.clientY ?? 120;

    if (contextual) {
      const payload = {
        tool: "performance_deviation",
        intent: "factor_context",
        kpi: selectedKPI || "All KPIs",
        feature: feature.feature,
        importance: feature.avg_importance,
      };
      const bullets = `• Factor: ${feature.feature}\n• Importance: ${(feature.avg_importance * 100).toFixed(1)}%\n• KPI: ${selectedKPI || "All KPIs"}`;
      setPop({ open: true, x, y, title: "Context for Chatbot", text: bullets });
      emitToChat(payload);
      return;
    }

    const text = explainFeature({ feature: feature.feature, importance: feature.avg_importance, kpi: selectedKPI || "All KPIs" });
    setPop({ open: true, x, y, title: "AI Insight", text });
  };

  if (isLoading) return (<Card title="Feature Importance" isLoading><div style={{ height: 480 }} /></Card>);
  if (!displayData.length) {
    return (
      <Card title="Feature Importance" actions={<InfoTip>Shows which factors explain variance—weekend vs weekday, month, seasonality, etc.</InfoTip>}>
        <div style={{ height: 480, display: "grid", placeItems: "center", color: "#5891cb" }}>No feature importance data available</div>
      </Card>
    );
  }

  const formatFeatureName = (name) =>
    String(name || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace("Is ", "")
      .replace("Condition ", "");

  return (
    <Card
      title="Feature Importance"
      subtitle={`${displayData.length} factors ≥ ${threshold}%`}
      actions={
        <InfoTip label="FeatureImportance">
          Highlights the most influential factors impacting KPIs, allowing you to understand which variables drive performance.
          <br />
          <b>Shift+Click</b> for chat context (auto-sent).
        </InfoTip>
      }
    >
      {/* Controls */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ color: "#f7f9fb", fontSize: 14, fontWeight: 500 }}>View:</label>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { value: "aggregated", label: "All KPIs" },
              { value: "by_kpi", label: "By KPI" },
            ].map((m) => (
              <button
                key={m.value}
                onClick={() => setViewMode(m.value)}
                className="icon-button"
                style={{ background: viewMode === m.value ? "#00e0ff" : "#232a36", color: viewMode === m.value ? "#0a1224" : "#f7f9fb" }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ color: "#f7f9fb", fontSize: 14, fontWeight: 500 }}>Threshold: {threshold}%</label>
          <input type="range" min="0" max="20" step="1" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ width: 100, accentColor: "#00e0ff" }} />
        </div>
      </div>

      {/* Bars */}
      <div style={{ height: 400, overflowY: "auto", padding: 8, background: "rgba(58,68,89,.1)", borderRadius: 8 }}>
        {displayData.map((feature) => {
          const w = (feature.avg_importance / maxImportance) * 100;
          const pretty = formatFeatureName(feature.feature);
          const conciseHover = `${pretty}: ${(feature.avg_importance * 100).toFixed(1)}% of explained variance. Higher bar = stronger effect. Shift+Click for chat context.`;
          return (
            <div
              key={feature.feature}
              onClick={(e) => handleFeatureClick(e, feature)}
              title={conciseHover}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 0",
                cursor: "pointer",
                borderRadius: 4,
                background: selectedFeature?.feature === feature.feature ? "rgba(0,224,255,.1)" : "transparent",
              }}
            >
              <div
                style={{
                  width: 150,
                  color: "#f7f9fb",
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: "right",
                  paddingRight: 12,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={`${pretty} — factor used by the model`}
              >
                {pretty}
              </div>
              <div style={{ flex: 1, height: 36, position: "relative", background: "#232a36", borderRadius: 4, overflow: "hidden", marginRight: 12 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${w}%`,
                    background: "linear-gradient(90deg, #00e0ff, #5fd4d6)",
                    borderRadius: 4,
                    transition: "width .3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 8,
                  }}
                >
                  <span style={{ color: "#f7f9fb", fontSize: 14, fontWeight: 600 }}>{(feature.avg_importance * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div style={{ width: 24, height: 24, display: "grid", placeItems: "center", fontSize: 16 }} aria-label="Click for AI insight">
                📊
              </div>
            </div>
          );
        })}
      </div>

      <AIInsightPopover open={pop.open} x={pop.x} y={pop.y} title={pop.title} body={pop.text} onClose={() => setPop((s) => ({ ...s, open: false }))} />
    </Card>
  );
}
