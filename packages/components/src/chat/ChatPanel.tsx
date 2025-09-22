"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, X, Trash2, User } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../ui/Button";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface SelectedPoint {
  label: string;
  value: string | number;
  source: string;
}

export interface ChatPanelProps {
  onClose: () => void;
  selectedPoints?: SelectedPoint[];
  onClearSelection?: () => void;
  dashboardContext?: string;
  additionalContext?: Record<string, any>;
}

export function ChatPanel({
  onClose,
  selectedPoints = [],
  onClearSelection,
  dashboardContext = "general",
  additionalContext = {}
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you analyze your churn prediction data today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [userId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      let queryWithContext = userMessage;

      if (selectedPoints.length > 0) {
        const pointsContext = selectedPoints
          .map(p => `${p.label}: ${p.value} (from ${p.source})`)
          .join(", ");
        queryWithContext = `Context: User has selected these data points - ${pointsContext}. Query: ${userMessage}`;
      }

      if (dashboardContext) {
        queryWithContext = `Dashboard: ${dashboardContext}. ${queryWithContext}`;
      }

      if (additionalContext && Object.keys(additionalContext).length > 0) {
        queryWithContext = `Additional Context: ${JSON.stringify(additionalContext)}. ${queryWithContext}`;
      }

      const baseApiUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || "http://localhost:8000";
      const response = await fetch(`${baseApiUrl}/run_sse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify({
          user_query: queryWithContext,
          session_id: sessionId,
          user_id: userId,
          app_name: "orchestration_agent",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages(prev => [...prev, { role: "assistant", content: "", timestamp: new Date().toISOString() }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.content || parsed.text || "";

              if (content) {
                assistantMessage += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  if (newMessages[newMessages.length - 1].role === "assistant") {
                    newMessages[newMessages.length - 1].content = assistantMessage;
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">AI Assistant</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="w-7 h-7"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Selected Points */}
      {selectedPoints.length > 0 && (
        <div className="p-3 bg-primary/5 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Selected Data Points</span>
            {onClearSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-6 px-2 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedPoints.map((point, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-background rounded-md border text-xs"
              >
                <span className="font-medium">{point.label}:</span>
                <span>{point.value}</span>
                <span className="text-muted-foreground">({point.source})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.timestamp && (
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
            {message.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask about your data..."
            className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}