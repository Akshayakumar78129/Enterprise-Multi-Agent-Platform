"use client";

import React from "react";
import { cn } from "../lib/utils";

export interface ChartCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  variant?: "default" | "compact" | "prominent";
  noPadding?: boolean;
  actions?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onShiftClick?: (event: React.MouseEvent) => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  loading = false,
  variant = "default",
  noPadding = false,
  actions,
  className = "",
  onClick,
  onShiftClick,
}) => {
  const handleClick = (event: React.MouseEvent) => {
    if (event.shiftKey && onShiftClick) {
      onShiftClick(event);
    } else if (onClick) {
      onClick();
    }
  };
  // Variant styles
  const variantStyles = {
    default: "bg-background/95 border-border/50",
    compact: "bg-background/90 border-border/30",
    prominent: "bg-gradient-to-br from-background to-background/80 border-primary/20",
  };

  // Padding styles
  const paddingStyles = {
    default: noPadding ? "" : "p-4 sm:p-6",
    compact: noPadding ? "" : "p-3 sm:p-4",
    prominent: noPadding ? "" : "p-5 sm:p-7",
  };

  // Title size styles
  const titleSizeStyles = {
    default: "text-lg sm:text-xl",
    compact: "text-base sm:text-lg",
    prominent: "text-xl sm:text-2xl",
  };

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-xl border backdrop-blur-sm",
          "transition-all duration-300",
          variantStyles[variant],
          paddingStyles[variant],
          className
        )}
      >
        {/* Loading skeleton for title */}
        {title && (
          <div className="mb-4">
            <div className="h-6 w-48 bg-muted/50 rounded animate-pulse" />
            {subtitle && (
              <div className="h-4 w-32 bg-muted/40 rounded animate-pulse mt-2" />
            )}
          </div>
        )}

        {/* Loading skeleton for content */}
        <div className="space-y-4">
          <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border backdrop-blur-sm",
        "transition-all duration-300",
        "hover:shadow-lg hover:border-primary/30",
        variantStyles[variant],
        paddingStyles[variant],
        (onClick || onShiftClick) && "cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      {/* Header section */}
      {(title || subtitle || actions) && (
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3
                  className={cn(
                    "font-semibold text-foreground",
                    titleSizeStyles[variant]
                  )}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>

            {/* Action buttons area */}
            {actions && (
              <div className="ml-4 flex items-center gap-2">{actions}</div>
            )}
          </div>
        </div>
      )}

      {/* Chart content */}
      <div className={cn("w-full h-full", noPadding && "-mx-4 sm:-mx-6")}>
        {children}
      </div>
    </div>
  );
};

// Specialized variant for metric cards
export const MetricChartCard: React.FC<ChartCardProps> = (props) => {
  return (
    <ChartCard
      {...props}
      variant="compact"
      className={cn(
        "bg-gradient-to-br from-primary/5 to-transparent",
        props.className
      )}
    />
  );
};

// Specialized variant for main dashboard charts
export const DashboardChartCard: React.FC<ChartCardProps> = (props) => {
  return (
    <ChartCard
      {...props}
      className={cn(
        "shadow-sm hover:shadow-md",
        "bg-card/50 backdrop-blur-md",
        props.className
      )}
    />
  );
};