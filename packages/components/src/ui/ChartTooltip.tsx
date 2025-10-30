"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface TooltipItem {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
  suffix?: string;
}

export interface ChartTooltipProps {
  // Content
  title?: string;
  items: TooltipItem[];
  footer?: string | React.ReactNode;

  // Position (can be viewport coordinates or relative to container)
  x: number;
  y: number;
  containerRef?: React.RefObject<HTMLElement | SVGElement>;

  // Anchor and positioning
  anchor?: "top" | "bottom" | "left" | "right" | "auto";
  offsetX?: number;
  offsetY?: number;

  // Styling
  variant?: "default" | "dark" | "light";
  size?: "sm" | "md" | "lg";
  showArrow?: boolean;
  maxWidth?: number;

  // Behavior
  visible: boolean;
  interactive?: boolean;
  className?: string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  title,
  items,
  footer,
  x,
  y,
  containerRef,
  anchor = "auto",
  offsetX = 10,  // Default offset to avoid cursor overlap
  offsetY = 10,  // Default offset to avoid cursor overlap
  variant = "default",
  size = "md",
  showArrow = true,
  maxWidth = 300,
  visible,
  interactive = false,
  className = "",
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [actualAnchor, setActualAnchor] = useState(anchor);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Calculate position based on anchor and viewport bounds
  useEffect(() => {
    if (!visible || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const { innerWidth: vw, innerHeight: vh } = window;

    let finalX = x + offsetX;
    let finalY = y + offsetY;
    let finalAnchor = anchor;

    // Convert container-relative coordinates to viewport coordinates if needed
    if (containerRef?.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      finalX += containerRect.left;
      finalY += containerRect.top;
    }

    // Auto-positioning to keep tooltip in viewport
    if (anchor === "auto") {
      const spaceAbove = finalY;
      const spaceBelow = vh - finalY;
      const spaceLeft = finalX;
      const spaceRight = vw - finalX;

      if (spaceAbove > rect.height + 20) {
        finalAnchor = "top";
        finalY -= rect.height + 10;
      } else if (spaceBelow > rect.height + 20) {
        finalAnchor = "bottom";
        finalY += 10;
      } else if (spaceRight > rect.width + 20) {
        finalAnchor = "right";
        finalX += 10;
      } else {
        finalAnchor = "left";
        finalX -= rect.width + 10;
      }
    } else {
      // Manual anchor positioning
      switch (anchor) {
        case "top":
          finalY -= rect.height + 10;
          finalX -= rect.width / 2;
          break;
        case "bottom":
          finalY += 10;
          finalX -= rect.width / 2;
          break;
        case "left":
          finalX -= rect.width + 10;
          finalY -= rect.height / 2;
          break;
        case "right":
          finalX += 10;
          finalY -= rect.height / 2;
          break;
      }
    }

    // Clamp to viewport bounds
    finalX = Math.max(10, Math.min(vw - rect.width - 10, finalX));
    finalY = Math.max(10, Math.min(vh - rect.height - 10, finalY));

    setPosition({ x: finalX, y: finalY });
    setActualAnchor(finalAnchor);
  }, [visible, x, y, anchor, offsetX, offsetY, containerRef]);

  if (!visible) return null;

  // Size classes
  const sizeClasses = {
    sm: "text-xs p-2",
    md: "text-sm p-3",
    lg: "text-base p-4",
  };

  // Variant classes
  const variantClasses = {
    default: "bg-background/95 border-border text-foreground",
    dark: "bg-gray-900/95 border-gray-700 text-white",
    light: "bg-white/95 border-gray-200 text-gray-900",
  };

  // Arrow classes based on anchor position
  const arrowClasses = {
    top: "bottom-[-5px] left-1/2 -translate-x-1/2 border-t-0 border-l-0",
    bottom: "top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0",
    left: "right-[-5px] top-1/2 -translate-y-1/2 border-l-0 border-b-0",
    right: "left-[-5px] top-1/2 -translate-y-1/2 border-r-0 border-t-0",
  };

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className={`
        fixed z-[9999] rounded-lg border backdrop-blur shadow-lg
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${interactive ? "" : "pointer-events-none"}
        ${className}
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxWidth: `${maxWidth}px`,
      }}
    >
      {/* Arrow */}
      {showArrow && actualAnchor !== "auto" && (
        <div
          className={`
            absolute w-2 h-2 transform rotate-45
            ${variantClasses[variant].split(" ")[0]}
            border
            ${variantClasses[variant].split(" ")[1]}
            ${arrowClasses[actualAnchor as keyof typeof arrowClasses]}
          `}
        />
      )}

      {/* Content */}
      <div className="relative">
        {/* Title */}
        {title && (
          <div className="font-semibold mb-2 pb-2 border-b border-border text-foreground">
            {title}
          </div>
        )}

        {/* Items */}
        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Color indicator */}
                {item.color && (
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}

                {/* Icon */}
                {item.icon && (
                  <div className="flex-shrink-0">{item.icon}</div>
                )}

                {/* Label */}
                <span className="opacity-80">{item.label}:</span>
              </div>

              {/* Value */}
              <span className="font-semibold">
                {typeof item.value === "number" && !item.suffix
                  ? item.value.toLocaleString()
                  : item.value}
                {item.suffix && ` ${item.suffix}`}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        {footer && (
          <div className="mt-2 pt-2 border-t border-current opacity-20 text-xs opacity-70">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render tooltip at root level
  if (typeof document !== "undefined") {
    return createPortal(tooltipContent, document.body);
  }

  return tooltipContent;
};

// Hook for managing tooltip state
export const useChartTooltip = () => {
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title?: string;
    items: TooltipItem[];
  }>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });

  const showTooltip = (x: number, y: number, title: string | undefined, items: TooltipItem[]) => {
    setTooltipData({ visible: true, x, y, title, items });
  };

  const hideTooltip = () => {
    setTooltipData(prev => ({ ...prev, visible: false }));
  };

  return { tooltipData, showTooltip, hideTooltip };
};