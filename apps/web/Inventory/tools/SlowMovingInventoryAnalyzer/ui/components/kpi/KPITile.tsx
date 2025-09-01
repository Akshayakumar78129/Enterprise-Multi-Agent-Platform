import React, { useState } from 'react';

// Placeholder for HorizontalGauge if not found
const HorizontalGauge = ({ value }: { value: number }) => (
  <div style={{ width: '100%', height: 6, background: '#23283a', borderRadius: 3, marginTop: 2 }}>
    <div style={{ width: `${value}%`, height: '100%', background: '#00e0ff', borderRadius: 3, transition: 'width 0.3s' }} />
  </div>
);

const KPI_COLORS = {
  IMPROVING: '#00e0ff',
  WORSENING: '#e930ff',
  STABLE: '#94a3b8'
};

export interface KPITileProps {
  title: string;
  value: string | number;
  trend?: 'improving' | 'worsening' | 'stable';
  icon?: React.ReactNode;
  subtitle?: string;
  gaugeValue?: number;
  gaugeType?: 'circular' | 'horizontal';
  targetValue?: string | number;
  kpiId?: string;
  onTileClick?: (kpiId: string, event?: React.MouseEvent) => void;
  onTargetChange?: (newTarget: string) => void;
}

export const KPITile: React.FC<KPITileProps> = ({
  title,
  value,
  trend = 'stable',
  icon,
  subtitle,
  gaugeValue = 0,
  gaugeType = 'horizontal',
  targetValue = '',
  kpiId,
  onTileClick,
  onTargetChange
}) => {
  // State for editing target
  const [editingTarget, setEditingTarget] = useState(false);
  const [inputValue, setInputValue] = useState(String(targetValue).replace(/[^\d.,]/g, ''));
  const [localTargetValue, setLocalTargetValue] = useState(String(targetValue).replace(/[^\d.,]/g, ''));
  
  // Sync local state if parent changes targetValue
  React.useEffect(() => {
    setInputValue(String(targetValue).replace(/[^\d.,]/g, ''));
    setLocalTargetValue(String(targetValue).replace(/[^\d.,]/g, ''));
  }, [targetValue]);
  // Determine initial unit from targetValue if possible
  function detectInitialUnit(val: string | number): 'K' | 'M' {
    if (typeof val === 'string') {
      if (/m/i.test(val)) return 'M';
      if (/k/i.test(val)) return 'K';
    }
    return 'K';
  }
  const [unit, setUnit] = useState<'K' | 'M'>(detectInitialUnit(targetValue));

  // When unit changes, force inputValue to update so the input re-renders
  React.useEffect(() => {
    setInputValue(v => v); // triggers re-render
  }, [unit]);

  const isMonetary = (typeof value === 'string' && String(value).includes('$')) || (typeof targetValue === 'string' && String(targetValue).includes('$'));
  // Show '<' or '>' if the original targetValue starts with them
  let symbolPrefix = '';
  // Always show '>' for the 3rd tile (e.g., turnover ratio)
  // You can use kpiId or title to identify the tile. Adjust as needed.
  const isTurnoverRatio = (kpiId === 'turnover-ratio' || title.toLowerCase().includes('turnover ratio'));
  if (isTurnoverRatio) {
    symbolPrefix = '> ';
  } else if (typeof targetValue === 'string') {
    const trimmed = targetValue.trim();
    if (trimmed.startsWith('<')) symbolPrefix = '< ';
    else if (trimmed.startsWith('>')) symbolPrefix = '> ';
  }
  const targetPrefix = symbolPrefix + (isMonetary ? '$' : '');
  const targetSuffix = !isMonetary && typeof targetValue === 'string' && /%$/.test(targetValue) ? '%' : '';
  const targetNumeric = String(targetValue).replace(/[^\d.,]/g, '');

  function getTrendColor() {
    if (trend === 'improving') return KPI_COLORS.IMPROVING;
    if (trend === 'worsening') return KPI_COLORS.WORSENING;
    return KPI_COLORS.STABLE;
  }

  function getTrendIcon() {
    if (trend === 'improving') return '📈';
    if (trend === 'worsening') return '📉';
    return '📊';
  }

  function handleClick(e: React.MouseEvent) {
    if (onTileClick && kpiId) onTileClick(kpiId, e);
  }

  // Dynamic percent for gauge: value / targetValue * 100
  function parseNumber(val: string | number, unit?: 'K' | 'M') {
    if (typeof val === 'number') return val;
    let num = parseFloat(String(val).replace(/[^\d.\-]/g, ''));
    if (isNaN(num)) return 0;
    if (unit === 'M') num *= 1000000;
    else if (unit === 'K') num *= 1000;
    return num;
  }

  // Format the target value for display (e.g., 4.5K, 2.1M)
  function formatTargetDisplay(val: string | number, unit?: 'K' | 'M') {
    if (!isMonetary) return val;
    let num = parseFloat(String(val).replace(/[^\d.\-]/g, ''));
    if (isNaN(num)) return '';
    return num + (unit || 'K');
  }

  // Determine the current value and target as numbers
  const numericValue = parseNumber(value, isMonetary ? unit : undefined);
  const numericTarget = parseNumber(localTargetValue, isMonetary ? unit : undefined);
  let percent = 0;
  if (numericTarget > 0) {
    percent = Math.min(100, Math.round((numericValue / numericTarget) * 100));
  }

  return (
    <div
      style={{
        width: 'clamp(130px, 13vw, 170px)',
        height: 'clamp(130px, 13vw, 170px)',
        background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.98), rgba(42, 47, 62, 0.98))',
        backdropFilter: 'blur(20px)',
        borderRadius: '14px',
        border: `1px solid ${getTrendColor()}`,
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
        fontFamily: 'Inter, sans-serif',
        minWidth: 0,
        minHeight: 0,
        boxShadow: undefined // will be set on hover
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 25px rgba(0,224,255,0.25)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onClick={handleClick}
      title={`Left Shift + Click to add "${title}" to AI context`}
    >
      {/* Trend indicator bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: getTrendColor(),
        opacity: 0.8
      }} />

      {/* Top section - Icon or Gauge */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '38px',
        marginBottom: '2px'
      }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{icon}</div>
  <HorizontalGauge value={percent || 0} />
      </div>

      {/* Middle section - Value */}
      <div style={{
        textAlign: 'center',
        marginBottom: '8px'
      }}>
        <div style={{
          fontSize: '1.3rem',
          fontWeight: '700',
          color: '#f7f9fb',
          lineHeight: '1.1',
          wordBreak: 'break-word',
          textShadow: '0 1px 2px #0008'
        }}>
          {value}
        </div>
        <div style={{
          fontSize: '0.7rem',
          color: getTrendColor(),
          fontWeight: 500,
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}>
          Target: {
            editingTarget ? (
              <>
                <span>{targetPrefix}</span>
                <input
                  type="text"
                  value={inputValue}
                  autoFocus
                  style={{
                    fontSize: '0.65rem',
                    width: '28px',
                    padding: '1px 2px',
                    border: '1px solid #94a3b8',
                    borderRadius: '3px',
                    background: '#23283a',
                    color: getTrendColor(),
                    outline: 'none',
                    marginLeft: '2px',
                    height: '15px',
                  }}
                  onChange={e => {
                    // Only allow numbers, dot, comma
                    const val = e.target.value.replace(/[^\d.,]/g, '');
                    setInputValue(val);
                  }}
                  onBlur={() => {
                    setLocalTargetValue(inputValue || targetNumeric);
                    setEditingTarget(false);
                      if (typeof onTargetChange === 'function') {
                        onTargetChange(inputValue || targetNumeric);
                      }
                    }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setLocalTargetValue(inputValue || targetNumeric);
                      setEditingTarget(false);
                      if (typeof onTargetChange === 'function') {
                        onTargetChange(inputValue || targetNumeric);
                      }
                      } else if (e.key === 'Escape') {
                      setInputValue(localTargetValue);
                      setEditingTarget(false);
                    }
                  }}
                />
                {/* Show K/M radio for monetary, % for percent, x for ratio */}
                {isMonetary && editingTarget && (
                  <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '4px', gap: '1px' }}>
                    <label
                      style={{ cursor: 'pointer', fontSize: '0.65rem', color: getTrendColor(), display: 'flex', alignItems: 'center', gap: '2px', lineHeight: 1 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="radio"
                        name={`unit-${title}`}
                        value="K"
                        checked={unit === 'K'}
                        onChange={e => { setUnit('K'); }}
                        style={{ margin: 0, accentColor: getTrendColor(), width: '11px', height: '11px' }}
                        onClick={e => e.stopPropagation()}
                      />K
                    </label>
                    <label
                      style={{ cursor: 'pointer', fontSize: '0.65rem', color: getTrendColor(), display: 'flex', alignItems: 'center', gap: '2px', lineHeight: 1 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="radio"
                        name={`unit-${title}`}
                        value="M"
                        checked={unit === 'M'}
                        onChange={e => { setUnit('M'); }}
                        style={{ margin: 0, accentColor: getTrendColor(), width: '11px', height: '11px' }}
                        onClick={e => e.stopPropagation()}
                      />M
                    </label>
                  </span>
                )}
                {!isMonetary && targetSuffix && <span>{targetSuffix}</span>}
                {/* No 'x' for slow moving KPI tile */}
              </>
            ) : (
              <>
                <span>{targetPrefix}{isMonetary ? formatTargetDisplay(localTargetValue, unit) : localTargetValue}{!isMonetary ? targetSuffix : ''}</span>
                {/* No 'x' for slow moving KPI tile */}
                <span
                  style={{
                    cursor: 'pointer',
                    marginLeft: '2px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    opacity: 0.7,
                    fontSize: '0.7em',
                  }}
                  title="Edit target"
                  onClick={e => {
                    e.stopPropagation();
                    setEditingTarget(true);
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.85 2.85a1.2 1.2 0 0 1 1.7 1.7l-9.2 9.2-2.1.4.4-2.1 9.2-9.2Zm2.12-2.12a3.2 3.2 0 0 0-4.53 0l-9.2 9.2A2 2 0 0 0 2 11.13l-.7 3.7a1 1 0 0 0 1.17 1.17l3.7-.7a2 2 0 0 0 1.13-.53l9.2-9.2a3.2 3.2 0 0 0 0-4.53Z" fill="#00e0ff"/>
                  </svg>
                </span>
              </>
            )
          }
        </div>
      </div>

      {/* Bottom section - Title and Trend */}
      <div style={{
        textAlign: 'center',
        minHeight: '28px'
      }}>
        <div style={{
          fontSize: '0.82rem',
          color: '#94a3b8',
          fontWeight: '600',
          lineHeight: '1.18',
          marginBottom: '2px',
          wordBreak: 'break-word',
          textShadow: '0 1px 2px #0006'
        }}>
          {title}
        </div>
  {/* Removed subtitle below the tile name */}
      </div>

      {/* Hover overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${getTrendColor()}33, transparent)`,
        opacity: 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none'
      }} 
      className="hover-overlay" />
    </div>
  );
};
