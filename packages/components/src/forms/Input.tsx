import React, { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "default" | "filled" | "outlined";
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      variant = "default",
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

    const inputClasses = `
      ${variants[variant]}
      ${leftIcon ? "pl-10" : "px-4"}
      ${rightIcon ? "pr-10" : "px-4"}
      ${error ? "border-error focus:border-error" : ""}
      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      w-full py-2 rounded-xl text-foreground placeholder-muted min-h-[48px]
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-accent/20 focus:shadow-neo
      ${className}
    `;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            suppressHydrationWarning
            className={inputClasses}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              {rightIcon}
            </div>
          )}
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

Input.displayName = "Input";