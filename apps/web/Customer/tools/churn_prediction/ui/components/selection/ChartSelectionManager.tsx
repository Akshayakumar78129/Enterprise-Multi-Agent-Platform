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
  const selectionRef = useRef<SelectedPoint[]>([]);


  // Handle chart point selection
  const handlePointSelection = useCallback((point: SelectedPoint, isMultiSelect: boolean) => {
    let newSelection: SelectedPoint[];

    if (isMultiSelect) {
      // Check if point already selected
      const existingIndex = selectionRef.current.findIndex(
        p => p.chartId === point.chartId && p.dataIndex === point.dataIndex
      );

      if (existingIndex >= 0) {
        // Remove if already selected
        newSelection = selectionRef.current.filter((_, idx) => idx !== existingIndex);
      } else {
        // Add to selection
        newSelection = [...selectionRef.current, point];
      }
    } else {
      // Single selection - replace all
      newSelection = [point];
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

  // Handle keyboard events for shift key and ESC
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [clearSelection]);
  
  // Generate insight message for selected points
  const generateSelectionInsight = (points: SelectedPoint[]) => {
    if (points.length === 0) return '';
    
    let message = `🎯 **Shift+Click Multi-Selection Analysis**\n\n`;
    message += `You've selected **${points.length} data point${points.length > 1 ? 's' : ''}** across your dashboard:\n\n`;
    
    // Group by chart type
    const byChartType = points.reduce((acc, point) => {
      if (!acc[point.chartType]) acc[point.chartType] = [];
      acc[point.chartType].push(point);
      return acc;
    }, {} as Record<string, SelectedPoint[]>);
    
    // Display selected points by chart
    Object.entries(byChartType).forEach(([chartType, pts]) => {
      message += `📊 **${chartType}**\n`;
      pts.forEach(p => {
        const riskIndicator = p.value > 50 ? '🔴' : p.value > 30 ? '🟠' : '🟢';
        message += `${riskIndicator} ${p.label}: **${p.value}${p.unit || ''}**\n`;
      });
      message += `\n`;
    });
    
    // Calculate totals and insights
    const totalValue = points.reduce((sum, p) => sum + (p.value || 0), 0);
    const avgValue = totalValue / points.length;
    const maxPoint = points.reduce((max, p) => p.value > max.value ? p : max);
    const minPoint = points.reduce((min, p) => p.value < min.value ? p : min);
    
    message += `**📈 Analysis Summary:**\n`;
    message += `• **Total Impact:** ${totalValue.toFixed(0)} customers\n`;
    message += `• **Revenue at Risk:** $${(totalValue * 2500).toLocaleString()}\n`;
    message += `• **Highest Risk:** ${maxPoint.label} (${maxPoint.value}${maxPoint.unit || ''})\n`;
    message += `• **Lowest Risk:** ${minPoint.label} (${minPoint.value}${minPoint.unit || ''})\n\n`;
    
    // Strategic recommendations based on selection
    message += `**💡 Strategic Recommendations:**\n`;
    if (totalValue > 100) {
      message += `• 🚨 **Critical Alert:** High concentration of risk detected\n`;
      message += `• Deploy emergency retention campaigns immediately\n`;
      message += `• Allocate additional resources to customer success\n`;
    } else if (totalValue > 50) {
      message += `• ⚠️ **Elevated Risk:** Proactive intervention recommended\n`;
      message += `• Schedule personalized outreach for affected segments\n`;
      message += `• Review and optimize retention strategies\n`;
    } else {
      message += `• ✅ **Manageable Risk:** Continue monitoring\n`;
      message += `• Maintain current engagement strategies\n`;
      message += `• Focus on preventive measures\n`;
    }
    
    message += `\n**🎯 Next Steps:**\n`;
    message += `• Click "Open Chat" for detailed analysis\n`;
    message += `• Press ESC to clear selection\n`;
    message += `• Continue Shift+Click to add more points`;
    
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
          .selection-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 9999;
          }

          .selection-indicator {
            position: absolute;
            width: 16px;
            height: 16px;
            border: 3px solid #39ff14;
            border-radius: 50%;
            background: rgba(57, 255, 20, 0.2);
            animation: pulse-selection 1.5s infinite;
            pointer-events: none;
            box-shadow: 0 0 20px #39ff14;
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

      {/* Selection Overlay for visual indicators */}
      <div className="selection-overlay">
        {selectedPoints.map((point, idx) => (
          point.coordinates && (
            <div
              key={`${point.chartId}-${point.dataIndex}-${idx}`}
              className="selection-indicator"
              style={{
                left: point.coordinates.x,
                top: point.coordinates.y
              }}
            />
          )
        ))}
      </div>

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