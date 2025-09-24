"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Minimize2, Maximize2, Move, GripVertical } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getComponentFromRegistry } from './ComponentRegistry';
import { ComponentErrorBoundary } from '../ErrorBoundary';

// Z-Index hierarchy system (imported from main page)
const Z_INDEX = {
  ROBOT: 50,
  SPEECH_BUBBLE: 100,
  AUDIO_CONTROLS: 200,
  CANVAS_BASE: 300,
  COMPONENTS_BASE: 1000,
  COMPONENTS_SELECTED: 2000,
  FULLSCREEN: 5000,
  FULLSCREEN_CONTROLS: 5001
};

export interface CanvasComponentData {
  id: string;
  type: string;
  toolId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: any;
  minimized: boolean;
}

interface CanvasComponentProps {
  component: CanvasComponentData;
  isSelected: boolean;
  onClick: (id: string, e: React.MouseEvent) => void;
  onUpdate: (updates: Partial<CanvasComponentData>) => void;
  onRemove: () => void;
}

export default function CanvasComponent({
  component,
  isSelected,
  onClick,
  onUpdate,
  onRemove
}: CanvasComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load component dynamically
  useEffect(() => {
    const loadComponent = async () => {
      try {
        setLoading(true);
        const comp = await getComponentFromRegistry(component.toolId, component.type);
        if (comp) {
          setComponent(() => comp);
          setError(null);
        } else {
          setError(`Component ${component.toolId}.${component.type} not found`);
        }
      } catch (err) {
        setError(`Failed to load component: ${err}`);
      } finally {
        setLoading(false);
      }
    };
    loadComponent();
  }, [component.toolId, component.type]);

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !isResizing) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - component.position.x,
        y: e.clientY - component.position.y
      });
    }
  }, [component.position, isResizing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      onUpdate({
        position: {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        }
      });
    }
  }, [isDragging, dragStart, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Handle resizing
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = component.size.width;
    const startHeight = component.size.height;

    const handleResize = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      onUpdate({
        size: {
          width: Math.max(500, startWidth + deltaX),  // Increased minimum width to 500
          height: Math.max(400, startHeight + deltaY)  // Increased minimum height to 400
        }
      });
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [component.size, onUpdate]);

  // Setup global mouse listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleToggleMinimize = () => {
    onUpdate({ minimized: !component.minimized });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(component.id, e);
  };

  return (
    <div
      ref={containerRef}
      className={`absolute glass-card rounded-lg shadow-xl transition-all ${
        isSelected ? 'ring-2 ring-primary' : 'ring-1 ring-border'
      } ${isDragging ? 'cursor-grabbing' : ''} ${component.minimized ? 'h-auto' : ''}`}
      style={{
        left: component.position.x,
        top: component.position.y,
        width: component.minimized ? 'auto' : component.size.width,
        height: component.minimized ? 'auto' : component.size.height,
        zIndex: isSelected ? Z_INDEX.COMPONENTS_SELECTED : Z_INDEX.COMPONENTS_BASE + (component.zIndex || 0)
      }}
      onClick={handleClick}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-lg cursor-grab border-b border-border"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {component.toolId} - {component.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleMinimize}
            className="p-1 hover:bg-white/10 rounded transition-all"
          >
            {component.minimized ? (
              <Maximize2 className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Minimize2 className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 hover:bg-destructive/20 rounded transition-all"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!component.minimized && (
        <div className="relative p-4 h-[calc(100%-40px)] overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-muted-foreground">Loading component...</div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-destructive text-sm">{error}</div>
            </div>
          )}
          {!loading && !error && Component && (
            <ComponentErrorBoundary componentType={`${component.toolId}.${component.type}`}>
              <div className="w-full h-full">
                {/* Pass the data with proper format handling */}
                {(() => {
                  console.log(`[CanvasComponent] ${component.type} - component.data:`, component.data);
                  console.log(`[CanvasComponent] ${component.type} - data structure:`, {
                    isObject: typeof component.data === 'object' && component.data !== null,
                    hasDataProperty: component.data && typeof component.data === 'object' && 'data' in component.data,
                    dataValue: component.data && component.data.data ? component.data.data : 'Direct data',
                    dataIsArray: component.data && component.data.data && Array.isArray(component.data.data),
                    directIsArray: Array.isArray(component.data)
                  });

                  // Handle different data formats
                  let propsToPass = component.data;

                  // If component.data is already in the correct format { data: [...] }, use it as-is
                  if (component.data && typeof component.data === 'object' && 'data' in component.data) {
                    propsToPass = component.data;
                    console.log(`[CanvasComponent] ${component.type} - Using data as-is (already has data property)`);

                    // Validate the data array exists and is properly formatted
                    if (Array.isArray(propsToPass.data)) {
                      console.log(`[CanvasComponent] ${component.type} - Data array has ${propsToPass.data.length} items`);
                    } else if (propsToPass.data === null || propsToPass.data === undefined) {
                      console.warn(`[CanvasComponent] ${component.type} - Data property is null/undefined, using empty array`);
                      propsToPass = { ...propsToPass, data: [] };
                    }
                  }
                  // If component.data is a direct array, wrap it in { data: [...] }
                  else if (Array.isArray(component.data)) {
                    propsToPass = { data: component.data };
                    console.log(`[CanvasComponent] ${component.type} - Wrapping array in data property with ${component.data.length} items`);
                  }
                  // Otherwise, assume it's already properly formatted or has other props
                  else {
                    propsToPass = component.data || {};
                    console.log(`[CanvasComponent] ${component.type} - Using data as-is (other format)`);

                    // If no data at all, provide empty structure
                    if (!propsToPass || Object.keys(propsToPass).length === 0) {
                      console.warn(`[CanvasComponent] ${component.type} - No data provided, using default empty structure`);
                      propsToPass = { data: [] };
                    }
                  }

                  console.log(`[CanvasComponent] ${component.type} - Final props:`, propsToPass);

                  // Additional validation for specific component types
                  if (component.type === 'riskPyramid' || component.type === 'featureImportance' || component.type === 'segmentMatrix') {
                    if (!propsToPass.data || !Array.isArray(propsToPass.data)) {
                      console.error(`[CanvasComponent] ${component.type} requires data array, but got:`, propsToPass);
                      // Provide fallback empty array
                      propsToPass = { ...propsToPass, data: [] };
                    }
                  }

                  return <Component {...propsToPass} />;
                })()}
              </div>
            </ComponentErrorBoundary>
          )}

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
            onMouseDown={handleResizeStart}
          >
            <svg
              className="w-full h-full text-muted-foreground"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M14 14 L14 10 M14 14 L10 14 M14 14 L6 6 M10 10 L10 6 M10 10 L6 10" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}