import React from 'react';
import dynamic from 'next/dynamic';
import { Card } from '../../../../../../ui-common/design-system/components/Card';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export interface RiskTimeSeriesDatum {
  date: string;
  low: number;
  medium: number;
  high: number;
  very_high: number;
}
export interface TemporalRiskPatternProps {
  riskTimeSeries: RiskTimeSeriesDatum[];
}

const colors = ['#00e0ff', '#5fd4d6', '#aa45dd', '#e930ff'];
const riskLabels = ['Low', 'Medium', 'High', 'Very High'];

export default function TemporalRiskPattern({ riskTimeSeries }: TemporalRiskPatternProps) {
  const dates = riskTimeSeries.map(d => d.date);
  return (
    <Card style={{ background: '#232a36', padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Temporal Risk Pattern</div>
      <Plot
        data={[
          {
            x: dates,
            y: riskTimeSeries.map(d => d.low),
            stackgroup: 'one',
            name: 'Low',
            fillcolor: colors[0],
            line: { color: colors[0] },
            type: 'scatter',
            mode: 'none',
          },
          {
            x: dates,
            y: riskTimeSeries.map(d => d.medium),
            stackgroup: 'one',
            name: 'Medium',
            fillcolor: colors[1],
            line: { color: colors[1] },
            type: 'scatter',
            mode: 'none',
          },
          {
            x: dates,
            y: riskTimeSeries.map(d => d.high),
            stackgroup: 'one',
            name: 'High',
            fillcolor: colors[2],
            line: { color: colors[2] },
            type: 'scatter',
            mode: 'none',
          },
          {
            x: dates,
            y: riskTimeSeries.map(d => d.very_high),
            stackgroup: 'one',
            name: 'Very High',
            fillcolor: colors[3],
            line: { color: colors[3] },
            type: 'scatter',
            mode: 'none',
          },
        ]}
        layout={{
          margin: { l: 40, r: 10, t: 10, b: 40 },
          xaxis: { title: 'Date', showgrid: false, zeroline: false },
          yaxis: { title: 'Customer Count', showgrid: false, zeroline: false },
          plot_bgcolor: '#232a36',
          paper_bgcolor: '#232a36',
          legend: { orientation: 'h', y: 1.1 },
        }}
        config={{ displayModeBar: false }}
      />
    </Card>
  );
} 