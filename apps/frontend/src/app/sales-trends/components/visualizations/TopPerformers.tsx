"use client";

import React from 'react';
import { TopPerformerDataPoint } from '../../services/salesTrendsService';
import { Skeleton } from 'components/index';
import { TrendingUp, Package, ShoppingCart, Award } from 'lucide-react';

interface TopPerformersProps {
  data: TopPerformerDataPoint[];
  loading?: boolean;
  dimension?: string | null;
}

export function TopPerformers({
  data,
  loading = false,
  dimension = null
}: TopPerformersProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground space-y-2">
        <Award className="h-12 w-12 opacity-30" />
        <p>No top performers data available</p>
        {!dimension && (
          <p className="text-sm">Select a dimension in filters to view top performers</p>
        )}
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));

  return (
    <div className="space-y-3">
      {data.map((performer, index) => {
        const percentage = (performer.revenue / maxRevenue) * 100;

        return (
          <div
            key={performer.name}
            className="glass-card p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                    ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                      index === 1 ? 'bg-gray-400/20 text-gray-400' :
                      index === 2 ? 'bg-orange-600/20 text-orange-600' :
                      'bg-primary/20 text-primary'}
                  `}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">
                    {performer.name}
                  </h4>
                  <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      ${performer.revenue.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {performer.units.toLocaleString()} units
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      {performer.orders.toLocaleString()} orders
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {performer.marketShare.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  market share
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
