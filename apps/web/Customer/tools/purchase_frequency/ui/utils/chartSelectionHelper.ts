// Chart Selection Helper - Integrates charts with ChartSelectionManager
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

export const handleChartClick = (
  data: ChartClickData,
  event?: React.MouseEvent | MouseEvent | any,
  isShiftKey?: boolean
) => {
  // Enforce Shift-only behavior
  const shiftHeld = !!(isShiftKey ?? event?.shiftKey ?? event?.nativeEvent?.shiftKey);
  if (!shiftHeld) return false;

  // Check if ChartSelectionManager API is available
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
    try {
      selectionAPI.addPoint?.(point, { multi: true });
    } catch {}
  }
  // Send to chatbot only when Shift is held
  if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
    try {
      try { if (event) { (event as any).__handledByChart = true; } } catch {}
      (window as any).addAIInsightToChat({
        label: data.label,
        value: data.value,
        chartType: data.chartType,
        count: data.value,
        unit: data.unit || '',
        originalEvent: event
      });
    } catch {}
  }
  return true;
};