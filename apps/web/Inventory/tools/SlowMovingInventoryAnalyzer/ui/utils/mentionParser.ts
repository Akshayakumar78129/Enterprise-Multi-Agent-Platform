/**
 * Mention Parser Utility
 * Parses @inventory mentions and commands from user input
 */

import { INVENTORY_COMMANDS, INVENTORY_KEYWORDS } from '../config/agentRegistry';

export interface ParsedMention {
  command: string;
  parameter?: string;
  isInventoryRelated: boolean;
  confidence: number;
}

/**
 * Parse user input for @inventory mentions and commands
 */
export function parseMention(input: string): ParsedMention | null {
  const trimmedInput = input.trim().toLowerCase();
  
  // Check for explicit @inventory mention
  if (trimmedInput.includes('@inventory')) {
    const command = trimmedInput.replace('@inventory', '').trim();
    
    // Match specific commands
    for (const cmd of INVENTORY_COMMANDS) {
      const cmdPattern = cmd.command.replace('@inventory', '').trim();
      if (command.startsWith(cmdPattern.split('[')[0].trim())) {
        const parameter = extractParameter(command, cmdPattern);
        return {
          command: cmd.command,
          parameter,
          isInventoryRelated: true,
          confidence: 1.0
        };
      }
    }
    
    // Generic @inventory mention
    return {
      command: '@inventory overview',
      isInventoryRelated: true,
      confidence: 0.8
    };
  }
  
  // Check for inventory-related keywords
  const matchedKeywords = INVENTORY_KEYWORDS.filter(keyword => 
    trimmedInput.includes(keyword)
  );
  
  if (matchedKeywords.length > 0) {
    const confidence = Math.min(matchedKeywords.length * 0.3, 0.9);
    return {
      command: '@inventory overview',
      isInventoryRelated: true,
      confidence
    };
  }
  
  return null;
}

/**
 * Extract parameter from command string
 */
function extractParameter(command: string, pattern: string): string | undefined {
  if (pattern.includes('[') && pattern.includes(']')) {
    const basePattern = pattern.split('[')[0].trim();
    const remainder = command.replace(basePattern, '').trim();
    return remainder || undefined;
  }
  return undefined;
}

/**
 * Generate suggestion list for autocomplete
 */
export function generateSuggestions(input: string): string[] {
  const trimmedInput = input.trim().toLowerCase();
  
  if (trimmedInput.includes('@inventory')) {
    return INVENTORY_COMMANDS.map(cmd => cmd.command);
  }
  
  if (trimmedInput.includes('@')) {
    return ['@inventory overview', '@inventory financial', '@inventory recommendations'];
  }
  
  // Suggest based on keywords
  const suggestions: string[] = [];
  if (trimmedInput.includes('slow')) {
    suggestions.push('@inventory overview', '@inventory category');
  }
  if (trimmedInput.includes('cost') || trimmedInput.includes('financial')) {
    suggestions.push('@inventory financial');
  }
  if (trimmedInput.includes('recommend') || trimmedInput.includes('action')) {
    suggestions.push('@inventory recommendations');
  }
  
  return suggestions;
}

/**
 * Context packer for inventory data
 */
export function packInventoryContext(data: any): string {
  if (!data) return '';
  
  let context = 'Current inventory context:\n';
  
  if (data.kpiMetrics) {
    context += `- Slow-moving items: ${data.kpiMetrics.totalSlowMovingItems}\n`;
    context += `- Value tied up: $${data.kpiMetrics.slowMovingValue.toLocaleString()}\n`;
    context += `- Average turnover: ${data.kpiMetrics.averageTurnoverRatio}x\n`;
  }
  
  if (data.selectedCategory) {
    context += `- Selected category: ${data.selectedCategory}\n`;
  }
  
  if (data.selectedWarehouse) {
    context += `- Selected warehouse: ${data.selectedWarehouse}\n`;
  }
  
  if (data.selectedItems && data.selectedItems.length > 0) {
    context += `- Selected items: ${data.selectedItems.length} items\n`;
  }
  
  return context;
}
