"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../ui/Button";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface SelectedPoint {
  label: string;
  value: string | number;
  source: string;
}

export interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPoints?: SelectedPoint[];
  onClearSelection?: () => void;
  dashboardContext?: string;
  additionalContext?: Record<string, any>;
  apiUrl?: string;
  agentTypes?: Array<{
    value: string;
    label: string;
    description: string;
  }>;
}

const DEFAULT_AGENT_TYPES = [
  { value: "orchestration_agent", label: "Orchestration Agent", description: "General business insights" },
  { value: "customer_insights_agent", label: "Customer Agent", description: "Customer analytics" },
  { value: "financial_agent", label: "Financial Agent", description: "Financial analysis" },
  { value: "sales_agent", label: "Sales Agent", description: "Sales insights" },
];

export function ChatInterface({
  isOpen,
  onClose,
  selectedPoints = [],
  onClearSelection,
  dashboardContext = "general",
  additionalContext = {},
  apiUrl,
  agentTypes = DEFAULT_AGENT_TYPES,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(agentTypes[0]?.value || "orchestration_agent");
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Set default API URL - ensure no trailing /api
  const rawApiUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const baseApiUrl = rawApiUrl.replace(/\/api\/?$/, '');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildContextInfo = () => {
    let contextInfo = "";

    if (selectedPoints.length > 0) {
      contextInfo = `\nSelected data points:\n${selectedPoints.map((p, i) =>
        `${i + 1}. ${p.label}: ${p.value} [${p.source}]`
      ).join("\n")}`;
    }

    if (additionalContext && Object.keys(additionalContext).length > 0) {
      contextInfo += `\nAdditional context:\n${JSON.stringify(additionalContext, null, 2)}`;
    }

    return contextInfo;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const queryWithContext = input + buildContextInfo();

    abortControllerRef.current = new AbortController();

    try {
      // Generate or retrieve session info
      const sessionId = sessionStorage.getItem('chat_session_id') || `session_${Date.now()}`;
      const userId = sessionStorage.getItem('chat_user_id') || `user_${Date.now()}`;

      // Store for future use
      sessionStorage.setItem('chat_session_id', sessionId);
      sessionStorage.setItem('chat_user_id', userId);

      const requestBody = {
        user_query: queryWithContext,
        session_id: sessionId,
        user_id: userId,
        app_name: selectedAgent || "orchestration_agent",
        agent_type: selectedAgent,
        is_canvas: false,
      };

      console.log("Sending request to:", `${baseApiUrl}/run_sse`);
      console.log("Request body:", requestBody);

      const response = await fetch(`${baseApiUrl}/run_sse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to get response: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (reader) {
        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);

              // Check for end of stream
              if (dataStr === "[DONE]") {
                break;
              }

              try {
                const data = JSON.parse(dataStr);
                // Handle both formats: data.content and data.text
                const content = data.content || data.text || "";
                if (content && !data.partial) {
                  // Only append if not a partial message (avoid duplicates)
                  if (!accumulatedContent.includes(content)) {
                    accumulatedContent = content;
                  }
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: accumulatedContent, isStreaming: true }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.error("Failed to parse SSE data:", e);
              }
            }
          }
        }

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Chat error:", error);
        let errorContent = "Sorry, I encountered an error. ";

        if (error.message.includes("404")) {
          errorContent += "The chat service is not available. Please make sure the backend is running on port 8000.";
        } else if (error.message.includes("Failed to fetch")) {
          errorContent += "Cannot connect to the backend. Please make sure the backend is running on port 8000.";
        } else {
          errorContent += "Please try again or check the console for details.";
        }

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: errorContent,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-background border border-border rounded-lg shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Agent Selector */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAgentDropdown(!showAgentDropdown)}
              className="flex items-center gap-1"
            >
              {agentTypes.find(a => a.value === selectedAgent)?.label.split(" ")[0]}
              <ChevronDown className="w-3 h-3" />
            </Button>

            {showAgentDropdown && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-background border rounded-md shadow-lg z-10">
                {agentTypes.map(agent => (
                  <button
                    key={agent.value}
                    onClick={() => {
                      setSelectedAgent(agent.value);
                      setShowAgentDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-accent transition-colors",
                      selectedAgent === agent.value && "bg-accent"
                    )}
                  >
                    <div className="font-medium text-sm">{agent.label}</div>
                    <div className="text-xs text-muted-foreground">{agent.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selected Points Display */}
      {selectedPoints.length > 0 && (
        <div className="px-4 py-2 bg-accent/50 border-b">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">
              Selected Points ({selectedPoints.length})
              {selectedPoints.length < 5 && (
                <span className="text-muted-foreground ml-2">Shift+click to add more</span>
              )}
            </span>
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all ×
              </button>
            )}
          </div>
          <div className="max-h-20 overflow-y-auto">
            {selectedPoints.map((point, idx) => (
              <div key={idx} className="text-xs text-muted-foreground">
                {idx + 1}. {point.label}: {point.value} [{point.source}]
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ask me about your {dashboardContext.replace(/_/g, " ")} metrics and insights!</p>
            <p className="text-xs mt-2">Shift+click on charts to add context</p>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
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
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
              )}
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask about ${dashboardContext.replace(/_/g, " ")} metrics...`}
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={1}
            disabled={isLoading}
          />
          {isLoading ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={stopStreaming}
            >
              <X className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}