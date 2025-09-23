import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "outlined" | "secondary";
  size?: "sm" | "md" | "lg";
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  suppressHydrationWarning?: boolean;
};

export const Badge = ({
  children,
  variant = "default",
  size = "md",
  removable = false,
  onRemove,
  className = "",
  suppressHydrationWarning = false,
}: BadgeProps) => {
  const variants = {
    default: "bg-surface text-foreground border border-border",
    success: "bg-success/20 text-success border border-success/30",
    warning: "bg-warning/20 text-warning border border-warning/30",
    error: "bg-error/20 text-error border border-error/30",
    info: "bg-accent/20 text-accent border border-accent/30",
    outlined: "bg-transparent text-foreground border-2 border-accent",
    secondary: "bg-muted/20 text-muted border border-muted/30",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={`
        ${variants[variant]}
        ${sizes[size]}
        inline-flex items-center gap-1.5 rounded-full font-medium
        transition-all duration-200
        ${className}
      `}
      suppressHydrationWarning={suppressHydrationWarning}
    >
      {children}
      {removable && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          className="ml-1 -mr-1 hover:bg-foreground/10 rounded-full p-0.5 transition-colors cursor-pointer"
          aria-label="Remove"
          role="button"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
      )}
    </span>
  );
};

type ChipProps = BadgeProps & {
  selected?: boolean;
  onClick?: () => void;
};

export const Chip = ({
  children,
  variant = "default",
  size = "md",
  selected = false,
  onClick,
  removable = false,
  onRemove,
  className = "",
}: ChipProps) => {
  const variants = {
    default: selected
      ? "bg-accent text-background border border-accent"
      : "bg-surface text-foreground border border-border hover:border-accent",
    success: "bg-success/20 text-success border border-success/30",
    warning: "bg-warning/20 text-warning border border-warning/30",
    error: "bg-error/20 text-error border border-error/30",
    info: "bg-accent/20 text-accent border border-accent/30",
    outlined: selected
      ? "bg-accent/20 text-accent border-2 border-accent"
      : "bg-transparent text-foreground border-2 border-border hover:border-accent",
    secondary: selected
      ? "bg-muted/30 text-muted border border-muted/40"
      : "bg-muted/20 text-muted border border-muted/30 hover:border-accent",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  const isClickable = onClick !== undefined;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${isClickable ? "cursor-pointer" : "cursor-default"}
        inline-flex items-center gap-1.5 rounded-full font-medium
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-accent/20
        ${className}
      `}
    >
      {children}
      {removable && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 -mr-1 hover:bg-foreground/10 rounded-full p-0.5 transition-colors cursor-pointer"
          aria-label="Remove"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
      )}
    </button>
  );
};