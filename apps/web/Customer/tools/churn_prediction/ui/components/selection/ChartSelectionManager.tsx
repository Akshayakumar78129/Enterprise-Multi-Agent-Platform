import React, { useState, useCallback, useEffect, useRef } from 'react';

export interface SelectedPoint {
  chartId: string;
  chartType: string;
  dataIndex: number;
  label: string;
  value: number;
  unit?: string;
  coordinates: { x: number; y: number };
  element?: any;
  color?: string;
  isAnomaly?: boolean;
  trend?: string;
}

interface ChartSelectionManagerProps {
  children?: React.ReactNode;
  onSelectionChange?: (points: SelectedPoint[]) => void;
  onInsightGenerated?: (insight: string) => void;
  onShowMessage?: (message: string, position?: { x: number; y: number }) => void;
}

export const ChartSelectionManager: React.FC<ChartSelectionManagerProps> = ({
  children,
  onSelectionChange,
  onInsightGenerated,
  onShowMessage
}) => {
  const [selectedPoints, setSelectedPoints] = useState<SelectedPoint[]>([]);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const selectionRef = useRef<SelectedPoint[]>([]);


  // Handle chart point selection
  const handlePointSelection = useCallback((point: SelectedPoint, isMultiSelect: boolean) => {
    // Convert viewport coordinates to page coordinates
    const pointWithPageCoords = {
      ...point,
      coordinates: point.coordinates ? {
        x: point.coordinates.x + window.scrollX,
        y: point.coordinates.y + window.scrollY
      } : undefined
    };

    let newSelection: SelectedPoint[];

    if (isMultiSelect) {
      // Check if point already selected
      const existingIndex = selectionRef.current.findIndex(
        p => p.chartId === pointWithPageCoords.chartId && p.dataIndex === pointWithPageCoords.dataIndex
      );

      if (existingIndex >= 0) {
        // Remove if already selected
        newSelection = selectionRef.current.filter((_, idx) => idx !== existingIndex);
      } else {
        // Add to selection with page coordinates
        newSelection = [...selectionRef.current, pointWithPageCoords];
      }
    } else {
      // Single selection - replace all
      newSelection = [pointWithPageCoords];
    }

    selectionRef.current = newSelection;
    setSelectedPoints(newSelection);
    
    // Show tooltip when adding a point
    if (newSelection.length > 0 && isMultiSelect) {
      const lastPoint = point;
      setTooltipPosition({ 
        x: lastPoint.coordinates?.x || window.innerWidth / 2, 
        y: lastPoint.coordinates?.y || window.innerHeight / 2 
      });
      setShowTooltip(true);
      
      // Hide tooltip after 2 seconds
      setTimeout(() => {
        setShowTooltip(false);
      }, 2000);
    }
    
    // Generate and show insight message for selected points
    if (newSelection.length > 0 && onShowMessage) {
      const insight = generateSelectionInsight(newSelection);
      const avgX = newSelection.reduce((sum, p) => sum + (p.coordinates?.x || 0), 0) / newSelection.length;
      const avgY = newSelection.reduce((sum, p) => sum + (p.coordinates?.y || 0), 0) / newSelection.length;
      onShowMessage(insight, { x: avgX, y: avgY });
    } else if (newSelection.length === 0 && onShowMessage) {
      onShowMessage(''); // Clear message when no selection
    }
    
    // Notify parent
    onSelectionChange?.(newSelection);
  }, [onSelectionChange, onShowMessage]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    selectionRef.current = [];
    setSelectedPoints([]);
    onSelectionChange?.([]);
    onShowMessage?.(''); // Clear message
  }, [onSelectionChange, onShowMessage]);

  // Handle keyboard events for shift key and ESC, and track scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      } else if (e.key === 'Escape') {
        // Clear selection on ESC
        clearSelection();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    const handleScroll = () => {
      // Force re-render by updating scroll offset state
      setScrollOffset({ x: window.scrollX, y: window.scrollY });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('scroll', handleScroll, true); // Use capture phase

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [clearSelection]);
  
  // Generate insight message for selected points
  const generateSelectionInsight = (points: SelectedPoint[]) => {
    if (points.length === 0) return '';
    
    let message = `🎯 **Multi-Selection Analysis**\n`;
    message += `${points.length} point${points.length > 1 ? 's' : ''} selected:\n`;
    
    // Group by chart type
    const byChartType = points.reduce((acc, point) => {
      if (!acc[point.chartType]) acc[point.chartType] = [];
      acc[point.chartType].push(point);
      return acc;
    }, {} as Record<string, SelectedPoint[]>);
    
    // Display selected points compactly
    Object.entries(byChartType).forEach(([chartType, pts]) => {
      message += `\n📊 **${chartType}:**`;
      pts.forEach(p => {
        const risk = p.value > 50 ? '🔴' : p.value > 30 ? '🟠' : '🟢';
        message += ` ${risk}${p.label}(${p.value}${p.unit || ''})`;
      });
    });
    
    // Calculate totals
    const totalValue = points.reduce((sum, p) => sum + (p.value || 0), 0);
    const maxPoint = points.reduce((max, p) => p.value > max.value ? p : max);
    
    message += `\n\n**Summary:** ${totalValue.toFixed(0)} total • $${(totalValue * 2.5).toFixed(0)}K risk`;
    message += `\nMax: ${maxPoint.label}(${maxPoint.value})`;
    
    // Quick recommendation
    if (totalValue > 100) {
      message += `\n🚨 **Critical:** Immediate action needed`;
    } else if (totalValue > 50) {
      message += `\n⚠️ **Warning:** Monitor closely`;
    } else {
      message += `\n✅ **OK:** Continue monitoring`;
    }
    
    message += `\n\n**Actions:** Open Chat • ESC to clear • Shift+Click for more`;
    
    return message;
  };

  // Expose selection API to window for chart components
  useEffect(() => {
    const selectionAPI = {
      addPoint: (point: SelectedPoint) => {
        handlePointSelection(point, isShiftPressed);
      },
      clearSelection,
      isMultiSelectMode: () => isShiftPressed,
      getSelection: () => selectionRef.current
    };

    (window as any).chartSelectionAPI = selectionAPI;

    return () => {
      delete (window as any).chartSelectionAPI;
    };
  }, [handlePointSelection, clearSelection, isShiftPressed]);


  return (
    <>
      <style>
        {`
          .selection-indicator {
            position: fixed;
            width: 16px;
            height: 16px;
            border: 3px solid #39ff14;
            border-radius: 50%;
            background: rgba(57, 255, 20, 0.2);
            animation: pulse-selection 1.5s infinite;
            pointer-events: none;
            box-shadow: 0 0 20px #39ff14;
            z-index: 9999;
          }

          @keyframes pulse-selection {
            0%, 100% { 
              transform: translate(-50%, -50%) scale(1); 
              opacity: 1; 
            }
            50% { 
              transform: translate(-50%, -50%) scale(1.5); 
              opacity: 0.5; 
            }
          }

          .shift-mode-indicator {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 16px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
            z-index: 10001;
            animation: slideInUp 0.3s ease-out;
          }

          @keyframes slideInUp {
            from { 
              transform: translate(-50%, 100%); 
              opacity: 0; 
            }
            to { 
              transform: translate(-50%, 0); 
              opacity: 1; 
            }
          }

          @keyframes fadeInUp {
            from { 
              transform: translateX(-50%) translateY(10px); 
              opacity: 0; 
            }
            to { 
              transform: translateX(-50%) translateY(0); 
              opacity: 1; 
            }
          }

          .chart-wrapper.selectable {
            cursor: pointer;
            position: relative;
          }

          .chart-wrapper.selectable:hover {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.2);
          }
        `}
      </style>

      {/* Selection indicators rendered directly without overlay */}
      {selectedPoints.map((point, idx) => (
        point.coordinates && (
          <div
            key={`${point.chartId}-${point.dataIndex}-${idx}`}
            className="selection-indicator"
            style={{
              // Convert page coordinates back to viewport coordinates
              left: point.coordinates.x - scrollOffset.x - 8,
              top: point.coordinates.y - scrollOffset.y - 8
            }}
          />
        )
      ))}

      {/* Shift Mode Indicator */}
      {isShiftPressed && (
        <div className="shift-mode-indicator">
          ⇧ Multi-select mode active - Click points to add/remove
        </div>
      )}

      {/* Context Sent Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y - 40,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            zIndex: 10002,
            animation: 'fadeInUp 0.3s ease-out',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          ✅ Context sent to chatbot!
        </div>
      )}


      {/* Render children (dashboard content) */}
      {children}
    </>
  );
};

export default ChartSelectionManager;