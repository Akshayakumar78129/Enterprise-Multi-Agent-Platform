import React from 'react';

const PurchaseTimingPredictor = ({ data = [], isLoading = false }) => {
  const averageWindow = data.length ? (data.reduce((a,c) => a + c.daysToPurchase,0) / data.length) : 0;
  if (isLoading) {
    return (
      <div style={{
        background:'linear-gradient(135deg, rgba(30,39,56,0.72), rgba(44,51,65,0.72))',
        backdropFilter:'blur(18px) saturate(180%)',
        WebkitBackdropFilter:'blur(18px) saturate(180%)',
        border:'1px solid rgba(59,130,246,0.25)',
        borderRadius:'30px',
        padding:'24px 26px 30px',
        minHeight:'420px',
        display:'flex',
        flexDirection:'column',
        overflow:'hidden',
        position:'relative',
        boxShadow:'0 6px 18px -4px rgba(0,0,0,0.55), 0 18px 48px -12px rgba(59,130,246,0.3)',
        animation:'fadeInUp .65s ease both'
      }}>
        <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 78% 18%, rgba(0,224,255,0.18), transparent 60%)'}} />
        <div style={{height:20, width:220, background:'rgba(255,255,255,0.1)', borderRadius:10, marginBottom:16}} />
        <div style={{height:14, width:260, background:'rgba(255,255,255,0.08)', borderRadius:8, marginBottom:22}} />
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:16}}>
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} style={{height:110, borderRadius:18, background:'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.16), rgba(255,255,255,0.06))', backgroundSize:'200% 100%', animation:'shimmer 1.5s ease-in-out infinite'}} />
          ))}
        </div>
        <style>{`@keyframes shimmer {0%{background-position:0% 50%;}100%{background-position:200% 50%;}}`}</style>
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
      padding:'24px 26px 30px',
      minHeight:'420px',
      display:'flex',
      flexDirection:'column',
      overflow:'hidden',
      position:'relative',
      boxShadow:'0 6px 18px -4px rgba(0,0,0,0.55), 0 18px 48px -12px rgba(59,130,246,0.3)',
      animation:'fadeInUp .65s ease both'
    }}>
      <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 78% 18%, rgba(0,224,255,0.18), transparent 60%)'}} />
      <h3 style={{margin:0, fontSize:20, fontWeight:800, background:'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent', letterSpacing:'.6px', position:'relative', zIndex:1}}>Time-to-Purchase</h3>
      <div style={{fontSize:12, color:'#5891cb', marginTop:4, marginBottom:14, position:'relative', zIndex:1}}>Predicted days until next purchase (top 12)</div>
      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5891cb', position:'relative', zIndex:1 }}>Loading...</div>
      ) : data.length === 0 ? (
        <div style={{ flex: 1, fontSize: '13px', color: '#5891cb', position:'relative', zIndex:1 }}>No timing predictions available</div>
      ) : (
        <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', flex:1 }}>
          <div style={{ fontSize:12, color:'#b0c4d6', marginBottom:12 }}>Avg window: {averageWindow.toFixed(1)} days</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:16, overflowY:'auto', paddingRight:4 }}>
            {data.slice(0,12).map((p,i) => (
              <div key={i} style={{
                background:'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(139,92,246,0.14))',
                border:'1px solid rgba(255,255,255,0.12)',
                borderRadius:18,
                padding:'12px 14px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                position:'relative',
                overflow:'hidden',
                transition:'all .25s ease',
                boxShadow:'0 4px 12px -3px rgba(0,0,0,0.5)'
              }}
              onMouseEnter={(e)=> { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 8px 22px -4px rgba(0,0,0,0.55)'; e.currentTarget.style.border='1px solid rgba(59,130,246,0.55)'; }}
              onMouseLeave={(e)=> { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 12px -3px rgba(0,0,0,0.5)'; e.currentTarget.style.border='1px solid rgba(255,255,255,0.12)'; }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#f7f9fb' }}>Cust {p.customerId}</div>
                <div style={{ fontSize:11, color:'#00e0ff', fontWeight:600 }}>{p.product}</div>
                <div style={{ fontSize:11, color:'#b0c4d6' }}>{p.daysToPurchase} days</div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.5px', color: p.probability > 0.7 ? '#00e0ff' : p.probability > 0.5 ? '#5fd4d6' : '#b0c4d6' }}>{Math.round(p.probability * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseTimingPredictor;
