// apps/web/pages/customers/performance-deviation.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";


import PerformanceKPITiles from "../components/kpi/PerformanceKPITiles";
import PerformanceExplorer from "../components/visualizations/PerformanceExplorer";
import FeatureImportanceVisualizer from "../components/visualizations/FeatureImportanceVisualizer";
import VarianceDecomposition from "../components/visualizations/VarianceDecomposition";
import DeviationPatternExplorer from "../components/visualizations/DeviationPatternExplorer";
import BusinessFunctionComparison from "../components/visualizations/BusinessFunctionComparision";
import ExternalCorrelationMatrix from "../components/visualizations/ExternalCorrelationMatrix";
import ThemeToggle from "../components/ThemeToggle";

// Pickers
import SegmentedCustomerPicker from "../components/SegmentedCustomerPicker";
import ProductCategoryPicker from "../components/ProductCategoryPicker";

// Chat + BI
import FloatingAIChat from "../components/chat/EnhancedContextAwareChatbot";
import BusinessIntelligenceAgent from "../components/bi/BusinessIntelligenceAgent";
import BusinessIntelligenceTrigger from "../components/bi/BusinessIntelligenceTrigger";

const CURRENCY_KPI_REGEX = /(revenue|order_value|amount|ar_)/i;
const nf2 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const usd2 = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const fmtValue = (v, isCurrency = false) => (v == null || Number.isNaN(v) ? "—" : isCurrency ? usd2.format(v) : nf2.format(v));

function emitAskAI(detail) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ai:insight-request", { detail }));
}

