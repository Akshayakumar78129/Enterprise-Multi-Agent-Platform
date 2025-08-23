import React, { useState, useMemo, useCallback } from "react";

const CustomerPurchaseJourney = ({
  data = [],
  isLoading = false,
  selectedCustomer = null,
  onCustomerChange = null,
  onPurchaseClick = null,
  showPredictions = true,
  onTogglePredictions = null,
  predictionRow = null,
}) => {
  const [hoveredPurchase, setHoveredPurchase] = useState(null);
  const [spreadFactor, setSpreadFactor] = useState(1.15);

  // Stable derivations (hooks must run every render – avoid conditional early returns before hooks)
  const hasData = !!(data && data.length > 0);
  const currentCustomer = useMemo(()=> {
    if (!hasData) return null;
    return selectedCustomer ? data.find(d=> d.customerId===selectedCustomer) : data[0];
  }, [hasData, data, selectedCustomer]);

  const getProductIcon = (category) => {
    const icons = { 'M':'👕','R':'🏃','default':'📦' };
    return icons[category?.[0]] || icons.default;
  };
  const getTimelinePosition = useCallback((index,total)=> (index/Math.max(1,total-1))*100, []);

  const futurePredictions = useMemo(()=> {
    if (!showPredictions || !currentCustomer || !predictionRow) return [];
    const hist = currentCustomer.purchases || [];
    const lastDate = hist.length ? new Date(hist[hist.length-1].date) : new Date();
    const predictedDays = predictionRow.predicted_days_to_purchase || 14;
    const amountBase = predictionRow.avg_amount || (hist.length ? hist[hist.length-1].amount : 0);

    // First prediction (existing logic)
    const firstDate = new Date(lastDate.getTime() + predictedDays * 86400000);
    const first = {
      date: firstDate.toISOString().slice(0,10),
      category: predictionRow.predicted_product,
      amount: +amountBase.toFixed(2),
      probability: predictionRow.prediction_probability || 0.5,
      sequenceOrder: (hist.length || 0) + 1,
      isPrediction: true
    };

    // Derive a second prediction deterministically: choose a different product and a later date
    const productUniverse = ['M-3003','M-2001','R-4003','M-3004','M-3005'];
    let secondProduct = productUniverse.find(p=> p !== predictionRow.predicted_product) || predictionRow.predicted_product;
    // Second date ~ 1.8x the first gap + 7 days buffer
    const secondDays = Math.round(predictedDays * 1.8 + 7);
    const secondDate = new Date(lastDate.getTime() + secondDays * 86400000);
    const second = {
      date: secondDate.toISOString().slice(0,10),
      category: secondProduct,
      amount: +(amountBase * 0.95).toFixed(2), // slight conservative adjustment
      probability: Math.max(0, Math.min(1, (predictionRow.prediction_probability || 0.5) - 0.15)),
      sequenceOrder: (hist.length || 0) + 2,
      isPrediction: true
    };
    return [first, second];
  }, [showPredictions, currentCustomer, predictionRow]);
  const allItems = useMemo(()=> currentCustomer ? [...(currentCustomer.purchases||[]), ...futurePredictions] : [], [currentCustomer, futurePredictions]);
  const positionedItems = useMemo(()=> allItems.map((item, idx)=> ({...item, layoutPos: getTimelinePosition(idx, allItems.length)*spreadFactor})), [allItems, spreadFactor, getTimelinePosition]);
  // Pixel track metrics for smooth scroll & spacing
  const baseSpacing = 140 * spreadFactor; // px between nodes
  const horizontalPadding = 220; // leading/trailing space
  const trackWidth = Math.max(600, horizontalPadding*2 + (positionedItems.length-1)*baseSpacing);

  // Now handle empty / missing states AFTER hooks (so hook order stable)
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
        <div style={{height:20, width:280, background:'rgba(255,255,255,0.1)', borderRadius:10, marginBottom:22}} />
        <div style={{display:'flex', gap:12, marginBottom:24}}>
          {Array.from({length:4}).map((_,i)=>(<div key={i} style={{height:44, width:120, background:'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18), rgba(255,255,255,0.08))', backgroundSize:'200% 100%', animation:'shimmer 1.6s ease-in-out infinite', borderRadius:16}} />))}
        </div>
        <div style={{position:'relative', height:260, borderRadius:26, background:'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(139,92,246,0.14))', border:'1px solid rgba(255,255,255,0.12)', boxShadow:'0 4px 12px -3px rgba(0,0,0,0.5)', overflow:'hidden'}}>
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} style={{position:'absolute', top:'50%', left:`${10 + i*14}%`, transform:'translate(-50%,-50%)', width:96, height:90, borderRadius:22, background:'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.16), rgba(255,255,255,0.06))', backgroundSize:'200% 100%', animation:'shimmer 1.4s linear infinite'}} />
          ))}
        </div>
        <style>{`@keyframes shimmer {0%{background-position:0% 50%;}100%{background-position:200% 50%;}}`}</style>
      </div>
    );
  }
  if (!hasData) {
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
        minHeight:360,
        boxShadow:'0 6px 18px -4px rgba(0,0,0,0.55), 0 18px 48px -12px rgba(59,130,246,0.3)',
        animation:'fadeInUp .65s ease both'
      }}>
        <div style={{position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(circle at 78% 18%, rgba(0,224,255,0.18), transparent 60%)'}} />
        <h3 style={{margin:0, fontSize:20, fontWeight:800, background:'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent', letterSpacing:'.6px'}}>Customer Purchase Journey</h3>
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'260px', color:'#5891cb'}}>No customer timeline data available</div>
      </div>
    );
  }
  if (!currentCustomer) {
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
        minHeight:360,
        boxShadow:'0 6px 18px -4px rgba(0,0,0,0.55), 0 18px 48px -12px rgba(59,130,246,0.3)',
        animation:'fadeInUp .65s ease both'
      }}>
        <div style={{position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(circle at 78% 18%, rgba(0,224,255,0.18), transparent 60%)'}} />
        <h3 style={{margin:0, fontSize:20, fontWeight:800, background:'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent', letterSpacing:'.6px'}}>Customer Purchase Journey</h3>
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'260px', color:'#5891cb'}}>Customer not found</div>
      </div>
    );
  }

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
          <h3 style={{margin:0, fontSize:20, fontWeight:800, background:'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent', letterSpacing:'.6px'}}>Customer Purchase Journey</h3>
          <div style={{fontSize:12, color:'#5891cb', marginTop:4}}>Customer {currentCustomer.customerId} • {currentCustomer.purchases.length} purchases{showPredictions? ` + ${futurePredictions.length} predictions`:''}</div>
        </div>
      </div>
      <div style={{padding:'0 2px 0 2px', position:'relative'}}>
        <div style={{display:'flex', flexWrap:'wrap', gap:'14px', alignItems:'center', marginBottom:'22px', position:'relative', zIndex:2, background:'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))', padding:'12px 16px', borderRadius:'24px', border:'1px solid rgba(59,130,246,0.35)'}}>
      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
        <select value={currentCustomer.customerId} onChange={e=> onCustomerChange && onCustomerChange(parseInt(e.target.value))} style={{padding:'10px 14px', background:'linear-gradient(135deg, rgba(30,39,56,0.85), rgba(44,51,65,0.85))', border:'1px solid rgba(59,130,246,0.35)', color:'#f1f5f9', borderRadius:'14px', fontSize:'13px', letterSpacing:'.4px', cursor:'pointer', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', appearance:'none', position:'relative', minWidth:150}}>
              {data.map(c=> <option key={c.customerId} value={c.customerId}>Customer {c.customerId}</option>)}
            </select>
        {/* custom arrow */}
        <div style={{marginLeft:'-26px', pointerEvents:'none', fontSize:'10px', color:'#94a3b8', transform:'translateY(1px)'}}>▼</div>
            <button onClick={()=> setSpreadFactor(f=> Math.min(1.6, +(f+0.1).toFixed(2)))} style={{padding:'8px 12px', background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.4)', color:'#3b82f6', fontSize:'12px', fontWeight:600, borderRadius:'10px', cursor:'pointer'}}>Spread +</button>
            <button onClick={()=> setSpreadFactor(f=> Math.max(0.8, +(f-0.1).toFixed(2)))} style={{padding:'8px 12px', background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.4)', color:'#8b5cf6', fontSize:'12px', fontWeight:600, borderRadius:'10px', cursor:'pointer'}}>Spread -</button>
          </div>
          <label style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', letterSpacing:'.4px', color:'#e2e8f0'}}>
            <input type="checkbox" checked={showPredictions} onChange={()=> onTogglePredictions && onTogglePredictions(!showPredictions)} /> Show Predictions
          </label>
          <div style={{marginLeft:'auto', fontSize:'11px', color:'#64748b'}}>Spread: {spreadFactor.toFixed(2)}</div>
        </div>
        <div style={{
          position:'relative',
          height:'260px',
          borderRadius:'26px',
          padding:'26px 0 34px 0',
          overflowX:'auto',
          overflowY:'hidden',
          background:'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(139,92,246,0.14))',
          border:'1px solid rgba(255,255,255,0.12)',
          boxShadow:'0 4px 12px -3px rgba(0,0,0,0.5)'
        }}>
          <div style={{position:'relative', width:trackWidth+'px', height:'100%', padding:'0 '+horizontalPadding+'px'}}>
            {/* Continuous gradient track with overlay glow */}
            <div style={{position:'absolute', top:'50%', left:0, right:0, height:'6px', background:'linear-gradient(90deg,#3b82f6,#0ea5e9,#8b5cf6)', transform:'translateY(-50%)', borderRadius:'6px'}} />
            <div style={{position:'absolute', top:'50%', left:0, right:0, height:'18px', transform:'translateY(-50%)', pointerEvents:'none', background:'radial-gradient(circle at 15% 50%, rgba(0,224,255,0.25), transparent 70%), radial-gradient(circle at 85% 50%, rgba(233,48,255,0.25), transparent 70%)', filter:'blur(8px)', opacity:.55}} />
            {positionedItems.map((item, index)=> {
              const isPrediction = item.isPrediction; const leftPx = horizontalPadding + index*baseSpacing;
              return (
                <div key={index} style={{position:'absolute', top:'50%', left:leftPx+'px', transform:'translate(-50%,-50%)', cursor:'pointer', zIndex:3}} onClick={()=> onPurchaseClick && onPurchaseClick(item)} onMouseEnter={()=> setHoveredPurchase(item)} onMouseLeave={()=> setHoveredPurchase(null)}>
                  <div style={{width:isPrediction?20:16, height:isPrediction?20:16, borderRadius:'50%', margin:'0 auto 10px', background:isPrediction?'rgba(233,48,255,0.15)':'#0f172a', border:isPrediction?'2px dashed #e930ff':'2px solid #3b82f6', boxShadow:isPrediction?'0 0 0 5px rgba(233,48,255,0.18)':'0 0 0 5px rgba(59,130,246,0.14)', transition:'all .3s ease'}} />
                  <div style={{width:'96px', padding:'11px 12px 13px', background:isPrediction?'linear-gradient(135deg, rgba(233,48,255,0.14), rgba(139,92,246,0.14))':'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(0,224,255,0.15))', border:'1px solid '+(isPrediction?'rgba(233,48,255,0.55)':'rgba(59,130,246,0.55)'), borderRadius:'22px', textAlign:'center', backdropFilter:'blur(7px)', WebkitBackdropFilter:'blur(7px)', transform: hoveredPurchase===item? 'translateY(-7px) scale(1.06)':'translateY(0) scale(1)', transition:'all .4s cubic-bezier(.4,.14,.12,1)', boxShadow: hoveredPurchase===item?'0 8px 22px -6px rgba(0,0,0,0.65), 0 18px 48px -16px rgba(59,130,246,0.45)':'0 3px 10px -3px rgba(0,0,0,0.5)'}}>
                    <div style={{fontSize:'24px', marginBottom:'2px'}}>{getProductIcon(item.category)}</div>
                    <div style={{fontSize:'11px', fontWeight:700, color:'#f1f5f9', letterSpacing:'.5px'}}>{item.category}</div>
                    <div style={{fontSize:'10px', color:'#94a3b8', marginTop:'3px'}}>${item.amount?.toLocaleString()}</div>
                    {isPrediction && <div style={{fontSize:'10px', marginTop:'5px', fontWeight:600, background:'linear-gradient(90deg,#e930ff,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent'}}>{Math.round(item.probability*100)}%</div>}
                  </div>
                  <div style={{fontSize:'10px', color:isPrediction? '#e930ff':'#cbd5e1', marginTop:'12px', transform:'rotate(-30deg)', whiteSpace:'nowrap', fontWeight:500}}>{new Date(item.date).toLocaleDateString()}</div>
                </div>
              );
            })}
            {positionedItems.slice(0,-1).map((item, idx)=> {
              const next = positionedItems[idx+1]; const isPredLine = next.isPrediction; const startPx = horizontalPadding + idx*baseSpacing; const endPx = horizontalPadding + (idx+1)*baseSpacing; const widthPx = endPx - startPx;
              return <div key={'line-'+idx} style={{position:'absolute', top:'50%', left:startPx+'px', width:widthPx+'px', height:'3px', background:isPredLine? 'linear-gradient(90deg,#e930ff,#8b5cf6)':'linear-gradient(90deg,#3b82f6,#0ea5e9)', transform:'translateY(-50%)', opacity:isPredLine?0.65:0.9}} />;
            })}
          </div>
        </div>
        {hoveredPurchase && (
          <div style={{marginTop:'24px', padding:'16px 18px', background:'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'24px', boxShadow:'0 4px 12px -3px rgba(0,0,0,0.5)'}}>
            <div style={{fontSize:'15px', fontWeight:700, background:'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent', marginBottom:'6px'}}>{hoveredPurchase.isPrediction? 'Predicted Purchase':'Historical Purchase'}</div>
            <div style={{fontSize:'13px', color:'#e2e8f0', lineHeight:1.5}}>
              <strong>Product:</strong> {hoveredPurchase.category} &nbsp;•&nbsp; <strong>Amount:</strong> ${hoveredPurchase.amount?.toLocaleString()} &nbsp;•&nbsp; <strong>Date:</strong> {new Date(hoveredPurchase.date).toLocaleDateString()} {hoveredPurchase.isPrediction && <><strong>&nbsp;•&nbsp;Probability:</strong> {Math.round(hoveredPurchase.probability*100)}%</>}
            </div>
          </div>
        )}
        <div style={{marginTop:'22px', display:'flex', flexWrap:'wrap', gap:'28px', fontSize:'12px', position:'relative', zIndex:2, background:'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))', padding:'12px 16px', borderRadius:'24px', border:'1px solid rgba(255,255,255,0.12)'}}>
          {[{label:'Historical Purchases', color:'linear-gradient(90deg,#3b82f6,#0ea5e9)'},{label:'Predicted Purchases', color:'linear-gradient(90deg,#e930ff,#8b5cf6)'}].map(l=> (
            <div key={l.label} style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <div style={{width:16, height:4, background:l.color, borderRadius:4}} />
              <span style={{color:'#f1f5f9', letterSpacing:'.4px'}}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerPurchaseJourney; 