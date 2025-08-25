import React, { useState, useEffect } from 'react';

interface QuickInsightsAssistantProps {
  isVisible: boolean;
  position: { x: number; y: number };
  dataPoint?: any & { isMultiSelection?: boolean; analysis?: { insights: string[] } };
  chartType?: 'timeseries' | 'seasonal' | 'growth' | 'kpi' | 'multi-selection';
  chartInfo?: {
    title: string;
    description: string;
    purpose: string;
    calc?: string;
    drivers?: string;
    action?: string;
    benchmark?: string;
  };
  onClose: () => void;
  dashboardState?: any;
}

const QuickInsightsAssistant: React.FC<QuickInsightsAssistantProps> = ({
  isVisible,
  position,
  dataPoint,
  chartType,
  chartInfo,
  onClose,
  dashboardState
}) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate insights when component becomes visible
  useEffect(() => {
    if (isVisible) {
      setIsLoading(true);
      
      // Simulate AI processing
      setTimeout(() => {
        if (dataPoint) {
          // Check if this is multi-selection data
          if (dataPoint.isMultiSelection && dataPoint.analysis) {
            // Multi-selection analysis
            const analysis = dataPoint.analysis;
            setInsights(analysis.insights);
            setIsLoading(false);
            return;
          }
          
          // Enhanced data point insights for single selections
          const value = Number(dataPoint.value || 0);
          const date = String(dataPoint.date || dataPoint.period || 'Unknown');
          const metricName = String(dataPoint.metricName || 'metric');
          const percentChange = typeof dataPoint.percentChange === 'number' ? dataPoint.percentChange : undefined;
          const previousValue = typeof dataPoint.previousValue === 'number' ? dataPoint.previousValue : undefined;

          const insights: string[] = [];

          // Parse YYYY-MM to Year/Month safely
          const parseYearMonth = (d: string) => {
            const m = d.match(/^(\d{4})-(\d{2})/);
            if (!m) return { year: dataPoint.year, month: dataPoint.month };
            return { year: m[1], month: m[2] };
          };
          const ym = parseYearMonth(date);

          // Performance analysis with thresholds
          if (dataPoint.isAverage) {
            insights.push(`• Average seasonal performance across all years for month ${ym?.month || ''}`.trim());
            if (percentChange !== undefined && Math.abs(percentChange) > 1) {
              const direction = percentChange > 0 ? 'above' : 'below';
              insights.push(`• Current year is ${Math.abs(percentChange).toFixed(1)}% ${direction} the average for this month.`);
            }
          } else if (percentChange !== undefined) {
            const tone = percentChange > 15 ? 'Excellent' : percentChange > 5 ? 'Good' : percentChange > -5 ? 'Stable' : 'Decline';
            insights.push(`• ${tone} growth: ${percentChange.toFixed(1)}% vs same month last year.`);
          }

          // Value and previous value context
          const isMoney = /revenue|value|aov/i.test(metricName);
          const isPct = /rate|margin|%/i.test(metricName);
          const fmtMoney = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
          const fmtNum = (n: number) => n.toLocaleString();
          const fmtPct = (n: number) => `${n.toFixed(1)}%`;

          const currentStr = isMoney ? fmtMoney(value) : isPct ? fmtPct(value * (isPct && value <= 1 ? 100 : 1)) : fmtNum(value);
          insights.push(`• ${metricName}: ${currentStr} (${date}).`);

          if (previousValue !== undefined) {
            const prevStr = isMoney ? fmtMoney(previousValue) : isPct ? fmtPct(previousValue * (isPct && previousValue <= 1 ? 100 : 1)) : fmtNum(previousValue);
            insights.push(`• Previous period: ${prevStr}. Change: ${percentChange !== undefined ? percentChange.toFixed(1) + '%' : 'n/a'}.`);
          }

          // Human-friendly interpretation and action
          const prettyMetric = (name: string) => {
            if (/revenue/i.test(name)) return 'Revenue';
            if (/units?/i.test(name)) return 'Units sold';
            if (/aov|avg.?order|value/i.test(name)) return 'Average order value';
            if (/margin|profit/i.test(name)) return 'Margin';
            return name.charAt(0).toUpperCase() + name.slice(1);
          };
          const monthYearLabel = ym?.year && ym?.month ? `${ym.year} ${(() => { const m = parseInt(ym.month, 10); return isFinite(m) && m >= 1 && m <= 12 ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1] : ym.month; })()}` : date;

          if (percentChange !== undefined) {
            const meaning = `${prettyMetric(metricName)} ${percentChange >= 0 ? 'increased' : 'decreased'} ${Math.abs(percentChange).toFixed(1)}% YoY in ${monthYearLabel}, indicating ${percentChange >= 0 ? 'strengthening' : 'softening'} performance.`;
            insights.push(`• What it means: ${meaning}`);

            const suggestFor = (metricKey: string) => {
              const p = percentChange;
              if (/margin|profit/i.test(metricKey)) {
                if (p >= 5) return 'Sustain profitable mix; review discounting to ensure volume is not impacted.';
                if (p >= 0) return 'Healthy margin; consider scaling channels with best ROAS.';
                if (p <= -10) return 'Investigate COGS, discounting, and product mix; tighten promotions or adjust pricing.';
                return 'Review cost drivers and promotional strategy to protect margin.';
              } else if (/aov|avg.?order|value/i.test(metricKey)) {
                if (p >= 5) return 'Upsell/bundling likely working — double down on bundles and recommended add-ons.';
                if (p <= -5) return 'Test bundles and cart incentives to lift basket size.';
                return 'Experiment with cross-sells at checkout to nudge basket value.';
              } else if (/units?/i.test(metricKey)) {
                if (p >= 5) return 'Ensure inventory and fulfillment capacity; replicate top-performing campaigns.';
                if (p <= -5) return 'Check product availability, pricing, and competition; refresh creatives or promos.';
                return 'Monitor volume trend and validate demand signals across regions/products.';
              }
              // default: revenue
              if (p >= 5) return 'Scale what works: increase budget on winning channels and secure inventory.';
              if (p <= -5) return 'Diagnose drivers: product/region mix, pricing, returns; consider targeted promos.';
              return 'Maintain course, monitor leading indicators, and A/B test small optimizations.';
            };
            insights.push(`• Suggested next step: ${suggestFor(metricName)}`);
          }

          // Seasonal/month context helpers
          const getMonthName = (month: string) => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const idx = parseInt(month, 10);
            return isFinite(idx) && idx >= 1 && idx <= 12 ? monthNames[idx - 1] : month;
          };
          const toPct = (n: number) => `${(n).toFixed(1)}%`;

          // Seasonal context line
          if (dataPoint.isAverage) {
            insights.push(`• Seasonal context: average for ${getMonthName(ym?.month || '')} across all years.`);
          } else if (ym?.year && ym?.month) {
            insights.push(`• Seasonal context: ${getMonthName(ym.month)} ${ym.year}.`);
          } else if (dataPoint.year && dataPoint.month) {
            insights.push(`• Seasonal context: ${getMonthName(String(dataPoint.month))} ${String(dataPoint.year)}.`);
          }

          // Deeper seasonal insights using dashboard seasonality data (revenue-focused)
          try {
            const seasonality: any[] | undefined = dashboardState?.data?.seasonality;
            const month = ym?.month;
            const year = ym?.year ? parseInt(ym.year, 10) : undefined;
            // Debug: log seasonal calculation context
            try { console.debug('🔎 QuickInsights seasonal ctx', { chartType, isAvg: dataPoint.isAverage, ym, month, year, seasonalityLen: seasonality?.length }); } catch {}
            if (seasonality && month) {
              const monthRows = seasonality
                .filter(s => String(s.month).padStart(2, '0') === String(month).padStart(2, '0'))
                .map(s => ({ year: Number(s.year), revenue: Number(s.revenue) }))
                .filter(r => isFinite(r.revenue) && isFinite(r.year))
                .sort((a, b) => a.year - b.year);
              const monthValues = monthRows.map(r => r.revenue);
              try { console.debug('🔎 QuickInsights monthRows', { month, count: monthRows.length, values: monthValues.slice(0,5) }); } catch {}

              if (monthValues.length >= 2) {
                const avg = monthValues.reduce((a, b) => a + b, 0) / monthValues.length;
                const dev = avg !== 0 ? ((value - avg) / avg) * 100 : 0;
                insights.push(`• Seasonal baseline: typical ${getMonthName(month)} is $${Math.round(avg).toLocaleString()} (${dev >= 0 ? '+' : ''}${toPct(dev)} vs baseline).`);

                // Best and worst years for this month
                const best = monthRows.reduce((m, r) => (r.revenue > m.revenue ? r : m), monthRows[0]);
                const worst = monthRows.reduce((m, r) => (r.revenue < m.revenue ? r : m), monthRows[0]);
                insights.push(`• Best/Worst ${getMonthName(month)}: ${best.year} $${Math.round(best.revenue).toLocaleString()} • ${worst.year} $${Math.round(worst.revenue).toLocaleString()}.`);

                // Percentile rank within this month historically
                const sorted = [...monthValues].sort((a, b) => a - b);
                const rankIndex = sorted.findIndex(v => v >= value);
                const idx = rankIndex === -1 ? sorted.length - 1 : rankIndex;
                const percentile = ((idx + 1) / sorted.length) * 100;
                insights.push(`• Historical position: ~${toPct(100 - percentile)} (top ${Math.max(1, Math.round(100 - percentile))}%) for ${getMonthName(month)}.`);

                // Volatility (std dev and CV)
                const variance = monthValues.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / (monthValues.length - 1);
                const std = Math.sqrt(Math.max(0, variance));
                const cv = avg !== 0 ? (std / avg) * 100 : 0;
                insights.push(`• Volatility: σ≈$${Math.round(std).toLocaleString()} (CV ${toPct(cv)}).`);

                // YoY comparison for the same month
                if (year) {
                  const prevYear = monthRows.find(r => r.year === year - 1);
                  if (prevYear) {
                    const yoy = prevYear.revenue !== 0 ? ((value - prevYear.revenue) / prevYear.revenue) * 100 : 0;
                    insights.push(`• YoY: ${yoy >= 0 ? '+' : ''}${toPct(yoy)} vs ${getMonthName(month)} ${year - 1}.`);
                  }

                  // Rank of this month within the same year (if we have that year's months)
                  const thisYearMonths = seasonality.filter(s => Number(s.year) === year);
                  if (thisYearMonths.length >= 3) {
                    const ranked = [...thisYearMonths].sort((a, b) => Number(b.revenue) - Number(a.revenue));
                    const position = ranked.findIndex(s => String(s.month).padStart(2, '0') === String(month).padStart(2, '0')) + 1;
                    insights.push(`• In-year rank: ${getMonthName(month)} ranks #${position} of ${thisYearMonths.length} months in ${year}.`);
                  }
                }

                // Multi-year trend for this month (least squares slope)
                if (monthRows.length >= 3) {
                  const xs = monthRows.map((r, i) => i + 1); // simple index to avoid year gaps weighting
                  const xbar = xs.reduce((a, b) => a + b, 0) / xs.length;
                  const ybar = monthValues.reduce((a, b) => a + b, 0) / monthValues.length;
                  const num = xs.reduce((acc, x, i) => acc + (x - xbar) * (monthValues[i] - ybar), 0);
                  const den = xs.reduce((acc, x) => acc + Math.pow(x - xbar, 2), 0) || 1;
                  const slope = num / den; // revenue per index-step
                  const slopePct = avg !== 0 ? (slope / avg) * 100 : 0;
                  const dir = Math.abs(slopePct) < 1 ? 'flat' : slopePct > 0 ? 'upward' : 'downward';
                  insights.push(`• Multi‑year trend: ${dir} (≈${slopePct >= 0 ? '+' : ''}${toPct(slopePct)} per year for ${getMonthName(month)}).`);
                }

                // Quarter context
                const mNum = parseInt(String(month), 10);
                if (isFinite(mNum)) {
                  const q = Math.ceil(mNum / 3);
                  const qMonths = [1,2,3].map(i => ((q - 1) * 3) + i);
                  const qMonthStrings = qMonths.map(n => String(n).padStart(2, '0'));
                  const qRows = seasonality.filter(s => qMonthStrings.includes(String(s.month).padStart(2, '0')));
                  if (qRows.length >= 6) { // at least 2 years of quarter data
                    const qAvg = qRows.reduce((a, r) => a + Number(r.revenue), 0) / qRows.length;
                    const contrib = qAvg !== 0 ? (avg / qAvg) * 100 : 0;
                    insights.push(`• Quarter context: ${getMonthName(month)} contributes ~${toPct(contrib)} of typical Q${q} monthly average.`);
                  }
                }

                // Next month expectation using typical seasonal step (month -> month+1)
                const nextMonthNum = ((parseInt(String(month), 10) % 12) + 1);
                const nextMonth = String(nextMonthNum).padStart(2, '0');
                const nextMonthVals = seasonality
                  .filter(s => String(s.month).padStart(2, '0') === nextMonth)
                  .map(s => Number(s.revenue))
                  .filter(v => isFinite(v));
                if (nextMonthVals.length >= 2) {
                  const nextAvg = nextMonthVals.reduce((a, b) => a + b, 0) / nextMonthVals.length;
                  const step = avg !== 0 ? ((nextAvg - avg) / avg) * 100 : 0;
                  insights.push(`• Typical next month (${getMonthName(nextMonth)}): ~$${Math.round(nextAvg).toLocaleString()} (${step >= 0 ? '+' : ''}${toPct(step)} vs ${getMonthName(month)} baseline).`);
                }
              }
            }
          } catch {}

          // Prefer seasonal-specific insights to appear first for seasonal chart
          if (chartType === 'seasonal' || dataPoint.isAverage || dataPoint.month) {
            // Reorder: seasonal insights first, then current/prev/value and actions
            const seasonalFirst: string[] = [];
            const seasonalKeys = ['Seasonal baseline', 'Historical position', 'Volatility', 'YoY', 'In-year rank', 'Multi‑year trend', 'Quarter context', 'Typical next month'];
            const other: string[] = [];
            for (const i of insights) {
              if (seasonalKeys.some(k => i.includes(k))) seasonalFirst.push(i); else other.push(i);
            }
            setInsights([...seasonalFirst, ...other].slice(0, 10));
          } else {
            setInsights(insights.slice(0, 8));
          }
        } else if (chartInfo) {
          // Simple chart explanations
          if (chartType === 'timeseries') {
            setInsights([
              chartInfo?.description || 'Track how your sales change over time',
              chartInfo?.purpose || 'Spot trends and patterns in your data'
            ]);
          } else if (chartType === 'seasonal') {
            setInsights([
              chartInfo?.description || 'See monthly and seasonal sales cycles',
              chartInfo?.purpose || 'Plan for busy and slow periods'
            ]);
          } else if (chartType === 'growth') {
            setInsights([
              `• ${chartInfo?.description || 'Month-to-month growth percentage changes'}`,
              `• ${chartInfo?.purpose || 'Monitor business momentum and acceleration'}`,
              '• Average Growth: Typical MoM rate; avg((current − previous) ÷ previous).',
              '• Best Growth Month: Highest MoM; replicate successful drivers.',
              '• Worst Growth Month: Lowest MoM; diagnose and fix root causes.',
              '• Current Growth: Latest MoM; check alignment with seasonal targets.'
            ]);
          } else if (chartType === 'kpi') {
            setInsights([
              `• ${chartInfo?.description || 'Essential business performance indicators'}`,
              `• ${chartInfo?.purpose || 'Quick health check of your business'}`,
              chartInfo?.calc ? `• How it’s calculated: ${chartInfo.calc}` : undefined,
              chartInfo?.drivers ? `• Key drivers: ${chartInfo.drivers}` : undefined,
              chartInfo?.benchmark ? `• Benchmark: ${chartInfo.benchmark}` : undefined,
              chartInfo?.action ? `• Next step: ${chartInfo.action}` : undefined,
            ].filter(Boolean) as string[]);
          } else {
            setInsights([
              chartInfo?.description || 'Business performance metric',
              chartInfo?.purpose || 'Track your business progress'
            ]);
          }
        }
        setIsLoading(false);
      }, 500);
    }
  }, [isVisible, dataPoint, chartInfo, chartType]);

  // Helper function for performance level
  const getPerformanceLevel = (percentChange?: number): string => {
    if (percentChange === undefined) return 'normal';
    if (percentChange > 20) return 'amazing';
    if (percentChange > 10) return 'great';
    if (percentChange > 0) return 'good';
    if (percentChange > -5) return 'okay';
    if (percentChange > -15) return 'concerning';
    return 'needs attention';
  };

  // Auto-close after 12 seconds (increased for comprehensive insights)
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  // Smart positioning to prevent off-screen issues
  const getSmartPosition = () => {
    const popupWidth = 400;
    const popupHeight = 300;
    const margin = 20;
    
    let left = position.x;
    let top = position.y;
    
    // Adjust horizontal position if too close to right edge
    if (left + popupWidth > window.innerWidth - margin) {
      left = window.innerWidth - popupWidth - margin;
    }
    
    // Adjust horizontal position if too close to left edge
    if (left < margin) {
      left = margin;
    }
    
    // Adjust vertical position if too close to bottom edge
    if (top + popupHeight > window.innerHeight - margin) {
      top = window.innerHeight - popupHeight - margin;
    }
    
    // Adjust vertical position if too close to top edge
    if (top < margin) {
      top = margin;
    }
    
    return { left, top };
  };

  const smartPosition = getSmartPosition();

  return (
    <div
      style={{
        position: 'fixed',
        left: smartPosition.left,
        top: smartPosition.top,
        zIndex: 10000,
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '300px',
        maxWidth: '400px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1e293b'
        }}>
          ⚡ Quick AI Insights
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#64748b'
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ fontSize: '13px', color: '#64748b' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              display: 'inline-block',
              width: '20px',
              height: '20px',
              border: '2px solid #e2e8f0',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ marginTop: '8px' }}>Analyzing data...</div>
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: '500', marginBottom: '8px' }}>
              {dataPoint && dataPoint.isMultiSelection 
                ? '📊 Multi-Selection Analysis' 
                : dataPoint 
                ? 'Data Point Analysis' 
                : chartInfo 
                ? 'Chart Explanation' 
                : 'Quick Insights'}
            </div>
            <div>
              {insights.map((insight, index) => (
                <div key={index} style={{ 
                  marginBottom: '6px',
                  padding: '4px 0',
                  borderLeft: '2px solid #3b82f6',
                  paddingLeft: '8px'
                }}>
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '12px',
        paddingTop: '8px',
        borderTop: '1px solid #e2e8f0',
        fontSize: '11px',
        color: '#94a3b8',
        textAlign: 'center'
      }}>
        {dataPoint && dataPoint.isMultiSelection 
          ? '✨ Press ESC to clear selections • Shift+Click to add more points' 
          : '💡 Shift+Click multiple points for comparison • ESC to clear'}
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default QuickInsightsAssistant;