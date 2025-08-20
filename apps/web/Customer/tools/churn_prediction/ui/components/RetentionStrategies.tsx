

import React from 'react';

export interface RetentionStrategy {
  title: string;
  description: string;
  impact: string;
  effort: string;
}
export interface RetentionStrategiesProps {
  strategies: RetentionStrategy[];
}

export default function RetentionStrategies({ strategies }: RetentionStrategiesProps) {
  return (
    <div
      style={{
        minHeight: 400,
        background: 'rgba(30, 39, 56, 0.9)',
        backdropFilter: 'blur(20px)',
        padding: 32,
        borderRadius: 20,
        border: '1px solid rgba(0, 224, 255, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 224, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(0, 224, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 24, 
        position: 'relative',
        zIndex: 1 
      }}>
        <div style={{
          fontSize: 24,
          background: 'linear-gradient(135deg, #00e0ff, #7c3aed)',
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          🎯
        </div>
        <h3 style={{ 
          margin: 0, 
          color: '#f7f9fb', 
          fontWeight: 800, 
          fontSize: 22,
          background: 'linear-gradient(135deg, #00e0ff, #7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Recommended Retention Strategies
        </h3>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {strategies.map((s, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(15, 20, 25, 0.6)',
              borderLeft: '4px solid #00e0ff',
              border: '1px solid rgba(0, 224, 255, 0.2)',
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(15, 20, 25, 0.8)';
              e.currentTarget.style.transform = 'translateX(8px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 224, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(15, 20, 25, 0.6)';
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#f7f9fb' }}>{s.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(247, 249, 251, 0.7)', marginTop: 6 }}>{s.description}</div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: '#00e0ff',
                  background: 'rgba(0, 224, 255, 0.1)',
                  border: '1px solid rgba(0, 224, 255, 0.3)',
                  borderRadius: 12,
                  padding: '6px 12px',
                  marginTop: 10,
                  fontWeight: 600
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e0ff' }} />
                Expected Impact: {s.impact}
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 120 }}>
              <div style={{ 
                fontSize: 13, 
                color: 'rgba(247, 249, 251, 0.6)',
                marginBottom: 8
              }}>
                Effort: <span style={{ 
                  color: s.effort === 'Low' ? '#00e676' : 
                         s.effort === 'Medium' ? '#ffc107' : 
                         '#ff5252',
                  fontWeight: 600
                }}>{s.effort}</span>
              </div>
              <button
                style={{
                  background: 'linear-gradient(135deg, #00e0ff, #7c3aed)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  boxShadow: '0 4px 20px rgba(0, 224, 255, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 224, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 224, 255, 0.3)';
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                Implement
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 