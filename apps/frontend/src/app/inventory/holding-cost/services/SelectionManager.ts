import { SelectedPoint } from "components";

export class SelectionManager {
  private selectedPoints: SelectedPoint[] = [];
  private listeners: Array<(points: SelectedPoint[]) => void> = [];

  addPoint(point: SelectedPoint) {
    // Check if point already exists
    const exists = this.selectedPoints.some(
      (p) => p.chartId === point.chartId && p.dataKey === point.dataKey
    );

    if (!exists) {
      this.selectedPoints = [...this.selectedPoints, point];
      this.notifyListeners();
    }
  }

  removePoint(chartId: string, dataKey: string) {
    this.selectedPoints = this.selectedPoints.filter(
      (p) => !(p.chartId === chartId && p.dataKey === dataKey)
    );
    this.notifyListeners();
  }

  clearSelection() {
    this.selectedPoints = [];
    this.notifyListeners();
  }

  getSelectedPoints(): SelectedPoint[] {
    return this.selectedPoints;
  }

  addListener(listener: (points: SelectedPoint[]) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (points: SelectedPoint[]) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.selectedPoints));
  }
}

// Singleton instance
let instance: SelectionManager | null = null;

export function getSelectionManager(): SelectionManager {
  if (!instance) {
    instance = new SelectionManager();
  }
  return instance;
}
