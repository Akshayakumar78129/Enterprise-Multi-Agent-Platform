"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ShiftClickSelectionManager, ShiftClickPoint } from './ShiftClickSelectionManager';

export interface SelectionIndicatorProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showShiftHint?: boolean;
}

export const SelectionIndicator: React.FC<SelectionIndicatorProps> = ({
  className = '',
  position = 'bottom-right',
  showShiftHint = true
}) => {
  const [selectedPoints, setSelectedPoints] = useState<ShiftClickPoint[]>([]);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const manager = ShiftClickSelectionManager.getInstance();

  useEffect(() => {
    // Subscribe to selection changes
    const unsubscribeSelection = manager.subscribe((points) => {
      setSelectedPoints(points);
      // Auto-expand when points are added
      if (points.length > 0 && !isExpanded) {
        setIsExpanded(true);
      }
    });

    // Subscribe to shift key state
    const unsubscribeShift = manager.subscribeToShiftKey((pressed) => {
      setIsShiftPressed(pressed);
    });

    return () => {
      unsubscribeSelection();
      unsubscribeShift();
    };
  }, []);

  // Position styles
  const positionStyles: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Don't show if no selections and shift not pressed (unless we want to show hint)
  if (selectedPoints.length === 0 && !isShiftPressed && !showShiftHint) {
    return null;
  }

  return (
    <div
      className={`fixed ${positionStyles[position]} z-50 ${className}`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Shift key indicator */}
      {isShiftPressed && selectedPoints.length === 0 && (
        <div className="bg-blue-500/90 text-white px-3 py-2 rounded-lg shadow-lg mb-2 animate-pulse">
          <div className="text-xs font-semibold">
            ⇧ SHIFT + Click to select multiple points
          </div>
        </div>
      )}

      {/* Selection count badge */}
      {selectedPoints.length > 0 && (
        <div className="bg-background/95 backdrop-blur border border-border rounded-lg shadow-xl">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-bold">
                {selectedPoints.length}
              </div>
              <span className="text-sm font-medium">
                {selectedPoints.length === 1 ? 'Selection' : 'Selections'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {isExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    manager.clearAll();
                    setIsExpanded(false);
                  }}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="Clear all selections (ESC)"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <svg
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Expanded selection list */}
          {isExpanded && selectedPoints.length > 0 && (
            <div className="border-t border-border max-h-64 overflow-y-auto">
              {selectedPoints.map((point, index) => (
                <div
                  key={point.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {point.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {point.value} • {point.source}
                    </div>
                  </div>
                  <button
                    onClick={() => manager.removePoint(point.id)}
                    className="ml-2 p-1 hover:bg-muted rounded transition-colors"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer hint */}
          {isExpanded && (
            <div className="px-3 py-2 border-t border-border bg-muted/30">
              <div className="text-xs text-muted-foreground">
                Press <kbd className="px-1 py-0.5 bg-background rounded text-xs">ESC</kbd> to clear all
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial hint (when enabled and no selections) */}
      {showShiftHint && selectedPoints.length === 0 && !isShiftPressed && (
        <div className="bg-muted/80 backdrop-blur text-muted-foreground px-3 py-2 rounded-lg text-xs">
          💡 Hold <kbd className="px-1 py-0.5 bg-background rounded">Shift</kbd> and click charts to select
        </div>
      )}
    </div>
  );
};