import React, { FC, useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Button } from '../../../../../../ui-common/design-system/components/Button';
import { SalesData } from '../../types';
import { fetchAggregatedSalesDataAPI } from '../../api';

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  if (typeof hex !== 'string' || !hex.startsWith('#') || (hex.length !== 4 && hex.length !== 7)) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  try {
    let r_str = '00', g_str = '00', b_str = '00';
    if (hex.length === 4) { 
      r_str = hex[1] + hex[1]; g_str = hex[2] + hex[2]; b_str = hex[3] + hex[3];
    } else { 
      r_str = hex.slice(1, 3); g_str = hex.slice(3, 5); b_str = hex.slice(5, 7);
    }
    const r = parseInt(r_str, 16);
    const g = parseInt(g_str, 16);
    const b = parseInt(b_str, 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (error) {
    return `rgba(0, 0, 0, ${alpha})`; 
  }
};

interface ComparativePerformanceGridProps {
  data?: SalesData[];
  loading: boolean;
  selectedDimension: string | null;
  selectedMetric: string | null;
  dateRange?: { startDate: string; endDate: string };
}

interface GridData {
  entity: string;
  revenue: number;
  units: number;
  aov: number;
  growth: number;
  margin: number;
  [key: string]: string | number;
}

export const ComparativePerformanceGrid: FC<ComparativePerformanceGridProps> = ({
  data,
  loading,
  selectedDimension,
  selectedMetric,
  dateRange
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'grid' | 'heatmap'>('grid');
  const [sortColumn, setSortColumn] = useState<string>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [displayFormat, setDisplayFormat] = useState<'absolute' | 'relative'>('absolute');
  
  // State for aggregated data
  const [aggregatedData, setAggregatedData] = useState<SalesData[]>([]);
  const [aggregatedLoading, setAggregatedLoading] = useState(false);

  // Fetch aggregated data when filters change
  useEffect(() => {
    const fetchAggregatedData = async () => {
      if (!selectedDimension || !selectedMetric || !dateRange) return;
      
      setAggregatedLoading(true);
      try {
        const result = await fetchAggregatedSalesDataAPI({
          dateRange,
          dimension: selectedDimension,
          metric: selectedMetric,
        });
        
        if (result.status === 'success' && result.results?.chartData) {
          setAggregatedData(result.results.chartData);
        } else {
          console.error('Failed to fetch aggregated data:', result.message);
          setAggregatedData([]);
        }
      } catch (error) {
        console.error('Error fetching aggregated data:', error);
        setAggregatedData([]);
      } finally {
        setAggregatedLoading(false);
      }
    };

    fetchAggregatedData();
  }, [selectedDimension, selectedMetric, dateRange]);

  const metrics = [
    { key: 'revenue', label: 'Revenue', format: 'currency' },
    { key: 'units', label: 'Units', format: 'number' },
    { key: 'aov', label: 'AOV', format: 'currency' },
    { key: 'growth', label: 'Growth', format: 'percentage' },
    { key: 'margin', label: 'Margin', format: 'percentage' }
  ];

  const processedData = useMemo(() => {
    const dataToUse = aggregatedData.length > 0 ? aggregatedData : data || [];
    if (dataToUse.length === 0) return [];

    // Aggregate data by dimension to handle any duplicates (similar to PerformanceOverview)
    const aggregated = dataToUse.reduce((acc, item) => {
      const key = item.dimension;
      if (!acc[key]) {
        acc[key] = {
          entity: key,
          revenue: 0,
          units: 0,
          aov: 0,
          growth: 0,
          margin: 0,
          totalOrders: 0
        };
      }
      
      acc[key].revenue += item.revenue || 0;
      acc[key].units += item.units_sold || 0;
      acc[key].totalOrders += item.order_count || 0;
      acc[key].margin += (item.margin || 0) * (item.revenue || 0); // Weight margin by revenue
      
      return acc;
    }, {} as Record<string, GridData & { totalOrders: number }>);

    // Calculate final metrics
    const gridData = Object.values(aggregated).map(item => ({
      entity: item.entity,
      revenue: item.revenue,
      units: item.units,
      aov: item.totalOrders > 0 ? item.revenue / item.totalOrders : 0,
      growth: 0, // Growth calculation requires historical data
      margin: item.revenue > 0 ? item.margin / item.revenue : 0
    }));

    // Sort data
    return gridData.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * multiplier;
    });
  }, [aggregatedData, data, sortColumn, sortDirection]);

  const getPerformanceColor = (value: number, metric: string, allValues: number[]) => {
    if (allValues.length === 0) return theme.colors.midnight;
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    
    if (range === 0) return theme.colors.midnight;
    
    const normalized = (value - min) / range;
    
    // Create gradient from midnight to electric cyan to signal magenta
    if (normalized < 0.5) {
      const ratio = normalized * 2;
      return `rgb(${Math.floor(10 + ratio * (0 - 10))}, ${Math.floor(18 + ratio * (224 - 18))}, ${Math.floor(36 + ratio * (255 - 36))})`;
    } else {
      const ratio = (normalized - 0.5) * 2;
      return `rgb(${Math.floor(0 + ratio * (233 - 0))}, ${Math.floor(224 + ratio * (48 - 224))}, ${Math.floor(255 + ratio * (255 - 255))})`;
    }
  };

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const renderGrid = () => {
    const isLoading = loading || aggregatedLoading;
    
    if (isLoading) {
      return (
        <div style={{ 
          color: theme.colors.cloudWhite, 
          textAlign: 'center', 
          padding: theme.spacing[4], 
          height: '400px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          Loading Performance Grid...
        </div>
      );
    }

    if (processedData.length === 0) {
      return (
        <div style={{ 
          color: theme.colors.cloudWhite, 
          textAlign: 'center', 
          padding: theme.spacing[4], 
          height: '400px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          No data available for comparison.
        </div>
      );
    }

    return (
      <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: theme.colors.graphiteDark }}>
              <th 
                style={{ 
                  padding: theme.spacing[2], 
                  textAlign: 'left', 
                  color: theme.colors.cloudWhite,
                  borderBottom: `1px solid ${theme.colors.graphite}`,
                  cursor: 'pointer',
                  minWidth: '120px'
                }}
                onClick={() => handleSort('entity')}
              >
                {selectedDimension || 'Entity'} 
                {sortColumn === 'entity' && (
                  <span style={{ marginLeft: theme.spacing[1] }}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              {metrics.map(metric => (
                <th 
                  key={metric.key}
                  style={{ 
                    padding: theme.spacing[2], 
                    textAlign: 'center', 
                    color: theme.colors.cloudWhite,
                    borderBottom: `1px solid ${theme.colors.graphite}`,
                    cursor: 'pointer',
                    minWidth: '110px'
                  }}
                  onClick={() => handleSort(metric.key)}
                >
                  {metric.label}
                  {sortColumn === metric.key && (
                    <span style={{ marginLeft: theme.spacing[1] }}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, index) => (
              <tr key={row.entity} style={{ 
                background: index % 2 === 0 ? theme.colors.midnight : hexToRgba(theme.colors.graphite, 0.3)
              }}>
                <td style={{ 
                  padding: theme.spacing[2], 
                  color: theme.colors.cloudWhite,
                  borderBottom: `1px solid ${theme.colors.graphite}`,
                  fontWeight: 500
                }}>
                  {row.entity}
                </td>
                {metrics.map(metric => {
                  const value = row[metric.key] as number;
                  const allValues = processedData.map(d => d[metric.key] as number);
                  const bgColor = viewMode === 'heatmap' ? getPerformanceColor(value, metric.key, allValues) : 'transparent';
                  
                  return (
                    <td 
                      key={metric.key}
                      style={{ 
                        padding: theme.spacing[2], 
                        textAlign: 'center', 
                        color: theme.colors.cloudWhite,
                        borderBottom: `1px solid ${theme.colors.graphite}`,
                        background: bgColor,
                        position: 'relative'
                      }}
                    >
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        {formatValue(value, metric.format)}
                      </div>
                      {/* Mini sparkline placeholder */}
                      <div style={{ 
                        height: '2px', 
                        background: theme.colors.electricCyan, 
                        width: `${Math.min(100, (value / Math.max(...allValues)) * 100)}%`,
                        marginTop: '2px',
                        opacity: 0.6
                      }} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Card 
      elevation="md" 
      style={{
        padding: theme.spacing[3],
        background: theme.colors.midnight,
        height: '100%'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: theme.spacing[3],
        flexWrap: 'wrap',
        gap: theme.spacing[2]
      }}>
        <h3 style={{ color: theme.colors.cloudWhite, margin: 0 }}>
          Comparative Performance Grid
        </h3>
        
        <div style={{ display: 'flex', gap: theme.spacing[2], alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: theme.spacing[1] }}>
            <Button 
              size="sm" 
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'heatmap' ? 'primary' : 'outline'}
              onClick={() => setViewMode('heatmap')}
            >
              Heatmap
            </Button>
          </div>
          
          <div style={{ display: 'flex', gap: theme.spacing[1] }}>
            <Button 
              size="sm" 
              variant={displayFormat === 'absolute' ? 'primary' : 'outline'}
              onClick={() => setDisplayFormat('absolute')}
            >
              Absolute
            </Button>
            <Button 
              size="sm" 
              variant={displayFormat === 'relative' ? 'primary' : 'outline'}
              onClick={() => setDisplayFormat('relative')}
            >
              Relative
            </Button>
          </div>
        </div>
      </div>

      {renderGrid()}

      {/* Summary statistics */}
      {processedData.length > 0 && (
        <div style={{ 
          marginTop: theme.spacing[3], 
          padding: theme.spacing[2], 
          background: theme.colors.graphiteDark, 
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: theme.spacing[2]
        }}>
          <div style={{ textAlign: 'center', color: theme.colors.cloudWhite }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Total Entities</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>{processedData.length}</div>
          </div>
          <div style={{ textAlign: 'center', color: theme.colors.cloudWhite }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Avg Revenue</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>
              ${(processedData.reduce((sum, item) => sum + item.revenue, 0) / processedData.length).toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'center', color: theme.colors.cloudWhite }}>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Top Performer</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>
              {processedData[0]?.entity || 'N/A'}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}; 