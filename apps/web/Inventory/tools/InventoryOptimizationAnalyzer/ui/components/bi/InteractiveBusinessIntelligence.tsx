import React, { useState, useEffect } from 'react';

interface Question {
  id: string;
  question: string;
  category: 'risk' | 'action' | 'impact' | 'strategy' | 'timeline';
  options: Option[];
  icon: string;
}

interface Option {
  id: string;
  label: string;
  value: any;
  color?: string;
  icon?: string;
}

interface Conversation {
  questionId: string;
  question: string;
  userAnswer: string;
  aiResponse: string;
  timestamp: Date;
  category: string;
}

interface InteractiveBusinessIntelligenceProps {
  onClose: () => void;
  dashboardData?: any;
}

export default function InteractiveBusinessIntelligence({ onClose, dashboardData }: InteractiveBusinessIntelligenceProps) {
  // Extract metrics from dashboard data
  const kpis = dashboardData?.data?.kpis || {};
  const stockoutRisk = kpis.stockoutRisk?.value || 0;
  const inventoryValue = kpis.totalValue?.value || 0;
  const healthScore = kpis.inventoryHealth?.value || 0;
  const slowMoving = kpis.slowMoving?.value || 0;
  const savingsOpportunity = kpis.savingsOpportunity?.value || 0;
  
  // State management
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    riskTolerance?: string;
    actionPreference?: string;
    timeline?: string;
    budget?: string;
  }>({});
  
  // Question Bank for Inventory
  const questions: Question[] = [
    {
      id: 'stockout-concern',
      question: `You have ${stockoutRisk} items at stockout risk ($${(stockoutRisk * 15000/1000).toFixed(0)}K revenue impact). How concerned are you?`,
      category: 'risk',
      icon: '🚨',
      options: [
        { id: 'critical', label: 'Critical - Need immediate action', value: 'critical', color: '#ef4444', icon: '🔴' },
        { id: 'high', label: 'High - Act within days', value: 'high', color: '#f59e0b', icon: '🟠' },
        { id: 'moderate', label: 'Moderate - Plan this week', value: 'moderate', color: '#3b82f6', icon: '🟡' },
        { id: 'low', label: 'Low - Monitor situation', value: 'low', color: '#10b981', icon: '🟢' }
      ]
    },
    {
      id: 'optimization-strategy',
      question: `With $${(inventoryValue/1000).toFixed(0)}K tied up in inventory, what optimization appeals most?`,
      category: 'strategy',
      icon: '💡',
      options: [
        { id: 'reduce', label: 'Reduce Excess Stock', value: 'reduce', color: '#8b5cf6', icon: '📉' },
        { id: 'turnover', label: 'Increase Turnover', value: 'turnover', color: '#3b82f6', icon: '🔄' },
        { id: 'automate', label: 'Automate Reordering', value: 'automate', color: '#f59e0b', icon: '🤖' },
        { id: 'consolidate', label: 'Consolidate Warehouses', value: 'consolidate', color: '#10b981', icon: '🏭' }
      ]
    },
    {
      id: 'investment-budget',
      question: 'What can you invest in inventory optimization?',
      category: 'action',
      icon: '💰',
      options: [
        { id: 'high', label: '$100K+ (Transform)', value: 100000, color: '#10b981', icon: '🚀' },
        { id: 'medium', label: '$50-100K (Optimize)', value: 75000, color: '#3b82f6', icon: '⚡' },
        { id: 'low', label: '$25-50K (Improve)', value: 35000, color: '#f59e0b', icon: '📊' },
        { id: 'minimal', label: '<$25K (Quick wins)', value: 15000, color: '#94a3b8', icon: '🎯' }
      ]
    },
    {
      id: 'implementation-timeline',
      question: 'When do you need to see inventory improvements?',
      category: 'timeline',
      icon: '⏰',
      options: [
        { id: 'immediate', label: 'This Week', value: 7, color: '#ef4444', icon: '🏃' },
        { id: 'month', label: 'This Month', value: 30, color: '#f59e0b', icon: '📅' },
        { id: 'quarter', label: 'This Quarter', value: 90, color: '#3b82f6', icon: '📈' },
        { id: 'year', label: 'This Year', value: 365, color: '#10b981', icon: '🎯' }
      ]
    },
    {
      id: 'biggest-pain',
      question: 'What inventory issue causes the most pain?',
      category: 'impact',
      icon: '😰',
      options: [
        { id: 'stockouts', label: 'Stockouts', value: 'stockouts', color: '#ef4444', icon: '❌' },
        { id: 'excess', label: 'Excess Inventory', value: 'excess', color: '#8b5cf6', icon: '📦' },
        { id: 'costs', label: 'High Holding Costs', value: 'costs', color: '#f59e0b', icon: '💸' },
        { id: 'visibility', label: 'Poor Visibility', value: 'visibility', color: '#3b82f6', icon: '🔍' }
      ]
    }
  ];

  // Initialize with first question
  useEffect(() => {
    if (!currentQuestion && conversations.length === 0) {
      setCurrentQuestion(questions[0]);
    }
  }, []);

  // Generate AI Response based on answer
  const generateAIResponse = (question: Question, answer: Option): string => {
    const questionId = question.id;
    
    switch (questionId) {
      case 'stockout-concern':
        if (answer.value === 'critical') {
          return `🔴 **CRITICAL STOCKOUT ALERT**\n\nWith ${stockoutRisk} items at immediate risk, you're facing:\n• Revenue loss: $${(stockoutRisk * 15000/1000).toFixed(0)}K\n• Customer satisfaction: -${stockoutRisk * 3} negative experiences\n• Market share risk: Competitors ready to pounce\n\n**EMERGENCY ACTION PLAN:**\n\n**Next 24 Hours:**\n1. Expedite orders for top 10 critical SKUs\n2. Transfer stock from overflow warehouses\n3. Contact suppliers for rush delivery\n\n**Next 48 Hours:**\n• Implement safety stock buffers\n• Review all reorder points\n• Set up automated alerts\n\n**Success Rate:** 85% stockout prevention possible\n\nReady to execute emergency protocol?`;
        } else if (answer.value === 'high') {
          return `🟠 **HIGH PRIORITY RESPONSE**\n\nYour ${stockoutRisk} at-risk items need attention within 72 hours.\n\n**Risk Assessment:**\n• Potential revenue impact: $${(stockoutRisk * 15000/1000).toFixed(0)}K\n• Lead time window: 3-5 days\n• Recovery probability: 70%\n\n**Action Framework:**\n• Priority 1: Top revenue-generating SKUs\n• Priority 2: High-velocity items\n• Priority 3: Customer-critical products\n\n**Quick Wins Available:**\n• Adjust reorder points (+15% buffer)\n• Negotiate supplier expedites\n• Implement cross-docking for urgents\n\nWhat's your optimization strategy?`;
        } else if (answer.value === 'moderate') {
          return `🟡 **MANAGED RISK APPROACH**\n\nWith ${stockoutRisk} items flagged, you have a week to optimize.\n\n**Strategic Options:**\n• Implement predictive reordering\n• Optimize safety stock levels\n• Improve demand forecasting\n\n**Expected Outcomes:**\n• Reduce stockouts by 60%\n• Maintain service levels at 95%+\n• Free up $${(inventoryValue * 0.1 / 1000).toFixed(0)}K working capital\n\nShall we explore optimization strategies?`;
        } else {
          return `🟢 **PROACTIVE MONITORING**\n\nYour ${stockoutRisk} at-risk items are manageable.\n\n**Monitoring Dashboard:**\n• Daily stock level reviews\n• Weekly reorder point analysis\n• Monthly supplier performance\n\n**Continuous Improvement:**\n• Implement ABC analysis\n• Optimize EOQ calculations\n• Enhance forecast accuracy\n\nFocus on long-term optimization?`;
        }

      case 'optimization-strategy':
        if (answer.value === 'reduce') {
          return `📉 **EXCESS REDUCTION STRATEGY**\n\nWith $${(inventoryValue/1000).toFixed(0)}K in inventory, let's free up capital:\n\n**Reduction Targets:**\n• Slow-moving items: ${slowMoving}% of inventory\n• Potential reduction: $${(inventoryValue * slowMoving / 100 / 1000).toFixed(0)}K\n• Cash liberation: Within 30 days\n\n**Action Plan:**\n1. **Week 1:** Identify bottom 20% performers\n2. **Week 2:** Launch clearance campaigns\n3. **Week 3:** Negotiate returns with suppliers\n4. **Week 4:** Implement just-in-time for C-items\n\n**Expected Results:**\n• Free up 25% of warehouse space\n• Reduce holding costs by $${(inventoryValue * 0.02 / 1000).toFixed(0)}K/month\n• Improve inventory health to ${Math.min(95, healthScore + 15)}%\n\nWhat's your investment capacity?`;
        } else if (answer.value === 'turnover') {
          return `🔄 **TURNOVER ACCELERATION**\n\nCurrent inventory value: $${(inventoryValue/1000).toFixed(0)}K\nTarget: Increase turns by 40%\n\n**Velocity Strategy:**\n• Reduce order quantities by 30%\n• Increase order frequency by 50%\n• Implement cross-docking for A-items\n\n**Benefits:**\n• Working capital reduction: $${(inventoryValue * 0.3 / 1000).toFixed(0)}K\n• Freshness improvement: 85%\n• Obsolescence risk: -60%\n\n**Implementation:**\n• Week 1-2: Analyze velocity patterns\n• Week 3-4: Adjust ordering parameters\n• Month 2: Full rollout\n\nReady to accelerate?`;
        } else if (answer.value === 'automate') {
          return `🤖 **AUTOMATION BLUEPRINT**\n\nTransform your $${(inventoryValue/1000).toFixed(0)}K inventory with AI:\n\n**Automation Components:**\n1. **Predictive Reordering**\n   • ML-based demand forecasting\n   • Auto-purchase order generation\n   • Dynamic safety stock adjustment\n\n2. **Smart Allocation**\n   • Multi-warehouse optimization\n   • Automated transfers\n   • Load balancing\n\n**ROI Projection:**\n• Stockout reduction: 75%\n• Manual effort: -80%\n• Accuracy improvement: 95%\n\n**Investment Required:** $50-75K\n**Payback Period:** 6 months\n\nWhat's your timeline?`;
        } else {
          return `🏭 **WAREHOUSE CONSOLIDATION**\n\nOptimize your $${(inventoryValue/1000).toFixed(0)}K across facilities:\n\n**Consolidation Benefits:**\n• Reduce warehouses from 5 to 3\n• Save $${(inventoryValue * 0.05 / 1000).toFixed(0)}K/month in costs\n• Improve visibility and control\n\n**Migration Plan:**\n• Month 1: Analyze location performance\n• Month 2: Design new network\n• Month 3: Execute transfers\n\n**Risk Mitigation:**\n• Maintain regional coverage\n• Ensure redundancy\n• Preserve service levels\n\nReady to optimize footprint?`;
        }

      case 'investment-budget':
        const budget = answer.value as number;
        const roi = budget * 4.2; // 420% ROI
        return `💰 **INVESTMENT ALLOCATION**\n\n**Your $${(budget/1000).toFixed(0)}K Optimization Plan:**\n\n**Strategic Allocation:**\n• Technology/Software: $${(budget * 0.4 / 1000).toFixed(0)}K (40%)\n• Process improvement: $${(budget * 0.25 / 1000).toFixed(0)}K (25%)\n• Training & change mgmt: $${(budget * 0.2 / 1000).toFixed(0)}K (20%)\n• Quick wins/testing: $${(budget * 0.15 / 1000).toFixed(0)}K (15%)\n\n**Expected Returns:**\n• ROI: $${(roi/1000).toFixed(0)}K (420% return)\n• Payback period: ${budget >= 75000 ? '4' : '6'} months\n• Inventory reduction: ${Math.floor(budget / 3000)}%\n• Stockout improvement: ${Math.min(85, 50 + budget/2000)}%\n\n**Success Factors:**\n${budget >= 75000 ? '✅ Full transformation possible' : budget >= 35000 ? '⚡ Significant improvements achievable' : '🎯 Focus on highest-impact areas'}\n\nWhen do you need results?`;

      case 'implementation-timeline':
        const days = answer.value as number;
        if (days <= 7) {
          return `🏃 **7-DAY SPRINT PLAN**\n\n**IMMEDIATE ACTIONS:**\n\n**Day 1-2: Crisis Response**\n• Identify critical stockouts\n• Expedite urgent orders\n• Reallocate inventory\n\n**Day 3-4: Quick Wins**\n• Adjust reorder points (+20%)\n• Clear slow-moving stock\n• Negotiate rush deliveries\n\n**Day 5-7: Stabilization**\n• Implement daily monitoring\n• Set automated alerts\n• Document processes\n\n**Results Expected:**\n• Stockout prevention: 70%\n• Cost savings: $${(savingsOpportunity * 0.1 / 1000).toFixed(0)}K\n• Health score: +5 points\n\nReady to sprint?`;
        } else if (days <= 30) {
          return `📅 **30-DAY TRANSFORMATION**\n\n**Week 1: Assessment**\n• Complete inventory audit\n• Identify optimization opportunities\n• Build action plan\n\n**Week 2-3: Implementation**\n• Optimize reorder points\n• Launch clearance initiatives\n• Implement new processes\n\n**Week 4: Optimization**\n• Fine-tune parameters\n• Measure results\n• Scale successes\n\n**Target Achievements:**\n• Inventory health: ${Math.min(95, healthScore + 20)}%\n• Cost reduction: $${(savingsOpportunity * 0.5 / 1000).toFixed(0)}K\n• Stockout risk: -50%\n\nWhat's your biggest pain point?`;
        } else if (days <= 90) {
          return `📈 **QUARTERLY EXCELLENCE PROGRAM**\n\n**Month 1: Foundation**\n• Deep analytics and insights\n• Process documentation\n• Team training\n\n**Month 2: Execution**\n• Technology implementation\n• Process optimization\n• Supplier collaboration\n\n**Month 3: Excellence**\n• Automation deployment\n• Continuous improvement\n• Performance optimization\n\n**90-Day Targets:**\n• Inventory turns: +40%\n• Working capital: -30%\n• Service level: 98%\n• ROI: 300%+\n\nWhat's causing the most pain?`;
        } else {
          return `🎯 **ANNUAL STRATEGIC PROGRAM**\n\n**Year-Long Transformation:**\n\n**Q1:** Foundation & Quick Wins\n**Q2:** Technology Implementation\n**Q3:** Process Excellence\n**Q4:** Continuous Optimization\n\n**Year-End Vision:**\n• World-class inventory management\n• AI-driven optimization\n• 99% service levels\n• Industry benchmark performance\n\n**Investment Impact:**\n• Total savings: $${(savingsOpportunity * 2 / 1000).toFixed(0)}K+\n• Efficiency gain: 50%+\n• Competitive advantage secured\n\nWhat challenges you most?`;
        }

      case 'biggest-pain':
        if (answer.value === 'stockouts') {
          return `❌ **STOCKOUT ELIMINATION PROGRAM**\n\n**Root Cause Analysis:**\n• Poor demand forecasting (40%)\n• Inadequate safety stock (30%)\n• Supplier delays (20%)\n• Process gaps (10%)\n\n**Solution Framework:**\n\n1. **Predictive Analytics**\n   • AI demand forecasting\n   • Seasonal adjustments\n   • Trend detection\n\n2. **Safety Stock Optimization**\n   • Service level targeting\n   • ABC stratification\n   • Dynamic buffers\n\n3. **Supplier Management**\n   • Performance scorecards\n   • Backup suppliers\n   • VMI programs\n\n**Expected Results:**\n• Stockout reduction: 85%\n• Service level: 98%+\n• Customer satisfaction: +25 NPS\n\n✅ Ready to eliminate stockouts permanently?`;
        } else if (answer.value === 'excess') {
          return `📦 **EXCESS INVENTORY LIQUIDATION**\n\n**Current Situation:**\n• Slow-moving: ${slowMoving}% of inventory\n• Capital tied up: $${(inventoryValue * slowMoving / 100 / 1000).toFixed(0)}K\n• Holding cost burden: $${(inventoryValue * slowMoving * 0.002 / 1000).toFixed(0)}K/month\n\n**Liquidation Strategy:**\n\n**Month 1:** Identification\n• Age analysis\n• Velocity segmentation\n• Obsolescence risk\n\n**Month 2:** Action\n• Clearance sales (30-50% off)\n• Bundle deals\n• B2B liquidation\n• Supplier returns\n\n**Month 3:** Prevention\n• Improved forecasting\n• Smaller order quantities\n• Vendor managed inventory\n\n**Recovery Potential:** $${(inventoryValue * slowMoving * 0.6 / 100 / 1000).toFixed(0)}K\n\nReady to free up capital?`;
        } else if (answer.value === 'costs') {
          return `💸 **HOLDING COST REDUCTION**\n\n**Cost Breakdown:**\n• Warehouse space: 35%\n• Capital cost: 25%\n• Handling: 20%\n• Obsolescence: 15%\n• Insurance: 5%\n\n**Reduction Strategies:**\n\n1. **Space Optimization**\n   • Vertical storage\n   • Cross-docking\n   • Drop-shipping\n\n2. **Capital Efficiency**\n   • JIT delivery\n   • Consignment inventory\n   • Payment terms\n\n3. **Process Improvement**\n   • Automation\n   • Batch picking\n   • Zone optimization\n\n**Savings Potential:**\n• Monthly: $${(inventoryValue * 0.015 / 1000).toFixed(0)}K\n• Annual: $${(inventoryValue * 0.18 / 1000).toFixed(0)}K\n• ROI: 250%\n\nReady to slash costs?`;
        } else {
          return `🔍 **VISIBILITY ENHANCEMENT**\n\n**Current Blind Spots:**\n• Real-time stock levels\n• Multi-location inventory\n• In-transit goods\n• Supplier inventory\n\n**Visibility Solution:**\n\n**Technology Stack:**\n• Real-time WMS\n• IoT sensors\n• Track & trace\n• Analytics dashboard\n\n**Benefits:**\n• Decision speed: 10x faster\n• Accuracy: 99.5%\n• Exception handling: Automated\n• Forecasting: +40% accuracy\n\n**Implementation:**\n• Week 1-2: System selection\n• Week 3-4: Integration\n• Month 2: Training\n• Month 3: Go-live\n\n**ROI:** 6-month payback\n\nReady for complete visibility?`;
        }

      default:
        return "Let me analyze this further and provide specific recommendations.";
    }
  };

  // Handle user selection
  const handleAnswer = async (option: Option) => {
    if (!currentQuestion) return;
    
    setIsThinking(true);
    
    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate response
    const aiResponse = generateAIResponse(currentQuestion, option);
    
    // Save conversation
    const newConversation: Conversation = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      userAnswer: option.label,
      aiResponse: aiResponse,
      timestamp: new Date(),
      category: currentQuestion.category
    };
    
    setConversations([...conversations, newConversation]);
    
    // Update user profile
    setUserProfile({
      ...userProfile,
      [currentQuestion.category]: option.value
    });
    
    // Move to next question or show summary
    const currentIndex = questions.findIndex(q => q.id === currentQuestion.id);
    if (currentIndex < questions.length - 1) {
      setCurrentQuestion(questions[currentIndex + 1]);
    } else {
      setShowSummary(true);
      setCurrentQuestion(null);
    }
    
    setIsThinking(false);
  };

  // Generate Executive Summary
  const generateExecutiveSummary = () => {
    const totalValue = inventoryValue;
    const riskValue = stockoutRisk * 15000;
    const optimization = savingsOpportunity;
    
    return `📊 **EXECUTIVE SUMMARY**\n
**Inventory Status:**
• Total Value: $${(totalValue/1000).toFixed(0)}K
• Health Score: ${healthScore}%
• Items at Risk: ${stockoutRisk}
• Optimization Potential: $${(optimization/1000).toFixed(0)}K

**Your Profile:**
• Risk Tolerance: ${userProfile.riskTolerance || 'Moderate'}
• Strategy: ${userProfile.actionPreference || 'Balanced'}
• Timeline: ${userProfile.timeline || 'Flexible'}
• Budget: ${userProfile.budget ? `$${(userProfile.budget/1000).toFixed(0)}K` : 'TBD'}

**Recommended Actions:**
1. Immediate: Address ${stockoutRisk} stockout risks
2. Week 1: Implement quick wins (20% improvement)
3. Month 1: Deploy optimization strategy
4. Quarter: Achieve ${Math.min(95, healthScore + 25)}% health score

**Expected ROI:** 350% within 6 months

🎯 Ready to transform your inventory management?`;
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      right: '30px',
      width: '450px',
      height: '650px',
      background: 'linear-gradient(135deg, #1e2738 0%, #1a2332 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(0, 224, 255, 0.3)',
      boxShadow: '0 25px 70px rgba(0, 0, 0, 0.6)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 998,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid rgba(0, 224, 255, 0.2)',
        background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.1) 0%, rgba(0, 224, 255, 0.05) 100%)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 700,
              color: '#00e0ff',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🧠 Inventory Intelligence Q&A
            </h2>
            <p style={{
              margin: '8px 0 0 0',
              color: 'rgba(247, 249, 251, 0.7)',
              fontSize: '14px'
            }}>
              Let me understand your inventory needs
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#f7f9fb',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Conversations */}
        {conversations.map((conv, idx) => (
          <div key={idx} style={{
            background: 'rgba(10, 18, 36, 0.5)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(0, 224, 255, 0.1)'
          }}>
            <div style={{
              fontSize: '14px',
              color: 'rgba(247, 249, 251, 0.7)',
              marginBottom: '8px'
            }}>
              Q: {conv.question}
            </div>
            <div style={{
              fontSize: '15px',
              color: '#00e0ff',
              fontWeight: 600,
              marginBottom: '12px'
            }}>
              Your answer: {conv.userAnswer}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#f7f9fb',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {conv.aiResponse}
            </div>
          </div>
        ))}

        {/* Current Question */}
        {currentQuestion && !showSummary && (
          <div style={{
            background: 'rgba(0, 224, 255, 0.05)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(0, 224, 255, 0.2)'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#f7f9fb',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>{currentQuestion.icon}</span>
              {currentQuestion.question}
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              {currentQuestion.options.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option)}
                  disabled={isThinking}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1px solid ${option.color || 'rgba(0, 224, 255, 0.3)'}`,
                    background: 'rgba(10, 18, 36, 0.8)',
                    color: '#f7f9fb',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isThinking ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isThinking ? 0.5 : 1
                  }}
                  onMouseEnter={e => {
                    if (!isThinking) {
                      e.currentTarget.style.background = `${option.color}20`;
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(10, 18, 36, 0.8)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Thinking indicator */}
        {isThinking && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(247, 249, 251, 0.7)',
            fontSize: '14px'
          }}>
            <div>🤔 Analyzing your response...</div>
          </div>
        )}

        {/* Summary */}
        {showSummary && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.1) 0%, rgba(0, 224, 255, 0.05) 100%)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(0, 224, 255, 0.3)'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#f7f9fb',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {generateExecutiveSummary()}
            </div>
            <button
              onClick={() => {
                setShowSummary(false);
                setCurrentQuestion(questions[0]);
                setConversations([]);
              }}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00e0ff, #00b8d4)',
                color: '#0a1224',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Start Over
            </button>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid rgba(0, 224, 255, 0.1)',
        background: 'rgba(10, 18, 36, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center'
        }}>
          {questions.map((q, idx) => (
            <div
              key={q.id}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: conversations.length > idx 
                  ? '#00e0ff' 
                  : conversations.length === idx 
                    ? 'rgba(0, 224, 255, 0.5)' 
                    : 'rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}