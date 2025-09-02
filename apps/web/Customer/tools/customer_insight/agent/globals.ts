/**
 * Customer Insight Agent Global State Management
 * Provides safe global state access for UI components
 */

// Global state interface
interface CustomerInsightGlobalState {
  view: 'overview' | 'insights' | 'detailed';
  mode: 'talk' | 'insights' | 'detailed';
  initialized: boolean;
}

// Initialize global state on window object
declare global {
  interface Window {
    __customerInsight__?: CustomerInsightGlobalState;
  }
}

// Initialize global state if not exists
const initializeGlobalState = (): CustomerInsightGlobalState => {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      view: 'overview',
      mode: 'talk',
      initialized: false
    };
  }

  if (!window.__customerInsight__) {
    window.__customerInsight__ = {
      view: 'overview',
      mode: 'talk',
      initialized: true
    };
  }

  return window.__customerInsight__;
};

/**
 * Safely set the customer insight view
 * @param view - The view to set ('overview' | 'insights' | 'detailed')
 */
export const setCustomerInsightView = (view: 'overview' | 'insights' | 'detailed'): void => {
  try {
    const state = initializeGlobalState();
    state.view = view;
    
    // Dispatch custom event for components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('customerInsightViewChange', {
        detail: { view }
      }));
    }
  } catch (error) {
    console.warn('Failed to set customer insight view:', error);
  }
};

/**
 * Safely set the customer insight mode
 * @param mode - The mode to set ('talk' | 'insights' | 'detailed')
 */
export const setCustomerInsightMode = (mode: 'talk' | 'insights' | 'detailed'): void => {
  try {
    const state = initializeGlobalState();
    state.mode = mode;
    
    // Dispatch custom event for components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('customerInsightModeChange', {
        detail: { mode }
      }));
    }
  } catch (error) {
    console.warn('Failed to set customer insight mode:', error);
  }
};

/**
 * Get current customer insight view
 */
export const getCustomerInsightView = (): 'overview' | 'insights' | 'detailed' => {
  try {
    const state = initializeGlobalState();
    return state.view;
  } catch (error) {
    console.warn('Failed to get customer insight view:', error);
    return 'overview';
  }
};

/**
 * Get current customer insight mode
 */
export const getCustomerInsightMode = (): 'talk' | 'insights' | 'detailed' => {
  try {
    const state = initializeGlobalState();
    return state.mode;
  } catch (error) {
    console.warn('Failed to get customer insight mode:', error);
    return 'talk';
  }
};

/**
 * Get the entire global state
 */
export const getCustomerInsightState = (): CustomerInsightGlobalState => {
  return initializeGlobalState();
};

/**
 * Reset global state to defaults
 */
export const resetCustomerInsightState = (): void => {
  try {
    if (typeof window !== 'undefined') {
      window.__customerInsight__ = {
        view: 'overview',
        mode: 'talk',
        initialized: true
      };
      
      // Dispatch reset event
      window.dispatchEvent(new CustomEvent('customerInsightStateReset'));
    }
  } catch (error) {
    console.warn('Failed to reset customer insight state:', error);
  }
};

// Initialize on module load
initializeGlobalState();