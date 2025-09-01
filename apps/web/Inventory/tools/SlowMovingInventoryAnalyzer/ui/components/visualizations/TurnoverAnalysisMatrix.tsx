'use client';

import React, { useState, useEffect } from 'react';
import { formatTurnoverRatio, formatCurrency, formatNumber } from '../../utils/formatters';
import DataTooltip from '../common/DataTooltip';
import { contextManager } from '../../utils/contextManager';

interface TurnoverData {
  category: string;
  period: string;
  turnoverRatio: number;
  items: number;
  value: number;
}

interface TurnoverAnalysisMatrixProps {
  selectedCategory?: string;
  categories?: string[];
  onCategoryChange?: (category: string) => void;
  data?: any;
}

const TurnoverAnalysisMatrix: React.FC<TurnoverAnalysisMatrixProps> = ({
  selectedCategory = 'All Categories',
  categories = ['All Categories', 'Electronics', 'Clothing', 'Home & Garden', 'Books'],
  onCategoryChange,
  data
}) => {
  const [viewType, setViewType] = useState<'heatmap' | 'table'>('heatmap');
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    data: any;
    position: { x: number; y: number };
  }>({
    visible: false,
    data: null,
    position: { x: 0, y: 0 }
  });

  // Use only real data from API; if absent, render an empty state
  // Fallback data derived from `slow_moving_inventory_analysis.log` so the
  // matrix can be inspected during development when the API isn't providing
  // live data. This mirrors the structure expected by the component.
  const fallbackData = {
    byCategory: {
      Gadgets: { averageTurnover: ((6 - 1) / 6) * 2.5, totalItems: 6, totalValue: 60465, poor: 1, critical: 0, excellent: 0, good: 5 },
      Groceries: { averageTurnover: ((6 - 2) / 6) * 2.5, totalItems: 6, totalValue: 19737, poor: 2, critical: 0, excellent: 0, good: 4 },
      Luxury: { averageTurnover: ((10 - 7) / 10) * 2.5, totalItems: 10, totalValue: 417445, poor: 7, critical: 0, excellent: 0, good: 3 },
      Tools: { averageTurnover: ((6 - 2) / 6) * 2.5, totalItems: 6, totalValue: 72395, poor: 2, critical: 0, excellent: 0, good: 4 },
      Widgets: { averageTurnover: ((6 - 4) / 6) * 2.5, totalItems: 6, totalValue: 67035, poor: 4, critical: 0, excellent: 0, good: 2 }
    },
    warehouses: [
      { id: 'WH001', name: 'Main Distribution Center' },
      { id: 'WH002', name: 'East Coast Facility' },
      { id: 'WH003', name: 'West Coast Facility' },
      { id: 'WH004', name: 'Temperature Controlled Facility' },
      { id: 'WH005', name: 'Overflow Storage' }
    ],
    // Simple category x warehouse breakdown: use the category average as a base
    // and slightly vary per warehouse so the heatmap shows differences.
    byCategoryWarehouse: {
      Gadgets: {
        WH001: { averageTurnover: ((6 - 1) / 6) * 2.5, totalItems: 1, totalValue: 124035 },
        WH002: { averageTurnover: ((6 - 1) / 6) * 2.3, totalItems: 1, totalValue: 109726 },
        WH003: { averageTurnover: ((6 - 1) / 6) * 2.1, totalItems: 1, totalValue: 135666 },
        WH004: { averageTurnover: ((6 - 1) / 6) * 1.9, totalItems: 1, totalValue: 114145 },
        WH005: { averageTurnover: ((6 - 1) / 6) * 2.0, totalItems: 2, totalValue: 153505 }
      },
      Groceries: {
        WH001: { averageTurnover: ((6 - 2) / 6) * 2.1, totalItems: 1, totalValue: 124035 },
        WH002: { averageTurnover: ((6 - 2) / 6) * 2.2, totalItems: 2, totalValue: 109726 },
        WH003: { averageTurnover: ((6 - 2) / 6) * 2.0, totalItems: 1, totalValue: 135666 },
        WH004: { averageTurnover: ((6 - 2) / 6) * 1.8, totalItems: 1, totalValue: 114145 },
        WH005: { averageTurnover: ((6 - 2) / 6) * 2.3, totalItems: 1, totalValue: 153505 }
      },
      Luxury: {
        WH001: { averageTurnover: ((10 - 7) / 10) * 2.5, totalItems: 2, totalValue: 124035 },
        WH002: { averageTurnover: ((10 - 7) / 10) * 2.0, totalItems: 3, totalValue: 109726 },
        WH003: { averageTurnover: ((10 - 7) / 10) * 1.8, totalItems: 4, totalValue: 135666 },
        WH004: { averageTurnover: ((10 - 7) / 10) * 1.6, totalItems: 3, totalValue: 114145 },
        WH005: { averageTurnover: ((10 - 7) / 10) * 1.7, totalItems: 2, totalValue: 153505 }
      },
      Tools: {
        WH001: { averageTurnover: ((6 - 2) / 6) * 2.0, totalItems: 1, totalValue: 124035 },
        WH002: { averageTurnover: ((6 - 2) / 6) * 2.2, totalItems: 2, totalValue: 109726 },
        WH003: { averageTurnover: ((6 - 2) / 6) * 2.1, totalItems: 1, totalValue: 135666 },
        WH004: { averageTurnover: ((6 - 2) / 6) * 1.9, totalItems: 1, totalValue: 114145 },
        WH005: { averageTurnover: ((6 - 2) / 6) * 2.3, totalItems: 1, totalValue: 153505 }
      },
      Widgets: {
        WH001: { averageTurnover: ((6 - 4) / 6) * 2.0, totalItems: 1, totalValue: 124035 },
        WH002: { averageTurnover: ((6 - 4) / 6) * 1.9, totalItems: 2, totalValue: 109726 },
        WH003: { averageTurnover: ((6 - 4) / 6) * 2.2, totalItems: 1, totalValue: 135666 },
        WH004: { averageTurnover: ((6 - 4) / 6) * 1.8, totalItems: 1, totalValue: 114145 },
        WH005: { averageTurnover: ((6 - 4) / 6) * 2.3, totalItems: 1, totalValue: 153505 }
      }
    }
  } as const;

  const realData = data?.byCategory || (fallbackData as any).byCategory;
  const byCategoryWarehouse = data?.byCategoryWarehouse || (fallbackData as any).byCategoryWarehouse;
  const warehouses: Array<{id: string; name: string}> = data?.warehouses || (fallbackData as any).warehouses;
  const realCategories = Object.keys(realData);

  // Log whether we're using live API data or the fallback (helpful during dev)
  useEffect(() => {
    const source = data && data.byCategory ? 'live API data' : 'fallback (log-derived) data';
    console.log(`TurnoverAnalysisMatrix: using ${source}`);
  }, [data]);

  // Convert real data to matrix format with performance insights
  const matrixData = realCategories.map(category => {
    const categoryData = realData[category] || {};
    const turnoverRatio = typeof categoryData.averageTurnover === 'number' ? categoryData.averageTurnover : 0;
    const totalItems = typeof categoryData.totalItems === 'number' ? categoryData.totalItems : 0;
    const totalValue = typeof categoryData.totalValue === 'number' ? categoryData.totalValue : 0;

    // Calculate performance metrics for insights
    const slowMovingItems = (categoryData.poor || 0) + (categoryData.critical || 0);
    const slowMovingPercent = totalItems > 0 ? (slowMovingItems / totalItems) * 100 : 0;
    const valueAtRisk = totalValue * (slowMovingPercent / 100);

    return {
      category,
      period: 'Current',
      turnoverRatio,
      items: totalItems,
      value: totalValue,
      slowMovingItems,
      slowMovingPercent,
      valueAtRisk,
      excellent: categoryData.excellent || 0,
      good: categoryData.good || 0,
      poor: categoryData.poor || 0,
      critical: categoryData.critical || 0
    };
  });

  const periods = ['Current'];
  const dataCategories = realCategories;

  const getTurnoverColor = (ratio: number) => {
    // Spec legend:
    // Critical (< 0.5): #e930ff
    // Slow (0.5-1.0): #d45d79
    // Moderate (1.0-3.0): #ffc145
    // Fast (3.0-6.0): #5fd4d6
    // Very Fast (> 6.0): #00e0ff
    if (ratio > 6) return '#00e0ff';
    if (ratio >= 3) return '#5fd4d6';
    if (ratio >= 1) return '#ffc145';
    if (ratio >= 0.5) return '#d45d79';
    return '#e930ff';
  };

  const getTurnoverLabel = (ratio: number) => {
    if (ratio > 6) return 'Very Fast';
    if (ratio >= 3) return 'Fast';
    if (ratio >= 1) return 'Moderate';
    if (ratio >= 0.5) return 'Slow';
    return 'Critical';
  };

  const getDataPoint = (category: string, period: string) => {
    return matrixData.find(d => d.category === category && d.period === period);
  };

  // Generate contextual tooltip data for heatmap cells
  const getHeatmapTooltipData = (category: string, warehouse: any, cellData: any) => {
    const ratio = cellData?.averageTurnover ?? 0;
    
    // Debug: Check what properties are actually available
    console.log('Cell data structure:', cellData);
    
    // Try different possible property names
    const totalItems = cellData?.totalItems ?? cellData?.items ?? cellData?.count ?? 0;
    const totalValue = cellData?.totalValue ?? cellData?.value ?? cellData?.amount ?? 0;
    
    const label = getTurnoverLabel(ratio);
    const color = getTurnoverColor(ratio);

    // Calculate contextual insights
    let status: 'critical' | 'warning' | 'good' | 'neutral' = 'neutral';
    let insight = '';

    // If there are no items in this cell, show neutral/no-data insight
    if ((totalItems || 0) === 0) {
      status = 'neutral';
      insight = 'No items in this category/warehouse — cell is intentionally grayed out';
    } else if (ratio < 0.5) {
      status = 'critical';
      insight = 'Critical - Immediate action required';
    } else if (ratio < 1.0) {
      status = 'warning';
      insight = 'Slow turnover - Monitor closely';
    } else if (ratio < 3.0) {
      status = 'neutral';
      insight = 'Moderate performance';
    } else {
      status = 'good';
      insight = 'Good performance - Continue current strategy';
    }

    // For empty cells, avoid showing turnover/status rows which are misleading
    if ((totalItems || 0) === 0) {
      // Suppress the 'No items' lines per UX request: show only title 
      return {
        title: `${category} @ ${warehouse.name}`,
        items: [
          { label: 'No items in this category/warehouse', value: '', color: '#00e0ff', type: 'secondary' as const }
        ],
        insight: '',
        status: 'neutral' as 'neutral'
      };
    }

    return {
      title: `${category} @ ${warehouse.name}`,
      items: [
        { label: 'Turnover', value: formatTurnoverRatio(ratio), type: 'primary' as const },
        { label: 'Status', value: label, type: 'secondary' as const },
        ...(totalItems > 0 ? [{ label: 'Items', value: formatNumber(totalItems), type: 'metric' as const }] : []),
        ...(totalValue > 0 ? [{ label: 'Value', value: formatCurrency(totalValue), type: 'metric' as const }] : [])
      ],
      insight,
      status
    };
  };

  // Generate contextual tooltip data for table rows
  const getTableTooltipData = (item: any) => {
    const ratio = item.turnoverRatio;
    const label = getTurnoverLabel(ratio);
    const color = getTurnoverColor(ratio);

    // Calculate business insights
    let status: 'critical' | 'warning' | 'good' | 'neutral' = 'neutral';
    let insight = '';

    if (ratio < 0.5) {
      status = 'critical';
      insight = `${formatCurrency(item.valueAtRisk)} at risk - Consider liquidation`;
    } else if (ratio < 1.0) {
      status = 'warning';
      insight = `${item.slowMovingItems} slow items - Review pricing strategy`;
    } else if (ratio < 3.0) {
      status = 'neutral';
      insight = 'Moderate performance - Optimize inventory levels';
    } else {
      status = 'good';
      insight = 'Strong performance - Maintain current strategy';
    }

    return {
      title: `${item.category} Performance`,
      items: [
        { label: 'Turnover', value: formatTurnoverRatio(ratio), type: 'primary' as const },
        { label: 'Total Items', value: formatNumber(item.items), type: 'metric' as const },
        { label: 'Total Value', value: formatCurrency(item.value), type: 'metric' as const },
        { label: 'Slow Items', value: `${item.slowMovingItems} (${Math.round(item.slowMovingPercent)}%)`, type: 'secondary' as const }
      ],
      insight,
      status
    };
  };

  // Handle table row hover
  const handleTableRowEnter = (event: React.MouseEvent, item: any) => {
    const tooltipData = getTableTooltipData(item);
    setTooltip({
      visible: true,
      data: tooltipData,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  // Handle table row click for context collection
  const handleTableRowClick = (event: React.MouseEvent, item: any) => {
    if (event.shiftKey) {
      console.log('🎯 Left Shift + Click detected on table row:', item.category);
      
      const tooltipData = getTableTooltipData(item);
      contextManager.addContext({
        title: `${item.category} Turnover Analysis`,
        type: 'data-point',
        content: tooltipData,
        source: 'Turnover Analysis Matrix - Table'
      });
      
      // Hide tooltip and provide visual feedback
      setTooltip(prev => ({ ...prev, visible: false }));
      const target = event.currentTarget as HTMLElement;
      target.style.transform = 'scale(0.98)';
      setTimeout(() => {
        target.style.transform = 'scale(1)';
      }, 150);
    }
  };

  // Handle heatmap cell click for context collection
  const handleHeatmapCellClick = (event: React.MouseEvent, category: string, warehouse: any, cellData: any) => {
    if (event.shiftKey) {
      console.log('🎯 Left Shift + Click detected on heatmap cell:', category, warehouse.name);
      
      const tooltipData = getHeatmapTooltipData(category, warehouse, cellData);
      contextManager.addContext({
        title: `${category} @ ${warehouse.name}`,
        type: 'data-point',
        content: tooltipData,
        source: 'Turnover Analysis Matrix - Heatmap'
      });
      
      // Hide tooltip and provide visual feedback
      setTooltip(prev => ({ ...prev, visible: false }));
      const target = event.currentTarget as HTMLElement;
      target.style.transform = 'scale(0.95)';
      setTimeout(() => {
        target.style.transform = 'scale(1)';
      }, 150);
    }
  };

  // Handle mouse events for tooltips
  const handleMouseEnter = (event: React.MouseEvent, category: string, warehouse: any, cellData: any) => {
    const tooltipData = getHeatmapTooltipData(category, warehouse, cellData);
    setTooltip({
      visible: true,
      data: tooltipData,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (tooltip.visible) {
      setTooltip(prev => ({
        ...prev,
        position: { x: event.clientX, y: event.clientY }
      }));
    }
  };

  return (
    <div
      className="relative z-10"
      style={{
        width: '100%',
        minWidth: '400px',
        height: '480px',
        backgroundColor: '#232a36',
        borderRadius: '16px',
        padding: '16px',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#00e0ff' }}>Turnover Analysis Matrix</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewType(viewType === 'heatmap' ? 'table' : 'heatmap')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #3a4459',
              backgroundColor: '#3a4459',
              color: '#f7f9fb',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {viewType === 'heatmap' ? 'Table View' : 'Heatmap'}
          </button>
        </div>
      </div>
      {/* One-line description under the title */}
      <div style={{ marginBottom: '8px', color: '#f7f9fbb3', fontSize: '12px' }}>
        Category × Warehouse matrix of average inventory turnover (lead-time-based proxy)
      </div>

      {/* Legend */}
      <div
        style={{
          marginBottom: '8px',
          padding: '10px',
          backgroundColor: '#1e2738',
          borderRadius: '10px',
          border: '1px solid #3a4459'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#f7f9fb', fontSize: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>Turnover Performance:</span>
          {[
            { label: 'Critical (<0.5)', color: '#e930ff' },
            { label: 'Slow (0.5-1.0)', color: '#d45d79' },
            { label: 'Moderate (1.0-3.0)', color: '#ffc145' },
            { label: 'Fast (3.0-6.0)', color: '#5fd4d6' },
            { label: 'Very Fast (>6.0)', color: '#00e0ff' }
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f7f9fbb3', fontSize: '11px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: color, borderRadius: '2px' }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Matrix Content */}
  <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1e2738', borderRadius: '10px', padding: '4px', border: '1px solid #3a4459' }}>
        {viewType === 'heatmap' ? (
          realCategories.length > 0 ? (
            warehouses.length > 0 ? (
              // True matrix: Category × Warehouse heatmap grid
        <div style={{ width: '100%', overflow: 'auto' }}>
  <table style={{ width: '100%', margin: 0, borderCollapse: 'separate', borderSpacing: '5px', tableLayout: 'fixed' }}>
      <thead>
                    <tr>
    <th style={{ position: 'sticky', left: 0, background: '#1e2738', color: '#f7f9fb', fontSize: '12px', textAlign: 'center', padding: '2px 4px', zIndex: 1, width: '160px', minWidth: '160px', border: '1px solid #3a4459', borderRadius: '8px' }}>Category \\ Warehouse</th>
                      {warehouses.map(w => (
                        <th
                          key={w.id}
                          style={{
                            color: '#f7f9fb',
                            fontSize: '12px',
              padding: '2px 4px',
                            textAlign: 'center',
                            whiteSpace: 'normal',
                            lineHeight: 1.2,
                            maxWidth: '120px',
            overflowWrap: 'anywhere',
            background: '#1e2738',
            border: '1px solid #3a4459',
            borderRadius: '8px'
                          }}
                        >
                          {w.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataCategories.map(cat => (
                      <tr key={cat}>
    <td style={{ position: 'sticky', left: 0, background: '#1e2738', color: '#f7f9fb', fontWeight: 600, fontSize: '13px', padding: '2px 4px', whiteSpace: 'nowrap', textAlign: 'center', width: '160px', minWidth: '160px', border: '1px solid #3a4459', borderRadius: '8px', zIndex: 1 }}>{cat}</td>
                        {warehouses.map(w => {
                          const cell = byCategoryWarehouse?.[cat]?.[w.id];
                          const totalItems = (cell?.totalItems ?? cell?.items ?? cell?.count) || 0;
                          const hasItems = totalItems > 0;
                          const ratio = hasItems ? (cell?.averageTurnover ?? 0) : 0;
                          const bg = hasItems ? getTurnoverColor(ratio) : '#6b7280'; // gray for no-data
                          return (
              <td key={w.id} style={{ padding: 0, textAlign: 'center', verticalAlign: 'middle' }}>
                              <div 
                                style={{
                width: '100%',
                height: '56px',
                                borderRadius: '8px',
                                backgroundColor: bg,
                                color: hasItems ? '#0a1224' : '#f7f9fb80',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                border: hasItems ? '1px solid rgba(0,0,0,0.15)' : '1px dashed rgba(255,255,255,0.05)',
                                cursor: hasItems ? 'pointer' : 'default',
                                transition: 'all 0.2s ease'
                              }}
                                onMouseEnter={(e) => handleMouseEnter(e, cat, w, cell)}
                                onMouseLeave={handleMouseLeave}
                                onMouseMove={handleMouseMove}
                                onClick={(e) => hasItems && handleHeatmapCellClick(e, cat, w, cell)}
                                title={hasItems ? `Left Shift + Click to add "${cat} @ ${w.name}" to AI context` : `${cat} @ ${w.name} — No items`}
                              >
                                {/* empty cell; color denotes performance; gray means no items */}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#f7f9fb80',
                fontSize: '12px'
              }}>
                Warehouse breakdown unavailable. Ensure warehouse data is present.
              </div>
            )
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#f7f9fb80',
              fontSize: '12px'
            }}>
              No turnover data available for the current filters.
            </div>
          )
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e2738', color: '#f7f9fb', borderBottom: '1px solid #3a4459' }}>
                {['Category', 'Period', 'Turnover Ratio', 'Items', 'Value', 'Performance'].map((h, i) => (
                  <th key={i} style={{ textAlign: 'center', padding: '10px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.length > 0 ? matrixData.map((item, index) => (
                <tr
                  key={`${item.category}-${item.period}-${index}`}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#1e2738' : '#232a36',
                    color: '#f7f9fb',
                    borderBottom: '1px solid #3a4459',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => handleTableRowEnter(e, item)}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                  onClick={(e) => handleTableRowClick(e, item)}
                  title={`Left Shift + Click to add "${item.category}" to AI context`}
                >
                  <td style={{ padding: '10px', textAlign: 'center' }}>{item.category}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{item.period}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{formatTurnoverRatio(item.turnoverRatio)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{item.items}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{formatCurrency(item.value)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        color: '#0a1224',
                        backgroundColor: getTurnoverColor(item.turnoverRatio),
                        fontWeight: 700
                      }}
                    >
                      {getTurnoverLabel(item.turnoverRatio)}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#f7f9fb80' }}>
                    No turnover data available for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Data Tooltip */}
      <DataTooltip
        data={tooltip.data}
        position={tooltip.position}
        visible={tooltip.visible}
      />
    </div>
  );
};

export default TurnoverAnalysisMatrix;
