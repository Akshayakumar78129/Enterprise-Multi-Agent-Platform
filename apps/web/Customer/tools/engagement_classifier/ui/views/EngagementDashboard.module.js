import React, { useState, useEffect, useRef } from "react";
import { Provider } from 'react-redux';
import { 
  ResponsiveGrid, 
  // FloatingChatButton and GlassChatPanel are not exported from ui-common in this snapshot.
  // We'll render our own local button/panel below.
} from "../../../../../ui-common/design-system";
import EngagementKPITiles from "../components/kpi/EngagementKPITiles";
import EngagementPyramid from "../components/visualizations/EngagementPyramid";
import EngagementTimeline from "../components/visualizations/EngagementTimeline";
import OpportunityFinder from "../components/visualizations/OpportunityFinder";
import EngagementFilters from "../components/filters/EngagementFilters";
import CustomerDetailModal from "../components/modals/CustomerDetailModal";
import CustomerSearchAnalytics from "../components/search/CustomerSearchAnalytics";
import CustomerInsightAgent from "../components/Businessagent";
import EngagementChatbot from "../components/chat/EngagementChatbot";
import EngagementChatButton from "../components/chat/EngagementChatButton";
import CustomerBusinessAgent from "../components/CustomerBusinessAgent";
import { store } from "../../../customer_insight/state/store";
import { setCustomers } from "../../../customer_insight/state/customerInsightSlice";

// Import CSS Module
import styles from "../styles/EngagementDashboard.module.css";
// Context command + formatting helpers (no UI impact)
import { isExplainContextCommand, formatContextsAsPrompt } from "../components/chat/context";

