import React, { useState, useEffect, useCallback, useMemo } from "react";
import PerformanceKPITiles from "../components/kpi/PerformanceKPITiles";
import PerformanceExplorer from "../components/visualizations/PerformanceExplorer";
import FeatureImportanceVisualizer from "../components/visualizations/FeatureImportanceVisualizer";
import VarianceDecomposition from "../components/visualizations/VarianceDecomposition";
import DeviationPatternExplorer from "../components/visualizations/DeviationPatternExplorer";
import BusinessFunctionComparison from "../components/visualizations/BusinessFunctionComparision"; // adjust if your file name differs
import ExternalCorrelationMatrix from "../components/visualizations/ExternalCorrelationMatrix";
import ThemeToggle from "../components/ThemeToggle";

// ✅ Use the real agents TSX component
import FloatingAIChat from "../components/chat/EnhancedContextAwareChatbot";

const CURRENCY_KPI_REGEX = /(revenue|order_value|amount|ar_)/i;
const nf2 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const usd2 = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const fmtValue = (v, isCurrency = false) => {
  if (v == null || Number.isNaN(v)) return "—";
  return isCurrency ? usd2.format(v) : nf2.format(v);
};

const fmtKpiName = (name) =>
  (name || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Broadcast to the floating chat to open with context (orchestrator mention). */
function emitAskAI(detail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ai:insight-request", { detail }));
  }
}

