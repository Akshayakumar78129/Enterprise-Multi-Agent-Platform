"use client";

import React from "react";
import { KPICard, getShiftClickManager } from "components/index";
import { ShoppingCart, DollarSign, Package, Activity } from "lucide-react";

interface BehaviorKPIProps {
  kpiMetrics: {
    avgFrequency: string | number;
    avgOrderValue: string | number;
    topCategory: string;
    primaryChannel: string;
    avgEngagement: string | number;
  };
  loading: boolean;
}

export function BehaviorKPIs({ kpiMetrics, loading }: BehaviorKPIProps) {
  const shiftClickManager = getShiftClickManager();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <KPICard
        title="Avg Purchase Frequency"
        value={`${kpiMetrics.avgFrequency} days`}
        icon={<ShoppingCart className="w-5 h-5 text-cyan-400" />}
        description="Average days between purchases"
        trend={{
          value: 12,
          isPositive: false
        }}
        loading={loading}
        onShiftClick={(event) => {
          shiftClickManager.addPoint({
            label: "Avg Purchase Frequency",
            value: `${kpiMetrics.avgFrequency} days`,
            source: 'Behavior KPIs'
          }, event.nativeEvent);
        }}
      />

      <KPICard
        title="Avg Order Value"
        value={`$${kpiMetrics.avgOrderValue}`}
        icon={<DollarSign className="w-5 h-5 text-green-400" />}
        description="Average transaction amount"
        trend={{
          value: 8,
          isPositive: true
        }}
        loading={loading}
        onShiftClick={(event) => {
          shiftClickManager.addPoint({
            label: "Avg Order Value",
            value: `$${kpiMetrics.avgOrderValue}`,
            source: 'Behavior KPIs'
          }, event.nativeEvent);
        }}
      />

      <KPICard
        title="Top Category"
        value={kpiMetrics.topCategory}
        icon={<Package className="w-5 h-5 text-purple-400" />}
        description="Most purchased product category"
        loading={loading}
        onShiftClick={(event) => {
          shiftClickManager.addPoint({
            label: "Top Category",
            value: kpiMetrics.topCategory,
            source: 'Behavior KPIs'
          }, event.nativeEvent);
        }}
      />

      <KPICard
        title="Primary Channel"
        value={kpiMetrics.primaryChannel}
        icon={<Activity className="w-5 h-5 text-blue-400" />}
        description="Most used purchase channel"
        loading={loading}
        onShiftClick={(event) => {
          shiftClickManager.addPoint({
            label: "Primary Channel",
            value: kpiMetrics.primaryChannel,
            source: 'Behavior KPIs'
          }, event.nativeEvent);
        }}
      />

      <KPICard
        title="Avg Engagement Score"
        value={kpiMetrics.avgEngagement}
        icon={<Activity className="w-5 h-5 text-pink-400" />}
        description="Customer engagement level"
        trend={{
          value: 5,
          isPositive: true
        }}
        loading={loading}
        onShiftClick={(event) => {
          shiftClickManager.addPoint({
            label: "Avg Engagement Score",
            value: `${kpiMetrics.avgEngagement}`,
            source: 'Behavior KPIs'
          }, event.nativeEvent);
        }}
      />
    </div>
  );
}