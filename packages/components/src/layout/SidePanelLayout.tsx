"use client";

import React from "react";
import { cn } from "../lib/utils";

interface SidePanelLayoutProps {
  mainContent: React.ReactNode;
  topPanel?: React.ReactNode;
  bottomPanel?: React.ReactNode;
  isPanelOpen: boolean;
  className?: string;
}

export function SidePanelLayout({
  mainContent,
  topPanel,
  bottomPanel,
  isPanelOpen,
  className
}: SidePanelLayoutProps) {
  const hasBothPanels = !!topPanel && !!bottomPanel;
  const hasOnePanel = (!!topPanel || !!bottomPanel) && !hasBothPanels;

  return (
    <div className={cn("flex min-h-screen", className)}>
      {/* Main Content Area - removed h-screen and overflow-hidden to prevent double scrollbar */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          isPanelOpen ? "w-full lg:w-[70%]" : "w-full"
        )}
      >
        {mainContent}
      </div>

      {/* Side Panel Container - Fixed position to prevent scrolling issues */}
      {isPanelOpen && (
        <div className="hidden lg:block lg:w-[30%] fixed right-0 top-0 h-screen border-l bg-background">
          <div className="flex flex-col h-full">
            {hasBothPanels ? (
              <>
                {/* Top Panel (50% height when both panels) */}
                <div className="flex-1 overflow-hidden border-b">
                  {topPanel}
                </div>
                {/* Bottom Panel (50% height when both panels) */}
                <div className="flex-1 overflow-hidden">
                  {bottomPanel}
                </div>
              </>
            ) : (
              /* Single Panel (full height) */
              <div className="flex-1 overflow-hidden">
                {topPanel || bottomPanel}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile/Tablet Overlay Panels */}
      {isPanelOpen && (
        <div className="lg:hidden">
          {topPanel && (
            <div className="fixed inset-x-0 bottom-0 z-50 h-[60vh] bg-background border-t shadow-2xl">
              {topPanel}
            </div>
          )}
          {bottomPanel && !topPanel && (
            <div className="fixed inset-x-0 bottom-0 z-50 h-[60vh] bg-background border-t shadow-2xl">
              {bottomPanel}
            </div>
          )}
          {hasBothPanels && (
            <>
              <div className="fixed inset-x-0 bottom-[30vh] z-50 h-[30vh] bg-background border-t shadow-2xl">
                {topPanel}
              </div>
              <div className="fixed inset-x-0 bottom-0 z-50 h-[30vh] bg-background border-t shadow-2xl">
                {bottomPanel}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}