const PerformanceDeviationDashboard = () => {
  // Data & UI state
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: "2018-01-01",
    endDate: "2020-12-31",
    businessFunctions: ["sales", "customer", "finance"],
    significanceThreshold: 0.05,
  });
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(null);

  // Fetch
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/performance-deviation/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        if (!selectedKPI && result.data.visualizationData?.performanceExplorer) {
          const kpis = Object.keys(result.data.visualizationData.performanceExplorer);
          if (kpis.length > 0) setSelectedKPI(kpis[0]);
        }
      } else {
        throw new Error(result.error || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching performance deviation data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, selectedKPI]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handlers
  const handleFiltersChange = useCallback((next) => {
    setFilters((prev) => ({ ...prev, ...next }));
  }, []);

  const handleKPISelection = useCallback((kpis) => {
    if (Array.isArray(kpis) && kpis.length > 0) setSelectedKPI(kpis[0]);
    else if (typeof kpis === "string") setSelectedKPI(kpis);
  }, []);

  const handleTimeRangeChange = useCallback((range) => {
    setSelectedTimeRange(range);
    if (range) {
      handleFiltersChange({ startDate: range.start, endDate: range.end });
    }
  }, [handleFiltersChange]);

  const handleFeatureSelect = useCallback((feature) => {
    // Hook for cross-highlighting if needed.
    console.log("Selected feature:", feature);
  }, []);

  // Build a small snapshot of current view for agents
  const agentSnapshot = useMemo(() => {
    const viz = data?.visualizationData || {};
    const currentSeries = selectedKPI ? viz.performanceExplorer?.[selectedKPI] || [] : [];
    const isCurrency = CURRENCY_KPI_REGEX.test(selectedKPI || "");
    const avg = currentSeries.length
      ? currentSeries.reduce((s, d) => s + (d.actual ?? 0), 0) / currentSeries.length
      : null;

    return {
      selectedKPI,
      selectedKPI_isCurrency: isCurrency,
      filters,
      selectedTimeRange,
      kpis: data?.kpis || {},
      meta: data?.metadata || {},
      quickStats: {
        points: currentSeries.length,
        average: avg,
        average_display: fmtValue(avg, isCurrency),
        dateStart: currentSeries[0]?.date,
        dateEnd: currentSeries[currentSeries.length - 1]?.date,
      },
    };
  }, [data, selectedKPI, filters, selectedTimeRange]);

  // --- Error UI ---
  if (error) {
    return (
      <div
        style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          height: "400px", backgroundColor: "var(--midnightNavy)", color: "var(--cloudWhite)",
          textAlign: "center", padding: 20,
        }}
      >
        <div style={{ maxWidth: 720, width: "100%" }}>
          <h2 style={{ color: "var(--signalMagenta)", margin: "0 0 12px" }}>
            Error Loading Performance Deviation Dashboard
          </h2>
          <p style={{ color: "var(--muted)", margin: "0 0 16px" }}>{error}</p>
          <button
            onClick={fetchData}
            style={{
              padding: "8px 16px", backgroundColor: "var(--electricCyan)", color: "var(--midnightNavy)",
              border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700,
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const viz = data?.visualizationData || {};

  return (
    <div
      style={{
        backgroundColor: "var(--midnightNavy)",
        minHeight: "100vh",
        padding: 20,
        color: "var(--cloudWhite)",
        maxWidth: 1920,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          borderBottom: "2px solid var(--graphiteLight)",
          paddingBottom: 12,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              color: "var(--cloudWhite)", fontSize: "clamp(20px, 2.4vw, 28px)", fontWeight: 800, margin: "0 0 6px 0",
            }}
          >
            Performance Deviation Analysis
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "clamp(12px, 1.6vw, 16px)", margin: 0 }}>
            ML-powered analysis of KPI performance variations and external factor influences
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThemeToggle />
          <button
            onClick={fetchData}
            disabled={isLoading}
            style={{
              padding: "8px 12px",
              backgroundColor: isLoading ? "var(--graphiteLight)" : "var(--electricCyan)",
              color: isLoading ? "var(--muted)" : "var(--midnightNavy)",
              border: "none",
              borderRadius: 999,
              cursor: isLoading ? "not-allowed" : "pointer",
              fontWeight: 800,
            }}
            title="Refresh data"
          >
            {isLoading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "center",
          padding: 12,
          backgroundColor: "var(--panel)",
          borderRadius: 10,
        }}
      >
        {/* Date range */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Date Range:</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFiltersChange({ startDate: e.target.value })}
            style={{ padding: "6px 8px", fontSize: 12, minWidth: 140 }}
          />
          <span style={{ color: "var(--muted)" }}>to</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFiltersChange({ endDate: e.target.value })}
            style={{ padding: "6px 8px", fontSize: 12, minWidth: 140 }}
          />
        </div>

        {/* Functions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Functions:</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["sales", "customer", "finance"].map((func) => {
              const isOn = filters.businessFunctions?.includes(func);
              return (
                <button
                  key={func}
                  onClick={() => {
                    const curr = filters.businessFunctions || [];
                    const next = isOn ? curr.filter((f) => f !== func) : [...curr, func];
                    handleFiltersChange({ businessFunctions: next });
                  }}
                  style={{
                    padding: "6px 10px",
                    fontSize: 12,
                    borderRadius: 999,
                    border: `1px solid var(--graphiteLight)`,
                    backgroundColor: isOn ? "var(--electricCyan)" : "var(--graphite)",
                    color: isOn ? "var(--midnightNavy)" : "var(--cloudWhite)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  {func.charAt(0).toUpperCase() + func.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Significance */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>
            Significance: {nf2.format(filters.significanceThreshold)}
          </label>
          <input
            type="range"
            min="0.01"
            max="0.10"
            step="0.01"
            value={filters.significanceThreshold}
            onChange={(e) => handleFiltersChange({ significanceThreshold: Number(e.target.value) })}
            style={{ width: 140, accentColor: "var(--electricCyan)" }}
          />
        </div>
      </div>

      {/* KPI Tiles + AI explain */}
      <div style={{ marginBottom: 24 }}>
        <PerformanceKPITiles kpis={data?.kpis || {}} isLoading={isLoading} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            onClick={() =>
              emitAskAI({
                tool: "performance_deviation",
                intent: "explain_kpis_plain_english",
                kpis: data?.kpis || {},
                filters,
                selectedKPI,
              })
            }
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid var(--graphiteLight)",
              background: "var(--graphite)",
              color: "var(--cloudWhite)",
              cursor: "pointer",
              fontWeight: 600,
            }}
            title="Explain these KPIs in simple terms"
          >
            💡 Explain these KPIs (AI)
          </button>
        </div>
      </div>

      {/* Main visualizations */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Performance Explorer (uses WebGL + no markers at full view for clarity) */}
        <div style={{ gridColumn: "1 / -1", minWidth: 0 }}>
          <PerformanceExplorer
            data={viz.performanceExplorer || {}}
            selectedKPIs={selectedKPI ? [selectedKPI] : []}
            onKPISelect={handleKPISelection}
            dateRange={selectedTimeRange}
            onDateRangeChange={handleTimeRangeChange}
            isLoading={isLoading}
          />
        </div>

        {/* Feature Importance */}
        <div style={{ minWidth: 0 }}>
          <FeatureImportanceVisualizer
            data={viz.featureImportance || { aggregated: [], byKPI: {} }}
            selectedKPI={selectedKPI}
            onFeatureSelect={handleFeatureSelect}
            significanceThreshold={10}
            isLoading={isLoading}
          />
        </div>

        {/* Variance Decomposition */}
        <div style={{ minWidth: 0 }}>
          <VarianceDecomposition
            data={viz.varianceDecomposition || {}}
            selectedKPI={selectedKPI}
            onKPISelect={handleKPISelection}
            showComparison={false}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Optional: Business Function Radar + Correlation Matrix */}
      {(viz.businessFunctionComparison || viz.factorCorrelations) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: viz.factorCorrelations ? "1fr 1fr" : "1fr",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {viz.businessFunctionComparison && (
            <div style={{ minWidth: 0 }}>
              <BusinessFunctionComparison data={viz.businessFunctionComparison} isLoading={isLoading} />
            </div>
          )}
          {viz.factorCorrelations && (
            <div style={{ minWidth: 0 }}>
              <ExternalCorrelationMatrix data={viz.factorCorrelations} isLoading={isLoading} />
            </div>
          )}
        </div>
      )}

      {/* Deviation Pattern Explorer */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
        <div style={{ minWidth: 0 }}>
          <DeviationPatternExplorer
            data={viz.deviationPatterns || { calendar: {}, monthlyStats: {}, patterns: [] }}
            selectedYear={selectedTimeRange ? new Date(selectedTimeRange.start).getFullYear() : 2020}
            onYearSelect={(year) => {
              const startDate = `${year}-01-01`;
              const endDate = `${year}-12-31`;
              handleTimeRangeChange({ start: startDate, end: endDate });
            }}
            significanceThreshold={0.5}
            onThresholdChange={(threshold) => console.log("Threshold changed:", threshold)}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Footer (numbers formatted) */}
      {data && (
        <div
          style={{
            marginTop: 28,
            padding: 16,
            backgroundColor: "var(--panel)",
            borderRadius: 10,
            borderTop: "3px solid var(--electricCyan)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ color: "var(--electricCyan)", fontSize: 20, fontWeight: 800 }}>
                {nf2.format(data.metadata?.totalDataPoints || 0)}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Total Data Points</div>
            </div>
            <div>
              <div style={{ color: "var(--electricCyan)", fontSize: 20, fontWeight: 800 }}>
                {nf2.format(data.metadata?.businessFunctions?.length || 0)}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Business Functions</div>
            </div>
            <div>
              <div style={{ color: "var(--electricCyan)", fontSize: 20, fontWeight: 800 }}>
                {nf2.format(Object.keys(viz.performanceExplorer || {}).length)}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>KPIs Analyzed</div>
            </div>
            <div>
              <div style={{ color: "var(--electricCyan)", fontSize: 20, fontWeight: 800 }}>
                {data.metadata?.lastUpdated ? new Date(data.metadata.lastUpdated).toLocaleDateString() : "N/A"}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Last Updated</div>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Chat wired to your real agents (EnhancedContextAwareChatbot) */}
      <FloatingAIChat
        // Send a compact snapshot so agents can give grounded answers
        snapshotGetter={() => agentSnapshot}
        // Optional: fallback handler if your agents are temporarily unavailable.
        // If your real agents are always available, you can remove onAskAI.
        onAskAI={async (message) => {
          try {
            const r = await fetch("/api/ai/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ agent: null, message, context: agentSnapshot }),
            });
            const j = await r.json();
            return j?.answer || j?.text || "Okay.";
          } catch (e) {
            return "I couldn't reach the agent service.";
          }
        }}
      />
    </div>
  );
};

export default PerformanceDeviationDashboard;
