import React, { useEffect, useState } from "react";

export default function SegmentedCustomerPicker({ onApply }) {
  const [segment, setSegment] = useState("Enterprise");
  const [q, setQ] = useState("");
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      try {
        const url = `/api/customers/segmented-search?segment=${encodeURIComponent(segment)}&q=${encodeURIComponent(q)}`;
        const r = await fetch(url, { signal: controller.signal });
        const j = await r.json();
        setOptions(j?.data?.customers || []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [segment, q]);

  const toggle = (id) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const clear = () => { setSelected(new Set()); onApply?.([]); };
  const apply = () => onApply?.(Array.from(selected));

  return (
    <div style={{ background:"rgba(40,48,66,0.5)", border:"1px solid #3a4459", borderRadius:12, padding:12 }}>
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
        <strong style={{ color:"#cfd8ea" }}>Customer Selection</strong>
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          {["Enterprise","Small Business","Startup"].map(s => (
            <button
              key={s}
              onClick={() => { setSegment(s); setSelected(new Set()); }}
              style={{
                padding:"6px 10px",
                borderRadius:6,
                border:"1px solid #3a4459",
                background: segment===s ? "#00e0ff" : "#232a36",
                color: segment===s ? "#0a1224" : "#f7f9fb",
                cursor:"pointer"
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={`Search ${segment} customers…`}
        style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #3a4459", background:"#0f1422", color:"#f7f9fb", marginBottom:10 }}
      />

      <div style={{ maxHeight:260, overflow:"auto", border:"1px solid #2f374b", borderRadius:8 }}>
        {loading && <div style={{ padding:12, color:"#7ea9de" }}>Loading…</div>}
        {!loading && options.map(opt => (
          <label key={opt.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderBottom:"1px solid #2f374b" }}>
            <input type="checkbox" checked={selected.has(opt.id)} onChange={() => toggle(opt.id)} />
            <span style={{ color:"#e6edf7" }}>{opt.name}</span>
            <span style={{ marginLeft:"auto", color:"#7ea9de", fontSize:12 }}>{segment}</span>
          </label>
        ))}
        {!loading && !options.length && <div style={{ padding:12, color:"#7ea9de" }}>No matches</div>}
      </div>

      <div style={{ marginTop:10, display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={clear} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #3a4459", background:"#232a36", color:"#f7f9fb" }}>
          Clear
        </button>
        <button onClick={apply} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid var(--electricCyan)", background:"var(--electricCyan)", color:"#0a1224", fontWeight:800 }}>
          Apply
        </button>
      </div>
    </div>
  );
}
