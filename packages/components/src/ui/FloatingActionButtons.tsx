"use client";

import React from "react";
import { MessageSquare, BarChart3 } from "lucide-react";
import { cn } from "../lib/utils";

interface FloatingActionButtonsProps {
  onChatClick: () => void;
  onBIClick: () => void;
  isChatOpen: boolean;
  isBIOpen: boolean;
  hasSelectedPoints?: boolean;
  highRiskCount?: number;
  mainContentWidth?: number; // Width percentage of main content area
}

export function FloatingActionButtons({
  onChatClick,
  onBIClick,
  isChatOpen,
  isBIOpen,
  hasSelectedPoints = false,
  highRiskCount = 0,
  mainContentWidth = 100
}: FloatingActionButtonsProps) {
  // Calculate the right position based on main content width
  // When panels are open, keep buttons within the main content area
  const isPanelOpen = isChatOpen || isBIOpen;
  const rightPosition = isPanelOpen
    ? `calc(${100 - mainContentWidth}% + 1.5rem)` // Panel width + gap
    : '1.5rem'; // Normal right margin when no panels

  return (
    <div
      className="fixed bottom-6 z-[60] flex flex-col items-end gap-3"
      style={{ right: rightPosition }}
    >
      {/* AI Bot Button - Show only when chat is closed */}
      {!isChatOpen && (
        <button
          onClick={onChatClick}
          className={cn(
            "group w-14 h-14 flex items-center justify-center rounded-full shadow-lg",
            "transition-all duration-200 hover:scale-105 hover:shadow-xl",
            "bg-background border border-border hover:border-primary"
          )}
          title="AI Bot"
        >
          <MessageSquare className="w-6 h-6 text-primary" />
          {hasSelectedPoints && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>
      )}

      {/* Insights Button - Show only when BI is closed */}
      {!isBIOpen && (
        <button
          onClick={onBIClick}
          className={cn(
            "group relative w-14 h-14 flex items-center justify-center rounded-full shadow-lg",
            "transition-all duration-200 hover:scale-105 hover:shadow-xl",
            "bg-background border border-border hover:border-primary"
          )}
          title="Insights"
        >
          <BarChart3 className="w-6 h-6 text-primary" />
          {highRiskCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-destructive text-white rounded-full min-w-[20px] text-center">
              {highRiskCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}