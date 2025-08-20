import React, { useState, useMemo } from 'react';

const SegmentProfileCards = ({
  segmentDistribution = [],
  segmentComparison = [],
  selectedSegment = null,
  onSegmentSelect,
  onSegmentExport,
  onSegmentAnalyze
}) => {
  const [expandedCard, setExpandedCard] = useState(null);
  const [cardSortBy, setCardSortBy] = useState('customer_count'); // 'customer_count', 'avg_lifetime_value', 'name'

  // Segment color mapping
  const segmentColors = {
    'Champions': '#00e0ff',
    'Loyal Customers': '#5fd4d6',
    'Potential Loyalists': '#e930ff',
    'New Customers': '#aa45dd',
    'Promising': '#43cad0',
    'Need Attention': '#fbbf24',
    'About to Sleep': '#f59133',
    'At Risk': '#dc2626',
    'Cannot Lose Them': '#7c3aed',
    'Hibernating': '#64748b'
  };

  const getSegmentColor = (segmentName) => segmentColors[segmentName] || '#64748b';

  // Merge distribution and comparison data
  const mergedSegmentData = useMemo(() => {
    const merged = segmentDistribution.map(distData => {
      const compData = segmentComparison.find(comp => comp.segment_name === distData.segment_name) || {};
      return {
        ...distData,
        ...compData
      };
    });

    // Sort segments
    return merged.sort((a, b) => {
      switch (cardSortBy) {
        case 'customer_count':
          return (b.customer_count || 0) - (a.customer_count || 0);
        case 'avg_lifetime_value':
          return (b.avg_lifetime_value || 0) - (a.avg_lifetime_value || 0);
        case 'name':
          return (a.segment_name || '').localeCompare(b.segment_name || '');
        default:
          return 0;
      }
    });
  }, [segmentDistribution, segmentComparison, cardSortBy]);

  // Calculate segment value tier (stars)
  const getValueTier = (avgLifetimeValue) => {
    if (avgLifetimeValue >= 20000) return 5;
    if (avgLifetimeValue >= 15000) return 4;
    if (avgLifetimeValue >= 10000) return 3;
    if (avgLifetimeValue >= 5000) return 2;
    return 1;
  };

  // Generate radar chart data points
  const getRadarData = (segment) => {
    const maxValues = {
      lifetime_value: 30000,
      avg_order_value: 1000,
      transaction_count: 50,
      avg_frequency: 12,
      avg_recency: 365
    };

    return [
      { label: 'Value', value: Math.min((segment.avg_lifetime_value || 0) / maxValues.lifetime_value * 100, 100) },
      { label: 'Order Size', value: Math.min((segment.avg_order_value || 0) / maxValues.avg_order_value * 100, 100) },
      { label: 'Frequency', value: Math.min((segment.transaction_count || 0) / maxValues.transaction_count * 100, 100) },
      { label: 'Engagement', value: Math.min((segment.avg_frequency || 0) / maxValues.avg_frequency * 100, 100) },
      { label: 'Recency', value: Math.max(100 - ((segment.avg_recency || 0) / maxValues.avg_recency * 100), 0) }
    ];
  };

  // Radar chart SVG component
  const RadarChart = ({ data, color, size = 180 }) => {
    const center = size / 2;
    const maxRadius = size / 2 - 20;
    const angles = data.map((_, i) => (i * 2 * Math.PI) / data.length - Math.PI / 2);

    // Create path for the radar area
    const pathData = data
      .map((point, i) => {
        const radius = (point.value / 100) * maxRadius;
        const x = center + Math.cos(angles[i]) * radius;
        const y = center + Math.sin(angles[i]) * radius;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ') + ' Z';

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
            stroke="#f7f9fb"
            strokeWidth="1"
            opacity="0.2"
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
            stroke="#f7f9fb"
            strokeWidth="1"
            opacity="0.2"
          />
        ))}
        
        {/* Data area */}
        <path
          d={pathData}
          fill={color}
          fillOpacity="0.3"
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
              r="4"
              fill={color}
              stroke="#f7f9fb"
              strokeWidth="2"
            />
          );
        })}
        
        {/* Labels */}
        {data.map((point, i) => {
          const labelRadius = maxRadius + 15;
          const x = center + Math.cos(angles[i]) * labelRadius;
          const y = center + Math.sin(angles[i]) * labelRadius;
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#f7f9fb"
              fontSize="10"
              fontWeight="500"
            >
              {point.label}
            </text>
          );
        })}
      </svg>
    );
  };

  if (!segmentDistribution || segmentDistribution.length === 0) {
    return (
      <div 
        className="rounded-2xl border shadow-lg p-8 text-center"
        style={{
          background: 'linear-gradient(135deg, #232a36 0%, #2c3341 100%)',
          border: '1px solid #3a4459'
        }}
      >
        <div className="text-6xl mb-6 opacity-40">🎯</div>
        <h3 className="text-cloud-white text-xl font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          No Segment Profiles
        </h3>
        <p className="text-cloud-white/60">
          Segment distribution data is not available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with sorting controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-cloud-white font-bold text-2xl mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Segment Profiles
          </h3>
          <p className="text-cloud-white/60">
            {mergedSegmentData.length} segments identified
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-cloud-white/70 text-sm font-medium">Sort by:</label>
          <select
            value={cardSortBy}
            onChange={(e) => setCardSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            style={{
              background: '#1a2332',
              border: '1px solid #3a4459',
              color: '#f7f9fb'
            }}
          >
            <option value="customer_count">Customer Count</option>
            <option value="avg_lifetime_value">Lifetime Value</option>
            <option value="name">Segment Name</option>
          </select>
        </div>
      </div>

      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mergedSegmentData.map((segment, index) => {
          const segmentColor = getSegmentColor(segment.segment_name);
          const isExpanded = expandedCard === segment.segment_name;
          const isSelected = selectedSegment === segment.segment_name;
          const valueTier = getValueTier(segment.avg_lifetime_value || 0);
          const radarData = getRadarData(segment);

          return (
            <div
              key={segment.segment_name}
              className={`group relative rounded-2xl border shadow-lg transition-all duration-300 cursor-pointer overflow-hidden ${
                isSelected ? 'ring-2 ring-opacity-60 scale-105' : 'hover:scale-102 hover:shadow-xl'
              }`}
              style={{
                background: 'linear-gradient(135deg, #232a36 0%, #2c3341 100%)',
                border: `1px solid ${segmentColor}40`,
                minHeight: isExpanded ? '500px' : '400px',
                ringColor: isSelected ? segmentColor : 'transparent',
                animationDelay: `${index * 50}ms`
              }}
              onClick={(e) => {
                onSegmentSelect?.(segment.segment_name, e);
                if (!e.shiftKey) {
                  setExpandedCard(isExpanded ? null : segment.segment_name);
                }
              }}
            >
              {/* Hover effect overlay */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{ background: segmentColor }}
              />
              
              {/* Segment color bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-2"
                style={{ background: segmentColor }}
              />
              
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div 
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: segmentColor }}
                  />
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="space-y-2">
                  <h4 
                    className="text-xl font-bold transition-colors duration-200"
                    style={{ 
                      color: segmentColor,
                      fontFamily: 'Inter, sans-serif' 
                    }}
                  >
                    {segment.segment_name}
                  </h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-cloud-white/70 text-sm">
                      {(segment.customer_count || 0).toLocaleString()} customers
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg transition-all duration-200 ${
                            i < valueTier ? 'opacity-100' : 'opacity-30'
                          }`}
                          style={{ color: segmentColor }}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-cloud-white/60 text-sm">
                    {((segment.customer_count || 0) / mergedSegmentData.reduce((sum, s) => sum + (s.customer_count || 0), 0) * 100).toFixed(1)}% of total customers
                  </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { 
                      label: 'Avg Lifetime Value', 
                      value: `$${((segment.avg_lifetime_value || 0)).toLocaleString()}`,
                      change: segment.ltv_trend || 0
                    },
                    { 
                      label: 'Avg Order Value', 
                      value: `$${(segment.avg_order_value || 0).toLocaleString()}`,
                      change: segment.order_trend || 0
                    },
                    { 
                      label: 'Avg Frequency', 
                      value: `${(segment.avg_frequency || 0).toFixed(1)}`,
                      change: segment.frequency_trend || 0
                    },
                    { 
                      label: 'Avg Recency', 
                      value: `${Math.round(segment.avg_recency || 0)}d`,
                      change: segment.recency_trend || 0
                    }
                  ].map((kpi, i) => (
                    <div 
                      key={i}
                      className="p-3 rounded-lg"
                      style={{ background: '#1a2332' }}
                    >
                      <div 
                        className="text-lg font-bold"
                        style={{ color: segmentColor }}
                      >
                        {kpi.value}
                      </div>
                      <div className="text-cloud-white/60 text-xs mt-1">
                        {kpi.label}
                      </div>
                      {kpi.change !== 0 && (
                        <div className={`text-xs mt-1 flex items-center gap-1 ${
                          kpi.change > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          <span>{kpi.change > 0 ? '↗' : '↘'}</span>
                          <span>{Math.abs(kpi.change).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Radar Chart */}
                <div className="flex justify-center">
                  <RadarChart 
                    data={radarData} 
                    color={segmentColor} 
                    size={140}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSegmentExport?.(segment.segment_name);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      background: `${segmentColor}20`,
                      color: segmentColor,
                      border: `1px solid ${segmentColor}40`
                    }}
                  >
                    Export
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSegmentAnalyze?.(segment.segment_name);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      background: '#00e0ff20',
                      color: '#00e0ff',
                      border: '1px solid #00e0ff40'
                    }}
                  >
                    Analyze
                  </button>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="pt-4 border-t border-white/10 space-y-4 animate-fadeIn">
                    {/* Behavioral Highlights */}
                    <div>
                      <h5 className="text-cloud-white font-semibold text-sm mb-2">Key Characteristics</h5>
                      <div className="space-y-2">
                        {segment.characteristics?.slice(0, 3).map((char, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span style={{ color: segmentColor }}>•</span>
                            <span className="text-cloud-white/70">{char}</span>
                          </div>
                        )) || (
                          <div className="text-cloud-white/50 text-sm">
                            Behavioral analysis in progress...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Marketing Recommendations */}
                    <div>
                      <h5 className="text-cloud-white font-semibold text-sm mb-2">Recommendations</h5>
                      <div className="space-y-2">
                        {segment.recommendations?.slice(0, 2).map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span style={{ color: segmentColor }} className="mt-1">→</span>
                            <span className="text-cloud-white/70">{rec}</span>
                          </div>
                        )) || (
                          <div className="text-cloud-white/50 text-sm">
                            Marketing strategies being generated...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SegmentProfileCards; 