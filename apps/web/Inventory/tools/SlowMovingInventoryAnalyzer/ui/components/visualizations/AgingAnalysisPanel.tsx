'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';
import DataTooltip from '../common/DataTooltip';
import { contextManager } from '../../utils/contextManager';

interface AgingAnalysisPanelProps {
  selectedCategory?: string;
  categories?: string[];
  data?: any;
}

const AgingAnalysisPanel: React.FC<AgingAnalysisPanelProps> = ({
  categories = ['All Categories'],
  data
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('table');
  const [chartMetric, setChartMetric] = useState<'value' | 'items' | 'percentage'>('value');
  
  // Tooltip state
  const [tooltip, setTooltip] = useState({
    visible: false,
    data: null as any,
    position: { x: 0, y: 0 }
  });

  // State for real data
  const [agingData, setAgingData] = useState<any[]>([]);
  const [totalItemsAll, setTotalItemsAll] = useState(0);
  const [totalValueAll, setTotalValueAll] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(categories);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [loading, setLoading] = useState(false);

  // Client-side bucketize helper (keeps chart & table scale identical)
  const bucketizeItems = (items: any[], categoryFilter?: string) => {
    const buckets: Record<string, { count: number; value: number }> = {
      '0-30 days': { count: 0, value: 0 },
      '31-60 days': { count: 0, value: 0 },
      '61-90 days': { count: 0, value: 0 },
      '91-180 days': { count: 0, value: 0 },
      '180+ days': { count: 0, value: 0 }
    };

    let totalValue = 0;
    let totalItems = 0;

  // If a category filter is provided, only count items matching it (case-sensitive match to server categories)
  const filtered = categoryFilter && categoryFilter !== 'All Categories' ? items.filter((it:any) => (it.Item_Category || it.item_category || it.ItemCategory || '') === categoryFilter) : items;

  filtered.forEach((it: any) => {
      const turnover = Number(it.Estimated_Turnover_Ratio ?? it.turnoverRate ?? 0) || 0;
      const days = Number(it.Days_Of_Supply ?? it.daysOfSupply ?? (turnover > 0 ? Math.round(365 / turnover) : 9999));
      const qty = Number(it.Current_Stock ?? it.quantity ?? 0) || 0;
      const unit = Number(it.Unit_Cost ?? it.unitCost ?? 0) || 0;
      const value = Number(it.Current_Inventory_Value ?? it.value ?? (qty * unit)) || 0;

      totalItems += 1;
      totalValue += value;

      if (days <= 30) {
        buckets['0-30 days'].count += 1;
        buckets['0-30 days'].value += value;
      } else if (days <= 60) {
        buckets['31-60 days'].count += 1;
        buckets['31-60 days'].value += value;
      } else if (days <= 90) {
        buckets['61-90 days'].count += 1;
        buckets['61-90 days'].value += value;
      } else if (days <= 180) {
        buckets['91-180 days'].count += 1;
        buckets['91-180 days'].value += value;
      } else {
        buckets['180+ days'].count += 1;
        buckets['180+ days'].value += value;
      }
    });

    const arr = Object.entries(buckets).map(([ageRange, obj]) => ({
      ageRange,
      items: Number(obj.count || 0),
      value: Number(obj.value || 0),
      // percent of total inventory value (0-100)
      percentageOfValue: totalValue > 0 ? (Number(obj.value || 0) / totalValue) * 100 : 0,
      // percent of total item count (0-100) - use this in table to avoid value-skew
      percentageOfItems: totalItems > 0 ? (Number(obj.count || 0) / totalItems) * 100 : 0
    }));

  return { arr, totalItems, totalValue };
  };

  // Fetch data from API and fallback to client-side aggregation when needed
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/slow-moving-analyzer/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: selectedCategory !== 'All Categories' ? selectedCategory : undefined })
        });
        const json = await res.json();
        console.log("AgingAnalysisPanel: json", json);
        if (json && json.status === 'success') {
          // Prefer server-provided agingAnalysis if available (this reflects server-side
          // annualization and any DB-side logic). Fall back to item-level bucketization
          // (itemLevelData / slowMovingItems / merged) only when the server did not return
          // an agingAnalysis payload.
          if (json.data?.aging?.agingBuckets) {
            const buckets = json.data.aging.agingBuckets || {};
            const totalValue = json.data.aging.totalValue || 0;
            const totalItems = json.data.aging.totalItems || 0;
            const arr = Object.entries(buckets).map(([ageRange, obj]: any) => ({
              ageRange,
              items: Number(obj.count || 0),
              value: Number(obj.value || 0),
              percentageOfValue: totalValue > 0 ? (Number(obj.value || 0) / totalValue) * 100 : 0,
              percentageOfItems: totalItems > 0 ? (Number(obj.count || 0) / totalItems) * 100 : 0
            }));
            setAgingData(arr);
            setTotalItemsAll(totalItems || 0);
            setTotalValueAll(totalValue || 0);
          } else {
            // Prefer server-provided item-level rows (live Postgres) when available.
            // Fall back to the normalized `merged` snapshot only when live rows are absent.
            const items = data || json.data?.itemLevelData || json.data?.slowMovingItems || json.data?.merged || [];
            if (Array.isArray(items) && items.length > 0) {
              const { arr, totalItems, totalValue } = bucketizeItems(items || [], selectedCategory);
              setAgingData(arr);
              setTotalItemsAll(totalItems || 0);
              setTotalValueAll(totalValue || 0);
            } else {
              setAgingData([]);
              setTotalItemsAll(0);
              setTotalValueAll(0);
            }
          }

          // Merge server categories into dropdown when provided
          const respCats = json.data?.filterOptions?.categories || [];
          if (Array.isArray(respCats) && respCats.length > 0) {
            setCategoryOptions(prev => {
              const prevList = Array.isArray(prev) ? prev : ['All Categories'];
              const prevFiltered = prevList.filter(c => c !== 'All Categories');
              const respFiltered = respCats.filter(Boolean).map(String);
              const combined = [...prevFiltered, ...respFiltered];
              const unique = Array.from(new Set(combined));
              return ['All Categories', ...unique];
            });
          }
        } else {
          // fallback to local data prop
          if (Array.isArray(data) && data.length > 0) {
            const { arr, totalItems, totalValue } = bucketizeItems(data);
            setAgingData(arr);
            setTotalItemsAll(totalItems || 0);
            setTotalValueAll(totalValue || 0);
          } else {
            setAgingData([]);
            setTotalItemsAll(0);
            setTotalValueAll(0);
          }
        }
      } catch (e) {
        if (Array.isArray(data) && data.length > 0) {
          const { arr, totalItems, totalValue } = bucketizeItems(data);
          setAgingData(arr);
          setTotalItemsAll(totalItems || 0);
          setTotalValueAll(totalValue || 0);
        } else {
          setAgingData([]);
          setTotalItemsAll(0);
          setTotalValueAll(0);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedCategory, data]);

  const getAgeColor = (ageRange: string) => {
    switch (ageRange) {
      case '0-30 days': return '#00e0ff';
      case '31-60 days': return '#5fd4d6';
      case '61-90 days': return '#3e7b97';
      case '91-180 days': return '#d45d79';
      case '180+ days': return '#e930ff';
      default: return '#6b7280';
    }
  };

  const getAgeRisk = (ageRange: string) => {
    switch (ageRange) {
      case '0-30 days': return 'Low';
      case '31-60 days': return 'Low';
      case '61-90 days': return 'Medium';
      case '91-180 days': return 'High';
      case '180+ days': return 'Very High';
      default: return 'Unknown';
    }
  };

  const handleExportCSV = () => {
    console.log('🚀 Export CSV clicked - WORKING!');
    const headers = ['Age Range','Items','Value','Percentage','Risk Level'];
    const rows = agingData.map(d => [
      d.ageRange,
      d.items.toString(),
      d.value.toString(),
      // prefer percent-of-items where available, fallback to percent-of-value
      formatPercentage(((d.percentageOfItems ?? d.percentageOfValue) || 0) / 100),
      getAgeRisk(d.ageRange)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aging-analysis.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('CSV exported successfully!');
  };

  const handleTableRowEnter = (event: React.MouseEvent, item: any) => {
    setTooltip({
      visible: true,
      data: {
        title: `${item.ageRange} Analysis`,
        items: [
          { label: 'Items', value: formatNumber(item.items), type: 'metric' as const },
          { label: 'Value', value: formatCurrency(item.value), type: 'metric' as const },
          { label: 'Risk Level', value: getAgeRisk(item.ageRange), type: 'primary' as const }
        ],
  insight: `This age range represents ${formatPercentage(item.percentageOfValue / 100)} of total inventory value`,
        status: getAgeRisk(item.ageRange) === 'Low' ? 'good' as const : 
               getAgeRisk(item.ageRange) === 'Medium' ? 'warning' as const : 'critical' as const
      },
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const handleDataPointClick = (event: React.MouseEvent, item: any) => {
    // Check if Left Shift is pressed
    if (event.shiftKey) {
      console.log('🎯 Left Shift + Click detected on:', item.ageRange);
      
      // Add context to the context manager
      contextManager.addContext({
        title: `${item.ageRange} Analysis`,
        type: 'data-point',
        content: {
          title: `${item.ageRange} Analysis`,
          items: [
            { label: 'Items', value: formatNumber(item.items), type: 'metric' as const },
            { label: 'Value', value: formatCurrency(item.value), type: 'metric' as const },
            { label: 'Risk Level', value: getAgeRisk(item.ageRange), type: 'primary' as const },
            { label: 'Percentage', value: formatPercentage(item.percentageOfValue / 100), type: 'metric' as const }
          ],
          insight: `This age range represents ${formatPercentage(item.percentageOfValue / 100)} of total inventory value`,
          status: getAgeRisk(item.ageRange) === 'Low' ? 'good' as const : 
                 getAgeRisk(item.ageRange) === 'Medium' ? 'warning' as const : 'critical' as const
        },
        source: `Aging Analysis Panel - ${viewMode === 'chart' ? 'Chart' : 'Table'}`
      });
      
      // Prevent tooltip from showing
      setTooltip(prev => ({ ...prev, visible: false }));
      
      // Visual feedback
      const target = event.currentTarget as HTMLElement;
      target.style.transform = 'scale(0.95)';
      setTimeout(() => {
        target.style.transform = 'scale(1)';
      }, 150);
    }
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
    <div style={{
      width: '100%',
      maxWidth: '100%',
      backgroundColor: '#232a36',
      borderRadius: '16px',
      padding: '16px',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      {/* Spinner keyframes for inline animation */}
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      {/* FORCED VISIBLE HEADER */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        padding: '0'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#00e0ff' }}>
            Aging Analysis
          </h3>
          <div style={{ color: '#f7f9fb80', fontSize: '12px' }}>
            Distribution of inventory across age buckets
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Category Dropdown - Only show in table view */}
          {viewMode === 'table' && (
            <select
              value={selectedCategory}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCategory(value);
                // No global callback, only local state update
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #3a4459',
                backgroundColor: '#3a4459',
                color: '#f7f9fb',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          {/* Clean Toggle Buttons Matching Image */}
          <div style={{ display: 'flex', gap: '0', alignItems: 'center' }}>
            <button
              onClick={() => {
                console.log(`🎯 BUTTON CLICK: Chart`);
                setViewMode('chart');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: viewMode === 'chart' ? '#00e0ff' : '#3a4459',
                color: viewMode === 'chart' ? '#0a1224' : '#f7f9fb',
                border: 'none',
                borderRadius: '6px 0 0 6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Chart
            </button>
            <button
              onClick={() => {
                console.log(`🎯 BUTTON CLICK: Table`);
                setViewMode('table');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: viewMode === 'table' ? '#00e0ff' : '#3a4459',
                color: viewMode === 'table' ? '#0a1224' : '#f7f9fb',
                border: 'none',
                borderRadius: '0 6px 6px 0',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              Table
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#3a4459',
              color: '#f7f9fb',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ 
        backgroundColor: '#1e2738', 
        borderRadius: '12px', 
        padding: '16px',
        border: '1px solid #3a4459',
        position: 'relative'
      }}>
  {viewMode === 'chart' ? (
          <div>
            {/* HORIZONTAL CONTROLS ROW MATCHING IMAGE */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              {/* Left: Distribution Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ color: '#f7f9fb80', fontSize: '12px' }}>Distribution by:</span>
                <div style={{ display: 'flex', border: '1px solid #3a4459', borderRadius: '6px', overflow: 'hidden' }}>
                  {(['value', 'items', 'percentage'] as const).map(m => (
                    <button 
                      key={m}
                      onClick={() => {
                        console.log(`📊 Chart metric changed to: ${m}`);
                        setChartMetric(m);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: chartMetric === m ? '#00e0ff' : '#3a4459',
                        color: chartMetric === m ? '#0a1224' : '#f7f9fb',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      {m === 'value' ? 'Value' : m === 'items' ? 'Items' : 'Percentage'}
                    </button>
                  ))}
                </div>
                
                {/* aging threshold removed (simpler UX) */}
              </div>
              
              {/* Right: Inline Legend */}
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', fontSize: '11px', color: '#f7f9fb80' }}>
                {agingData.map(d => (
                  <div key={d.ageRange} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                      width: '12px', 
                      height: '12px', 
                      backgroundColor: getAgeColor(d.ageRange), 
                      borderRadius: '2px',
                      display: 'inline-block'
                    }} />
                    <span>{d.ageRange}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* LARGE ROUNDED STACKED BAR EXACTLY MATCHING SPEC IMAGE */}
            <div style={{ 
              width: '100%', 
              height: '50px', 
              display: 'flex', 
              borderRadius: '25px', 
              overflow: 'hidden',
              backgroundColor: '#151c2b',
              marginBottom: '20px'
            }}>
              {agingData.map((item, index) => {
                const getValue = () => {
                  switch(chartMetric) {
                    case 'items': return item.items;
                    case 'percentage': return item.percentageOfValue;
                    default: return item.value;
                  }
                };
                
                const getTotal = () => {
                  switch(chartMetric) {
                    case 'items': return totalItemsAll;
                    case 'percentage': return 100;
                    default: return totalValueAll;
                  }
                };
                
                const width = (getValue() / getTotal()) * 100 || 0;
                const showLabel = width > 10;
                let labelText = '';
                if (chartMetric === 'value') {
                  labelText = formatCurrency(item.value || 0);
                } else if (chartMetric === 'percentage') {
                  labelText = `${Math.round(item.percentageOfValue || 0)}%`;
                } else {
                  labelText = formatNumber(item.items || 0);
                }

                return (
                  <div
                    key={index}
                    style={{
                      width: `${width}%`,
                      backgroundColor: getAgeColor(item.ageRange),
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0a1224',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      handleTableRowEnter(e, item);
                      e.currentTarget.style.filter = 'brightness(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      handleMouseLeave();
                      e.currentTarget.style.filter = 'brightness(1)';
                    }}
                    onMouseMove={handleMouseMove}
                    onClick={(e) => handleDataPointClick(e, item)}
                    title={`Left Shift + Click to add "${item.ageRange}" to AI context`}
                  >
                    {showLabel && labelText}
                  </div>
                );
              })}
            </div>
            
            {/* BOTTOM SUMMARY STATS EXACTLY MATCHING SPEC IMAGE */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '30px',
              fontSize: '12px',
              textAlign: 'center',
              marginTop: '15px'
            }}>
              {(() => {
                const fresh = agingData.filter(d => ['0-30 days', '31-60 days'].includes(d.ageRange));
                // Align with table semantics: 'aging' covers 61-180 days (both 61-90 and 91-180)
                const aging = agingData.filter(d => ['61-90 days', '91-180 days'].includes(d.ageRange));
                // 'stale' should reflect >180 days only
                const stale = agingData.filter(d => d.ageRange === '180+ days');

                // Helper to compute the group metric value according to chartMetric
                const groupValue = (group: any[]) => {
                  if (chartMetric === 'items') return group.reduce((s, d) => s + (Number(d.items || 0)), 0);
                  if (chartMetric === 'percentage') return group.reduce((s, d) => s + (Number(d.percentageOfValue || 0)), 0);
                  // default: value
                  return group.reduce((s, d) => s + (Number(d.value || 0)), 0);
                };

                const freshVal = groupValue(fresh);
                const agingVal = groupValue(aging);
                const staleVal = groupValue(stale);

                const renderMetric = (val: number) => {
                  if (chartMetric === 'items') return formatNumber(Math.round(val || 0));
                  if (chartMetric === 'percentage') return `${Math.round(val || 0)}%`;
                  return formatCurrency(val || 0);
                };

                return (
                  <>
                    <div>
                      <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '24px', marginBottom: '6px' }}>
                        {renderMetric(freshVal)}
                      </div>
                      <div style={{ color: '#f7f9fb80', fontSize: '14px' }}>Fresh (≤60d)</div>
                    </div>

                    <div>
                      <div style={{ color: '#eab308', fontWeight: 700, fontSize: '24px', marginBottom: '6px' }}>
                        {renderMetric(agingVal)}
                      </div>
                      <div style={{ color: '#f7f9fb80', fontSize: '14px' }}>Aging (61-180d)</div>
                    </div>

                    <div>
                        <div style={{ color: '#e930ff', fontWeight: 700, fontSize: '24px', marginBottom: '6px' }}>
                          {renderMetric(staleVal)}
                        </div>
                      <div style={{ color: '#f7f9fb80', fontSize: '14px' }}>Stale (&gt;180d)</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          <div>
            {/* Table-level loading overlay */}
            {loading && (
              <div style={{
                position: 'absolute',
                inset: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(10,12,20,0.45)',
                borderRadius: '8px',
                zIndex: 30
              }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid #3a4459', borderTop: '4px solid #00e0ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#232a36', borderBottom: '2px solid #3a4459' }}>
                  <th style={{ padding: '15px', textAlign: 'left', color: '#00e0ff', fontWeight: 700 }}>Age Range</th>
                  <th style={{ padding: '15px', textAlign: 'center', color: '#00e0ff', fontWeight: 700 }}>Items</th>
                  <th style={{ padding: '15px', textAlign: 'center', color: '#00e0ff', fontWeight: 700 }}>Value</th>
                  <th style={{ padding: '15px', textAlign: 'center', color: '#00e0ff', fontWeight: 700 }}>Percentage</th>
                  <th style={{ padding: '15px', textAlign: 'center', color: '#00e0ff', fontWeight: 700 }}>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {agingData.map((item, index) => (
                  <tr 
                    key={index}
                    style={{ 
                      backgroundColor: index % 2 === 0 ? '#1e2738' : '#232a36',
                      borderBottom: '1px solid #3a4459',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      handleTableRowEnter(e, item);
                      e.currentTarget.style.backgroundColor = '#2a3441';
                    }}
                    onMouseLeave={(e) => {
                      handleMouseLeave();
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#1e2738' : '#232a36';
                    }}
                    onMouseMove={handleMouseMove}
                    onClick={(e) => handleDataPointClick(e, item)}
                    title={`Left Shift + Click to add "${item.ageRange}" to AI context`}
                  >
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          backgroundColor: getAgeColor(item.ageRange) 
                        }} />
                        <span style={{ color: '#f7f9fb', fontWeight: 600 }}>{item.ageRange}</span>
                      </div>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', color: '#f7f9fb' }}>
                      {formatNumber(item.items)}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', color: '#f7f9fb' }}>
                      {formatCurrency(item.value)}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', color: '#f7f9fb' }}>
                      {formatPercentage(((item.percentageOfItems ?? item.percentageOfValue) || 0) / 100)}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: getAgeRisk(item.ageRange) === 'Low' ? '#22c55e20' :
                                       getAgeRisk(item.ageRange) === 'Medium' ? '#eab30820' :
                                       getAgeRisk(item.ageRange) === 'High' ? '#f9731620' : '#ef444420',
                        color: getAgeRisk(item.ageRange) === 'Low' ? '#22c55e' :
                               getAgeRisk(item.ageRange) === 'Medium' ? '#eab308' :
                               getAgeRisk(item.ageRange) === 'High' ? '#f97316' : '#ef4444'
                      }}>
                        {getAgeRisk(item.ageRange)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <DataTooltip
          visible={tooltip.visible}
          data={tooltip.data}
          position={tooltip.position}
        />
      )}
    </div>
  );
};

export default AgingAnalysisPanel;