export default function PerformanceDeviationDashboard() {
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

  const [customerIds, setCustomerIds] = useState([]);
  const [productGroups, setProductGroups] = useState([]);

  const [biOpen, setBIOpen] = useState(false);

  const fetchData = useCallback(async () => {
  try {
    setIsLoading(true);
    setError(null);

    // 1) Try POST (fast & clean)
    let r = await fetch("/api/performance-deviation/data", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ ...filters, customerIds, productGroups }),
    });

    // 2) If JSON parser rejects on the server (HTTP 400), fall back to GET with query params
    if (!r.ok && r.status === 400) {
      const qs = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        customerIds: (customerIds || []).join(","),
        productGroups: (productGroups || []).join(","),
      }).toString();
      r = await fetch(`/api/performance-deviation/data?${qs}`, { method: "GET" });
    }

    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const j = await r.json();
    if (!j.success) throw new Error(j.error || "Failed to fetch data");

    setData(j.data);
    if (!selectedKPI && j.data?.visualizationData?.performanceExplorer) {
      const kpis = Object.keys(j.data.visualizationData.performanceExplorer);
      if (kpis.length) setSelectedKPI(kpis[0]);
    }
  } catch (e) {
    setError(e.message);
  } finally {
    setIsLoading(false);
  }
}, [filters, customerIds, productGroups, selectedKPI]);


  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFiltersChange = useCallback((next) => setFilters((p) => ({ ...p, ...next })), []);
  const handleKPISelection = useCallback((kpis) => {
    if (Array.isArray(kpis) && kpis.length > 0) setSelectedKPI(kpis[0]);
    else if (typeof kpis === "string") setSelectedKPI(kpis);
  }, []);
  const handleTimeRangeChange = useCallback((range) => {
    setSelectedTimeRange(range);
    if (range) handleFiltersChange({ startDate: range.start, endDate: range.end });
  }, [handleFiltersChange]);

  const viz = data?.visualizationData || {};
  const churnCustomers = data?.risk?.customers || [];
  const highRiskCount = useMemo(() => {
    const fromChurn = Array.isArray(churnCustomers) ? churnCustomers.filter(c => ["High", "Very High"].includes(c?.risk_level)).length : 0;
    const fromPatterns = Array.isArray(viz?.deviationPatterns?.patterns) ? viz.deviationPatterns.patterns.filter(p => p?.is_significant).length : 0;
    return fromChurn || fromPatterns || 0;
  }, [churnCustomers, viz]);

  const agentSnapshot = useMemo(() => {
    const currentSeries = selectedKPI ? viz.performanceExplorer?.[selectedKPI] || [] : [];
    const isCurrency = CURRENCY_KPI_REGEX.test(selectedKPI || "");
    const avg = currentSeries.length ? currentSeries.reduce((s, d) => s + (d.actual ?? 0), 0) / currentSeries.length : null;
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
      selection: { customerIds, productGroups },
    };
  }, [data, selectedKPI, filters, selectedTimeRange, customerIds, productGroups]);

  if (error) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height: 400, backgroundColor:"var(--midnightNavy)", color:"var(--cloudWhite)" }}>
        <div style={{ maxWidth: 720, textAlign:"center" }}>
          <h2 style={{ color:"var(--signalMagenta)" }}>Error Loading Performance Deviation Dashboard</h2>
          <p style={{ color:"var(--muted)" }}>{error}</p>
          <button onClick={fetchData} style={{ padding:"8px 16px", background:"var(--electricCyan)", color:"var(--midnightNavy)", border:"none", borderRadius:8, fontWeight:700 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--midnightNavy)", minHeight: "100vh", padding: 24, color: "var(--cloudWhite)", maxWidth: 1920, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }} />
<div style={{ marginBottom: 18, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
  <div style={{ minWidth: 0 }}>
    <h1 style={{ color: "var(--cloudWhite)", fontSize: "clamp(20px, 2.4vw, 28px)", fontWeight: 800, margin: 0 }}>
      Performance Variation Analysis
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
        border: "none", borderRadius: 999, cursor: isLoading ? "not-allowed" : "pointer", fontWeight: 800,
      }}
      title="Refresh data"
    >
      {isLoading ? "Loading…" : "Refresh"}
    </button>
  </div>
</div>

{/* ADD EXTRA SPACE BEFORE DATE RANGE */}
<div style={{ height: "40px" }} />  {/* pushes date range filter a few inches below */}

{/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, marginTop: 12, flexWrap: "wrap", alignItems: "center", padding: 12, backgroundColor: "var(--panel)", borderRadius: 10 }}>
        {/* Date range */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Date Range:</label>
          <input type="date" value={filters.startDate} onChange={(e) => handleFiltersChange({ startDate: e.target.value })} style={{ padding: "6px 8px", fontSize: 12, minWidth: 140 }} />
          <span style={{ color: "var(--muted)" }}>to</span>
          <input type="date" value={filters.endDate} onChange={(e) => handleFiltersChange({ endDate: e.target.value })} style={{ padding: "6px 8px", fontSize: 12, minWidth: 140 }} />
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
                    padding: "6px 10px", fontSize: 12, borderRadius: 999, border: `1px solid var(--graphiteLight)`,
                    backgroundColor: isOn ? "var(--electricCyan)" : "var(--graphite)",
                    color: isOn ? "var(--midnightNavy)" : "var(--cloudWhite)", cursor: "pointer", transition: "all 0.2s ease",
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
          <label style={{ fontSize: 14, fontWeight: 600 }}>Significance: {nf2.format(filters.significanceThreshold)}</label>
          <input
            type="range" min="0.01" max="0.10" step="0.01" value={filters.significanceThreshold}
            onChange={(e) => handleFiltersChange({ significanceThreshold: Number(e.target.value) })}
            style={{ width: 140, accentColor: "var(--electricCyan)" }}
          />
        </div>
      </div>

      {/* Segmentation: Customers & Products (collapsible) */}
      {(() => {
        const [openCust, openProd] = [true, true];
        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background:"var(--panel)", borderRadius:10, border:"1px solid var(--graphiteLight)", overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", borderBottom:"1px solid var(--graphiteLight)" }}>
                <div style={{ fontWeight:700 }}>Customer Segmentation</div>
                <button onClick={(e)=>{
                  const el = e.currentTarget; const cont = el.parentElement?.nextSibling; if (cont) cont.style.display = cont.style.display === 'none' ? 'block' : 'none';
                  el.textContent = (cont && cont.style.display === 'none') ? '▸' : '▾';
                }} style={{ background:'transparent', border:'none', color:'var(--cloudWhite)', cursor:'pointer' }} title="Collapse/Expand">▾</button>
              </div>
              <div style={{ padding:10 }}>
                <SegmentedCustomerPicker onApply={setCustomerIds} />
              </div>
            </div>
            <div style={{ background:"var(--panel)", borderRadius:10, border:"1px solid var(--graphiteLight)", overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", borderBottom:"1px solid var(--graphiteLight)" }}>
                <div style={{ fontWeight:700 }}>Product Segmentation</div>
                <button onClick={(e)=>{
                  const el = e.currentTarget; const cont = el.parentElement?.nextSibling; if (cont) cont.style.display = cont.style.display === 'none' ? 'block' : 'none';
                  el.textContent = (cont && cont.style.display === 'none') ? '▸' : '▾';
                }} style={{ background:'transparent', border:'none', color:'var(--cloudWhite)', cursor:'pointer' }} title="Collapse/Expand">▾</button>
              </div>
              <div style={{ padding:10 }}>
                <ProductCategoryPicker onApply={setProductGroups} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* KPI Tiles + quick AI */}
      <div style={{ marginBottom: 24 }}>
        <PerformanceKPITiles
          kpis={data?.kpis || {}}
          isLoading={isLoading}
          snapshot={{ selectedKPI, filters, selection: { customerIds, productGroups } }}
        />
        {/* removed per request */}
      </div>

      {/* Visualisations */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
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

        <div style={{ minWidth: 0 }}>
          <FeatureImportanceVisualizer
            data={viz.featureImportance || { aggregated: [], byKPI: {} }}
            selectedKPI={selectedKPI}
            significanceThreshold={10}
            isLoading={isLoading}
          />
        </div>

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

      {(viz.businessFunctionComparison || viz.factorCorrelations) && (
        <div style={{ display: "grid", gridTemplateColumns: viz.factorCorrelations ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 24 }}>
          {viz.businessFunctionComparison && (
            <div style={{ minWidth: 0 }}>
              <BusinessFunctionComparison data={viz.businessFunctionComparison} isLoading={isLoading} />
            </div>
          )}
          {viz.factorCorrelations && (
            <div style={{ minWidth: 0 }}>
              <ExternalCorrelationMatrix data={viz.factorCorrelations} selectedKPI={selectedKPI || null} isLoading={isLoading} />
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
        <div style={{ minWidth: 0 }}>
          <DeviationPatternExplorer
            data={viz.deviationPatterns || { calendar: {}, monthlyStats: {}, patterns: [] }}
            selectedYear={selectedTimeRange ? new Date(selectedTimeRange.start).getFullYear() : 2020}
            onYearSelect={(year) => handleTimeRangeChange({ start: `${year}-01-01`, end: `${year}-12-31` })}
            significanceThreshold={0.5}
            onThresholdChange={(threshold) => console.log("Threshold changed:", threshold)}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Footer */}
      {data && (
        <div style={{ marginTop: 28, padding: 16, backgroundColor: "var(--panel)", borderRadius: 10, borderTop: "3px solid var(--electricCyan)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, textAlign: "center" }}>
            <div>
              <div style={{ color: "var(--electricCyan)", fontSize: 20, fontWeight: 800 }}>{nf2.format(data.metadata?.totalDataPoints || 0)}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Total Data Points</div>
            </div>
            <div>
              <div style={{ color: "var(--electricCyan)", fontSize: 20, fontWeight: 800 }}>{nf2.format(data.metadata?.businessFunctions?.length || 0)}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Business Functions</div>
            </div>
            <div>
              <div style={{ color: "var(--electricCyan)", fontSize: 20, fontWeight: 800 }}>{nf2.format(Object.keys(viz.performanceExplorer || {}).length)}</div>
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

      {/* BI Agent panel + trigger (lower z-index than Chat) */}
      <div style={{ position: "fixed", right: 96, bottom: 24, zIndex: 1100 }}>
        <BusinessIntelligenceTrigger onClick={() => setBIOpen(true)} highRiskCount={highRiskCount} />
      </div>
      <div style={{ position: "fixed", inset: 0, pointerEvents: biOpen ? "auto" : "none", zIndex: 1000 }}>
        <BusinessIntelligenceAgent
          isVisible={biOpen}
          onClose={() => setBIOpen(false)}
          snapshot={agentSnapshot}
          viz={viz}
        />
      </div>

      {/* Floating AI Chat (higher z-index to avoid overlap) */}
      <div style={{ zIndex: 1200, position: "relative" }}>
        <FloatingAIChat
          snapshotGetter={() => agentSnapshot}
          onAskAI={async (message) => {
            try {
              const text = typeof message === "string" ? message : (message?.text || "");
              const r = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agent: null, message: text }),
              });
              const j = await r.json();
              if (!r.ok) return `⚠️ Agent API ${r.status}: ${j.error || ""}\n${j.upstream_body || j.detail || ""}`;
              return j?.text || "(no answer)";
            } catch (e) {
              return `I couldn't reach the agent service. ${e?.message || ""}`;
            }
          }}
        />
      </div>
    </div>
  );
}