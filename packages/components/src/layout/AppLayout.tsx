"use client";

import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { GripVertical, Maximize2, Minimize2, X } from "lucide-react";
import { FloatingActionButtons } from "../ui/FloatingActionButtons";
import { DashboardNavigation } from "./DashboardNavigation";

interface AppLayoutProps {
  title: string;
  mainContent: React.ReactNode; // Includes filters, metrics, graphs
  chatPanel?: React.ReactNode;
  biPanel?: React.ReactNode;
  isChatOpen: boolean;
  isBIOpen: boolean;
  onChatToggle: () => void;
  onBIToggle: () => void;
  onChatExpandToggle?: (expanded: boolean) => void;
  onBIExpandToggle?: (expanded: boolean) => void;
  hasSelectedPoints?: boolean;
  highRiskCount?: number;
  showNavigation?: boolean;
  currentPath?: string;
}

export function AppLayout({
  title,
  mainContent,
  chatPanel,
  biPanel,
  isChatOpen,
  isBIOpen,
  onChatToggle,
  onBIToggle,
  onChatExpandToggle,
  onBIExpandToggle,
  hasSelectedPoints = false,
  highRiskCount = 0,
  showNavigation = true,
  currentPath = ""
}: AppLayoutProps) {
  const isPanelOpen = isChatOpen || isBIOpen;
  const hasBothPanels = isChatOpen && isBIOpen;

  // State for main content/panel split (default 75/25)
  const [mainPanelSplit, setMainPanelSplit] = useState(75);

  // State for chat/BI panel split (default 50/50)
  const [panelDividerPosition, setPanelDividerPosition] = useState(50);

  // State for expanded panels
  const [expandedPanel, setExpandedPanel] = useState<'chat' | 'bi' | null>(null);

  // State for navigation drawer
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  // Reset to default 75/25 split when panels close
  useEffect(() => {
    if (!isPanelOpen) {
      setMainPanelSplit(75);
      setExpandedPanel(null);
    }
  }, [isPanelOpen]);

  // Reset panel divider when switching from dual to single panel
  useEffect(() => {
    if (!hasBothPanels) {
      setPanelDividerPosition(50);
    }
  }, [hasBothPanels]);

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  // Handle main resize (between content and panels)
  const handleMainResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startSplit = mainPanelSplit;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaPercentage = (deltaX / window.innerWidth) * 100;
      const newSplit = Math.max(50, Math.min(85, startSplit + deltaPercentage));
      setMainPanelSplit(newSplit);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle panel resize (between chat and BI panels)
  const handlePanelResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startPosition = panelDividerPosition;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const containerHeight = window.innerHeight;
      const deltaPercentage = (deltaY / containerHeight) * 100;
      const newPosition = Math.max(20, Math.min(80, startPosition + deltaPercentage));
      setPanelDividerPosition(newPosition);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Hamburger Menu */}
      {showNavigation && (
        <DashboardNavigation
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onNavigationChange={setIsNavigationOpen}
        />
      )}

      <div className="flex flex-col h-screen overflow-hidden">
        {/* Title Bar - Always full width within its container */}
        <div className="flex-shrink-0 bg-background/90 backdrop-blur-lg border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-6 shrink-0" /> {/* Space for hamburger menu */}
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {title}
              </h1>
            </div>
          </div>
        </div>

        {/* Content and Panel Container */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main Content Area - Dynamically sized */}
          <div
            className="overflow-y-auto relative"
            style={{ width: isPanelOpen ? `${mainPanelSplit}%` : '100%' }}
          >
            {mainContent}

            {/* Floating Action Buttons - Fixed position within main content bounds */}
            <FloatingActionButtons
              onChatClick={onChatToggle}
              onBIClick={onBIToggle}
              isChatOpen={isChatOpen}
              isBIOpen={isBIOpen}
              hasSelectedPoints={hasSelectedPoints}
              highRiskCount={highRiskCount}
              mainContentWidth={mainPanelSplit}
              isAnyPanelExpanded={expandedPanel !== null}
              isNavigationOpen={isNavigationOpen}
            />
          </div>

          {/* Resize Handle between main content and panels */}
          {isPanelOpen && (
            <div
              className="w-1 bg-border hover:bg-primary/20 cursor-col-resize flex items-center justify-center"
              onMouseDown={handleMainResize}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {/* Panel Space - Dynamically sized */}
          {isPanelOpen && (
            <div className="relative" style={{ width: `${100 - mainPanelSplit}%` }}>
              {/* This creates the panel space on the right */}
            </div>
          )}
        </div>

        {/* Panel Container - Dynamically positioned */}
        {isPanelOpen && !expandedPanel && (
          <div
            className="fixed top-0 bottom-0 z-50 bg-background border-l border-border/50"
            style={{
              right: 0,
              width: `${100 - mainPanelSplit}%`
            }}
          >
            {hasBothPanels ? (
              // Both panels open - split vertically with resize handle
              <div className="h-full flex flex-col">
                {/* Chat Panel - Dynamically sized */}
                <div
                  className="relative overflow-hidden border-b border-border/50"
                  style={{ height: `${panelDividerPosition}%` }}
                >
                  {/* Expand button for chat - properly aligned with close button */}
                  <button
                    onClick={() => setExpandedPanel('chat')}
                    className="absolute top-4 right-12 z-10 w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    title="Expand"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  {chatPanel}
                </div>

                {/* Resize Handle between panels */}
                <div
                  className="h-1 bg-border hover:bg-primary/20 cursor-ns-resize flex items-center justify-center"
                  onMouseDown={handlePanelResize}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground rotate-90" />
                </div>

                {/* BI Panel - Dynamically sized */}
                <div
                  className="relative overflow-hidden"
                  style={{ height: `calc(${100 - panelDividerPosition}% - 0.25rem)` }}
                >
                  {/* Expand button for BI - properly aligned with close button */}
                  <button
                    onClick={() => setExpandedPanel('bi')}
                    className="absolute top-4 right-12 z-10 w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    title="Expand"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  {biPanel}
                </div>
              </div>
            ) : (
              // Single panel open - full height
              <div className="h-full relative overflow-hidden">
                {/* Expand button for single panel - dynamically positioned based on panel type */}
                <button
                  onClick={() => setExpandedPanel(isChatOpen ? 'chat' : 'bi')}
                  className={cn(
                    "absolute right-12 z-10 w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors",
                    isChatOpen ? "top-4" : "top-4"
                  )}
                  title="Expand"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                {isChatOpen ? chatPanel : biPanel}
              </div>
            )}
          </div>
        )}

        {/* Expanded Panel - Full Screen */}
        {expandedPanel && (
          <div className="fixed inset-0 z-[55] bg-background">
            <div className="h-full relative">
              {/* Collapse button - positioned absolutely to overlay on panel content */}
              <button
                onClick={() => setExpandedPanel(null)}
                className="absolute top-4 right-12 z-[60] w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors bg-background"
                title="Collapse"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              {/* Panel Content - no additional header */}
              {expandedPanel === 'chat' ? chatPanel : biPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}