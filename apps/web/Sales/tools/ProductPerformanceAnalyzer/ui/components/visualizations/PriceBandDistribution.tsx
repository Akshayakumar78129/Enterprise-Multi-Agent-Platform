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

interface PriceBandDistributionProps {
  // data?: Product[]; // Removed: No longer taking raw Product[]
  loading: boolean;
  bands?: string[]; // Added
  distribution?: Record<string, { count: number; total_sales: number; avg_price: number }>; // Added
  style?: React.CSSProperties;
}

export const PriceBandDistribution: React.FC<PriceBandDistributionProps> = ({
  // data = [], // Removed
  loading,
  bands = [], // Added default
  distribution = {}, // Added default
  style,
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'bar' | 'pie'>('bar');
  const [groupBy, setGroupBy] = useState<'category' | 'subcategory'>('category');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const processData = () => {
    // if (loading || !data || !data.length) return { labels: [], values: [], text: [] }; // Modified
    if (loading || !bands || bands.length === 0 || !distribution || Object.keys(distribution).length === 0) {
      return { labels: [], values: [], text: [] };
    }

    // const priceBands = [ // Removed: Using bands prop
    //   { min: 0, max: 50, label: '$0-50' },
    //   { min: 50, max: 100, label: '$50-100' },
    //   { min: 100, max: 200, label: '$100-200' },
    //   { min: 200, max: 500, label: '$200-500' },
    //   { min: 500, max: Infinity, label: '$500+' },
    // ];

    // const bandData = priceBands.map(band => { // Modified: Directly use distribution prop
    //   const productsInBand = data.filter(p => 
    //     (p.avg_price || 0) >= band.min && (p.avg_price || 0) < band.max
    //   );

    //   const totalSales = productsInBand.reduce((sum, p) => sum + p.sales_amount, 0);
    //   const totalUnits = productsInBand.reduce((sum, p) => sum + p.quantity, 0);
    //   const avgPrice = totalSales / totalUnits || 0;

    //   return {
    //     label: band.label,
    //     count: productsInBand.length,
    //     sales: totalSales,
    //     units: totalUnits,
    //     avgPrice,
    //   };
    // });

    // Filter bands to include only those with counts > 0
    const filteredLabels: string[] = [];
    const filteredValues: number[] = [];
    const filteredText: string[] = [];

    bands.forEach(bandLabel => {
      const bandInfo = distribution[bandLabel];
      if (bandInfo && bandInfo.count > 0) {
        filteredLabels.push(bandLabel);
        filteredValues.push(bandInfo.count);
        filteredText.push(`Count: ${bandInfo.count}<br>Sales: ${formatCurrency(bandInfo.total_sales)}<br>Avg Band Price: ${formatCurrency(bandInfo.avg_price)}`);
      }
    });
    
    // Log data being sent to Plotly
    console.log('[PriceBandDistribution DEBUG] Data for Plotly:', {
      labels: filteredLabels, // Use filtered data
      values: filteredValues, // Use filtered data
      text: filteredText,     // Use filtered data
      viewMode
    });

    return {
      labels: filteredLabels,
      values: filteredValues,
      text: filteredText,
    };
  };

  const { labels, values, text } = processData();

  return (
    <Card
      elevation="sm"
      style={{
        background: theme.colors.midnight,
        border: `1px solid ${theme.colors.graphite}`,
        borderRadius: '12px',
        padding: theme.spacing[4],
      }}
    >
      <div>
        <div style={{ marginBottom: theme.spacing[4] }}>
          <div style={{ 
            color: theme.colors.cloudWhite,
            fontSize: '20px',
            fontWeight: 600,
            marginBottom: theme.spacing[2],
          }}>
            Price Band Distribution
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing[2] }}>
            <Select
              value={viewMode}
              onChange={() => { /* TODO: Revisit Select onChange logic; current type expects no args */ }}
              options={[
                { value: 'bar', label: 'Bar Chart' },
                { value: 'pie', label: 'Pie Chart' },
              ]}
              style={{
                background: theme.colors.midnight,
                border: `1px solid ${theme.colors.graphite}`,
                color: theme.colors.cloudWhite,
                width: '100%',
              }}
            />
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
          </div>
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
                viewMode === 'bar' ? {
                  x: labels,
                  y: values,
                  text,
                  type: 'bar',
                  marker: {
                    color: values.map((_, i) => [
                      theme.colors.electricCyan,
                      '#43cad0',
                      theme.colors.signalMagenta,
                      '#ff6b6b',
                      '#ffd93d',
                      '#9b59b6'
                    ][i % 6]),
                  },
                  hoverinfo: 'text',
                } : {
                  labels,
                  values,
                  text,
                  type: 'pie',
                  marker: {
                    colors: [
                      theme.colors.electricCyan,
                      '#43cad0',
                      theme.colors.signalMagenta,
                      '#ff6b6b',
                      '#ffd93d',
                    ],
                  },
                  textinfo: 'label+percent',
                  hoverinfo: 'text',
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
                  t: 40,
                  b: 50,
                },
                showlegend: viewMode === 'pie',
                legend: {
                  font: {
                    color: theme.colors.cloudWhite,
                  },
                },
                xaxis: {
                  title: { text: 'Price Band' },
                  gridcolor: theme.colors.graphite,
                  zerolinecolor: theme.colors.graphite,
                  automargin: true,
                },
                yaxis: {
                  title: { text: 'Number of Products' },
                  gridcolor: theme.colors.graphite,
                  zerolinecolor: theme.colors.graphite,
                  automargin: true,
                },
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
            {/* Total Products: {data.length} // Removed: data prop is gone, consider what to show here if anything */}
            { !loading && bands.length > 0 && `Displaying ${bands.length} Price Bands` }
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
      </div>
    </Card>
  );
};

PriceBandDistribution.displayName = 'PriceBandDistribution';

export default PriceBandDistribution; 