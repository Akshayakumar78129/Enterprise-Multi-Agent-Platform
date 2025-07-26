import React from 'react';
import Select from 'ui-common/design-system/components/Select';

interface BehaviourFiltersProps {
  categories: string[];
  channels: string[];
  churnRisks: Array<'low' | 'medium' | 'high'>;
  value?: { category?: string; channel?: string; churnRisk?: 'low' | 'medium' | 'high' };
  onChange?: (val: { category?: string; channel?: string; churnRisk?: 'low' | 'medium' | 'high' }) => void;
}

const BehaviourFilters: React.FC<BehaviourFiltersProps> = ({ categories, channels, churnRisks, value = {}, onChange }) => {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
      <Select
        label="Category"
        options={[{ label: 'All', value: '' }, ...categories.map(c => ({ label: c, value: c }))]}
        value={value.category || ''}
        onChange={v => onChange?.({ ...value, category: v })}
        style={{ minWidth: 160 }}
      />
      <Select
        label="Channel"
        options={[{ label: 'All', value: '' }, ...channels.map(c => ({ label: c, value: c }))]}
        value={value.channel || ''}
        onChange={v => onChange?.({ ...value, channel: v })}
        style={{ minWidth: 160 }}
      />
      <Select
        label="Churn Risk"
        options={[{ label: 'All', value: '' }, ...churnRisks.map(r => ({ label: r.charAt(0).toUpperCase() + r.slice(1), value: r }))]}
        value={value.churnRisk || ''}
        onChange={v => onChange?.({ ...value, churnRisk: v })}
        style={{ minWidth: 160 }}
      />
    </div>
  );
};

export default BehaviourFilters; 