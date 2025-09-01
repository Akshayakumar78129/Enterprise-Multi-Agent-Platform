import React, { useState, useRef, useEffect } from 'react';
import UniversalChatbot from '../../../../../../ui-common/chatbot/UniversalChatbot';
import { AIResponseDashboard } from '../../../../../../ui-common/ai-interaction/aiResponse';

interface ARIntelligenceAssistantProps {
  onClose?: () => void;
}

export const ARIntelligenceAssistant: React.FC<ARIntelligenceAssistantProps> = ({ onClose }) => {
  const handleAIResponse = async function* (query: string) {
    const lowerMessage = query.toLowerCase();
    
    if (lowerMessage.includes('customer') || lowerMessage.includes('analyze-customer')) {
      yield "I've analyzed the customer portfolio and identified key insights:\n\n**High Priority Customers:**\n- ABC Corp: $2.3M outstanding, 45 days past due, Risk Score: 85\n- XYZ Industries: $1.8M outstanding, 32 days past due, Risk Score: 72\n\n**Recommendations:**\n1. Immediate follow-up with ABC Corp - consider payment plan\n2. Implement weekly check-ins for XYZ Industries\n3. Review credit terms for both accounts\n\nWould you like me to generate specific collection strategies for these customers?";
    } else if (lowerMessage.includes('forecast') || lowerMessage.includes('collections')) {
      yield "Based on current data and ML models, here's the collection forecast:\n\n**Next 30 Days:** $4.2M (Confidence: 82%)\n- Week 1: $1.1M\n- Week 2: $1.4M\n- Week 3: $0.9M\n- Week 4: $0.8M\n\n**Key Factors:**\n- Historical payment patterns\n- Customer risk scores\n- Seasonal adjustments\n\nGap to target: -$400K. Recommend accelerating collection activities for top 10 accounts.";
    } else if (lowerMessage.includes('strategy') || lowerMessage.includes('suggest-strategy')) {
      yield "Here are AI-recommended collection strategies based on your portfolio:\n\n**Immediate Actions (0-7 days):**\n- Automated reminders for 30-day invoices\n- Personal calls to top 5 high-risk accounts\n- Early payment discount offers (2% for 10-day payment)\n\n**Medium-term (1-4 weeks):**\n- Implement payment plans for struggling customers\n- Credit line reviews for high-risk accounts\n- Collection agency referrals for 90+ day accounts\n\n**Strategic Initiatives:**\n- Credit insurance for top 3 customers\n- Automated dunning process optimization\n- Customer segmentation refinement\n\nExpected impact: 15% improvement in DSO, $2.1M cash acceleration.";
    } else {
      yield `I understand you're asking about "${query}". Based on your AR portfolio analysis, I can provide insights on:\n\n• Customer risk assessment and prioritization\n• Collection strategy optimization\n• Cash flow forecasting and scenario planning\n• Performance benchmarking and KPI tracking\n\nTry using one of the slash commands like /analyze-customer or /forecast-collections for specific insights. What would you like to explore further?`;
    }
  };

  return (
    <UniversalChatbot
      title="AR Intelligence Assistant"
      placeholder="Ask about AR collections, customer analysis, or strategies..."
      onClose={onClose}
      aiResponseGenerator={handleAIResponse}
      slashCommands={[
        { command: '/analyze-customer', description: 'Analyze specific customer risk and opportunities' },
        { command: '/forecast-collections', description: 'Generate collection forecast for specified period' },
        { command: '/suggest-strategy', description: 'Get AI-powered collection strategy recommendations' },
        { command: '/compare-periods', description: 'Compare AR performance across different periods' },
        { command: '/identify-risks', description: 'Identify potential risks in current AR portfolio' }
      ]}
    />
  );
};

export default ARIntelligenceAssistant;