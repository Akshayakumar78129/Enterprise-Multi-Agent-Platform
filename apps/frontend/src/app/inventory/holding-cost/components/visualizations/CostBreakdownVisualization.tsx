"use client";

import React, { useState, useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { getShiftClickManager } from 'components/index';

interface CostBreakdownData {
  // Simple flat data
  component?: string;
  amount?: number;
  percentage?: number;
  color?: string;

  // Hierarchical data
  byComponent?: {
    [key: string]: number;
  };
  byCategory?: {
    [category: string]: {
      totalCost: number;
      itemCount: number;
      totalValue: number;
      components: {
        capital: number;
        opportunity: number;
        storage: number;
        risk: number;
      };
    };
  };
  byWarehouse?: {
    [warehouseId: string]: {
      warehouseName: string;
      warehouseType: string;
      totalCost: number;
      itemCount: number;
      totalValue: number;
    };
  };
}

interface CostBreakdownVisualizationProps {
  data: CostBreakdownData[] | CostBreakdownData;
  loading?: boolean;
}

interface TreeNode {
  name: string;
  value: number;
  children?: TreeNode[];
  color?: string;
  parent?: string;
  percentage?: number;
  meta?: any;
}

export function CostBreakdownVisualization({ data, loading = false }: CostBreakdownVisualizationProps) {
  const shiftClickManager = getShiftClickManager();
  const [viewType, setViewType] = useState<'component' | 'category' | 'warehouse'>('component');
  const [selectedSegment, setSelectedSegment] = useState<any>(null);

  const colors = {
    capital: '#3b82f6',      // Blue
    opportunity: '#8b5cf6',  // Purple
    storage: '#10b981',      // Green
    risk: '#f59e0b'         // Amber
  };

  // Check if data is hierarchical or flat
  const isHierarchical = useMemo(() => {
    if (!data) return false;
    if (Array.isArray(data)) return false;
    return !!(data as any).byComponent || !!(data as any).byCategory || !!(data as any).byWarehouse;
  }, [data]);

  // Convert flat data to simple pie chart format
  const flatData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data;
  }, [data]);

  // Build hierarchical tree data for Treemap
  const treeData = useMemo((): TreeNode | null => {
    if (!isHierarchical || !data) return null;

    const hierarchicalData = data as CostBreakdownData;

    switch (viewType) {
      case 'component':
        return buildComponentTree(hierarchicalData);
      case 'category':
        return buildCategoryTree(hierarchicalData);
      case 'warehouse':
        return buildWarehouseTree(hierarchicalData);
      default:
        return null;
    }
  }, [data, viewType, isHierarchical]);

  const buildComponentTree = (data: CostBreakdownData): TreeNode | null => {
    if (!data.byComponent || !data.byCategory) return null;

    const children: TreeNode[] = [];

    // Build component nodes with categories as children
    Object.entries(data.byComponent).forEach(([componentName, componentValue]) => {
      const componentKey = componentName.toLowerCase().replace(' cost', '');
      const componentColor = colors[componentKey as keyof typeof colors] || colors.capital;

      // Find categories for this component
      const categoryChildren: TreeNode[] = [];

      if (data.byCategory) {
        Object.entries(data.byCategory).forEach(([categoryName, categoryInfo]) => {
          const categoryComponentKey = componentKey as 'capital' | 'opportunity' | 'storage' | 'risk';
          const categoryValue = categoryInfo.components?.[categoryComponentKey] || 0;

          if (categoryValue > 0) {
            categoryChildren.push({
              name: categoryName,
              value: categoryValue,
              color: componentColor,
              parent: componentName,
              meta: categoryInfo
            });
          }
        });
      }

      children.push({
        name: componentName,
        value: componentValue,
        color: componentColor,
        children: categoryChildren.length > 0 ? categoryChildren : undefined
      });
    });

    return {
      name: 'Total Holding Cost',
      value: children.reduce((sum, c) => sum + c.value, 0),
      children
    };
  };

  const buildCategoryTree = (data: CostBreakdownData): TreeNode | null => {
    if (!data.byCategory) return null;

    const children: TreeNode[] = Object.entries(data.byCategory).map(([category, info], index) => ({
      name: category,
      value: info.totalCost,
      color: Object.values(colors)[index % 4],
      meta: info
    }));

    return {
      name: 'Total by Category',
      value: children.reduce((sum, c) => sum + c.value, 0),
      children
    };
  };

  const buildWarehouseTree = (data: CostBreakdownData): TreeNode | null => {
    if (!data.byWarehouse) return null;

    const typeColors = {
      'Central': colors.capital,
      'Regional': colors.opportunity,
      'Local': colors.storage,
      'Special': colors.risk
    };

    const children: TreeNode[] = Object.entries(data.byWarehouse).map(([id, info]) => ({
      name: info.warehouseName,
      value: info.totalCost,
      color: typeColors[info.warehouseType as keyof typeof typeColors] || colors.capital,
      meta: info
    }));

    return {
      name: 'Total by Warehouse',
      value: children.reduce((sum, c) => sum + c.value, 0),
      children
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, value, color, depth } = props;

    if (width < 40 || height < 40) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color || colors.capital,
            stroke: 'hsl(var(--background))',
            strokeWidth: 2,
            cursor: 'pointer',
            opacity: depth === 1 ? 0.9 : 0.7
          }}
          onClick={(e) => handleSegmentClick(props, e)}
        />
        {width > 60 && height > 40 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 10}
              textAnchor="middle"
              fill="white"
              fontSize={depth === 1 ? 14 : 12}
              fontWeight="bold"
            >
              {name.length > 15 ? name.substring(0, 15) + '...' : name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="white"
              fontSize={11}
            >
              ${(value / 1000).toFixed(0)}k
            </text>
          </>
        )}
      </g>
    );
  };

  const handleSegmentClick = (segment: any, event: React.MouseEvent) => {
    setSelectedSegment(segment);

    if (event.shiftKey) {
      shiftClickManager.addPoint({
        label: segment.name,
        value: formatCurrency(segment.value),
        source: 'Cost Breakdown Chart'
      }, event.nativeEvent);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Amount: <span className="text-accent font-semibold">{formatCurrency(data.value)}</span>
          </p>
          {data.parent && (
            <p className="text-xs text-muted-foreground">
              Parent: {data.parent}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-96 bg-surface/50 rounded"></div>
      </div>
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground bg-surface border border-border rounded-lg">
        No cost breakdown data available
      </div>
    );
  }

  // Render hierarchical view with Treemap
  if (isHierarchical && treeData) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        {/* View Type Controls */}
        <div className="flex gap-2 mb-4">
          {(['component', 'category', 'warehouse'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setViewType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                viewType === type
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-surface border border-border text-foreground hover:bg-muted'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          {/* Treemap Chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={400}>
              <Treemap
                data={treeData.children || []}
                dataKey="value"
                stroke="hsl(var(--background))"
                fill="#8884d8"
                content={<CustomTreemapContent />}
              >
                <Tooltip content={<CustomTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          </div>

          {/* Detail Panel */}
          <div className="w-64 flex-shrink-0">
            {selectedSegment ? (
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  {selectedSegment.name}
                </h4>

                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Value</div>
                    <div className="text-lg font-bold text-accent">
                      {formatCurrency(selectedSegment.value)}
                    </div>
                  </div>

                  {selectedSegment.parent && (
                    <div>
                      <div className="text-xs text-muted-foreground">Parent</div>
                      <div className="text-foreground font-medium">
                        {selectedSegment.parent}
                      </div>
                    </div>
                  )}

                  {selectedSegment.meta && viewType === 'category' && (
                    <>
                      <div className="pt-2 border-t border-border">
                        <div className="text-xs text-muted-foreground">Items</div>
                        <div className="text-foreground font-medium">
                          {selectedSegment.meta.itemCount?.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Inventory Value</div>
                        <div className="text-foreground font-medium">
                          {formatCurrency(selectedSegment.meta.totalValue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Cost Rate</div>
                        <div className="text-foreground font-medium">
                          {((selectedSegment.meta.totalCost / selectedSegment.meta.totalValue) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </>
                  )}

                  {selectedSegment.meta && viewType === 'warehouse' && (
                    <>
                      <div className="pt-2 border-t border-border">
                        <div className="text-xs text-muted-foreground">Type</div>
                        <div className="text-foreground font-medium">
                          {selectedSegment.meta.warehouseType}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Items</div>
                        <div className="text-foreground font-medium">
                          {selectedSegment.meta.itemCount?.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Inventory Value</div>
                        <div className="text-foreground font-medium">
                          {formatCurrency(selectedSegment.meta.totalValue)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center p-4">
                Click on a segment to see details
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 flex-wrap">
          {Object.entries(colors).map(([name, color]) => (
            <div key={name} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground capitalize">{name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render simple flat view with pie chart (fallback for non-hierarchical data)
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="currentColor"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-bold fill-foreground"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={flatData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="amount"
            onClick={(entry: any, index: number, event: any) => {
              if (event.shiftKey) {
                shiftClickManager.addPoint({
                  label: entry.component,
                  value: formatCurrency(entry.amount),
                  source: 'Cost Breakdown Chart'
                }, event);
              }
            }}
          >
            {flatData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
            ))}
          </Pie>
          <Tooltip content={({ active, payload }: any) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
                  <p className="font-semibold text-foreground">{data.component}</p>
                  <p className="text-sm text-muted-foreground">
                    Amount: <span className="text-accent font-semibold">{formatCurrency(data.amount)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Percentage: <span className="text-accent font-semibold">{data.percentage?.toFixed(2)}%</span>
                  </p>
                </div>
              );
            }
            return null;
          }} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-sm text-foreground">{entry.payload.component}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {flatData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={(e) => {
              if (e.shiftKey) {
                shiftClickManager.addPoint({
                  label: item.component || 'Unknown',
                  value: formatCurrency(item.amount || 0),
                  source: 'Cost Breakdown Legend'
                }, e.nativeEvent);
              }
            }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm font-medium text-foreground">{item.component}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{formatCurrency(item.amount || 0)}</p>
              <p className="text-xs text-muted-foreground">{item.percentage?.toFixed(2)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
