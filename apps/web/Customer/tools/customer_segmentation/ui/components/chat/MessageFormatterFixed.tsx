import React from 'react';

interface MessageFormatterProps {
  content: string;
  type: 'user' | 'bot' | 'agent';
}

export default function MessageFormatterFixed({ content, type }: MessageFormatterProps) {
  // Parse markdown-like formatting without using dangerouslySetInnerHTML
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Check for headers (text between **)
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <div key={lineIndex} style={{ 
            fontWeight: 700, 
            fontSize: '16px',
            marginTop: lineIndex > 0 ? '12px' : '0',
            marginBottom: '8px',
            color: '#ffffff'
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
            <span>{formatInlineElements(line.substring(1).trim())}</span>
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
            <span>{formatInlineElements(numberedMatch[2])}</span>
          </div>
        );
      }
      
      if (line.trim() === '') {
        return <div key={lineIndex} style={{ height: '8px' }} />;
      }
      
      // Regular paragraph
      return (
        <div key={lineIndex} style={{ 
          marginBottom: '4px',
          color: '#ffffff',
          lineHeight: 1.6
        }}>
          {formatInlineElements(line)}
        </div>
      );
    });
  };

  // Format inline elements (bold, mentions, numbers, etc)
  const formatInlineElements = (text: string) => {
    const elements: React.ReactNode[] = [];
    let currentText = text;
    let keyCounter = 0;

    // Process the text for various patterns
    const patterns = [
      {
        regex: /\*\*([^*]+)\*\*/,
        render: (match: string, content: string) => (
          <strong key={`bold-${keyCounter++}`} style={{ color: '#ffffff', fontWeight: 700 }}>
            {content}
          </strong>
        )
      },
      {
        regex: /@(\w+)/,
        render: (match: string, name: string) => (
          <span key={`mention-${keyCounter++}`} style={{ color: '#60a5fa', fontWeight: 600 }}>
            @{name}
          </span>
        )
      },
      {
        regex: /`([^`]+)`/,
        render: (match: string, code: string) => (
          <code key={`code-${keyCounter++}`} style={{ 
            background: 'rgba(59, 130, 246, 0.2)', 
            padding: '2px 6px', 
            borderRadius: '4px', 
            color: '#60a5fa', 
            fontFamily: 'monospace', 
            fontSize: '13px' 
          }}>
            {code}
          </code>
        )
      },
      {
        regex: /(\d+\.?\d*%|\$[\d,]+(?:\.\d{2})?)/,
        render: (match: string) => (
          <span key={`number-${keyCounter++}`} style={{ color: '#22c55e', fontWeight: 600 }}>
            {match}
          </span>
        )
      }
    ];

    // Split text and apply formatting
    let result: React.ReactNode[] = [];
    let remainingText = currentText;
    
    while (remainingText.length > 0) {
      let earliestMatch = null;
      let earliestIndex = remainingText.length;
      let matchedPattern = null;

      // Find the earliest matching pattern
      for (const pattern of patterns) {
        const match = remainingText.match(pattern.regex);
        if (match && match.index !== undefined && match.index < earliestIndex) {
          earliestMatch = match;
          earliestIndex = match.index;
          matchedPattern = pattern;
        }
      }

      if (earliestMatch && matchedPattern) {
        // Add text before the match
        if (earliestIndex > 0) {
          result.push(remainingText.substring(0, earliestIndex));
        }
        
        // Add the formatted element
        if (earliestMatch[1] !== undefined) {
          result.push(matchedPattern.render(earliestMatch[0], earliestMatch[1]));
        } else {
          result.push(matchedPattern.render(earliestMatch[0], earliestMatch[0]));
        }
        
        // Continue with remaining text
        remainingText = remainingText.substring(earliestIndex + earliestMatch[0].length);
      } else {
        // No more matches, add remaining text
        result.push(remainingText);
        break;
      }
    }

    return result;
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