import React, { useEffect, useRef, useState } from "react";

/** ---- minimal inline agent registry (grounded) ---- */
const AGENT_LIST = [
  { name: "orchestrator", displayName: "Orchestrator", avatar: "🧭" },
  { name: "sales",        displayName: "Sales Analyst", avatar: "📈" },
  { name: "customer",     displayName: "Customer Analyst", avatar: "👥" },
  { name: "finance",      displayName: "Finance Analyst", avatar: "💰" },
];

const AGENT_CONFIG = {
  orchestrator: { name: "orchestrator", color: "#60a5fa", avatar: "🧭", displayName: "Orchestrator" },
  sales:        { name: "sales",        color: "#22d3ee", avatar: "📈", displayName: "Sales Analyst" },
  customer:     { name: "customer",     color: "#a78bfa", avatar: "👥", displayName: "Customer Analyst" },
  finance:      { name: "finance",      color: "#f59e0b", avatar: "💰", displayName: "Finance Analyst" },
};

/** ---- mention parser ---- */
function detectMention(input) {
  const m = input.trim().match(/^@(\w+)\s+/);
  return m ? { name: m[1].toLowerCase() } : null;
}
import { sendToAgent } from "../../services/agentCommunication";
/** ---- server call (grounded to real DB via your API) ---- */
/** 
async function sendToAgent(text, agentName, snapshot, focus) {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent: agentName || "orchestrator",
      message: text,
      context: {
        snapshot: snapshot || null,
        focus: focus || null,
      },
    }),
  });
  if (!res.ok) throw new Error(`Agent API failed (${res.status})`);
  return await res.json();
}
*/
/** ---- small renderer for markdown-lite content ---- */
const renderAgentMessage = (content) => {
  return (content || "")
    .replace(/^(#{1,3})\s*(.*?)$/gm, (match, hashes, t) => {
      const level = hashes.length;
      const size = level === 1 ? '18px' : level === 2 ? '16px' : '14px';
      const margin = level === 1 ? '16px' : level === 2 ? '12px' : '8px';
      return `<div style="font-size:${size};font-weight:700;margin-top:${margin};margin-bottom:8px;color:var(--text-strong)">${t}</div>`;
    })
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--brand); font-weight: 600;">$1</strong>')
    .replace(/^• (.*?)$/gm, '<div style="margin-left:16px;margin-bottom:4px;">• $1</div>')
    .replace(/^(\d+)\. (.*?)$/gm, '<div style="margin-left:16px;margin-bottom:4px;">$1. $2</div>')
    .replace(/\n\n/g, '</p><p style="margin-top:12px;margin-bottom:0;">')
    .replace(/\n/g, '<br/>')
    .replace(/([💼📊🎯📈💡👥💰📦🤖⚠️🔍📋🔄💸🏆📉])/g,'<span style="font-size:18px;vertical-align:middle;margin-right:4px;">$1</span>')
    .replace(/^(.*)$/, '<p style="margin:0;">$1</p>');
};

