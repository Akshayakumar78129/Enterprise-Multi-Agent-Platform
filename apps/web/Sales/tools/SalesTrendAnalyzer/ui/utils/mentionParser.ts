// Mention Parser for Enhanced Chatbot
import { getAgentByName, MAIN_AGENTS } from '../config/agentRegistry';

export interface ParsedMention {
  agentName: string;
  fullMatch: string;
  startIndex: number;
  endIndex: number;
}

export interface MentionParseResult {
  mentions: ParsedMention[];
  hasValidMentions: boolean;
  primaryAgent?: string;
  cleanedMessage: string;
}

/**
 * Parses @mentions from user input
 */
export const parseMentions = (text: string): MentionParseResult => {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions: ParsedMention[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const agentName = match[1];
    const agent = getAgentByName(agentName);
    
    if (agent) {
      mentions.push({
        agentName,
        fullMatch: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }

  // Clean the message by removing @mentions for processing
  let cleanedMessage = text;
  mentions.forEach(mention => {
    cleanedMessage = cleanedMessage.replace(mention.fullMatch, '').trim();
  });

  return {
    mentions,
    hasValidMentions: mentions.length > 0,
    primaryAgent: mentions.length > 0 ? mentions[0].agentName : undefined,
    cleanedMessage: cleanedMessage || text
  };
};

/**
 * Gets mention suggestions based on current input
 */
export const getMentionSuggestions = (text: string, cursorPosition: number) => {
  const beforeCursor = text.substring(0, cursorPosition);
  const lastAtIndex = beforeCursor.lastIndexOf('@');
  
  if (lastAtIndex === -1) return { show: false, suggestions: [] };
  
  const afterAt = beforeCursor.substring(lastAtIndex + 1);
  const spaceAfterAt = afterAt.includes(' ');
  
  if (spaceAfterAt) return { show: false, suggestions: [] };
  
  const query = afterAt.toLowerCase();
  const suggestions = MAIN_AGENTS.filter(agent =>
    agent.agentName.toLowerCase().startsWith(query) ||
    agent.displayName.toLowerCase().includes(query)
  );

  return {
    show: true,
    suggestions,
    query,
    startPosition: lastAtIndex
  };
};

/**
 * Inserts a mention into text at the current cursor position
 */
export const insertMention = (
  text: string, 
  cursorPosition: number, 
  agentName: string
): { newText: string; newCursorPosition: number } => {
  const beforeCursor = text.substring(0, cursorPosition);
  const afterCursor = text.substring(cursorPosition);
  
  const lastAtIndex = beforeCursor.lastIndexOf('@');
  
  if (lastAtIndex === -1) {
    // No @ found, just insert at cursor
    const mention = `@${agentName} `;
    const newText = beforeCursor + mention + afterCursor;
    return {
      newText,
      newCursorPosition: cursorPosition + mention.length
    };
  }
  
  // Replace from @ to cursor with the mention
  const beforeAt = beforeCursor.substring(0, lastAtIndex);
  const mention = `@${agentName} `;
  const newText = beforeAt + mention + afterCursor;
  
  return {
    newText,
    newCursorPosition: lastAtIndex + mention.length
  };
};

/**
 * Validates if a mention exists in our agent registry
 */
export const validateMention = (agentName: string): boolean => {
  return getAgentByName(agentName) !== undefined;
};