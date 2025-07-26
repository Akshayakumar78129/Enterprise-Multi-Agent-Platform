import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface ProbabilityHistogramProps {
  probabilities: number[];
  thresholds: number[];
  onThresholdChange?: (thresholds: number[]) => void;
  binCount: number;
  onBinCountChange?: (binCount: number) => void;
}

const colors = ['#00e0ff', '#5fd4d6', '#aa45dd', '#e930ff'];
const riskLabels = ['Low', 'Medium', 'High', 'Very High'];

export default function ProbabilityHistogram({
  probabilities,
  thresholds = [0.3, 0.6, 0.8],
  onThresholdChange,
  binCount = 30,
  onBinCountChange
}: ProbabilityHistogramProps) {
  const bins = useMemo(() => {
    if (!probabilities.length) return [];
    const min = 0, max = 1;
    const width = (max - min) / binCount;
    const counts = Array(binCount).fill(0);
    probabilities.forEach(p => {
      const idx = Math.min(Math.floor((p - min) / width), binCount - 1);
      counts[idx]++;
    });
    return counts;
  }, [probabilities, binCount]);

  const binEdges = Array.from({ length: binCount + 1 }, (_, i) => i / binCount);

  return (
    <Card style={{ background: '#232a36', padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Churn Probability Distribution</div>
      <Plot
        data={[{
          x: binEdges.slice(0, -1).map((b, i) => (b + binEdges[i + 1]) / 2),
          y: bins,
          type: 'bar',
          marker: {
            color: binEdges.slice(0, -1).map(b =>
              b < thresholds[0] ? colors[0] :
              b < thresholds[1] ? colors[1] :
              b < thresholds[2] ? colors[2] : colors[3]
            )
          },
          hoverinfo: 'x+y',
        }]}
        layout={{
          margin: { l: 40, r: 10, t: 10, b: 40 },
          xaxis: {
            title: 'Churn Probability',
            range: [0, 1],
            showgrid: false,
            zeroline: false
          },
          yaxis: {
            title: 'Customer Count',
            showgrid: false,
            zeroline: false
          },
          shapes: thresholds.map((t, i) => ({
            type: 'line',
            x0: t, x1: t, y0: 0, y1: Math.max(...bins),
            line: { color: '#f7f9fb', width: 2, dash: 'dash' },
            name: riskLabels[i + 1] + ' threshold'
          })),
          showlegend: false,
          plot_bgcolor: '#232a36',
          paper_bgcolor: '#232a36',
        }}
        config={{ displayModeBar: false }}
      />
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14 }}>Bins:</span>
        <input type="range" min={5} max={50} value={binCount} onChange={e => onBinCountChange?.(parseInt(e.target.value))} />
        <span style={{ fontSize: 14 }}>{binCount}</span>
        <button style={{ marginLeft: 16, background: '#00e0ff', color: '#181e2a', border: 'none', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }} onClick={() => onBinCountChange?.(30)}>Reset</button>
      </div>
    </Card>
  );
} 