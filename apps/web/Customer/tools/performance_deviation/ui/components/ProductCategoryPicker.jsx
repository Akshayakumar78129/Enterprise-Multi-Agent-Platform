// apps/web/components/ProductCategoryPicker.jsx
import React, { useEffect, useMemo, useState } from "react";

export default function ProductCategoryPicker({ onApply = () => {} }) {
  const [options, setOptions] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/performance-deviation/filters");
        const j = await r.json();
        const groups = j?.productGroups || j?.products || j?.categories || [];
        if (mounted) setOptions(groups);
      } catch {
        if (mounted) setOptions(["RETAIL","WHOLESALE","DISTRIBUTION","ONLINE","EXPORT"]); // fallback
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return options;
    return options.filter(o => String(o).toLowerCase().includes(qq));
  }, [q, options]);

  return (
    <div style={{ background:"var(--panel)", borderRadius:10, padding:12 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ fontWeight:700 }}>Product Categories</div>
        <button
          onClick={() => onApply(selected)}
          style={{ padding:"6px 10px", borderRadius:8, border:"1px solid var(--graphiteLight)", background:"var(--graphite)", color:"var(--cloudWhite)", cursor:"pointer", fontSize:12 }}
          title="Apply selection"
        >Apply</button>
      </div>

      <input
        value={q} onChange={(e)=>setQ(e.target.value)}
        placeholder="Search categories…" style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #3a4459", background:"#232a36", color:"#f7f9fb", marginBottom:8 }}
      />

      <div style={{ maxHeight: 180, overflowY:"auto", display:"grid", gap:6 }}>
        {filtered.map((name) => {
          const on = selected.includes(name);
          return (
            <label key={name} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
              <input type="checkbox" checked={on} onChange={() => setSelected(on ? selected.filter(s=>s!==name) : [...selected, name])}/>
              <span>{name}</span>
            </label>
          );
        })}
        {!filtered.length && <div style={{ color:"#5891cb" }}>No matches</div>}
      </div>
    </div>
  );
}
