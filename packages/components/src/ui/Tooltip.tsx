"use client";

import React, { useState, useRef, useEffect } from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

type TooltipProps = {
  children: React.ReactNode;
  content: string | React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
};

export const Tooltip = ({
  children,
  content,
  position = "top",
  delay = 200,
  className = "",
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newPosition = position;

      // Check if tooltip would overflow viewport and adjust position
      if (position === "top" && triggerRect.top - tooltipRect.height < 0) {
        newPosition = "bottom";
      } else if (position === "bottom" && triggerRect.bottom + tooltipRect.height > viewportHeight) {
        newPosition = "top";
      } else if (position === "left" && triggerRect.left - tooltipRect.width < 0) {
        newPosition = "right";
      } else if (position === "right" && triggerRect.right + tooltipRect.width > viewportWidth) {
        newPosition = "left";
      }

      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const getTooltipStyles = () => {
    const base = "absolute z-50 px-3 py-2 text-sm rounded-lg bg-surface border border-border shadow-neo";

    switch (actualPosition) {
      case "top":
        return `${base} bottom-full left-1/2 -translate-x-1/2 mb-2`;
      case "bottom":
        return `${base} top-full left-1/2 -translate-x-1/2 mt-2`;
      case "left":
        return `${base} right-full top-1/2 -translate-y-1/2 mr-2`;
      case "right":
        return `${base} left-full top-1/2 -translate-y-1/2 ml-2`;
      default:
        return base;
    }
  };

  const getArrowStyles = () => {
    const base = "absolute w-2 h-2 bg-surface border border-border transform rotate-45";

    switch (actualPosition) {
      case "top":
        return `${base} -bottom-1 left-1/2 -translate-x-1/2 border-t-0 border-l-0`;
      case "bottom":
        return `${base} -top-1 left-1/2 -translate-x-1/2 border-b-0 border-r-0`;
      case "left":
        return `${base} -right-1 top-1/2 -translate-y-1/2 border-l-0 border-b-0`;
      case "right":
        return `${base} -left-1 top-1/2 -translate-y-1/2 border-r-0 border-t-0`;
      default:
        return base;
    }
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`${getTooltipStyles()} ${className} animate-in fade-in duration-200`}
        >
          <div className={getArrowStyles()} />
          <div className="relative text-foreground">{content}</div>
        </div>
      )}
    </div>
  );
};

type TooltipProviderProps = {
  children: React.ReactNode;
  delayDuration?: number;
};

export const TooltipProvider = ({ children, delayDuration = 200 }: TooltipProviderProps) => {
  return (
    <div data-tooltip-delay={delayDuration}>
      {children}
    </div>
  );
};