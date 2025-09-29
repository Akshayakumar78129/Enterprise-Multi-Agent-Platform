"use client";

import { useEffect, useRef, useCallback, RefObject } from 'react';
import { ShiftClickSelectionManager, ShiftClickPoint } from '../selection/ShiftClickSelectionManager';

export interface UseShiftClickHandlerOptions {
  enabled?: boolean;
  source: string;
  chartType?: string;
  dashboardContext?: string;
  onShiftClick?: (point: ShiftClickPoint, event: MouseEvent) => void;
}

/**
 * Hook that adds shift+click handling to any element
 * Works alongside existing click handlers without interference
 */
export function useShiftClickHandler(
  elementRef: RefObject<HTMLElement>,
  dataExtractor: (event: MouseEvent) => Omit<ShiftClickPoint, 'id' | 'metadata'> | null,
  options: UseShiftClickHandlerOptions
) {
  const manager = ShiftClickSelectionManager.getInstance();
  const {
    enabled = true,
    source,
    chartType,
    dashboardContext,
    onShiftClick
  } = options;

  const handleClick = useCallback((event: MouseEvent) => {
    if (!enabled) return;

    // Only handle if shift is pressed
    if (!event.shiftKey && !manager.isShiftKeyPressed()) {
      return; // Let normal click handlers work
    }

    // Prevent default to avoid text selection
    event.preventDefault();

    // Extract data from the clicked element
    const pointData = dataExtractor(event);
    if (!pointData) return;

    // Create full point object
    const point: ShiftClickPoint = {
      ...pointData,
      id: `${source}-${pointData.label}-${Date.now()}`,
      source,
      chartType,
      metadata: {
        fromShiftClick: true,
        timestamp: Date.now(),
        dashboardContext
      }
    };

    // Add to selection manager
    const handled = manager.addPoint(point, event);

    // Call custom handler if provided
    if (handled && onShiftClick) {
      onShiftClick(point, event);
    }
  }, [enabled, source, chartType, dashboardContext, dataExtractor, onShiftClick]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    // Add click listener
    element.addEventListener('click', handleClick as any, true);

    // Add visual indicator on shift key
    const updateCursor = (isShiftPressed: boolean) => {
      if (element) {
        element.style.cursor = isShiftPressed ? 'crosshair' : '';
      }
    };

    const unsubscribe = manager.subscribeToShiftKey(updateCursor);

    return () => {
      element.removeEventListener('click', handleClick as any, true);
      if (element) {
        element.style.cursor = '';
      }
      unsubscribe();
    };
  }, [elementRef, handleClick, enabled]);

  return {
    isShiftPressed: manager.isShiftKeyPressed(),
    selectedCount: manager.getPoints().length,
    clearSelections: () => manager.clearAll()
  };
}

/**
 * Simple version for components that already have data
 */
export function useSimpleShiftClick(
  point: Omit<ShiftClickPoint, 'id' | 'metadata'>,
  options: Omit<UseShiftClickHandlerOptions, 'source'>
) {
  const manager = ShiftClickSelectionManager.getInstance();
  const { enabled = true, chartType, dashboardContext, onShiftClick } = options;

  const handleShiftClick = useCallback((event: React.MouseEvent | MouseEvent) => {
    if (!enabled) return false;

    // Check if shift is pressed
    if (!event.shiftKey && !manager.isShiftKeyPressed()) {
      return false;
    }

    // Create full point object
    const fullPoint: ShiftClickPoint = {
      ...point,
      id: `${point.source}-${point.label}-${Date.now()}`,
      chartType,
      metadata: {
        fromShiftClick: true,
        timestamp: Date.now(),
        dashboardContext
      }
    };

    // Add to selection
    const handled = manager.addPoint(fullPoint, event as MouseEvent);

    // Call custom handler
    if (handled && onShiftClick) {
      onShiftClick(fullPoint, event as MouseEvent);
    }

    return handled;
  }, [enabled, point, chartType, dashboardContext, onShiftClick]);

  return {
    handleShiftClick,
    isShiftPressed: manager.isShiftKeyPressed(),
    selectedCount: manager.getPoints().length
  };
}