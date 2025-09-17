import React from "react";

type SkeletonProps = {
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
  className?: string;
};

export const Skeleton = ({
  variant = "text",
  width,
  height,
  animation = "pulse",
  className = "",
}: SkeletonProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "circular":
        return "rounded-full";
      case "rectangular":
        return "rounded-xl";
      case "text":
      default:
        return "rounded-md";
    }
  };

  const getAnimationStyles = () => {
    switch (animation) {
      case "pulse":
        return "animate-pulse";
      case "wave":
        return "animate-shimmer";
      case "none":
      default:
        return "";
    }
  };

  const getDefaultDimensions = () => {
    switch (variant) {
      case "circular":
        return { width: width || 40, height: height || 40 };
      case "rectangular":
        return { width: width || "100%", height: height || 120 };
      case "text":
      default:
        return { width: width || "100%", height: height || 20 };
    }
  };

  const dimensions = getDefaultDimensions();

  return (
    <div
      className={`
        bg-gradient-to-r from-surface via-border/30 to-surface
        background-size-200
        ${getVariantStyles()}
        ${getAnimationStyles()}
        ${className}
      `}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        backgroundSize: animation === "wave" ? "200% 100%" : undefined,
      }}
    />
  );
};

type SkeletonGroupProps = {
  count?: number;
  children?: React.ReactNode;
  spacing?: "sm" | "md" | "lg";
  className?: string;
};

export const SkeletonGroup = ({
  count = 3,
  children,
  spacing = "md",
  className = "",
}: SkeletonGroupProps) => {
  const spacingClasses = {
    sm: "space-y-2",
    md: "space-y-3",
    lg: "space-y-4",
  };

  if (children) {
    return (
      <div className={`${spacingClasses[spacing]} ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`${spacingClasses[spacing]} ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} />
      ))}
    </div>
  );
};

type SkeletonCardProps = {
  showAvatar?: boolean;
  lines?: number;
  className?: string;
};

export const SkeletonCard = ({
  showAvatar = true,
  lines = 3,
  className = "",
}: SkeletonCardProps) => {
  return (
    <div className={`bg-surface rounded-2xl p-6 border border-border ${className}`}>
      {showAvatar && (
        <div className="flex items-center mb-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="ml-3 flex-1">
            <Skeleton width="60%" height={16} className="mb-2" />
            <Skeleton width="40%" height={14} />
          </div>
        </div>
      )}
      <SkeletonGroup count={lines} spacing="sm" />
      <div className="mt-4 flex gap-2">
        <Skeleton width={80} height={32} className="rounded-xl" />
        <Skeleton width={80} height={32} className="rounded-xl" />
      </div>
    </div>
  );
};