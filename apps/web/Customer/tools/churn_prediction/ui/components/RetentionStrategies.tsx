import React from 'react';
import { Card } from '../../../../../ui-common/design-system/components/Card';

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
    <Card style={{ minHeight: 180, background: 'linear-gradient(90deg, #232a36 60%, #2c3341 100%)', padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Recommended Retention Strategies</div>
      {strategies.map((s, i) => (
        <div key={i} style={{ background: '#0a1224', borderLeft: '4px solid #00e0ff', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{s.title}</div>
            <div style={{ fontSize: 14, color: '#f7f9fbcc', marginTop: 4 }}>{s.description}</div>
            <div style={{ fontSize: 13, color: '#00e0ff', marginTop: 4 }}>Expected Impact: {s.impact}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#b0b8c9' }}>Effort: {s.effort}</div>
            <button style={{ background: '#00e0ff', color: '#181e2a', border: 'none', borderRadius: 4, padding: '2px 10px', cursor: 'pointer', marginTop: 8 }}>Export</button>
          </div>
        </div>
      ))}
    </Card>
  );
} 