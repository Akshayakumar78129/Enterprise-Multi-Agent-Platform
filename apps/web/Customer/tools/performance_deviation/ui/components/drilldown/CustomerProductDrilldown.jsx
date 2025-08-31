// apps/web/Customer/tools/performance_deviation/ui/components/drilldown/CustomerProductDrilldown.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";

/**
 * Deep sorting & drilldown:
 * 1) Choose "Customer Segmentation" or "Product Category"
 * 2) Then choose sub-criteria (Region, Value, Revenue, Risk…)
 * 3) Then see entities list (customers/products)
 *
 * Data shape expected (if provided) resembles:
 * {
 *   customers: {
 *     bySegmentation: {
 *       region: { "NA": [...customers], "EMEA": [...], ... },
 *       value: { "High": [...], "Medium": [...], "Low": [...] },
 *       revenue: { "Top 10%": [...], ... },
 *       risk: { "High Risk": [...], ... }
 *     }
 *   },
 *   products: {
 *     byCategory: {
 *       family: { "A": [...products], "B": [...] },
 *       revenue: { "Top 10%": [...], ... },
 *       margin: { "High": [...], ... }
 *     }
 *   }
 * }
 *
 * If `data` is missing, the component calls `/api/performance-deviation/drilldown`.
 */
export default function CustomerProductDrilldown({ data: dataProp, filters }) {
  const [data, setData] = useState(dataProp);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("customer"); // "customer" | "product"
  const [criteria, setCriteria] = useState("region");
  const [bucket, setBucket] = useState(null);

  useEffect(() => {
    if (dataProp) return;
    setLoading(true);
    fetch("/api/performance-deviation/drilldown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filters: filters || {} }),
    })
      .then((r) => r.json())
      .then((j) => setData(j?.data || {}))
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, [dataProp, filters]);

  const criteriaOptions = useMemo(() => {
    if (mode === "customer") return ["region", "value", "revenue", "risk"];
    return ["family", "revenue", "margin"];
  }, [mode]);

  const buckets = useMemo(() => {
    const root =
      mode === "customer"
        ? data?.customers?.bySegmentation?.[criteria]
        : data?.products?.byCategory?.[criteria];
    if (!root) return [];
    return Object.keys(root);
  }, [data, mode, criteria]);

  const items = useMemo(() => {
    const root =
      mode === "customer"
        ? data?.customers?.bySegmentation?.[criteria]
        : data?.products?.byCategory?.[criteria];
    if (!root) return [];
    const arrs = bucket ? root[bucket] || [] : [];
    return arrs;
  }, [data, mode, criteria, bucket]);

  return (
    <Card title="Drilldown & Sorting" subtitle="Segment → Sub-criteria → Entities">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {["customer", "product"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setCriteria(m === "customer" ? "region" : "family");
                  setBucket(null);
                }}
                className="icon-button"
                style={{ background: mode === m ? "var(--electricCyan)" : "var(--graphite)", color: mode === m ? "var(--midnightNavy)" : "var(--cloudWhite)" }}
              >
                {m === "customer" ? "Customer Segmentation" : "Product Category"}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 12, color: "var(--muted)" }}>Sub-criteria</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, marginBottom: 12 }}>
            {criteriaOptions.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCriteria(c);
                  setBucket(null);
                }}
                className="icon-button"
                style={{ background: criteria === c ? "var(--electricCyan)" : "var(--graphite)", color: criteria === c ? "var(--midnightNavy)" : "var(--cloudWhite)" }}
                title={`Sort by ${c}`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          <label style={{ fontSize: 12, color: "var(--muted)" }}>Buckets</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {loading && <span style={{ color: "var(--muted)" }}>Loading…</span>}
            {!loading && buckets.length === 0 && <span style={{ color: "var(--muted)" }}>No buckets</span>}
            {buckets.map((b) => (
              <button
                key={b}
                onClick={() => setBucket(b)}
                className="icon-button"
                style={{ background: bucket === b ? "var(--electricCyan)" : "var(--graphite)", color: bucket === b ? "var(--midnightNavy)" : "var(--cloudWhite)" }}
                title={`Show entities in ${b}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ color: "var(--muted)" }}>
              {mode === "customer" ? "Customers" : "Products"} {bucket ? `in ${bucket}` : ""}
            </div>
            <div style={{ color: "var(--muted)" }}>{items.length.toLocaleString()} items</div>
          </div>

          <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--graphiteLight)", borderRadius: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--graphite)" }}>
                  <th style={th}>Name</th>
                  <th style={th}>Region</th>
                  <th style={th}>Revenue</th>
                  <th style={th}>Value/Margin</th>
                  <th style={th}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--graphiteLight)" }} title="Click to open details in your CRM (wire as needed)">
                    <td style={td}>{it.name || it.sku || "—"}</td>
                    <td style={td}>{it.region || "—"}</td>
                    <td style={td}>{formatCurrency(it.revenue)}</td>
                    <td style={td}>{it.value ?? it.margin ?? "—"}</td>
                    <td style={td}>{it.risk || "—"}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td style={{ ...td, color: "var(--muted)" }} colSpan={5}>
                      Select a bucket to view entities
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}

const th = { textAlign: "left", padding: "8px 10px", color: "var(--cloudWhite)", borderBottom: "1px solid var(--graphiteLight)" };
const td = { padding: "8px 10px", color: "var(--cloudWhite)" };

function formatCurrency(v) {
  if (v == null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(v));
}
