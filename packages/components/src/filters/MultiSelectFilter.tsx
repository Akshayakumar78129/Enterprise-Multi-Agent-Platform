"use client";

import React, { useState, useRef, useEffect } from "react";
import { Badge } from "../ui/Badge";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectFilterProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
  className?: string;
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select options",
  maxDisplay = 2, // Reduced default to show more "+X more" behavior
  className = "",
}) => {
  // Ensure value is always an array to prevent hydration mismatches
  const safeValue = Array.isArray(value) ? value : [];
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOption = (optionValue: string) => {
    const newValue = safeValue.includes(optionValue)
      ? safeValue.filter((v) => v !== optionValue)
      : [...safeValue, optionValue];
    onChange(newValue);
  };

  const handleSelectAll = () => {
    const allValues = options.filter((o) => !o.disabled).map((o) => o.value);
    onChange(allValues);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (safeValue.length === 0) return placeholder;
    return ""; // We'll show tokens inside instead
  };

  return (
    <div ref={dropdownRef} className={`relative z-10 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-surface border-0 rounded-lg text-left text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors min-h-[48px] text-sm"
        suppressHydrationWarning
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            {/* Ensure consistent structure for hydration */}
            <div className="flex items-center gap-2 flex-1">
              {safeValue.length > 0 ? (
                <>
                  {safeValue.slice(0, maxDisplay).map((v) => {
                    const option = options.find((o) => o.value === v);
                    return (
                      <Badge
                        key={v}
                        variant="info"
                        size="sm"
                        removable
                        onRemove={() => handleToggleOption(v)}
                        className="shrink-0"
                      >
                        {option?.label || v}
                      </Badge>
                    );
                  })}
                  {safeValue.length > maxDisplay && (
                    <Badge variant="secondary" size="sm" className="shrink-0">
                      +{safeValue.length - maxDisplay} more
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-muted">{placeholder}</span>
              )}
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-muted transition-transform shrink-0 ${
              isOpen ? "transform rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-neo max-h-48 overflow-y-auto min-w-[180px] left-0 top-full">
          {/* Select All / Clear All */}
          <div className="flex justify-between p-2 border-b border-border">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-accent hover:text-accent/80 transition-colors"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Options */}
          <div className="p-2 max-h-32 overflow-y-auto">
            {options.map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-2 rounded-lg hover:bg-background cursor-pointer transition-colors ${
                  option.disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={safeValue.includes(option.value)}
                  onChange={() => !option.disabled && handleToggleOption(option.value)}
                  disabled={option.disabled}
                  className="w-4 h-4 text-accent bg-surface border-border rounded focus:ring-accent focus:ring-2"
                />
                <span className="ml-3 text-sm text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};