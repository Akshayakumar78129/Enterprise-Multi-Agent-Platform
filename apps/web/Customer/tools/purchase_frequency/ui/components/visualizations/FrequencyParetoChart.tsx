import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react';
import { HistogramData } from '../../types';
import { handleChartClick } from '../../utils/chartSelectionHelper';

export interface FrequencyParetoChartProps {
  data: HistogramData[]; // expects bins with count
  width?: number;
  height?: number;
  title?: string;
  onThresholdChange?: (thresholdBin: number, cumulativePct: number) => void;
  onChartElementClick?: (clickData: any) => void;
  onHoverInsight?: (info: { title: string; lines: string[] } | null) => void;
  selectedPoints?: Array<{ chartId: string; index: number }>;
  componentId?: string;
}

const FrequencyParetoChart = forwardRef<any, FrequencyParetoChartProps>(({ 
  data, 
  width = 560, 
  height = 380, 
  title = 'Frequency Pareto (80/20) Analysis',
  onThresholdChange,
  onChartElementClick,
  onHoverInsight,
  selectedPoints = [],
  componentId = 'frequency-pareto'
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [thresholdIndex, setThresholdIndex] = useState<number | null>(null);
  const [lock80, setLock80] = useState<boolean>(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [hoverTooltip, setHoverTooltip] = useState<{ x: number; y: number; content: any } | null>(null);

  const sorted = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return [...data].sort((a, b) => b.count - a.count);
  }, [data]);
  
  const total = useMemo(() => sorted.reduce((s, d) => s + (d.count || 0), 0) || 1, [sorted]);
  
  const cumulative = useMemo(() => {
    let sum = 0;
    return sorted.map((d) => { sum += (d.count || 0); return { bin: d.bin, count: d.count, cum: sum, pct: (sum / total) * 100 }; });
  }, [sorted, total]);

  // Generate advanced key insights with business intelligence
  useEffect(() => {
    if (!sorted.length) return;

    const insights = [];
    const topBin = sorted[0];
    const idx80 = cumulative.findIndex(d => d.pct >= 80);
    const idx50 = cumulative.findIndex(d => d.pct >= 50);
    const idx20 = cumulative.findIndex(d => d.pct >= 20);
    
    // Most frequent segment with business context
    const topFreqShare = (topBin.count / total) * 100;
    const topFreqInsight = topFreqShare > 20 ? 'Dominant segment' : topFreqShare > 10 ? 'Major segment' : 'Balanced distribution';
    insights.push(`🏆 Peak frequency (${topBin.bin}x): ${topBin.count.toLocaleString()} customers (${topFreqShare.toFixed(1)}%) - ${topFreqInsight}`);
    
    // 80/20 Rule analysis with efficiency rating
    if (idx80 >= 0) {
      const bins80 = idx80 + 1;
      const binEfficiency = (bins80 / sorted.length) * 100;
      const efficiency = binEfficiency < 20 ? 'Highly efficient' : binEfficiency < 40 ? 'Moderately efficient' : 'Needs focus';
      insights.push(`🎯 80/20 Rule: ${bins80} frequency tiers (${binEfficiency.toFixed(1)}% of segments) = 80% customers - ${efficiency}`);
    }
    
    // Champions analysis (top 20% cumulative)
    if (idx20 >= 0) {
      const championTiers = idx20 + 1;
      const championCount = cumulative[idx20].cum;
      const championShare = (championCount / total) * 100;
      insights.push(`⭐ Top performers: ${championTiers} frequency tiers drive ${championShare.toFixed(1)}% of customer engagement`);
    }
    
    // Distribution concentration analysis
    const top3Concentration = sorted.slice(0, Math.min(3, sorted.length)).reduce((sum, d) => sum + d.count, 0) / total * 100;
    const concentrationLevel = top3Concentration > 60 ? 'Highly concentrated' : top3Concentration > 40 ? 'Moderately concentrated' : 'Well distributed';
    insights.push(`📊 Market concentration: Top 3 frequencies = ${top3Concentration.toFixed(1)}% of customers - ${concentrationLevel}`);
    
    // Customer segmentation with actionable insights
    const champions = sorted.filter(d => d.bin >= 10).reduce((sum, d) => sum + d.count, 0);
    const loyal = sorted.filter(d => d.bin >= 5 && d.bin < 10).reduce((sum, d) => sum + d.count, 0);
    const occasional = sorted.filter(d => d.bin >= 3 && d.bin < 5).reduce((sum, d) => sum + d.count, 0);
    const atRisk = sorted.filter(d => d.bin <= 2).reduce((sum, d) => sum + d.count, 0);
    
    if (champions > 0) {
      const champPct = (champions / total) * 100;
      insights.push(`🏆 Champions (10+ purchases): ${champPct.toFixed(1)}% - Focus on retention & VIP programs`);
    }
    
    if (atRisk > 0) {
      const riskPct = (atRisk / total) * 100;
      const urgency = riskPct > 30 ? 'High priority' : riskPct > 15 ? 'Medium priority' : 'Monitor closely';
      insights.push(`⚠️ At-risk customers (≤2 purchases): ${riskPct.toFixed(1)}% - ${urgency} re-engagement needed`);
    }
    
    // Frequency diversity and market maturity
    const diversityIndex = sorted.length / Math.log(total + 1);
    const maturityLevel = diversityIndex > 8 ? 'Mature market' : diversityIndex > 5 ? 'Developing market' : 'Early stage market';
    insights.push(`🎨 Purchase diversity: ${sorted.length} unique frequencies - ${maturityLevel} with varied engagement`);

    setKeyPoints(insights);
  }, [sorted, cumulative, total]);

  const margin = { top: 20, right: 70, bottom: 60, left: 70 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const maxCount = Math.max(...sorted.map(d => d.count || 0), 1);

  useImperativeHandle(ref, () => ({
    setThresholdByPct: (pct: number) => {
      const idx = cumulative.findIndex(d => d.pct >= pct);
      if (idx >= 0) {
        setThresholdIndex(idx);
        onThresholdChange?.(cumulative[idx].bin, cumulative[idx].pct);
      }
    },
    reset: () => setThresholdIndex(null)
  }), [cumulative, onThresholdChange]);

  const xStep = innerW / sorted.length;

  const handlePointerDown = (e: React.MouseEvent<SVGLineElement, MouseEvent> | React.MouseEvent<SVGRectElement, MouseEvent>, idx: number) => {
    setDragging(true);
    setThresholdIndex(idx);
    onThresholdChange?.(cumulative[idx].bin, cumulative[idx].pct);
  };

  const handlePointerMove = (e: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    if (!dragging) return;
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left - margin.left;
    const idx = Math.max(0, Math.min(sorted.length - 1, Math.round(x / xStep)));
    setThresholdIndex(idx);
    onThresholdChange?.(cumulative[idx].bin, cumulative[idx].pct);
  };

  const handlePointerUp = () => setDragging(false);

  // Early return if no data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ width, height: height + 60, position: 'relative', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2937' }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: height - 40, color: '#94a3b8', fontSize: 14 }}>
          No data available
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width, height: height + 60, position: 'relative', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', overflow: 'visible', border: '1px solid rgba(59,130,246,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2937', flex: 1 }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ color: '#475569', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={lock80} onChange={(e) => {
              const v = e.currentTarget.checked;
              setLock80(v);
              if (v) {
                const idx = cumulative.findIndex(d => d.pct >= 80);
                if (idx >= 0) setThresholdIndex(idx);
              }
            }} /> Lock at 80%
          </label>
        </div>
      </div>
      
      {/* Segment Legend */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: 12, 
        fontSize: 10, 
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {[
          { label: 'Champions (10+)', color: '#10b981' },
          { label: 'Loyal (5-9)', color: '#3b82f6' },
          { label: 'Regular (3-4)', color: '#f59e0b' },
          { label: 'Occasional (2)', color: '#ef4444' },
          { label: 'At Risk (1)', color: '#dc2626' }
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              backgroundColor: color, 
              borderRadius: 2,
              opacity: 0.9
            }} />
            <span style={{ color: '#334155', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>
      <svg width={width - 32} height={height - 80} onMouseUp={handlePointerUp}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(p => (
            <line 
              key={`grid-${p}`} 
              x1={0} 
              y1={innerH - (p / 100) * innerH} 
              x2={innerW} 
              y2={innerH - (p / 100) * innerH} 
              stroke="rgba(136, 147, 167, 0.2)" 
              strokeWidth={p === 0 ? 1 : 0.5}
              strokeDasharray={p === 0 ? "none" : "2 2"}
            />
          ))}
          
          {/* Vertical grid lines for major frequency bins */}
          {sorted.filter((_, i) => i % Math.max(1, Math.floor(sorted.length / 10)) === 0).map((d, i) => {
            const actualIndex = sorted.findIndex(item => item.bin === d.bin);
            return (
              <line 
                key={`vgrid-${d.bin}`} 
                x1={actualIndex * xStep + xStep / 2} 
                y1={0} 
                x2={actualIndex * xStep + xStep / 2} 
                y2={innerH} 
                stroke="rgba(136, 147, 167, 0.1)" 
                strokeWidth={0.5}
                strokeDasharray="2 2"
              />
            );
          })}
          
          {/* Axes */}
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#8893a7" strokeWidth={2} />
          <line x1={0} y1={0} x2={0} y2={innerH} stroke="#8893a7" strokeWidth={1} />
          <line x1={innerW} y1={0} x2={innerW} y2={innerH} stroke="#8893a7" strokeWidth={1} />

          {/* Enhanced Bars with Segment Color Coding */}
          {sorted.map((d, i) => {
            const barH = (d.count / maxCount) * innerH;
            const isUnder = thresholdIndex != null && i <= thresholdIndex;
            const isSelected = Array.isArray(selectedPoints) && selectedPoints.some(sp => sp.chartId === 'frequency_pareto' && (sp.index === i || sp.index === d.bin));
            
            // Segment-based color coding
            let segmentColor = '#00e0ff'; // Default
            if (d.bin >= 10) segmentColor = '#10b981'; // Champions - Green
            else if (d.bin >= 5) segmentColor = '#3b82f6'; // Loyal - Blue  
            else if (d.bin >= 3) segmentColor = '#f59e0b'; // Regular - Orange
            else if (d.bin === 2) segmentColor = '#ef4444'; // Occasional - Red
            else segmentColor = '#dc2626'; // At Risk - Dark Red
            
            const barColor = isSelected ? 'rgba(16,185,129,0.8)' : 
                           hoverIdx === i ? `${segmentColor}CC` : 
                           isUnder ? `${segmentColor}99` : `${segmentColor}66`;
            
            return (
              <g key={`bar-${i}`}>
                <rect
                  x={i * xStep + 2}
                  y={innerH - barH}
                  width={Math.max(2, xStep - 4)}
                  height={barH}
                  fill={barColor}
                  stroke={isSelected ? '#10b981' : hoverIdx === i ? segmentColor : 'transparent'}
                  strokeWidth={isSelected ? 3 : hoverIdx === i ? 2 : 0}
                  onMouseDown={(e) => handlePointerDown(e, i)}
                  onMouseMove={(e) => {
                    setHoverIdx(i);
                    handlePointerMove(e);
                    
                    // Get mouse position relative to the container
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      
                      try {
                        const pct = cumulative[i]?.pct ?? 0;
                        const count = sorted[i]?.count ?? 0;
                        const bin = sorted[i]?.bin ?? 0;
                        
                        // Advanced business insights with actionable recommendations
                        let businessInsight = '';
                        let segmentType = '';
                        let actionableAdvice = '';
                        
                        if (bin >= 10) {
                          businessInsight = '🏆 Champion customers - Highest engagement tier';
                          segmentType = 'Champions';
                          actionableAdvice = 'Implement VIP programs, exclusive offers, and referral incentives';
                        } else if (bin >= 5) {
                          businessInsight = '⭐ Loyal customers - Strong repeat purchase behavior';
                          segmentType = 'Loyal';
                          actionableAdvice = 'Focus on upselling, cross-selling, and loyalty rewards';
                        } else if (bin >= 3) {
                          businessInsight = '📈 Regular customers - Moderate engagement level';
                          segmentType = 'Regular';
                          actionableAdvice = 'Increase purchase frequency through targeted campaigns';
                        } else if (bin === 2) {
                          businessInsight = '🔄 Occasional buyers - Limited engagement';
                          segmentType = 'Occasional';
                          actionableAdvice = 'Re-engagement campaigns and personalized recommendations';
                        } else {
                          businessInsight = '⚠️ One-time buyers - High churn risk';
                          segmentType = 'At Risk';
                          actionableAdvice = 'Immediate win-back campaigns and onboarding improvements';
                        }
                        
                        // Calculate segment performance metrics
                        const segmentValue = count * bin; // Total purchase instances
                        const avgCustomerValue = segmentValue / count;
                        const marketShare = (count / total) * 100;
                        const cumulativeImpact = pct;
                        
                        // Set enhanced tooltip content
                        setHoverTooltip({
                          x: Math.min(x + 10, width - 320),
                          y: Math.max(y - 140, 10),
                          content: {
                            bin,
                            count,
                            pct: cumulativeImpact,
                            share: marketShare,
                            businessInsight,
                            segmentType,
                            actionableAdvice,
                            segmentValue,
                            avgCustomerValue: avgCustomerValue.toFixed(1)
                          }
                        });
                        
                        // Enhanced external hover insight
                        onHoverInsight?.({
                          title: `${segmentType} Segment: ${bin} Purchase${bin !== 1 ? 's' : ''}`,
                          lines: [
                            `👥 Customer Count: ${count.toLocaleString()} (${marketShare.toFixed(1)}% of base)`,
                            `📊 Cumulative Impact: ${cumulativeImpact.toFixed(1)}% of customer base`,
                            `💼 Total Purchase Instances: ${segmentValue.toLocaleString()}`,
                            `📈 Avg Engagement Score: ${avgCustomerValue} purchases per customer`,
                            businessInsight,
                            `🎯 Strategy: ${actionableAdvice}`,
                            '💡 Click to analyze this segment in detail'
                          ]
                        });
                      } catch {}
                    }
                  }}
                  onMouseLeave={() => { 
                    setHoverIdx(null); 
                    setHoverTooltip(null);
                    try { onHoverInsight?.(null); } catch {} 
                  }}
                  onClick={(e) => {
                    try {
                      const pct = cumulative[i]?.pct ?? 0;
                      const count = sorted[i]?.count ?? 0;
                      const bin = sorted[i]?.bin ?? 0;

                      // Shift-only interactions
                      if (!(e as any)?.shiftKey) return;
                      handleChartClick({
                        chartId: 'frequency_pareto',
                        chartType: 'Frequency Pareto',
                        label: `Bin ${bin}`,
                        value: count,
                        unit: 'customers',
                        index: i,
                        metadata: { bin, cumulativePct: pct }
                      }, (e as any)?.nativeEvent ?? e, true);
                      const clickData = {
                        label: `Bin ${bin}: ${count.toLocaleString()} customers (cum ${pct.toFixed(1)}%)`,
                        value: count,
                        clientX: (e as any)?.clientX,
                        clientY: (e as any)?.clientY,
                        shiftKey: true
                      };
                      onChartElementClick?.(clickData);
                      return;
                    } catch {}
                  }}
                  style={{ cursor: 'ew-resize' }}
                />
              </g>
            );
          })}

          {/* Cumulative line with gradient */}
          <defs>
            <linearGradient id="cumulativeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e930ff" stopOpacity="0.8"/>
              <stop offset="50%" stopColor="#00e0ff" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Cumulative line with points */}
          <path
            d={`M ${sorted.map((_, i) => `${i * xStep + xStep / 2},${innerH - (cumulative[i].pct / 100) * innerH}`).join(' L ')}`}
            fill="none"
            stroke="url(#cumulativeGradient)"
            strokeWidth={3}
            filter="url(#glow)"
          />
          
          {/* Cumulative line points */}
          {sorted.map((_, i) => (
            <circle
              key={`cum-point-${i}`}
              cx={i * xStep + xStep / 2}
              cy={innerH - (cumulative[i].pct / 100) * innerH}
              r={hoverIdx === i ? 4 : 2}
              fill={cumulative[i].pct >= 80 ? "#10b981" : cumulative[i].pct >= 50 ? "#00e0ff" : "#e930ff"}
              stroke="#ffffff"
              strokeWidth={1}
              opacity={hoverIdx === i ? 1 : 0.8}
            />
          ))}

          {/* 80% reference line with label */}
          <line x1={0} y1={innerH * (1 - 0.8)} x2={innerW} y2={innerH * (1 - 0.8)} stroke="#e930ff" strokeDasharray="6 4" strokeWidth={2} opacity={0.7} />
          <text x={innerW - 60} y={innerH * (1 - 0.8) - 6} fill="#e930ff" fontSize={11} fontWeight="600">80% Rule</text>

          {/* Threshold handle */}
          {thresholdIndex != null && (
            <g>
              <line x1={thresholdIndex * xStep + xStep / 2} y1={0} x2={thresholdIndex * xStep + xStep / 2} y2={innerH} stroke="#00e0ff" strokeWidth={2} />
              <rect x={thresholdIndex * xStep + xStep / 2 - 4} y={-6} width={8} height={12} fill="#00e0ff" rx={2} ry={2}
                onMouseDown={(e) => handlePointerDown(e, thresholdIndex)} onMouseMove={handlePointerMove} />
            </g>
          )}

          {/* X labels */}
          {sorted.map((d, i) => (
            <text key={`xlab-${i}`} x={i * xStep + xStep / 2} y={innerH + 16} textAnchor="middle" fill="#8893a7" fontSize={10}>
              {d.bin}
            </text>
          ))}
          
          {/* X axis title */}
          <text x={innerW / 2} y={innerH + 32} textAnchor="middle" fill="#cdd6e5" fontSize={10} fontWeight="600">
            Purchase Frequency (Number of Purchases)
          </text>

          {/* Y labels left side for customer count */}
          {Array.from({length: 6}, (_, i) => {
            const value = (maxCount / 5) * i;
            return (
              <text key={`yleft-${i}`} x={-8} y={innerH - (i / 5) * innerH} textAnchor="end" fill="#8893a7" fontSize={10} dominantBaseline="middle">
                {value >= 1000 ? `${(value/1000).toFixed(0)}K` : value.toFixed(0)}
              </text>
            );
          })}
          
          {/* Y axis title left */}
          <text x={-32} y={innerH / 2} textAnchor="middle" fill="#cdd6e5" fontSize={10} fontWeight="600" transform={`rotate(-90, -32, ${innerH / 2})`}>
            Customers
          </text>

          {/* Y labels right side cumulative % */}
          {[0, 25, 50, 75, 100].map(p => (
            <text key={`ylab-${p}`} x={innerW + 8} y={innerH - (p / 100) * innerH} fill="#8893a7" fontSize={10} dominantBaseline="middle">{p}%</text>
          ))}
          
          {/* Y axis title right */}
          <text x={innerW + 42} y={innerH / 2} textAnchor="middle" fill="#cdd6e5" fontSize={10} fontWeight="600" transform={`rotate(90, ${innerW + 42}, ${innerH / 2})`}>
            Cumulative %
          </text>
        </g>
      </svg>

      {/* Info bubble */}
      {thresholdIndex != null && (
        <div style={{ 
          position: 'absolute', 
          top: 40, 
          right: 12, 
          backgroundColor: 'rgba(35,42,54,0.92)', 
          color: '#f7f9fb', 
          border: '1px solid #3a4459', 
          borderRadius: 6, 
          padding: '4px 6px', 
          fontSize: 10,
          zIndex: 10
        }}>
          Top {thresholdIndex + 1} bins = {cumulative[thresholdIndex].pct.toFixed(1)}%
        </div>
      )}

      {/* Hover Tooltip */}
      {hoverTooltip && (
        <div style={{
          position: 'absolute',
          left: hoverTooltip.x,
          top: hoverTooltip.y,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '2px solid #00e0ff',
          borderRadius: 12,
          padding: '12px 16px',
          fontSize: 12,
          color: '#f8fafc',
          boxShadow: '0 8px 32px rgba(0, 224, 255, 0.3)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          minWidth: 260,
          maxWidth: 320
        }}>
          <div style={{ 
            fontWeight: 700, 
            marginBottom: 8, 
            color: '#00e0ff', 
            fontSize: 14,
            borderBottom: '1px solid rgba(0, 224, 255, 0.3)',
            paddingBottom: 6
          }}>
            🎯 Frequency: {hoverTooltip.content.bin} purchases
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginBottom: 10 }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>Customers</div>
              <div style={{ color: '#f8fafc', fontWeight: 600 }}>{hoverTooltip.content.count.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>Market Share</div>
              <div style={{ color: '#f8fafc', fontWeight: 600 }}>{hoverTooltip.content.share.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>Cumulative</div>
              <div style={{ color: '#00e0ff', fontWeight: 600 }}>{hoverTooltip.content.pct.toFixed(1)}%</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>Segment</div>
              <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: 11 }}>{hoverTooltip.content.segmentType}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>Total Purchases</div>
              <div style={{ color: '#10b981', fontWeight: 600 }}>{hoverTooltip.content.segmentValue.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 2 }}>Avg Engagement</div>
              <div style={{ color: '#10b981', fontWeight: 600 }}>{hoverTooltip.content.avgCustomerValue}</div>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: 'rgba(0, 224, 255, 0.1)', 
            borderRadius: 6, 
            padding: '8px 10px',
            fontSize: 11,
            lineHeight: 1.4,
            color: '#e2e8f0',
            marginBottom: 8
          }}>
            {hoverTooltip.content.businessInsight}
          </div>
          
          <div style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
            borderRadius: 6, 
            padding: '6px 8px',
            fontSize: 10,
            lineHeight: 1.3,
            color: '#a7f3d0',
            fontWeight: 500
          }}>
            💡 {hoverTooltip.content.actionableAdvice}
          </div>
          
          <div style={{ 
            marginTop: 8, 
            fontSize: 10, 
            color: '#64748b',
            textAlign: 'center',
            borderTop: '1px solid rgba(100, 116, 139, 0.2)',
            paddingTop: 6
          }}>
            💡 Click to analyze this segment in detail
          </div>
        </div>
      )}

      {/* Key Points Panel */}
      {keyPoints && keyPoints.length > 0 && (
        <div style={{
          marginTop: '8px',
          backgroundColor: 'rgba(35,42,54,0.95)',
          border: '1px solid rgba(0,224,255,0.2)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 10,
          color: '#d6e3f1'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: '#00e0ff', fontSize: 11 }}>📊 Key Insights</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4px' }}>
            {keyPoints.slice(0, 4).map((point, idx) => (
              <div key={idx} style={{ 
                fontSize: 9, 
                lineHeight: 1.3,
                padding: '3px 6px',
                backgroundColor: 'rgba(0, 224, 255, 0.05)',
                borderRadius: 3,
                border: '1px solid rgba(0, 224, 255, 0.1)'
              }}>
                {point}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

FrequencyParetoChart.displayName = 'FrequencyParetoChart';
export default FrequencyParetoChart;