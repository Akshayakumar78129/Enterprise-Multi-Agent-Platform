import React, { useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card"; // retained for empty state only

const PredictionConfidenceMatrix = ({
  data = [],
  isLoading = false,
  onCellClick = null,
  highlightProduct = null,
  initialTimeframe = "30days",
  onTimeframePersist = null,
}) => {
  const [timeframe, setTimeframe] = React.useState(initialTimeframe);
  const [selectedCell, setSelectedCell] = useState(null);

  if (!data || data.length === 0) {
    return (
      <Card title="Prediction Confidence Matrix" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            color: "#5891cb",
          }}
        >
          No prediction data available
        </div>
      </Card>
    );
  }
  if (isLoading) {
    return (
      <div style={{
        background:'linear-gradient(135deg, rgba(30,39,56,0.72), rgba(44,51,65,0.72))',
        backdropFilter:'blur(18px) saturate(180%)',
        WebkitBackdropFilter:'blur(18px) saturate(180%)',
        border:'1px solid rgba(59,130,246,0.25)',
        borderRadius:'30px',
        padding:'24px 26px 34px',
        position:'relative',
        overflow:'hidden',
        minHeight:400,
        boxShadow:'0 6px 18px -4px rgba(0,0,0,0.55), 0 18px 48px -12px rgba(59,130,246,0.3)',
        animation:'fadeInUp .65s ease both'
      }}>
        <div style={{position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(circle at 78% 18%, rgba(0,224,255,0.18), transparent 60%)'}} />
        <div style={{height:20, width:300, background:'rgba(255,255,255,0.1)', borderRadius:10, marginBottom:24}} />
        <div style={{display:'flex', gap:12, marginBottom:26}}>
          {Array.from({length:3}).map((_,i)=>(<div key={i} style={{height:40, width:90, background:'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18), rgba(255,255,255,0.08))', backgroundSize:'200% 100%', animation:'shimmer 1.6s infinite', borderRadius:20}} />))}
        </div>
        <div style={{display:'grid', gridTemplateColumns:'180px repeat(5,88px)', gap:10, background:'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(139,92,246,0.14))', padding:'24px 20px 28px 20px', borderRadius:32, border:'1px solid rgba(255,255,255,0.12)', boxShadow:'0 4px 12px -3px rgba(0,0,0,0.5)'}}>
          {Array.from({length:4}).map((_,row)=> (
            <React.Fragment key={row}>
              <div style={{height:54, borderRadius:12, background:'rgba(255,255,255,0.08)'}} />
              {Array.from({length:5}).map((__,cell)=>(<div key={cell} style={{height:54, width:74, borderRadius:18, background:'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.14), rgba(255,255,255,0.06))', backgroundSize:'200% 100%', animation:'shimmer 1.4s linear infinite'}} />))}
            </React.Fragment>
          ))}
        </div>
        <style>{`@keyframes shimmer {0%{background-position:0% 50%;}100%{background-position:200% 50%;}}`}</style>
      </div>
    );
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "#e930ff"; // Signal Magenta for very high
    if (confidence >= 0.6) return "#00e0ff"; // Electric Cyan for high
    if (confidence >= 0.4) return "#3e7b97"; // Blue-gray for medium
    return "#0a1224"; // Midnight Navy for low
  };

  const getConfidenceOpacity = (confidence) => {
    return Math.max(0.3, confidence); // Minimum 30% opacity
  };

  const handleCellClick = (segment, product, confidence) => {
    setSelectedCell({ segment, product, confidence });
    if (onCellClick) {
      onCellClick(segment, product);
    }
  };

  const timeframeOptions = [
    { value: "7days", label: "7 days" },
    { value: "30days", label: "30 days" },
    { value: "90days", label: "90 days" },
  ];

  // Get all unique products for the header
  const products = data[0]?.predictions?.map(p => p.product) || [];

  return (
    <div style={{
      background:'linear-gradient(135deg, rgba(30,39,56,0.72), rgba(44,51,65,0.72))',
      backdropFilter:'blur(18px) saturate(180%)',
      WebkitBackdropFilter:'blur(18px) saturate(180%)',
      border:'1px solid rgba(59,130,246,0.25)',
      borderRadius:'30px',
      padding:'24px 26px 34px',
      position:'relative',
      overflow:'hidden',
      minHeight:400,
      boxShadow:'0 6px 18px -4px rgba(0,0,0,0.55), 0 18px 48px -12px rgba(59,130,246,0.3)',
      animation:'fadeInUp .65s ease both'
    }}>
      <div style={{position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(circle at 78% 18%, rgba(0,224,255,0.18), transparent 60%)'}} />
      <div style={{position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18}}>
        <div>
          <h3 style={{margin:0, fontSize:20, fontWeight:800, background:'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent', letterSpacing:'.6px'}}>Prediction Confidence Matrix</h3>
          <div style={{fontSize:12, color:'#5891cb', marginTop:4}}>Confidence across segments ({timeframe})</div>
        </div>
      </div>
      <div style={{ animation:'fadeInUp .65s ease both', position:'relative' }}>
        {/* Timeframe Selector */}
  <div style={{ marginBottom: "24px", display: "flex", gap: "10px", background:'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))', padding:'12px 16px', borderRadius:'24px', border:'1px solid rgba(59,130,246,0.35)', position:'relative', zIndex:1 }}>
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => { setTimeframe(option.value); onTimeframePersist && onTimeframePersist(option.value); }}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: timeframe === option.value ? "#00e0ff" : "#3a4459",
                color: timeframe === option.value ? "#0a1224" : "#f7f9fb",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: timeframe === option.value ? "600" : "400",
                transition: "all 0.2s ease",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Matrix Container */}
    <div style={{
      display:'grid',
      gridTemplateColumns:"180px repeat("+products.length+", 88px)",
      gap:'10px 10px',
      background:'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(139,92,246,0.14))',
      padding:'24px 20px 28px 20px',
      borderRadius:'32px',
      overflow:'auto',
      border:'1px solid rgba(255,255,255,0.12)',
      boxShadow:'0 4px 12px -3px rgba(0,0,0,0.5)',
      position:'relative',
      zIndex:1
    }}>
          {/* Header Row */}
          <div></div> {/* Empty corner */}
          {products.map((product) => (
            <div
              key={product}
              style={{
                fontSize: "12px",
                color: "#f7f9fb",
                fontWeight: "600",
                textAlign: "center",
                padding: "8px 4px",
                backgroundColor: highlightProduct === product ? "#00e0ff20" : "transparent",
                borderRadius: "4px",
                writingMode: "vertical-rl",
                textOrientation: "mixed",
              }}
            >
              {product}
            </div>
          ))}

          {/* Data Rows */}
          {data.map((row) => (
            <React.Fragment key={row.segment}>
              {/* Segment Label */}
              <div
                style={{
                  fontSize: "13px",
                  color: "#f1f5f9",
                  fontWeight: "700",
                  padding: "10px 10px 12px",
                  display: "flex",
                  alignItems: "center",
                  letterSpacing:'.4px'
                }}
              >
                {row.segment}
              </div>

              {/* Confidence Cells */}
              {row.predictions.map((prediction) => (
                <div
                  key={`${row.segment}-${prediction.product}`}
                  onClick={() => handleCellClick(row.segment, prediction.product, prediction.confidence)}
                  style={{
                    width: "74px",
                    height: "54px",
                    background: `radial-gradient(circle at 35% 30%, ${getConfidenceColor(prediction.confidence)}BB, ${getConfidenceColor(prediction.confidence)}55)` ,
                    opacity: getConfidenceOpacity(prediction.confidence),
                    border: selectedCell?.segment === row.segment && selectedCell?.product === prediction.product
                      ? "2px solid #00e0ff"
                      : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    color: "#f7f9fb",
                    fontWeight: 700,
                    letterSpacing: '.5px',
                    transition: "all 0.3s ease",
                    transform: selectedCell?.segment === row.segment && selectedCell?.product === prediction.product
                      ? "translateY(-3px) scale(1.08)"
                      : "translateY(0) scale(1)",
                    boxShadow: selectedCell?.segment === row.segment && selectedCell?.product === prediction.product ? '0 8px 22px -6px rgba(0,0,0,0.7), 0 0 0 1px #00e0ff, 0 0 0 8px rgba(0,224,255,0.18)' : '0 3px 10px -3px rgba(0,0,0,0.55)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px) scale(1.08)";
                    e.currentTarget.style.boxShadow = '0 8px 22px -6px rgba(0,0,0,0.7), 0 0 0 1px #00e0ff, 0 0 0 8px rgba(0,224,255,0.18)';
                  }}
                  onMouseLeave={(e) => {
                    const active = selectedCell?.segment === row.segment && selectedCell?.product === prediction.product;
                    e.currentTarget.style.transform = active ? "translateY(-3px) scale(1.08)" : "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = active ? '0 8px 22px -6px rgba(0,0,0,0.7), 0 0 0 1px #00e0ff, 0 0 0 8px rgba(0,224,255,0.18)' : '0 3px 10px -3px rgba(0,0,0,0.55)';
                  }}
                  title={`${row.segment} → ${prediction.product}: ${(prediction.confidence * 100).toFixed(1)}% confidence (${prediction.count} predictions)`}
                >
                  {(prediction.confidence * 100).toFixed(0)}%
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* Confidence Scale Legend */}
  <div style={{ marginTop: "22px", display: "flex", alignItems: "center", gap: "16px", background:'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))', padding:'12px 16px', borderRadius:'24px', border:'1px solid rgba(255,255,255,0.12)', position:'relative', zIndex:1 }}>
          <span style={{ fontSize: "12px", color: "#f7f9fb", fontWeight: "600" }}>
            Confidence:
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "linear-gradient(to right, #0a1224, #3e7b97, #00e0ff, #e930ff)",
              width: "220px",
              height: "18px",
              borderRadius: "10px",
              position: "relative",
              boxShadow:'0 2px 10px -2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset'
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "0px",
                fontSize: "10px",
                color: "#f7f9fb",
                top: "18px",
              }}
            >
              0%
            </div>
            <div
              style={{
                position: "absolute",
                right: "0px",
                fontSize: "10px",
                color: "#f7f9fb",
                top: "18px",
              }}
            >
              100%
            </div>
          </div>
        </div>

        {/* Selected Cell Details */}
        {selectedCell && (
      <div style={{
        marginTop:'22px',
        padding:'16px 18px',
        background:'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))',
        borderRadius:'24px',
        border:'1px solid rgba(255,255,255,0.12)',
        boxShadow:'0 4px 12px -3px rgba(0,0,0,0.5)'
      }}>
            <div style={{ fontSize: "14px", color: "#f7f9fb", fontWeight: "600" }}>
              {selectedCell.segment} → {selectedCell.product}
            </div>
            <div style={{ fontSize: "12px", color: "#b0c4d6", marginTop: "4px" }}>
              Confidence: {(selectedCell.confidence * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionConfidenceMatrix; 