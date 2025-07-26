import React from 'react';
import Select from '../../../../../../ui-common/design-system/components/Select';

interface SegmentationFiltersProps {
  regions: string[];
  segments: Array<string | number>;
  value?: { region?: string; segment?: string | number };
  onChange?: (val: { region?: string; segment?: string | number }) => void;
}

const SegmentationFilters: React.FC<SegmentationFiltersProps> = ({ regions, segments, value = {}, onChange }) => {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
      <Select
        label="Region"
        options={[{ label: 'All', value: '' }, ...regions.map(r => ({ label: r, value: r }))]}
        value={value.region || ''}
        onChange={v => onChange?.({ ...value, region: v })}
        style={{ minWidth: 160 }}
      />
      <Select
        label="Segment"
        options={[{ label: 'All', value: '' }, ...segments.map(s => ({ label: String(s), value: String(s) }))]}
        value={value.segment ? String(value.segment) : ''}
        onChange={v => onChange?.({ ...value, segment: v })}
        style={{ minWidth: 160 }}
      />
    </div>
  );
};

export default SegmentationFilters; 