// Lightweight UUIDv4 generator (avoids external deps)
const uuidv4 = () => {
  // RFC4122 version 4 compliant
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Local Chat Panel with @mention suggestions (scoped to engagement_classifier only)
function ChatPanelWithMentions({
  isOpen,
  onClose,
  messages,
  isLoading = false,
  onSendMessage,
  title = 'AI Assistant',
  placeholder = 'Ask about this data...',
  headerRight,
  contextTags = [],
  onRemoveContext,
  onClearAllContexts,
}) {
  const [inputValue, setInputValue] = React.useState('');
  const [showMentions, setShowMentions] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState('');
  const [cursorPosition, setCursorPosition] = React.useState(0);
  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const agents = [
    { id: 'sales', name: 'Sales', description: 'Sales performance and forecasting' },
    { id: 'inventory', name: 'Inventory', description: 'Stock levels and optimization' }
  ];

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setInputValue(value);
    setCursorPosition(position);

    const beforeCursor = value.substring(0, position);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      setShowMentions(true);
      setMentionQuery(mentionMatch[1]);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const handleMentionSelect = (agent) => {
    const beforeMention = inputValue.substring(0, cursorPosition - mentionQuery.length - 1);
    const afterCursor = inputValue.substring(cursorPosition);
    const newValue = `${beforeMention}@${agent.id} ${afterCursor}`;
    setInputValue(newValue);
    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        onSendMessage(inputValue.trim());
        setInputValue('');
        setShowMentions(false);
        setMentionQuery('');
      }
    }
  };

  const filteredAgents = agents.filter(a =>
    a.id.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    a.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <>
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 1000
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: 'fixed', right: '24px', bottom: '84px', zIndex: 1001,
          width: '450px', height: '600px', display: 'flex', flexDirection: 'column',
          background: 'rgba(17, 24, 39, 0.75)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#e5e7eb' }}>{title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {headerRight}
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#e5e7eb', cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {messages && messages.length > 0 ? (
            messages.map((m) => {
              const isUser = m.type === 'user';
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    maxWidth: '80%', padding: '10px 12px', borderRadius: 12,
                    background: isUser ? 'linear-gradient(135deg, #8B5CF6, #22D3EE)' : 'rgba(31, 41, 55, 0.75)',
                    color: '#f7f9fb', border: '1px solid rgba(255,255,255,0.12)'
                  }}>
                    {m.content}
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6, textAlign: 'right' }}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb', opacity: 0.6 }}>
              Start a conversation about the data you're viewing
            </div>
          )}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(31,41,55,0.75)', color: '#e5e7eb', display: 'flex', gap: 8, alignItems: 'center', border: '1px solid rgba(255,255,255,0.12)' }}>
                <span style={{ width: 8, height: 8, background: '#e5e7eb', borderRadius: '50%', animation: 'pulse 1.4s infinite' }} />
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Context Tags */}
        {contextTags && contextTags.length > 0 && (
          <div style={{ padding: '8px 16px 0', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#e5e7eb', fontSize: 12, opacity: 0.8 }}>📎 Context ({contextTags.length})</span>
              {onClearAllContexts && (
                <button onClick={onClearAllContexts} style={{ background: 'transparent', border: 'none', color: '#e5e7eb', fontSize: 12, cursor: 'pointer', opacity: 0.7 }}>Clear All</button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
              {contextTags.map((tag, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(0, 224, 255, 0.1)', border: '1px solid rgba(0, 224, 255, 0.3)', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ color: '#e5e7eb', flex: 1, marginRight: 6, lineHeight: 1.3 }}>{tag}</span>
                  {onRemoveContext && (
                    <button onClick={() => onRemoveContext(tag)} style={{ background: 'transparent', border: 'none', color: '#e5e7eb', cursor: 'pointer', fontSize: 14, padding: '2px 6px', opacity: 0.7 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ display: 'flex', gap: 12, padding: 16, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            style={{ flex: 1, resize: 'none', background: 'rgba(31, 41, 55, 0.75)', color: '#f7f9fb', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 12px' }}
          />
          <button
            onClick={() => { if (inputValue.trim()) { onSendMessage(inputValue.trim()); setInputValue(''); setShowMentions(false); setMentionQuery(''); } }}
            disabled={!inputValue.trim() || isLoading}
            style={{ background: '#22d3ee', color: '#0b1020', border: 'none', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', fontWeight: 700 }}
            title="Send message"
          >Send</button>
        </div>

        {/* Mentions Dropdown */}
        {showMentions && (
          <div style={{ position: 'absolute', bottom: 140, left: 16, right: 16, background: '#232a36', border: '1px solid #3a4459', borderRadius: 12, boxShadow: '0 10px 20px rgba(0,0,0,0.3)', zIndex: 1002, maxHeight: 200, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #3a4459', color: '#9ca3af', fontSize: 12, fontWeight: 600 }}>
              Mention an agent
              <button onClick={() => setShowMentions(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
            </div>
            {filteredAgents.length === 0 ? (
              <div style={{ padding: 12, color: '#9ca3af', textAlign: 'center', fontSize: 14 }}>No matching agents</div>
            ) : (
              filteredAgents.map(agent => (
                <div key={agent.id} onClick={() => handleMentionSelect(agent)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', cursor: 'pointer' }}>
                  <div style={{ background: agent.id === 'sales' ? '#10b981' : '#3b82f6', color: '#f7f9fb', borderRadius: 6, padding: 6, fontWeight: 700 }}>@{agent.id}</div>
                  <div style={{ color: '#f7f9fb' }}>
                    <div style={{ fontWeight: 600 }}>{agent.name}</div>
                    <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{agent.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}

const EngagementDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [selectedEngagementLevel, setSelectedEngagementLevel] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [modalCustomers, setModalCustomers] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  
  // Session: single supported agent is customer_insight_agent
  const [session, setSession] = useState({
    session_id: uuidv4(),
    user_id: "ari",
    app_name: "customer_insight_agent",
  });
  
  // New chatbot state
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [hasNewChatMessage, setHasNewChatMessage] = useState(false);
  const [chatContext, setChatContext] = useState({});
  
  // Legacy chat state (keeping for compatibility)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  // Context tags state
  const [contextTags, setContextTags] = useState([]);

  useEffect(() => {
    fetchEngagementData();
  }, [filters]);

  // New chatbot functions
  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  const handleChatContextUpdate = (newContext) => {
    setChatContext(prev => ({ ...prev, ...newContext }));
  };

  // Update chat context when dashboard state changes
  useEffect(() => {
    setChatContext({
      selectedEngagementLevel,
      selectedPeriod,
      filters,
      data: data ? {
        totalCustomers: data.kpis?.total_customers || 0,
        avgEngagementScore: data.kpis?.avg_engagement_score || 0,
        reengagementOpportunities: data.kpis?.reengagement_opportunities || 0,
        daysSinceActivity: data.kpis?.avg_days_since_activity || 0
      } : null,
      timestamp: new Date().toISOString()
    });
  }, [selectedEngagementLevel, selectedPeriod, filters, data]);

  const fetchEngagementData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.engagementLevels?.length > 0) {
        filters.engagementLevels.forEach(level => queryParams.append('engagementLevels', level));
      }
      if (filters.loyaltyStatus?.length > 0) {
        filters.loyaltyStatus.forEach(status => queryParams.append('loyaltyStatus', status));
      }
      if (filters.customerSearch) queryParams.append('customerSearch', filters.customerSearch);
      if (filters.minTransactions) queryParams.append('minTransactions', filters.minTransactions);
      if (filters.minLTVAmount) queryParams.append('minLTVAmount', filters.minLTVAmount);
      if (filters.rfmScoreMin !== undefined) queryParams.append('rfmScoreMin', filters.rfmScoreMin);
      if (filters.rfmScoreMax !== undefined) queryParams.append('rfmScoreMax', filters.rfmScoreMax);

      const response = await fetch(`/api/engagement-classifier/data?${queryParams.toString()}`);
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text?.slice(0,200)}`);
      }
      
      let result;
      const raw = await response.text();
      try {
        result = JSON.parse(raw);
      } catch (e) {
        console.warn('JSON Parse Error (using fallback):', e.message);
        // Use fallback data structure to prevent crashes
        result = {
          data: {
            customers: [],
            kpis: {
              total_customers: 0,
              avg_engagement_score: 0,
              avg_days_since_activity: 0,
              reengagement_opportunities: 0
            },
            distribution: [],
            timeline: { periods: [], high: [], medium: [], low: [] }
          }
        };
      }
      console.log('Engagement API KPIs:', result?.data?.kpis, 'filters:', filters);
      setData(result?.data || null);
      
      // Dispatch customer data to Redux store for Customer Insight Agent
      if (result?.data?.customers) {
        console.log('🔄 Dispatching customer data to Redux store for Customer Insight Agent');
        store.dispatch(setCustomers(result.data.customers));
      }
    } catch (err) {
      console.error('Error fetching engagement data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKPITileClick = async (tileType) => {
    console.log('KPI Tile clicked:', tileType);
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/engagement-classifier/customers?${queryParams.toString()}`);
      const customers = await response.json();
      
      setModalCustomers(customers);
      setModalTitle(`${tileType.replace('_', ' ').toUpperCase()} - Customer Details`);
      setIsCustomerModalOpen(true);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const handleEngagementLevelClick = async (level) => {
    console.log('Engagement level clicked:', level);
    setSelectedEngagementLevel(level);
    
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('engagementLevels', level);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (key !== 'engagementLevels') {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value);
          }
        }
      });

      const response = await fetch(`/api/engagement-classifier/customers?${queryParams.toString()}`);
      const customers = await response.json();
      
      setModalCustomers(customers);
      setModalTitle(`${level} Engagement Customers`);
      setIsCustomerModalOpen(true);
    } catch (error) {
      console.error('Error fetching customers by engagement level:', error);
    }
  };

  const handlePeriodClick = (period) => {
    console.log('Period clicked:', period);
    setSelectedPeriod(period);
  };

  const handleOpportunitySelect = (opportunity) => {
    console.log('Opportunity selected:', opportunity);
    // Could implement campaign creation workflow
  };

  const handleThresholdChange = (type, value) => {
    console.log('Threshold changed:', type, value);
    // Could update opportunity filtering in real-time
  };

  const handleAddContext = (contextString) => {
    console.log('Adding context:', contextString);
    setContextTags(prev => {
      // Avoid duplicates
      if (!prev.includes(contextString)) {
        return [...prev, contextString];
      }
      return prev;
    });
  };

  const handleRemoveContext = (contextToRemove) => {
    console.log('Removing context:', contextToRemove);
    setContextTags(prev => prev.filter(ctx => ctx !== contextToRemove));
  };

  const handleClearAllContexts = () => {
    console.log('Clearing all contexts');
    setContextTags([]);
  };

  // ===== BI Chat: Single agent router (customer_insight_agent) =====
  // Enforce filter-based formatting
  const formatByMode = (text, mode) => {
    if (!text) return '';

    // Normalize line breaks
    const clean = text.replace(/\r/g, '').trim();

    // Utility: extract explicit bullet/numbered list items
    const extractListItems = (s) => {
      const all = s.split('\n').map(l => l.trim()).filter(Boolean);
      const bulletLike = all.filter(l => /^(?:[-•*]\s+|\d+\.|\d+\)|\(\d+\))/.test(l));
      return bulletLike;
    };

    if (mode === 'talk') {
      // Keep only the first short paragraph or up to 6 sentences
      const para = clean.split(/\n\n+/)[0];
      const sentences = para.split(/(?<=[.!?])\s+/).filter(Boolean);
      const result = sentences.slice(0, 6).join(' ');
      return result.trim();
    }

    if (mode === 'insights') {
      // Only keep list-style content. If none found, convert key sentences to bullets.
      let items = extractListItems(clean);

      if (items.length === 0) {
        // Fallback: build bullets from sentences (skip headings-like lines)
        const lines = clean.split(/\n+/).map(l => l.trim()).filter(Boolean);
        const sentences = lines
          .flatMap(l => l.split(/(?<=[.!?])\s+/))
          .map(s => s.trim())
          .filter(s => s && s.length > 2 && !/^\*\*.+\*\*$/.test(s));
        items = sentences;
      }

      // Normalize bullets and cap at 15
      const bullets = items
        .map(l => l.replace(/^[-•*]\s+/, '').replace(/^(\d+\.|\d+\)|\(\d+\))\s+/, ''))
        .map(l => `• ${l}`)
        .filter((l, idx, arr) => arr.indexOf(l) === idx) // dedupe
        .slice(0, 15);

      return bullets.join('\n');
    }

    // Detailed: Prefer structured content; if it contains explicit list items, keep them; otherwise leave as paragraph(s)
    // Minor cleanup: collapse excessive blank lines
    const compact = clean.replace(/\n{3,}/g, '\n\n');
    return compact;
  };

  // Core Customer Insight logic using in-memory dashboard data (backed by customer.db on server)
  const customerInsightAnswer = (query, context) => {
    const q = (query || '').toLowerCase();
    const db = data || {};

    // New: explain contexts command handling (message already expanded to list by handleSendMessage)
    if (/please explain the following context items one by one:/i.test(query)) {
      const lines = String(query).split(/\n+/).slice(1); // skip header
      if (lines.length === 0) return 'No context items provided.';
      // Explain each item in order without modifying UI or tags
      const explanations = lines.map((line) => {
        const text = line.replace(/^\d+\.\s*/, '').trim();
        // Basic heuristics for context topics; fallback to generic explanation
        if (/high engagement/i.test(text)) {
          const high = db?.distribution?.find(d => d.engagement_level === 'High');
          return `1) ${text}: These are your most active, high-value customers. Count: ${high?.customer_count ?? 'N/A'}. Focus on loyalty perks and advocacy.`;
        }
        if (/medium engagement/i.test(text)) {
          const med = db?.distribution?.find(d => d.engagement_level === 'Medium');
          return `2) ${text}: Growth segment with uplift potential. Count: ${med?.customer_count ?? 'N/A'}. Target with personalized nudges.`;
        }
        if (/low engagement|churn/i.test(text)) {
          const low = db?.distribution?.find(d => d.engagement_level === 'Low');
          return `3) ${text}: At-risk cohort needing win-back. Count: ${low?.customer_count ?? 'N/A'}. Use offers, outreach, and feedback.`;
        }
        if (/kpi|metric/i.test(text)) {
          return `• ${text}: KPIs include Total Customers (${db?.kpis?.total_customers ?? 'N/A'}), Avg Score (${db?.kpis?.avg_engagement_score ?? 'N/A'}), Avg Days Since Activity (${db?.kpis?.avg_days_since_activity ?? 'N/A'}), and Re-engagement Opportunities (${db?.kpis?.reengagement_opportunities ?? 'N/A'}).`;
        }
        if (/timeline|trend/i.test(text)) {
          const periods = db?.timeline?.periods?.length ?? 0;
          return `• ${text}: Timeline covers ${periods} periods. Look for dips and plan reactivation pushes.`;
        }
        // Generic explanation
        return `• ${text}: I will analyze this in the context of your engagement data and provide guidance or next actions.`;
      });
      return explanations.join('\n');
    }

    // Simple intent routing over dashboard dataset
    if (q.includes('kpi') || q.includes('metrics')) {
      return [
        `Total Customers: ${db?.kpis?.total_customers ?? 'N/A'}`,
        `Avg Engagement Score: ${db?.kpis?.avg_engagement_score ?? 'N/A'}`,
        `Avg Days Since Activity: ${db?.kpis?.avg_days_since_activity ?? 'N/A'}`,
        `Re-engagement Opportunities: ${db?.kpis?.reengagement_opportunities ?? 'N/A'}`,
      ].join('\n');
    }

    if (q.includes('high engagement')) {
      const high = db?.distribution?.find(d => d.engagement_level === 'High');
      return `High engagement customers: ${high?.customer_count ?? 'N/A'} (${high?.percentage ?? '—'}%). Focus on loyalty perks and advocacy.`;
    }

    if (q.includes('medium engagement')) {
      const med = db?.distribution?.find(d => d.engagement_level === 'Medium');
      return `Medium engagement customers: ${med?.customer_count ?? 'N/A'} (${med?.percentage ?? '—'}%). Target with personalized nudges to lift to High.`;
    }

    if (q.includes('low engagement') || q.includes('churn')) {
      const low = db?.distribution?.find(d => d.engagement_level === 'Low');
      return `Low engagement customers: ${low?.customer_count ?? 'N/A'} (${low?.percentage ?? '—'}%). Win-back: offers, direct outreach, and feedback loops.`;
    }

    if (q.includes('trend') || q.includes('timeline')) {
      const periods = db?.timeline?.periods?.length ?? 0;
      return `Engagement timeline available for ${periods} periods. Look for dips post-campaigns and plan reactivation pushes.`;
    }

    // Default summary
    return [
      `You have ${db?.kpis?.total_customers ?? 'N/A'} customers across high/medium/low engagement segments.`,
      `Use filters to focus segments; Opportunity Finder highlights high-ROI actions.`,
      `Ask for KPIs, segment breakdowns, or trends for specifics.`,
    ].join('\n');
  };

  // Main router: AIResponseDashboard
  const AIResponseDashboard = async (query, sess, mode = responseMode) => {
    // Only route to Customer Insight logic
    const raw = customerInsightAnswer(query, chatContext);
    const formatted = formatByMode(raw, mode);
    return formatted;
  };

  // Entry point: handQueryDemo with streaming
  const handQueryDemo = async (query) => {
    console.log('handQueryDemo: query=', query);
    console.log('session=', session);
    const answer = await AIResponseDashboard(query, session, responseMode);

    // Create chunks for simple streaming UX
    const chunkText = (text) => {
      const parts = text.split(/(\n+|(?<=[.!?])\s+)/g).filter(p => p && !/^\s+$/.test(p));
      // Merge small separators and lines
      const chunks = [];
      let buf = '';
      for (const p of parts) {
        if (p.trim().length < 2) { buf += p; continue; }
        if ((buf + p).length > 180) { chunks.push(buf); buf = p; } else { buf += p; }
      }
      if (buf) chunks.push(buf);
      return chunks;
    };

    const chunks = chunkText(answer);
    return chunks;
  };

  // Legacy chat toggle (keeping for compatibility)
  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen && data) {
      setChatContext({
        currentView: 'engagement_dashboard',
        data: {
          totalCustomers: data.kpis?.total_customers,
          engagementDistribution: data.distribution,
          selectedLevel: selectedEngagementLevel,
          filters: filters
        }
      });
    }
  };

  const handleSendMessage = async (message, context) => {
    // If user asked to explain current contexts, convert contextTags to a single message
    let outgoingMessage = message;
    if (isExplainContextCommand(message)) {
      const composed = formatContextsAsPrompt(contextTags);
      if (composed) outgoingMessage = composed; // do NOT clear contextTags (UI remains unchanged)
    }

    const userMsg = {
      id: Date.now().toString(),
      type: 'user',
      content: outgoingMessage,
      timestamp: new Date(),
      context
    };
    setChatMessages(prev => [...prev, userMsg]);

    // Prepare assistant placeholder
    const assistantId = (Date.now() + 1).toString();
    setChatMessages(prev => [...prev, { id: assistantId, type: 'assistant', content: '', timestamp: new Date() }]);
    setIsChatLoading(true);

    try {
      // Try real chatbot API for richer answers (supports @sales/@inventory and modes)
      // Use env override if available; fallback to 3001
      const defaultPort = process.env.NEXT_PUBLIC_CHATBOT_PORT || 3001;
      const apiBase = process.env.NEXT_PUBLIC_CHATBOT_API_URL
        || ((typeof window !== 'undefined' && window.location)
          ? `${window.location.protocol}//${window.location.hostname}:${defaultPort}`
          : `http://localhost:${defaultPort}`);
      const res = await fetch(`${apiBase}/api/chatbot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: outgoingMessage,
          sessionId: session.session_id,
          mode: responseMode,
        }),
      });

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        throw new Error(`Chatbot API HTTP ${res.status}${bodyText ? ` - ${bodyText}` : ''}`);
      }

      const data = await res.json();
      const text = typeof data?.response === 'string' ? data.response : '';
      const finalText = formatByMode(text || customerInsightAnswer(outgoingMessage, context || chatContext), responseMode);
      const meta = data?.metadata || {};
      setChatMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: finalText, metadata: meta } : m));
    } catch (err) {
      console.error('Chatbot API error, falling back to local answer:', err);

      // If user mentions an agent, provide a deterministic agent-style fallback instead of KPI default
      const mention = (outgoingMessage.match(/@([a-zA-Z0-9_\-]+)/) || [null, ''])[1]?.toLowerCase();
      let fallbackText = '';
      if (mention === 'inventory' || mention === 'inventory_agent') {
        const bullets = [
          'Monitor weekly stockout rate and prioritize high-velocity SKUs',
          'Increase safety stock for items with frequent stockouts',
          'Align reorder points with sales velocity and lead times',
          'Escalate suppliers with chronic delays; consider alternate vendors',
          'Bundle slow movers with fast sellers to optimize inventory turns',
        ];
        fallbackText = bullets.map(b => `• ${b}`).join('\n');
      } else if (mention === 'sales' || mention === 'sales_agent') {
        const bullets = [
          'Identify top 5 customers and plan retention offers',
          'Target medium engagement customers for uplift campaigns',
          'Review churn-risk cohort and run win-back outreach',
          'Personalize offers based on recent purchase behavior',
        ];
        fallbackText = bullets.map(b => `• ${b}`).join('\n');
      } else {
        // No agent mention → use existing local fallback
        const fb = customerInsightAnswer(outgoingMessage, context || chatContext);
        fallbackText = formatByMode(fb, responseMode);
      }

      setChatMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: formatByMode(fallbackText, responseMode) } : m));
    } finally {
      setIsChatLoading(false);
    }
  };

  const generateContextualResponse = (message, context) => {
    const lowerMessage = message.toLowerCase();

    // Normalize common misspellings like "enagaemt"
    let normalized = lowerMessage;
    const engagementTypos = ['enagaemt','enagagement','engaement','engagment','engagemnt','engagmnt','engagmen','engagemen'];
    engagementTypos.forEach(t => { normalized = normalized.replace(new RegExp(t, 'g'), 'engagement'); });
    normalized = normalized.replace(/engag\w*/g, 'engagement');

    // Avoid greeting-only responses overriding real questions
    const isGreeting = /\b(hi|hello|hey)\b/.test(normalized);
    const hasQuestionIntent = /(\?|\bwhat\b|\bwho\b|\bhow\b|\bwhy\b|\bwhich\b|\bshow\b|\bcount\b|\blist\b)/i.test(normalized);

    if (normalized.includes('high engagement') || normalized.includes('high customers')) {
      return `Based on your current data, you have ${context?.data?.engagementDistribution?.find(d => d.engagement_level === 'High')?.customer_count || 'N/A'} high engagement customers. These customers have been active within the last 30 days and represent your most valuable segment. Consider implementing loyalty programs and exclusive offers to maintain their engagement.`;
    }
    
    if (normalized.includes('low engagement') || normalized.includes('reactivation')) {
      return `Low-engagement customers: low scores (≈1–4), 90+ days since activity, infrequent purchases, low response. Focus: win-back offers, personalized outreach, check last purchase reason, and nudge with small incentives.`;
    }
    
    if (normalized.includes('trend') || normalized.includes('performance')) {
      return `Your engagement trend shows ${context?.data?.filters ? 'filtered' : 'overall'} customer behavior patterns. The pyramid visualization helps identify the distribution across engagement levels. Focus on moving medium engagement customers to high engagement through targeted nurturing campaigns.`;
    }
    
    return `I can help you analyze your customer engagement data. You currently have ${context?.data?.totalCustomers || 'N/A'} total customers. What specific aspect of customer engagement would you like to explore? I can provide insights on engagement trends, re-engagement strategies, or customer segmentation.`;
  };

  // Legacy function - now we use context tagging instead
  // This is kept for backward compatibility but redirects to new system
  const sendContextToChat = (contextPoints) => {
    console.log('🎯 Legacy sendContextToChat called, redirecting to context tagging');
    
    // If contextPoints is an array, add each as a separate context tag
    if (Array.isArray(contextPoints)) {
      contextPoints.forEach(point => handleAddContext(point));
    } else if (typeof contextPoints === 'string') {
      handleAddContext(contextPoints);
    }
    
    // Open chat panel to show the context tags
    if (!isChatOpen) {
      setIsChatOpen(true);
    }
  };
  
  // Make context functions globally available
  useEffect(() => {
    console.log('🌐 Setting up global context functions');
    window.sendContextToChat = sendContextToChat;
    window.attachContextTags = handleAddContext;
    window.openChatPanel = () => {
      console.log('🔓 Opening chat panel via global function');
      setIsChatOpen(true);
    };
    // Allow external components (e.g., Businessagent.tsx) to control mode/view
    window.setCustomerInsightMode = (mode) => {
      if (['talk', 'insights', 'detailed'].includes(mode)) setResponseMode(mode);
    };
    window.setCustomerInsightView = (view) => {
      // expected: 'overview' | 'insights' | 'detailed'
      setChatContext(prev => ({
        ...(prev || {}),
        currentView: view || 'overview',
      }));
    };
    
    return () => {
      console.log('🧹 Cleaning up global context functions');
      delete window.sendContextToChat;
      delete window.attachContextTags;
      delete window.openChatPanel;
      delete window.setCustomerInsightMode;
      delete window.setCustomerInsightView;
    };
  }, [isChatOpen]);

  if (error) {
    return (
      <div className={styles.engagementDashboard}>
        <div className={styles.mainContent}>
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
            flexDirection: "column",
            gap: "16px"
          }}>
            <div style={{ fontSize: "24px", color: "#ef4444" }}>⚠️ Error Loading Dashboard</div>
            <div style={{ color: "#f7f9fb", opacity: 0.8 }}>{error}</div>
            <button
              onClick={fetchEngagementData}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "#f7f9fb",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                fontWeight: "600"
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.engagementDashboard}>
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <h1 className={styles.title}>
              Customer Engagement Intelligence
            </h1>
          </div>
          <p className={styles.subtitle}>
            Analyze customer engagement patterns, identify opportunities, and optimize re-engagement strategies
          </p>
        </div>

        {/* Advanced Filters */}
        <div className={`${styles.section} ${styles.filtersSection}`}>
          <EngagementFilters 
            onFiltersChange={setFilters}
            currentFilters={filters}
          />
        </div>

        {/* KPI Section */}
        <EngagementKPITiles 
          kpis={data?.kpis}
          isLoading={!!(isLoading || !data || !data.kpis)}
          onTileClick={handleKPITileClick}
        />

        {/* Main Visualizations Grid */}
        <ResponsiveGrid
          columns={{ mobile: 2, tablet: 2, desktop: 2, wide: 2 }}
          gap="lg"
          staggerAnimation={true}
          animationDelay={600}
          style={{ marginBottom: "24px" }}
        >
          {/* Engagement Pyramid */}
          <div style={{ transform: 'translateX(-15%)' }}>
            <EngagementPyramid
              distribution={data?.distribution}
              isLoading={isLoading}
              onLevelClick={handleEngagementLevelClick}
              selectedLevel={filters?.engagementLevels?.[0] || null}
            />
          </div>

          {/* Engagement Timeline */}
          <EngagementTimeline
            timeline={data?.timeline}
            isLoading={isLoading}
            onPeriodClick={handlePeriodClick}
            selectedPeriod={selectedPeriod}
            onAddContext={handleAddContext}
            existingContexts={contextTags}
          />
        </ResponsiveGrid>

        {/* Customer Search & Analytics Section */}
        <div className={`${styles.section} ${styles.searchSection}`}>
          <div className={styles.glassInnerBg}>
            <CustomerSearchAnalytics
              onCustomerSelect={(customer) => {
                console.log('Customer selected for analysis:', customer);
                // Open chat with customer context
                setChatContext({
                  currentView: 'customer_detail',
                  customer: customer
                });
                setIsChatOpen(true);
              }}
            />
          </div>
        </div>

        {/* Opportunity Finder Section */}
        <div className={`${styles.section} ${styles.opportunitySection}`}>
          <div className={styles.glassInnerBg}>
            <OpportunityFinder
              opportunities={data?.opportunities}
              isLoading={isLoading}
              onOpportunitySelect={handleOpportunitySelect}
              onThresholdChange={handleThresholdChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          Last updated: {data ? new Date().toLocaleString() : '--'}
          {filters && Object.keys(filters).length > 0 && (
            <span style={{ marginLeft: "16px" }}>
              • Active filters: {Object.keys(filters).join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* New Comprehensive Chatbot System */}
      <EngagementChatButton 
        onClick={toggleChat}
        isActive={isChatVisible}
        hasNewMessage={hasNewChatMessage}
        messageCount={0}
      />
      
      <EngagementChatbot
        isVisible={isChatVisible}
        onToggle={toggleChat}
        dashboardContext={chatContext}
        onContextUpdate={handleChatContextUpdate}
      />
      
      {/* Customer Business Agent */}
      <CustomerBusinessAgent />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={modalCustomers}
        engagementLevel={selectedEngagementLevel}
        title={modalTitle}
      />

      {/* Mount the Customer Insight Agent popup */}
      <Provider store={store}>
        <CustomerInsightAgent />
      </Provider>
    </div>
  );
};

export default EngagementDashboard;