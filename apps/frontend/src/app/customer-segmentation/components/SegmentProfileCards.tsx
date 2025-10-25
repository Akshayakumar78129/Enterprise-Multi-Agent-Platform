"use client";

import React, { useState } from 'react';
import { Card, getShiftClickManager } from 'components';
import { Users, TrendingUp, DollarSign, Activity, ChevronRight, Award, AlertTriangle, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';

interface SegmentProfileCardsProps {
  segmentDistribution: any[];
  segmentComparison: any[];
  onSegmentSelect?: (segmentName: string) => void;
  selectedSegment?: string | null;
  loading?: boolean;
}

// Radar Chart Component
function RadarChart({ data, color, size = 140 }: { data: any[], color: string, size?: number }) {
  const center = size / 2;
  const maxRadius = (size / 2) - 20;
  const angleStep = (Math.PI * 2) / data.length;
  const angles = data.map((_, i) => -Math.PI / 2 + i * angleStep);

  // Create path data for the filled area
  const pathPoints = data.map((point, i) => {
    const radius = (point.value / 100) * maxRadius;
    const x = center + Math.cos(angles[i]) * radius;
    const y = center + Math.sin(angles[i]) * radius;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ') + ' Z';

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Grid circles */}
      {[20, 40, 60, 80, 100].map(percentage => (
        <circle
          key={percentage}
          cx={center}
          cy={center}
          r={(percentage / 100) * maxRadius}
          fill="none"
          stroke="#c7d2fe"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}

      {/* Grid lines */}
      {angles.map((angle, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={center + Math.cos(angle) * maxRadius}
          y2={center + Math.sin(angle) * maxRadius}
          stroke="#c7d2fe"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}

      {/* Data area */}
      <path
        d={pathPoints}
        fill={color}
        fillOpacity="0.6"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {data.map((point, i) => {
        const radius = (point.value / 100) * maxRadius;
        const x = center + Math.cos(angles[i]) * radius;
        const y = center + Math.sin(angles[i]) * radius;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
          />
        );
      })}

      {/* Labels */}
      {data.map((point, i) => {
        const labelRadius = maxRadius + 12;
        const x = center + Math.cos(angles[i]) * labelRadius;
        const y = center + Math.sin(angles[i]) * labelRadius;
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#4b5563"
            fontSize="10"
            fontWeight="500"
          >
            {point.label}
          </text>
        );
      })}
    </svg>
  );
}

export function SegmentProfileCards({
  segmentDistribution = [],
  segmentComparison = [],
  onSegmentSelect,
  onSegmentExport,
  selectedSegment,
  loading = false
}: SegmentProfileCardsProps) {
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const shiftClickManager = getShiftClickManager();

  // Define vibrant colors for each segment
  const segmentColors: Record<string, string> = {
    'Champions': '#10b981',          // Emerald green
    'Loyal Customers': '#8b5cf6',    // Purple
    'Potential Loyalists': '#f59e0b', // Amber
    'New Customers': '#ec4899',      // Pink
    'At Risk': '#ef4444',            // Red
    "Can't Lose Them": '#dc2626',    // Dark red
    'Hibernating': '#6366f1',        // Indigo
    'Lost': '#64748b'                // Slate
  };

  // Combine data from both sources - backend now provides proper names
  const segments = segmentDistribution.map((dist) => {
    const comparison = segmentComparison.find(c => c.segment_name === dist.segment_name) || {};
    const color = segmentColors[dist.segment_name] || '#94a3b8';
    return { ...dist, ...comparison, color };
  });

  const getSegmentIcon = (segmentName: string) => {
    if (segmentName?.includes('Champion') || segmentName?.includes('High')) return <Award className="w-5 h-5" />;
    if (segmentName?.includes('Risk') || segmentName?.includes('Lost')) return <AlertTriangle className="w-5 h-5" />;
    if (segmentName?.includes('Loyal')) return <TrendingUp className="w-5 h-5" />;
    return <Users className="w-5 h-5" />;
  };

  const getSegmentDescription = (segmentName: string) => {
    const descriptions: { [key: string]: string } = {
      'Champions': 'Your best customers with high value and frequency',
      'Loyal Customers': 'Consistent buyers with good retention',
      'Potential Loyalists': 'Recent customers with growth potential',
      'New Customers': 'Recently acquired, need nurturing',
      'At Risk': 'Previously good customers showing decline',
      'Cannot Lose Them': 'High-value customers at risk of churning',
      'Lost': 'Haven\'t purchased in a long time',
      'Hibernating': 'Low engagement, need reactivation'
    };
    return descriptions[segmentName] || 'Customer segment';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 rounded w-3/4 mb-4" style={{ backgroundColor: '#e5e7eb' }}></div>
            <div className="h-4 rounded w-1/2 mb-2" style={{ backgroundColor: '#e5e7eb' }}></div>
            <div className="h-4 rounded w-full" style={{ backgroundColor: '#e5e7eb' }}></div>
          </Card>
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#b8a8ba' }} />
        <p style={{ color: '#9a8a9c' }}>No segment data available</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {segments.map((segment, index) => {
        const isExpanded = expandedSegment === segment.segment_name;
        const isSelected = selectedSegment === segment.segment_name;

        // Prepare radar chart data
        const radarData = [
          { label: 'Value', value: Math.min(100, (segment.avg_lifetime_value || 0) / 1000) },
          { label: 'Freq', value: Math.min(100, (segment.avg_frequency || 0) * 10) },
          { label: 'Recent', value: Math.max(0, 100 - (segment.avg_recency || 0)) },
          { label: 'Size', value: (segment.percentage || 0) * 2 },
          { label: 'AOV', value: Math.min(100, (segment.avg_order_value || 0) / 500) }
        ];

        return (
          <Card
            key={`${segment.segment_name}-${index}`}
            className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              isSelected ? 'ring-2 ring-blue-500' : ''
            } ${isExpanded ? 'md:col-span-2 lg:col-span-2' : ''}`}
            onClick={(e) => {
              if (e.shiftKey) {
                // Shift+click: Add to global shift+click selection
                shiftClickManager.addPoint({
                  label: `Segment: ${segment.segment_name}`,
                  value: `${segment.customer_count} customers, Avg LTV: $${(segment.avg_lifetime_value || 0).toLocaleString()}`,
                  source: 'Segment Profiles'
                }, e.nativeEvent);
              } else if (onSegmentSelect) {
                onSegmentSelect(segment.segment_name);
              }
            }}
            style={{ borderColor: segment.color || '#e5e7eb' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: segment.color ? `${segment.color}20` : '#f3f4f6',
                      color: segment.color || '#6b7280'
                    }}
                  >
                    {getSegmentIcon(segment.segment_name)}
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    {segment.segment_name}
                  </h3>
                </div>
                <p className="text-sm mb-1" style={{ color: '#7a6a7c' }}>
                  {segment.customer_count?.toLocaleString() || 0} customers ({segment.percentage?.toFixed(1) || 0}%)
                </p>
                <p className="text-xs" style={{ color: '#9a8a9c' }}>
                  {getSegmentDescription(segment.segment_name)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedSegment(isExpanded ? null : segment.segment_name);
                }}
                className="p-1 rounded transition-colors hover:bg-purple-50"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* Radar Chart */}
            <div className="flex justify-center mb-4">
              <RadarChart
                data={radarData}
                color={segment.color || '#6b7280'}
                size={140}
              />
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg p-3" style={{ backgroundColor: '#f9fafb' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: '#7a6a7c' }}>Avg LTV</span>
                  {segment.ltv_trend > 0 ? (
                    <ArrowUp className="w-3 h-3 text-green-500" />
                  ) : segment.ltv_trend < 0 ? (
                    <ArrowDown className="w-3 h-3 text-red-500" />
                  ) : null}
                </div>
                <p className="text-sm font-semibold" style={{ color: '#5a4a5c' }}>
                  ${(segment.avg_lifetime_value || 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#f9fafb' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: '#7a6a7c' }}>Avg AOV</span>
                  {segment.order_trend > 0 ? (
                    <ArrowUp className="w-3 h-3 text-green-500" />
                  ) : segment.order_trend < 0 ? (
                    <ArrowDown className="w-3 h-3 text-red-500" />
                  ) : null}
                </div>
                <p className="text-sm font-semibold" style={{ color: '#5a4a5c' }}>
                  ${(segment.avg_order_value || 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#f9fafb' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: '#7a6a7c' }}>Frequency</span>
                  {segment.frequency_trend > 0 ? (
                    <ArrowUp className="w-3 h-3 text-green-500" />
                  ) : segment.frequency_trend < 0 ? (
                    <ArrowDown className="w-3 h-3 text-red-500" />
                  ) : null}
                </div>
                <p className="text-sm font-semibold" style={{ color: '#5a4a5c' }}>
                  {(segment.avg_frequency || 0).toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#f9fafb' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: '#7a6a7c' }}>Recency</span>
                  {segment.recency_trend < 0 ? (
                    <ArrowUp className="w-3 h-3 text-green-500" />
                  ) : segment.recency_trend > 0 ? (
                    <ArrowDown className="w-3 h-3 text-red-500" />
                  ) : null}
                </div>
                <p className="text-sm font-semibold" style={{ color: '#5a4a5c' }}>
                  {Math.round(segment.avg_recency || 0)}d
                </p>
              </div>
            </div>


            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e8d4e6' }}>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold mb-2" style={{ color: '#5a4a5c' }}>Segment Details</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: '#7a6a7c' }}>Total Customers:</span>
                        <span className="font-medium">{segment.customer_count?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: '#7a6a7c' }}>Total Revenue:</span>
                        <span className="font-medium">${(segment.total_spend || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: '#7a6a7c' }}>Avg Transactions:</span>
                        <span className="font-medium">{segment.transaction_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: '#7a6a7c' }}>RFM Score:</span>
                        <span className="font-medium">{segment.rfm_rl_score?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}