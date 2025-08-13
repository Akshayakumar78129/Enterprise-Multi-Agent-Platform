import React from 'react';

interface SegmentationFiltersProps {
  regions: string[];
  segments: Array<string | number>;
  value?: { region?: string; segment?: string | number };
  onChange?: (val: { region?: string; segment?: string | number }) => void;
}

const SegmentationFilters: React.FC<SegmentationFiltersProps> = ({ regions, segments, value = {}, onChange }) => {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
      <div>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Region</label>
        <select
          value={value.region || ''}
          onChange={e => onChange?.({ ...value, region: e.target.value })}
          style={{
            minWidth: 160,
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: 4,
            fontSize: 14
          }}
        >
          <option value="">All</option>
          {regions.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Segment</label>
        <select
          value={value.segment ? String(value.segment) : ''}
          onChange={e => onChange?.({ ...value, segment: e.target.value })}
          style={{
            minWidth: 160,
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: 4,
            fontSize: 14
          }}
        >
          <option value="">All</option>
          {segments.map(s => (
            <option key={s} value={String(s)}>{String(s)}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SegmentationFilters; 