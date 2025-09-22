"use client";

import React, { useState } from "react";
import { Brain, Lightbulb, TrendingUp } from "lucide-react";
import { cn } from "../lib/utils";

export interface BusinessIntelligenceTriggerProps {
  onClick: () => void;
  highRiskCount?: number;
  position?: "bottom-right" | "bottom-left";
  className?: string;
}

export function BusinessIntelligenceTrigger({
  onClick,
  highRiskCount = 0,
  position = "bottom-right",
  className
}: BusinessIntelligenceTriggerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const positionClasses = {
    "bottom-right": "bottom-24 right-6", // Above chat button
    "bottom-left": "bottom-24 left-6"
  };

  const isUrgent = highRiskCount > 15;

  return (
    <>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed z-40",
          "w-14 h-14 rounded-full",
          "flex items-center justify-center",
          "transition-all duration-300",
          "shadow-lg hover:shadow-xl",
          "hover:scale-110",
          positionClasses[position],
          isUrgent
            ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            : "bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600",
          className
        )}
        aria-label="Open Business Intelligence Insights"
      >
        <Brain className="w-6 h-6 text-white" />

        {/* Pulse animation for urgent state */}
        {isUrgent && (
          <span className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-25" />
        )}

        {/* Badge for high risk count */}
        {highRiskCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {highRiskCount > 99 ? "99+" : highRiskCount}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {isHovered && (
        <div
          className={cn(
            "fixed z-50",
            "bg-gray-900 text-white text-sm",
            "px-3 py-2 rounded-lg",
            "whitespace-nowrap",
            "pointer-events-none",
            "animate-in fade-in duration-200",
            position === "bottom-right" ? "bottom-24 right-20" : "bottom-24 left-20"
          )}
        >
          <div className="font-semibold">Business Intelligence</div>
          <div className="text-xs opacity-90">
            {isUrgent
              ? `⚠️ ${highRiskCount} high-risk customers need attention`
              : "AI-powered insights & recommendations"}
          </div>
        </div>
      )}
    </>
  );
}