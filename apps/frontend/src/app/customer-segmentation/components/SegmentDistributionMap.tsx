"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import of Plotly to prevent SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface Customer {
  customer_id: string;
  customer_name: string;
  segment_name: string;
  rfm_rl_score: number;
  lifetime_value: number;
  avg_order_value: number;
  transaction_count: number;
  days_since_last_activity: number;
  current_year_sales?: number;
}

interface SegmentDistributionMapProps {
  data: Customer[];
  selectedSegments?: string[];
  onSegmentFilter?: (segments: string[]) => void;
  onCustomerSelect?: (customer: Customer, event?: any) => void;
  selectedCustomer?: Customer | null;
  width?: number;
  height?: number;
  viewMode?: string;
  performanceMode?: boolean;
}

export const SegmentDistributionMap: React.FC<SegmentDistributionMapProps> = ({
  data = [],
  selectedSegments = [],
  onSegmentFilter = () => {},
  onCustomerSelect = () => {},
  selectedCustomer = null,
  width = 760,
  height = 560,
  viewMode = 'overview',
  performanceMode = false
}) => {
  const [segmentGroups, setSegmentGroups] = useState<Record<string, Customer[]>>({});
  const [selectedAxis, setSelectedAxis] = useState({
    x: 'rfm_rl_score',
    y: 'lifetime_value'
  });
  const [isClient, setIsClient] = useState(false);

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Vibrant colors for segments - matching filter dropdown order
  const segmentColors: Record<string, string> = {
    'Champions': '#10b981',          // Emerald green
    'Loyal Customers': '#8b5cf6',    // Purple
    'Potential Loyalists': '#f59e0b', // Amber
    'New Customers': '#ec4899',      // Pink
    'At Risk': '#ef4444',            // Red
    "Can't Lose Them": '#dc2626',    // Dark red
    'Hibernating': '#6366f1',        // Indigo
    'Lost': '#64748b',               // Slate
    'Unknown': '#3b82f6'              // Blue for unknown/unassigned
  };

  // Process and group data by segments
  const processedData = useMemo(() => {
    if (!data.length) return { groupedData: {}, allData: [] };

    const tempSegmentGroups: Record<string, Customer[]> = {};
    const validData = data.filter(customer =>
      customer &&
      typeof customer[selectedAxis.x as keyof Customer] === 'number' &&
      typeof customer[selectedAxis.y as keyof Customer] === 'number' &&
      !isNaN(customer[selectedAxis.x as keyof Customer] as number) &&
      !isNaN(customer[selectedAxis.y as keyof Customer] as number)
    );

    validData.forEach(customer => {
      const segmentName = customer.segment_name || 'Unknown';

      if (!tempSegmentGroups[segmentName]) {
        tempSegmentGroups[segmentName] = [];
      }
      tempSegmentGroups[segmentName].push(customer);
    });

    setSegmentGroups(tempSegmentGroups);
    return { groupedData: tempSegmentGroups, allData: validData };
  }, [data, selectedAxis]);

  // Prepare plot data
  const plotData = useMemo(() => {
    if (!Object.keys(segmentGroups).length) return [];

    return Object.entries(segmentGroups).map(([segmentName, customers]) => {
      const isSelected = selectedSegments.length === 0 || selectedSegments.includes(segmentName);
      const segmentColor = segmentColors[segmentName] || '#3b82f6'; // Blue as default

      return {
        x: customers.map(c => c[selectedAxis.x as keyof Customer]),
        y: customers.map(c => c[selectedAxis.y as keyof Customer]),
        mode: 'markers',
        type: performanceMode ? 'scattergl' : 'scatter',
        name: segmentName,
        text: customers.map(c =>
          `${c.customer_name}<br>` +
          `Segment: ${c.segment_name}<br>` +
          `${selectedAxis.x}: ${c[selectedAxis.x as keyof Customer]}<br>` +
          `${selectedAxis.y}: ${c[selectedAxis.y as keyof Customer]}<br>` +
          `Lifetime Value: $${c.lifetime_value?.toFixed(2) || 'N/A'}`
        ),
        hovertemplate: '%{text}<extra></extra>',
        marker: {
          size: performanceMode && data.length > 2000 ? 4 : data.length > 1000 ? 6 : 8,
          color: segmentColor,
          opacity: isSelected ? (data.length > 2000 ? 0.7 : 0.85) : 0.3,
          line: data.length > 2000 ? {} : {
            width: isSelected ? 1 : 0,
            color: 'white'
          }
        },
        visible: true,
        customdata: customers.map(c => ({ customer: c, segment: segmentName }))
      };
    });
  }, [segmentGroups, selectedSegments, selectedAxis, performanceMode, data.length]);

  // Plot layout configuration with vibrant colors
  const plotLayout = useMemo(() => ({
    width: width || window.innerWidth - 50,
    height: height - 80, // Account for header
    plot_bgcolor: '#ffffff',
    paper_bgcolor: '#ffffff',
    font: {
      family: 'Inter, sans-serif',
      color: '#1f2937'
    },
    margin: { t: 20, r: 110, b: 60, l: 80 },
    xaxis: {
      title: {
        text: selectedAxis.x.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        font: { size: 14, color: '#374151', weight: 600 }
      },
      gridcolor: '#f3f4f6',
      gridwidth: 1,
      zeroline: false,
      tickfont: { color: '#374151', size: 12 }
    },
    yaxis: {
      title: {
        text: selectedAxis.y.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        font: { size: 14, color: '#374151', weight: 600 }
      },
      gridcolor: '#f3f4f6',
      gridwidth: 1,
      zeroline: false,
      tickfont: { color: '#374151', size: 12 }
    },
    legend: {
      x: 0.96,
      y: 0.5,
      xanchor: 'left',
      yanchor: 'middle',
      bgcolor: 'rgba(255, 255, 255, 0.95)',
      bordercolor: '#e8d4e6',
      borderwidth: 1,
      font: { size: 10, color: '#8b5cf6' },
      orientation: 'v'
    },
    hovermode: 'closest',
    dragmode: 'pan'
  }), [selectedAxis, width, height]);

  // Plot configuration
  const plotConfig = useMemo(() => ({
    displayModeBar: false,
    displaylogo: false,
    toImageButtonOptions: {
      format: 'png',
      filename: 'segment_distribution',
      height: height,
      width: width,
      scale: 1
    }
  }), [width, height]);

  // Handle plot clicks
  const handlePlotClick = useCallback((event: any) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const customerData = point.customdata;

      if (customerData && customerData.customer) {
        onCustomerSelect(customerData.customer, event.event);
      }
    }
  }, [onCustomerSelect]);

  // Handle axis change
  const handleAxisChange = useCallback((axis: 'x' | 'y', value: string) => {
    setSelectedAxis(prev => ({ ...prev, [axis]: value }));
  }, []);

  // Available axis options
  const axisOptions = [
    { value: 'rfm_rl_score', label: 'RFM Score' },
    { value: 'lifetime_value', label: 'Lifetime Value' },
    { value: 'avg_order_value', label: 'Avg Order Value' },
    { value: 'transaction_count', label: 'Transaction Count' },
    { value: 'days_since_last_activity', label: 'Days Since Last Activity' },
    { value: 'current_year_sales', label: 'Current Year Sales' }
  ];

  // Don't render on server side
  if (!isClient) {
    return (
      <div className="flex items-center justify-center" style={{
        width: '100%',
        height: height,
        background: 'white',
        borderRadius: '12px',
        border: '2px solid #e8d4e6',
        boxShadow: '0 2px 8px 0 rgba(232, 212, 230, 0.15)',
        color: '#8b5cf6'
      }}>
        Loading visualization...
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: height,
      background: 'white',
      borderRadius: '12px',
      border: '2px solid #e8d4e6',
      boxShadow: '0 2px 8px 0 rgba(232, 212, 230, 0.15)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        background: '#ffffff'
      }}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold m-0" style={{ color: '#8b5cf6' }}>
              Segment Distribution Map
            </h3>
            <div className="text-xs mt-1" style={{ color: '#a78bfa' }}>
              {Object.keys(segmentGroups).length} segments • {data.length} customers
            </div>
          </div>

          {/* Axis Controls */}
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium" style={{ color: '#8b5cf6' }}>X:</label>
              <select
                value={selectedAxis.x}
                onChange={(e) => handleAxisChange('x', e.target.value)}
                className="bg-white border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-accent/20"
                style={{ color: '#8b5cf6', borderColor: '#d8b4fe' }}
              >
                {axisOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium" style={{ color: '#8b5cf6' }}>Y:</label>
              <select
                value={selectedAxis.y}
                onChange={(e) => handleAxisChange('y', e.target.value)}
                className="bg-white border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-accent/20"
                style={{ color: '#8b5cf6', borderColor: '#d8b4fe' }}
              >
                {axisOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedSegments.length > 0 && (
              <button
                onClick={() => onSegmentFilter([])}
                className="bg-purple-100 text-purple-700 border border-purple-300 rounded px-2 py-1 text-xs font-medium cursor-pointer hover:bg-purple-200 transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plot Container */}
      <div style={{
        width: '100%',
        height: height - 80,
        position: 'relative'
      }}>
        {plotData.length > 0 ? (
          <Plot
            data={plotData}
            layout={plotLayout}
            config={plotConfig}
            onClick={handlePlotClick}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-base" style={{ color: '#6b7280' }}>
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-70">📊</div>
              <div style={{ color: '#374151' }}>No segment data available</div>
              <div className="text-sm mt-2" style={{ color: '#9ca3af' }}>
                Please ensure your data contains valid segments
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};