"use client";

import React, { useState, useMemo } from 'react';
import { getShiftClickManager } from 'components/index';

interface ExcessiveItem {
  item_key: string;
  item_name: string;
  item_number: string;
  item_category: string;
  warehouse_name: string;
  warehouse_id: string;
  total_holding_cost: number;
  holding_cost_percentage: number;
  average_inventory_value: number;
  potential_savings: number;
  annual_holding_cost: number;
  annual_opportunity_cost: number;
  annual_storage_cost: number;
  annual_risk_cost: number;
  severity: 'Normal' | 'Moderate' | 'High' | 'Excessive';
}

interface ExcessiveCostGridProps {
  data: ExcessiveItem[];
  loading?: boolean;
  threshold?: number;
  onThresholdChange?: (threshold: number) => void;
}

export function ExcessiveCostGrid({
  data,
  loading = false,
  threshold: externalThreshold,
  onThresholdChange
}: ExcessiveCostGridProps) {
  const shiftClickManager = getShiftClickManager();
  const [internalThreshold, setInternalThreshold] = useState(0.30);
  const [sortBy, setSortBy] = useState<'cost' | 'percentage' | 'savings' | 'value'>('cost');
  const [groupBy, setGroupBy] = useState<'category' | 'warehouse' | 'component'>('category');
  const [selectedItem, setSelectedItem] = useState<ExcessiveItem | null>(null);
  const [hoveredItem, setHoveredItem] = useState<ExcessiveItem | null>(null);

  const threshold = externalThreshold ?? internalThreshold;

  const colors = {
    normal: '#3b82f6',      // Blue (< 20%)
    moderate: '#10b981',    // Green (20-25%)
    high: '#f59e0b',        // Amber (25-30%)
    excessive: '#ef4444'    // Red (30%+)
  };

  // Filter data by threshold and sort
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let filtered = data.filter(item => item.holding_cost_percentage >= threshold);

    // Apply sorting
    switch (sortBy) {
      case 'cost':
        filtered.sort((a, b) => b.total_holding_cost - a.total_holding_cost);
        break;
      case 'percentage':
        filtered.sort((a, b) => b.holding_cost_percentage - a.holding_cost_percentage);
        break;
      case 'savings':
        filtered.sort((a, b) => b.potential_savings - a.potential_savings);
        break;
      case 'value':
        filtered.sort((a, b) => b.average_inventory_value - a.average_inventory_value);
        break;
    }

    return filtered;
  }, [data, threshold, sortBy]);

  // Group data for grid layout
  const groupedData = useMemo(() => {
    if (!processedData.length) return {};

    return processedData.reduce((groups, item) => {
      let key: string;

      switch (groupBy) {
        case 'category':
          key = item.item_category || 'Uncategorized';
          break;
        case 'warehouse':
          key = item.warehouse_name || 'Unknown Warehouse';
          break;
        case 'component':
          // Determine primary cost component
          const costs = {
            'Capital': item.annual_holding_cost || 0,
            'Opportunity': item.annual_opportunity_cost || 0,
            'Storage': item.annual_storage_cost || 0,
            'Risk': item.annual_risk_cost || 0
          };
          key = Object.entries(costs).sort(([,a], [,b]) => b - a)[0][0];
          break;
        default:
          key = 'All Items';
      }

      // Replace any remaining null/undefined with a fallback
      if (!key || key === 'null' || key === 'undefined') {
        key = 'Uncategorized';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<string, ExcessiveItem[]>);
  }, [processedData, groupBy]);

  const getItemColor = (percentage: number) => {
    if (percentage >= threshold) return colors.excessive;
    if (percentage >= 0.25) return colors.high;
    if (percentage >= 0.20) return colors.moderate;
    return colors.normal;
  };

  const getItemSize = (inventoryValue: number, maxValue: number) => {
    const minSize = 30;
    const maxSize = 80;
    const ratio = inventoryValue / maxValue;
    return minSize + (maxSize - minSize) * ratio;
  };

  const handleItemClick = (item: ExcessiveItem, event: React.MouseEvent) => {
    setSelectedItem(item);

    if (event.shiftKey) {
      shiftClickManager.addPoint({
        label: `${item.item_name} (${item.item_number})`,
        value: `Cost: $${item.total_holding_cost.toLocaleString()} (${(item.holding_cost_percentage * 100).toFixed(1)}%)`,
        source: 'Excessive Cost Grid'
      }, event.nativeEvent);
    }
  };

  const handleThresholdChange = (value: number) => {
    if (onThresholdChange) {
      onThresholdChange(value);
    } else {
      setInternalThreshold(value);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-96 bg-surface/50 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground bg-surface border border-border rounded-lg">
        No excessive cost data available
      </div>
    );
  }

  const maxValue = processedData.length > 0
    ? Math.max(...processedData.map(item => item.average_inventory_value))
    : 1;

  const itemToShow = selectedItem || hoveredItem;

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      {/* Filter Controls */}
      <div className="flex gap-4 items-center mb-4 flex-wrap">
        {/* Threshold slider */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Threshold:</label>
          <input
            type="range"
            min="0"
            max="1.00"
            step="0.01"
            value={threshold}
            onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
            className="w-20 accent-accent"
          />
          <span className="text-sm text-foreground font-medium w-12">
            {Math.round(threshold * 100)}%
          </span>
        </div>

        {/* Sort by dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg text-sm bg-surface border border-border text-foreground"
          >
            <option value="cost">Total Cost</option>
            <option value="percentage">Cost %</option>
            <option value="savings">Potential Savings</option>
            <option value="value">Inventory Value</option>
          </select>
        </div>

        {/* Group by dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Group by:</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg text-sm bg-surface border border-border text-foreground"
          >
            <option value="category">Category</option>
            <option value="warehouse">Warehouse</option>
            <option value="component">Cost Component</option>
          </select>
        </div>

        {/* Statistics */}
        <div className="ml-auto text-sm text-muted-foreground">
          {processedData.length} items exceeding {Math.round(threshold * 100)}% threshold
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {[
          { color: colors.normal, label: 'Normal (<20%)' },
          { color: colors.moderate, label: 'Moderate (20-25%)' },
          { color: colors.high, label: 'High (25-30%)' },
          { color: colors.excessive, label: `Excessive (${Math.round(threshold * 100)}%+)` }
        ].map((legend, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: legend.color }}
            />
            <span className="text-xs text-muted-foreground">{legend.label}</span>
          </div>
        ))}
      </div>

      {/* Grid and Detail Panel Container */}
      <div className="flex gap-4">
        {/* Grid Section */}
        <div className="flex-1 min-w-0">
          {processedData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No items exceed the current threshold
            </div>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              {Object.entries(groupedData).map(([groupName, items], index) => (
                <div key={groupName} className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                    {items.length} items
                  </h4>

                  <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-1">
                    {items.map((item) => {
                      const size = getItemSize(item.average_inventory_value, maxValue);
                      const color = getItemColor(item.holding_cost_percentage);
                      const isSelected = selectedItem?.item_key === item.item_key;
                      const isHovered = hoveredItem?.item_key === item.item_key;

                      return (
                        <div
                          key={item.item_key}
                          onClick={(e) => handleItemClick(item, e)}
                          onMouseEnter={() => setHoveredItem(item)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className="flex items-center justify-center rounded cursor-pointer transition-transform hover:scale-110"
                          style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            backgroundColor: color,
                            border: isSelected ? '2px solid hsl(var(--foreground))' : 'none'
                          }}
                          title={`${item.item_name} - ${(item.holding_cost_percentage * 100).toFixed(1)}%`}
                        >
                          <div className="text-center p-1 text-background">
                            <div className="text-[8px] leading-tight">{item.item_number}</div>
                            <div className="text-[10px] font-bold leading-tight">
                              {(item.holding_cost_percentage * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-64 flex-shrink-0">
          {itemToShow ? (
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {itemToShow.item_name}
              </h4>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs">Item #</div>
                    <div className="text-foreground font-medium">{itemToShow.item_number}</div>
                  </div>
                  <div>
                    <div className="text-xs">Category</div>
                    <div className="text-foreground font-medium">{itemToShow.item_category}</div>
                  </div>
                  <div>
                    <div className="text-xs">Warehouse</div>
                    <div className="text-foreground font-medium">{itemToShow.warehouse_name}</div>
                  </div>
                  <div>
                    <div className="text-xs">Severity</div>
                    <div
                      className="font-bold"
                      style={{
                        color: itemToShow.severity === 'Excessive' ? colors.excessive :
                               itemToShow.severity === 'High' ? colors.high :
                               itemToShow.severity === 'Moderate' ? colors.moderate : colors.normal
                      }}
                    >
                      {itemToShow.severity}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border space-y-1">
                  <div className="flex justify-between">
                    <span>Inventory Value:</span>
                    <span className="text-foreground font-medium">
                      {formatCurrency(itemToShow.average_inventory_value)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Holding Cost:</span>
                    <span className="text-foreground font-medium">
                      {formatCurrency(itemToShow.total_holding_cost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost %:</span>
                    <span className="text-foreground font-medium">
                      {(itemToShow.holding_cost_percentage * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potential Savings:</span>
                    <span className="text-accent font-bold">
                      {formatCurrency(itemToShow.potential_savings)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm text-center p-4">
              Select or hover over an item to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
