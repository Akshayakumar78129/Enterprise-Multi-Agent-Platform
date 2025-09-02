'use client';

import React, { useState } from 'react';
import { formatCurrency, formatPercentage, formatTurnoverRatio } from '../../utils/formatters';
import DataTooltip from '../common/DataTooltip';
import { contextManager } from '../../utils/contextManager';

interface FinancialMetric {
  label: string;
  current: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  format: 'currency' | 'percentage' | 'number';
  impact: 'positive' | 'negative' | 'neutral';
}

interface TreemapItem {
  category: string;
  subcategory?: string;
  value: number;
  daysOfSupply: number;
  items: any[];
}

interface FinancialImpactAnalyzerProps {
  onScenarioChange?: (scenario: string) => void;
  data?: any;
  itemLevelData?: any[]; // Add this to get the same data as ItemLevelAnalyzer
}

const FinancialImpactAnalyzer: React.FC<FinancialImpactAnalyzerProps> = ({
  onScenarioChange,
  data,
  itemLevelData
}) => {
  const [selectedScenario, setSelectedScenario] = useState('baseline');
  const [hierarchyView, setHierarchyView] = useState<'category' | 'warehouse'>('category');
  const [sizeMetric, setSizeMetric] = useState<'value' | 'count'>('value');
  const [colorMetric, setColorMetric] = useState<'daysOfSupply' | 'turnoverRatio'>('turnoverRatio');
  const [carryingCostPercent, setCarryingCostPercent] = useState<number>(data?.carryingCostPercent ?? 25);
  const [overrideServerCarryingCost, setOverrideServerCarryingCost] = useState<boolean>(false);
  const [selectedTreemapItem, setSelectedTreemapItem] = useState<TreemapItem | null>(null);
  // If the server pre-computed an annual carrying cost, prefer it when available
  const serverCarryingCost = data?.kpis?.carryingCostImpact ?? data?.carryingCostImpact ?? null;
  
  // Opportunity Cost Panel States
  const [costOfCapital, setCostOfCapital] = useState(7); // 7% default
  const [liquidationPercent, setLiquidationPercent] = useState(70); // 70% of value
  const [investmentScenario, setInvestmentScenario] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [filterSlowMovingOnly, setFilterSlowMovingOnly] = useState(false); // Changed to false to show all inventory by default
  const [zoomedCategory, setZoomedCategory] = useState<string | null>(null);

  // Tooltip state
  const [tooltip, setTooltip] = useState({
    visible: false,
    data: null as any,
    position: { x: 0, y: 0 }
  });

  // Helper function to get color based on days of supply
  const getDaysOfSupplyColor = (days: number): string => {
    const d = Number(days);
    // Treat missing or non-finite values as fast to avoid marking everything critical
    if (!isFinite(d) || d <= 0) return '#00e0ff';
    // Both Very Fast and Fast use electric cyan per request
    if (d <= 60) return '#00e0ff'; // Very Fast & Fast - Electric Cyan
    if (d <= 90) return '#ffc145'; // Moderate - Amber
    if (d <= 180) return '#f97316'; // Very Slow - Orange
    return '#e930ff'; // Critical/Obsolete - Magenta
  };

  // Helper function to get color based on turnover ratio
  const getTurnoverRatioColor = (ratio: number): string => {
    const r = Number(ratio);
    if (!isFinite(r) || r <= 0) return '#e930ff';
    // Map both Fast and Very Fast to electric cyan per request
    if (r >= 3.0) return '#00e0ff'; // Fast & Very Fast - Electric Cyan
    if (r >= 1.0) return '#ffc145'; // Moderate - Amber
    if (r >= 0.5) return '#f97316'; // Slow - Orange
    return '#e930ff'; // Critical - Magenta
  };

  // Generate contextual tooltip data for treemap items
  const getTreemapTooltipData = (item: TreemapItem) => {
    const avgTurnover = item.daysOfSupply > 0 ? 365 / item.daysOfSupply : 0;
    const valuePerItem = item.items.length > 0 ? item.value / item.items.length : 0;
    
    let status: 'critical' | 'warning' | 'good' = 'good';
    let insight = '';

    if (item.daysOfSupply > 180) {
      status = 'critical';
      insight = 'Excessive inventory - Consider liquidation';
    } else if (item.daysOfSupply > 90) {
      status = 'warning';
      insight = 'High inventory - Optimize replenishment';
    } else if (avgTurnover < 2.0) {
      status = 'warning';
      insight = 'Slow turnover - Monitor demand patterns';
    } else {
      status = 'good';
      insight = 'Healthy inventory - Maintain strategy';
    }

    return {
      title: `${item.category}`,
      items: [
        { label: 'Total Value', value: formatCurrency(item.value), type: 'primary' as const },
        { label: 'Item Count', value: `${item.items.length}`, type: 'metric' as const },
        { label: 'Avg Value/Item', value: formatCurrency(valuePerItem), type: 'secondary' as const },
        { label: 'Days Supply', value: `${Math.round(item.daysOfSupply)}d`, type: 'secondary' as const },
        { label: 'Est. Turnover', value: formatTurnoverRatio(avgTurnover), type: 'metric' as const }
      ],
      insight,
      status
    };
  };

  // Handle treemap item hover
  const handleTreemapEnter = (event: React.MouseEvent, item: TreemapItem) => {
    const tooltipData = getTreemapTooltipData(item);
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

  // Handle Left Shift + Click for context collection on bubble chart
  const handleBubbleClick = (event: React.MouseEvent, item: TreemapItem) => {
    console.log('🎯 Bubble click detected:', { shiftKey: event.shiftKey, item: item.category });
    
    if (event.shiftKey) {
      console.log('🎯 Left Shift + Click detected on bubble:', item.category);
      
      // Create context data for bubble chart item
      contextManager.addContext({
        title: `${item.category} Financial Impact`,
        type: 'data-point',
        content: {
          title: `${item.category} Financial Bubble Analysis`,
          items: [
            { label: 'Category', value: item.category, type: 'primary' as const },
            { label: 'Total Value', value: formatCurrency(item.value), type: 'metric' as const },
            { label: 'Items Count', value: `${item.items.length} items`, type: 'metric' as const },
            { label: 'Days of Supply', value: `${Math.round(item.daysOfSupply)} days`, type: 'metric' as const },
            { label: 'Risk Level', value: item.daysOfSupply > 365 ? 'Critical' : item.daysOfSupply > 180 ? 'High' : 'Medium', type: 'secondary' as const }
          ],
          insight: `${item.category} bubble represents ${item.items.length} slow-moving items worth ${formatCurrency(item.value)} with ${Math.round(item.daysOfSupply)} days of supply`,
          status: item.daysOfSupply > 365 ? 'critical' as const : item.daysOfSupply > 180 ? 'warning' as const : 'good' as const
        },
        source: 'Financial Impact Bubble Chart'
      });
      
      // Add visual feedback for bubble
      const target = event.currentTarget as HTMLElement;
      target.style.boxShadow = '0 0 20px rgba(0, 255, 128, 0.8)';
      target.style.transform = 'scale(1.1)';
      setTimeout(() => {
        target.style.transform = 'scale(1.05)';
        target.style.boxShadow = selectedTreemapItem === item ? 
          '0 0 20px rgba(0, 224, 255, 0.4)' : 
          '0 4px 12px rgba(0, 0, 0, 0.3)';
      }, 200);
    } else {
      // Normal click - select the bubble
      setSelectedTreemapItem(item);
    }
  };

  // Generate treemap data from actual inventory items (same as ItemLevelAnalyzer)
  const generateTreemapData = React.useMemo((): TreemapItem[] => {
  // Use the same data source as ItemLevelAnalyzer for consistency
  // The server response provides `merged` when item-level records are aggregated — accept it too.
  // Prefer the first non-empty array among itemLevelData, data.items, data.merged.
  const chooseInventorySource = () => {
    const candidates: Array<{ name: string; arr: any }> = [
      { name: 'itemLevelData', arr: itemLevelData },
      { name: 'items', arr: data?.items },
      { name: 'merged', arr: data?.merged }
    ];
    // First pick the first non-empty array
    for (const c of candidates) {
      if (Array.isArray(c.arr) && c.arr.length > 0) {
        if (typeof window !== 'undefined') console.debug('FinancialImpactAnalyzer: chosen inventory source (non-empty)', c.name, c.arr.length);
        return c.arr;
      }
    }
    // If none non-empty, pick the first array (even if empty)
    for (const c of candidates) {
      if (Array.isArray(c.arr)) {
        if (typeof window !== 'undefined') console.debug('FinancialImpactAnalyzer: chosen inventory source (empty)', c.name, c.arr.length);
        return c.arr;
      }
    }
    if (typeof window !== 'undefined') console.debug('FinancialImpactAnalyzer: no inventory arrays found');
    return [];
  };

  const inventoryItems = chooseInventorySource();

    if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
      // keep quiet in production, but helpful during dev
      // console.log('No inventory items available');
      return [];
    }

    // Transform items using the same logic as ItemLevelAnalyzer
    const processedItems = inventoryItems.map((item, index) => {
      // Prefer server-provided Days_Of_Supply when available; fall back to Days_Since_Last_Movement or turnover-derived estimate
      const daysOfSupplyFromServer = item.Days_Of_Supply ?? item.Days_of_Supply ?? null;
      const daysSinceLastMovement = item.Days_Since_Last_Movement ?? item.Days_Since_Last_Sale ?? 0;
      const turnoverValue = item.Estimated_Turnover_Ratio ?? item.Turnover_Ratio ?? 0;
      const inventoryValue = item.Current_Inventory_Value ?? ((item.Current_Stock || 0) * (item.Unit_Cost || 0));

      const computedDaysOfSupply = daysOfSupplyFromServer !== null
        ? Math.max(0, Number(daysOfSupplyFromServer))
        : (turnoverValue > 0 ? Math.round(365 / turnoverValue) : (daysSinceLastMovement > 0 ? daysSinceLastMovement : 365));

      return {
        id: `item-${index}-${item.Item_Key || item.Item_Number || index}`,
        sku: item.Item_Number || 'N/A',
        name: item.Item_Name || 'Unknown Item',
        category: item.Item_Category || item.Category || 'Unknown',
        warehouse: item.Warehouse_Name || item.Warehouse_ID || item.Warehouse || 'Unknown',
        quantity: item.Current_Stock || 0,
        unitCost: item.Unit_Cost || 0,
        totalValue: inventoryValue,
        daysSinceLastSale: daysSinceLastMovement,
        turnoverRate: turnoverValue,
        daysOfSupply: computedDaysOfSupply,
        // carry through any server carrying cost if present
        carryingCost: item.Carrying_Cost ?? item.CarryingCost ?? null
      };
    });

    // Filter based on slow-moving criteria if checkbox is checked
    let itemsToProcess = processedItems;
    if (filterSlowMovingOnly) {
      itemsToProcess = processedItems.filter(item => 
        (item.turnoverRate && item.turnoverRate < 2.0) || item.daysOfSupply > 90 || item.daysSinceLastSale > 90
      );
    }

    if (itemsToProcess.length === 0) {
      // helpful debug during development: log why there are no items to process
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('FinancialImpactAnalyzer: no items after filtering', {
          inventoryItemsLength: Array.isArray(inventoryItems) ? inventoryItems.length : 0,
          processedItemsLength: processedItems.length,
          filterSlowMovingOnly,
          hierarchyView
        });
      }
      return [];
    }

    // Group by hierarchy view
    const groupBy = hierarchyView === 'category' ? 'category' : 'warehouse';
    const grouped = itemsToProcess.reduce((acc: any, item: any) => {
      const key = item[groupBy] || 'Unknown';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    // Create treemap items
    const result = Object.entries(grouped).map(([key, items]: [string, any]) => ({
      category: key,
      value: items.reduce((sum: number, it: any) => sum + (it.totalValue || 0), 0),
      daysOfSupply: items.reduce((sum: number, it: any) => sum + (it.daysOfSupply || 0), 0) / items.length,
      items
    })).filter(item => item.value > 0);

    return result;
  }, [itemLevelData, data?.items, data?.merged, filterSlowMovingOnly, hierarchyView]);

  const treemapData = generateTreemapData;

  // Animate-in flag for smoother transitions when treemap data or grouping changes
  const treemapKey = React.useMemo(() => {
    // Include the slow-moving filter in the key so toggling it triggers the same
    // animate-in sequence used for group and size changes.
    return `${hierarchyView}::${sizeMetric}::filter=${filterSlowMovingOnly ? 'slow' : 'all'}::${treemapData.map(t => t.category).join('|')}`;
  }, [hierarchyView, sizeMetric, filterSlowMovingOnly, treemapData]);
  const [animateIn, setAnimateIn] = React.useState(false);
  React.useEffect(() => {
    setAnimateIn(false);
    if (typeof window !== 'undefined' && typeof console !== 'undefined') {
      console.log('treemapKey changed', treemapKey);
    }
    const id = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(id);
  }, [treemapKey]);

  // Build simple buckets and counts for the legend (order matches screenshot)
  const totalTreemapItems = treemapData.reduce((sum, t) => sum + (t.items?.length || 0), 0);
  const daysBuckets = [
    { key: 'critical', label: 'Critical', color: '#e930ff', predicate: (d: number) => d > 180 },
    { key: 'slow', label: 'Slow', color: '#f97316', predicate: (d: number) => d > 90 && d <= 180 },
    { key: 'moderate', label: 'Moderate', color: '#ffc145', predicate: (d: number) => d > 60 && d <= 90 },
    { key: 'fast', label: 'Fast', color: '#00e0ff', predicate: (d: number) => d > 30 && d <= 60 },
    { key: 'veryFast', label: 'Very Fast', color: '#00e0ff', predicate: (d: number) => d <= 30 }
  ];

  // Turnover buckets: map both Fast & Very Fast to cyan per request
  const turnoverBuckets = [
    { key: 'critical', label: 'Critical', color: '#e930ff', predicate: (r: number) => r < 0.5 },
    { key: 'slow', label: 'Slow', color: '#f97316', predicate: (r: number) => r >= 0.5 && r < 1.0 },
    { key: 'moderate', label: 'Moderate', color: '#ffc145', predicate: (r: number) => r >= 1.0 && r < 3.0 },
    { key: 'fast', label: 'Fast', color: '#00e0ff', predicate: (r: number) => r >= 3.0 && r < 6.0 },
    { key: 'veryFast', label: 'Very Fast', color: '#00e0ff', predicate: (r: number) => r >= 6.0 }
  ];

  const buckets = colorMetric === 'daysOfSupply' ? daysBuckets : turnoverBuckets;

  const bucketCounts = buckets.map(b => {
    const count = treemapData.filter(t => {
      const metric = colorMetric === 'daysOfSupply'
        ? t.daysOfSupply
        : (t.items && t.items.length > 0 ? (t.items.reduce((s:any, it:any) => s + (it.turnoverRate || 0), 0) / t.items.length) : 0);
      return b.predicate(metric);
    }).length;
    return { ...b, count };
  });

  // Opportunity Cost Calculations
  const slowMovingValue = treemapData.reduce((sum, item) => sum + item.value, 0)
    || data?.summary?.slowMovingValue
    || data?.slowMovingValue
    || 0;
  const computedAnnualCarryingCost = slowMovingValue * (carryingCostPercent / 100);
  const annualCarryingCost = overrideServerCarryingCost
    ? computedAnnualCarryingCost
    : (typeof serverCarryingCost === 'number' ? serverCarryingCost : computedAnnualCarryingCost);

  // Reset override if server carrying cost or server-suggested percent changes
  React.useEffect(() => {
    // When server provides a carrying cost, default to using it (clear any user override)
    if (typeof serverCarryingCost === 'number') {
      setOverrideServerCarryingCost(false);
    }
    // If server provides a suggested percent, sync the input when not overriding
    if (typeof data?.carryingCostPercent === 'number' && !overrideServerCarryingCost) {
      setCarryingCostPercent(data.carryingCostPercent);
    }
  }, [serverCarryingCost, data?.carryingCostPercent]);
  // Use the server/query slow-moving value when available for opportunity cost calculations
  const slowMovingBase = typeof data?.summary?.slowMovingValue === 'number' ? data.summary.slowMovingValue : slowMovingValue;
  const annualOpportunityCost = slowMovingBase * (costOfCapital / 100);
  const liquidationProceeds = slowMovingBase * (liquidationPercent / 100);
  const liquidationLoss = slowMovingBase - liquidationProceeds;
  const alternativeAnnualReturn = liquidationProceeds * (costOfCapital / 100);
  const breakEvenYears = liquidationLoss > 0 ? liquidationLoss / alternativeAnnualReturn : 0;

  // Investment scenario returns
  const getScenarioReturn = (scenario: string): number => {
    switch (scenario) {
      case 'conservative': return 3;
      case 'moderate': return 7;
      case 'aggressive': return 12;
      default: return 7;
    }
  };

  // Use only real data
  const realData = data?.optimizationScenarios || {};
  const realScenarioKeys = Object.keys(realData);
  
  // Build metrics from real financial data
  const currentSlowMovingValue = typeof data?.slowMovingValue === 'number' ? data.slowMovingValue : 0;
  const totalInventoryValue = typeof data?.totalInventoryValue === 'number' ? data.totalInventoryValue : 0;
  const averageTurnover = typeof data?.averageTurnoverRatio === 'number' ? data.averageTurnoverRatio : 0;
  
  const deadStockValue = currentSlowMovingValue; // Slow-moving can be considered "dead stock"
  const storageEfficiency = totalInventoryValue > 0 ? 
    ((totalInventoryValue - currentSlowMovingValue) / totalInventoryValue) * 100 : 0;
  
  const defaultMetrics: FinancialMetric[] = [
    {
      label: 'Annual Carrying Cost',
      current: annualCarryingCost,
      target: annualCarryingCost * 0.7, // 30% reduction target
      trend: annualCarryingCost > 20000 ? 'down' : 'stable',
      format: 'currency',
      impact: 'positive'
    },
    {
      label: 'Inventory Turnover',
      current: averageTurnover,
      target: 6.0, // Industry benchmark
      trend: averageTurnover >= 4 ? 'up' : 'down',
      format: 'number',
      impact: 'positive'
    },
    {
      label: 'Slow-Moving Value',
      current: currentSlowMovingValue,
      target: currentSlowMovingValue * 0.5, // 50% reduction target
      trend: 'down',
      format: 'currency',
      impact: 'positive'
    },
    {
      label: 'Active Inventory %',
      current: storageEfficiency,
      target: 88,
      trend: storageEfficiency >= 80 ? 'up' : 'down',
      format: 'percentage',
      impact: 'positive'
    }
  ];

  // Use only the query result (`data.summary` / `data.merged`) for these stats so this component
  // remains independent of other visuals that may use `data.kpis`.
  const effectiveTotalInventoryValue = typeof data?.summary?.totalInventoryValue === 'number'
    ? data.summary.totalInventoryValue
    : (totalInventoryValue || treemapData.reduce((s, t) => s + (t.value || 0), 0));

  const effectiveSlowMovingValue = typeof data?.summary?.slowMovingValue === 'number'
    ? data.summary.slowMovingValue
    : slowMovingValue;

  const effectiveAgedValue = typeof data?.summary?.agedValue === 'number'
    ? data.summary.agedValue
    : (data?.agedInventoryValue ?? 0);

  const effectiveTotalItems = typeof data?.summary?.totalItems === 'number'
    ? data.summary.totalItems
    : (Array.isArray(data?.merged) ? data.merged.length : treemapData.reduce((sum, item) => sum + (item.items?.length || 0), 0));

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatTurnoverRatio(value);
      default:
        return value.toString();
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  const scenarios = realScenarioKeys.map(key => ({
    value: key.toLowerCase().replace(/\s+/g, '-'),
    label: key
  }));

  return (
    <div
      className="relative z-10"
      style={{
        width: '100%',
        backgroundColor: '#232a36',
        borderRadius: '16px',
        padding: '20px',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        gap: '20px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header with Controls */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700, color: '#00e0ff' }}>
            Financial Impact Analysis
          </h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#f7f9fb80' }}>
            Analyze inventory value distribution, carrying costs, and liquidation scenarios
          </p>
          
          {/* View Controls */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Hierarchy Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#f7f9fb80' }}>Group by:</span>
              <select
                value={hierarchyView}
                onChange={(e) => setHierarchyView(e.target.value as 'category' | 'warehouse')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: '#1e2738',
                  color: '#f7f9fb',
                  fontSize: '12px'
                }}
              >
                <option value="category">Category</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </div>

            {/* Size Metric */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#f7f9fb80' }}>Size by:</span>
              <select
                value={sizeMetric}
                onChange={(e) => setSizeMetric(e.target.value as 'value' | 'count')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: '#1e2738',
                  color: '#f7f9fb',
                  fontSize: '12px'
                }}
              >
                <option value="value">Value</option>
                <option value="count">Item Count</option>
              </select>
            </div>

            {/* Filter for Slow-Moving Only - Moved from end */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                id="slowMovingFilter"
                checked={filterSlowMovingOnly}
                onChange={(e) => setFilterSlowMovingOnly(e.target.checked)}
                style={{
                  width: '14px',
                  height: '14px',
                  accentColor: '#00e0ff'
                }}
              />
              <label 
                htmlFor="slowMovingFilter" 
                style={{ 
                  fontSize: '12px', 
                  color: '#f7f9fb80',
                  cursor: 'pointer'
                }}
              >
                Slow-moving only
              </label>
            </div>
          </div>
          
          {/* Color Scale and Settings */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            marginBottom: '8px',
            fontSize: '10px',
            color: '#f7f9fb80',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Color Scale */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {bucketCounts.map((b) => (
                <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: b.color,
                    boxShadow: '0 0 6px rgba(0,0,0,0.4)'
                  }} />
                  <span style={{ color: '#f7f9fb', fontSize: '12px' }}>{b.label}</span>
                </div>
              ))}
            </div>
            
            {/* Group and Size Settings */}
            <div style={{
              fontSize: '9px',
              color: '#f7f9fb60'
            }}>
              Group: {hierarchyView === 'category' ? 'Category' : 'Warehouse'} | Size: {sizeMetric === 'value' ? 'Inventory Value' : 'Item Count'}
            </div>
          </div>
        </div>

        {/* Impact Treemap */}
        <div style={{
          flex: 1,
          backgroundColor: '#1e2738',
          border: 'none',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f7f9fb' }}>
              Bubble Chart
            </h4>
            
            {/* Breadcrumb Navigation */}
            {zoomedCategory && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <button
                  onClick={() => setZoomedCategory(null)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: 'transparent',
                    color: '#00e0ff',
                    border: '1px solid #00e0ff',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to All
                </button>
                <span style={{ color: '#f7f9fb80' }}>/ {zoomedCategory}</span>
              </div>
            )}
          </div>
          
          {/* Financial Impact Visualization */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative'
          }}>
            {treemapData.length > 0 ? (
              <>
                {/* Bubble Chart Style Visualization (SVG circle packing without external deps) */}
                <div style={{ width: '100%', height: '100%', padding: '10px', boxSizing: 'border-box' }}>
                  {/** Compute positions for circles using a simple spiral placement to avoid overlaps. **/}
                  {(() => {
                    const svgWidth = 760;
                    const svgHeight = 360;

                    const positions = React.useMemo(() => {
                      if (!treemapData || treemapData.length === 0) return [];

                      const maxMetric = Math.max(...treemapData.map(t => sizeMetric === 'value' ? t.value : t.items.length));
                      const minRadius = 24;
                      const maxRadius = 90;

                      const radii = treemapData.map(t => {
                        const metric = sizeMetric === 'value' ? t.value : t.items.length;
                        const ratio = maxMetric > 0 ? metric / maxMetric : 0;
                        // radius scaled by sqrt for area perception
                        const r = minRadius + Math.sqrt(ratio) * (maxRadius - minRadius);
                        return Math.max(minRadius, r);
                      });

                      const placed: Array<{ x: number; y: number; r: number; index: number }> = [];

                      for (let i = 0; i < treemapData.length; i++) {
                        const r = radii[i];
                        // spiral placement
                        let angle = 0;
                        let radius = 0;
                        let x = svgWidth / 2;
                        let y = svgHeight / 2;
                        let attempts = 0;
                        const step = 6; // degrees

                        const fits = () => {
                          // check bounds
                          if (x - r < 0 || y - r < 0 || x + r > svgWidth || y + r > svgHeight) return false;
                          // check overlap
                          for (const p of placed) {
                            const dx = p.x - x;
                            const dy = p.y - y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < p.r + r + 4) return false;
                          }
                          return true;
                        };

                        // try placing near center and spiral out until fits
                        while (attempts < 5000) {
                          x = svgWidth / 2 + Math.cos(angle) * radius;
                          y = svgHeight / 2 + Math.sin(angle) * radius;
                          if (fits()) break;
                          angle += (step * Math.PI) / 180;
                          radius += 0.5; // step out slowly
                          attempts++;
                        }

                        // clamp inside
                        x = Math.max(r, Math.min(svgWidth - r, x));
                        y = Math.max(r, Math.min(svgHeight - r, y));

                        placed.push({ x, y, r, index: i });
                      }

                      return placed;
                    }, [treemapData, sizeMetric]);

                    return (
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                        {positions.map((p) => {
                          const item = treemapData[p.index];
                          // Choose color based on selected color metric
                          let color = '#00e0ff';
                          if (colorMetric === 'daysOfSupply') {
                            color = getDaysOfSupplyColor(item.daysOfSupply);
                          } else if (colorMetric === 'turnoverRatio') {
                            color = getTurnoverRatioColor(item.items && item.items.length > 0 ? (item.items.reduce((s:any, it:any) => s + (it.turnoverRate || 0), 0) / item.items.length) : 0);
                          }
                          if (typeof window !== 'undefined' && typeof console !== 'undefined') {
                            try {
                              const avgTurnover = item.items && item.items.length > 0 ? (item.items.reduce((s:any, it:any) => s + (it.turnoverRate || 0), 0) / item.items.length) : 0;
                              // visible log to diagnose why color is magenta
                              console.log('BubbleColorDebug', {
                                category: item.category,
                                daysOfSupply: item.daysOfSupply,
                                avgTurnover,
                                colorMetric,
                                chosenColor: color
                              });
                            } catch (e) {
                              /* ignore */
                            }
                          }
                          return (
                            <g key={item.category} transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }}>
                              <title>{`Left Shift + Click to add "${item.category}" to AI context`}</title>
                              <circle
                                r={p.r}
                                fill={color}
                                stroke="rgba(10,18,36,0.3)"
                                strokeWidth={2}
                                onClick={(e) => handleBubbleClick(e as unknown as any, item)}
                                onMouseEnter={(e) => handleTreemapEnter(e as unknown as any, item)}
                                onMouseLeave={() => handleMouseLeave()}
                                onMouseMove={handleMouseMove}
                              />
                              {/* Category label */}
                              <foreignObject x={-p.r + 6} y={-16} width={p.r * 2 - 12} height={20}>
                                <div style={{
                                  width: '100%',
                                  textAlign: 'center',
                                  fontSize: p.r > 50 ? 12 : 10,
                                  fontWeight: 700,
                                  color: '#0a1224',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>{item.category}</div>
                              </foreignObject>

                              {/* Value */}
                              <text x={0} y={6} textAnchor="middle" style={{ fontSize: p.r > 50 ? 11 : 9, fontWeight: 600, fill: '#0a1224' }}>
                                {formatCurrency(item.value)}
                              </text>

                              {/* Item count */}
                              <text x={0} y={22} textAnchor="middle" style={{ fontSize: p.r > 50 ? 10 : 8, fill: '#0a1224', opacity: 0.85 }}>
                                {item.items.length} items
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f7f9fb80',
                fontSize: '14px',
                gap: '8px'
              }}>
                <div>No inventory data available</div>
                <div style={{ fontSize: '12px', textAlign: 'center' }}>
                    Check if item-level data is being passed to this component
                  </div>
                  <div style={{ fontSize: '11px', color: '#f7f9fb60', marginTop: '6px' }}>
                    Sources: merged: {Array.isArray(data?.merged) ? data.merged.length : 0}, items: {Array.isArray(data?.items) ? data.items.length : 0}, itemLevelData: {Array.isArray(itemLevelData) ? itemLevelData.length : 0}
                  </div>
                  {filterSlowMovingOnly && (
                    <div style={{ fontSize: '12px', color: '#ffc145' }}>
                      Try unchecking "Slow-moving only" to see all inventory
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Value Breakdown Panel */}
      <div style={{
        width: '360px',
        backgroundColor: '#232a36',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto',
        maxHeight: '500px'
      }}>
        <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#f7f9fb', textAlign: 'center' }}>
          Financial Impact
        </h4>

  {/* debug UI removed */}

        {/* Key Financial Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px',
          marginBottom: '8px'
        }}>
          {/* Total Inventory Value Card */}
          <div style={{
            backgroundColor: '#1e2738',
            border: '1px solid #3a4459',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f7f9fb' }}>
              {formatCurrency(effectiveTotalInventoryValue || 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#f7f9fb80', marginTop: '4px' }}>
              Total Inventory Value
            </div>
          </div>

          {/* Slow-Moving Value Card */}
          <div style={{
            backgroundColor: '#1e2738',
            border: '1px solid #3a4459',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#e930ff' }}>
              {formatCurrency(effectiveSlowMovingValue || 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#f7f9fb80', marginTop: '4px' }}>
              Slow-Moving Value
            </div>
          </div>

          {/* Aged Inventory Value Card */}
          <div style={{
            backgroundColor: '#1e2738',
            border: '1px solid #3a4459',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffc145' }}>
              {formatCurrency(effectiveAgedValue || 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#f7f9fb80', marginTop: '4px' }}>
              Aged Inventory Value
            </div>
          </div>

          {/* Total Items Analyzed Card */}
          <div style={{
            backgroundColor: '#1e2738',
            border: '1px solid #3a4459',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#f7f9fb80' }}>
              {effectiveTotalItems} items
            </div>
            <div style={{ fontSize: '12px', color: '#f7f9fb80', marginTop: '4px' }}>
              Total Items Analyzed
            </div>
          </div>
        </div>

        {/* Carrying Cost Calculator */}
        <div style={{
          backgroundColor: '#1e2738',
          border: '1px solid #3a4459',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h5 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#f7f9fb' }}>
            Carrying Cost Calculator
          </h5>
          
          {/* Input Controls */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#f7f9fb80', display: 'block', marginBottom: '4px' }}>
              Holding Cost %
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={carryingCostPercent}
                onChange={(e) => {
                  const raw = e.target.value;
                  // Ignore empty values to avoid treating blank as 0
                  if (raw === '') return;
                  const v = Number(raw);
                  if (!Number.isNaN(v)) {
                    setCarryingCostPercent(v);
                    // User edited the holding cost percent -> override server-provided carrying cost
                    setOverrideServerCarryingCost(true);
                  }
                }}
                min="1"
                max="50"
                step="0.5"
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: '#232a36',
                  color: '#f7f9fb',
                  fontSize: '12px'
                }}
              />
        {/* reset button removed per request */}
            </div>
          </div>
      {/* server carrying-cost checkbox removed; server value is used automatically when present */}

          {/* Cost Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid #3a4459', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#00e0ff' }}>
                {formatCurrency(annualCarryingCost)}
              </div>
              <div style={{ fontSize: '14px', color: '#f7f9fb80' }}>Annual Carrying Cost</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#f7f9fb80' }}>Monthly:</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#f7f9fb' }}>
                {formatCurrency(annualCarryingCost / 12)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#f7f9fb80' }}>Weekly:</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#f7f9fb' }}>
                {formatCurrency(annualCarryingCost / 52)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#f7f9fb80' }}>Daily:</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#f7f9fb' }}>
                {formatCurrency(annualCarryingCost / 365)}
              </span>
            </div>
          </div>
        </div>

        {/* Opportunity Cost Panel */}
        <div style={{
          backgroundColor: '#1e2738',
          border: '1px solid #3a4459',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#f7f9fb' }}>
            Opportunity Cost Analysis
          </h5>
          
          {/* Investment Scenario Selector */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', color: '#f7f9fb80', display: 'block', marginBottom: '2px' }}>
              Investment Scenario
            </label>
            <select
              value={investmentScenario}
              onChange={(e) => {
                const scenario = e.target.value as 'conservative' | 'moderate' | 'aggressive';
                setInvestmentScenario(scenario);
                setCostOfCapital(getScenarioReturn(scenario));
              }}
              style={{
                width: '100%',
                padding: '4px 6px',
                borderRadius: '4px',
                border: '1px solid #3a4459',
                backgroundColor: '#232a36',
                color: '#f7f9fb',
                fontSize: '11px'
              }}
            >
              <option value="conservative">Conservative (3%)</option>
              <option value="moderate">Moderate (7%)</option>
              <option value="aggressive">Aggressive (12%)</option>
            </select>
          </div>

          {/* Custom Cost of Capital Input */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', color: '#f7f9fb80', display: 'block', marginBottom: '2px' }}>
              Custom Cost of Capital %
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                value={costOfCapital}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setCostOfCapital(value);
                  // Update investment scenario to reflect custom input
                  if (value === 3) setInvestmentScenario('conservative');
                  else if (value === 7) setInvestmentScenario('moderate');
                  else if (value === 12) setInvestmentScenario('aggressive');
                  else setInvestmentScenario('moderate'); // Default for custom values
                }}
                min="0.1"
                max="25"
                step="0.1"
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: '#232a36',
                  color: '#f7f9fb',
                  fontSize: '11px'
                }}
              />
              <span style={{ fontSize: '10px', color: '#f7f9fb80' }}>%</span>
            </div>
          </div>

          {/* Annual Opportunity Cost */}
          <div style={{ marginBottom: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#e930ff' }}>
              {formatCurrency(annualOpportunityCost)}
            </div>
            <div style={{ fontSize: '12px', color: '#f7f9fb80' }}>Annual Opportunity Cost</div>
          </div>

          {/* What-if Liquidation Scenario */}
          <div style={{ paddingTop: '8px', borderTop: '1px solid #3a4459' }}>
            <h6 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: '#f7f9fb' }}>
              Liquidation Analysis
            </h6>
            
            {/* Liquidation Percentage Control */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#f7f9fb80' }}>Recovery Rate:</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#f7f9fb' }}>{liquidationPercent}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={liquidationPercent}
                onChange={(e) => setLiquidationPercent(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '3px',
                  backgroundColor: '#3a4459',
                  borderRadius: '2px',
                  outline: 'none',
                  cursor: 'pointer',
                  accentColor: '#00e0ff'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#f7f9fb80', marginTop: '2px' }}>
                <span>50%</span>
                <span>90%</span>
              </div>
            </div>

            {/* Liquidation Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#f7f9fb80' }}>Proceeds:</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e' }}>
                  {formatCurrency(liquidationProceeds)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#f7f9fb80' }}>Loss:</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#e930ff' }}>
                  {formatCurrency(liquidationLoss)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#f7f9fb80' }}>Annual Return:</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#00e0ff' }}>
                  {formatCurrency(alternativeAnnualReturn)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#f7f9fb80' }}>Break-even:</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#ffc145' }}>
                  {breakEvenYears > 0 ? `${breakEvenYears.toFixed(1)} years` : 'Immediate'}
                </span>
              </div>
            </div>

            {/* Liquidation Recommendation */}
            <div style={{ 
              backgroundColor: breakEvenYears < 2 ? '#22c55e20' : breakEvenYears < 5 ? '#ffc14520' : '#e930ff20',
              border: `1px solid ${breakEvenYears < 2 ? '#22c55e' : breakEvenYears < 5 ? '#ffc145' : '#e930ff'}`,
              borderRadius: '4px',
              padding: '6px',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '10px', 
                fontWeight: 600, 
                color: breakEvenYears < 2 ? '#22c55e' : breakEvenYears < 5 ? '#ffc145' : '#e930ff'
              }}>
                {breakEvenYears < 2 ? 'RECOMMEND LIQUIDATION' : 
                 breakEvenYears < 5 ? 'CONSIDER LIQUIDATION' : 'RETAIN INVENTORY'}
              </div>
              <div style={{ fontSize: '9px', color: '#f7f9fb80', marginTop: '2px' }}>
                {breakEvenYears < 2 ? 'Quick payback period' : 
                 breakEvenYears < 5 ? 'Moderate payback period' : 'Long payback period'}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Item Details */}
        {selectedTreemapItem && (
          <div style={{
            backgroundColor: '#1e2738',
            border: '1px solid #3a4459',
            borderRadius: '8px',
            padding: '12px'
          }}>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#f7f9fb' }}>
              {selectedTreemapItem.category} Details
            </h5>
            <div style={{ fontSize: '12px', color: '#f7f9fb80', marginBottom: '8px' }}>
              {selectedTreemapItem.items.length} items • {formatCurrency(selectedTreemapItem.value)}
            </div>
            <div style={{ fontSize: '12px', color: '#f7f9fb80' }}>
              Avg Days of Supply: {selectedTreemapItem.daysOfSupply.toFixed(0)} days
            </div>
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

export default FinancialImpactAnalyzer;
