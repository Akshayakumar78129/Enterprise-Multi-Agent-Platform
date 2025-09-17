import React, { forwardRef } from "react";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: "default" | "filled" | "outlined";
  leftIcon?: React.ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder = "Select an option",
      variant = "default",
      leftIcon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: "bg-surface border-0 focus:border-accent",
      filled: "bg-surface/50 border-0 focus:border-accent",
      outlined: "bg-transparent border-0 focus:border-accent",
    };

    const selectClasses = `
      ${variants[variant]}
      ${leftIcon ? "pl-10" : "pl-4"}
      ${error ? "border-error focus:border-error" : ""}
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      w-full pr-10 py-2 rounded-xl text-foreground min-h-[48px]
      appearance-none
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-accent/20 focus:shadow-neo
      ${className}
    `;

    return (
      <div className="w-full relative z-10">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            disabled={disabled}
            suppressHydrationWarning
            className={selectClasses}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-surface text-foreground"
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <svg
              className="w-5 h-5"
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
        </div>
        {hint && !error && (
          <p className="mt-1 text-sm text-muted">{hint}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";