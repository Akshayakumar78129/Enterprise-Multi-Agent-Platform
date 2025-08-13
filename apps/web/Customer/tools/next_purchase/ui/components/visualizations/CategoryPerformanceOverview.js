import React, { useMemo, useState } from 'react';

const CategoryPerformanceOverview = ({ data = [], series = [], isLoading = false, repeatRateThreshold = 30 }) => {
  const [growthMode, setGrowthMode] = useState('percent'); // 'percent' | 'absolute'
  const [drillCategory, setDrillCategory] = useState(null);
  const top = useMemo(()=> data.slice(0,8), [data]);
  const seriesMap = useMemo(()=> {
    const m = {}; series.forEach(s => { m[s.category] = s.points; }); return m;
  }, [series]);
  const openDrill = (cat) => setDrillCategory(cat);
  const closeDrill = () => setDrillCategory(null);
  return (
    <div style={{
      background:'linear-gradient(135deg, rgba(30,39,56,0.72), rgba(44,51,65,0.72))',
      backdropFilter:'blur(18px) saturate(180%)',
      WebkitBackdropFilter:'blur(18px) saturate(180%)',
      border:'1px solid rgba(59,130,246,0.25)',
      borderRadius:'30px',
      padding:'24px 26px 30px',
      position:'relative',
      overflow:'hidden',
      minHeight:400,
      boxShadow:'0 6px 18px -4px rgba(0,0,0,0.55), 0 18px 48px -12px rgba(59,130,246,0.3)',
      animation:'fadeInUp .65s ease both'
    }}>
      <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 80% 15%, rgba(0,224,255,0.2), transparent 60%)'}} />
      <div style={{position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18}}>
        <div>
          <h3 style={{margin:0, fontSize:20, fontWeight:800, background:'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent', letterSpacing:'.6px'}}>Category Performance</h3>
          <div style={{fontSize:12, color:'#5891cb', marginTop:4}}>Recent vs prior • Growth / Share / Repeat</div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <button onClick={()=> setGrowthMode(m=> m==='percent'?'absolute':'percent')} style={{padding:'8px 12px', fontSize:11, fontWeight:600, letterSpacing:'.5px', borderRadius:14, cursor:'pointer', background:'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', border:'1px solid rgba(59,130,246,0.4)', color:'#f1f5f9'}}>
            Growth: {growthMode==='percent'? '% YoY':'Abs $'}
          </button>
        </div>
      </div>
      {isLoading ? (
        <div style={{display:'flex', gap:16}}>
          {Array.from({length:5}).map((_,i)=>(
            <div key={i} style={{flex:'1 1 0', padding:16, border:'1px solid rgba(255,255,255,0.1)', borderRadius:18, background:'rgba(255,255,255,0.05)', position:'relative', overflow:'hidden'}}>
              <div style={{height:14, width:'50%', background:'rgba(255,255,255,0.1)', borderRadius:6, marginBottom:14}} />
              <div style={{height:28, width:'60%', background:'rgba(255,255,255,0.12)', borderRadius:8, marginBottom:10}} />
              <div style={{height:10, width:'40%', background:'rgba(255,255,255,0.1)', borderRadius:5}} />
              <div style={{position:'absolute', inset:0, background:'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.25) 45%, transparent 90%)', animation:'shimmer 1.4s linear infinite'}} />
            </div>
          ))}
        </div>
      ) : top.length === 0 ? (
        <div style={{fontSize:13, color:'#94a3b8'}}>No category performance data</div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:18}}>
          {top.map(cat => {
            const spark = seriesMap[cat.category] || [];
            const repeatLow = cat.repeatRate < repeatRateThreshold;
            return (
            <div
              key={cat.category}
              onClick={()=> openDrill(cat)}
              style={{position:'relative', padding:'16px 16px 18px', border:'1px solid '+(repeatLow? 'rgba(239,68,68,0.55)':'rgba(255,255,255,0.12)'), borderRadius:22, background:'linear-gradient(135deg, '+(repeatLow? 'rgba(239,68,68,0.18), rgba(139,92,246,0.14)':'rgba(59,130,246,0.14), rgba(139,92,246,0.14)')+')', boxShadow:'0 4px 12px -3px rgba(0,0,0,0.5)', overflow:'hidden', cursor:'pointer', transition:'border-color .3s, transform .3s'}}
              onMouseEnter={e=> { e.currentTarget.style.transform='translateY(-4px)'; }}
              onMouseLeave={e=> { e.currentTarget.style.transform='translateY(0)'; }}
            >
              <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 75% 25%, rgba(255,255,255,0.10), transparent 65%)'}} />
              <div style={{position:'relative', zIndex:1}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                  <div style={{fontSize:13, fontWeight:700, letterSpacing:'.5px', color:'#f1f5f9'}}>{cat.category}</div>
                  <div style={{fontSize:11, fontWeight:600, padding:'4px 8px', borderRadius:12, background:'rgba(0,224,255,0.15)', border:'1px solid rgba(0,224,255,0.3)', color:'#00e0ff'}}>{cat.revenueShare}%</div>
                </div>
                <div style={{fontSize:24, fontWeight:800, background:'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent', lineHeight:1}}>${cat.revenue.toLocaleString()}</div>
                <div style={{marginTop:8, height:40, position:'relative'}}>
                  <div style={{position:'absolute', inset:0, opacity:0.35, filter:'blur(.3px)'}}>
                    <Sparkline data={spark} translucent />
                  </div>
                </div>
                <div style={{display:'flex', gap:10, marginTop:8, flexWrap:'wrap'}}>
                  <Stat label="Orders" value={cat.orders} />
                  <Stat label="Customers" value={cat.customers} />
                  <Stat label="Repeat %" value={cat.repeatRate + '%'} warn={repeatLow} />
                  <Stat label={growthMode==='percent'? 'Growth %':'Growth $'} value={cat.growthPercent == null ? '—' : (growthMode==='percent'? cat.growthPercent + '%' : ('$'+cat.growthAbs.toLocaleString()))} highlight={cat.growthPercent != null && cat.growthPercent > 0} warn={cat.growthPercent != null && cat.growthPercent < 0} />
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
      <style>{`@keyframes shimmer {0%{transform:translateX(-100%);}100%{transform:translateX(100%);}}`}</style>
      {drillCategory && (
        <DrillModal category={drillCategory} onClose={closeDrill} />
      )}
    </div>
  );
};

const Stat = ({ label, value, highlight, warn }) => (
  <div style={{minWidth:80}}>
    <div style={{fontSize:10, letterSpacing:'.5px', color:'#94a3b8', textTransform:'uppercase', marginBottom:4}}>{label}</div>
    <div style={{fontSize:13, fontWeight:700, color: highlight? '#10b981' : warn? '#ef4444' : '#f1f5f9'}}>{value}</div>
  </div>
);

const Sparkline = ({ data, translucent=false }) => {
  if (!data || data.length < 2) return <div style={{height:'100%', display:'flex', alignItems:'center', fontSize:10, color:'#64748b'}}>No trend</div>;
  const max = Math.max(...data.map(d=> d.revenue));
  const min = Math.min(...data.map(d=> d.revenue));
  const range = max - min || 1;
  const points = data.map((d,i)=> {
    const x = (i/(data.length-1))*100;
    const y = 100 - ((d.revenue - min)/range)*100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position:'absolute', inset:0}}>
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={translucent?0.35:1} />
          <stop offset="50%" stopColor="#0ea5e9" stopOpacity={translucent?0.35:1} />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={translucent?0.35:1} />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke="url(#grad)" strokeWidth={translucent?2:3} strokeLinecap="round" style={translucent?{mixBlendMode:'screen'}:undefined} />
    </svg>
  );
};

const DrillModal = ({ category, onClose }) => {
  // Placeholder modal content – can be enriched with API call for customer list
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}} onClick={onClose}>
      <div onClick={e=> e.stopPropagation()} style={{width:'min(780px,90%)', maxHeight:'80vh', overflowY:'auto', background:'linear-gradient(135deg, rgba(30,39,56,0.9), rgba(44,51,65,0.9))', border:'1px solid rgba(59,130,246,0.4)', borderRadius:'28px', padding:'28px 32px', position:'relative', boxShadow:'0 12px 42px -8px rgba(0,0,0,0.6)'}}>
        <button onClick={onClose} style={{position:'absolute', top:12, right:12, background:'none', border:'1px solid rgba(255,255,255,0.15)', color:'#94a3b8', padding:'4px 10px', borderRadius:14, cursor:'pointer', fontSize:12}}>Close</button>
        <h2 style={{margin:'0 0 14px', fontSize:24, fontWeight:800, background:'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent'}}>Category: {category.category}</h2>
        <div style={{display:'flex', flexWrap:'wrap', gap:18, marginBottom:24}}>
          <Stat label="Revenue" value={'$'+category.revenue.toLocaleString()} />
          <Stat label="Share" value={category.revenueShare+'%'} />
          <Stat label="Orders" value={category.orders} />
          <Stat label="Customers" value={category.customers} />
          <Stat label="Repeat %" value={category.repeatRate+'%'} />
          <Stat label="Growth %" value={category.growthPercent==null?'—':category.growthPercent+'%'} />
        </div>
        <div style={{fontSize:13, color:'#94a3b8', marginBottom:14}}>Top predicted next product opportunities (placeholder)</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14}}>
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} style={{padding:'12px 14px 14px', border:'1px solid rgba(255,255,255,0.12)', borderRadius:16, background:'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))'}}>
              <div style={{fontSize:12, fontWeight:600, color:'#f1f5f9', marginBottom:6}}>Product {i+1}</div>
              <div style={{fontSize:11, color:'#94a3b8'}}>Pred. Lift: —</div>
              <div style={{fontSize:11, color:'#94a3b8', marginTop:4}}>Repeat Fit: —</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPerformanceOverview;
