"use client";

import React, { useEffect, useState } from "react";
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
  isAnyPanelExpanded?: boolean; // Hide buttons when any panel is in expanded mode
  isNavigationOpen?: boolean; // Hide buttons when navigation drawer is open
}

export function FloatingActionButtons({
  onChatClick,
  onBIClick,
  isChatOpen,
  isBIOpen,
  hasSelectedPoints = false,
  highRiskCount = 0,
  mainContentWidth = 100,
  isAnyPanelExpanded = false,
  isNavigationOpen = false
}: FloatingActionButtonsProps) {
  // Prevent hydration mismatch by only rendering on client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate the right position based on main content width
  // When panels are open, keep buttons within the main content area
  const isPanelOpen = isChatOpen || isBIOpen;
  const rightPosition = isPanelOpen
    ? `calc(${100 - mainContentWidth}% + 1.5rem)` // Panel width + gap
    : '1.5rem'; // Normal right margin when no panels

  // Don't render on server to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Hide all buttons when any panel is in expanded mode
  if (isAnyPanelExpanded) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 z-[60] flex flex-col items-end gap-3 transition-all duration-300",
        isNavigationOpen && "opacity-30 blur-sm pointer-events-none"
      )}
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