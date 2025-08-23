// Chart Selection Helper for Customer Segmentation - Integrates charts with ChartSelectionManager
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
  // Check if ChartSelectionManager API is available
  const selectionAPI = (window as any).chartSelectionAPI;
  if (!selectionAPI) {
    console.log('ChartSelectionManager not available');
    return false;
  }

  // Determine if shift key is pressed
  const isMultiSelect = isShiftKey ?? event?.shiftKey ?? selectionAPI.isMultiSelectMode();

  // Get click coordinates
  const coordinates = event ? {
    x: event.clientX ?? event.pageX ?? 0,
    y: event.clientY ?? event.pageY ?? 0
  } : { x: 0, y: 0 };

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

  // Add point to selection
  selectionAPI.addPoint(point);
  
  return true;
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
    const label = chart.data.labels?.[index] || dataset.label || 'Unknown';
    const value = dataset.data[index];

    const clickData: ChartClickData = {
      chartId,
      chartType,
      label: typeof value === 'object' ? label : label,
      value: typeof value === 'object' ? value.y || value.x || 0 : value || 0,
      index,
      color: dataset.backgroundColor?.[index] || dataset.backgroundColor,
      metadata: { 
        datasetIndex, 
        dataset: dataset.label,
        originalData: value
      }
    };

    handleChartClick(clickData, event.native);
  };
};

/**
 * Checks if ChartSelectionManager is available
 */
export const isSelectionManagerAvailable = (): boolean => {
  return !!(window as any).chartSelectionAPI;
};