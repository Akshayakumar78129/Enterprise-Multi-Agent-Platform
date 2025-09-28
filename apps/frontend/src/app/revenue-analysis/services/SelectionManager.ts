import { SelectedPoint } from "components";

export class SelectionManager {
  private points: SelectedPoint[] = [];
  private listeners: Array<(points: SelectedPoint[]) => void> = [];

  addPoint(point: SelectedPoint) {
    // Check if point already exists
    const exists = this.points.some(p =>
      p.chartId === point.chartId &&
      p.dataIndex === point.dataIndex
    );

    if (!exists) {
      this.points.push(point);
      this.notifyListeners();
    }
  }

  removePoint(chartId: string, dataIndex: number) {
    this.points = this.points.filter(p =>
      !(p.chartId === chartId && p.dataIndex === dataIndex)
    );
    this.notifyListeners();
  }

  clearAll() {
    this.points = [];
    this.notifyListeners();
  }

  getPoints(): SelectedPoint[] {
    return [...this.points];
  }

  subscribe(listener: (points: SelectedPoint[]) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.points]));
  }
}

let selectionManager: SelectionManager | null = null;

export function getSelectionManager(): SelectionManager {
  if (!selectionManager) {
    selectionManager = new SelectionManager();
  }
  return selectionManager;
}