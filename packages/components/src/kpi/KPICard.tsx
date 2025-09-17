"use client";

import React, { useEffect, useState } from "react";

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendDirection?: "up" | "down" | "neutral";
  icon?: React.ReactNode | string;
  color?: string;
  format?: "number" | "currency" | "percentage" | "text";
  animate?: boolean;
  delay?: number;
  onClick?: (event: React.MouseEvent) => void;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendDirection,
  icon = undefined,
  color = "#38bdf8",
  format = "number",
  animate = true,
  delay = 0,
  onClick,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);

      // Animate the value if it's a number and animation is enabled
      if (animate && typeof value === "number") {
        let start = 0;
        const end = value;
        const duration = 1500;
        const startTime = Date.now();

        const animateValue = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out quart animation
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);

          if (format === "percentage") {
            setAnimatedValue(start + (end - start) * easeOutQuart);
          } else {
            setAnimatedValue(Math.round(start + (end - start) * easeOutQuart));
          }

          if (progress < 1) {
            requestAnimationFrame(animateValue);
          }
        };

        animateValue();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay, animate, format]);

  const formatValue = (val: string | number) => {
    if (format === "text" || typeof val === "string") return val;

    const numValue = animate ? animatedValue : Number(val);

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numValue);
      case "percentage":
        return `${numValue.toFixed(1)}%`;
      case "number":
      default:
        return new Intl.NumberFormat("en-US").format(numValue);
    }
  };

  const getTrendIcon = () => {
    switch (trendDirection) {
      case "up":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case "down":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      case "neutral":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case "up":
        return "#10b981"; // success
      case "down":
        return "#ef4444"; // error
      case "neutral":
        return "#f59e0b"; // warning
      default:
        return color;
    }
  };

  const displayValue = typeof value === "number" && animate ? formatValue(animatedValue) : formatValue(value);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative overflow-hidden rounded-2xl p-6
        glass-card
        transition-all duration-300 ease-out
        ${onClick ? "cursor-pointer" : ""}
        ${isHovered ? "transform -translate-y-1" : ""}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        ${className}
      `}
      style={{
        transitionDelay: `${delay}ms`,
        borderColor: isHovered ? `#38bdf840` : undefined,
      }}
    >
      {/* Gradient background effect */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `linear-gradient(135deg, ${color}20 0%, transparent 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-medium text-muted">{title}</h3>
        </div>

        {/* Value */}
        <div className="mb-2">
          <p className="text-3xl font-bold text-foreground">
            {displayValue}
          </p>
          {subtitle && (
            <p className="text-xs text-muted mt-1">{subtitle}</p>
          )}
        </div>
      </div>

    </div>
  );
};