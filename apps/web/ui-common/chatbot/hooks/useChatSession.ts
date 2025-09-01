import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';
import { detectAgentFromContext } from '../agentConfig';

export interface ChatSession {
  session_id: string;
  user_id: string;
  app_name: string;
}

export const useChatSession = (userId: string = 'ari') => {
  const router = useRouter();
  const [session, setSession] = useState<ChatSession>(() => {
    const agent = detectAgentFromContext(router.pathname);
    return {
      session_id: uuidv4(),
      user_id: userId,
      app_name: agent.appName
    };
  });

  // Update app_name when route changes
  useEffect(() => {
    const agent = detectAgentFromContext(router.pathname);
    setSession(prev => ({
      ...prev,
      app_name: agent.appName
    }));
  }, [router.pathname]);

  const resetSession = () => {
    const agent = detectAgentFromContext(router.pathname);
    setSession({
      session_id: uuidv4(),
      user_id: userId,
      app_name: agent.appName
    });
  };

  const switchAgent = (appName: string) => {
    setSession(prev => ({
      ...prev,
      app_name: appName
    }));
  };

  return {
    session,
    resetSession,
    switchAgent
  };
};