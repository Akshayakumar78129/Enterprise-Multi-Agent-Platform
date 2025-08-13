// Quick test of mention parser
const MENTION_REGEX = /@(\w+)/g;

const parseMentions = (text) => {
  const mentions = [];
  let match;
  
  MENTION_REGEX.lastIndex = 0;
  
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    mentions.push({
      agentName: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      fullMatch: match[0]
    });
  }
  
  let textWithoutMentions = text;
  mentions.forEach(mention => {
    textWithoutMentions = textWithoutMentions.replace(mention.fullMatch, '').trim();
  });
  
  textWithoutMentions = textWithoutMentions.replace(/\s+/g, ' ').trim();
  
  return {
    originalText: text,
    mentions,
    textWithoutMentions,
    hasMultipleMentions: mentions.length > 1
  };
};

const extractQueryContext = (parsedMessage) => {
  return {
    query: parsedMessage.textWithoutMentions,
    mentionedAgents: parsedMessage.mentions.map(m => m.agentName),
    hasContext: parsedMessage.textWithoutMentions.length > 0
  };
};

// Test the exact message you sent
const testMessage = "@sales_agent what's the revenue impact of these high-risk customers?";
console.log('Testing message:', testMessage);

const parsed = parseMentions(testMessage);
console.log('Parsed result:', parsed);

const context = extractQueryContext(parsed);
console.log('Query context:', context);

// Test agent registry lookup
const AGENT_REGISTRY = {
  sales_agent: { name: 'sales_agent', displayName: 'Sales Agent' },
  customer_agent: { name: 'customer_agent', displayName: 'Customer Agent' }
};

context.mentionedAgents.forEach(agentName => {
  const agentConfig = AGENT_REGISTRY[agentName];
  console.log(`Agent ${agentName}:`, agentConfig ? 'FOUND' : 'NOT FOUND');
});