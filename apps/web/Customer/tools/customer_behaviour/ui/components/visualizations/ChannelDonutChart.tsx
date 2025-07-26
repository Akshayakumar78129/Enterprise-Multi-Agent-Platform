import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ChannelDonutChartProps } from '../../types'; // Assuming this type defines 'channels'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const ChannelDonutChart: React.FC<ChannelDonutChartProps> = ({ channels, highlights, width = 400, height = 400 }) => {
  // Ensure channels (which is data.patterns) is an array, default to empty array if undefined or not an array
  const safePatterns = Array.isArray(channels) ? channels : [];

  // Aggregate data from safePatterns (originally data.patterns) to fit a donut chart structure
  // Example: Create a donut chart based on 'churn_risk' counts
  const aggregatedData = useMemo(() => {
    if (!safePatterns.length) {
      return { labels: [], values: [] };
    }
    const countsByChurnRisk = safePatterns.reduce((acc, pattern) => {
      const risk = pattern.churn_risk || 'Unknown'; // Handle cases where churn_risk might be undefined
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      labels: Object.keys(countsByChurnRisk),
      values: Object.values(countsByChurnRisk),
    };
  }, [safePatterns]);

  const { labels, values } = aggregatedData;

  // Example: Highlighting logic - may need to adapt if the original 'channel' field is not what's being displayed
  // For now, this won't effectively highlight based on original highlights?.channel
  const markerColors = labels.map(label => 
    highlights?.channel === label ? '#e930ff' : (label === 'high' ? 'red' : (label === 'medium' ? 'orange' : '#00e0ff'))
  );

  return (
    <Plot
      data={[{
        type: 'pie',
        labels: labels,
        values: values,
        hole: 0.4, // This makes it a donut chart
        textinfo: 'label+percent',
        hoverinfo: 'label+value+percent',
        marker: { 
          colors: markerColors,
          line: { color: '#0a1224', width: 1}
         },
      }]}
      layout={{
        width: width,
        height: height,
        title: 'Customer Churn Risk Distribution (Donut)',
        paper_bgcolor: '#1E293B',
        plot_bgcolor: '#1E293B',
        font: { color: '#E2E8F0' },
        showlegend: true,
        legend: { orientation: 'h', y: -0.1 },
        margin: { t: 50, l: 20, r: 20, b: 20 },
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default ChannelDonutChart; 