export default function FloatingAIChat({ onAskAI = null, snapshotGetter = null }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState(AGENT_LIST);
  const listRef = useRef(null);

  // greet on open
  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      setMessages([{
        id: Date.now(), type: "bot",
        content: `Welcome to Performance Insights.\n\nAsk about deviations, type **@orchestrator** to coordinate agents, or click a chart point and ask "why here?"`,
      }]);
    }
  }, [isChatOpen, messages.length]);

  // autoscroll
  useEffect(() => {
    listRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [messages, isLoading]);

  // open mention box on "@"
  useEffect(() => {
    const onKey = (e) => {
      if (!isChatOpen) return;
      if (e.key === "@") setShowMentionSuggestions(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isChatOpen]);

  // listen for AI insight requests from charts
  useEffect(() => {
    const onInsight = (e) => {
      const ctx = e.detail;
      // stash focus for API to consume
      window.__pd_focus = ctx;
      setIsChatOpen(true);
      setInputValue(`@orchestrator Explain the deviation in ${ctx.kpi || "this KPI"} ${ctx.date ? "on " + ctx.date : ""}`);
    };
    window.addEventListener("ai:insight-request", onInsight);
    return () => window.removeEventListener("ai:insight-request", onInsight);
  }, []);

  const handleInputChange = (e) => {
    const v = e.target.value;
    setInputValue(v);
    const atIndex = v.lastIndexOf("@");
    if (atIndex !== -1) {
      const q = v.substring(atIndex + 1).toLowerCase();
      const filtered = AGENT_LIST.filter(a => a.name.includes(q));
      setMentionSuggestions(filtered);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;

    const user = { id: Date.now(), type: "user", content: text };
    setMessages(m => [...m, user]);
    setInputValue("");
    setIsLoading(true);

    const m = detectMention(text);
    const focus = window.__pd_focus || null;
    const snapshot = (snapshotGetter?.() || window.__pd_snapshot || null);

    try {
      let response;
      if (m) {
        const agent = AGENT_CONFIG[m.name] || AGENT_CONFIG.orchestrator;
        setMessages(prev => [...prev, { id: Date.now(), type: "agent", content: "", agentName: agent.name, agentColor: agent.color, agentAvatar: agent.avatar, agentDisplayName: agent.displayName, isLoading: true }]);
        response = await sendToAgent(text, agent.name, snapshot, focus);
      } else if (onAskAI) {
        response = await onAskAI(text);
      } else {
        response = await sendToAgent(text, null, snapshot, focus);
      }
      const payload = response?.answer || response?.text || JSON.stringify(response);
      setMessages(prev => prev.map(msg => msg.isLoading ? { ...msg, isLoading: false, content: payload } : msg));
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now(), type: "bot", content: `⚠️ ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleMentionSelect = (name) => {
    setInputValue(prev => prev.replace(/@(\w+)?$/, "@" + name + " "));
    setShowMentionSuggestions(false);
  };

  return (
    <>
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            position: "fixed", bottom: "20px", right: "20px", width: "60px", height: "60px", borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", border: "none", color: "white",
            fontSize: "24px", cursor: "pointer", boxShadow: "0 8px 32px rgba(59,130,246,0.4)",
            zIndex: 1001, transition: "all 0.3s ease"
          }}
          title="Open AI Assistant"
        >🤖</button>
      )}

      {isChatOpen && (
        <div style={{
          position: "fixed", top: 0, right: 0, width: "420px", height: "100vh",
          background: "linear-gradient(135deg, rgba(26,31,46,0.98), rgba(42,47,62,0.98))",
          backdropFilter: "blur(20px)", borderLeft: "1px solid rgba(59,130,246,0.3)",
          zIndex: 1002, display: "flex", flexDirection: "column", boxShadow: "-20px 0 60px rgba(0,0,0,0.3)", overflow: "hidden"
        }}>
          {/* header */}
          <div style={{
            padding: "20px 24px", borderBottom: "1px solid rgba(58,68,89,0.5)",
            background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>Enhanced AI Assistant</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Ready with @mentions</div>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>

          {/* messages */}
          <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.type === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "14px 18px",
                  borderRadius: m.type === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                  background: m.type === "user" ? "linear-gradient(135deg, #3b82f6, #8b5cf6)" : "linear-gradient(135deg, rgba(30,39,56,0.8), rgba(44,51,65,0.8))",
                  color: "var(--text-strong)", border: m.type === "user" ? "none" : "1px solid rgba(58,68,89,0.3)", boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                }}>
                  <div dangerouslySetInnerHTML={{ __html: renderAgentMessage(m.content) }} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "14px 18px", borderRadius: "20px 20px 20px 6px", background: "linear-gradient(135deg, rgba(30,39,56,0.8), rgba(44,51,65,0.8))", border: "1px solid rgba(58,68,89,0.3)" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", animation: `pulse 1.4s ease-in-out infinite ${i * 0.2}s` }} />)}
                    <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: 12 }}>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* mention suggestions */}
          {showMentionSuggestions && (
            <div style={{
              position: "absolute", bottom: "100px", left: "20px", right: "20px",
              background: "linear-gradient(135deg, rgba(26,31,46,0.98), rgba(42,47,62,0.98))",
              backdropFilter: "blur(20px)", borderRadius: 12, border: "1px solid rgba(0,224,255,0.3)",
              boxShadow: "0 10px 30px rgba(0,224,255,0.2)", maxHeight: "320px", overflowY: "auto", zIndex: 1005
            }}>
              {mentionSuggestions.map((s, i) => (
                <div key={s.name} onClick={() => handleMentionSelect(s.name)} style={{ padding: "12px 16px", cursor: "pointer", borderBottom: i < mentionSuggestions.length - 1 ? "1px solid rgba(58,68,89,0.3)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 20, marginTop: 2 }}>{s.avatar}</span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14 }}>@{s.name}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.displayName}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* input */}
          <div style={{ padding: 20, borderTop: "1px solid rgba(58,68,89,0.3)", background: "linear-gradient(135deg, rgba(26,31,46,0.9), rgba(42,47,62,0.9))" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <textarea
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask about performance… or use @ to call an agent"
                style={{ width: "100%", minHeight: 44, maxHeight: 120, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(58,68,89,0.5)", background: "rgba(30,39,56,0.6)", color: "var(--text-strong)", fontSize: 14, outline: "none", resize: "none" }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  padding: "12px 20px", borderRadius: 12, border: "none",
                  background: (inputValue.trim() && !isLoading) ? "linear-gradient(135deg, #3b82f6, #8b5cf6)" : "rgba(58,68,89,0.5)",
                  color: (inputValue.trim() && !isLoading) ? "#ffffff" : "var(--text-muted)",
                  cursor: (inputValue.trim() && !isLoading) ? "pointer" : "not-allowed",
                  fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, minWidth: 80, justifyContent: "center"
                }}
              >
                <span>Send</span><span>🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* small animations */}
      <style jsx global>{`
        @keyframes pulse { 0%{transform:scale(1);opacity:.5} 50%{transform:scale(1.1);opacity:1} 100%{transform:scale(1);opacity:.5} }
      `}</style>
    </>
  );
}
export const EnhancedContextAwareChatbot = FloatingAIChat;