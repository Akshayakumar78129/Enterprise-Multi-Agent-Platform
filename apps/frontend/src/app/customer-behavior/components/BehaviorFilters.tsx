"use client";

import React from "react";
import { FilterBar } from "components/index";
import { RFM_SEGMENT_OPTIONS, LOYALTY_STATUS_OPTIONS } from "@/lib/constants/filterOptions";

interface BehaviorFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
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

// Behavior analysis types - these are specific to behavior dashboard
const BEHAVIOR_TYPE_OPTIONS = [
  { value: 'purchase_patterns', label: 'Purchase Patterns' },
  { value: 'product_preferences', label: 'Product Preferences' },
  { value: 'channel_usage', label: 'Channel Usage' },
  { value: 'engagement_metrics', label: 'Engagement Metrics' }
];

export function BehaviorFilters({
  filters,
  onFiltersChange,
  onReset
}: BehaviorFiltersProps) {
  const filterConfig = {
    dateRange: {
      enabled: true,
      value: filters.dateRange,
      onChange: (range) => {
        onFiltersChange({
          ...filters,
          dateRange: range
        });
      }
    },
    multiSelect: [
      {
        id: 'segment',
        label: 'Customer Segment',
        options: RFM_SEGMENT_OPTIONS as any,  // Using centralized RFM segment options
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
        options: LOYALTY_STATUS_OPTIONS as any,  // Using centralized loyalty status options
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