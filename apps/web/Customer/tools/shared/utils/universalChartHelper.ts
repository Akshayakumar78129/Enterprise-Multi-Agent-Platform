// Universal Chart Selection Helper - Use this across ALL visualization components
export interface ChartClickData {
  chartId: string;
  chartType: string;
  label: string;
  value: number | string;
  unit?: string;
  index?: number;
  color?: string;
  metadata?: any;
}

/**
 * Universal handler for chart click events with shift-click support
 * Integrates with both ChartSelectionManager and Enhanced Chatbot
 * 
 * @param data - The chart data that was clicked
 * @param event - The click event (for shift-key detection)
 */
export const handleUniversalChartClick = (
  data: ChartClickData,
  event?: React.MouseEvent | MouseEvent | any
) => {
  const isShiftKey = event?.shiftKey || false;
  
  // Send to Enhanced Chatbot (minimal data format)
  if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
    (window as any).addAIInsightToChat({
      label: data.label,
      value: data.value,
      chartType: data.chartType,
      count: typeof data.value === 'number' ? data.value : undefined,
      unit: data.unit || '',
      originalEvent: event
    });
  }
  
  // Also send to ChartSelectionManager if available
  const selectionAPI = (window as any).chartSelectionAPI;
  if (selectionAPI) {
    const coordinates = event ? {
      x: event.clientX ?? event.pageX ?? 0,
      y: event.clientY ?? event.pageY ?? 0
    } : { x: 0, y: 0 };
    
    const point = {
      chartId: data.chartId,
      chartType: data.chartType,
      dataIndex: data.index ?? 0,
      label: data.label,
      value: data.value,
      unit: data.unit,
      coordinates,
      color: data.color,
      metadata: data.metadata,
      timestamp: new Date().toISOString()
    };
    
    selectionAPI.addPoint(point);
  }
  
  return true;
};

/**
 * Check if chart selection systems are available
 */
export const isSelectionSystemAvailable = (): boolean => {
  return !!(window as any).addAIInsightToChat || !!(window as any).chartSelectionAPI;
};