"use client";

import React from 'react';
import { ChartCard, getShiftClickManager } from 'components/index';

interface CustomerInsight {
  customerId: string;
  customerName: string;
  outstandingAmount: number;
  daysPastDue: number;
  riskScore: number;
  segment: string;
}

interface AgingBucket {
  range: string;
  amount: number;
}

interface RiskHeatmapProps {
  customers: CustomerInsight[];
  agingBuckets: AgingBucket[];
  loading?: boolean;
}

export function RiskHeatmap({ customers, agingBuckets, loading }: RiskHeatmapProps) {
  const shiftClickManager = getShiftClickManager();

  if (loading || !customers || customers.length === 0) {
    return (
      <ChartCard loading={loading}>
        <div className="h-96 flex items-center justify-center text-muted">
          No data available
        </div>
      </ChartCard>
    );
  }

  // Sort customers by risk score (highest first) and take top 10
  const topRiskCustomers = [...customers]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  // Define aging bucket ranges for the matrix
  const bucketRanges = ['0-30', '31-45', '46-60', '61-90', '90+'];

  // Helper function to get color based on risk score
  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 75) return 'bg-red-500/80';
    if (riskScore >= 50) return 'bg-orange-500/80';
    if (riskScore >= 25) return 'bg-yellow-500/80';
    return 'bg-green-500/80';
  };

  // Helper function to get text color based on risk score
  const getRiskTextColor = (riskScore: number) => {
    if (riskScore >= 75) return 'text-red-200';
    if (riskScore >= 50) return 'text-orange-200';
    if (riskScore >= 25) return 'text-yellow-200';
    return 'text-green-200';
  };

  // Helper to get collection probability
  const getCollectionProbability = (riskScore: number) => {
    return Math.max(10, 100 - riskScore);
  };

  // Simulate allocation across buckets based on days past due
  const getAllocationForBucket = (customer: CustomerInsight, bucket: string): number => {
    const daysPastDue = customer.daysPastDue;
    const amount = customer.outstandingAmount;

    // Simple allocation logic based on days past due
    if (bucket === '0-30' && daysPastDue <= 30) return amount;
    if (bucket === '31-45' && daysPastDue > 30 && daysPastDue <= 45) return amount;
    if (bucket === '46-60' && daysPastDue > 45 && daysPastDue <= 60) return amount;
    if (bucket === '61-90' && daysPastDue > 60 && daysPastDue <= 90) return amount;
    if (bucket === '90+' && daysPastDue > 90) return amount;

    return 0;
  };

  return (
    <ChartCard
      onShiftClick={(event) => {
        shiftClickManager.addPoint({
          label: "Collection Probability Engine",
          value: `Top ${topRiskCustomers.length} highest risk customers`,
          source: 'AR Aging - Risk Heatmap'
        }, event.nativeEvent);
      }}
    >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-foreground-muted font-medium min-w-[150px]">
                  Customer
                </th>
                <th className="text-center py-3 px-2 text-foreground-muted font-medium w-16">
                  Risk
                </th>
                {bucketRanges.map((bucket) => (
                  <th key={bucket} className="text-center py-3 px-2 text-foreground-muted font-medium w-24">
                    {bucket} days
                  </th>
                ))}
                <th className="text-center py-3 px-2 text-foreground-muted font-medium w-20">
                  Probability
                </th>
              </tr>
            </thead>
            <tbody>
              {topRiskCustomers.map((customer, idx) => {
                const collectionProb = getCollectionProbability(customer.riskScore);

                return (
                  <tr
                    key={customer.customerId}
                    className="border-b border-border hover:bg-surface/50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div>
                        <div className="text-foreground font-medium truncate max-w-[150px]">
                          {customer.customerName}
                        </div>
                        <div className="text-xs text-muted">{customer.segment}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getRiskColor(customer.riskScore)}`}>
                        {customer.riskScore.toFixed(0)}
                      </div>
                    </td>
                    {bucketRanges.map((bucket) => {
                      const allocation = getAllocationForBucket(customer, bucket);
                      const opacity = allocation > 0 ? 0.8 : 0.1;

                      return (
                        <td key={bucket} className="py-3 px-2 text-center">
                          {allocation > 0 ? (
                            <div
                              className={`${getRiskColor(customer.riskScore)} rounded px-2 py-1 text-xs font-semibold text-white`}
                              style={{ opacity }}
                            >
                              ${(allocation / 1000).toFixed(0)}k
                            </div>
                          ) : (
                            <div className="text-muted">-</div>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-2 text-center">
                      <div className={`text-sm font-semibold ${getRiskTextColor(customer.riskScore)}`}>
                        {collectionProb.toFixed(0)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/80"></div>
            <span className="text-xs text-gray-400">Low Risk (0-25)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/80"></div>
            <span className="text-xs text-gray-400">Medium Risk (25-50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500/80"></div>
            <span className="text-xs text-gray-400">High Risk (50-75)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/80"></div>
            <span className="text-xs text-gray-400">Critical Risk (75-100)</span>
          </div>
        </div>
    </ChartCard>
  );
}
