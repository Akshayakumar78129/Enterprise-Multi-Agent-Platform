import React from 'react';

const FeatureImportanceExplorer = ({ data = [], isLoading = false, onFeatureSelect = () => {} }) => {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      border: '1px solid rgba(59,130,246,0.1)',
      borderRadius: '20px',
      padding: '20px 22px',
      height: '400px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 12px -2px rgba(0,0,0,0.35), 0 12px 32px -6px rgba(59,130,246,0.25)',
      animation: 'fadeInUp 0.6s ease both'
    }}>
      <div style={{
        position:'absolute',
        inset:0,
        background:'radial-gradient(circle at 30% 20%, rgba(139,92,246,0.15), transparent 60%)'
      }} />
      <div style={{ position:'relative', zIndex:1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent' }}>Feature Importance</h3>
        <span style={{ fontSize: '12px', color: '#5891cb' }}>Model Inputs</span>
      </div>
      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5891cb' }}>Loading...</div>
      ) : data.length === 0 ? (
        <div style={{ flex: 1, color: '#5891cb', fontSize: '13px' }}>No feature data available</div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {data.map((f, idx) => (
            <div key={f.name} style={{ marginBottom: '10px', cursor: 'pointer', padding:'6px 6px 10px 6px', borderRadius: '12px', transition:'all .25s ease', border:'1px solid transparent' }} onClick={() => onFeatureSelect(f.name)}
              onMouseEnter={(e)=> { e.currentTarget.style.background='rgba(59,130,246,0.08)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 16px -4px rgba(59,130,246,0.35)'; e.currentTarget.style.border='1px solid rgba(59,130,246,0.25)'; }}
              onMouseLeave={(e)=> { e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.border='1px solid transparent'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#f7f9fb' }}>{f.name}</span>
                <span style={{ color: '#00e0ff', fontWeight: 600 }}>{(f.importance * 100).toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', position:'relative' }}>
                <div style={{ width: `${f.importance * 100}%`, height: '100%', background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', boxShadow:'0 0 0 1px rgba(255,255,255,0.05) inset' }} />
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default FeatureImportanceExplorer;
