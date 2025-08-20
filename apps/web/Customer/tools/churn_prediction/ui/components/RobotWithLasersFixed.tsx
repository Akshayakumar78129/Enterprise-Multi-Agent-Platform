import React, { useState, useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  label: string;
  value: any;
  chartType?: string;
  element?: HTMLElement;
  originalEvent?: MouseEvent;
}

export const RobotWithLasersFixed: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<Point[]>([]);
  const [robotPosition, setRobotPosition] = useState({ left: -70, bottom: 100 });
  const [bubbleText, setBubbleText] = useState('');
  const [bubbleType, setBubbleType] = useState<'speaking' | 'thinking'>('speaking');
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  const robotRef = useRef<HTMLDivElement>(null);
  const pointerContainerRef = useRef<HTMLDivElement>(null);

  // Track Shift key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
      if (e.key === 'Escape') {
        clearRobot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // CSS Styles as JavaScript object
  const styles = {
    character: {
      width: '44px',
      height: '65px',
      position: 'fixed' as const,
      bottom: `${robotPosition.bottom}px`,
      left: `${robotPosition.left}px`,
      zIndex: 1100,
      transition: 'left 1.2s cubic-bezier(0.4, 0, 0.2, 1), bottom 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
      display: isVisible ? 'block' : 'none',
      pointerEvents: 'none' as const
    },
    characterPart: {
      backgroundColor: '#b0bec5',
      border: '2px solid #546e7a',
      position: 'absolute' as const,
      boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)'
    },
    head: {
      width: '24px',
      height: '20px',
      top: '-2px',
      left: '10px',
      zIndex: 1,
      borderRadius: '8px 8px 4px 4px'
    },
    visor: {
      width: '16px',
      height: '6px',
      top: '2px',
      left: '14px',
      zIndex: 2,
      backgroundColor: '#00e5ff',
      border: '1px solid #00a3b3',
      boxShadow: '0 0 6px 1px #00e5ff',
      borderRadius: '3px',
      animation: 'visorGlow 2s ease-in-out infinite'
    },
    body: {
      width: '30px',
      height: '40px',
      bottom: '0',
      left: '7px',
      borderRadius: '4px'
    },
    arm: {
      width: '7px',
      height: '30px',
      bottom: '5px',
      zIndex: -1,
      borderRadius: '3px'
    },
    armLeft: {
      left: '-2px'
    },
    armRight: {
      right: '-2px'
    },
    leg: {
      width: '8px',
      height: '20px',
      bottom: '-22px',
      zIndex: -1,
      borderRadius: '0 0 4px 4px'
    },
    legLeft: {
      left: '9px'
    },
    legRight: {
      right: '9px'
    },
    pointerContainer: {
      position: 'absolute' as const,
      top: '18px',
      left: '50%',
      width: '1px',
      height: '1px',
      transform: 'translateX(-50%)',
      pointerEvents: 'none' as const,
      zIndex: 1
    },
    laser: {
      position: 'absolute' as const,
      bottom: '0',
      left: '50%',
      width: '3px',
      transformOrigin: 'bottom center',
      transform: 'translateX(-50%) rotate(0deg)',
      borderRadius: '2px 2px 0 0',
      pointerEvents: 'none' as const
    },
    laserGreen: {
      background: 'linear-gradient(to top, rgba(57, 255, 20, 0.1), #39ff14)',
      boxShadow: '0 0 8px 2px #39ff14',
      animation: 'laserPulse 1.5s ease-in-out infinite'
    },
    bubble: {
      position: 'absolute' as const,
      bottom: '105%',
      left: '50%',
      transform: 'translateX(-50%)',
      minWidth: '200px',
      maxWidth: '350px',
      padding: '12px 16px',
      borderRadius: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      border: '2px solid #00e5ff',
      color: '#1a1a2e',
      fontSize: '13px',
      lineHeight: '1.5',
      textAlign: 'left' as const,
      boxShadow: '0 4px 20px rgba(0, 229, 255, 0.4)',
      opacity: bubbleText ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out',
      pointerEvents: 'auto' as const,
      zIndex: 60,
      whiteSpace: 'pre-wrap' as const,
      fontFamily: 'Inter, sans-serif'
    },
    bubbleThinking: {
      borderStyle: 'dashed',
      borderColor: '#39ff14',
      boxShadow: '0 4px 20px rgba(57, 255, 20, 0.4)'
    },
    bubbleSpeaking: {
      borderStyle: 'solid',
      borderColor: '#00e5ff',
      boxShadow: '0 4px 20px rgba(0, 229, 255, 0.4)'
    },
    bubbleTriangle: {
      content: '""',
      position: 'absolute' as const,
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 0,
      height: 0,
      borderLeft: '8px solid transparent',
      borderRight: '8px solid transparent',
      borderTop: '8px solid #00e5ff'
    },
    sendToChatButton: {
      marginTop: '10px',
      padding: '6px 12px',
      background: 'linear-gradient(135deg, #00e5ff, #0099ff)',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600',
      width: '100%',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(0, 229, 255, 0.3)'
    },
    shiftIndicator: {
      position: 'fixed' as const,
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #39ff14, #00e5ff)',
      color: '#1a1a2e',
      padding: '8px 20px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      zIndex: 1050,
      boxShadow: '0 4px 20px rgba(57, 255, 20, 0.5)',
      animation: 'pulse 1.5s ease-in-out infinite'
    }
  };

  // Clear robot function
  const clearRobot = () => {
    setIsVisible(false);
    setSelectedPoints([]);
    setBubbleText('');
    setRobotPosition({ left: -70, bottom: 100 });
  };

  // Build intelligent insights for single or multiple points
  const buildInsight = (points: Point[]) => {
    if (points.length === 0) return '';
    
    if (points.length === 1) {
      const point = points[0];
      return `📊 **${point.label}**\nValue: ${point.value}\n${point.chartType ? `Source: ${point.chartType}` : ''}\n\n💡 Click "Send to Chat" to discuss this data point in detail.`;
    } else {
      // Multiple points - provide comparison insights
      let insight = `📊 **Analyzing ${points.length} Data Points**\n\n`;
      
      // List all points
      points.forEach((point, idx) => {
        insight += `${idx + 1}. ${point.label}: ${point.value}\n`;
      });
      
      // Add comparison insights
      insight += '\n💡 **Insights:**\n';
      
      // Try to find patterns or comparisons
      const values = points.map(p => {
        const numValue = typeof p.value === 'string' ? 
          parseFloat(p.value.replace(/[^0-9.-]/g, '')) : p.value;
        return isNaN(numValue) ? 0 : numValue;
      });
      
      if (values.length > 1 && values.every(v => !isNaN(v))) {
        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const maxPoint = points[values.indexOf(max)];
        const minPoint = points[values.indexOf(min)];
        
        insight += `• Highest: ${maxPoint.label} (${maxPoint.value})\n`;
        insight += `• Lowest: ${minPoint.label} (${minPoint.value})\n`;
        insight += `• Average: ${avg.toFixed(1)}\n`;
        insight += `• Range: ${(max - min).toFixed(1)}\n`;
        
        // Add trend analysis if points seem sequential
        if (points.every(p => p.chartType === points[0].chartType)) {
          const trend = values[values.length - 1] > values[0] ? 'upward' : 'downward';
          insight += `• Trend: ${trend === 'upward' ? '📈' : '📉'} ${trend}\n`;
        }
      }
      
      insight += '\n🔄 Click "Send to Chat" to analyze these points together.';
      return insight;
    }
  };

  // Send context to chatbot
  const sendToChat = () => {
    if (selectedPoints.length === 0) return;
    
    // Prepare context for chatbot
    const context = {
      points: selectedPoints.map(p => ({
        label: p.label,
        value: p.value,
        chartType: p.chartType
      })),
      timestamp: new Date().toISOString(),
      analysisType: selectedPoints.length > 1 ? 'comparison' : 'single'
    };
    
    // Send to chatbot if available
    if (typeof window !== 'undefined') {
      // Send to Enhanced Context Aware Chatbot
      if ((window as any).addAIInsightToChat) {
        (window as any).addAIInsightToChat(context);
      }
      
      // Also trigger the chatbot to open if it has that function
      if ((window as any).openChatbot) {
        (window as any).openChatbot();
      }
      
      // Log for debugging
      console.log('Robot context sent to chatbot:', context);
    }
    
    // Show confirmation in bubble
    setBubbleText('✅ Context sent to chatbot!\n\nOpen the chat to continue the discussion.');
    setBubbleType('speaking');
    
    // Clear after 2 seconds
    setTimeout(() => {
      clearRobot();
    }, 2000);
  };

  // Make robot available globally with Shift key support
  useEffect(() => {
    (window as any).robotAddPoint = (pointData: {
      x?: number;
      y?: number;
      label?: string;
      value?: any;
      chartType?: string;
      element?: HTMLElement;
      originalEvent?: MouseEvent;
    }) => {
      // Only work with Shift key pressed
      const shiftPressed = pointData.originalEvent?.shiftKey || isShiftPressed;
      
      // If Shift is not pressed, don't show robot (let AI insight handle it)
      if (!shiftPressed) {
        return;
      }
      
      // Create point with accurate coordinates
      const point: Point = {
        x: pointData.x || (pointData.originalEvent?.clientX || window.innerWidth / 2),
        y: pointData.y || (pointData.originalEvent?.clientY || window.innerHeight / 2),
        label: pointData.label || 'Data Point',
        value: pointData.value || 0,
        chartType: pointData.chartType,
        element: pointData.element,
        originalEvent: pointData.originalEvent
      };

      // Handle multi-select with Shift (always true here since we checked above)
      if (true) {
        setSelectedPoints(prev => {
          // Check if point already exists (by label and value)
          const exists = prev.find(p => 
            p.label === point.label && 
            JSON.stringify(p.value) === JSON.stringify(point.value)
          );
          
          if (exists) {
            // Remove if already selected
            const newPoints = prev.filter(p => 
              !(p.label === point.label && 
                JSON.stringify(p.value) === JSON.stringify(point.value))
            );
            
            // Update insights
            setTimeout(() => {
              setBubbleText(buildInsight(newPoints));
              setBubbleType(newPoints.length > 1 ? 'thinking' : 'speaking');
            }, 100);
            
            return newPoints;
          } else {
            // Add new point
            const newPoints = [...prev, point];
            
            // Update insights
            setTimeout(() => {
              setBubbleText(buildInsight(newPoints));
              setBubbleType('thinking');
            }, 100);
            
            return newPoints;
          }
        });
      } else {
        // Single select (replace all)
        setSelectedPoints([point]);
        setBubbleText(buildInsight([point]));
        setBubbleType('speaking');
      }

      // Show robot if not visible
      if (!isVisible) {
        setIsVisible(true);
      }
      
      // Calculate optimal robot position
      const targetX = Math.min(point.x + 60, window.innerWidth - 100);
      const targetY = Math.max(100, window.innerHeight - point.y + 50);
      
      setRobotPosition({ 
        left: Math.max(10, targetX), 
        bottom: Math.min(window.innerHeight - 200, targetY)
      });
    };

    // Clear robot function
    (window as any).robotClear = clearRobot;

    return () => {
      delete (window as any).robotAddPoint;
      delete (window as any).robotClear;
    };
  }, [isShiftPressed, isVisible]);

  // Calculate laser transform for accurate pointing
  const calculateLaserTransform = (point: Point) => {
    if (!robotRef.current || !pointerContainerRef.current) {
      return { height: '0px', transform: 'translateX(-50%) rotate(0deg)' };
    }
    
    const containerRect = pointerContainerRef.current.getBoundingClientRect();
    const pointerOriginX = containerRect.left;
    const pointerOriginY = containerRect.top;
    
    const dx = point.x - pointerOriginX;
    const dy = point.y - pointerOriginY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180 / Math.PI) + 90;
    
    return {
      height: `${distance}px`,
      transform: `translateX(-50%) rotate(${angleDeg}deg)`
    };
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Add animations */}
      <style>{`
        @keyframes visorGlow {
          0%, 100% { box-shadow: 0 0 6px 1px #00e5ff; }
          50% { box-shadow: 0 0 12px 3px #00e5ff; }
        }
        @keyframes laserPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
        }
      `}</style>

      {/* Shift indicator */}
      {isShiftPressed && (
        <div style={styles.shiftIndicator}>
          ⇧ Shift+Click Mode - Click charts to select multiple points for comparison
        </div>
      )}

      {/* Robot container */}
      <div ref={robotRef} style={styles.character}>
        {/* Robot Parts */}
        <div style={{...styles.characterPart, ...styles.arm, ...styles.armLeft}} />
        <div style={{...styles.characterPart, ...styles.arm, ...styles.armRight}} />
        <div style={{...styles.characterPart, ...styles.leg, ...styles.legLeft}} />
        <div style={{...styles.characterPart, ...styles.leg, ...styles.legRight}} />
        <div style={{...styles.characterPart, ...styles.body}} />
        <div style={{...styles.characterPart, ...styles.head}} />
        <div style={styles.visor} />
        
        {/* Laser Pointer Container */}
        <div ref={pointerContainerRef} style={styles.pointerContainer}>
          {selectedPoints.map((point, idx) => {
            const laserStyle = calculateLaserTransform(point);
            return (
              <div
                key={`${point.label}-${idx}`}
                style={{
                  ...styles.laser,
                  ...styles.laserGreen,
                  height: laserStyle.height,
                  transform: laserStyle.transform
                }}
              />
            );
          })}
        </div>
        
        {/* Status Bubble with Send to Chat */}
        {bubbleText && (
          <div style={{
            ...styles.bubble,
            ...(bubbleType === 'thinking' ? styles.bubbleThinking : styles.bubbleSpeaking)
          }}>
            <div dangerouslySetInnerHTML={{ 
              __html: bubbleText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                               .replace(/\n/g, '<br>')
            }} />
            
            {/* Send to Chat Button */}
            <button
              onClick={sendToChat}
              style={styles.sendToChatButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 229, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 229, 255, 0.3)';
              }}
            >
              💬 Send to Chat for Discussion
            </button>
            
            <div style={styles.bubbleTriangle} />
          </div>
        )}
      </div>

      {/* Visual indicators for selected points */}
      {selectedPoints.map((point, idx) => (
        <div
          key={`indicator-${point.label}-${idx}`}
          style={{
            position: 'fixed',
            left: point.x - 8,
            top: point.y - 8,
            width: '16px',
            height: '16px',
            border: '2px solid #39ff14',
            borderRadius: '50%',
            backgroundColor: 'rgba(57, 255, 20, 0.2)',
            pointerEvents: 'none',
            zIndex: 1040,
            animation: 'pulse 1.5s ease-in-out infinite',
            boxShadow: '0 0 10px #39ff14'
          }}
        />
      ))}
    </>  );
};

export default RobotWithLasersFixed;