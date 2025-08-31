import React from "react";

export default function BusinessIntelligenceTrigger({ onClick, highRiskCount = 0 }) {
  const pulse = highRiskCount > 0;
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: 100,
        right: 20,
        width: 58,
        height: 58,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #00E0FF, #6EE7F2)",
        border: "none",
        color: "#0a1224",
        fontSize: 26,
        cursor: "pointer",
        boxShadow: pulse ? "0 10px 30px rgba(0,224,255,.55)" : "0 8px 24px rgba(0,224,255,.35)",
        zIndex: 999,
      }}
      title="Business Intelligence Agent"
    >
      🧠
      {highRiskCount > 0 && (
        <div
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#ef4444",
            color: "#fff",
            border: "2px solid #1f2937",
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {highRiskCount}
        </div>
      )}
    </button>
  );
}
