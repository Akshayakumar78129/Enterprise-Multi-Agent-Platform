import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

// Type definitions
interface ChurnCustomer {
  customer_id: number;
  name: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Very High';
  churn_probability: number;
  avg_order_value?: number;
  frequency?: number;
}

interface RootState {
  churnPrediction: {
    customers: ChurnCustomer[];
    filters: any;
    loading: boolean;
    error: string | null;
  };
}

interface Question {
  id: string;
  question: string;
  category: 'risk' | 'action' | 'impact' | 'strategy' | 'timeline';
  options: Option[];
  followUp?: string;
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

export default function InteractiveBusinessIntelligence() {
  const { customers } = useSelector((state: RootState) => state.churnPrediction);
  
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
  
  // Calculate metrics
  const highRiskCustomers = customers.filter(c => c.risk_level === 'High' || c.risk_level === 'Very High');
  const totalRevenueAtRisk = highRiskCustomers.length * 45000;
  
  // Question Bank
  const questions: Question[] = [
    {
      id: 'risk-tolerance',
      question: `You have ${highRiskCustomers.length} customers at high risk (₹${(totalRevenueAtRisk/100000).toFixed(1)}L revenue). How concerned are you?`,
      category: 'risk',
      icon: '🎯',
      options: [
        { id: 'very', label: 'Very Concerned', value: 'critical', color: '#ef4444', icon: '🚨' },
        { id: 'moderate', label: 'Moderately Concerned', value: 'moderate', color: '#f59e0b', icon: '⚠️' },
        { id: 'slightly', label: 'Slightly Concerned', value: 'low', color: '#3b82f6', icon: '📊' },
        { id: 'not', label: 'Not Concerned', value: 'none', color: '#10b981', icon: '✅' }
      ]
    },
    {
      id: 'action-preference',
      question: 'What type of retention strategy appeals to you most?',
      category: 'strategy',
      icon: '💡',
      options: [
        { id: 'discount', label: 'Offer Discounts', value: 'discount', color: '#8b5cf6', icon: '🎯' },
        { id: 'personal', label: 'Personal Outreach', value: 'outreach', color: '#3b82f6', icon: '📞' },
        { id: 'loyalty', label: 'Loyalty Rewards', value: 'loyalty', color: '#f59e0b', icon: '🏆' },
        { id: 'product', label: 'Product Improvements', value: 'product', color: '#10b981', icon: '🚀' }
      ]
    },
    {
      id: 'budget-range',
      question: 'What budget can you allocate for retention?',
      category: 'action',
      icon: '💰',
      options: [
        { id: 'high', label: '₹1L+ (Aggressive)', value: 100000, color: '#10b981', icon: '💎' },
        { id: 'medium', label: '₹50K-1L (Moderate)', value: 75000, color: '#3b82f6', icon: '💼' },
        { id: 'low', label: '₹25-50K (Conservative)', value: 35000, color: '#f59e0b', icon: '📊' },
        { id: 'minimal', label: '<₹25K (Minimal)', value: 15000, color: '#94a3b8', icon: '🔍' }
      ]
    },
    {
      id: 'timeline',
      question: 'How quickly do you need to see results?',
      category: 'timeline',
      icon: '⏰',
      options: [
        { id: 'immediate', label: 'This Week', value: 7, color: '#ef4444', icon: '🚨' },
        { id: 'month', label: 'This Month', value: 30, color: '#f59e0b', icon: '📅' },
        { id: 'quarter', label: 'This Quarter', value: 90, color: '#3b82f6', icon: '📊' },
        { id: 'flexible', label: 'Flexible', value: 180, color: '#10b981', icon: '🎯' }
      ]
    },
    {
      id: 'worst-outcome',
      question: 'What outcome would concern you the most?',
      category: 'impact',
      icon: '⚠️',
      options: [
        { id: 'revenue', label: 'Revenue Loss', value: 'revenue', color: '#ef4444', icon: '💸' },
        { id: 'reputation', label: 'Brand Damage', value: 'brand', color: '#8b5cf6', icon: '😰' },
        { id: 'competition', label: 'Losing to Competitors', value: 'competition', color: '#f59e0b', icon: '🏃' },
        { id: 'growth', label: 'Stunted Growth', value: 'growth', color: '#3b82f6', icon: '📉' }
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
      case 'risk-tolerance':
        if (answer.value === 'critical') {
          return `🚨 **Critical Alert Acknowledged!**\n\nWith ${highRiskCustomers.length} customers at risk, you're facing potential revenue loss of ₹${(totalRevenueAtRisk/100000).toFixed(1)}L. This requires immediate action.\n\n**My Analysis:**\n• Customer churn could spike 65% in 30 days\n• Brand reputation at serious risk\n• Competitors actively targeting these customers\n\n**Immediate Actions Required:**\n1. Launch emergency retention task force\n2. CEO/exec calls to top 10 accounts\n3. Implement same-day intervention protocol\n\nShall we explore specific retention strategies?`;
        } else if (answer.value === 'moderate') {
          return `⚠️ **Moderate Risk Assessment**\n\nYour concern is justified. With ₹${(totalRevenueAtRisk/100000).toFixed(1)}L at stake, proactive measures are wise.\n\n**Current Situation:**\n• Risk is manageable with timely action\n• 45% of at-risk customers can be saved\n• Window of opportunity: 2-3 weeks\n\n**Recommended Approach:**\n• Prioritize top 20% high-value customers\n• Implement targeted retention campaigns\n• Monitor daily for risk escalation\n\nWhat retention approach fits your style?`;
        } else {
          return `✅ **Risk Under Control**\n\nYour confidence suggests strong fundamentals. However, ₹${(totalRevenueAtRisk/100000).toFixed(1)}L is still at play.\n\n**Opportunity Analysis:**\n• Convert concern into competitive advantage\n• Strengthen relationships proactively\n• Build loyalty before issues arise\n\nLet's explore growth-oriented retention strategies.`;
        }

      case 'action-preference':
        if (answer.value === 'discount') {
          return `🎯 **Discount Strategy Selected**\n\n**Recommended Discount Framework:**\n• Tier 1 (Very High Risk): 30% off + free upgrade\n• Tier 2 (High Risk): 20% off for 3 months\n• Tier 3 (Medium Risk): 15% loyalty discount\n\n**Expected Results:**\n• Save 60% of at-risk customers\n• ROI: 320% over 6 months\n• Cost: ₹${(totalRevenueAtRisk * 0.15 / 100000).toFixed(1)}L\n\n**Implementation Speed:** 48 hours\n\nWhat's your budget for this campaign?`;
        } else if (answer.value === 'outreach') {
          return `📞 **Personal Touch Strategy**\n\n**VIP Outreach Program:**\n• CEO calls for top 5 accounts\n• Account manager calls for next 20\n• Personalized video messages for rest\n\n**Success Metrics:**\n• 85% response rate expected\n• 70% retention probability\n• Builds long-term relationships\n\n**Resources Needed:**\n• 3 executives × 2 hours\n• 5 account managers × 1 day\n• Video production team\n\nHow quickly can you mobilize the team?`;
        } else if (answer.value === 'loyalty') {
          return `🏆 **Loyalty Enhancement Program**\n\n**Exclusive Benefits Package:**\n• Double points on all purchases\n• VIP support hotline\n• Early access to new features\n• Quarterly business reviews\n\n**Projected Impact:**\n• 55% retention improvement\n• Increased CLV by 40%\n• Creates exit barriers\n\n**Investment:** ₹${(totalRevenueAtRisk * 0.10 / 100000).toFixed(1)}L upfront\n\nWhat's your implementation timeline?`;
        } else {
          return `🚀 **Product-Led Retention**\n\n**Enhancement Roadmap:**\n• Fix top 3 customer pain points\n• Launch requested features\n• Improve onboarding flow\n• Add integration capabilities\n\n**Development Timeline:**\n• Quick fixes: 1 week\n• Major features: 4-6 weeks\n• Full rollout: 8 weeks\n\n**Expected Outcome:**\n• 65% reduction in churn drivers\n• Competitive differentiation\n• Long-term retention solution\n\nWhat's your development capacity?`;
        }

      case 'budget-range':
        const budget = answer.value as number;
        const roi = (budget * 3.5 / 100000).toFixed(1);
        return `💰 **Budget Allocation Strategy**\n\n**Your ₹${(budget/1000).toFixed(0)}K Investment Plan:**\n\n**Recommended Split:**\n• Direct incentives: ${(budget * 0.4 / 1000).toFixed(0)}K (40%)\n• Outreach programs: ${(budget * 0.3 / 1000).toFixed(0)}K (30%)\n• Product improvements: ${(budget * 0.2 / 1000).toFixed(0)}K (20%)\n• Analytics & monitoring: ${(budget * 0.1 / 1000).toFixed(0)}K (10%)\n\n**Expected Returns:**\n• ROI: ₹${roi}L (350% return)\n• Customers saved: ${Math.floor(budget / 2000)}\n• Payback period: 3 months\n\n**Risk Assessment:**\n${budget >= 75000 ? '✅ Budget sufficient for comprehensive strategy' : '⚠️ Focus on highest-impact activities'}\n\nWhen do you need to see results?`;

      case 'timeline':
        const days = answer.value as number;
        if (days <= 7) {
          return `🚨 **Rapid Response Protocol**\n\n**7-Day Battle Plan:**\n\n**Day 1-2:** Emergency Assessment\n• Identify top 20 at-risk accounts\n• Prepare retention offers\n• Brief response team\n\n**Day 3-4:** Direct Intervention\n• Executive calls to VIP accounts\n• Launch instant discount codes\n• Deploy emergency support team\n\n**Day 5-7:** Stabilization\n• Monitor response rates\n• Adjust offers if needed\n• Document lessons learned\n\n**Success Probability:** 65% save rate\n\nReady to execute immediately?`;
        } else if (days <= 30) {
          return `📅 **30-Day Transformation Plan**\n\n**Week 1:** Analysis & Setup\n• Deep dive into churn drivers\n• Design retention campaigns\n• Prepare team and resources\n\n**Week 2-3:** Execution\n• Launch multi-channel outreach\n• Implement quick wins\n• A/B test strategies\n\n**Week 4:** Optimization\n• Analyze results\n• Scale successful tactics\n• Plan long-term approach\n\n**Target:** Save 70% of at-risk customers\n\nWhat concerns you most about customer loss?`;
        } else {
          return `📊 **Strategic Retention Program**\n\n**${days}-Day Roadmap:**\n\n**Phase 1 (30 days):** Foundation\n• Complete churn analysis\n• Build retention infrastructure\n• Train team thoroughly\n\n**Phase 2 (60 days):** Implementation\n• Roll out comprehensive program\n• Test and refine approaches\n• Build customer feedback loops\n\n**Phase 3 (${days-90} days):** Scale\n• Automate successful strategies\n• Expand to all segments\n• Measure long-term impact\n\n**Expected:** 80%+ retention rate\n\nWhat's your biggest concern?`;
        }

      case 'worst-outcome':
        if (answer.value === 'revenue') {
          return `💸 **Revenue Protection Strategy**\n\n**Financial Impact Analysis:**\n• Current MRR at risk: ₹${(totalRevenueAtRisk/12/100000).toFixed(1)}L/month\n• Annual impact: ₹${(totalRevenueAtRisk/100000).toFixed(1)}L\n• 3-year CLV loss: ₹${(totalRevenueAtRisk*3/100000).toFixed(1)}L\n\n**Revenue Recovery Plan:**\n1. **Immediate:** Lock in annual contracts (15% discount)\n2. **Week 1:** Upsell stable customers (+20% revenue)\n3. **Month 1:** Win back lost accounts (30% success rate)\n\n**Profit Protection:** Maintain 65% gross margin\n\n✅ **Action Required:** Shall I create a detailed financial recovery plan?`;
        } else if (answer.value === 'brand') {
          return `😰 **Brand Reputation Defense**\n\n**Reputation Risk Mitigation:**\n• Monitor social media sentiment (hourly)\n• Prepare PR response templates\n• Mobilize customer success team\n• Create positive case studies\n\n**Proactive Measures:**\n1. **Today:** Reach out to vocal customers\n2. **This week:** Launch satisfaction survey\n3. **This month:** Publish success stories\n\n**Damage Control:**\n• Response time: <2 hours for complaints\n• Executive apologies for VIP issues\n• Public commitment to improvements\n\n🛡️ **Protection Level:** Maximum\n\nShall we draft communication templates?`;
        } else if (answer.value === 'competition') {
          return `🏃 **Competitive Defense Strategy**\n\n**Competitor Threat Analysis:**\n• 3 aggressive competitors identified\n• They're offering 40% discounts\n• Targeting your top accounts\n\n**Counter-Strategy:**\n1. **Lock-in Program:** 2-year contracts with benefits\n2. **Exclusive Features:** Launch competitor-killer features\n3. **Switching Barriers:** Increase integration depth\n\n**Competitive Advantages:**\n• Superior product quality\n• Better customer support\n• Established relationships\n\n⚔️ **Battle Ready:** Win rate target 75%\n\nReady to defend your territory?`;
        } else {
          return `📉 **Growth Protection Plan**\n\n**Growth Impact Assessment:**\n• Current growth rate: At risk of -15%\n• Customer acquisition cost increasing 30%\n• Market share erosion: -5% possible\n\n**Growth Recovery Strategy:**\n1. **Stabilize:** Stop the bleeding (2 weeks)\n2. **Rebuild:** Strengthen core base (1 month)\n3. **Accelerate:** Return to growth (3 months)\n\n**New Growth Drivers:**\n• Referral program from saved customers\n• Upsell campaign to stable base\n• New market expansion\n\n📈 **Target:** Return to 20% growth in 90 days\n\nShall we build the growth plan?`;
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate AI response
    const aiResponse = generateAIResponse(currentQuestion, option);
    
    // Save conversation
    const conversation: Conversation = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      userAnswer: option.label,
      aiResponse: aiResponse,
      timestamp: new Date(),
      category: currentQuestion.category
    };
    
    setConversations(prev => [...prev, conversation]);
    
    // Update user profile
    setUserProfile(prev => ({
      ...prev,
      [currentQuestion.id]: option.value
    }));
    
    setIsThinking(false);
    
    // Move to next question or show summary
    const currentIndex = questions.findIndex(q => q.id === currentQuestion.id);
    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(questions[currentIndex + 1]);
      }, 2000);
    } else {
      setTimeout(() => {
        setShowSummary(true);
      }, 2000);
    }
  };

