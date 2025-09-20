"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { RootState } from '@/store';
import { addMessage, setStreamingState, setSelectedAgent } from '@/store/slices/conversationSlice';
import { addComponent } from '@/store/slices/canvasSlice';
import AgentSelector from './AgentSelector';

interface ChatInterfaceProps {
  sessionId: string;
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const dispatch = useDispatch();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { conversations, activeConversationId, selectedAgent, isStreaming } = useSelector(
    (state: RootState) => state.conversation
  );

  const messages = activeConversationId && conversations[activeConversationId]
    ? conversations[activeConversationId].messages
    : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: input,
      timestamp: Date.now()
    };

    dispatch(addMessage(userMessage));
    setInput('');
    setIsLoading(true);
    dispatch(setStreamingState(true));

    try {
      // Use relative URL to leverage Next.js proxy
      const response = await fetch('/run_sse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          user_query: input,
          session_id: sessionId,
          user_id: 'frontend-user',
          app_name: 'conversational_canvas',
          is_canvas: true,
          agent_type: selectedAgent
        })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let components: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.content) {
                assistantContent += parsed.content;
              }
              
              if (parsed.component) {
                components.push(parsed.component);
                // Add component to canvas
                const componentId = uuidv4();
                const centerX = (window.innerWidth / 2);
                const centerY = (window.innerHeight / 2);
                
                dispatch(addComponent({
                  id: componentId,
                  type: parsed.component.type,
                  toolId: parsed.component.toolId,
                  position: {
                    x: centerX + (components.length - 1) * 50,
                    y: centerY + (components.length - 1) * 50
                  },
                  size: { width: 400, height: 300 },
                  data: parsed.component.data || {},
                  minimized: false
                }));
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Add assistant message
      const assistantMessage = {
        id: uuidv4(),
        role: 'assistant' as const,
        content: assistantContent,
        timestamp: Date.now(),
        agent: selectedAgent,
        components
      };
      
      dispatch(addMessage(assistantMessage));
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      dispatch(addMessage({
        id: uuidv4(),
        role: 'system' as const,
        content: 'Error: Failed to get response. Please try again.',
        timestamp: Date.now()
      }));
    } finally {
      setIsLoading(false);
      dispatch(setStreamingState(false));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-0 right-0 w-96 h-[600px] glass-card border-l border-t border-border rounded-tl-lg z-30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-accent/10 to-primary/10">
        <h3 className="text-lg font-semibold text-foreground">AI Assistant</h3>
        <AgentSelector
          selectedAgent={selectedAgent}
          onSelectAgent={(agent) => dispatch(setSelectedAgent(agent))}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role !== 'user' && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.role === 'system'
                  ? 'bg-destructive/20 text-destructive'
                  : 'glass-card text-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.components && message.components.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {message.components.length} component(s) added to canvas
                  </p>
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-accent-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="glass-card rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 bg-surface/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent resize-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-accent hover:bg-accent/90 disabled:bg-muted disabled:cursor-not-allowed rounded-lg transition-all text-accent-foreground"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}