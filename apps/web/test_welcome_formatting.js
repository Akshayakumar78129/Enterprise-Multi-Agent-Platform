// Test the FloatingAIChat welcome message formatting
const testMarkdownRendering = () => {
  const content = `# 🎉 Welcome to Enhanced AI Assistant v2!

## ✨ Available AI Agents:

• **@sales** 📈 - Sales performance, revenue analysis, and pipeline insights
• **@customer** 👥 - Customer analytics, segmentation, and behavior patterns  
• **@finance** 💰 - Financial metrics, cash flow, and profitability analysis
• **@inventory** 📦 - Stock levels, inventory optimization, and demand patterns

## 🚀 Quick Start Guide:

1. **Type @** to see live agent suggestions
2. **Mention an agent** like "@sales show me revenue trends"
3. **Ask naturally** - "What's our inventory status?"
4. **Get instant insights** from your connected databases

💡 **Pro Tip:** Each agent has access to real-time data and provides detailed analysis with proper formatting!`;

  // Simulate the rendering function from FloatingAIChat
  const renderAgentMessage = (content) => {
    return content
      // Headers with emojis
      .replace(/^(#{1,3})\s*(.*?)$/gm, (match, hashes, content) => {
        const level = hashes.length;
        const size = level === 1 ? '20px' : level === 2 ? '18px' : '16px';
        const margin = level === 1 ? '20px' : level === 2 ? '16px' : '12px';
        const color = level === 1 ? '#00e0ff' : level === 2 ? '#10b981' : '#f8fafc';
        return `<div style="font-size: ${size}; font-weight: 700; margin-top: ${margin}; margin-bottom: 12px; color: ${color}; line-height: 1.4;">${content}</div>`;
      })
      // Bold text (cyan highlight)
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #00e0ff; font-weight: 600;">$1</strong>')
      // Bullet points with better spacing
      .replace(/^• (.*?)$/gm, '<div style="margin-left: 20px; margin-bottom: 8px; color: #e2e8f0; line-height: 1.5;">• $1</div>')
      // Numbered lists with better styling
      .replace(/^(\d+)\.\s*(.*?)$/gm, '<div style="margin-left: 20px; margin-bottom: 8px; color: #e2e8f0; line-height: 1.5;"><strong style="color: #10b981;">$1.</strong> $2</div>')
      // Line breaks with proper spacing
      .replace(/\n\n/g, '</p><p style="margin-top: 16px; margin-bottom: 0; line-height: 1.6;">')
      .replace(/\n/g, '<br/>')
      // Enhanced emoji sizing and spacing
      .replace(/([🎉✨🚀💡📈👥💰📦🤖⚠️🔍📋🔄💸🏆📉🎯💼📊])/g,
        '<span style="font-size: 20px; vertical-align: middle; margin-right: 6px; display: inline-block;">$1</span>')
      // Wrap in paragraph with better typography
      .replace(/^(.*)$/, '<p style="margin: 0; line-height: 1.6; color: #f1f5f9;">$1</p>');
  };

  const rendered = renderAgentMessage(content);
  console.log('=== RENDERED HTML ===');
  console.log(rendered);
  console.log('\n=== FORMATTING TEST COMPLETE ===');
};

testMarkdownRendering();
