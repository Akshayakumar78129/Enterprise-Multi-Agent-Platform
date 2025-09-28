"use client";

import React from "react";
import { FilterBar } from "components/index";

interface BehaviorFilters {
  timePeriod: string;
  segmentId: string | null;
  segmentIds?: string[];  // Support multiple segments
  behaviorTypes: string[];
  minTransactions: number;
  customerIds: string[];
  loyaltyStatus: string[];
}

interface BehaviorFiltersProps {
  filters: BehaviorFilters;
  onFiltersChange: (filters: BehaviorFilters) => void;
  onReset: () => void;
}

const TIME_PRESETS = [
  { value: '2021-01-01:2021-12-31', label: 'Full Year 2021' },
  { value: '2021-01-01:2021-06-30', label: 'H1 2021' },
  { value: '2021-07-01:2021-12-31', label: 'H2 2021' },
  { value: '2021-01-01:2021-03-31', label: 'Q1 2021' },
  { value: '2021-04-01:2021-06-30', label: 'Q2 2021' },
  { value: '2021-07-01:2021-09-30', label: 'Q3 2021' },
  { value: '2021-10-01:2021-12-31', label: 'Q4 2021' }
];

const SEGMENT_OPTIONS = [
  { value: 'all', label: 'All Segments' },
  { value: 'loyal', label: 'Loyal Customers' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'new', label: 'New Customers' },
  { value: 'dormant', label: 'Dormant' },
  { value: 'champions', label: 'Champions' }
];

const BEHAVIOR_TYPE_OPTIONS = [
  { value: 'purchase_patterns', label: 'Purchase Patterns' },
  { value: 'product_preferences', label: 'Product Preferences' },
  { value: 'channel_usage', label: 'Channel Usage' },
  { value: 'engagement_metrics', label: 'Engagement Metrics' }
];

const LOYALTY_OPTIONS = [
  { value: 'platinum', label: 'Platinum' },
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'bronze', label: 'Bronze' }
];

export function BehaviorFilters({
  filters,
  onFiltersChange,
  onReset
}: BehaviorFiltersProps) {
  // Parse time period to get start and end dates
  const [startDate, endDate] = filters.timePeriod.split(':');

  const filterConfig = {
    dateRange: {
      enabled: true,
      value: {
        startDate: startDate || '2021-01-01',
        endDate: endDate || '2021-12-31'
      },
      onChange: (range) => {
        onFiltersChange({
          ...filters,
          timePeriod: `${range.startDate}:${range.endDate}`
        });
      },
      presets: TIME_PRESETS.map(preset => ({
        label: preset.label,
        getValue: () => {
          const [start, end] = preset.value.split(':');
          return { startDate: start, endDate: end };
        }
      }))
    },
    multiSelect: [
      {
        id: 'segment',
        label: 'Customer Segment',
        options: SEGMENT_OPTIONS.filter(opt => opt.value !== 'all'),
        value: filters.segmentIds || (filters.segmentId ? [filters.segmentId] : []),
        onChange: (values) => {
          onFiltersChange({
            ...filters,
            segmentId: values.length > 0 ? values[0] : null,  // Keep for backward compatibility
            segmentIds: values
          });
        },
        placeholder: 'Select segment(s)'
      },
      {
        id: 'behaviorTypes',
        label: 'Behavior Types',
        options: BEHAVIOR_TYPE_OPTIONS,
        value: filters.behaviorTypes,
        onChange: (values) => {
          onFiltersChange({
            ...filters,
            behaviorTypes: values
          });
        },
        placeholder: 'Select behaviors'
      },
      {
        id: 'loyaltyStatus',
        label: 'Loyalty Status',
        options: LOYALTY_OPTIONS,
        value: filters.loyaltyStatus,
        onChange: (values) => {
          onFiltersChange({
            ...filters,
            loyaltyStatus: values
          });
        },
        placeholder: 'Select status'
      }
    ]
  };

  return (
    <FilterBar
      config={filterConfig}
      onReset={onReset}
      showResetButton={true}
    />
  );
}