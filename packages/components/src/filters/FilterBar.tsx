import React, { ReactNode } from "react";
import { Button } from "../ui/Button";
import { DateRangeFilter, DateRange } from "./DateRangeFilter";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { SingleSelectFilter } from "./SingleSelectFilter";
import { SearchFilter } from "./SearchFilter";

export interface FilterConfig {
  dateRange?: {
    enabled: boolean;
    value: DateRange;
    onChange: (range: DateRange) => void;
    presets?: any[];
  };
  search?: {
    enabled: boolean;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  singleSelect?: Array<{
    id: string;
    label: string;
    options: Array<{ value: string; label: string; disabled?: boolean }>;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }>;
  multiSelect?: Array<{
    id: string;
    label: string;
    options: Array<{ value: string; label: string }>;
    value: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
  }>;
  customFilters?: ReactNode;
}

export interface FilterBarProps {
  config: FilterConfig;
  onReset?: () => void;
  onApply?: () => void;
  showApplyButton?: boolean;
  showResetButton?: boolean;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  config,
  onReset,
  onApply,
  showApplyButton = false,
  showResetButton = true,
  className = "",
}) => {
  const filterCount =
    (config.dateRange?.enabled ? 1 : 0) +
    (config.search?.enabled ? 1 : 0) +
    (config.singleSelect?.length || 0) +
    (config.multiSelect?.length || 0) +
    (config.customFilters ? 1 : 0);

  const getGridCols = () => {
    if (filterCount === 1) return "grid-cols-1";
    if (filterCount === 2) return "grid-cols-1 sm:grid-cols-2";
    if (filterCount === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  };

  return (
    <div className={`${className}`}>
      <div className={`grid ${getGridCols()} gap-3 sm:gap-4 items-end`}>
        {/* Date Range Filter */}
        {config.dateRange?.enabled && (
          <div className="w-full">
            <DateRangeFilter
              value={config.dateRange.value}
              onChange={config.dateRange.onChange}
              presets={config.dateRange.presets}
            />
          </div>
        )}

        {/* Search Filter */}
        {config.search?.enabled && (
          <div className="w-full">
            <SearchFilter
              label="Customers"
              value={config.search.value}
              onChange={config.search.onChange}
              placeholder={config.search.placeholder}
            />
          </div>
        )}

        {/* Single-Select Filters */}
        {config.singleSelect?.map((filter) => (
          <div key={filter.id} className="w-full">
            <SingleSelectFilter
              label={filter.label}
              options={filter.options}
              value={filter.value}
              onChange={filter.onChange}
              placeholder={filter.placeholder}
            />
          </div>
        ))}

        {/* Multi-Select Filters */}
        {config.multiSelect?.map((filter) => (
          <div key={filter.id} className="w-full relative">
            <MultiSelectFilter
              label={filter.label}
              options={filter.options}
              value={filter.value}
              onChange={filter.onChange}
              placeholder={filter.placeholder}
              maxDisplay={2} // Show 2 tokens max, then "+X more"
            />
          </div>
        ))}

        {/* Custom Filters */}
        {config.customFilters && (
          <div className="w-full">
            {config.customFilters}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(showResetButton || showApplyButton) && (
        <div className="flex flex-wrap justify-end gap-2 mt-4">
          {showResetButton && onReset && (
            <Button
              variant="ghost"
              onClick={onReset}
              className="text-sm hover:bg-surface/50 transition-colors"
            >
              Reset Filters
            </Button>
          )}
          {showApplyButton && onApply && (
            <Button
              variant="primary"
              onClick={onApply}
              className="text-sm btn-neo"
            >
              Apply Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};