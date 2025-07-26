import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface FeatureImportanceDatum {
  feature: string;
  importance: number;
}
export interface FeatureImportanceProps {
  features: FeatureImportanceDatum[];
  sortBy?: 'importance' | 'alphabetical';
  onSortChange?: (sortBy: 'importance' | 'alphabetical') => void;
}

export default function FeatureImportance({ features, sortBy = 'importance', onSortChange }: FeatureImportanceProps) {
  const sorted = useMemo(() => {
    if (sortBy === 'alphabetical') {
      return [...features].sort((a, b) => a.feature.localeCompare(b.feature));
    }
    return [...features].sort((a, b) => b.importance - a.importance);
  }, [features, sortBy]);

  return (
    <Card style={{ background: '#232a36', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
        <span>Feature Importance</span>
        <select value={sortBy} onChange={e => onSortChange?.(e.target.value as any)} style={{ background: '#181e2a', color: '#f7f9fb', border: '1px solid #2c3341', borderRadius: 4 }}>
          <option value="importance">Sort by Importance</option>
          <option value="alphabetical">Sort A-Z</option>
        </select>
      </div>
      <Plot
        data={[{
          type: 'bar',
          orientation: 'h',
          y: sorted.map(f => f.feature),
          x: sorted.map(f => f.importance),
          marker: {
            color: sorted.map((_, i) => `rgba(233,48,255,${0.7 - i * 0.05})`),
            line: { color: '#f7f9fb', width: 1 }
          },
          hoverinfo: 'x+y',
        }]}
        layout={{
          margin: { l: 120, r: 10, t: 10, b: 40 },
          xaxis: {
            title: 'Importance',
            showgrid: false,
            zeroline: false
          },
          yaxis: {
            automargin: true,
            showgrid: false,
            zeroline: false
          },
          plot_bgcolor: '#232a36',
          paper_bgcolor: '#232a36',
        }}
        config={{ displayModeBar: false }}
      />
    </Card>
  );
} 