"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Minimize2, Maximize2, Move, GripVertical } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getComponentFromRegistry } from './ComponentRegistry';

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
          width: Math.max(200, startWidth + deltaX),
          height: Math.max(150, startHeight + deltaY)
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
        zIndex: isSelected ? 1000 : 100
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
            <Component {...component.data} />
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