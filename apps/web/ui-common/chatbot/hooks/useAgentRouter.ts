import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AgentConfig, detectAgentFromContext, getAgentByMention } from '../agentConfig';

export const useAgentRouter = () => {
  const router = useRouter();
  const [currentAgent, setCurrentAgent] = useState<AgentConfig>(() => 
    detectAgentFromContext(router.pathname)
  );

  // Update agent when route changes
  useEffect(() => {
    const newAgent = detectAgentFromContext(router.pathname);
    setCurrentAgent(newAgent);
  }, [router.pathname]);

  const switchToAgent = useCallback((agentNameOrMention: string) => {
    const agent = agentNameOrMention.startsWith('@') 
      ? getAgentByMention(agentNameOrMention)
      : getAgentByMention(`@${agentNameOrMention}`);
    
    if (agent) {
      setCurrentAgent(agent);
      return agent;
    }
    return null;
  }, []);

  const getAgentForPath = useCallback((path: string) => {
    return detectAgentFromContext(path);
  }, []);

  return {
    currentAgent,
    switchToAgent,
    getAgentForPath
  };
};