import React from "react";

export default function AIInsightPopover({
  open = false,
  x = 0,
  y = 0,
  title = "AI Insight",
  body = "",
  actions = null,
  onClose = () => {},
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: y + 8,
        left: x + 8,
        zIndex: 10000,
        background: "linear-gradient(135deg, rgba(17,24,39,.98), rgba(30,41,59,.98))",
        border: "1px solid rgba(0,224,255,.25)",
        boxShadow: "0 18px 48px rgba(0,0,0,.5)",
        borderRadius: 12,
        maxWidth: 420,
        color: "#f7f9fb",
        overflow: "hidden",
      }}
      onClick={(e)=>e.stopPropagation()}
    >
      <div style={{
        padding: "10px 12px",
        borderBottom: "1px solid rgba(255,255,255,.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        background: "linear-gradient(90deg, rgba(0,224,255,.12), transparent)"
      }}>
        <div style={{fontWeight: 800, fontSize: 14}}>{title}</div>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 8, cursor: "pointer",
            background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
            color: "#f7f9fb", fontWeight: 800
          }}
          title="Close"
        >
          ×
        </button>
      </div>
      <div style={{ padding: 12, fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
        {body}
      </div>
      {actions && (
        <div style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,.08)", display:"flex", gap:8, justifyContent:"flex-end" }}>
          {actions}
        </div>
      )}
    </div>
  );
}