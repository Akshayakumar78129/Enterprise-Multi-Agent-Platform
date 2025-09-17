"use client";

import React, { ReactNode } from "react";
import { DashboardNavigation } from "./DashboardNavigation";
// Theme switcher removed - using soft pastel theme only

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  headerContent?: ReactNode; // custom content rendered inside the header below title/actions
  sectionLinks?: Array<{ id: string; label: string }>;
  showNavigation?: boolean;
  currentPath?: string;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  description,
  actions,
  headerContent,
  sectionLinks,
  showNavigation = true,
  currentPath = "",
  className = "",
}) => {
  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {showNavigation && (
        <DashboardNavigation
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />
      )}

      <div className="flex flex-col min-h-screen">
        {/* Header - full-width bar, aligned with hamburger */}
        <header className="sticky top-0 z-40 animate-slide-up">
          <div className="w-full bg-background/90 backdrop-blur-lg border-b border-border/50">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Reserve space so fixed hamburger aligns visually and doesn't overlap title */}
                  <div className="w-10 h-6 shrink-0" />
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                      {title}
                    </h1>
                    {description && (
                      <p className="text-muted mt-1 text-sm sm:text-base truncate">{description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {actions && (
                    <div className="flex flex-wrap gap-2">{actions}</div>
                  )}
                </div>
              </div>
              {/* Optional custom header content (e.g., filters, KPIs) */}
              {headerContent && (
                <div className="mt-6 pt-4 border-t border-border/30">
                  {headerContent}
                </div>
              )}

            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

interface DashboardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  columns = 3,
  gap = "md",
  className = "",
}) => {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

interface DashboardSectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  description,
  actions,
  children,
  className = "",
}) => {
  return (
    <section className={`mb-6 sm:mb-8 lg:mb-10 animate-fade-in ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            {title && (
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground neo-section-title">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-muted text-sm sm:text-base mt-1">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-2">{actions}</div>
          )}
        </div>
      )}
      <div className="w-full">
        {children}
      </div>
    </section>
  );
};

interface MetricsRowProps {
  children: ReactNode;
  className?: string;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 ${className}`}>
      {children}
    </div>
  );
};

interface ChartContainerProps {
  title?: string;
  children: ReactNode;
  height?: string | number;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  height = 250,
  className = "",
}) => {
  return (
    <div className={`viz-card relative ${className}`} style={{ overflow: 'visible' }}>
      {title && (
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
          {title}
        </h3>
      )}
      <div
        className="w-full relative"
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: typeof height === 'number' ? `${Math.min(height, 180)}px` : '180px',
          overflow: 'visible',
          zIndex: 1
        }}
      >
        {children}
      </div>
    </div>
  );
};