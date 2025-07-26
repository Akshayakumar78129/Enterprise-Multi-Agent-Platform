import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface TrendDataPoint {
  date: string;
  total_cost: number;
  cost_percentage: number;
  capital_cost: number;
  storage_cost: number;
  risk_cost: number;
  opportunity_cost: number;
}

interface CostTrendAnalyzerProps {
  data: TrendDataPoint[];
  isLoading?: boolean;
  width?: number;
  height?: number;
  onTimeRangeChange?: (startDate: string, endDate: string) => void;
  onViewTypeChange?: (viewType: 'absolute' | 'percentage' | 'both') => void;
}

const CostTrendAnalyzer: React.FC<CostTrendAnalyzerProps> = ({
  data = [],
  isLoading = false,
  width = 720,
  height = 480,
  onTimeRangeChange,
  onViewTypeChange
}) => {
  const [viewType, setViewType] = useState<'absolute' | 'percentage' | 'both'>('both');
  const [showComponents, setShowComponents] = useState(true);

  // Enterprise IQ colors
  const colors = {
    primary: '#00e0ff',      // Electric Cyan
    secondary: '#e930ff',    // Signal Magenta
    capital: '#00e0ff',      // Electric Cyan
    storage: '#3e7b97',      // Blue-gray
    risk: '#ffc145',         // Amber
    opportunity: '#e930ff',  // Signal Magenta
    background: '#232a36',   // Graphite
    text: '#f7f9fb',        // Cloud White
    grid: '#3a4459'         // Light Graphite
  };

  const Card = ({ title, subtitle, children, isLoading: cardLoading }: any) => (
    <div style={{
      backgroundColor: colors.background,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.grid}`,
      position: 'relative'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{
          color: colors.text,
          fontSize: '16px',
          fontWeight: 'bold',
          margin: '0 0 4px 0'
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{
            color: colors.text,
            fontSize: '12px',
            opacity: 0.7,
            margin: 0
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {cardLoading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          color: colors.text,
          opacity: 0.7
        }}>
          Loading...
        </div>
      ) : children}
    </div>
  );

  const chartData = useMemo(() => {
    const traces: any[] = [];

    // Validate data structure and ensure arrays are properly defined
    if (!data || !Array.isArray(data) || data.length === 0) {
      // Create empty traces to maintain chart framework
      if (viewType === 'absolute' || viewType === 'both') {
        traces.push({
          x: [],
          y: [],
          name: 'Total Holding Cost',
          line: { color: colors.primary, width: 3 },
          mode: 'lines',
          yaxis: 'y',
          hovertemplate: '<b>Total Cost</b><br>Date: %{x}<br>Amount: $%{y:,.0f}<extra></extra>'
        });
      }

      if (viewType === 'percentage' || viewType === 'both') {
        traces.push({
          x: [],
          y: [],
          name: 'Cost Percentage',
          line: { color: colors.secondary, width: 3, dash: 'dash' },
          mode: 'lines',
          yaxis: viewType === 'both' ? 'y2' : 'y',
          hovertemplate: '<b>Cost Percentage</b><br>Date: %{x}<br>Percentage: %{y:.1f}%<extra></extra>'
        });
      }

      return traces;
    }

    // Validate each data point has required properties
    const validData = data.filter(d => 
      d && 
      typeof d === 'object' && 
      d.date !== undefined && 
      d.total_cost !== undefined && 
      d.cost_percentage !== undefined &&
      d.capital_cost !== undefined &&
      d.storage_cost !== undefined &&
      d.risk_cost !== undefined &&
      d.opportunity_cost !== undefined
    );

    if (validData.length === 0) {
      return traces; // Return empty traces if no valid data
    }

    if (showComponents) {
      // Component area charts - First trace fills to zero, others stack on top
      traces.push({
        x: validData.map(d => d.date || ''),
        y: validData.map(d => Number(d.capital_cost) || 0),
        stackgroup: 'one',
        name: 'Capital Cost',
        fill: 'tozeroy',
        fillcolor: `${colors.capital}33`,
        line: { color: colors.capital, width: 1 },
        mode: 'lines',
        hovertemplate: '<b>Capital Cost</b><br>Date: %{x}<br>Amount: $%{y:,.0f}<extra></extra>'
      });

      traces.push({
        x: validData.map(d => d.date || ''),
        y: validData.map(d => Number(d.storage_cost) || 0),
        stackgroup: 'one',
        name: 'Storage Cost',
        fill: 'tonexty',
        fillcolor: `${colors.storage}33`,
        line: { color: colors.storage, width: 1 },
        mode: 'lines',
        hovertemplate: '<b>Storage Cost</b><br>Date: %{x}<br>Amount: $%{y:,.0f}<extra></extra>'
      });

      traces.push({
        x: validData.map(d => d.date || ''),
        y: validData.map(d => Number(d.risk_cost) || 0),
        stackgroup: 'one',
        name: 'Risk Cost',
        fill: 'tonexty',
        fillcolor: `${colors.risk}33`,
        line: { color: colors.risk, width: 1 },
        mode: 'lines',
        hovertemplate: '<b>Risk Cost</b><br>Date: %{x}<br>Amount: $%{y:,.0f}<extra></extra>'
      });

      traces.push({
        x: validData.map(d => d.date || ''),
        y: validData.map(d => Number(d.opportunity_cost) || 0),
        stackgroup: 'one',
        name: 'Opportunity Cost',
        fill: 'tonexty',
        fillcolor: `${colors.opportunity}33`,
        line: { color: colors.opportunity, width: 1 },
        mode: 'lines',
        hovertemplate: '<b>Opportunity Cost</b><br>Date: %{x}<br>Amount: $%{y:,.0f}<extra></extra>'
      });
    }

    if (viewType === 'absolute' || viewType === 'both') {
      traces.push({
        x: validData.map(d => d.date || ''),
        y: validData.map(d => Number(d.total_cost) || 0),
        name: 'Total Holding Cost',
        line: { color: colors.primary, width: 3 },
        mode: 'lines',
        yaxis: 'y',
        hovertemplate: '<b>Total Cost</b><br>Date: %{x}<br>Amount: $%{y:,.0f}<extra></extra>'
      });
    }

    if (viewType === 'percentage' || viewType === 'both') {
      traces.push({
        x: validData.map(d => d.date || ''),
        y: validData.map(d => (Number(d.cost_percentage) || 0) * 100),
        name: 'Cost Percentage',
        line: { color: colors.secondary, width: 3, dash: 'dash' },
        mode: 'lines',
        yaxis: viewType === 'both' ? 'y2' : 'y',
        hovertemplate: '<b>Cost Percentage</b><br>Date: %{x}<br>Percentage: %{y:.1f}%<extra></extra>'
      });
    }

    return traces;
  }, [data, viewType, showComponents, colors]);

  const layout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: colors.text, family: 'Inter, sans-serif' },
    margin: { l: 60, r: 240, t: 40, b: 60 },
    xaxis: {
      gridcolor: `${colors.grid}33`,
      showgrid: true,
      zeroline: false,
      color: colors.text,
      title: { text: 'Date' }
    },
    yaxis: {
      gridcolor: `${colors.grid}33`,
      showgrid: true,
      zeroline: false,
      color: colors.text,
      title: { text: viewType === 'percentage' ? 'Cost Percentage (%)' : 'Holding Cost ($)' },
      tickformat: viewType === 'percentage' ? '.1f' : ',.0f'
    },
    yaxis2: viewType === 'both' ? {
      overlaying: 'y' as any,
      side: 'right' as any,
      color: colors.text,
      title: { text: 'Cost Percentage (%)' },
      tickformat: '.1f'
    } : undefined,
    legend: {
      x: 1.25,
      y: 0.5,
      xanchor: 'left',
      yanchor: 'middle',
      bgcolor: 'transparent',
      font: { color: colors.text }
    },
    hoverlabel: {
      bgcolor: colors.background,
      bordercolor: colors.grid,
      font: { color: colors.text, family: 'Inter, sans-serif' }
    },
    hovermode: 'x unified' as any
  };

  const handleViewTypeChange = (newViewType: 'absolute' | 'percentage' | 'both') => {
    setViewType(newViewType);
    onViewTypeChange?.(newViewType);
  };

  const renderControls = () => (
    <div style={{
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      marginBottom: '16px',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {(['absolute', 'percentage', 'both'] as const).map((type) => (
          <button
            key={type}
            onClick={() => handleViewTypeChange(type)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: viewType === type ? colors.primary : 'transparent',
              color: viewType === type ? '#0a1224' : colors.text,
              border: `1px solid ${viewType === type ? colors.primary : colors.grid}`
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        color: colors.text,
        cursor: 'pointer'
      }}>
        <input
          type="checkbox"
          checked={showComponents}
          onChange={(e) => setShowComponents(e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
        Show Components
      </label>
    </div>
  );

  if (isLoading) {
    return <Card title="Cost Trend Analysis" isLoading={true} />;
  }

  if (!data || data.length === 0) {
    return (
      <Card title="Cost Trend Analysis">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: `${height - 100}px`,
          color: colors.text,
          opacity: 0.7
        }}>
          No trend data available
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Cost Trend Analysis" 
      subtitle={`${data.length} data points`}
    >
      {renderControls()}
      
      <div style={{ width: '100%' }}>
        <Plot
          data={chartData}
          layout={{
            ...layout,
            width: width - 48,
            height: height - 160
          }}
          config={{
            displayModeBar: false,
            responsive: true,
            staticPlot: false
          }}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </Card>
  );
};

export default CostTrendAnalyzer; 