// Clean single implementation of KPI tiles (scratch-built, no design-system dependency)
import React from 'react';

// Suspense-style compact tiles (transparent blue variant, no frosted glass)
const RADIUS = 18; // more rounded
const BG = 'linear-gradient(145deg, rgba(37,76,115,0.28), rgba(17,42,78,0.22))';
const BG_HOVER = 'linear-gradient(145deg, rgba(55,118,180,0.38), rgba(27,62,108,0.30))';
const BORDER = '1px solid rgba(59,130,246,0.35)';
const BORDER_HOVER = '1px solid rgba(96,165,250,0.55)';
const SHADOW = '0 2px 4px -1px rgba(0,0,0,0.45), 0 4px 14px -4px rgba(0,0,0,0.5)';
const VALUE_GRAD = 'linear-gradient(90deg,#60a5fa,#38bdf8,#818cf8)';
const GRID_MIN = 170; // slightly tighter to reduce perceived size

const pct = (part, total) => ((part / Math.max(1,total)) * 100).toFixed(1) + '%';
const arrow = d => d==='up'?'▲':d==='down'?'▼':'—';
const arrowClr = d => d==='up'? '#10b981' : d==='down'? '#ef4444' : '#94a3b8';

function buildTiles(kpis){
  if(!kpis) return [];
  const active = Math.max(1, kpis.activeCustomers||0);
  return [
    { key:'rev', label:'Predicted 30d Revenue', value:'$'+(kpis.predictedRevenue30d||0).toLocaleString(), subtitle:'Expected pipeline value', icon:'💰' },
    { key:'hi', label:'High‑Intent Customers', value:String(kpis.highIntentCustomers||0), subtitle:`≥70% • ${pct(kpis.highIntentCustomers||0,active)}`, icon:'🔥', trend:pct(kpis.highIntentCustomers||0,active), dir:(kpis.highIntentCustomers/active)>0.35?'up':'neutral' },
    { key:'soon', label:'Imminent (≤7d)', value:String(kpis.customersWithin7d||0), subtitle:`${pct(kpis.customersWithin7d||0,active)} near-term`, icon:'⏱️', trend:pct(kpis.customersWithin7d||0,active), dir:(kpis.customersWithin7d/active)>0.25?'up':'neutral' },
    { key:'conf', label:'Confidence Index', value:Math.round((kpis.confidenceIndex||0)*100)+'%', subtitle:'Avg prediction probability', icon:'🎯', trend:Math.round((kpis.confidenceIndex||0)*100)+'%', dir:(kpis.confidenceIndex||0)>0.65?'up':(kpis.confidenceIndex||0)<0.5?'down':'neutral' },
    { key:'cross', label:'Cross‑Sell Rate', value:(kpis.crossSellRate||0)+'%', subtitle:'Outside previous category', icon:'🔁', trend:(kpis.crossSellRate||0)+'%', dir:(kpis.crossSellRate||0)>45?'up':(kpis.crossSellRate||0)<15?'down':'neutral' }
  ];
}

const skeletonStyle = idx => ({
  position:'relative',
  padding:'12px 14px 14px',
  border:BORDER,
  borderRadius:RADIUS,
  background:BG,
  boxShadow:SHADOW,
  overflow:'hidden',
  width:'100%',
  minHeight:120,
  animation:`fadeInUp .45s ease ${idx*0.06}s both`
});

const Skeleton = ({i}) => (
  <div style={skeletonStyle(i)}>
    <div style={{height:12,width:'48%',background:'rgba(255,255,255,0.28)',borderRadius:8,marginBottom:18}} />
    <div style={{height:38,width:'62%',background:'rgba(255,255,255,0.32)',borderRadius:12,marginBottom:14}} />
    <div style={{height:10,width:'42%',background:'rgba(255,255,255,0.24)',borderRadius:6}} />
    <div style={{position:'absolute',inset:0,background:'linear-gradient(110deg,transparent 0%,rgba(255,255,255,0.55) 45%,transparent 85%)',animation:'shimmer 1.4s linear infinite'}} />
  </div>
);

const tileBase = (idx, interactive) => ({
  position:'relative',
  display:'flex',
  flexDirection:'column',
  justifyContent:'space-between',
  padding:'12px 14px 14px',
  minHeight:120,
  border:BORDER,
  borderRadius:RADIUS,
  background:BG,
  boxShadow:SHADOW,
  overflow:'hidden',
  animation:`fadeInUp .5s cubic-bezier(.4,.12,.2,1) ${idx*0.05}s both`,
  transition:'transform .35s ease, box-shadow .35s ease, background .4s ease',
  cursor: interactive? 'pointer':'default'
});

const NextPurchaseKPITiles = ({ kpis, isLoading=false }) => {
  const tiles = buildTiles(kpis);
  return (
    <div style={{position:'relative', marginBottom:30}}>
      <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 80% 15%, rgba(0,224,255,0.12), transparent 60%)', pointerEvents:'none'}} />
      <div style={{display:'grid', gridTemplateColumns:`repeat(auto-fit,minmax(${GRID_MIN}px,1fr))`, gap:14}}>
        {isLoading && !kpis && Array.from({length:5}).map((_,i)=>(<Skeleton key={i} i={i} />))}
        {!isLoading && kpis && tiles.map((t,i)=> (
          <div key={t.key}
               style={tileBase(i, i===0)}
               onMouseEnter={e=> {e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.background=BG_HOVER; e.currentTarget.style.border=BORDER_HOVER;}}
               onMouseLeave={e=> {e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.background=BG; e.currentTarget.style.border=BORDER;}}
               aria-label={t.label}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4}}>
              <span style={{fontSize:20, lineHeight:1}}>{t.icon}</span>
              <div style={{fontSize:10, fontWeight:600, padding:'4px 8px', borderRadius:12, background:'rgba(59,130,246,0.15)', color:'#93c5fd', border:'1px solid rgba(59,130,246,0.35)'}}>{t.trend || '—'}</div>
            </div>
            <div style={{fontSize:26, fontWeight:700, lineHeight:1, background:VALUE_GRAD, WebkitBackgroundClip:'text', color:'transparent', marginBottom:6}}>{t.value}</div>
            <div style={{fontSize:11, fontWeight:600, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4}}>{t.label}</div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto'}}>
              <div style={{fontSize:10, color:'#cbd5e1'}}>{t.subtitle}</div>
              <div style={{fontSize:14, fontWeight:700, color:arrowClr(t.dir)}}>{arrow(t.dir)}</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes shimmer {0%{transform:translateX(-100%);}100%{transform:translateX(100%);}}
        @keyframes fadeInUp {from {opacity:0; transform:translateY(24px);} to {opacity:1; transform:translateY(0);}}
      `}</style>
    </div>
  );
};

export default NextPurchaseKPITiles;
