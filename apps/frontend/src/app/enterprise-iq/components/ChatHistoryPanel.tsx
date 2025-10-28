"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { MessageSquare, ChevronDown, ChevronUp, X } from 'lucide-react';
import { RootState } from '@/store';

export function ChatHistoryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { conversations, activeConversationId } = useSelector(
    (state: RootState) => state.conversation
  );

  const messages = activeConversationId && conversations[activeConversationId]
    ? conversations[activeConversationId].messages
    : [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized && isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized, isOpen]);

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[60] glass-card p-3 rounded-full border border-border hover:bg-accent/20 transition-all shadow-lg hover:shadow-xl"
          aria-label="Open chat history"
        >
          <MessageSquare className="w-6 h-6 text-foreground" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {messages.length}
            </span>
          )}
        </button>
      )}

      {/* Chat History Panel */}
      {isOpen && (
        <div className={`
          fixed right-6 z-[60] glass-card border border-border rounded-lg shadow-2xl backdrop-blur-xl
          transition-all duration-300 ease-in-out
          ${isMinimized ? 'bottom-6 w-80' : 'bottom-6 w-96 h-[500px]'}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm text-foreground">Chat History</span>
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {messages.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-accent/20 rounded transition-colors"
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? (
                  <ChevronUp className="w-4 h-4 text-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-foreground" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-destructive/20 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          {/* Messages - Only show when not minimized */}
          {!isMinimized && (
            <div className="overflow-y-auto p-3 space-y-3 h-[calc(100%-52px)] bg-background/50">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-12 flex flex-col items-center gap-3">
                  <MessageSquare className="w-12 h-12 opacity-30" />
                  <div>
                    <p className="font-medium">No messages yet</p>
                    <p className="text-xs mt-1">Start a conversation to see your chat history</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`flex gap-2 animate-fadeIn ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role !== 'user' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">AI</span>
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm transition-all ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : message.role === 'system'
                            ? 'bg-destructive/10 text-destructive border border-destructive/30'
                            : 'bg-muted text-foreground border border-border shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words leading-relaxed">
                          {message.content}
                        </p>
                        {message.agent && message.role === 'assistant' && (
                          <p className="text-xs opacity-60 mt-1 font-medium">
                            {message.agent}
                          </p>
                        )}
                        <p className="text-xs opacity-70 mt-1.5">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-accent">U</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          )}

          {/* Minimized Preview */}
          {isMinimized && messages.length > 0 && (
            <div className="p-3 text-sm bg-background/50 rounded-b-lg">
              <p className="text-xs text-muted-foreground mb-1">Last message:</p>
              <p className="text-foreground truncate">
                {messages[messages.length - 1]?.content.slice(0, 60)}
                {messages[messages.length - 1]?.content.length > 60 ? '...' : ''}
              </p>
            </div>
          )}

          {/* Minimized Empty State */}
          {isMinimized && messages.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground text-center bg-background/50 rounded-b-lg">
              No conversation yet
            </div>
          )}
        </div>
      )}
    </>
  );
}
