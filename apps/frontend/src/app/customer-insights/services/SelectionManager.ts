export interface SelectedPoint {
  datasetLabel: string;
  index: number;
  value: number;
  label: string;
  originalData?: any;
}

export class SelectionManager {
  private selectedPoints: SelectedPoint[] = [];
  private listeners: Set<(points: SelectedPoint[]) => void> = new Set();

  select(point: SelectedPoint) {
    const existing = this.selectedPoints.findIndex(
      p => p.datasetLabel === point.datasetLabel && p.index === point.index
    );

    if (existing === -1) {
      this.selectedPoints.push(point);
      this.notifyListeners();
    }
  }

  deselect(point: SelectedPoint) {
    this.selectedPoints = this.selectedPoints.filter(
      p => !(p.datasetLabel === point.datasetLabel && p.index === point.index)
    );
    this.notifyListeners();
  }

  clearAll() {
    this.selectedPoints = [];
    this.notifyListeners();
  }

  getSelected(): SelectedPoint[] {
    return [...this.selectedPoints];
  }

  isSelected(datasetLabel: string, index: number): boolean {
    return this.selectedPoints.some(
      p => p.datasetLabel === datasetLabel && p.index === index
    );
  }

  subscribe(listener: (points: SelectedPoint[]) => void) {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getSelected()));
  }
}