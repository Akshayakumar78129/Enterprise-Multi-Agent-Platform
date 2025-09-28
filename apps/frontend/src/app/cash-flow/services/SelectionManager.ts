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
    this.showTooltip("✅ Context sent to chatbot!");
  }

  removePoint(index: number) {
    if (index >= 0 && index < this.selectedPoints.length) {
      this.selectedPoints.splice(index, 1);
      this.notify();
    }
  }

  clearAll() {
    if (this.selectedPoints.length > 0) {
      this.selectedPoints = [];
      this.notify();
    }
  }

  getPoints(): SelectedPoint[] {
    return [...this.selectedPoints];
  }

  private showTooltip(message: string) {
    if (typeof window === 'undefined') return;

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.textContent = message;
    tooltip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      pointer-events: none;
      animation: fadeInOut 1.5s ease-in-out;
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(tooltip);

    // Remove after animation
    setTimeout(() => {
      document.body.removeChild(tooltip);
      document.head.removeChild(style);
    }, 1500);
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
    this.listeners.clear();
    this.selectedPoints = [];
  }
}

// Create singleton instance
let selectionManagerInstance: SelectionManager | null = null;

export function getSelectionManager(): SelectionManager {
  if (!selectionManagerInstance) {
    selectionManagerInstance = new SelectionManager();
  }
  return selectionManagerInstance;
}