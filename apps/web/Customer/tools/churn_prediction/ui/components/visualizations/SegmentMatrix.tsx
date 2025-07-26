import React from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface SegmentMatrixDatum {
  segment: string;
  low: number;
  medium: number;
  high: number;
  very_high: number;
}
export interface SegmentMatrixProps {
  segmentMatrix: SegmentMatrixDatum[];
}

const colors = ['#00e0ff', '#5fd4d6', '#aa45dd', '#e930ff'];
const riskLabels = ['Low', 'Medium', 'High', 'Very High'];

export default function SegmentMatrix({ segmentMatrix }: SegmentMatrixProps) {
  const z = [
    segmentMatrix.map(s => s.low),
    segmentMatrix.map(s => s.medium),
    segmentMatrix.map(s => s.high),
    segmentMatrix.map(s => s.very_high)
  ];
  return (
    <Card style={{ background: '#232a36', padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Segment Comparison Matrix</div>
      <Plot
        data={[{
          z,
          x: segmentMatrix.map(s => s.segment),
          y: riskLabels,
          type: 'heatmap',
          colorscale: [[0, '#00e0ff'], [0.33, '#5fd4d6'], [0.66, '#aa45dd'], [1, '#e930ff']],
          showscale: true,
          hoverongaps: false,
        }]}
        layout={{
          margin: { l: 80, r: 10, t: 10, b: 40 },
          xaxis: { title: 'Segment', showgrid: false, zeroline: false },
          yaxis: { title: 'Risk Level', showgrid: false, zeroline: false },
          plot_bgcolor: '#232a36',
          paper_bgcolor: '#232a36',
        }}
        config={{ displayModeBar: false }}
      />
    </Card>
  );
} 