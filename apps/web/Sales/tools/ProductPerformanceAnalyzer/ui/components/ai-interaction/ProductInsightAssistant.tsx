import React, { useState, useRef } from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { RobotCharacter } from '../../../../../../ui-common/ai-interaction/RobotCharacter/RobotCharacter';
import { QueryInput } from '../../../../../../ui-common/QueryInput/QueryInput';

interface ProductInsightAssistantProps {
  onQuerySubmit: (query: string) => Promise<void>;
  onPointToElement?: (elementId: string) => void;
}

type AssistantState = 'idle' | 'thinking' | 'speaking' | 'pointing';

/**
 * AI-powered product analysis assistant
 */
export const ProductInsightAssistant: React.FC<ProductInsightAssistantProps> = ({
  onQuerySubmit,
  onPointToElement,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [laserTarget, setLaserTarget] = useState<{ x: number; y: number } | null>(null);
  
  // Handle user query submission
  const handleQuerySubmit = async (query: string) => {
    // Update assistant state
    setAssistantState('thinking');
    setMessage('Analyzing your request...');
    
    try {
      // Process query
      await onQuerySubmit(query);
      
      // Show response
      setAssistantState('speaking');
      setMessage('Here is what I found about your products. Sales have increased by 12% in the last quarter, with the highest growth in the Electronics category.');
      
      // After delay, point to relevant element
      setTimeout(() => {
        if (onPointToElement) {
          onPointToElement('salesPerformanceChart');
          
          // For demo purposes, set a static laser target
          // In a real implementation, we would get the element position
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setLaserTarget({
              x: rect.right - 250,
              y: rect.top + 150,
            });
            setAssistantState('pointing');
          }
        }
      }, 5000);
    } catch (error) {
      setMessage('Sorry, I encountered an error analyzing your request.');
      setTimeout(() => {
        setAssistantState('idle');
        setMessage(null);
      }, 3000);
    }
  };
  
  // Handle robot drag
  const handleRobotDrag = (newPosition: { x: number; y: number }) => {
    setPosition(newPosition);
  };
  
  // Example command hints
  const commandHints = [
    { command: '/analyze-product', description: 'Analyze a specific product' },
    { command: '/compare-categories', description: 'Compare two or more categories' },
    { command: '/find-opportunities', description: 'Identify growth opportunities' },
    { command: '/explain-trend', description: 'Explain a trend in a metric' },
    { command: '/optimize-pricing', description: 'Get pricing optimization recommendations' },
  ];
  
  return (
    <div ref={containerRef} style={{ position: 'relative', height: '100%' }}>
      {/* Robot Character */}
      <RobotCharacter
        initialPosition={position}
        state={assistantState}
        message={message}
        laserTarget={laserTarget}
        onDrag={handleRobotDrag}
        laserColor={theme.colors.electricCyan}
      />
      
      {/* Query Input */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 320,
        }}
      >
        <Card title="Ask about products" elevation="md">
          <div style={{ marginBottom: '8px' }}>
            <QueryInput
              onSubmit={handleQuerySubmit}
              placeholder="Ask me about product performance..."
            />
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <p style={{ 
              color: theme.colors.cloudWhite, 
              fontSize: '12px',
              margin: '0 0 8px 0',
            }}>
              Try asking:
            </p>
            <ul style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
            }}>
              {commandHints.map((hint, index) => (
                <li
                  key={index}
                  style={{
                    color: theme.colors.cloudWhite,
                    fontSize: '12px',
                    margin: '4px 0',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: `${theme.colors.midnight}80`,
                  }}
                  onClick={() => handleQuerySubmit(hint.command)}
                >
                  <span style={{ color: theme.colors.electricCyan }}>
                    {hint.command}
                  </span>{' '}
                  - {hint.description}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProductInsightAssistant; 