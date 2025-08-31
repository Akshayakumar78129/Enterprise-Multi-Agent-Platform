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
  metadata?: {
    avgAmount?: number;
    formattedAvgAmount?: string;
    dataType?: string;
    transaction_count?: number;
    percentage?: number;
    formattedValue?: string;
    quantity?: number;
    formattedQuantity?: string;
    avgPrice?: number;
    rawValue?: any;
    [key: string]: any;
  };
}

interface ChartSelectionManagerProps {
  children?: React.ReactNode;
  onSelectionChange?: (points: SelectedPoint[], isShiftSelection: boolean) => void;
  onInsightGenerated?: (insight: string) => void;
  onShowMessage?: (message: string, position?: { x: number; y: number; isTopElement?: boolean; chartType?: string }) => void;
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
    console.log('ChartSelectionManager: handlePointSelection called', { point, isMultiSelect });
    // Keep the original viewport coordinates for display
    // We'll convert to page coords only for the selection indicators
    const pointWithCoords = {
      ...point,
      coordinates: point.coordinates || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    };
    console.log('ChartSelectionManager: pointWithCoords', pointWithCoords);

    let newSelection: SelectedPoint[];

    if (isMultiSelect) {
      // Shift+Click: Multi-selection mode
      // Check if point already selected
      const existingIndex = selectionRef.current.findIndex(
        p => p.chartId === pointWithCoords.chartId && p.dataIndex === pointWithCoords.dataIndex
      );

      if (existingIndex >= 0) {
        // Remove if already selected
        newSelection = selectionRef.current.filter((_, idx) => idx !== existingIndex);
      } else {
        // Add to selection
        newSelection = [...selectionRef.current, pointWithCoords];
      }
    } else {
      // Regular Click: Single selection - replace all
      // Clear previous selection and show only this point's insight
      newSelection = [pointWithCoords];
    }

    selectionRef.current = newSelection;
    setSelectedPoints(newSelection);
    console.log('Selection updated. New selection length:', newSelection.length);
    console.log('onShowMessage callback available?', !!onShowMessage);
    
    // Show tooltip when Shift+Click is used (even for single selection)
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
    console.log('About to generate insight. Selection length:', newSelection.length);
    if (newSelection.length > 0) {
      console.log('Generating insight for selection:', newSelection);
      const insight = generateSelectionInsight(newSelection);
      console.log('Generated insight:', insight);
      
      if (onShowMessage) {
        const avgX = newSelection.reduce((sum, p) => sum + (p.coordinates?.x || 0), 0) / newSelection.length;
        const avgY = newSelection.reduce((sum, p) => sum + (p.coordinates?.y || 0), 0) / newSelection.length;
        
        // Check if this is a KPI card click (they're at the top of the screen)
        // If click is in top 200px, show popup below, otherwise show above
        const isTopElement = avgY < 200;
        const chartType = newSelection[0]?.chartType;
        
        console.log('Calling onShowMessage with position:', { x: avgX, y: avgY, isTopElement, chartType });
        onShowMessage(insight, { x: avgX, y: avgY, isTopElement, chartType });
      } else {
        console.log('onShowMessage callback not provided!');
      }
    } else if (newSelection.length === 0 && onShowMessage) {
      console.log('Clearing message - no selection');
      onShowMessage(''); // Clear message when no selection
    }
    
