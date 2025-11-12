"use client";

import React, { useState } from 'react';
import { Sparkles, BarChart3, Download } from 'lucide-react';
import { FilterBar } from 'components/index';
import { useInventoryOptimizationContext } from './context';
import { useHoldingCostData } from '../holding-cost/hooks/useHoldingCostData';
import { useStockoptimizationData } from '../stock-optimization/hooks/useStockoptimizationData';
import {
  UnifiedInventoryKPIs,
  AIInsightsModal,
  InventoryBusinessIntelligence,
  InventoryHealthMatrix,
  CostImpactWaterfall,
  PerformanceTimeline,
  ActionPriorityMatrix,
  AgingAnalysis,
  ComponentBreakdown,
  InventoryOptimizationFilters,
} from './components';
import { exportInventoryOptimizationData } from './services/inventoryOptimizationService';

export default function InventoryOptimizationPage() {
  const { filters } = useInventoryOptimizationContext();

  // State for interactive parameters
  const [holdingRate, setHoldingRate] = useState(25);
  const [serviceLevel, setServiceLevel] = useState(95);
  const [leadTime, setLeadTime] = useState(14);

  // State for modals
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isBIPanelOpen, setIsBIPanelOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch data from both dashboards with dynamic parameters
  const holdingCostData = useHoldingCostData({
    dateFrom: filters.dateRange.startDate,
    dateTo: filters.dateRange.endDate,
    categories: filters.categories,
    warehouseIds: filters.warehouseIds,
    annualHoldingCostRate: holdingRate / 100,
    opportunityCostRate: 0.08,
  });

  const stockOptData = useStockoptimizationData({
    dateRange: filters.dateRange,
    category: filters.categories,
    warehouse: filters.warehouseIds,
    optimizationLevel: filters.optimizationLevel,
    serviceLevel: serviceLevel,
    leadTimeDays: leadTime,
  });

  const loading = holdingCostData.loading || stockOptData.loading;

  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportInventoryOptimizationData({
        start_date: filters.dateRange.startDate,
        end_date: filters.dateRange.endDate,
        category: filters.categories?.[0],
        annual_holding_cost_rate: holdingRate / 100,
        service_level: serviceLevel,
        lead_time_days: leadTime,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-optimization-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Optimization</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive inventory analysis with AI-powered insights and business intelligence
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI Insights</span>
          </button>
          <button
            onClick={() => setIsBIPanelOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-600/90 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">Business Intelligence</span>
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || loading}
            className="flex items-center space-x-2 px-4 py-2 bg-surface border border-border text-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isExporting ? 'Exporting...' : 'Export'}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Unified KPIs */}
      <UnifiedInventoryKPIs
        holdingCostData={holdingCostData.data || {}}
        stockOptData={stockOptData.data || {}}
        loading={loading}
      />

      {/* Interactive Parameters */}
      <InventoryOptimizationFilters
        holdingRate={holdingRate}
        serviceLevel={serviceLevel}
        leadTime={leadTime}
        onHoldingRateChange={setHoldingRate}
        onServiceLevelChange={setServiceLevel}
        onLeadTimeChange={setLeadTime}
      />

      {/* Visualization Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryHealthMatrix
          holdingCostData={holdingCostData.data || {}}
          stockOptData={stockOptData.data || {}}
          loading={loading}
        />
        <CostImpactWaterfall
          holdingCostData={holdingCostData.data || {}}
          stockOptData={stockOptData.data || {}}
          loading={loading}
        />
      </div>

      {/* Visualization Grid - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceTimeline
          holdingCostData={holdingCostData.data || {}}
          stockOptData={stockOptData.data || {}}
          loading={loading}
        />
        <ActionPriorityMatrix
          holdingCostData={holdingCostData.data || {}}
          stockOptData={stockOptData.data || {}}
          loading={loading}
        />
      </div>

      {/* Visualization Grid - Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgingAnalysis
          holdingCostData={holdingCostData.data || {}}
          stockOptData={stockOptData.data || {}}
          loading={loading}
        />
        <ComponentBreakdown
          holdingCostData={holdingCostData.data || {}}
          stockOptData={stockOptData.data || {}}
          loading={loading}
        />
      </div>

      {/* Detailed Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holding Cost Analysis */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            High-Cost Items
          </h2>
          {holdingCostData.highCostItems && holdingCostData.highCostItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Item</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Value</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Cost %</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingCostData.highCostItems.slice(0, 10).map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-border/50 hover:bg-accent/5">
                      <td className="py-2 px-3 text-xs text-foreground font-medium">{item.item_number}</td>
                      <td className="py-2 px-3 text-xs text-foreground text-right">
                        ${(item.total_value || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-xs text-right">
                        <span className={item.excessive_holding_cost ? 'text-red-500 font-semibold' : 'text-foreground'}>
                          {((item.holding_cost_pct || 0) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              {loading ? 'Loading...' : 'No data available'}
            </div>
          )}
        </div>

        {/* Stock Optimization Recommendations */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Top Recommendations
          </h2>
          {stockOptData.recommendations && stockOptData.recommendations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Item</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Current</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Recommended</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {stockOptData.recommendations.slice(0, 10).map((rec: any, idx: number) => {
                    const needsReorder = rec.currentLevel <= rec.reorderPoint;
                    return (
                      <tr key={idx} className="border-b border-border/50 hover:bg-accent/5">
                        <td className="py-2 px-3 text-xs text-foreground font-medium">
                          {needsReorder && <span className="text-red-500 mr-1">⚠</span>}
                          {rec.itemName}
                        </td>
                        <td className="py-2 px-3 text-xs text-foreground text-right">
                          {(rec.currentLevel || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-xs text-foreground text-right">
                          {(rec.recommendedLevel || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-xs text-green-500 text-right font-medium">
                          ${(rec.savings || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              {loading ? 'Loading...' : 'No data available'}
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Modal */}
      <AIInsightsModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        holdingCostInsights={holdingCostData.insights || []}
        stockOptInsights={stockOptData.insights || []}
        loading={loading}
      />

      {/* Business Intelligence Panel */}
      <InventoryBusinessIntelligence
        isOpen={isBIPanelOpen}
        onClose={() => setIsBIPanelOpen(false)}
        holdingCostData={holdingCostData.data || {}}
        stockOptData={stockOptData.data || {}}
      />
    </div>
  );
}
