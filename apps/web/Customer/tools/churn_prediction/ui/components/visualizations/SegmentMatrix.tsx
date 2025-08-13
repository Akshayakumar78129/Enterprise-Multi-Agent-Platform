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
  onSegmentClick?: (segment: string, riskData: any, event: React.MouseEvent) => void;
}

const colors = ['#1976D2', '#2196F3', '#64B5F6', '#FFC107'];
const riskLabels = ['Low', 'Medium', 'High', 'Very High'];

export default function SegmentMatrix({ segmentMatrix, onSegmentClick }: SegmentMatrixProps) {
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
          colorscale: [[0, '#1976D2'], [0.33, '#2196F3'], [0.66, '#64B5F6'], [1, '#FFC107']],
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
        onClick={(event: any) => {
          if (onSegmentClick && event.points && event.points[0]) {
            const point = event.points[0];
            // For heatmaps, point.x gives us the x-axis value (segment name)
            // We need to find the corresponding segment in our data
            const segmentName = point.x;
            const segment = segmentMatrix.find(s => s.segment === segmentName);
            
            if (segment) {
              // Create a mock React MouseEvent for positioning
              const mockEvent = {
                clientX: event.event?.clientX || window.innerWidth / 2,
                clientY: event.event?.clientY || window.innerHeight / 2,
                preventDefault: () => {},
                stopPropagation: () => {}
              } as React.MouseEvent;
              
              onSegmentClick(segment.segment, {
                low: segment.low,
                medium: segment.medium,
                high: segment.high,
                very_high: segment.very_high
              }, mockEvent);
            }
          }
        }}
      />
    </Card>
  );
} 