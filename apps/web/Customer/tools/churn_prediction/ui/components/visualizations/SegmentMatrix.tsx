import React from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { handleChartClick } from '../../utils/chartSelectionHelper';

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
          if (event.points && event.points[0]) {
            const point = event.points[0];
            const segmentName = point.x;
            const riskLevel = point.y;
            const value = point.z;
            const segment = segmentMatrix.find(s => s.segment === segmentName);
            
            if (segment) {
              const isShiftClick = event.event?.shiftKey;
              
              if (isShiftClick) {
                // Shift+click: Use ChartSelectionManager for multi-selection
                handleChartClick({
                  chartId: 'segment-matrix',
                  chartType: 'heatmap',
                  label: `${segmentName} - ${riskLevel}`,
                  value: value,
                  unit: ' customers',
                  index: event.points[0].pointIndex,
                  color: value > 30 ? '#FFC107' : value > 20 ? '#64B5F6' : value > 10 ? '#2196F3' : '#1976D2',
                  metadata: {
                    segment: segmentName,
                    riskLevel: riskLevel,
                    distribution: {
                      low: segment.low,
                      medium: segment.medium,
                      high: segment.high,
                      very_high: segment.very_high
                    }
                  }
                }, event.event);
              } else {
                // Regular click: Call the original callback for AI insights
                if (onSegmentClick) {
                  const mockEvent = {
                    clientX: event.event?.clientX || window.innerWidth / 2,
                    clientY: event.event?.clientY || window.innerHeight / 2,
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    shiftKey: false
                  } as React.MouseEvent;
                  
                  onSegmentClick(segment.segment, {
                    low: segment.low,
                    medium: segment.medium,
                    high: segment.high,
                    very_high: segment.very_high
                  }, mockEvent);
                }
              }
            }
          }
        }}
      />
    </Card>
  );
} 