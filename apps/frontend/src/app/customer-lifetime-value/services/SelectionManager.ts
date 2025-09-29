import { SelectedPoint } from "components";

export interface SelectionEventDetail {
  point: SelectedPoint;
  shiftKey: boolean;
}

export class SelectionManager {
  private selectedPoints: SelectedPoint[] = [];
  private listeners: Set<(points: SelectedPoint[]) => void> = new Set();
  private maxSelections = 10;

  constructor() {
    // Listen for ESC key to clear selections
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.clearAll();
    }
  }

  subscribe(listener: (points: SelectedPoint[]) => void) {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.selectedPoints);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.selectedPoints]));
  }

  addPoint(point: SelectedPoint, shiftKey: boolean = false) {
    if (!shiftKey) {
      // Without shift, replace all selections with this one
      this.selectedPoints = [point];
    } else {
      // With shift, add to existing selections (if not duplicate)
      const exists = this.selectedPoints.some(
        p => p.label === point.label && p.value === point.value && p.source === point.source
      );

      if (!exists) {
        if (this.selectedPoints.length >= this.maxSelections) {
          // Remove oldest selection if at max
          this.selectedPoints.shift();
        }
        this.selectedPoints.push(point);
      }
    }

    this.notify();
  }

  removePoint(point: SelectedPoint) {
    this.selectedPoints = this.selectedPoints.filter(
      p => !(p.label === point.label && p.value === point.value && p.source === point.source)
    );
    this.notify();
  }

  clearAll() {
    if (this.selectedPoints.length > 0) {
      this.selectedPoints = [];
      this.notify();
    }
  }

  getSelectedPoints(): SelectedPoint[] {
    return [...this.selectedPoints];
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
    this.listeners.clear();
    this.selectedPoints = [];
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