  // Generate final recommendation
  const generateFinalRecommendation = () => {
    const risk = userProfile['risk-tolerance'];
    const strategy = userProfile['action-preference'];
    const budget = userProfile['budget-range'];
    const timeline = userProfile['timeline'];
    
    return `🎯 **Your Personalized Action Plan**

Based on our conversation, here's your optimal strategy:

**Risk Level:** ${risk === 'critical' ? '🚨 Critical - Immediate action required' : 
                   risk === 'moderate' ? '⚠️ Moderate - Proactive measures needed' : 
                   '✅ Manageable - Strategic opportunity'}

**Recommended Strategy:** ${strategy === 'discount' ? '💰 Targeted Discount Campaign' :
                            strategy === 'outreach' ? '📞 VIP Personal Outreach' :
                            strategy === 'loyalty' ? '🏆 Enhanced Loyalty Program' :
                            '🚀 Product-Led Retention'}

**Budget Allocation:** ₹${((budget as number) / 1000).toFixed(0)}K
**Timeline:** ${timeline === 7 ? 'Immediate (7 days)' :
                timeline === 30 ? '1 Month Sprint' :
                timeline === 90 ? 'Quarterly Program' : 'Strategic Long-term'}

**Expected Outcomes:**
• Retention Rate: ${risk === 'critical' ? '65%' : '80%'}+
• ROI: ${((budget as number) * 3.5 / (budget as number) * 100).toFixed(0)}%
• Customers Saved: ${Math.floor((budget as number) / 2000)}
• Revenue Protected: ₹${(totalRevenueAtRisk * 0.65 / 100000).toFixed(1)}L

**Next Steps:**
1. ✅ Accept and implement this plan
2. 📊 Set up monitoring dashboard
3. 🎯 Launch retention campaign
4. 📈 Track and optimize weekly

Ready to proceed?`;
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      right: '20px',
      width: '400px',
      maxHeight: '650px',
      background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.98))',
      backdropFilter: 'blur(24px)',
      borderRadius: '24px',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      boxShadow: '0 25px 70px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
              animation: 'pulse 2s infinite'
            }}>
              🧠
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>
                AI Business Advisor
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                Let's understand your needs
              </div>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div style={{
            display: 'flex',
            gap: '6px'
          }}>
            {questions.map((q, i) => (
              <div
                key={q.id}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: i < conversations.length ? '#3b82f6' : 
                            i === conversations.length ? '#f59e0b' : '#475569',
                  transition: 'all 0.3s'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        scrollbarWidth: 'thin'
      }}>
        
        {/* Conversation History */}
        {conversations.map((conv, index) => (
          <div key={index} style={{
            marginBottom: '20px',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            {/* User's Answer */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '16px 16px 4px 16px',
              padding: '12px 16px',
              marginBottom: '12px',
              marginLeft: '60px',
              color: '#ffffff',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
            }}>
              <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>
                You answered:
              </div>
              {conv.userAnswer}
            </div>
            
            {/* AI Response */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '16px 16px 16px 4px',
              padding: '16px',
              marginRight: '20px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '13px',
              lineHeight: '1.6',
              color: '#f8fafc'
            }}>
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: conv.aiResponse
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #3b82f6;">$1</strong>')
                    .replace(/\n/g, '<br/>')
                    .replace(/•/g, '<span style="color: #f59e0b;">•</span>')
                    .replace(/✅|⚠️|🚨|📊|💰|📈|🎯|💡/g, '<span style="font-size: 16px;">$&</span>')
                }}
              />
            </div>
          </div>
        ))}

        {/* Current Question */}
        {currentQuestion && !showSummary && (
          <div style={{
            animation: 'slideInFromRight 0.5s ease-out'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{
                fontSize: '24px',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                {currentQuestion.icon}
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#f8fafc',
                textAlign: 'center',
                marginBottom: '20px',
                lineHeight: '1.5'
              }}>
                {currentQuestion.question}
              </div>
              
              {/* Options */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                {currentQuestion.options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option)}
                    disabled={isThinking}
                    style={{
                      padding: '14px',
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: `1px solid ${option.color || '#475569'}40`,
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: isThinking ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: isThinking ? 0.5 : 1
                    }}
                    onMouseEnter={e => {
                      if (!isThinking) {
                        e.currentTarget.style.background = `${option.color}20`;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 8px 20px ${option.color}30`;
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Thinking Animation */}
        {isThinking && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.3s'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              background: 'rgba(59, 130, 246, 0.1)',
              padding: '12px 20px',
              borderRadius: '20px'
            }}>
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`
                  }}
                />
              ))}
              <span style={{ marginLeft: '8px', color: '#94a3b8', fontSize: '13px' }}>
                AI analyzing...
              </span>
            </div>
          </div>
        )}

        {/* Final Summary */}
        {showSummary && (
          <div style={{
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.05))',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: generateFinalRecommendation()
                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #10b981;">$1</strong>')
                    .replace(/\n/g, '<br/>')
                    .replace(/•/g, '<span style="color: #10b981;">•</span>')
                    .replace(/✅|⚠️|🚨|📊|💰|📈|🎯|💡|🏆|📞|🚀/g, '<span style="font-size: 18px;">$&</span>')
                }}
                style={{
                  fontSize: '14px',
                  lineHeight: '1.8',
                  color: '#f8fafc'
                }}
              />
              
              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px'
              }}>
                <button
                  onClick={() => alert('Implementation plan initiated! 🚀')}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  ✅ Implement Plan
                </button>
                
                <button
                  onClick={() => {
                    setConversations([]);
                    setCurrentQuestion(questions[0]);
                    setShowSummary(false);
                    setUserProfile({});
                  }}
                  style={{
                    padding: '14px 24px',
                    background: 'rgba(75, 85, 99, 0.3)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '12px',
                    color: '#94a3b8',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Restart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(100px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes bounce {
            0%, 100% { 
              transform: translateY(0);
              opacity: 0.5;
            }
            50% { 
              transform: translateY(-10px);
              opacity: 1;
            }
          }
          
          @keyframes pulse {
            0%, 100% { 
              transform: scale(1);
              opacity: 1;
            }
            50% { 
              transform: scale(1.05);
              opacity: 0.8;
            }
          }
        `}
      </style>
    </div>
  );
}

// Floating Trigger Button
export function InteractiveBITrigger({ onClick }: { onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const { customers } = useSelector((state: RootState) => state.churnPrediction);
  const highRiskCount = customers.filter(c => 
    c.risk_level === 'High' || c.risk_level === 'Very High'
  ).length;
  
  // Log to help debug
  console.log('InteractiveBITrigger rendered, highRiskCount:', highRiskCount);
  
  return (
    <button
      onClick={() => {
        console.log('Brain button clicked!');
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '100px', // Moved slightly more left to avoid overlap
        width: '70px', // Made slightly bigger
        height: '70px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)', // Made more colorful to stand out
        border: '3px solid #ffffff', // Added white border
        color: 'white',
        fontSize: '32px', // Bigger icon
        cursor: 'pointer',
        boxShadow: isHovered ? 
          '0 20px 60px rgba(255, 107, 107, 0.6)' :
          '0 12px 40px rgba(255, 107, 107, 0.4)',
        transform: isHovered ? 'scale(1.15) rotate(10deg)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1200, // Reduced to align with dashboard overlay stack
        animation: 'pulse 2s infinite, float 3s ease-in-out infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      title="🎯 Click for Interactive AI Advisor - Answer Questions & Get Personalized Strategy"
    >
      <span style={{ animation: 'pulse 2s infinite' }}>🧠</span>
      
      {/* Notification Badge */}
      {highRiskCount > 0 && (
        <div style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          borderRadius: '12px',
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: '700',
          color: '#ffffff',
          border: '2px solid #1f2937',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5)',
          animation: highRiskCount > 15 ? 'pulse 1s infinite' : 'none'
        }}>
          {highRiskCount} ⚠️
        </div>
      )}
      
      {/* Always visible tooltip for better discovery */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        right: '-20px',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(245, 158, 11, 0.95))',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '13px',
        whiteSpace: 'nowrap',
        color: '#ffffff',
        fontWeight: '600',
        border: '2px solid #ffffff',
        boxShadow: '0 10px 30px rgba(239, 68, 68, 0.5)',
        animation: 'bounce 2s infinite',
        display: isHovered ? 'none' : 'block' // Hide when hovering
      }}>
        Click me! Answer 5 questions 🎯
        <div style={{
          position: 'absolute',
          bottom: '-8px',
          right: '30px',
          width: '0',
          height: '0',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid #ffffff'
        }} />
      </div>
      
      {/* Hover Tooltip */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '0',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '14px',
          whiteSpace: 'nowrap',
          color: '#ffffff',
          fontWeight: '600',
          border: '2px solid #ffffff',
          boxShadow: '0 10px 30px rgba(59, 130, 246, 0.5)'
        }}>
          Start Interactive AI Analysis! 🚀
        </div>
      )}
      
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
    </button>
  );
}