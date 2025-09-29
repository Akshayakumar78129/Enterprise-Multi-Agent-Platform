/**
 * ShiftClickSelectionManager - Singleton class for managing shift+click selections
 * This adds shift+click functionality without modifying existing SelectionManager
 */

export interface ShiftClickPoint {
  id: string;
  label: string;
  value: string | number;
  source: string;
  chartType?: string;
  metadata?: {
    fromShiftClick: boolean;
    timestamp: number;
    dashboardContext?: string;
    filters?: any;
    [key: string]: any;
  };
  coordinates?: {
    x: number;
    y: number;
  };
}

type SelectionListener = (points: ShiftClickPoint[]) => void;
type ShiftKeyListener = (isPressed: boolean) => void;

export class ShiftClickSelectionManager {
  private static instance: ShiftClickSelectionManager;
  private selectedPoints: ShiftClickPoint[] = [];
  private isShiftPressed: boolean = false;
  private selectionListeners: Set<SelectionListener> = new Set();
  private shiftKeyListeners: Set<ShiftKeyListener> = new Set();
  private maxSelections: number = 10;
  private isEnabled: boolean = true;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeEventListeners();
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ShiftClickSelectionManager {
    if (!ShiftClickSelectionManager.instance) {
      ShiftClickSelectionManager.instance = new ShiftClickSelectionManager();
    }
    return ShiftClickSelectionManager.instance;
  }

  /**
   * Initialize global event listeners
   */
  private initializeEventListeners() {
    // Track shift key state
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Clear on window blur (shift key might be released while window not focused)
    window.addEventListener('blur', () => {
      this.setShiftPressed(false);
    });
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Shift' && !this.isShiftPressed) {
      this.setShiftPressed(true);
    } else if (event.key === 'Escape') {
      this.clearAll();
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    if (event.key === 'Shift' && this.isShiftPressed) {
      this.setShiftPressed(false);
    }
  }

  private setShiftPressed(pressed: boolean) {
    this.isShiftPressed = pressed;
    this.notifyShiftKeyListeners();
  }

  /**
   * Add a point to selection
   */
  addPoint(point: ShiftClickPoint, event?: MouseEvent | React.MouseEvent): boolean {
    if (!this.isEnabled) return false;

    // Check if it's a shift+click
    const isShiftClick = this.isShiftPressed || event?.shiftKey;

    if (!isShiftClick) {
      // Regular click - don't handle here, let normal selection work
      return false;
    }

    // Ensure point has required metadata
    const enrichedPoint: ShiftClickPoint = {
      ...point,
      id: point.id || `${point.source}-${point.label}-${Date.now()}`,
      metadata: {
        ...point.metadata,
        fromShiftClick: true,
        timestamp: Date.now()
      }
    };

    // Check for duplicates
    const exists = this.selectedPoints.some(p =>
      p.id === enrichedPoint.id ||
      (p.label === enrichedPoint.label && p.source === enrichedPoint.source && p.value === enrichedPoint.value)
    );

    if (exists) {
      // Toggle off if already selected
      this.removePoint(enrichedPoint.id);
      this.showTooltip('➖ Point removed from selection');
      return true;
    }

    // Add to selection (respect max limit)
    if (this.selectedPoints.length >= this.maxSelections) {
      this.selectedPoints.shift(); // Remove oldest
    }

    this.selectedPoints.push(enrichedPoint);
    this.notifySelectionListeners();
    this.showTooltip(`✅ Added to selection (${this.selectedPoints.length}/${this.maxSelections})`);

    return true; // Handled
  }

  /**
   * Remove a point from selection
   */
  removePoint(pointId: string) {
    const sizeBefore = this.selectedPoints.length;
    this.selectedPoints = this.selectedPoints.filter(p => p.id !== pointId);

    if (this.selectedPoints.length < sizeBefore) {
      this.notifySelectionListeners();
    }
  }

  /**
   * Clear all selections
   */
  clearAll() {
    if (this.selectedPoints.length > 0) {
      this.selectedPoints = [];
      this.notifySelectionListeners();
      this.showTooltip('🗑️ Selections cleared');
    }
  }

  /**
   * Get current selections
   */
  getPoints(): ShiftClickPoint[] {
    return [...this.selectedPoints];
  }

  /**
   * Check if shift key is pressed
   */
  isShiftKeyPressed(): boolean {
    return this.isShiftPressed;
  }

  /**
   * Subscribe to selection changes
   */
  subscribe(listener: SelectionListener): () => void {
    this.selectionListeners.add(listener);
    // Immediately notify with current state
    listener(this.getPoints());

    // Return unsubscribe function
    return () => {
      this.selectionListeners.delete(listener);
    };
  }

  /**
   * Subscribe to shift key state changes
   */
  subscribeToShiftKey(listener: ShiftKeyListener): () => void {
    this.shiftKeyListeners.add(listener);
    listener(this.isShiftPressed);

    return () => {
      this.shiftKeyListeners.delete(listener);
    };
  }

  /**
   * Format selections for chat context
   */
  formatForChatContext(): string {
    if (this.selectedPoints.length === 0) {
      return '';
    }

    const groupedBySource = this.selectedPoints.reduce((acc, point) => {
      if (!acc[point.source]) {
        acc[point.source] = [];
      }
      acc[point.source].push(point);
      return acc;
    }, {} as Record<string, ShiftClickPoint[]>);

    let context = `[Shift+Click Context: ${this.selectedPoints.length} data points selected]\n`;

    Object.entries(groupedBySource).forEach(([source, points]) => {
      context += `\n📊 ${source}:\n`;
      points.forEach(p => {
        context += `  • ${p.label}: ${typeof p.value === 'number' ? p.value.toLocaleString() : p.value}`;
        if (p.chartType) context += ` (${p.chartType})`;
        context += '\n';
      });
    });

    // Add metadata summary if present
    const dashboards = new Set(this.selectedPoints.map(p => p.metadata?.dashboardContext).filter(Boolean));
    if (dashboards.size > 0) {
      context += `\n📍 Dashboard Context: ${Array.from(dashboards).join(', ')}\n`;
    }

    return context;
  }

  /**
   * Format for API payload
   */
  formatForAPI(): any {
    return {
      type: 'shift_click_selection',
      count: this.selectedPoints.length,
      points: this.selectedPoints.map(p => ({
        label: p.label,
        value: p.value,
        source: p.source,
        chartType: p.chartType,
        metadata: p.metadata
      })),
      timestamp: Date.now()
    };
  }

  /**
   * Enable/disable selection
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearAll();
    }
  }

  /**
   * Notify selection listeners
   */
  private notifySelectionListeners() {
    const points = this.getPoints();
    this.selectionListeners.forEach(listener => listener(points));
  }

  /**
   * Notify shift key listeners
   */
  private notifyShiftKeyListeners() {
    this.shiftKeyListeners.forEach(listener => listener(this.isShiftPressed));
  }

  /**
   * Show temporary tooltip
   */
  private showTooltip(message: string) {
    if (typeof window === 'undefined') return;

    // Remove existing tooltip if any
    const existingTooltip = document.getElementById('shift-click-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Create new tooltip
    const tooltip = document.createElement('div');
    tooltip.id = 'shift-click-tooltip';
    tooltip.textContent = message;
    tooltip.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 100000;
      pointer-events: none;
      animation: fadeInOut 2s ease-in-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(tooltip);

    // Remove after animation
    setTimeout(() => {
      tooltip.remove();
      style.remove();
    }, 2000);
  }
}

// Export singleton instance getter for convenience
export const getShiftClickManager = () => ShiftClickSelectionManager.getInstance();