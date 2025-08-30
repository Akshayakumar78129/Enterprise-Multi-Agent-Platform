// Chart Selection Helper - Integrates charts with ChartSelectionManager
export interface ChartClickData {
  chartId: string;
  chartType: string;
  label: string;
  value: number;
  unit?: string;
  index?: number;
  color?: string;
  metadata?: any;
}

/**
 * Handles chart click events and integrates with ChartSelectionManager
 * @param data - The chart data that was clicked
 * @param event - The click event
 * @param isShiftKey - Whether shift key is pressed (optional, will check event)
 */
export const handleChartClick = (
  data: ChartClickData,
  event?: React.MouseEvent | MouseEvent | any,
  isShiftKey?: boolean
) => {
  console.log('handleChartClick called with:', { data, event, isShiftKey });
  
  // Check if ChartSelectionManager API is available
  const selectionAPI = (window as any).chartSelectionAPI;
  if (!selectionAPI) {
    console.error('ChartSelectionManager API not available!');
    return false;
  }
  console.log('ChartSelectionManager API found:', selectionAPI);

  // Determine if shift key is pressed
  const isMultiSelect = isShiftKey ?? event?.shiftKey ?? selectionAPI.isMultiSelectMode();
  console.log('isMultiSelect:', isMultiSelect);

  // Get click coordinates
  const coordinates = event ? {
    x: event.clientX ?? event.pageX ?? event.pointerX ?? 0,
    y: event.clientY ?? event.pageY ?? event.pointerY ?? 0
  } : { x: 0, y: 0 };
  console.log('Extracted coordinates:', coordinates);

  // Create selection point
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

  // Add point to selection (ChartSelectionManager handles both single and multi-select)
  console.log('Adding point to selection:', point);
  selectionAPI.addPoint(point);
  console.log('Point added successfully');
  
  // Note: ChartSelectionManager will handle showing insights for both:
  // - Single click: Shows AI insight popup
  // - Shift+Click: Shows multi-selection with visual indicators
  // The chatbot receives updates through the ChartSelectionManager's onSelectionChange callback
  
  return true;
};

/**
 * Creates a click handler for Recharts components
 * @param chartId - Unique identifier for the chart
 * @param chartType - Type of chart (e.g., 'bar', 'line', 'pie')
 */
export const createRechartsClickHandler = (
  chartId: string,
  chartType: string
) => {
  return (data: any, index?: number, event?: any) => {
    if (!data) return;

    const clickData: ChartClickData = {
      chartId,
      chartType,
      label: data.name || data.label || data.x || 'Unknown',
      value: data.value || data.y || data.count || 0,
      unit: data.unit,
      index,
      color: data.fill || data.color,
      metadata: data
    };

    handleChartClick(clickData, event);
  };
};

/**
 * Creates a click handler for Chart.js components
 * @param chartId - Unique identifier for the chart
 * @param chartType - Type of chart
 */
export const createChartJsClickHandler = (
  chartId: string,
  chartType: string,
  chart: any
) => {
  return (event: any, elements: any[]) => {
    if (!elements || elements.length === 0) return;

    const element = elements[0];
    const datasetIndex = element.datasetIndex;
    const index = element.index;
    
    const dataset = chart.data.datasets[datasetIndex];
    const label = chart.data.labels[index];
    const value = dataset.data[index];

    const clickData: ChartClickData = {
      chartId,
      chartType,
      label: label || 'Unknown',
      value: value || 0,
      index,
      color: dataset.backgroundColor?.[index] || dataset.backgroundColor,
      metadata: { datasetIndex, dataset: dataset.label }
    };

    handleChartClick(clickData, event.native);
  };
};

/**
 * Creates a click handler for custom/D3 charts
 * @param chartId - Unique identifier for the chart
 * @param chartType - Type of chart
 */
export const createCustomClickHandler = (
  chartId: string,
  chartType: string
) => {
  return (label: string, value: number, event?: any, additionalData?: any) => {
    const clickData: ChartClickData = {
      chartId,
      chartType,
      label,
      value,
      ...additionalData
    };

    handleChartClick(clickData, event);
  };
};

/**
 * Checks if ChartSelectionManager is available
 */
export const isSelectionManagerAvailable = (): boolean => {
  return !!(window as any).chartSelectionAPI;
};

/**
 * Gets current selection from ChartSelectionManager
 */
export const getCurrentSelection = (): any[] => {
  const selectionAPI = (window as any).chartSelectionAPI;
  return selectionAPI?.getSelection() || [];
};

/**
 * Clears all selections
 */
export const clearAllSelections = () => {
  const selectionAPI = (window as any).chartSelectionAPI;
  selectionAPI?.clearSelection();
};