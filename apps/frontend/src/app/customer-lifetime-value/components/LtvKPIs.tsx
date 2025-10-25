"use client";

import React from 'react';
import { KPICard, AnimatedKPITile, getShiftClickManager } from 'components/index';
import { TrendingUp, DollarSign, Users, Activity, Target } from 'lucide-react';

interface LtvKPIsProps {
  metrics: {
    avgLtv?: number;
    medianLtv?: number;
    totalValue?: number;
    highValueCount?: number;
    ltvGrowth?: number;
    predictionAccuracy?: number;
    totalCustomers?: number;
  };
  loading?: boolean;
  onTileClick?: (metric: string) => void;
}

export function LtvKPIs({ metrics = {}, loading = false, onTileClick }: LtvKPIsProps) {
  const shiftClickManager = getShiftClickManager();
  const kpis = [
    {
      title: 'Average LTV',
      value: metrics.avgLtv ? `$${metrics.avgLtv.toLocaleString()}` : '$0',
      subtitle: 'Per customer',
      icon: DollarSign,
      trend: metrics.ltvGrowth || 0,
      color: '#3b82f6' as const // Blue
    },
    {
      title: 'Median LTV',
      value: metrics.medianLtv ? `$${metrics.medianLtv.toLocaleString()}` : '$0',
      subtitle: 'Mid-point value',
      icon: Target,
      color: '#10b981' as const // Emerald
    },
    {
      title: 'Total Value',
      value: metrics.totalValue ? `$${(metrics.totalValue / 1000000).toFixed(1)}M` : '$0',
      subtitle: 'All customers',
      icon: TrendingUp,
      color: '#f59e0b' as const // Amber
    },
    {
      title: 'High Value',
      value: metrics.highValueCount?.toLocaleString() || '0',
      subtitle: 'Premium customers',
      icon: Users,
      color: '#ec4899' as const // Pink
    },
    {
      title: 'Model Accuracy',
      value: metrics.predictionAccuracy ? `${metrics.predictionAccuracy}%` : '0%',
      subtitle: 'Prediction confidence',
      icon: Activity,
      progress: metrics.predictionAccuracy || 0,
      color: '#8b5cf6' as const // Purple
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((_, index) => (
          <AnimatedKPITile
            key={index}
            isLoading={true}
            delay={index * 100}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, index) => (
        <AnimatedKPITile
          key={index}
          {...kpi}
          delay={index * 100}
          onShiftClick={(event) => {
            shiftClickManager.addPoint({
              label: kpi.title,
              value: kpi.value,
              source: 'LTV KPIs'
            }, event.nativeEvent);
          }}
        />
      ))}
    </div>
  );
}