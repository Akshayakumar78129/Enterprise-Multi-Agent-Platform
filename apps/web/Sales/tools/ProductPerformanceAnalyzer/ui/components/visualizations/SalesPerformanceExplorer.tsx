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

interface SalesPerformanceExplorerProps {
  data?: Product[];
  loading: boolean;
  style?: React.CSSProperties;
}

export const SalesPerformanceExplorer: React.FC<SalesPerformanceExplorerProps> = ({
  data = [],
  loading,
  style,
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'trend' | 'distribution'>('trend');
  const [metric, setMetric] = useState<'sales' | 'units'>('sales');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const processData = () => {
    if (loading || !data || !data.length) return { x: [], y: [], raw: [] };

    // Sort data by date if available
    const sortedData = [...data].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });

    if (viewMode === 'trend') {
      // For trend view, we need time-based data
      const timeData = sortedData.reduce((acc, product) => {
        if (!product.date) return acc; // Skip products without dates
        
        const date = new Date(product.date);
        let timeKey: string;
        
        switch (timeframe) {
          case 'daily':
            timeKey = date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
            break;
          case 'weekly':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            timeKey = weekStart.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
            break;
          case 'monthly':
            timeKey = date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short'
            });
            break;
          default:
            timeKey = date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
        }

        if (!acc[timeKey]) {
          acc[timeKey] = {
            sales: 0,
            units: 0,
            count: 0
          };
        }
        acc[timeKey].sales += product.sales_amount || 0;
        acc[timeKey].units += product.quantity || 0;
        acc[timeKey].count += 1;
        return acc;
      }, {} as Record<string, { sales: number; units: number; count: number }>);

      // If no time data, return empty arrays
      if (Object.keys(timeData).length === 0) {
        return { x: [], y: [], raw: [] };
      }

      // Sort time keys chronologically
      const timeKeys = Object.keys(timeData).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
      });

      // Calculate moving average for smoother trend
      const windowSize = Math.max(1, Math.floor(timeKeys.length / 10));
      const smoothedData = timeKeys.map((key, index) => {
        const start = Math.max(0, index - windowSize + 1);
        const window = timeKeys.slice(start, index + 1);
        const sum = window.reduce((acc, k) => acc + timeData[k][metric], 0);
        return sum / window.length;
      });

      return {
        x: timeKeys,
        y: smoothedData,
        raw: timeKeys.map(key => timeData[key][metric])
      };
    } else {
      // For distribution view, group by category
      const groupedData = sortedData.reduce((acc, product) => {
        const category = product.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = {
            sales: 0,
            units: 0,
            count: 0
          };
        }
        acc[category].sales += product.sales_amount || 0;
        acc[category].units += product.quantity || 0;
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { sales: number; units: number; count: number }>);

      // If no category data, return empty arrays
      if (Object.keys(groupedData).length === 0) {
        return { x: [], y: [], raw: [] };
      }

      // Sort categories by the selected metric
      const sortedCategories = Object.keys(groupedData).sort((a, b) => 
        groupedData[b][metric] - groupedData[a][metric]
      );

      return {
        x: sortedCategories,
        y: sortedCategories.map(category => groupedData[category][metric]),
        raw: sortedCategories.map(category => groupedData[category][metric])
      };
    }
  };

  const { x, y, raw = [] } = processData();

  // Calculate totals safely
  const total = raw?.length ? raw.reduce((a, b) => a + b, 0) : 0;

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
          Sales Performance Explorer
        </div>
        <Grid columns={3} gap={theme.spacing[2]}>
          <GridItem colSpan={1}>
            <Select
              value={viewMode}
              onChange={(value: string) => { if (value === 'trend' || value === 'distribution') setViewMode(value as 'trend' | 'distribution'); }}
              options={[
                { value: 'trend', label: 'Trend Analysis' },
                { value: 'distribution', label: 'Distribution View' },
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
              value={metric}
              onChange={(value: string) => { if (value === 'sales' || value === 'units') setMetric(value as 'sales' | 'units'); }}
              options={[
                { value: 'sales', label: 'Sales Amount' },
                { value: 'units', label: 'Units Sold' },
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
              value={timeframe}
              onChange={(value: string) => { if (value === 'daily' || value === 'weekly' || value === 'monthly') setTimeframe(value as 'daily' | 'weekly' | 'monthly'); }}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
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
        {loading || !data.length ? (
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: theme.colors.cloudWhite,
          }}>
            {loading ? 'Loading...' : 'No data available'}
          </div>
        ) : (
          <Plot
            data={[
              {
                x,
                y,
                type: viewMode === 'trend' ? 'scatter' : 'bar',
                ...(viewMode === 'trend' && { mode: 'lines+markers' }),
                marker: {
                  color: theme.colors.electricCyan,
                  size: viewMode === 'trend' ? 8 : undefined,
                },
                line: viewMode === 'trend' ? {
                  color: theme.colors.electricCyan,
                  width: 2,
                } : undefined,
                name: metric === 'sales' ? 'Sales Amount' : 'Units Sold',
                hovertemplate: viewMode === 'trend' 
                  ? '%{x}<br>%{y:,.0f}' + (metric === 'sales' ? '$' : ' units')
                  : '%{x}<br>%{y:,.0f}' + (metric === 'sales' ? '$' : ' units'),
              },
              ...(viewMode === 'trend' && raw.length > 0 ? [{
                x: x,
                y: raw,
                type: 'scatter',
                mode: 'markers',
                marker: {
                  color: theme.colors.electricCyan,
                  size: 4,
                  opacity: 0.3,
                },
                showlegend: false,
                hoverinfo: 'skip',
              } as any] : []),
            ]}
            layout={{
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: {
                color: theme.colors.cloudWhite,
                size: 12,
              },
              margin: {
                l: 60,
                r: 20,
                t: 20,
                b: viewMode === 'trend' ? 80 : 50,
              },
              xaxis: {
                gridcolor: theme.colors.graphite,
                zerolinecolor: theme.colors.graphite,
                tickangle: viewMode === 'trend' ? -45 : -45,
                title: {
                  text: viewMode === 'trend' ? 'Date' : 'Category',
                  font: { color: theme.colors.cloudWhite }
                },
              },
              yaxis: {
                gridcolor: theme.colors.graphite,
                zerolinecolor: theme.colors.graphite,
                tickformat: metric === 'sales' ? '$,.0f' : ',.0f',
                title: {
                  text: metric === 'sales' ? 'Sales Amount' : 'Units Sold',
                  font: { color: theme.colors.cloudWhite }
                },
              },
              showlegend: false,
              hovermode: 'closest',
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
          {metric === 'sales' ? (
            <>
              Total Sales: {formatCurrency(total)}
            </>
          ) : (
            <>
              Total Units: {new Intl.NumberFormat().format(total)}
            </>
          )}
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

SalesPerformanceExplorer.displayName = 'SalesPerformanceExplorer';

export default SalesPerformanceExplorer; 