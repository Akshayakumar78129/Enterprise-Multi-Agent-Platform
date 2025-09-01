import React from 'react';
import UniversalChatbot from '../../../../../../ui-common/chatbot/UniversalChatbot';
import { AIResponseDashboard } from '../../../../../../ui-common/ai-interaction/aiResponse';

interface ChatbotIntegrationProps {
  onClose?: () => void;
}

export const ChatbotIntegration: React.FC<ChatbotIntegrationProps> = ({ onClose }) => {
  const handleAIResponse = async function* (query: string) {
    const lowerMessage = query.toLowerCase();
    
    if (lowerMessage.includes('high-risk') || lowerMessage.includes('priority')) {
      yield "🎯 **High-Risk Customers Identified:**\n\n**Immediate Action Required:**\n1. **TechCorp Industries** - $2.3M, 67 days overdue\n   - Recommended: Personal call + payment plan\n2. **Global Manufacturing** - $1.8M, 45 days overdue\n   - Recommended: Credit line review\n3. **Innovation Partners** - $950K, 52 days overdue\n   - Recommended: Escalation to legal\n\n**Suggested Actions:**\n📞 Schedule calls for this week\n📧 Send payment reminders\n📋 Prepare collection letters\n💼 Consider collection agency for 90+ days\n\nWould you like me to draft collection letters for these customers?";
    } else if (lowerMessage.includes('letter') || lowerMessage.includes('draft')) {
      yield "📝 **Collection Letter Generated:**\n\n**Subject: Immediate Payment Required - Account Past Due**\n\nDear [Customer Name],\n\nOur records indicate your account balance of $[Amount] is now [Days] days past due. We value your business relationship and want to resolve this matter promptly.\n\n**Payment Options:**\n- Online payment portal: [link]\n- Wire transfer details: [details]\n- Payment plan available upon request\n\nPlease contact us within 5 business days to discuss payment arrangements.\n\n**Template saved to your collection toolkit.**\nWould you like me to customize this for specific customers?";
    } else if (lowerMessage.includes('trend') || lowerMessage.includes('analysis')) {
      yield "📊 **AR Performance Analysis:**\n\n**Current Month Trends:**\n• DSO: 46.5 days (↑8% from last month)\n• Collection Rate: 73% (↓5% from target)\n• Past Due >30 days: $18.2M (↑12%)\n\n**Key Insights:**\n🔍 Payment velocity slowing in manufacturing sector\n📈 Small customers showing improved payment patterns\n⚠️ 3 major customers approaching credit limits\n\n**Recommended Focus Areas:**\n1. Review large customer payment terms\n2. Implement early intervention for 15-day invoices\n3. Consider discount incentives for fast payments\n\nWant me to drill down into any specific metric?";
    } else {
      yield `I'm your AR Collections Assistant! I can help you with:\n\n• Collection strategies and customer outreach\n• Customer risk analysis and prioritization\n• Payment trend analysis and insights\n• Dashboard navigation and guidance\n\n**Quick Actions:**\n- Show high-risk customers\n- Generate collection letters\n- Analyze payment trends\n- Create payment plans\n\nWhat specific area would you like to explore?`;
    }
  };

  return (
    <UniversalChatbot
      title="AR Collections Assistant"
      placeholder="Ask about collections, customer analysis, or AR strategies..."
      onClose={onClose}
      aiResponseGenerator={handleAIResponse}
      slashCommands={[
        { command: '/high-risk', description: 'Show high-risk customers' },
        { command: '/generate-letter', description: 'Generate collection letters' },
        { command: '/analyze-trends', description: 'Analyze payment trends' },
        { command: '/payment-plan', description: 'Create payment plans' },
        { command: '/customer-status', description: 'Update customer status' },
        { command: '/schedule-followup', description: 'Schedule follow-ups' }
      ]}
    />
  );
};

export default ChatbotIntegration;