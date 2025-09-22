"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Minus, Maximize2, Minimize2, Grid, Move } from 'lucide-react';
import CanvasComponent from './CanvasComponent';
// ComponentRegistry removed to avoid duplicate navigation
import { RootState } from '@/store';
import {
  addComponent,
  removeComponent,
  updateComponent,
  setCanvasTransform,
  setSelectedComponents
} from '@/store/slices/canvasSlice';

interface ConversationalCanvasProps {
  sessionId?: string;
  components?: any;
  onChartInteraction?: (data: any) => void;
  onLaserMove?: (position: { x: number; y: number } | null) => void;
  conversationHistory?: any[];
}

export default function ConversationalCanvas({
  sessionId,
  components: propsComponents,
  onChartInteraction,
  onLaserMove,
  conversationHistory
}: ConversationalCanvasProps) {
  const dispatch = useDispatch();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { components: storeComponents, transform, selectedComponents } = useSelector(
    (state: RootState) => state.canvas
  );

  // Use props components if provided, otherwise use store components
  const components = propsComponents || storeComponents;

  // Pan canvas
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      e.preventDefault();
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      dispatch(setCanvasTransform({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
        scale: transform.scale
      }));
    }
  }, [isDragging, dragStart, transform.scale, dispatch]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom canvas
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(5, transform.scale * delta));
      
      // Zoom towards mouse position
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newX = x - (x - transform.x) * (newScale / transform.scale);
        const newY = y - (y - transform.y) * (newScale / transform.scale);
        
        dispatch(setCanvasTransform({
          x: newX,
          y: newY,
          scale: newScale
        }));
      }
    }
  }, [transform, dispatch]);

  // Zoom controls
  const handleZoomIn = () => {
    dispatch(setCanvasTransform({
      ...transform,
      scale: Math.min(5, transform.scale * 1.2)
    }));
  };

  const handleZoomOut = () => {
    dispatch(setCanvasTransform({
      ...transform,
      scale: Math.max(0.1, transform.scale * 0.8)
    }));
  };

  const handleResetZoom = () => {
    dispatch(setCanvasTransform({ x: 0, y: 0, scale: 1 }));
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      // Reset zoom when entering fullscreen
      dispatch(setCanvasTransform({ x: 0, y: 0, scale: 1 }));
    }
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isFullscreen]);

  // Component registry functionality removed to avoid duplicate navigation

  // Handle component selection with shift-click
  const handleComponentClick = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      const newSelection = selectedComponents.includes(id)
        ? selectedComponents.filter(c => c !== id)
        : [...selectedComponents, id];
      dispatch(setSelectedComponents(newSelection));
    } else {
      dispatch(setSelectedComponents([id]));
    }
  };

  // Clear selection on canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      dispatch(setSelectedComponents([]));
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[1000]' : 'relative w-full h-screen'} overflow-hidden bg-background`}>
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 glass-card hover:bg-accent/10 rounded-lg transition-all"
          title="Zoom In"
        >
          <Plus className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 glass-card hover:bg-accent/10 rounded-lg transition-all"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={toggleFullscreen}
          className={`p-2 rounded-lg transition-all ${
            isFullscreen ? 'bg-accent/20 hover:bg-accent/30 border-accent' : 'glass-card hover:bg-accent/10'
          }`}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-foreground" />
          ) : (
            <Maximize2 className="w-5 h-5 text-foreground" />
          )}
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-lg transition-all ${
            showGrid ? 'bg-accent/20 hover:bg-accent/30 border-accent' : 'glass-card hover:bg-accent/10'
          }`}
          title="Toggle Grid"
        >
          <Grid className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Zoom/Scale Indicator */}
      <div className="absolute bottom-4 right-4 z-30 px-3 py-2 glass-card rounded-lg shadow-lg border border-accent/20">
        <span className="text-sm font-medium text-foreground">
          {Math.round(transform.scale * 100)}%
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        {/* Grid Background */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(183, 148, 244, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(183, 148, 244, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${50 * transform.scale}px ${50 * transform.scale}px`,
              backgroundPosition: `${transform.x}px ${transform.y}px`
            }}
          />
        )}

        {/* Transform Container */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0'
          }}
        >
          {/* Render Components */}
          {Object.values(components).map(component => (
            <CanvasComponent
              key={component.id}
              component={component}
              isSelected={selectedComponents.includes(component.id)}
              onClick={handleComponentClick}
              onUpdate={(updates) => dispatch(updateComponent({ id: component.id, updates }))}
              onRemove={() => dispatch(removeComponent(component.id))}
            />
          ))}
        </div>
      </div>

      {/* Component Registry Panel - Removed to avoid duplicate navigation */}
    </div>
  );
}