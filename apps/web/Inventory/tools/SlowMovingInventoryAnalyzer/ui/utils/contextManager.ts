/**
 * Global Context Manager for AI Chat Assistant
 * Manages context collection from data visualizations
 */

export interface ContextItem {
  id: string;
  title: string;
  type: 'data-point' | 'kpi-tile' | 'insight';
  content: {
    title: string;
    items: Array<{
      label: string;
      value: string | number;
      color?: string;
      type?: 'primary' | 'secondary' | 'metric';
    }>;
    insight?: string;
    status?: 'critical' | 'warning' | 'good' | 'neutral';
  };
  timestamp: Date;
  source: string; // Component that added this context
}

class ContextManager {
  private contexts: ContextItem[] = [];
  private listeners: Set<(contexts: ContextItem[]) => void> = new Set();
  private onChatOpenRequest?: () => void;

  // Add a new context item
  addContext(item: Omit<ContextItem, 'id' | 'timestamp'>): void {
    const contextItem: ContextItem = {
      ...item,
      id: `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.contexts.push(contextItem);
    console.log('🎯 Context added:', contextItem.title, 'Total contexts:', this.contexts.length);
    console.log('📋 Context details:', contextItem);
    
    // Notify all listeners
    this.notifyListeners();

    // Auto-open chat on first context
    if (this.contexts.length === 1 && this.onChatOpenRequest) {
      console.log('🚀 Auto-opening chat for first context');
      this.onChatOpenRequest();
    }
  }

  // Remove a specific context item
  removeContext(id: string): void {
    this.contexts = this.contexts.filter(ctx => ctx.id !== id);
    console.log('🗑️ Context removed:', id, 'Remaining:', this.contexts.length);
    this.notifyListeners();
  }

  // Clear all contexts
  clearAllContexts(): void {
    this.contexts = [];
    console.log('🧹 All contexts cleared');
    this.notifyListeners();
  }

  // Get all contexts
  getContexts(): ContextItem[] {
    return [...this.contexts];
  }

  // Get contexts formatted for AI consumption
  getContextsForAI(responseMode: 'quick' | 'strategic' | 'forecast' = 'quick'): string {
    if (this.contexts.length === 0) return '';

    const modeInstructions = {
      quick: '⚡ **Response Mode: QUICK** - Provide immediate, actionable solutions and quick wins.',
      strategic: '🎯 **Response Mode: STRATEGIC** - Focus on comprehensive analysis, long-term planning, and strategic recommendations.',
      forecast: '🔮 **Response Mode: FORECAST** - Emphasize future predictions, trend analysis, and scenario planning.'
    };

    let contextString = `## 📊 Current Context:\n\n${modeInstructions[responseMode]}\n\n`;
    
    this.contexts.forEach((ctx, index) => {
      contextString += `### ${index + 1}. ${ctx.title} (${ctx.type})\n`;
      contextString += `**Source:** ${ctx.source}\n`;
      
      ctx.content.items.forEach(item => {
        contextString += `- **${item.label}:** ${item.value}\n`;
      });
      
      if (ctx.content.insight) {
        contextString += `**Insight:** ${ctx.content.insight}\n`;
      }
      
      if (ctx.content.status) {
        contextString += `**Status:** ${ctx.content.status}\n`;
      }
      
      contextString += '\n';
    });

    return contextString;
  }

  // Subscribe to context changes
  subscribe(listener: (contexts: ContextItem[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Set callback for chat open requests
  setOnChatOpenRequest(callback: () => void): void {
    this.onChatOpenRequest = callback;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.contexts]);
      } catch (error) {
        console.error('Error notifying context listener:', error);
      }
    });
  }
}

// Export singleton instance
export const contextManager = new ContextManager();

// Global helper for easy access
if (typeof window !== 'undefined') {
  (window as any).__contextManager = contextManager;
}
