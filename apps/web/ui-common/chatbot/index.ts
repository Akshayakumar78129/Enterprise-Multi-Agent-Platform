export { UniversalChatbot } from './UniversalChatbot';
export { ChatbotButton } from './ChatbotButton';
export { useChatSession } from './hooks/useChatSession';
export { useAgentRouter } from './hooks/useAgentRouter';
export { 
  agents, 
  detectAgentFromContext, 
  getAgentByMention,
  extractMentions,
  replaceMentionsWithAgent,
  type AgentConfig 
} from './agentConfig';