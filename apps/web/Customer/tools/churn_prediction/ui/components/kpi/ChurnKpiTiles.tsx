import React from 'react';
import { ChurnKPI } from '../../types';

interface ChurnKpiTilesProps {
  kpis: ChurnKPI;
}

const tileStyle: React.CSSProperties = {
  width: 120,
  height: 120,
  background: '#1e2738',
  borderRadius: 16,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#f7f9fb',
  fontFamily: 'Inter, sans-serif',
  marginRight: 16,
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
};

export default function ChurnKpiTiles({ kpis }: ChurnKpiTilesProps) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
      <div style={tileStyle}>
        <div style={{ fontSize: 32, fontWeight: 600 }}>{kpis.overallRisk}%</div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>Overall Churn Risk</div>
      </div>
      <div style={tileStyle}>
        <div style={{ fontSize: 32, fontWeight: 600 }}>{kpis.highRiskCount}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>High + Very High</div>
      </div>
      <div style={tileStyle}>
        <div style={{ fontSize: 32, fontWeight: 600 }}>{kpis.modelConfidence}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>ROC AUC</div>
      </div>
      <div style={tileStyle}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{kpis.topFactor}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Top Churn Factor</div>
      </div>
      <div style={tileStyle}>
        <div style={{ fontSize: 32, fontWeight: 600 }}>{kpis.riskTransition}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Risk Level Changes</div>
      </div>
    </div>
  );
} 