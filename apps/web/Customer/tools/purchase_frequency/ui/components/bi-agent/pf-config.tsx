"use client";
import React from "react";

// Purchase-frequency focused tabs. Purely frontend.
export function createPurchaseFrequencyConfig(data: any) {
  const kpis = data?.kpis || {};
  const freqBins = data?.frequencyDistribution || [];
  const segments = data?.customerSegments || [];

  const healthEmoji = (() => {
    const freq = Number(kpis.avgPurchaseFrequency || 0);
    const days = Number(kpis.avgDaysBetween || 0);
    if (freq >= 4 || days <= 45) return "✅";
    if (freq >= 2 || days <= 90) return "📊";
    if (freq > 0) return "⚠️";
    return "🚨";
  })();

  // Overview Tab
  const overview = {
    id: "overview",
    title: "Overview",
    render: () => (
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          {healthEmoji} Frequency Health
        </div>
        <ul style={{ marginLeft: 18 }}>
          <li>Customers: {kpis.totalCustomers?.toLocaleString?.() || 0}</li>
          <li>Avg Frequency: {Number(kpis.avgPurchaseFrequency || 0).toFixed(2)} / yr</li>
          <li>Avg Days Between: {Number(kpis.avgDaysBetween || 0).toFixed(1)} days</li>
          <li>Active (90d): {Number(kpis.activeCustomerPercentage || 0).toFixed(1)}%</li>
          <li>High-Value Share: {Number(kpis.highValuePercentage || 0).toFixed(1)}%</li>
        </ul>

        <div style={{ marginTop: 10, color: '#94a3b8' }}>
          Tip: Select frequency bins on the chart to focus insights on that segment.
        </div>
      </div>
    )
  };

  // Distribution Tab
  const distribution = {
    id: "distribution",
    title: "Distribution",
    render: () => (
      <div style={{ fontSize: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Frequency Distribution</div>
        {Array.isArray(freqBins) && freqBins.length > 0 ? (
          <ul style={{ marginLeft: 18 }}>
            {freqBins.slice(0, 10).map((b: any, i: number) => (
              <li key={i}>{b?.bin || b?.label || `Bin ${i+1}`}: {b?.count ?? b?.value ?? 0}</li>
            ))}
          </ul>
        ) : (
          <div style={{ color:'#94a3b8' }}>No distribution data available.</div>
        )}
      </div>
    )
  };

  // Segments Tab (aggregated summary connected to dashboard's filtered customer list)
  const segmentTab = {
    id: "segments",
    title: "Segments",
    render: () => {
      // Build summary from filtered customerSegments
      const arr = Array.isArray(segments) ? segments : [];

      // If items have a "segment" string, group by it; else bucket by frequency
      const summaryMap: Record<string, number> = {};
      if (arr.length > 0) {
        const allHaveNamedSegment = arr.every((s: any) => typeof s?.segment === 'string' && s.segment.trim().length > 0);
        if (allHaveNamedSegment) {
          for (const s of arr as any[]) {
            const key = (s.segment || 'Uncategorized').toString();
            summaryMap[key] = (summaryMap[key] || 0) + 1;
          }
        } else {
          // Frequency-based buckets as fallback
          for (const s of arr as any[]) {
            const f = Number((s.frequency ?? s.avgPurchases ?? s.purchases) || 0);
            const key = f <= 1 ? '≤1x/yr' : f <= 2 ? '1–2x/yr' : f <= 3 ? '2–3x/yr' : f <= 5 ? '3–5x/yr' : '>5x/yr';
            summaryMap[key] = (summaryMap[key] || 0) + 1;
          }
        }
      }

      const summary = Object.entries(summaryMap)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return (
        <div style={{ fontSize: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(58, 68, 89, 0.6)' }}>Customer Segments</div>
          {summary.length > 0 ? (
            <ul style={{ marginLeft: 18, marginTop: 8 }}>
              {summary.map((s, i) => (
                <li
                  key={i}
                  style={{
                    marginBottom: 6,
                    padding: '6px 10px',
                    border: '1px solid rgba(58,68,89,0.4)',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    try {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('pf-select-segment', { detail: { segment: s.label } }));
                      }
                    } catch {}
                  }}
                  title="Filter dashboard by this segment"
                >
                  {s.label}: {s.count.toLocaleString?.() ?? s.count}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color:'#94a3b8' }}>No segment summary available.</div>
          )}
          <div style={{ marginTop: 10, color: '#94a3b8' }}>
            Showing top {summary.length || 0} of {arr.length || 0} customers (filtered).
          </div>
        </div>
      );
    }
  };

  // Actions Tab (purchase-frequency focused recommendations)
  const actions = {
    id: "actions",
    title: "Actions",
    render: () => (
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Recommendations</div>
        <ul style={{ marginLeft: 18 }}>
          <li>Cadence nudges timed to {Math.max(7, Math.round(Number(kpis.avgDaysBetween || 45)))}-day intervals</li>
          <li>Bundles or subscribe-and-save for mid-frequency cohorts</li>
          <li>Tiered loyalty boost on 2nd/3rd purchase</li>
          <li>Post-purchase follow-ups and next-best-offer timing</li>
          <li>Micro-incentives for dormant customers (90d+)</li>
        </ul>
      </div>
    )
  };

  return [overview, distribution, segmentTab, actions];
}