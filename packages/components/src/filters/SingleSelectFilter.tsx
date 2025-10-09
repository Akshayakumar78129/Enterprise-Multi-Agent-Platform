"use client";

import React, { useState, useRef, useEffect } from "react";

export interface SingleSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SingleSelectFilterProps {
  label?: string;
  options: SingleSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SingleSelectFilter: React.FC<SingleSelectFilterProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select option",
  className = "",
}) => {
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

  const handleSelectOption = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!value) return placeholder;
    const selectedOption = options.find((o) => o.value === value);
    return selectedOption?.label || value;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-surface border-0 rounded-lg text-left text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors min-h-[48px] text-sm"
      >
        <div className="flex items-center justify-between w-full">
          <span className={value ? "text-foreground" : "text-muted"}>
            {getDisplayText()}
          </span>
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
        <div className="absolute z-[100] w-full mt-1 bg-surface border border-border rounded-lg shadow-neo max-h-48 overflow-y-auto min-w-[180px] left-0 top-full">
          {/* Options */}
          <div className="p-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && handleSelectOption(option.value)}
                disabled={option.disabled}
                className={`w-full text-left p-2 rounded-lg hover:bg-background transition-colors ${
                  option.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                } ${
                  value === option.value ? "bg-accent/10 text-accent" : "text-foreground"
                }`}
              >
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
