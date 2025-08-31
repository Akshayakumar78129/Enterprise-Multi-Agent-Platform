import React, { useEffect, useState } from "react";

function HoverTip({ tip, pos }) {
  if (!tip) return null;
  const style = {
    position: "fixed",
    left: Math.min(window.innerWidth - 220, pos.x + 12),
    top: Math.max(12, pos.y + 12),
    background: "rgba(20,24,33,0.98)",
    border: "1px solid rgba(0,224,255,0.25)",
    borderRadius: 8,
    padding: "8px 10px",
    color: "var(--cloudWhite)",
    fontSize: 12,
    zIndex: 2000,
    pointerEvents: "none",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    maxWidth: 200,
  };
  return <div style={style}>{tip}</div>;
}

function ClickCard({ data, onClose }) {
  if (!data) return null;
  const style = {
    position: "fixed",
    left: Math.min(window.innerWidth - 340, data.pos.x - 150),
    top: Math.max(60, data.pos.y - 20),
    width: 320,
    background: "linear-gradient(135deg, rgba(26,31,46,0.98), rgba(42,47,62,0.98))",
    border: "1px solid rgba(0,224,255,0.30)",
    borderRadius: 12,
    padding: 12,
    color: "var(--cloudWhite)",
    zIndex: 2001,
    boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
  };
  const { kpi, date, actual, predicted, deviation } = data;
  const delta = predicted != null ? (actual - predicted) : null;
  const tiny = delta != null ? `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta).toFixed(2)} vs expected` : "";
  return (
    <div style={style}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>AI Assistant</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
        {kpi} • {date}
      </div>
      <div style={{ fontSize: 14, marginBottom: 8 }}>
        Actual: <b>{Number(actual).toLocaleString()}</b>{predicted != null && <> • Expected: <b>{Number(predicted).toLocaleString()}</b></>} {tiny && <span style={{ marginLeft: 6, color: delta >= 0 ? "#4ade80" : "#f87171" }}>{tiny}</span>}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "6px 10px", borderRadius: 8, background: "var(--graphite)", border: "1px solid var(--graphiteLight)", color: "var(--cloudWhite)" }}>Close</button>
        <button
          onClick={() => {
            const detail = { kpi, date, actual, predicted, deviation, intent: "explain_datapoint" };
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("ai:insight-request", { detail }));
            }
            onClose();
          }}
          style={{ padding: "6px 10px", borderRadius: 8, background: "var(--electricCyan)", border: "none", color: "var(--midnightNavy)", fontWeight: 800 }}
        >
          Ask Chat
        </button>
      </div>
    </div>
  );
}

function ContextTray({ items, onClose }) {
  if (!items?.length) return null;
  const style = {
    position: "fixed",
    left: 16, right: 16, bottom: 84,
    background: "rgba(19,24,35,0.98)",
    border: "1px solid rgba(0,224,255,0.25)",
    borderRadius: 12,
    padding: 12,
    zIndex: 2002,
    color: "var(--cloudWhite)",
    boxShadow: "0 12px 36px rgba(0,0,0,0.45)",
  };
  return (
    <div style={style}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Context</div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: "var(--graphite)", border: "1px solid var(--graphiteLight)", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>
            {it.kpi} • {it.date} • A:{Number(it.actual).toLocaleString()}{it.predicted != null ? ` / E:${Number(it.predicted).toLocaleString()}` : ""}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button
          onClick={() => {
            const detail = { intent: "use_context_points", points: items };
            window.dispatchEvent(new CustomEvent("ai:insight-request", { detail }));
          }}
          style={{ padding: "6px 10px", borderRadius: 8, background: "var(--electricCyan)", border: "none", color: "var(--midnightNavy)", fontWeight: 800 }}
        >
          Send to Chat
        </button>
      </div>
    </div>
  );
}

export default function InsightOverlays() {
  const [hover, setHover] = useState(null);   // { tip, pos:{x,y} }
  const [click, setClick] = useState(null);   // { kpi,date,actual,predicted,deviation,pos }
  const [context, setContext] = useState([]); // list of points

  useEffect(() => {
    const onHover = (e) => setHover({ tip: e.detail?.tip, pos: e.detail?.pos || { x: 0, y: 0 } });
    const onLeave = () => setHover(null);
    const onClick = (e) => setClick(e.detail || null);
    const onCtx   = (e) => setContext((prev) => [...prev, e.detail].slice(-12));
    const onClear = () => setContext([]);
    window.addEventListener("pd:hover", onHover);
    window.addEventListener("pd:hover:leave", onLeave);
    window.addEventListener("pd:click", onClick);
    window.addEventListener("pd:context", onCtx);
    window.addEventListener("pd:context:clear", onClear);
    return () => {
      window.removeEventListener("pd:hover", onHover);
      window.removeEventListener("pd:hover:leave", onLeave);
      window.removeEventListener("pd:click", onClick);
      window.removeEventListener("pd:context", onCtx);
      window.removeEventListener("pd:context:clear", onClear);
    };
  }, []);

  return (
    <>
      <HoverTip tip={hover?.tip} pos={hover?.pos || { x: 0, y: 0 }} />
      <ClickCard data={click} onClose={() => setClick(null)} />
      <ContextTray items={context} onClose={() => setContext([])} />
    </>
  );
}
