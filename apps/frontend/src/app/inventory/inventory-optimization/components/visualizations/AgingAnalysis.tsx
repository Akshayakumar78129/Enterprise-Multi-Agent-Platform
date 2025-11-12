"use client";

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar } from 'lucide-react';

interface AgingAnalysisProps {
  holdingCostData: any;
  stockOptData: any;
  loading?: boolean;
}

interface AgeBand {
  band: string;
  count: number;
  value: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export function AgingAnalysis({
  holdingCostData,
  stockOptData,
  loading = false
}: AgingAnalysisProps) {
  const agingData = useMemo(() => {
    // Simulate aging bands based on holding costs and turnover
    const highCostItems = holdingCostData.high_cost_items || [];
    const recommendations = stockOptData.recommendations || [];

    // Group items by estimated age bands
    const bands: AgeBand[] = [
      { band: '0-30 days', count: 0, value: 0, risk: 'low' },
      { band: '31-60 days', count: 0, value: 0, risk: 'low' },
      { band: '61-90 days', count: 0, value: 0, risk: 'medium' },
      { band: '91-180 days', count: 0, value: 0, risk: 'medium' },
      { band: '181-365 days', count: 0, value: 0, risk: 'high' },
      { band: '365+ days', count: 0, value: 0, risk: 'critical' },
    ];

    // Distribute items based on holding cost percentage (proxy for age)
    highCostItems.forEach((item: any) => {
      const holdingPct = item.holding_cost_pct || 0;
      let bandIndex = 0;

      if (holdingPct < 0.15) {
        bandIndex = 0; // 0-30 days
      } else if (holdingPct < 0.25) {
        bandIndex = 1; // 31-60 days
      } else if (holdingPct < 0.35) {
        bandIndex = 2; // 61-90 days
      } else if (holdingPct < 0.45) {
        bandIndex = 3; // 91-180 days
      } else if (holdingPct < 0.60) {
        bandIndex = 4; // 181-365 days
      } else {
        bandIndex = 5; // 365+ days
      }

      bands[bandIndex].count += 1;
      bands[bandIndex].value += item.total_value || 0;
    });

    // Add overstock items to older bands
    recommendations.forEach((rec: any) => {
      if (rec.currentLevel > rec.recommendedLevel * 1.5) {
        bands[4].count += 1; // Add to 181-365 band
        bands[4].value += rec.currentLevel * (rec.unitCost || 100);
      } else if (rec.currentLevel > rec.recommendedLevel * 1.2) {
        bands[3].count += 1; // Add to 91-180 band
        bands[3].value += rec.currentLevel * (rec.unitCost || 100);
      }
    });

    return bands;
  }, [holdingCostData, stockOptData]);

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return '#10b981'; // green
      case 'medium':
        return '#f59e0b'; // amber
      case 'high':
        return '#f97316'; // orange
      case 'critical':
        return '#ef4444'; // red
      default:
        return '#6b7280';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-2">{data.band}</p>
          <p className="text-sm text-muted-foreground">
            Items: <span className="text-accent font-medium">{data.count}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Value: <span className="text-foreground font-medium">${data.value.toLocaleString()}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Risk: <span className="font-medium" style={{ color: getRiskColor(data.risk) }}>
              {data.risk.toUpperCase()}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const totalItems = agingData.reduce((sum, band) => sum + band.count, 0);
  const totalValue = agingData.reduce((sum, band) => sum + band.value, 0);
  const criticalItems = agingData.filter(b => b.risk === 'critical' || b.risk === 'high')
    .reduce((sum, band) => sum + band.count, 0);

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">Inventory Aging Analysis</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Critical/High Risk Items</p>
          <p className="text-lg font-semibold text-red-500">{criticalItems}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={agingData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a4459" />
          <XAxis
            dataKey="band"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: '#94a3b8' }}
            label={{ value: 'Item Count', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {agingData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Total Items</p>
          <p className="text-xl font-semibold text-foreground">{totalItems}</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Total Value</p>
          <p className="text-xl font-semibold text-foreground">${(totalValue / 1000000).toFixed(2)}M</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Avg Days in Stock</p>
          <p className="text-xl font-semibold text-foreground">
            {Math.round((agingData.reduce((sum, b, i) => sum + (b.count * (i * 60)), 0) / totalItems) || 0)}
          </p>
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Action Required:</span> {criticalItems} items are in high-risk aging bands (180+ days). Consider promotional campaigns, markdowns, or inventory liquidation to reduce obsolescence risk.
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-muted-foreground">Low Risk</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-amber-500 rounded"></div>
          <span className="text-muted-foreground">Medium Risk</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="text-muted-foreground">High Risk</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-muted-foreground">Critical Risk</span>
        </div>
      </div>
    </div>
  );
}