    // Notify parent with isShiftSelection flag
    onSelectionChange?.(newSelection, isMultiSelect);
  }, [onSelectionChange, onShowMessage]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    selectionRef.current = [];
    setSelectedPoints([]);
    onSelectionChange?.([], false); // Pass false since it's not a shift selection
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
    
    // For single selection, show detailed insight
    if (points.length === 1) {
      const p = points[0];
      let message = `💳 **Transaction Insight**\n\n`;
      
      // Add current value section
      message += `**Current Value:** ${p.value}${p.unit || ''}\n`;
      
      // Add status indicator
      const status = p.value > 100 ? '⚠️ High Activity' : p.value > 50 ? '✅ Normal' : '📉 Low Activity';
      message += `**Status:** ${status}\n`;
      
      // Add trend
      const trend = p.metadata?.trend || (p.value > 80 ? '📈 Increasing' : '📉 Declining');
      message += `**Trend:** ${trend}\n`;
      
      // Format based on chart type with more details
      if (p.chartType === 'Temporal Heatmap') {
        message += `\n📅 **${p.label}**\n`;
        message += `• Transactions: ${p.value}${p.unit || ''}\n`;
        if (p.metadata?.avgAmount) {
          message += `• Avg Amount: ${p.metadata.formattedAvgAmount}\n`;
        }
        const target = 100; // Example target
        const vsTarget = ((p.value - target) / target * 100).toFixed(1);
        message += `• vs Target: ${vsTarget > 0 ? '+' : ''}${vsTarget}%\n`;
      } else if (p.chartType === 'Time Series') {
        message += `\n📈 **Date: ${p.label}**\n`;
        if (p.metadata?.dataType === 'volume') {
          message += `• Volume: ${p.value} transactions\n`;
        } else {
          message += `• Avg Value: $${p.value}\n`;
        }
        if (p.metadata?.transaction_count) {
          message += `• Total: ${p.metadata.transaction_count} transactions\n`;
        }
      } else if (p.chartType === 'Amount Distribution') {
        message += `📊 **Range: ${p.label}**\n`;
        message += `• Count: ${p.value}${p.unit || ''}\n`;
        if (p.metadata?.percentage) {
          message += `• Percentage: ${p.metadata.percentage}%\n`;
        }
      } else if (p.chartType === 'Product Matrix') {
        message += `📦 **Product: ${p.label}**\n`;
        message += `• Total Value: ${p.metadata?.formattedValue || '$' + p.value}\n`;
        if (p.metadata?.quantity) {
          message += `• Quantity: ${p.metadata.formattedQuantity}\n`;
          message += `• Avg Price: $${p.metadata.avgPrice.toFixed(2)}\n`;
        }
      } else if (p.chartType === 'KPI Card') {
        message += `📊 **${p.label}**\n`;
        message += `• Value: ${p.metadata?.rawValue || p.value}\n`;
      } else {
        message += `• ${p.label}: ${p.value}${p.unit || ''}\n`;
      }
      
      // Add impact analysis
      message += `\n💡 **Impact:** This metric directly affects revenue generation and requires `;
      message += p.value > 100 ? 'immediate attention' : 'continued monitoring';
      message += `\n`;
      
      // Add recommended actions
      message += `\n⚡ **Recommended Actions**\n`;
      message += `• Analyze detailed metrics\n`;
      message += `• Export insights report\n`;
      message += `• Schedule team review\n`;
      
      message += `\n---\n`;
      message += `Press **Shift+Click** to select multiple points`;
      
      return message;
    } else {
      // Multi-selection mode
      let message = `🎯 **Multi-Selection (${points.length} points)**\n\n`;
      
      // Group by chart type
      const byChartType = points.reduce((acc, point) => {
        if (!acc[point.chartType]) acc[point.chartType] = [];
        acc[point.chartType].push(point);
        return acc;
      }, {} as Record<string, SelectedPoint[]>);
      
      Object.entries(byChartType).forEach(([chartType, pts]) => {
        message += `📊 **${chartType}:**\n`;
        pts.forEach((p, i) => {
          if (i < 3) { // Show first 3
            message += `• ${p.label}: ${p.value}${p.unit || ''}\n`;
          }
        });
        if (pts.length > 3) {
          message += `• ...and ${pts.length - 3} more\n`;
        }
      });
      
      // Calculate summary
      const totalValue = points.reduce((sum, p) => sum + (p.value || 0), 0);
      message += `\n📈 **Summary:**\n`;
      message += `• Total Value: ${totalValue.toFixed(0)}\n`;
      message += `• Average: ${(totalValue / points.length).toFixed(1)}\n`;
      
      message += `\n**Actions:** ESC to clear • Click "AI" for analysis`;
      
      return message;
    }
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
      {selectedPoints.map((point, idx) => 
        point.coordinates ? (
          <div
            key={`${point.chartId}-${point.dataIndex}-${idx}`}
            className="selection-indicator"
            style={{
              // Use viewport coordinates directly (they're already in viewport coords)
              left: point.coordinates.x - 8,
              top: point.coordinates.y - 8
            }}
          />
        ) : null
      )}

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