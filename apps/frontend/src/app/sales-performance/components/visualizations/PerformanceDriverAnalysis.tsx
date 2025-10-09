"use client";

import React, { useState, useMemo } from 'react';
import { Card, getShiftClickManager } from 'components/index';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber, formatCurrency } from '../../utils/formatNumber';
import { calculateDrivers, calculateDriverSummary } from '../../utils/dataTransformations';

interface PerformanceDriverAnalysisProps {
  data: any[];
  loading?: boolean;
  selectedDimension?: string;
  selectedMetric?: string;
}

export function PerformanceDriverAnalysis({
  data,
  loading,
  selectedDimension = 'category',
  selectedMetric = 'revenue'
}: PerformanceDriverAnalysisProps) {
  const shiftClickManager = getShiftClickManager();

  const driverData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // Use the utility function to calculate drivers
    const filterPositiveOnly = false; // Show all drivers by default
    return calculateDrivers(data, filterPositiveOnly);
  }, [data]);

  // Calculate summary metrics using utility function
  const summaryMetrics = useMemo(() => {
    if (driverData.length === 0) {
      return {
        positiveDrivers: 0,
        negativeDrivers: 0,
        netImpact: 0,
        totalDrivers: 0
      };
    }

    return calculateDriverSummary(driverData);
  }, [driverData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <p className="text-foreground font-semibold mb-2">{data.name}</p>
          <p className="text-cyan-400">Contribution: {formatNumber(data.contribution)}%</p>
        </div>
      );
    }
    return null;
  };

  // Handle shift+click on driver bars
  const handleDriverClick = (data: any) => {
    if (!shiftClickManager.isShiftKeyPressed()) return;

    // Recharts provides activeLabel and activeIndex when clicking on chart
    if (data.activeLabel !== undefined && data.activeIndex !== undefined) {
      // Find the data point using activeIndex
      const index = typeof data.activeIndex === 'string' ? parseInt(data.activeIndex) : data.activeIndex;
      const payload = driverData[index];

      if (payload) {
        shiftClickManager.addPoint({
          label: `Driver: ${payload.name}`,
          value: `Contribution: ${formatNumber(payload.contribution)}% | Revenue: ${formatCurrency(payload.revenue)} | Impact: ${formatNumber(payload.impact)}%`,
          source: 'Performance Drivers',
          chartType: 'horizontal-bar'
        }, data);
      }
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading drivers...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <div className="space-y-4">
        {/* Chart */}
        <div className="h-[400px] w-full flex items-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={driverData}
              layout="vertical"
              margin={{ top: 20, right: 140, left: 120, bottom: 20 }}
              onClick={handleDriverClick}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis
                type="number"
                stroke="rgba(0,0,0,0.5)"
                tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
                label={{ value: 'Contribution (%)', position: 'insideBottom', offset: -10, fill: 'rgba(0,0,0,0.7)', fontSize: 12 }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="rgba(0,0,0,0.5)"
                tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.7)' }}
                width={110}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="contribution" fill="#00e0ff" name="Contribution %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Metrics */}
        {summaryMetrics && summaryMetrics.totalDrivers > 0 && (
          <div className="flex justify-around bg-accent/20 rounded-lg p-3">
            <div className="text-center">
              <span className="text-xs text-muted-foreground opacity-70">Positive Drivers</span>
              <p className="text-sm font-semibold text-cyan-400">{formatCurrency(summaryMetrics.positiveDrivers)}</p>
            </div>
            <div className="text-center">
              <span className="text-xs text-muted-foreground opacity-70">Negative Drivers</span>
              <p className="text-sm font-semibold text-red-400">{formatCurrency(summaryMetrics.negativeDrivers)}</p>
            </div>
            <div className="text-center">
              <span className="text-xs text-muted-foreground opacity-70">Net Impact</span>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(summaryMetrics.netImpact)}</p>
            </div>
            <div className="text-center">
              <span className="text-xs text-muted-foreground opacity-70">Total Drivers</span>
              <p className="text-sm font-semibold text-foreground">{summaryMetrics.totalDrivers}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
