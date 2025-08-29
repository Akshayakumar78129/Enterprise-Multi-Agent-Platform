// apps/web/Customer/tools/performance_deviation/ui/components/segmentation/SegmentationSorter.jsx
import React, { useState } from "react";

/**
 * Props:
 * - startDate: string (YYYY-MM-DD)
 * - endDate:   string (YYYY-MM-DD)
 * - onApply:   (drilldownPayload) => void
 *   drilldownPayload fits your existing filters.drilldown shape, e.g.:
 *   {
 *     customer: { region: ['APAC'], ids: [42,77], revenue_band: {min:100000,max:500000} },
 *     product:  { category: ['Electronics'], ids:[12,13] }
 *   }
 */
export default function SegmentationSorter({ startDate, endDate, onApply, defaultLimit = 50 }) {
  const [menu, setMenu] = useState(null);       // 'customer' | 'product' | null
  const [sub, setSub]   = useState(null);       // e.g. 'region' | 'value' | ...
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set()); // selected row ids

  const fetchSorted = async (group, by) => {
    setLoading(true);
    setRows([]);
    setSelected(new Set());
    try {
      const u = new URL("/api/performance-deviation/drilldown", window.location.origin);
      u.searchParams.set("group", group);
      u.searchParams.set("by", by);
      u.searchParams.set("limit", String(defaultLimit));
      if (startDate) u.searchParams.set("start", startDate);
      if (endDate)   u.searchParams.set("end", endDate);

      const r = await fetch(u.toString());
      const j = await r.json();
      setRows(j.rows || []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const open = (g, s) => { setMenu(g); setSub(s); fetchSorted(g, s); };

  const toggleRow = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  // Build a drilldown payload from the user selection
  const applySelection = (mode /* 'entities' | 'groups' */) => {
    if (!menu || !sub || !rows.length) return;

    const sel = rows.filter(r => selected.has(r.id));
    if (!sel.length) return;

    const payload = {};
    if (menu === "customer") {
      payload.customer = {};
      if (mode === "entities") {
        payload.customer.ids = sel.map(r => r.id);
      } else {
        // group facet (categorical sub only)
        const facetKey = mapCustomerFacet(sub); // region/value/risk → region/value_tier/risk_band
        if (facetKey) {
          payload.customer[facetKey] = uniq(sel.map(r => r.group_label).filter(Boolean));
        } else if (sub === "revenue") {
          // derive a band from selected rows
          const vals = sel.map(r => Number(r.value || 0)).filter(Number.isFinite);
          if (vals.length) {
            payload.customer.revenue_band = { min: Math.min(...vals), max: Math.max(...vals) };
          }
        }
      }
    }

    if (menu === "product") {
      payload.product = {};
      if (mode === "entities") {
        payload.product.ids = sel.map(r => r.id);
      } else {
        const facetKey = mapProductFacet(sub); // category/subcategory
        if (facetKey) {
          payload.product[facetKey] = uniq(sel.map(r => r.group_label).filter(Boolean));
        }
      }
    }

    onApply?.(payload);
  };

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r.id)));
  };

  return (
    <div style={{ background:"var(--panel)", borderRadius:10, padding:12 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <label style={{ fontWeight:700 }}>Sort & Drill-down:</label>
          <div className="btn-group">
            <button className="seg-btn" onClick={()=> setMenu(menu==='customer'?null:'customer')}>Customer Segmentation ▾</button>
            <button className="seg-btn" onClick={()=> setMenu(menu==='product'?null:'product')}>Product Category ▾</button>
          </div>
        </div>

        {/* Apply controls appear when there’s a selection */}
        {selected.size > 0 && (
          <div style={{ display:"flex", gap:8 }}>
            <button title="Filter by selected entities (IDs)"
              className="apply-btn" onClick={()=>applySelection("entities")}>Apply: Entities</button>
            <button title="Filter by selected groups (region/category/…) or revenue band"
              className="apply-btn secondary" onClick={()=>applySelection("groups")}>Apply: Groups</button>
          </div>
        )}
      </div>

      {menu==='customer' && (
        <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
          {["region","value","revenue","risk","tenure","lifetime_value"].map(k=>(
            <button key={k} className={`chip ${sub===k?'active':''}`} onClick={()=>open('customer',k)}>
              {pretty(k)}
            </button>
          ))}
        </div>
      )}

      {menu==='product' && (
        <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
          {["category","subcategory","profit","returns","inventory_risk"].map(k=>(
            <button key={k} className={`chip ${sub===k?'active':''}`} onClick={()=>open('product',k)}>
              {pretty(k)}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop:12, background:"rgba(26,32,56,.6)", border:"1px solid #3a4459", borderRadius:10, overflow:"hidden" }}>
        <div style={{ padding:"8px 12px", borderBottom:"1px solid #3a4459", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontWeight:800 }}>{menu ? `${menu} › ${sub || '—'}` : "Choose a sort"}</div>
          {loading && <div style={{ color:"#5891cb" }}>Loading…</div>}
        </div>
        <div style={{ maxHeight:320, overflow:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"rgba(255,255,255,.04)" }}>
                <th style={th}><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
                <th style={th}>Name</th>
                <th style={th}>Group</th>
                <th style={th}>Metric</th>
                <th style={th}>Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r)=>(
                <tr key={r.id}
                    style={{ borderTop:"1px solid #2c3446", cursor:"pointer", background: selected.has(r.id)?'rgba(0,224,255,.08)':'transparent' }}
                    onClick={()=>toggleRow(r.id)}
                    title="Click to select; Apply as Entities or Groups">
                  <td style={{...td, width:34}}>
                    <input type="checkbox" checked={selected.has(r.id)} onChange={()=>toggleRow(r.id)} />
                  </td>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{r.group_label ?? "—"}</td>
                  <td style={td}>{r.metric}</td>
                  <td style={td}>{r.value_display ?? r.value}</td>
                </tr>
              ))}
              {!rows.length && !loading && (
                <tr><td style={{...td, textAlign:"center"}} colSpan={5}>No rows</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .seg-btn { padding: 6px 12px; border-radius: 8px; border: 1px solid var(--graphiteLight); background: var(--graphite); color: var(--cloudWhite); font-size: 12px; cursor: pointer; }
        .chip { padding: 6px 10px; border-radius: 999px; border: 1px solid #3a4459; background: #232a36; color: #f7f9fb; font-size: 12px; cursor: pointer; }
        .chip.active { background: #00e0ff; color: #0a1224; border-color: #00e0ff; }
        .apply-btn { padding: 6px 10px; border-radius: 8px; border: 1px solid #00e0ff; background: #00e0ff; color: #0a1224; font-size: 12px; font-weight: 800; cursor: pointer; }
        .apply-btn.secondary { border-color: #3a4459; background: #232a36; color: #f7f9fb; }
      `}</style>
    </div>
  );
}

const th = { textAlign:"left", padding:"8px 12px", borderRight:"1px solid #2c3446" };
const td = { padding:"8px 12px", borderRight:"1px solid #2c3446" };

function pretty(k){ return k.replace(/_/g," ").replace(/\b\w/g,m=>m.toUpperCase()); }
function uniq(arr){ return Array.from(new Set(arr)); }

function mapCustomerFacet(sub) {
  switch (sub) {
    case "region": return "region";
    case "value": return "value_tier";
    case "risk": return "risk_band";
    default: return null; // revenue/tenure/lifetime_value are numeric; handled via bands or entity IDs
  }
}
function mapProductFacet(sub) {
  switch (sub) {
    case "category": return "category";
    case "subcategory": return "subcategory";
    default: return null; // profit/returns/inventory_risk are numeric
  }
}
