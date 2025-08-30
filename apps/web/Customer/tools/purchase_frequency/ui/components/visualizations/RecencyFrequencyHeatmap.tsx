import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { CustomerSegment } from '../../types';

export interface RecencyFrequencyHeatmapProps {
  data: CustomerSegment[];
  width?: number;
  height?: number;
  recencyBins?: number[]; // normalized 0..2 in current generator; default auto
  frequencyBins?: number[]; // auto-derived
  colorScale?: [string, string]; // [low, high]
  onCellClick?: (rfBin: { rIdx: number; fIdx: number; count: number }) => void;
  onChartElementClick?: (clickData: any) => void;
  componentId?: string;
  title?: string;
}

// Helper to compute nice bin edges evenly across range
function computeBins(values: number[], desiredBins = 6) {
  if (!values.length) return [] as number[];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!isFinite(min) || !isFinite(max) || min === max) {
    return Array.from({ length: desiredBins + 1 }, (_, i) => min + (i * 1) / desiredBins);
  }
  return Array.from({ length: desiredBins + 1 }, (_, i) => min + (i * (max - min)) / desiredBins);
}

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

const RecencyFrequencyHeatmap = forwardRef<any, RecencyFrequencyHeatmapProps>(({
  data,
  width = 560,
  height = 380,
  recencyBins,
  frequencyBins,
  colorScale = ['#0a1224', '#00e0ff'],
  onCellClick,
  onChartElementClick,
  componentId = 'recency-frequency-heatmap',
  title = 'Recency vs Frequency Heatmap'
}, ref) => {
  const [selectedCells, setSelectedCells] = useState<string[]>([]); // keys as rIdx-fIdx
  const [hoverCell, setHoverCell] = useState<{ rIdx: number; fIdx: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ rIdx: number; fIdx: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Derive bins if not provided
  const rValues = useMemo(() => data.map(d => Number(d.recency ?? 0)).filter(v => isFinite(v)), [data]);
  const fValues = useMemo(() => data.map(d => Number(d.frequency ?? 0)).filter(v => isFinite(v)), [data]);
  const rBins = useMemo(() => recencyBins && recencyBins.length > 1 ? recencyBins : computeBins(rValues, 6), [recencyBins, rValues]);
  const fBins = useMemo(() => frequencyBins && frequencyBins.length > 1 ? frequencyBins : computeBins(fValues, 6), [frequencyBins, fValues]);

  // Build matrix counts
  const matrix = useMemo(() => {
    const rows = rBins.length - 1;
    const cols = fBins.length - 1;
    const counts: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (const d of data) {
      const r = Number(d.recency ?? 0);
      const f = Number(d.frequency ?? 0);
      const rIdx = Math.min(rows - 1, Math.max(0, rBins.findIndex((edge, i) => i < rows && r >= rBins[i] && r < rBins[i + 1])));
      const fIdx = Math.min(cols - 1, Math.max(0, fBins.findIndex((edge, i) => i < cols && f >= fBins[i] && f < fBins[i + 1])));
      if (rIdx >= 0 && fIdx >= 0) counts[rIdx][fIdx] += 1;
    }
    return counts;
  }, [data, rBins, fBins]);

  const maxCount = useMemo(() => matrix.flat().reduce((m, v) => Math.max(m, v), 0) || 1, [matrix]);

  // Imperative API
  useImperativeHandle(ref, () => ({
    clearSelection: () => setSelectedCells([]),
    selectCell: (rIdx: number, fIdx: number) => setSelectedCells([`${rIdx}-${fIdx}`]),
    selectRegion: (r1: number, c1: number, r2: number, c2: number) => {
      const top = Math.min(r1, r2); const bottom = Math.max(r1, r2);
      const left = Math.min(c1, c2); const right = Math.max(c1, c2);
      const keys: string[] = [];
      for (let r = top; r <= bottom; r++) for (let c = left; c <= right; c++) keys.push(`${r}-${c}`);
      setSelectedCells(keys);
    },
  }), []);

  // Layout
  const margin = { top: 32, right: 16, bottom: 44, left: 54 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const rows = rBins.length - 1;
  const cols = fBins.length - 1;
  const cellW = innerW / cols;
  const cellH = innerH / rows;

  const keyFor = (rIdx: number, fIdx: number) => `${rIdx}-${fIdx}`;

  const handleCellClick = (rIdx: number, fIdx: number, e: React.MouseEvent) => {
    const key = keyFor(rIdx, fIdx);
    // Shift-click toggles selection (multi-select), single click selects one
    setSelectedCells(prev => (e.shiftKey ? (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]) : [key]));

    const count = matrix[rIdx]?.[fIdx] ?? 0;
    onCellClick?.({ rIdx, fIdx, count });

    if (onChartElementClick && containerRef.current) {
      const svg = containerRef.current.querySelector('svg');
      const svgRect = svg?.getBoundingClientRect();
      const contRect = containerRef.current.getBoundingClientRect();
      onChartElementClick({
        event: e.nativeEvent,
        componentId,
        chartId: 'recency_frequency_heatmap',
        chartRect: svgRect,
        elementRect: contRect,
        shiftKey: e.shiftKey,
        pointData: {
          rIdx,
          fIdx,
          count,
          rRange: [rBins[rIdx], rBins[rIdx + 1]],
          fRange: [fBins[fIdx], fBins[fIdx + 1]],
          label: `R ${rIdx + 1} / F ${fIdx + 1}`
        }
      });
    }
  };

  const handleMouseDown = (rIdx: number, fIdx: number) => {
    setDragStart({ rIdx, fIdx });
  };

  const handleMouseUp = (rIdx: number, fIdx: number) => {
    if (!dragStart) return;
    const keys: string[] = [];
    const top = Math.min(dragStart.rIdx, rIdx);
    const bottom = Math.max(dragStart.rIdx, rIdx);
    const left = Math.min(dragStart.fIdx, fIdx);
    const right = Math.max(dragStart.fIdx, fIdx);
    for (let r = top; r <= bottom; r++) for (let c = left; c <= right; c++) keys.push(keyFor(r, c));
    setSelectedCells(keys);
    setDragStart(null);
  };

  return (
    <div ref={containerRef} style={{ width, height, position: 'relative', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
      <h3 style={{ margin: 0, marginBottom: 12, fontSize: 16, fontWeight: 700, color: '#1f2937' }}>{title}</h3>
      <svg width={width - 32} height={height - 60}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Axes */}
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#8893a7" strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={innerH} stroke="#8893a7" strokeWidth={1} />

          {/* X labels (Frequency) */}
          {Array.from({ length: cols }, (_, c) => (
            <text key={`xlab-${c}`} x={c * cellW + cellW / 2} y={innerH + 18} textAnchor="middle" fill="#8893a7" fontSize={12}>
              {`${fBins[c].toFixed(1)}–${fBins[c + 1].toFixed(1)}`}
            </text>
          ))}

          {/* Y labels (Recency) */}
          {Array.from({ length: rows }, (_, r) => (
            <text key={`ylab-${r}`} x={-10} y={innerH - (r * cellH + cellH / 2)} textAnchor="end" fill="#8893a7" fontSize={12} dominantBaseline="middle">
              {`${rBins[r].toFixed(1)}–${rBins[r + 1].toFixed(1)}`}
            </text>
          ))}

          {/* Cells */}
          {Array.from({ length: rows }, (_, r) => (
            Array.from({ length: cols }, (_, c) => {
              const count = matrix[r][c];
              const t = clamp01(count / maxCount);
              const fill = `rgba(0, 224, 255, ${0.15 + t * 0.85})`;
              const isHover = hoverCell && hoverCell.rIdx === r && hoverCell.fIdx === c;
              return (
                <g key={`cell-${r}-${c}`}>
                  <rect
                    x={c * cellW + 1}
                    y={innerH - (r + 1) * cellH + 1}
                    width={cellW - 2}
                    height={cellH - 2}
                    fill={fill}
                    stroke={isHover ? '#00e0ff' : '#3a4459'}
                    strokeWidth={isHover ? 3 : 1}
                    rx={3}
                    ry={3}
                    onMouseEnter={() => setHoverCell({ rIdx: r, fIdx: c })}
                    onMouseLeave={() => setHoverCell(null)}
                    onMouseDown={() => handleMouseDown(r, c)}
                    onMouseUp={() => handleMouseUp(r, c)}
                    onClick={(e) => handleCellClick(r, c, e)}
                    style={{ cursor: 'crosshair', boxShadow: isHover ? '0 0 8px #00e0ff' : 'none', transition: 'box-shadow 0.2s' }}
                  />
                </g>
              );
            })
          ))}
        </g>
      </svg>

      {/* Tooltip */}
      {hoverCell && (
        <div style={{ position: 'absolute', top: 40, left: 16 + (hoverCell.fIdx * cellW) + 54, backgroundColor: 'rgba(35,42,54,0.92)', color: '#f7f9fb', borderRadius: 6, padding: '8px 10px', fontSize: 12, border: '1px solid #3a4459', pointerEvents: 'none' }}>
          <div><strong>Recency:</strong> {rBins[hoverCell.rIdx].toFixed(1)}–{rBins[hoverCell.rIdx + 1].toFixed(1)}</div>
          <div><strong>Frequency:</strong> {fBins[hoverCell.fIdx].toFixed(1)}–{fBins[hoverCell.fIdx + 1].toFixed(1)}</div>
          <div><strong>Customers:</strong> {matrix[hoverCell.rIdx][hoverCell.fIdx]}</div>
        </div>
      )}

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 12, right: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#f7f9fb', fontSize: 12 }}>
        <span>Low</span>
        <div style={{ width: 100, height: 10, background: 'linear-gradient(to right, rgba(0,224,255,0.15), rgba(0,224,255,1))', borderRadius: 4 }} />
        <span>High</span>
      </div>
    </div>
  );
});

RecencyFrequencyHeatmap.displayName = 'RecencyFrequencyHeatmap';
export default RecencyFrequencyHeatmap;