import React from 'react';
import { Card } from '../../../../../ui-common/design-system/components/Card';

export interface Insight {
  title: string;
  content: string;
  type: string;
}
export interface InsightsDrawerProps {
  insights: Insight[];
}

export default function InsightsDrawer({ insights }: InsightsDrawerProps) {
  return (
    <Card style={{ minHeight: 320, background: '#232a36', padding: 16, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: 'radial-gradient(circle, #00e0ff 60%, #232a36 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28, color: '#fff' }}>🤖</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 20 }}>Churn Insights</span>
      </div>
      {insights.map((insight, i) => (
        <div key={i} style={{ background: '#1e2738', borderLeft: `4px solid ${insight.type === 'alert' ? '#00e0ff' : '#e930ff'}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{insight.title}</div>
          <div style={{ fontSize: 14, color: '#f7f9fbcc', marginTop: 4 }}>{insight.content}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button style={{ background: '#00e0ff', color: '#181e2a', border: 'none', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}>Export</button>
            <button style={{ background: 'none', color: '#00e0ff', border: '1px solid #00e0ff', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}>Share</button>
          </div>
        </div>
      ))}
    </Card>
  );
} 