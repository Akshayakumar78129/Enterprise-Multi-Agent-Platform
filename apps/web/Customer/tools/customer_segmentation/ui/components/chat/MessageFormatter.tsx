import React from 'react';

interface MessageFormatterProps {
  content: string;
  type: 'user' | 'bot' | 'agent';
}

export default function MessageFormatter({ content, type }: MessageFormatterProps) {
  // Parse markdown-like formatting
  const formatContent = (text: string) => {
    // Split by lines to handle line breaks
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Check for headers
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <div key={lineIndex} style={{ 
            fontWeight: 700, 
            fontSize: '16px',
            marginTop: lineIndex > 0 ? '12px' : '0',
            marginBottom: '8px',
            color: type === 'user' ? 'white' : '#e2e8f0'
          }}>
            {line.replace(/\*\*/g, '')}
          </div>
        );
      }
      
      // Check for bullet points
      if (line.startsWith('•') || line.startsWith('-')) {
        return (
          <div key={lineIndex} style={{ 
            paddingLeft: '16px',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            color: '#ffffff'
          }}>
            <span style={{ color: '#60a5fa', flexShrink: 0 }}>•</span>
            <span>{line.substring(1).trim()}</span>
          </div>
        );
      }
      
      // Check for numbered lists
      const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
      if (numberedMatch) {
        return (
          <div key={lineIndex} style={{ 
            paddingLeft: '16px',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            color: '#ffffff'
          }}>
            <span style={{ 
              color: '#60a5fa', 
              fontWeight: 600,
              minWidth: '20px'
            }}>
              {numberedMatch[1]}.
            </span>
            <span>{numberedMatch[2]}</span>
          </div>
        );
      }
      
      // Regular text with inline formatting
      let formattedLine = line;
      
      // Bold text
      formattedLine = formattedLine.replace(/\*\*([^*]+)\*\*/g, (match, text) => 
        `<strong style="color:${type === 'user' ? '#ffffff' : '#e2e8f0'};font-weight:700">${text}</strong>`
      );
      
      // Inline code/metrics
      formattedLine = formattedLine.replace(/`([^`]+)`/g, (match, text) => 
        `<code style="background:rgba(59,130,246,0.1);padding:2px 6px;border-radius:4px;color:#60a5fa;font-family:monospace;font-size:13px">${text}</code>`
      );
      
      // Percentages and numbers
      formattedLine = formattedLine.replace(/(\d+\.?\d*%|\$[\d,]+(?:\.\d{2})?|\d+[KMB]?)/g, (match) => 
        `<span style="color:#22c55e;font-weight:600">${match}</span>`
      );
      
      // @mentions
      formattedLine = formattedLine.replace(/@(\w+)/g, (match, name) => 
        `<span style="color:#60a5fa;font-weight:600">${match}</span>`
      );
      
      // Emojis - make them slightly larger
      formattedLine = formattedLine.replace(/([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu, (match) => 
        `<span style="font-size:18px">${match}</span>`
      );
      
      if (line.trim() === '') {
        return <div key={lineIndex} style={{ height: '8px' }} />;
      }
      
      return (
        <div 
          key={lineIndex} 
          style={{ 
            marginBottom: '4px',
            color: '#ffffff',
            lineHeight: 1.6
          }}
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };
  
  return (
    <div style={{ 
      fontSize: '14px',
      lineHeight: 1.6
    }}>
      {formatContent(content)}
    </div>
  );
}