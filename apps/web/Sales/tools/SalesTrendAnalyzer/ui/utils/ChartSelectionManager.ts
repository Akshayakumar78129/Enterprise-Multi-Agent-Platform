// Chart Selection Manager for Multi-Selection Functionality
// Manages Shift+Click multi-selection across all charts in the dashboard

export interface SelectedDataPoint {
  id: string;
  chartType: 'timeseries' | 'seasonal' | 'growth' | 'kpi';
  metricName: string;
  date: string;
  value: number;
  previousValue?: number;
  percentChange?: number;
  period?: string;
  year?: string;
  month?: string;
  isAverage?: boolean;
  displayName: string;
  timestamp: number; // For ordering selections
}

export interface SelectionAnalysis {
  totalPoints: number;
  totalValue: number;
  averageValue: number;
  minValue: { value: number; point: SelectedDataPoint };
  maxValue: { value: number; point: SelectedDataPoint };
  dateRange: { start: string; end: string };
  chartTypes: string[];
  insights: string[];
}

class ChartSelectionManager {
  private selectedPoints: Map<string, SelectedDataPoint> = new Map();
  private listeners: Set<(selections: SelectedDataPoint[]) => void> = new Set();

  // Add a data point to selection
  addSelection(point: SelectedDataPoint): void {
    this.selectedPoints.set(point.id, point);
    this.notifyListeners();
  }

  // Remove a data point from selection
  removeSelection(pointId: string): void {
    this.selectedPoints.delete(pointId);
    this.notifyListeners();
  }

  // Toggle selection of a data point
  toggleSelection(point: SelectedDataPoint): void {
    if (this.selectedPoints.has(point.id)) {
      this.removeSelection(point.id);
    } else {
      this.addSelection(point);
    }
  }

  // Clear all selections
  clearSelections(): void {
    this.selectedPoints.clear();
    this.notifyListeners();
  }

  // Get all selected points
  getSelections(): SelectedDataPoint[] {
    return Array.from(this.selectedPoints.values())
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // Check if a point is selected
  isSelected(pointId: string): boolean {
    return this.selectedPoints.has(pointId);
  }

  // Get selection count
  getSelectionCount(): number {
    return this.selectedPoints.size;
  }

  // Subscribe to selection changes
  subscribe(listener: (selections: SelectedDataPoint[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private notifyListeners(): void {
    const selections = this.getSelections();
    this.listeners.forEach(listener => listener(selections));
  }

  // Generate a unique ID for a data point
  static generatePointId(chartType: string, date: string, metric: string): string {
    return `${chartType}-${date}-${metric}`;
  }

  // Analyze selected points and generate insights
  analyzeSelections(): SelectionAnalysis | null {
    const selections = this.getSelections();
    
    if (selections.length === 0) {
      return null;
    }

    if (selections.length === 1) {
      const point = selections[0];
      return {
        totalPoints: 1,
        totalValue: point.value,
        averageValue: point.value,
        minValue: { value: point.value, point },
        maxValue: { value: point.value, point },
        dateRange: { start: point.date, end: point.date },
        chartTypes: [point.chartType],
        insights: [
          `📊 Single point selected: ${point.displayName}`,
          `💰 Value: ${this.formatCurrency(point.value)}`,
          point.percentChange ? `📈 Change: ${point.percentChange.toFixed(1)}%` : ''
        ].filter(Boolean)
      };
    }

    // Multi-point analysis
    const totalValue = selections.reduce((sum, point) => sum + point.value, 0);
    const averageValue = totalValue / selections.length;
    
    const sortedByValue = [...selections].sort((a, b) => a.value - b.value);
    const minValue = { value: sortedByValue[0].value, point: sortedByValue[0] };
    const maxValue = { value: sortedByValue[sortedByValue.length - 1].value, point: sortedByValue[sortedByValue.length - 1] };
    
    const dates = selections.map(p => p.date).sort();
    const dateRange = { start: dates[0], end: dates[dates.length - 1] };
    
    const chartTypes = [...new Set(selections.map(p => p.chartType))];

    // Generate insights
    const insights = [
      `📊 ${selections.length} data points selected across ${chartTypes.length} chart${chartTypes.length > 1 ? 's' : ''}`,
      `💰 Total Value: ${this.formatCurrency(totalValue)}`,
      `📊 Average Value: ${this.formatCurrency(averageValue)}`,
      `🔻 Lowest: ${this.formatCurrency(minValue.value)} (${this.formatDate(minValue.point.date)})`,
      `🔺 Highest: ${this.formatCurrency(maxValue.value)} (${this.formatDate(maxValue.point.date)})`,
      dateRange.start !== dateRange.end ? `📅 Period: ${this.formatDate(dateRange.start)} to ${this.formatDate(dateRange.end)}` : ''
    ].filter(Boolean);

    // Add trend analysis if we have time series data
    if (selections.length >= 2) {
      const timeSeriesPoints = selections
        .filter(p => p.chartType === 'timeseries' || p.chartType === 'seasonal')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (timeSeriesPoints.length >= 2) {
        const firstValue = timeSeriesPoints[0].value;
        const lastValue = timeSeriesPoints[timeSeriesPoints.length - 1].value;
        const overallChange = ((lastValue - firstValue) / firstValue) * 100;
        
        const trendEmoji = overallChange > 5 ? '🚀' : overallChange > 0 ? '📈' : overallChange < -5 ? '📉' : '➖';
        insights.push(`${trendEmoji} Overall trend: ${overallChange > 0 ? '+' : ''}${overallChange.toFixed(1)}%`);
      }
    }

    return {
      totalPoints: selections.length,
      totalValue,
      averageValue,
      minValue,
      maxValue,
      dateRange,
      chartTypes,
      insights
    };
  }

  // Helper method to format currency
  private formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  }

  // Helper method to format dates
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }
}

// Export singleton instance
export const chartSelectionManager = new ChartSelectionManager();