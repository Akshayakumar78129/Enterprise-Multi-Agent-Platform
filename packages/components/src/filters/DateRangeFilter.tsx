"use client";

import React, { useState } from "react";
import { Input } from "../forms/Input";
import { Select } from "../forms/Select";
import { Button } from "../ui/Button";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DateRangePreset {
  label: string;
  value: string;
  getRange: () => DateRange;
}

// Support both formats of presets
export interface SimpleDateRangePreset {
  label: string;
  startDate: string;
  endDate: string;
}

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: DateRangePreset[] | SimpleDateRangePreset[];
  showPresets?: boolean;
  showCustomRange?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const defaultPresets: DateRangePreset[] = [
  {
    label: "Last 7 Days",
    value: "last_7_days",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "Last 30 Days",
    value: "last_30_days",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "Last 90 Days",
    value: "last_90_days",
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "This Month",
    value: "this_month",
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "Last Month",
    value: "last_month",
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "This Year",
    value: "this_year",
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      };
    },
  },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  presets = defaultPresets,
  showPresets = true,
  showCustomRange = true,
  minDate,
  maxDate,
  className = "",
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetChange = (presetValue: string) => {
    if (presetValue === "custom") {
      setSelectedPreset("custom");
      setIsCustom(true);
      return;
    }

    // Find preset by either value or label (to support both formats)
    const preset = presets.find((p: any) => {
      // Check if it's the advanced format with value and getRange
      if ('value' in p && p.value === presetValue) {
        return true;
      }
      // Check if it's the simple format with label only
      if ('label' in p && p.label === presetValue) {
        return true;
      }
      return false;
    });

    if (preset) {
      setSelectedPreset(presetValue);
      setIsCustom(false);

      // Handle advanced format with getRange()
      if ('getRange' in preset && typeof preset.getRange === 'function') {
        onChange(preset.getRange());
      }
      // Handle simple format with direct startDate/endDate
      else if ('startDate' in preset && 'endDate' in preset) {
        onChange({
          startDate: preset.startDate,
          endDate: preset.endDate
        });
      }
    }
  };

  const handleCustomDateChange = (field: "startDate" | "endDate", date: string) => {
    onChange({
      ...value,
      [field]: date,
    });
  };

  return (
    <div className={`w-full ${className}`}>
      {showPresets && !isCustom && (
        <Select
          label="Time Period"
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          options={[
            ...presets.map((p: any, index) => ({
              // Use p.value if available (advanced format), otherwise use p.label (simple format)
              value: 'value' in p ? p.value : p.label,
              label: p.label
            })),
            ...(showCustomRange ? [{ value: "custom", label: "Custom Range" }] : []),
          ]}
        />
      )}

      {isCustom && showCustomRange && (
        <div className="w-full">
          <label className="block text-sm font-medium text-foreground mb-2">
            Time Period
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={value.startDate}
              onChange={(e) => handleCustomDateChange("startDate", e.target.value)}
              min={minDate}
              max={value.endDate || maxDate}
              suppressHydrationWarning
              className="flex-1 px-3 py-2 bg-surface border-0 rounded-lg text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all min-h-[48px]"
            />
            <input
              type="date"
              value={value.endDate}
              onChange={(e) => handleCustomDateChange("endDate", e.target.value)}
              min={value.startDate || minDate}
              max={maxDate}
              suppressHydrationWarning
              className="flex-1 px-3 py-2 bg-surface border-0 rounded-lg text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all min-h-[48px]"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedPreset("");
                setIsCustom(false);
              }}
              className="px-2 py-2 bg-surface border-0 rounded-lg text-foreground hover:bg-background/50 transition-colors min-h-[48px]"
              title="Reset to presets"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {!showPresets && showCustomRange && (
        <div className="flex gap-2">
          <Input
            type="date"
            label="Start Date"
            value={value.startDate}
            onChange={(e) => handleCustomDateChange("startDate", e.target.value)}
            min={minDate}
            max={value.endDate || maxDate}
          />
          <Input
            type="date"
            label="End Date"
            value={value.endDate}
            onChange={(e) => handleCustomDateChange("endDate", e.target.value)}
            min={value.startDate || minDate}
            max={maxDate}
          />
        </div>
      )}
    </div>
  );
};