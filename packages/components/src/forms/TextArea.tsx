import React, { forwardRef } from "react";

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
  variant?: "default" | "filled" | "outlined";
  resize?: "none" | "vertical" | "horizontal" | "both";
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      hint,
      variant = "default",
      resize = "vertical",
      className = "",
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: "bg-surface border border-border focus:border-accent",
      filled: "bg-surface/50 border border-transparent focus:border-accent",
      outlined: "bg-transparent border-2 border-border focus:border-accent",
    };

    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    const textareaClasses = `
      ${variants[variant]}
      ${resizeClasses[resize]}
      ${error ? "border-error focus:border-error" : ""}
      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      w-full px-4 py-3 rounded-xl text-foreground placeholder-muted
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
        <textarea
          ref={ref}
          rows={rows}
          disabled={disabled}
          className={textareaClasses}
          {...props}
        />
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

TextArea.displayName = "TextArea";