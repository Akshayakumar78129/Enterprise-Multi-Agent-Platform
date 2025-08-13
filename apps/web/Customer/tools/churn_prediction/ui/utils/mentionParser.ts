/**
 * Mention Parser Utilities
 * Handles parsing and processing of @mentions in chat messages
 */

export interface ParsedMention {
  agentName: string;
  startIndex: number;
  endIndex: number;
  fullMatch: string;
}

export interface ParsedMessage {
  originalText: string;
  mentions: ParsedMention[];
  textWithoutMentions: string;
  hasMultipleMentions: boolean;
}

/**
 * Regular expression to match @mentions
 * Matches @word_characters (letters, numbers, underscores)
 */
const MENTION_REGEX = /@(\w+)/g;

/**
 * Parse mentions from a text message
 */
export const parseMentions = (text: string): ParsedMessage => {
  const mentions: ParsedMention[] = [];
  let match;
  
  // Reset regex lastIndex to ensure consistent results
  MENTION_REGEX.lastIndex = 0;
  
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    mentions.push({
      agentName: match[1], // The captured group (agent name without @)
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      fullMatch: match[0] // The full @agent_name match
    });
  }
  
  // Remove mentions from text to get the actual query
  let textWithoutMentions = text;
  mentions.forEach(mention => {
    textWithoutMentions = textWithoutMentions.replace(mention.fullMatch, '').trim();
  });
  
  // Clean up extra spaces
  textWithoutMentions = textWithoutMentions.replace(/\s+/g, ' ').trim();
  
  return {
    originalText: text,
    mentions,
    textWithoutMentions,
    hasMultipleMentions: mentions.length > 1
  };
};

/**
 * Check if text contains any mentions
 */
export const hasMentions = (text: string): boolean => {
  MENTION_REGEX.lastIndex = 0;
  return MENTION_REGEX.test(text);
};

/**
 * Extract just the agent names from mentions
 */
export const extractAgentNames = (text: string): string[] => {
  const parsed = parseMentions(text);
  return parsed.mentions.map(mention => mention.agentName);
};

/**
 * Replace mentions in text with formatted versions
 */
export const formatMentionsInText = (
  text: string, 
  formatter: (agentName: string) => string
): string => {
  const parsed = parseMentions(text);
  let formattedText = text;
  
  // Process mentions in reverse order to maintain correct indices
  parsed.mentions.reverse().forEach(mention => {
    const formattedMention = formatter(mention.agentName);
    formattedText = 
      formattedText.substring(0, mention.startIndex) +
      formattedMention +
      formattedText.substring(mention.endIndex);
  });
  
  return formattedText;
};

/**
 * Validate mentions against available agents
 */
export const validateMentions = (
  mentions: ParsedMention[], 
  validAgents: string[]
): { valid: ParsedMention[]; invalid: ParsedMention[] } => {
  const valid: ParsedMention[] = [];
  const invalid: ParsedMention[] = [];
  
  mentions.forEach(mention => {
    if (validAgents.includes(mention.agentName)) {
      valid.push(mention);
    } else {
      invalid.push(mention);
    }
  });
  
  return { valid, invalid };
};

/**
 * Create mention suggestions for autocomplete
 */
export const createMentionSuggestions = (
  text: string,
  cursorPosition: number,
  availableAgents: string[]
): { suggestions: string[]; replaceStart: number; replaceEnd: number } | null => {
  // Find if cursor is after an @ symbol
  const beforeCursor = text.substring(0, cursorPosition);
  const atMatch = beforeCursor.match(/@(\w*)$/);
  
  if (!atMatch) {
    return null;
  }
  
  const partialAgent = atMatch[1];
  const replaceStart = cursorPosition - atMatch[0].length;
  const replaceEnd = cursorPosition;
  
  // Filter agents based on partial match
  const suggestions = availableAgents.filter(agent =>
    agent.toLowerCase().startsWith(partialAgent.toLowerCase())
  );
  
  return {
    suggestions,
    replaceStart,
    replaceEnd
  };
};

/**
 * Highlight mentions in text for display
 */
export const highlightMentions = (
  text: string,
  mentionClassName: string = 'mention-highlight'
): string => {
  return formatMentionsInText(text, (agentName) => 
    `<span class="${mentionClassName}">@${agentName}</span>`
  );
};

/**
 * Extract context from message for agent queries
 */
export const extractQueryContext = (parsedMessage: ParsedMessage): {
  query: string;
  mentionedAgents: string[];
  hasContext: boolean;
} => {
  return {
    query: parsedMessage.textWithoutMentions,
    mentionedAgents: parsedMessage.mentions.map(m => m.agentName),
    hasContext: parsedMessage.textWithoutMentions.length > 0
  };
};