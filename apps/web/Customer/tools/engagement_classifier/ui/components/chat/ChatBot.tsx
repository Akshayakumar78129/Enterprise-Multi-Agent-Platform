import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Minimize2, Maximize2, User, AlertCircle } from 'lucide-react';
import AgentMentions from './AgentMentions';
import ChatMessage from './ChatMessage';
import styles from './ChatBot.module.css';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'error' | 'system';
  mentions?: string[];
}

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
  dashboardData?: any;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onToggle, dashboardData }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your Customer Engagement Assistant. I can help you understand your engagement metrics, explain the dashboard data, and connect you with other agents. Try asking me about your customer engagement levels, KPIs, or type @ to mention other agents!",
      sender: 'bot',
      timestamp: new Date(),
      type: 'system'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const agents = [
    { id: 'sales', name: 'Sales', description: 'Sales performance and forecasting' },
    { id: 'inventory', name: 'Inventory', description: 'Stock levels and optimization' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    
    setInputValue(value);
    setCursorPosition(position);

    // Check for @ mentions
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

  const handleMentionSelect = (agent: typeof agents[0]) => {
    const beforeMention = inputValue.substring(0, cursorPosition - mentionQuery.length - 1);
    const afterCursor = inputValue.substring(cursorPosition);
    // Always insert lowercase tag for backend parsing (@sales / @inventory)
    const newValue = `${beforeMention}@${agent.id} ${afterCursor}`;
    
    setInputValue(newValue);
    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    // Improved greeting handling: only return greeting if it's a standalone salutation (no real question)
    const isGreeting = /\b(hi|hello|hey)\b/.test(lowerMessage);
    const hasQuestionIntent = /(\?|\bwhat\b|\bwho\b|\bhow\b|\bwhy\b|\bwhich\b|\bshow\b|\bcount\b|\blist\b)/i.test(lowerMessage);
    if (isGreeting && !hasQuestionIntent) {
      return `Hi there! 👋 I'm your Customer Engagement Assistant. I can help you understand your dashboard data and metrics. 

Here's what I can help you with:
📊 **Current KPIs**: Total customers, engagement scores, activity trends
👥 **Customer Distribution**: High, medium, and low engagement levels
🎯 **Actionable Insights**: Re-engagement opportunities and recommendations
🔍 **Dashboard Features**: Filters, search, and data exploration

What would you like to know about your customer engagement?`;
    }

    // Normalize common misspellings/variants to improve intent detection (e.g., "enagaemt" -> "engagement")
    let normalized = lowerMessage;
    const engagementTypos = ['enagaemt','enagagement','engaement','engagment','engagemnt','engagmnt','engagmen','engagemen'];
    engagementTypos.forEach(t => { normalized = normalized.replace(new RegExp(t, 'g'), 'engagement'); });
    normalized = normalized.replace(/engag\w*/g, 'engagement');

    // Handle specific engagement level questions FIRST (before generic conditions)
    // More robust detection for low engagement queries (supports typos and variants)
    const mentionsLowEngagement = (
      normalized.includes('low engagement') ||
      normalized.includes('low engagement customers') ||
      (normalized.includes('low') && (normalized.includes('engagement') || normalized.includes('customer'))) ||
      ((normalized.includes('what') || normalized.includes('who') || normalized.includes('explain') || normalized.includes('define')) &&
        normalized.includes('low') && (normalized.includes('engagement') || normalized.includes('customers')))
    );

    if (mentionsLowEngagement) {
      return `🔴 **Low Engagement Customers Explained**:

**Definition**: Customers with engagement scores of 1-4 out of 10, typically inactive for 90+ days.

**Characteristics**:
• Haven't made purchases recently (90+ days)
• Low interaction frequency with your brand
• Minimal response to marketing campaigns
• At risk of churning completely

**Why They Matter**:
• Represent potential lost revenue
• Cost less to re-engage than acquire new customers
• May have unresolved issues or changed needs
• Could become loyal again with right approach

**Re-engagement Strategies**:
🎁 **Win-back offers**: Special discounts or incentives
📧 **Personalized emails**: "We miss you" campaigns
📞 **Direct outreach**: Phone calls to understand issues
🔍 **Feedback surveys**: Learn why they became inactive
💡 **Product updates**: Show new features they might like

**Current Status**: You have ${dashboardData?.kpis?.reengagement_opportunities || 'several'} low engagement customers who could potentially be re-engaged.

Would you like specific strategies for your low engagement customers?`;
    }

    if (lowerMessage.includes('high engagement') || 
        (lowerMessage.includes('what') && lowerMessage.includes('high') && lowerMessage.includes('engagement')) ||
        (lowerMessage.includes('what') && lowerMessage.includes('high') && lowerMessage.includes('customers')) ||
        lowerMessage.includes('high engagement customers')) {
      return `🟢 **High Engagement Customers Explained**:

**Definition**: Customers with engagement scores of 8-10 out of 10, your most valuable and active customers.

**Characteristics**:
• Recent purchases (within 30 days)
• High interaction frequency
• Strong response to marketing campaigns
• High lifetime value and loyalty

**Why They're Important**:
• Generate majority of your revenue
• Act as brand advocates and referral sources
• Provide valuable feedback for improvements
• Most likely to try new products/services

**Retention Strategies**:
🏆 **VIP Programs**: Exclusive benefits and early access
🎁 **Loyalty Rewards**: Points, cashback, special offers
📞 **Personal Service**: Dedicated support and account management
🚀 **Upselling**: Premium products and services
💬 **Feedback**: Regular surveys and product input

**Current Status**: You have ${dashboardData?.distribution?.find((d: any) => d.engagement_level === 'High')?.customer_count || 'several'} high engagement customers.

These customers are your champions - focus on keeping them happy and leveraging them for growth!`;
    }

    if (lowerMessage.includes('medium engagement') || 
        (lowerMessage.includes('what') && lowerMessage.includes('medium') && lowerMessage.includes('engagement')) ||
        (lowerMessage.includes('what') && lowerMessage.includes('medium') && lowerMessage.includes('customers')) ||
        lowerMessage.includes('medium engagement customers')) {
      return `🟡 **Medium Engagement Customers Explained**:

**Definition**: Customers with engagement scores of 5-7 out of 10, representing your biggest growth opportunity.

**Characteristics**:
• Moderate purchase frequency (30-90 days since last activity)
• Some interaction with your brand
• Potential for increased engagement
• Mixed response to marketing efforts

**Why They Matter**:
• Largest segment with growth potential
• Easier to convert than low engagement customers
• Can become high-value customers with right approach
• Best ROI for engagement campaigns

**Growth Strategies**:
📧 **Personalized Marketing**: Targeted emails based on preferences
🎯 **Product Recommendations**: AI-driven suggestions
📱 **Multi-channel Engagement**: Email, SMS, social media
🎁 **Incentive Programs**: Limited-time offers and discounts
📊 **Behavior Tracking**: Monitor engagement patterns

**Current Status**: You have ${dashboardData?.distribution?.find((d: any) => d.engagement_level === 'Medium')?.customer_count || 'several'} medium engagement customers.

Focus your marketing efforts here for the best return on investment!`;
    }

    // Handle specific questions about engagement scoring
    if ((lowerMessage.includes('what') && lowerMessage.includes('engagement') && lowerMessage.includes('score')) ||
        (lowerMessage.includes('how') && lowerMessage.includes('engagement') && lowerMessage.includes('calculated')) ||
        (lowerMessage.includes('what') && lowerMessage.includes('scoring'))) {
      return `📊 **Engagement Scoring System Explained**:

**How Engagement Scores Work**:
Engagement scores range from 1-10 and are calculated using multiple factors:

🕒 **Recency (40% weight)**:
• How recently did the customer interact with you?
• Recent activity = higher score

🔄 **Frequency (30% weight)**:
• How often do they engage with your business?
• Regular interactions = higher score

💰 **Monetary Value (20% weight)**:
• How much do they spend with you?
• Higher spending = higher score

📱 **Activity Type (10% weight)**:
• Quality of interactions (purchases vs. just browsing)
• Meaningful actions = higher score

**Score Categories**:
🟢 **8-10 (High)**: Your best customers - active, frequent, high-value
🟡 **5-7 (Medium)**: Good customers with growth potential
🔴 **1-4 (Low)**: At-risk customers needing attention

**Your Current Average**: ${dashboardData?.kpis?.avg_engagement_score || 'N/A'}/10

This scoring helps you prioritize which customers to focus on for different strategies!`;
    }

    // Handle questions about KPIs and metrics
    if ((lowerMessage.includes('what') && (lowerMessage.includes('kpi') || lowerMessage.includes('metrics'))) ||
        (lowerMessage.includes('explain') && lowerMessage.includes('kpi')) ||
        lowerMessage.includes('key performance indicators')) {
      return `📊 **Your Dashboard KPIs Explained**:

**Current Performance Metrics**:

🔢 **Total Customers**: ${dashboardData?.kpis?.total_customers?.toLocaleString() || 'N/A'}
• Your complete customer base size
• Tracks business growth over time

⭐ **Average Engagement Score**: ${dashboardData?.kpis?.avg_engagement_score || 'N/A'}/10
• Overall health of customer relationships
• Higher = more engaged customer base

⏱️ **Average Days Since Activity**: ${dashboardData?.kpis?.avg_days_since_activity || 'N/A'} days
• How recently customers interacted
• Lower = more active customer base

🎯 **Re-engagement Opportunities**: ${dashboardData?.kpis?.reengagement_opportunities?.toLocaleString() || 'N/A'}
• Customers who can potentially be won back
• Focus area for marketing campaigns

**What These Numbers Mean**:
• **Good engagement score**: 7+ indicates healthy relationships
• **Recent activity**: Under 30 days average is excellent
• **Re-engagement opportunities**: These are your quick wins

**Action Items**:
• If avg score is below 6: Focus on customer satisfaction
• If days since activity is high: Increase communication frequency
• Use re-engagement opportunities for targeted campaigns

These KPIs give you a quick health check of your customer relationships!`;
    }

    // Comprehensive dashboard explanations (more specific conditions)
    if ((lowerMessage.includes('dashboard') && !lowerMessage.includes('engagement')) || 
        (lowerMessage.includes('explain') && lowerMessage.includes('dashboard')) ||
        (lowerMessage.includes('what') && lowerMessage.includes('dashboard'))) {
      return `Let me explain your Customer Engagement Dashboard! 📊

**🎯 Main Purpose**: This dashboard helps you understand how engaged your customers are and identify opportunities to improve relationships.

**📊 Key Sections**:
• **KPI Cards** (top): Quick overview of total customers, average engagement score, days since activity, and re-engagement opportunities
• **Engagement Distribution** (left): Pie chart showing high/medium/low engagement customer breakdown  
• **Customer List** (center): Detailed table with individual customer data, scores, and last activity
• **Filters** (left panel): Tools to segment and analyze specific customer groups

**🔍 How to Use**:
1. Check KPIs for overall health
2. Use filters to focus on specific segments
3. Review individual customers in the table
4. Identify re-engagement opportunities

What specific part would you like me to explain in more detail?`;
    }



    // Enhanced pattern matching for more topics
    if (lowerMessage.includes('score') || lowerMessage.includes('scoring')) {
      return `📊 **Engagement Scoring Explained**:

**How it works**: Engagement scores (1-10) are calculated based on:
• **Recency**: How recently they interacted with you
• **Frequency**: How often they engage
• **Monetary**: Their transaction value
• **Activity Type**: Quality of interactions

**Score Ranges**:
• **8-10**: Highly engaged, loyal customers
• **5-7**: Moderately engaged, potential for growth  
• **1-4**: Low engagement, needs attention

**💡 Pro Tip**: Focus on customers with scores 4-6 for the best re-engagement ROI!`;
    }

    if (lowerMessage.includes('table') || lowerMessage.includes('customer list') || lowerMessage.includes('columns')) {
      return `📋 **Customer Table Guide**:

**Key Columns**:
• **Customer ID**: Unique identifier
• **Name**: Customer name
• **Engagement Score**: 1-10 rating
• **Level**: High/Medium/Low classification
• **Last Activity**: Days since last interaction
• **Total Transactions**: Lifetime transaction count
• **Avg Order Value**: Average purchase amount
• **Loyalty Status**: Customer tier/status

**💡 How to Use**:
• Click column headers to sort
• Use search to find specific customers
• Apply filters to segment data
• Export data for further analysis`;
    }

    // Check for agent mentions
    const mentionedAgents = agents.filter(agent => 
      userMessage.toLowerCase().includes(`@${agent.name.toLowerCase()}`)
    );

    if (mentionedAgents.length > 0) {
      const agentNames = mentionedAgents.map(a => a.name).join(', ');
      return `I've noted that you want to involve ${agentNames}. While I can't directly connect you right now, I can help you prepare the context for them. What specific information would you like me to gather about your customer engagement data?`;
    }

    // Engagement-specific responses based on dashboard data
    if (lowerMessage.includes('kpi') || lowerMessage.includes('metric')) {
      const kpis = dashboardData?.kpis;
      if (kpis) {
        return `Here are your current KPIs:
        
📊 **Total Customers**: ${kpis.total_customers?.toLocaleString() || 'N/A'}
⭐ **Avg Engagement Score**: ${kpis.avg_engagement_score || 'N/A'}/10
⏱️ **Avg Days Since Activity**: ${kpis.avg_days_since_activity || 'N/A'} days
🎯 **Re-engagement Opportunities**: ${kpis.reengagement_opportunities?.toLocaleString() || 'N/A'}

Your engagement trend is currently **${kpis.engagement_trend || 'Unknown'}**. Would you like me to explain any of these metrics in detail?`;
      }
    }

    if (lowerMessage.includes('engagement level') || lowerMessage.includes('distribution')) {
      const distribution = dashboardData?.distribution;
      if (distribution) {
        const total = distribution.reduce((sum: number, item: any) => sum + item.customer_count, 0);
        return `Here's your customer engagement distribution:

🟢 **High Engagement**: ${distribution.find((d: any) => d.engagement_level === 'High')?.customer_count || 0} customers (${Math.round((distribution.find((d: any) => d.engagement_level === 'High')?.customer_count || 0) / total * 100)}%)
🟡 **Medium Engagement**: ${distribution.find((d: any) => d.engagement_level === 'Medium')?.customer_count || 0} customers (${Math.round((distribution.find((d: any) => d.engagement_level === 'Medium')?.customer_count || 0) / total * 100)}%)
🔴 **Low Engagement**: ${distribution.find((d: any) => d.engagement_level === 'Low')?.customer_count || 0} customers (${Math.round((distribution.find((d: any) => d.engagement_level === 'Low')?.customer_count || 0) / total * 100)}%)

High engagement customers have been active within the last 30 days, medium within 30-90 days, and low engagement customers haven't been active for over 90 days.`;
      }
    }

    if (lowerMessage.includes('improve') || lowerMessage.includes('recommendation')) {
      return `Based on your engagement data, here are some recommendations:

🎯 **Focus on Re-engagement**: You have ${dashboardData?.kpis?.reengagement_opportunities || 'several'} customers who could be re-engaged
📧 **Targeted Campaigns**: Consider email campaigns for medium engagement customers
🎁 **Incentive Programs**: Offer special deals to low engagement customers
📊 **Regular Monitoring**: Track engagement trends weekly

Would you like me to connect you with the @Sales Agent for campaign strategies?`;
    }

    if (lowerMessage.includes('filter') || lowerMessage.includes('search')) {
      return `You can filter your engagement data using several options:

🗓️ **Date Range**: Filter by specific time periods
👥 **Engagement Levels**: Focus on High, Medium, or Low engagement customers  
🏆 **Loyalty Status**: Filter by customer loyalty tiers
💰 **Transaction Volume**: Set minimum transaction thresholds
📊 **RFM Scores**: Filter by Recency, Frequency, Monetary scores

Use the filter panel on the left side of your dashboard to apply these filters and get more targeted insights!`;
    }

    // Additional comprehensive responses
    if (lowerMessage.includes('help') || lowerMessage.includes('guide') || lowerMessage.includes('tutorial')) {
      return `🎯 **Complete Dashboard Guide**:

**Getting Started**:
1. **Overview**: Check your KPI cards for quick health metrics
2. **Analyze**: Use the engagement distribution chart to understand your customer base
3. **Drill Down**: Review individual customers in the detailed table
4. **Take Action**: Identify re-engagement opportunities and plan campaigns

**Key Features**:
📊 **KPI Monitoring**: Track total customers, avg scores, activity patterns
🔍 **Smart Filtering**: Segment by engagement level, loyalty, transactions
📋 **Customer Details**: View individual scores, activity, and transaction history
📈 **Trend Analysis**: Monitor engagement changes over time

**Pro Tips**:
• Focus on medium-engagement customers for best ROI
• Use date filters to analyze seasonal patterns
• Export data for deeper analysis in Excel
• Set up regular monitoring schedules

What specific feature would you like me to explain in detail?`;
    }

    if (lowerMessage.includes('rfm') || lowerMessage.includes('recency') || lowerMessage.includes('frequency') || lowerMessage.includes('monetary')) {
      return `📊 **RFM Analysis Explained**:

**RFM stands for**:
• **R**ecency: How recently did they purchase?
• **F**requency: How often do they purchase?
• **M**onetary: How much do they spend?

**How it works in your dashboard**:
• **Recency Score**: 1-5 (5 = very recent activity)
• **Frequency Score**: 1-5 (5 = very frequent purchases)
• **Monetary Score**: 1-5 (5 = high-value customer)

**Customer Segments**:
• **Champions** (5,5,5): Best customers - retain them!
• **Loyal Customers** (2-5,3-5,3-5): Regular buyers
• **At Risk** (2-3,2-3,2-3): Declining engagement
• **Lost** (1-2,1-2,1-2): Need immediate attention

Use RFM filters to target specific customer segments with tailored campaigns!`;
    }

    if (lowerMessage.includes('campaign') || lowerMessage.includes('marketing') || lowerMessage.includes('strategy')) {
      return `🎯 **Engagement Campaign Strategies**:

**For High Engagement Customers** (8-10 score):
• Loyalty rewards and VIP programs
• Early access to new products
• Referral incentives
• Upselling premium services

**For Medium Engagement Customers** (5-7 score):
• Personalized product recommendations
• Limited-time offers
• Educational content
• Feedback surveys

**For Low Engagement Customers** (1-4 score):
• Win-back campaigns with discounts
• Re-onboarding email series
• Survey to understand issues
• Special "we miss you" offers

**💡 Pro Tip**: Use the @Sales Agent mention to get specific campaign recommendations based on your data!`;
    }

    // Add more specific dashboard questions before falling back to AI
    if (lowerMessage.includes('what is') || lowerMessage.includes('what are')) {
      if (lowerMessage.includes('kpi') || lowerMessage.includes('metrics')) {
        return `📊 **KPI Metrics Explained**:

**Key Performance Indicators (KPIs)** are the most important metrics for measuring your customer engagement success:

🔢 **Total Customers**: ${dashboardData?.kpis?.total_customers?.toLocaleString() || 'N/A'} - Your complete customer base
⭐ **Average Engagement Score**: ${dashboardData?.kpis?.avg_engagement_score || 'N/A'}/10 - Overall customer engagement health
⏱️ **Average Days Since Activity**: ${dashboardData?.kpis?.avg_days_since_activity || 'N/A'} days - How recently customers interacted
🎯 **Re-engagement Opportunities**: ${dashboardData?.kpis?.reengagement_opportunities?.toLocaleString() || 'N/A'} - Customers who can be won back

**How to Use These KPIs**:
• Monitor trends over time
• Set targets for improvement
• Compare against industry benchmarks
• Identify areas needing attention

These metrics give you a quick health check of your customer relationships!`;
      }
      
      if (lowerMessage.includes('engagement level') || lowerMessage.includes('engagement distribution')) {
        return `📊 **Engagement Levels Explained**:

Your customers are automatically categorized into three engagement levels:

🟢 **High Engagement (8-10 score)**:
• Active within last 30 days
• Frequent purchasers and brand advocates
• High lifetime value customers

🟡 **Medium Engagement (5-7 score)**:
• Active within 30-90 days
• Occasional purchasers with growth potential
• Best targets for marketing campaigns

🔴 **Low Engagement (1-4 score)**:
• Inactive for 90+ days
• At risk of churning
• Need immediate re-engagement efforts

**Current Distribution**:
${dashboardData?.distribution ? dashboardData.distribution.map((d: any) => 
  `• ${d.engagement_level}: ${d.customer_count} customers`
).join('\n') : 'Data loading...'}

This segmentation helps you target the right customers with the right strategies!`;
      }
    }

    // Handle "how to" questions
    if (lowerMessage.includes('how to') || lowerMessage.includes('how do i')) {
      if (lowerMessage.includes('improve') || lowerMessage.includes('increase')) {
        return `🚀 **How to Improve Customer Engagement**:

**For High Engagement Customers** (Keep them happy):
• Implement VIP loyalty programs
• Provide exclusive early access to products
• Offer personalized customer service
• Ask for referrals and testimonials

**For Medium Engagement Customers** (Grow the relationship):
• Send personalized product recommendations
• Create targeted email campaigns
• Offer limited-time promotions
• Engage on social media platforms

**For Low Engagement Customers** (Win them back):
• Send "we miss you" campaigns with special offers
• Conduct surveys to understand their needs
• Provide helpful content and resources
• Make direct contact via phone or email

**General Strategies**:
📧 Regular communication (but not overwhelming)
🎁 Reward loyalty and engagement
📊 Track and respond to behavior changes
💬 Ask for feedback and act on it
🎯 Personalize experiences based on preferences

Start with your medium engagement customers for the best ROI!`;
      }
      
      if (lowerMessage.includes('filter') || lowerMessage.includes('search')) {
        return `🔍 **How to Use Dashboard Filters**:

**Step-by-Step Guide**:
1. **Open Filter Panel**: Look for the filter icon on the left side
2. **Select Criteria**: Choose from available filter options
3. **Apply Filters**: Click "Apply" to update the view
4. **Clear Filters**: Use "Clear All" to reset

**Available Filters**:
📅 **Date Range**: Filter by specific time periods
👥 **Engagement Level**: High, Medium, or Low
🏆 **Loyalty Status**: Customer tier/status
💰 **Transaction Value**: Minimum purchase amounts
📊 **RFM Scores**: Recency, Frequency, Monetary values

**Pro Tips**:
• Combine multiple filters for precise targeting
• Save frequently used filter combinations
• Export filtered data for further analysis
• Use date filters to identify seasonal patterns

**Common Filter Combinations**:
• High engagement + Recent activity = VIP customers
• Medium engagement + 30-90 days = Re-engagement targets
• Low engagement + High transaction value = Priority win-backs

Try filtering by engagement level to see different customer segments!`;
      }
    }

    // Handle simple questions about dashboard features
    if (lowerMessage.includes('chart') || lowerMessage.includes('graph') || lowerMessage.includes('visualization')) {
      return `📊 **Dashboard Visualizations Explained**:

**Engagement Distribution Chart** (Pie Chart):
• Shows breakdown of High/Medium/Low engagement customers
• Helps you understand your customer base composition
• Click segments to filter the customer table

**KPI Cards** (Top Section):
• Total Customers: Your complete customer base
• Average Engagement Score: Overall health metric
• Days Since Activity: Recency indicator
• Re-engagement Opportunities: Actionable count

**Customer Table** (Main Section):
• Detailed view of individual customers
• Sortable columns for analysis
• Search and filter capabilities
• Export functionality for further analysis

**How to Read the Charts**:
• Larger pie segments = more customers in that category
• Higher KPI numbers = better performance
• Recent activity dates = active customers

These visualizations give you instant insights into your customer engagement health!`;
    }

    // Handle questions about specific features
    if (lowerMessage.includes('export') || lowerMessage.includes('download') || lowerMessage.includes('save')) {
      return `📥 **Export & Download Features**:

**What You Can Export**:
• Customer engagement data (CSV format)
• Filtered customer lists
• KPI reports
• Engagement distribution data

**How to Export**:
1. Apply any filters you want
2. Look for the "Export" button (usually top-right)
3. Choose your format (CSV recommended)
4. Download will start automatically

**Best Practices**:
• Export filtered data for targeted analysis
• Regular exports for trend tracking
• Share with team members for collaboration
• Import into Excel/Google Sheets for advanced analysis

**Use Cases**:
📧 Email marketing lists (medium engagement customers)
📞 Sales outreach lists (high-value low engagement)
📊 Executive reporting (KPI summaries)
🎯 Campaign targeting (specific segments)

The export feature helps you take action on your engagement insights!`;
    }

    // Only call AI API for complex questions that aren't covered above
    return await getAIResponse(userMessage);
  };

  const getAIResponse = async (message: string): Promise<string> => {
    try {
      // Set a shorter timeout for faster response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: {
            dashboardType: 'customer_engagement',
            data: dashboardData
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
    } catch (error) {
      console.error('AI response error:', error);
    }

    // Enhanced fallback response with more specific help
    return getSmartFallbackResponse(message);
  };

  const getSmartFallbackResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    // Provide contextual help based on keywords
    if (lowerMessage.includes('trend') || lowerMessage.includes('pattern')) {
      return `📈 **Engagement Trends Analysis**:

To analyze trends in your dashboard:
• Look at the engagement score changes over time
• Compare current vs previous period metrics
• Identify seasonal patterns in customer activity
• Monitor re-engagement campaign effectiveness

**Key Indicators**:
• Increasing avg engagement score = positive trend
• Decreasing days since activity = more frequent engagement
• Growing high-engagement segment = healthy growth

Would you like me to explain any specific trend metric?`;
    }

    if (lowerMessage.includes('segment') || lowerMessage.includes('group')) {
      return `👥 **Customer Segmentation Guide**:

Your customers are automatically segmented by:
• **High Engagement** (8-10 score): Your champions and advocates
• **Medium Engagement** (5-7 score): Growth opportunities  
• **Low Engagement** (1-4 score): At-risk customers needing attention

**Segmentation Strategies**:
• Target high-engagement customers for upselling
• Re-engage medium customers with personalized offers
• Win back low-engagement customers with special campaigns

Use the filters to focus on specific segments!`;
    }

    if (lowerMessage.includes('export') || lowerMessage.includes('download')) {
      return `📥 **Data Export Options**:

You can export your engagement data for:
• Further analysis in Excel/Google Sheets
• Integration with marketing tools
• Reporting to stakeholders
• Historical tracking

**Available Formats**:
• CSV for spreadsheet analysis
• PDF for presentations
• JSON for system integration

Look for the export button in the top-right of your customer table!`;
    }

    // Provide more specific suggestions based on the question
    const suggestions = [];
    if (lowerMessage.includes('customer')) suggestions.push('"What are low engagement customers?"', '"How to improve customer engagement?"');
    if (lowerMessage.includes('data') || lowerMessage.includes('metric')) suggestions.push('"Explain my KPIs"', '"What is engagement scoring?"');
    if (lowerMessage.includes('help') || lowerMessage.includes('guide')) suggestions.push('"How to use dashboard filters?"', '"Show me customer distribution"');
    
    // Default comprehensive response with smart suggestions
    return `I understand you're asking about "${message}". As your Customer Engagement Assistant, I can help you with:

📊 **Dashboard Analysis**: KPIs, metrics, and performance indicators
👥 **Customer Insights**: Segmentation, behavior patterns, and engagement levels
🎯 **Actionable Strategies**: Re-engagement tactics and optimization tips
🔍 **Data Navigation**: Filters, search, sorting, and export options
📈 **Trend Analysis**: Patterns, forecasting, and performance tracking
🤝 **Agent Collaboration**: Connecting with Sales, Inventory, and Financial teams

${suggestions.length > 0 ? `**Based on your question, you might want to try:**\n${suggestions.map(s => `• ${s}`).join('\n')}\n\n` : ''}**Other helpful questions:**
• "What are low engagement customers?"
• "How do engagement scores work?"
• "Show me customer distribution"
• "How to improve customer engagement?"
• "What are my re-engagement opportunities?"`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
      mentions: inputValue.match(/@\w+/g) || []
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const botResponse = await generateBotResponse(userMessage.content);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I encountered an error. Please try again or rephrase your question.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.chatbotContainer} ${isMinimized ? styles.minimized : ''}`}>
      {/* Header */}
      <div className={styles.chatbotHeader}>
        <div className={styles.chatbotHeaderInfo}>
          <Bot className={styles.chatbotIcon} size={20} />
          <div>
            <h3>Enhanced AI Assistant</h3>
            <div className={styles.chatbotSubtitle}>Ready with @mentions</div>
          </div>
        </div>
        <div className={styles.chatbotControls}>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className={styles.controlBtn}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={onToggle} className={styles.controlBtn}>
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className={styles.chatbotMessages}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} styles={styles} />
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.botMessage}`}>
                <Bot className={styles.messageAvatar} size={24} />
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Agent Mentions Dropdown */}
          {showMentions && (
            <AgentMentions
              agents={agents}
              query={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentions(false)}
              styles={styles}
            />
          )}

          {/* Input */}
          <div className={styles.chatbotInput}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your engagement metrics or type @ to mention agents..."
              className={styles.chatTextarea}
              rows={1}
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={styles.sendButton}
            >
              <Send size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBot;