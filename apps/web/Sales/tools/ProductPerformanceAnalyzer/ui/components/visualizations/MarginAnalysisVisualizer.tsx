import React, { useState } from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Product } from '../../types';
import dynamic from 'next/dynamic';
import { Grid, GridItem } from '../../../../../../ui-common/design-system/components/Grid';
import { Button } from '../../../../../../ui-common/design-system/components/Button';
import { Select } from '../../../../../../ui-common/design-system/components/Select';

// Import Plotly dynamically with SSR disabled
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});

interface MarginAnalysisVisualizerProps {
  data?: Product[];
  loading: boolean;
  kpiAverageMargin?: number;
  style?: React.CSSProperties;
}

export const MarginAnalysisVisualizer: React.FC<MarginAnalysisVisualizerProps> = ({
  data = [],
  loading,
  kpiAverageMargin = 0,
  style,
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'scatter' | 'heatmap'>('scatter');
  const [groupBy, setGroupBy] = useState<'category' | 'subcategory'>('category');

  // Log received props
  console.log('[MarginAnalysisVisualizer DEBUG] Received props:', { data, loading, kpiAverageMargin, style });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const processData = () => {
    if (loading || !data || !data.length) return { x: [], y: [], text: [], color: [], markerSizes: [] };

    const filteredData = data.filter(p => p.margin_pct !== undefined && p.avg_price !== undefined);
    
    if (viewMode === 'scatter') {
      return {
        x: filteredData.map(p => p.avg_price || 0),
        y: filteredData.map(p => p.margin_pct || 0),
        text: filteredData.map(p => p.product_name),
        color: filteredData.map(p => p[groupBy] || 'Other'),
        markerSizes: filteredData.map(p => Math.max(5, Math.min(25, (p.sales_amount || 0) / 1000))),
      };
    } else {
      // Heatmap data processing
      const priceRanges = [
        { min: 0, max: 50, label: '$0-50' },
        { min: 50, max: 100, label: '$50-100' },
        { min: 100, max: 200, label: '$100-200' },
        { min: 200, max: 500, label: '$200-500' },
        { min: 500, max: Infinity, label: '$500+' },
      ];

      const marginRanges = [
        { min: 0, max: 10, label: '0-10%' },
        { min: 10, max: 20, label: '10-20%' },
        { min: 20, max: 30, label: '20-30%' },
        { min: 30, max: 40, label: '30-40%' },
        { min: 40, max: Infinity, label: '40%+' },
      ];

      const heatmapData = Array(priceRanges.length).fill(0).map(() => Array(marginRanges.length).fill(0));
      const categories = new Set(filteredData.map(p => p[groupBy] || 'Other'));

      filteredData.forEach(product => {
        const priceRange = priceRanges.findIndex(range => 
          (product.avg_price || 0) >= range.min && (product.avg_price || 0) < range.max
        );
        const marginRange = marginRanges.findIndex(range => 
          (product.margin_pct || 0) >= range.min && (product.margin_pct || 0) < range.max
        );
        if (priceRange !== -1 && marginRange !== -1) {
          heatmapData[priceRange][marginRange]++;
        }
      });

      return {
        z: heatmapData,
        x: marginRanges.map(r => r.label),
        y: priceRanges.map(r => r.label),
        type: 'heatmap',
      };
    }
  };

  const { x, y, text, color, z, markerSizes } = processData();

  return (
    <Card
      elevation="sm"
      style={{
        background: theme.colors.midnight,
        border: `1px solid ${theme.colors.graphite}`,
        borderRadius: '12px',
        padding: theme.spacing[4],
        ...style,
      }}
    >
      <div style={{ marginBottom: theme.spacing[4] }}>
        <div style={{ 
          color: theme.colors.cloudWhite,
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: theme.spacing[2],
        }}>
          Margin Analysis Visualizer
        </div>
        <Grid columns={2} gap={theme.spacing[2]}>
          <GridItem colSpan={1}>
            <Select
              value={viewMode}
              onChange={() => { /* TODO: Revisit Select onChange logic; current type expects no args */ }}
              options={[
                { value: 'scatter', label: 'Scatter Plot' },
                { value: 'heatmap', label: 'Heatmap' },
              ]}
              style={{
                background: theme.colors.midnight,
                border: `1px solid ${theme.colors.graphite}`,
                color: theme.colors.cloudWhite,
                width: '100%',
              }}
            />
          </GridItem>
          <GridItem colSpan={1}>
            <Select
              value={groupBy}
              onChange={() => { /* TODO: Revisit Select onChange logic; current type expects no args */ }}
              options={[
                { value: 'category', label: 'Group by Category' },
                { value: 'subcategory', label: 'Group by Subcategory' },
              ]}
              style={{
                background: theme.colors.midnight,
                border: `1px solid ${theme.colors.graphite}`,
                color: theme.colors.cloudWhite,
                width: '100%',
              }}
            />
          </GridItem>
        </Grid>
      </div>

      <div style={{ height: '400px' }}>
        {loading ? (
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: theme.colors.cloudWhite,
          }}>
            Loading...
          </div>
        ) : (
          <Plot
            data={[
              viewMode === 'scatter' ? {
                x,
                y,
                text,
                mode: 'markers',
                type: 'scatter',
                marker: {
                  color,
                  size: markerSizes,
                  opacity: 0.7,
                },
                hoverinfo: 'x+y+text',
              } : {
                z,
                x,
                y,
                type: 'heatmap',
                colorscale: [
                  [0, theme.colors.midnight],
                  [0.5, theme.colors.electricCyan],
                  [1, theme.colors.signalMagenta]
                ],
              }
            ]}
            layout={{
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: {
                color: theme.colors.cloudWhite,
              },
              margin: {
                l: 50,
                r: 20,
                t: 20,
                b: 50,
              },
              xaxis: {
                title: { text: viewMode === 'scatter' ? 'Average Price ($)' : 'Margin Range' },
                gridcolor: theme.colors.graphite,
                zerolinecolor: theme.colors.graphite,
              },
              yaxis: {
                title: { text: viewMode === 'scatter' ? 'Margin (%)' : 'Price Range' },
                gridcolor: theme.colors.graphite,
                zerolinecolor: theme.colors.graphite,
              },
              showlegend: viewMode === 'scatter',
            }}
            config={{
              responsive: true,
              displayModeBar: false,
            }}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        )}
      </div>

      <div style={{ 
        marginTop: theme.spacing[4],
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ color: theme.colors.cloudWhite }}>
          Average Margin: {formatPercentage(kpiAverageMargin)}
        </div>
        <Button
          onClick={() => {
            // Export functionality
          }}
          style={{
            background: theme.colors.electricCyan,
            color: theme.colors.midnight,
            border: 'none',
            padding: `${theme.spacing[2]}px ${theme.spacing[4]}px`,
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Export Data
        </Button>
      </div>
    </Card>
  );
};

MarginAnalysisVisualizer.displayName = 'MarginAnalysisVisualizer';

export default MarginAnalysisVisualizer; 