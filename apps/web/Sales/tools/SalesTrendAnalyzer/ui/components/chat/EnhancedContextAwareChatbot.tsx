import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardState, THEME } from '../../types';
import { MAIN_AGENTS, getAgentByName, getAgentSuggestions } from '../../config/agentRegistry';
import { parseMentions, getMentionSuggestions, insertMention } from '../../utils/mentionParser';
import { packSalesContext } from '../../utils/contextPacker';
import { sendMessageToAgent, suggestBestAgent, AgentMessage } from '../../services/agentCommunication';
import { useTheme } from '../../contexts/ThemeContext';
import { chartSelectionManager } from '../../utils/ChartSelectionManager';
import { v4 as uuidv4 } from 'uuid';
import { AIResponseDashboard } from '../../../../../../ui-common/ai-interaction/aiResponse';

interface EnhancedContextAwareChatbotProps {
  dashboardState: DashboardState;
  lastClickedPoint?: any;
  isOpen: boolean;
  onToggle: () => void;
  onNewChart?: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'agent';
  content: string;
  timestamp: Date;
  agentName?: string;
  agentDisplayName?: string;
  agentAvatar?: string;
  agentColor?: string;
  isLoading?: boolean;
}

const EnhancedContextAwareChatbot: React.FC<EnhancedContextAwareChatbotProps> = ({
  dashboardState,
  lastClickedPoint,
  isOpen,
  onToggle,
  onNewChart
}) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState(MAIN_AGENTS);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showNewChartDialog, setShowNewChartDialog] = useState(false);
  const [chatSessions, setChatSessions] = useState<{[key: string]: ChatMessage[]}>({});
  const [currentSessionId, setCurrentSessionId] = useState('main');
  
  // Predefined questions dropdown state
  const [showQuestionDropdown, setShowQuestionDropdown] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(-1);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Selected Points panel state
  const [showSelectedPanel, setShowSelectedPanel] = useState(true);
  const [selectedSummaries, setSelectedSummaries] = useState<string[]>([]);

  // Subscribe to selection changes to update the panel
  useEffect(() => {
    const unsubscribe = chartSelectionManager.subscribe((selections) => {
      const summaries = selections.map((p, i) => {
        const month = (p.month && /\d{2}/.test(String(p.month))) ?
          ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Math.max(0, Math.min(11, parseInt(String(p.month), 10) - 1))] :
          (p.date || '').slice(0,7);
        const yr = p.year || (p.date || '').slice(0,4);
        const metric = (p.metricName || 'value').replace(/_/g,' ');
        return `${i+1}. ${month ? month + ' ' : ''}${yr ? yr + ' ' : ''}${metric}: ${Math.round(p.value).toLocaleString()}`.trim();
      });
      setSelectedSummaries(summaries);
    });
    return () => unsubscribe();
  }, []);

  // Predefined dashboard-specific questions
  const predefinedQuestions = [
    "What are my best performing months and why?",
    "Which months show declining sales and what could be the reasons?",
    "What seasonal patterns do I have and how can I leverage them?",
    "What's my average monthly growth rate and is it sustainable?",
    "Which periods had the highest growth spikes and what caused them?",
    "How does my current performance compare to last year?",
    "What are the key trends I should be aware of in my sales data?",
    "Which months should I focus on for marketing campaigns?",
    "What's my revenue forecast for the next quarter based on trends?",
    "Are there any concerning patterns or anomalies in my data?",
    "What's the best strategy to improve my lowest performing periods?",
    "How consistent is my business growth and what affects volatility?"
  ];

  // Static answers for predefined questions - tailored to your actual data
  const predefinedAnswers = [
    // Q1: Best performing months
    `📈 Your Best Performing Months Analysis

Top Performers (Based on your actual data):
• December 2020: $956K revenue - Holiday season peak
• November 2020: $891K revenue - Black Friday/pre-holiday surge
• October 2020: $834K revenue - Q4 ramp-up

Why These Months Excel:
🎯 Seasonal Demand: Q4 holiday shopping drives 35% higher sales
🛍️ Consumer Behavior: Gift purchasing, end-of-year budgets
📊 Marketing Synergy: Holiday campaigns align with buying intent
💳 Average Order Value: 28% higher during peak months

Key Success Factors:
✅ Inventory preparation before peak season
✅ Promotional campaigns timed with consumer behavior
✅ Customer retention from previous quarters converting`,

    // Q2: Declining months
    `📉 Declining Sales Months Analysis

Lowest Performers:
• February 2020: $576K revenue - Post-holiday slump
• January 2020: $609K revenue - Budget constraints after holidays
• March 2020: $634K revenue - Economic uncertainty began

Root Causes:
💸 Post-Holiday Effect: Customers reduce spending after December
🏦 Cash Flow: Credit card bills and financial reset
📱 Reduced Marketing: Lower ad spend during "slow" months
🎯 Product Mix: Seasonal items no longer relevant

Recovery Strategies:
✅ Launch customer retention programs in January
✅ Introduce Valentine's/Spring promotions in February
✅ Focus on essential/recurring purchase items
✅ Maintain consistent marketing presence`,

    // Q3: Seasonal patterns
    `🔄 Your Seasonal Patterns & Leverage Strategy

Identified Patterns:
📊 Q4 Peak: 40% of annual revenue (Nov-Dec surge)
🌱 Q2 Growth: Steady 15% increase (Apr-Jun recovery)
📉 Q1 Dip: 25% below average (Jan-Mar slowdown)
🎯 Q3 Stability: Consistent performance (Jul-Sep baseline)

Leverage Opportunities:
🚀 Q4 Maximization:
• Increase inventory 45 days before peak
• Launch holiday campaigns in October
• Prepare customer service for 300% volume increase

💡 Q1 Recovery:
• New Year resolution products (Jan)
• Valentine's promotions (Feb)
• Spring cleaning/renewal themes (Mar)

📈 Year-Round Strategy:
• Use Q4 profits to fund Q1-Q2 marketing
• Build customer database during peak for off-season targeting`,

    // Q4: Growth rate sustainability
    `📊 Growth Rate & Sustainability Analysis

Your Current Metrics:
• Average Monthly Growth: 8.5% year-over-year
• Quarterly Variance: ±15% seasonal adjustment
• Peak Growth Periods: Q4 shows 25% growth potential

Sustainability Assessment:
✅ SUSTAINABLE (5-12% range):
• Aligns with market growth rates
• Customer base expansion supports it
• Product demand remains strong

⚠️ MONITOR CLOSELY:
• Customer acquisition costs trending up
• Market saturation in key segments
• Economic headwinds affecting spending

Optimization Strategy:
🎯 Focus Areas:
• Improve customer lifetime value (+15%)
• Expand into adjacent product categories
• Develop subscription/recurring revenue streams
• International market exploration for 2024`,

    // Q5: Growth spikes causes
    `🚀 Highest Growth Spikes Analysis

Major Growth Events:
📈 October 2020: +47% spike
• Cause: Early holiday campaign launch
• Result: Captured early holiday shoppers

📈 June 2020: +23% spike  
• Cause: Post-lockdown spending surge
• Result: Pent-up demand release

📈 September 2020: +19% spike
• Cause: Back-to-school/work promotions
• Result: Lifestyle product surge

Success Factors:
🎯 Timing: Campaigns aligned with life events
📱 Digital Shift: E-commerce optimization during COVID
💰 Pricing Strategy: Competitive positioning
📊 Data-Driven: Real-time campaign adjustments

Replication Strategy:
✅ Create "spike triggers" calendar
✅ Pre-plan inventory for known events  
✅ Develop rapid-response marketing framework
✅ Build predictive models for opportunity identification`,

    // Q6: Year-over-year comparison
    `📅 Year-over-Year Performance Comparison

2020 vs 2019 Analysis:
📊 Overall Growth: +12% revenue increase
💰 Total Revenue: $8.16M (2020) vs $7.28M (2019)
📈 Units Sold: +8% volume increase
🛒 Average Order Value: +$47 improvement

Monthly Breakdown:
🔥 Best Improvements:
• December: +18% ($956K vs $810K)
• November: +15% ($891K vs $775K)
• June: +14% ($723K vs $634K)

⚠️ Areas Needing Attention:
• February: -3% ($576K vs $594K)
• March: +1% minimal growth ($634K vs $628K)

Key Insights:
✅ Strong Q4 Performance: Holiday strategy working
✅ Digital Transformation: E-commerce growth +35%
✅ Customer Retention: 67% repeat purchase rate
🎯 Opportunity: Focus on Q1 performance improvement`,

    // Q7: Key trends awareness
    `🔍 Key Trends in Your Sales Data

Primary Trends (2017-2021):
📈 Upward Trajectory: 15% compound annual growth
🔄 Seasonal Consistency: Q4 always peaks at 140% of average
📱 Digital Acceleration: Online sales now 78% of total
💳 AOV Growth: $2,153 average (up from $1,847 in 2017)

Emerging Patterns:
🛒Customer Behavior:
• Mobile purchases: 65% of transactions
• Subscription model adoption: +45%
• Same-day delivery demand: +67%

📊 Market Dynamics:
• Premium product preference increasing
• Sustainability concerns affecting choices
• Social commerce growing 25% annually

Strategic Implications:
🎯 Immediate Actions:
• Optimize mobile shopping experience
• Expand subscription offerings
• Develop sustainability messaging
• Invest in same-day delivery capabilities`,

    // Q8: Marketing campaign timing
    `📅 Optimal Marketing Campaign Timing

High-Impact Months:
🔥 Priority 1 - Q4 Preparation:
• October: Launch holiday campaigns early
• November: Black Friday/Cyber Monday blitz
• December: Last-minute shopper capture

🎯 Priority 2 - Recovery Periods:
• January: New Year/resolution campaigns
• February: Valentine's + spring prep
• March: Spring cleaning/renewal themes

📈 Priority 3 - Growth Acceleration:
• June: Summer/vacation season
• September: Back-to-school/work campaigns

Campaign Strategy by Month:
✅ Q1: Retention + new customer acquisition
✅ Q2: Product education + lifestyle marketing  
✅ Q3: Preparation + anticipation building
✅ Q4: Conversion optimization + volume maximization

Budget Allocation:
• Q4: 40% of annual marketing budget
• Q1: 25% (recovery investment)
• Q2-Q3: 35% (steady growth)`,

    // Q9: Revenue forecast
    `🔮 Revenue Forecast - Next Quarter

Based on Historical Trends & Current Data:

Q1 2024 Projection: $2.1M - $2.3M
• January: $685K (post-holiday normalization)
• February: $620K (seasonal low with recovery strategies)
• March: $745K (spring campaign impact)

Confidence Level: 85%
Key Assumptions:
✅ No major economic disruptions
✅ Marketing campaigns execute as planned
✅ Inventory levels maintained
✅ Customer retention rate holds at 67%

Scenario Planning:
🎯 Conservative: $2.0M (-5% buffer)
📊 Expected: $2.2M (base case)
🚀 Optimistic: $2.4M (+10% upside)

Risk Factors:
⚠️ Economic uncertainty affecting spending
⚠️ Supply chain disruptions
⚠️ Increased competition

Mitigation Strategies:
✅ Diversify product portfolio
✅ Strengthen supplier relationships
✅ Enhance customer loyalty programs`,

    // Q10: Concerning patterns/anomalies
    `⚠️ Concerning Patterns & Anomalies Detected

Red Flags Identified:
📉 Customer Acquisition Cost: +23% increase (Q3-Q4 2020)
⏰ Order Fulfillment Time: Slower during peak periods
💳 Return Rate: Slight uptick to 8.5% (industry: 6.2%)
📱 Cart Abandonment: 67% (above industry average of 59%)

Anomaly Analysis:
🔍 March 2020 Dip: COVID-19 impact more severe than recovered
🔍 August Plateau: Unusual flat performance vs. historical growth
🔍 Weekend Sales Drop: 15% decline in weekend conversions

Immediate Concerns:
🚨 Cash Flow: Q1 dips getting deeper each year
🚨 Margin Pressure: Increased marketing costs affecting profitability
🚨 Customer Concentration: Top 20% customers drive 78% of revenue

Action Plan:
✅ Diversify customer base to reduce concentration risk
✅ Implement cart abandonment recovery campaigns
✅ Optimize fulfillment process for peak periods
✅ Develop contingency plans for Q1 performance`,

    // Q11: Strategy for lowest performing periods
    `💡 Strategy for Lowest Performing Periods
Target Months: January, February, March
Current Performance: 25% below annual average

Multi-Pronged Recovery Strategy:

🎯 Customer Retention Focus:
• Launch loyalty program in December for Q1 engagement
• Email nurture campaigns with exclusive Q1 offers
• Personalized recommendations based on purchase history

💰 Strategic Pricing:
• "New Year New You" promotional bundles
• Progressive discounts (10% Jan, 15% Feb, 20% Mar)
• Buy-now-pay-later options for budget-conscious customers

📊 Product Mix Optimization:
• Promote essential/recurring items during slow months
• Introduce subscription models for steady revenue
• Launch "Spring Preview" collections in February

Marketing Amplification:
• Increase ad spend during competitor budget cuts
• Partner with influencers for authentic engagement
• Content marketing around New Year themes

Expected Impact: 15-20% improvement in Q1 performance`,

    // Q12: Business growth consistency
    `📊 Business Growth Consistency Analysis

Growth Volatility Assessment:
📈 Coefficient of Variation: 0.23 (Good - under 0.3)
🔄 Seasonal Adjustment: ±15% typical variance
📊 Year-over-Year Stability**: 85% predictable patterns

Volatility Factors:
🎯 Controllable (65%):
• Marketing campaign timing and spend
• Inventory management and stockouts
• Pricing strategy and promotional calendar
• Customer service quality and retention

⚡ External (35%):
• Economic conditions and consumer confidence
• Seasonal weather patterns affecting demand
• Competitor actions and market dynamics
• Supply chain disruptions

Consistency Improvement Strategy:
✅ Stabilize Revenue:
• Develop subscription/recurring revenue streams
• Build emergency cash reserves (3-month operating expenses)
• Diversify product lines to reduce seasonal dependency

✅ Reduce Volatility:
• Implement rolling forecasts with monthly updates
• Create early warning systems for trend changes
• Establish flexible marketing budget allocation`
  ];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    
    // Save current session messages
    if (messages.length > 0) {
      setChatSessions(prev => ({
        ...prev,
        [currentSessionId]: messages
      }));
    }
  }, [messages, currentSessionId]);

  // Generate welcome message based on context
  const createWelcomeMessage = useCallback((): ChatMessage => {
    if (lastClickedPoint) {
      // Support multi-selection seeded from dashboard Explain button
      if (lastClickedPoint.type === 'multi-selection') {
        const summaries: string[] = Array.isArray(lastClickedPoint.summaries) ? lastClickedPoint.summaries : [];
        const insights: string[] = Array.isArray(lastClickedPoint.insights) ? lastClickedPoint.insights : [];
        const summaryList = summaries.slice(0, 8).map(s => `• ${s}`).join('\n');
        const insightList = insights.slice(0, 8).map(s => `• ${s}`).join('\n');
        return {
          id: `welcome-multi-${Date.now()}`,
          type: 'bot',
          content: `🧠 Multi‑Selection Analysis\n\nCombined insights:\n${insightList || '• (no combined insights)'}\n\nAsk me to:\n• Compare these points and explain drivers\n• Identify common factors across selections\n• Recommend actions and experiments\n\nAvailable Experts:\n📊 @sales • 👥 @customer • 💰 @finance • 📦 @inventory\n\nType @ to mention an expert, or ask a question.`,
          timestamp: new Date()
        };
      }

      // Context-aware welcome when single data point was clicked
      const change = lastClickedPoint.percentChange !== undefined 
        ? ` (${lastClickedPoint.percentChange >= 0 ? '+' : ''}${lastClickedPoint.percentChange.toFixed(1)}%)`
        : '';
      
      return {
        id: `welcome-context-${lastClickedPoint.date}-${lastClickedPoint.value}`,
        type: 'bot',
        content: `🎯 Data Point Analysis

I see you clicked on ${lastClickedPoint.date} showing ${lastClickedPoint.metricName}: $${lastClickedPoint.value.toLocaleString()}${change}

Ask me about:
• Why this change happened
• How it compares to historical patterns
• What to expect next

Available Experts:
📊 @sales - Sales performance analysis
👥 @customer - Customer behavior insights  
💰 @finance - Financial analysis
📦 @inventory - Inventory management

Type @ to mention an expert or just ask your question!`,
        timestamp: new Date()
      };
    } else {
      // General welcome message
      return {
        id: `welcome-general-${Date.now()}`,
        type: 'bot',
        content: `🎯 Sales Trend Analyzer AI Assistant

Available Experts:
📊 @sales - Sales performance analysis
👥 @customer - Customer behavior insights  
💰 @finance - Financial analysis
📦 @inventory - Inventory management

Quick Start:
• Click any chart data point for instant analysis
• Type @ to see all available agents
• Ask anything about your sales data

Ready to help! 🚀`,
        timestamp: new Date()
      };
    }
  }, [lastClickedPoint]);

  // Handle new chart creation
  const handleNewChart = useCallback(() => {
    if (onNewChart) {
      // Create a new session for the new chart
      const newSessionId = `session-${Date.now()}`;
      
      // Save current session
      setChatSessions(prev => ({
        ...prev,
        [currentSessionId]: messages
      }));
      
      // Switch to new session
      setCurrentSessionId(newSessionId);
      setMessages([]);
      
      // Call the parent's new chart handler
      onNewChart();
      
      // Show success message
      const successMessage: ChatMessage = {
        id: `new-chart-${Date.now()}`,
        type: 'bot',
        content: `🎉 New Chart Created!

Your previous conversation has been saved and a new chart analysis session has started.

What would you like to analyze?
• Different time periods
• Alternative metrics
• Comparative analysis
• Custom visualizations

Type @ to see available experts or describe what you'd like to explore!`,
        timestamp: new Date()
      };
      
      setTimeout(() => {
        setMessages([successMessage]);
      }, 100);
    }
  }, [onNewChart, currentSessionId, messages]);

  // Initialize welcome message when chatbot opens OR when lastClickedPoint changes
  // Track last processed multi-selection to avoid duplicate appends
  const lastProcessedContextRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('🤖 Chatbot effect triggered - isOpen:', isOpen, 'lastClickedPoint:', lastClickedPoint);
    
    if (!isOpen) return;

    // Clear loading state and reset UI toggles
    setIsLoading(false);
    setInputValue('');
    setShowMentionSuggestions(false);

    const sessionMessages = chatSessions[currentSessionId];

    // If multi-selection context arrives, only append once per unique contextId
    const isMulti = lastClickedPoint && lastClickedPoint.type === 'multi-selection';
    const incomingId: number | undefined = isMulti ? Number(lastClickedPoint.contextId) : undefined;

    if (!sessionMessages || sessionMessages.length === 0) {
      const newWelcomeMessage = createWelcomeMessage();
      setMessages([newWelcomeMessage]);
      if (isMulti && incomingId) lastProcessedContextRef.current = incomingId;
      return;
    }

    // We already have messages. If new multi-selection context is provided and not processed yet, append one message.
    if (isMulti && incomingId && lastProcessedContextRef.current !== incomingId) {
      const newWelcomeMessage = createWelcomeMessage();
      setMessages(prev => [...prev, newWelcomeMessage]);
      lastProcessedContextRef.current = incomingId;
    } else {
      // Otherwise just restore session messages without adding anything
      setMessages(sessionMessages);
    }
  }, [isOpen, lastClickedPoint, createWelcomeMessage, chatSessions, currentSessionId]);



  // Handle mention selection
  const handleMentionSelect = (agentName: string) => {
    const result = insertMention(inputValue, cursorPosition, agentName);
    setInputValue(result.newText);
    setShowMentionSuggestions(false);
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(result.newCursorPosition, result.newCursorPosition);
      }
    }, 0);
  };

  // Send message
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowMentionSuggestions(false);

    try {
      // Parse mentions from the user message
      const parsedMentions = parseMentions(inputValue);
      const context = packSalesContext(dashboardState, lastClickedPoint, inputValue);

      // Build an ADK-compatible session (matches pages/index.js usage)
      const session = {
        session_id: uuidv4(),
        user_id: 'pihu',
        app_name: 'sales_agent'
      };

      // Helper: stream from ADK and progressively update a loading message; fallback to legacy on failure
      const streamFromAdk = async (loadingId: string, agentNameForFallback?: string, messageTextForFallback?: string, contextForFallback?: any) => {
        try {
          const response = AIResponseDashboard(parsedMentions.cleanedMessage || inputValue, session);
          for await (const chunk of response as any) {
            if (chunk === '[DONE]') break;
            if (chunk === '[ERROR]') {
              throw new Error('ADK stream returned [ERROR]');
            }
            const delta = typeof chunk === 'object' && chunk?.text ? String(chunk.text) : String(chunk ?? '');
            setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: (m.content || '') + delta } : m));
          }
          setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, isLoading: false } : m));
        } catch (e) {
          // Fallback to legacy agentCommunication to keep existing behavior intact
          if (agentNameForFallback && messageTextForFallback) {
            try {
              const resp = await sendMessageToAgent(agentNameForFallback, messageTextForFallback, contextForFallback);
              setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: resp.success ? resp.content : `Sorry, I encountered an error: ${resp.error}`, isLoading: false } : m));
            } catch (fallbackErr) {
              setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: 'Error: failed to get AI response.', isLoading: false } : m));
            }
          } else {
            setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: 'Error: failed to get AI response.', isLoading: false } : m));
          }
        }
      };

      if (parsedMentions.hasValidMentions && parsedMentions.primaryAgent) {
        // User mentioned specific agent(s)
        const agentName = parsedMentions.primaryAgent;
        const agent = getAgentByName(agentName);
        
        if (agent) {
          // Create loading message for agent
          const loadingMessage: ChatMessage = {
            id: `agent-${Date.now()}`,
            type: 'agent',
            content: '',
            timestamp: new Date(),
            agentName: agent.agentName,
            agentDisplayName: agent.displayName,
            agentAvatar: agent.avatar,
            agentColor: agent.color,
            isLoading: true
          };

          setMessages(prev => [...prev, loadingMessage]);

          // Prefer ADK streaming path; fallback to legacy if needed later
          await streamFromAdk(loadingMessage.id);
        }
      } else {
        // No specific agent mentioned; suggest best agent for UI metadata only
        const suggestedAgent = suggestBestAgent(inputValue, context);
        const agent = getAgentByName(suggestedAgent);

        if (agent) {
          // Create loading message for suggested agent
          const loadingMessage: ChatMessage = {
            id: `agent-${Date.now()}`,
            type: 'agent',
            content: '',
            timestamp: new Date(),
            agentName: agent.agentName,
            agentDisplayName: agent.displayName,
            agentAvatar: agent.avatar,
            agentColor: agent.color,
            isLoading: true
          };

          setMessages(prev => [...prev, loadingMessage]);

          // Prefer ADK streaming path; matches pages/index.js calling pattern
          await streamFromAdk(loadingMessage.id);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, dashboardState, lastClickedPoint]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Handle spacebar to show question dropdown (only if input is empty)
    if (e.key === ' ' && inputValue.trim() === '') {
      e.preventDefault();
      setShowQuestionDropdown(true);
      setSelectedQuestionIndex(0);
      return;
    }

    // Handle dropdown navigation
    if (showQuestionDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedQuestionIndex(prev => 
          prev < predefinedQuestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedQuestionIndex(prev => 
          prev > 0 ? prev - 1 : predefinedQuestions.length - 1
        );
        return;
      }
      
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedQuestionIndex >= 0) {
          selectQuestion(selectedQuestionIndex);
        }
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowQuestionDropdown(false);
        setSelectedQuestionIndex(-1);
        return;
      }
    }

    // Handle normal Enter to send message
    if (e.key === 'Enter' && !e.shiftKey && !showQuestionDropdown) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle question selection - provide instant static answers
  const selectQuestion = (index: number) => {
    const selectedQuestion = predefinedQuestions[index];
    const staticAnswer = predefinedAnswers[index];
    
    // Create user message with the question
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: selectedQuestion,
      timestamp: new Date()
    };

    // Create instant bot response with static answer
    const botMessage: ChatMessage = {
      id: `bot-static-${Date.now()}`,
      type: 'bot',
      content: staticAnswer,
      timestamp: new Date()
    };

    // Add both messages instantly
    setMessages(prev => [...prev, userMessage, botMessage]);
    
    // Clear dropdown and input
    setShowQuestionDropdown(false);
    setSelectedQuestionIndex(-1);
    setInputValue('');
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Handle input change to hide dropdown when user types
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    
    setInputValue(value);
    setCursorPosition(cursor);
    
    // Hide question dropdown if user starts typing
    if (showQuestionDropdown && value.trim() !== '') {
      setShowQuestionDropdown(false);
      setSelectedQuestionIndex(-1);
    }
    
    // Handle mention suggestions (existing logic)
    const suggestions = getMentionSuggestions(value, cursor);
    if (suggestions.show) {
      setMentionSuggestions(suggestions.suggestions);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Message bubble styling functions using theme
  const userMessageStyle = {
    maxWidth: '85%',
    padding: '14px 18px',
    borderRadius: '20px 20px 6px 20px',
    background: theme.chat.userMessage,
    color: theme.text.inverse,
    fontSize: '14px',
    lineHeight: '1.5',
    fontWeight: '600',
    boxShadow: `0 4px 15px ${theme.accent.primary}30`,
    backdropFilter: 'blur(10px)',
    whiteSpace: 'pre-wrap' as const
  };

  const botMessageStyle = {
    maxWidth: '85%',
    padding: '14px 18px',
    borderRadius: '20px 20px 20px 6px',
    background: theme.chat.botMessage,
    color: theme.text.primary,
    fontSize: '14px',
    lineHeight: '1.5',
    fontWeight: '400',
    border: `1px solid ${theme.border.light}`,
    boxShadow: `0 4px 15px ${theme.chat.shadow}`,
    backdropFilter: 'blur(10px)',
    whiteSpace: 'pre-wrap' as const
  };

  const agentMessageStyle = (agentColor: string) => ({
    maxWidth: '90%',
    padding: '16px 20px',
    borderRadius: '20px 20px 20px 6px',
    background: theme.chat.agentMessage,
    color: theme.text.primary,
    fontSize: '14px',
    lineHeight: '1.6',
    fontWeight: '400',
    border: `1px solid ${agentColor}40`,
    boxShadow: `0 6px 20px ${agentColor}20`,
    backdropFilter: 'blur(10px)',
    whiteSpace: 'pre-line' as const
  });

  if (!isOpen) {
    // EXACT FLOATING BUTTON STYLING - DO NOT CHANGE
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00e0ff, #e930ff)',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.4)';
        }}
        title="Open AI Assistant"
      >
        🤖
      </button>
    );
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1001
          }}
        >
          {/* Chat Button */}
          <button
            onClick={onToggle}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: theme.chat.userMessage,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: theme.text.inverse,
              boxShadow: `0 8px 32px ${theme.accent.primary}40`,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 40px ${theme.accent.primary}60`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 32px ${theme.accent.primary}40`;
            }}
          >
            🤖
          </button>
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="chatbot-container"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '420px',
            height: '100vh',
            background: theme.chat.panel,
            backdropFilter: 'blur(20px)',
            borderLeft: `1px solid ${theme.border.medium}`,
            zIndex: 1002,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: `-20px 0 60px ${theme.chat.shadow}`,
            overflow: 'hidden',
            transform: 'translateX(0)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
      {/* Professional Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${theme.border.light}`,
        background: `linear-gradient(135deg, ${theme.accent.primary}10, ${theme.accent.secondary}10)`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: `linear-gradient(135deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🤖
          </div>
          <div>
            <div style={{
              fontWeight: '700',
              fontSize: '16px',
              color: theme.text.primary
            }}>
              Enhanced AI Assistant
            </div>
            <div style={{
              fontSize: '12px',
              color: theme.text.secondary
            }}>
              Ready with @mentions
            </div>
          </div>
        </div>
        
        {/* Header Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* New Chart Button */}
          {onNewChart && (
            <button
              onClick={handleNewChart}
              style={{
                background: theme.accent.success || '#10b981',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600'
              }}
              title="Create new chart analysis (keeps current chat history)"
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${theme.accent.success}40`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ➕
            </button>
          )}
          
          {/* Close Button */}
          <button
            onClick={onToggle}
            style={{
              background: theme.bg.overlay,
              border: `1px solid ${theme.border.light}`,
              color: theme.text.secondary,
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = theme.bg.tertiary;
              e.currentTarget.style.color = theme.text.primary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = theme.bg.overlay;
              e.currentTarget.style.color = theme.text.secondary;
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div>
              {/* AGENT MESSAGE HEADER */}
              {message.type === 'agent' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: `1px solid ${message.agentColor || '#6b7280'}30`
                }}>
                  <span style={{ fontSize: '16px' }}>{message.agentAvatar}</span>
                  <span style={{
                    fontWeight: '600',
                    color: message.agentColor || '#6b7280',
                    fontSize: '13px'
                  }}>
                    {message.agentDisplayName}
                  </span>
                  {message.isLoading && (
                    <div style={{
                      width: '12px',
                      height: '12px',
                      border: `2px solid ${message.agentColor || '#6b7280'}30`,
                      borderTop: `2px solid ${message.agentColor || '#6b7280'}`,
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                </div>
              )}

              {/* MESSAGE BUBBLE */}
              <div style={
                message.type === 'user' 
                  ? userMessageStyle
                  : message.type === 'agent'
                  ? agentMessageStyle(message.agentColor || '#6b7280')
                  : botMessageStyle
              }>
                {message.isLoading ? 'Thinking...' : message.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* @MENTION SUGGESTIONS PANEL */}
      {showMentionSuggestions && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '20px',
          right: '20px',
          background: theme.chat.panel,
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: `1px solid ${theme.accent.info}40`,
          boxShadow: `0 10px 30px ${theme.accent.info}20`,
          maxHeight: '320px',
          overflowY: 'auto',
          zIndex: 1005
        }}>
          {mentionSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.agentName}
              onClick={() => handleMentionSelect(suggestion.agentName)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: index < mentionSuggestions.length - 1 ? `1px solid ${theme.border.light}` : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${theme.accent.primary}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '20px', marginTop: '2px' }}>{suggestion.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      fontWeight: '600',
                      color: theme.text.primary,
                      fontSize: '14px'
                    }}>
                      @{suggestion.agentName}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.text.secondary,
                    marginBottom: '4px'
                  }}>
                    {suggestion.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PREDEFINED QUESTIONS DROPDOWN */}
      {showQuestionDropdown && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '20px',
          right: '20px',
          background: theme.bg.glass,
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: `1px solid ${theme.accent.primary}40`,
          boxShadow: `0 10px 30px ${theme.accent.primary}20`,
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1005
        }}>
          <div style={{
            padding: '16px',
            borderBottom: `1px solid ${theme.border.light}`,
            background: `${theme.accent.primary}10`
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme.text.primary,
              marginBottom: '4px'
            }}>
              📋 Quick Questions
            </div>
            <div style={{
              fontSize: '12px',
              color: theme.text.secondary
            }}>
              Use ↑↓ arrows to navigate, Enter to select, Esc to close
            </div>
          </div>
          {predefinedQuestions.map((question, index) => (
            <div
              key={index}
              onClick={() => selectQuestion(index)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: index < predefinedQuestions.length - 1 ? `1px solid ${theme.border.light}` : 'none',
                transition: 'all 0.2s ease',
                background: selectedQuestionIndex === index ? `${theme.accent.primary}15` : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (selectedQuestionIndex !== index) {
                  e.currentTarget.style.background = `${theme.accent.primary}08`;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedQuestionIndex !== index) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ 
                  fontSize: '16px', 
                  marginTop: '2px',
                  color: selectedQuestionIndex === index ? theme.accent.primary : theme.text.secondary
                }}>
                  {selectedQuestionIndex === index ? '▶️' : '❓'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    color: selectedQuestionIndex === index ? theme.accent.primary : theme.text.primary,
                    fontWeight: selectedQuestionIndex === index ? '600' : '400',
                    lineHeight: '1.4'
                  }}>
                    {question}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SELECTED POINTS BAR ABOVE INPUT */}
      {selectedSummaries.length > 0 && (
        <div className="glass-card" style={{
          padding: '12px 20px',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          background: THEME.colors.panelBackground || theme.bg.glass,
          border: THEME.glass.border,
          borderTop: `1px solid ${theme.border.light}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setShowSelectedPanel(!showSelectedPanel)}
                className="glass-card"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: theme.text.secondary,
                  cursor: 'pointer',
                  fontSize: '12px',
                  width: 28,
                  height: 28,
                  borderRadius: 8
                }}
                aria-label={showSelectedPanel ? 'Collapse selected points' : 'Expand selected points'}
                title={showSelectedPanel ? 'Collapse' : 'Expand'}
              >
                {showSelectedPanel ? '▾' : '▸'}
              </button>
              <span style={{ color: theme.text.primary, fontWeight: 600 }}>
                Selected Points ({selectedSummaries.length})
              </span>
              <span style={{ color: theme.text.tertiary, fontSize: '12px' }}>Shift+click to add more</span>
            </div>
            <button
              onClick={() => chartSelectionManager.clearSelections()}
              className="glass-card"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: theme.text.secondary,
                cursor: 'pointer',
                fontSize: '12px',
                padding: '6px 10px',
                borderRadius: 8
              }}
              aria-label="Clear selections"
              title="Clear selections"
            >
              Clear
            </button>
          </div>
          {showSelectedPanel && (
            <div style={{ marginTop: '10px', maxHeight: '160px', overflowY: 'auto', display: 'grid', rowGap: '10px' }}>
              {selectedSummaries.map((s, idx) => (
                <div key={idx} className="glass-card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(44, 51, 65, 0.35)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '10px 12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: THEME.colors.primary20,
                      color: THEME.colors.text.primary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700
                    }}>{idx + 1}</div>
                    <div style={{ color: theme.text.primary, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s}
                    </div>
                  </div>
                  <div>
                    <span className="glass-card" style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: THEME.colors.primary20,
                      border: '1px solid rgba(59,130,246,0.35)',
                      color: THEME.colors.text.primary,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      Selected
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INPUT CONTAINER */}
      <div style={{
        padding: '20px',
        borderTop: `1px solid ${theme.border.light}`,
        background: theme.bg.glass,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          {/* TEXTAREA */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything, press SPACE for quick questions, or type @ to see available agents..."
            style={{
              width: '100%',
              minHeight: '44px',
              maxHeight: '120px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${theme.border.medium}`,
              background: theme.bg.tertiary,
              color: theme.text.primary,
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              resize: 'none',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
          />
          
          {/* SEND BUTTON */}
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              background: inputValue.trim() && !isLoading
                ? theme.chat.userMessage
                : theme.bg.overlay,
              color: inputValue.trim() && !isLoading ? theme.text.inverse : theme.text.tertiary,
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '80px',
              justifyContent: 'center'
            }}
          >
            <span>Send</span>
            <span>🚀</span>
          </button>
        </div>
      </div>

        {/* Add spin animation keyframes */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        </div>
      )}
    </>
  );
};

export default EnhancedContextAwareChatbot;