import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { CategoryTreemapProps } from '../../types';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const CategoryTreemap: React.FC<CategoryTreemapProps> = ({ categories, highlights, width = 600, height = 400 }) => {
  const safeCategories = Array.isArray(categories) ? categories : [];

  const labels = safeCategories.map(c => c.customer_id ? `Customer ${c.customer_id}` : 'Unknown Customer');
  const parents = safeCategories.map(c => "");
  const values = safeCategories.map(c => typeof c.avg_order_value === 'number' ? c.avg_order_value : 0);
  
  const markerColors = safeCategories.map(c => 
    highlights?.category === (c.customer_id ? `Customer ${c.customer_id}` : 'Unknown Customer') ? '#e930ff' : '#00e0ff' 
  );

  return (
    <Plot
      data={[{
        type: 'treemap',
        labels: labels,
        parents: parents,
        values: values,
        textinfo: 'label+value',
        marker: {
          colors: markerColors,
          line: { width: 0.5, color: '#0a1224' } 
        },
        hoverinfo: 'label+value+percent parent+percent root',
      }]}
      layout={{
        width: width,
        height: height,
        title: 'Customer Avg. Order Value Treemap (Adapted)',
        paper_bgcolor: '#1E293B',
        plot_bgcolor: '#1E293B',
        font: { color: '#E2E8F0' },
        margin: { t: 50, l: 10, r: 10, b: 10 },
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default CategoryTreemap; 