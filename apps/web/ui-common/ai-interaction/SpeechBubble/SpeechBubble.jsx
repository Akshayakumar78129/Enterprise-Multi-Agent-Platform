import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../design-system/theme';
import { Markdown } from '../../markdown';

/**
 * SpeechBubble Component
 * 
 * Displays speech or thought bubbles for the robot character with
 * automatic positioning, animations, and styling.
 * 
 * Features:
 * - Automatically positions relative to anchor element
 * - Different styling for speech vs thought bubbles
 * - Typing animation for text appearance
 * - Arrow pointing to source
 * - Fading in/out animations
 */
export const SpeechBubble = ({
  message,
  anchorElement, // DOM element to position relative to (robot)
  position = 'right', // 'right', 'left', 'top', 'bottom'
  positionCoords, // Alternative to anchorElement: direct {x, y} coordinates
  isThinking = false, // true for thought bubble, false for speech
  maxWidth = 300,
  autoClose = false, // auto-close after duration
  closeDuration = 5000, // ms to stay open if autoClose
  onClose = () => {}, // callback when bubble closes
}) => {
  const theme = useTheme();
  const bubbleRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  // Typing animation for text
  // useEffect(() => {
  //   if (!message) return;
    
  //   // For very long messages (over 500 chars), skip typing animation to avoid corruption
  //   if (message.length > 500) {
  //     setDisplayText(message);
  //     setIsTyping(false);
  //     return;
  //   }
    
  //   setDisplayText('');
  //   setIsTyping(true);
    
  //   let index = 0;
  //   const messageLength = message.length;
    
  //   const typingInterval = setInterval(() => {
  //     setDisplayText(prev => {
  //       const nextChar = message.charAt(index);
  //       index++;
  //       return prev + nextChar;
  //     });
      
  //     if (index >= messageLength) {
  //       clearInterval(typingInterval);
  //       setIsTyping(false);
  //     }
  //   }, 25); // Slower typing speed for better visibility
    
  //   return () => clearInterval(typingInterval);
  // }, [message]);
  
  // Set position directly if positionCoords are provided
  useEffect(() => {
    if (positionCoords) {
      setBubblePosition({ top: positionCoords.y, left: positionCoords.x });
      setTimeout(() => {
        setIsVisible(true);
      }, 10);
    }
  }, [positionCoords]);
  
  // Calculate position based on anchor element
  useEffect(() => {
    if (!anchorElement || !bubbleRef.current || positionCoords) return;
    
    const calculatePosition = () => {
      // Add null checks before calling getBoundingClientRect
      if (!anchorElement || !bubbleRef.current) return;
      
      const anchorRect = anchorElement.getBoundingClientRect();
      const bubbleRect = bubbleRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;
      
      // Position based on specified direction
      switch (position) {
        case 'right':
          top = anchorRect.top + (anchorRect.height / 2) - (bubbleRect.height / 2);
          left = anchorRect.right + 15; // 15px gap
          break;
        case 'left':
          top = anchorRect.top + (anchorRect.height / 2) - (bubbleRect.height / 2);
          left = anchorRect.left - bubbleRect.width - 15;
          break;
        case 'top':
          top = anchorRect.top - bubbleRect.height - 15;
          left = anchorRect.left + (anchorRect.width / 2) - (bubbleRect.width / 2);
          break;
        case 'bottom':
          top = anchorRect.bottom + 15;
          left = anchorRect.left + (anchorRect.width / 2) - (bubbleRect.width / 2);
          break;
        default:
          top = anchorRect.top - bubbleRect.height - 15;
          left = anchorRect.left + (anchorRect.width / 2) - (bubbleRect.width / 2);
      }
      
      // Check if bubble goes off screen and adjust
      const rightEdge = left + bubbleRect.width;
      const bottomEdge = top + bubbleRect.height;
      
      if (rightEdge > window.innerWidth - 20) {
        left = window.innerWidth - bubbleRect.width - 20;
      }
      
      if (left < 20) {
        left = 20;
      }
      
      if (bottomEdge > window.innerHeight - 20) {
        top = window.innerHeight - bubbleRect.height - 20;
      }
      
      if (top < 20) {
        top = 20;
      }
      
      setBubblePosition({ top, left });
    };
    
    // Animate appearance
    setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, 10);
    
    // Adjust position on window resize
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [anchorElement, position, positionCoords]);
  
  // Handle auto-close
  useEffect(() => {
    if (autoClose && !isTyping) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onClose();
        }, 300); // After fade out animation
      }, closeDuration);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, closeDuration, isTyping, onClose]);
  
  // Bubble styles based on type (speech vs thought)
  const getBubbleStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: `${bubblePosition.top}px`,
      left: `${bubblePosition.left}px`,
      maxWidth: `${maxWidth}px`,
      backgroundColor: isThinking ? theme.colors.graphiteLight : theme.colors.cloudWhite,
      color: theme.colors.midnightNavy,
      padding: '12px 16px',
      borderRadius: '18px',
      boxShadow: theme.shadows.lg,
      border: `2px solid ${isThinking ? theme.colors.graphiteLight : theme.colors.electricCyan}`,
      zIndex: theme.zIndex[50],
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: '14px',
      lineHeight: '1.5',
    };
    
    const arrowStyles = {
      position: 'absolute',
    };
    
    // Add arrow based on position
    switch (position) {
      case 'right':
        arrowStyles.left = '-10px';
        arrowStyles.top = '50%';
        arrowStyles.marginTop = '-10px';
        arrowStyles.borderTop = '10px solid transparent';
        arrowStyles.borderBottom = '10px solid transparent';
        arrowStyles.borderRight = `10px solid ${isThinking ? theme.colors.graphiteLight : theme.colors.electricCyan}`;
        break;
      case 'left':
        arrowStyles.right = '-10px';
        arrowStyles.top = '50%';
        arrowStyles.marginTop = '-10px';
        arrowStyles.borderTop = '10px solid transparent';
        arrowStyles.borderBottom = '10px solid transparent';
        arrowStyles.borderLeft = `10px solid ${isThinking ? theme.colors.graphiteLight : theme.colors.electricCyan}`;
        break;
      case 'top':
        arrowStyles.bottom = '-10px';
        arrowStyles.left = '50%';
        arrowStyles.marginLeft = '-10px';
        arrowStyles.borderLeft = '10px solid transparent';
        arrowStyles.borderRight = '10px solid transparent';
        arrowStyles.borderTop = `10px solid ${isThinking ? theme.colors.graphiteLight : theme.colors.electricCyan}`;
        break;
      case 'bottom':
        arrowStyles.top = '-10px';
        arrowStyles.left = '50%';
        arrowStyles.marginLeft = '-10px';
        arrowStyles.borderLeft = '10px solid transparent';
        arrowStyles.borderRight = '10px solid transparent';
        arrowStyles.borderBottom = `10px solid ${isThinking ? theme.colors.graphiteLight : theme.colors.electricCyan}`;
        break;
      default:
        arrowStyles.left = '-10px';
        arrowStyles.top = '50%';
        arrowStyles.marginTop = '-10px';
        arrowStyles.borderTop = '10px solid transparent';
        arrowStyles.borderBottom = '10px solid transparent';
        arrowStyles.borderRight = `10px solid ${isThinking ? theme.colors.graphiteLight : theme.colors.electricCyan}`;
    }
    
    return { bubbleStyles: baseStyles, arrowStyles };
  };
  
  // Get text styles based on thinking state
  const getTextStyles = () => {
    if (isThinking) {
      return {
        fontStyle: 'italic',
        color: `${theme.colors.cloudWhite}`,
      };
    }
    
    return {
      fontWeight: 500,
    };
  };
  
  if (!message) return null;
  
  const { bubbleStyles, arrowStyles } = getBubbleStyles();
  
  return (
    <div ref={bubbleRef} style={bubbleStyles}>
      <div className="bubble-arrow" style={arrowStyles} />
      <div style={getTextStyles()}>
        <Markdown>{message}</Markdown>
        {/* {isTyping && <span className="typing-cursor">|</span>} */}
      </div>
      
      {/* Thought bubble dots for thinking */}
      {isThinking && (
        <div className="thinking-dots" style={{ marginTop: '8px', textAlign: 'center' }}>
          <span className="dot dot1">•</span>
          <span className="dot dot2">•</span>
          <span className="dot dot3">•</span>
        </div>
      )}
      
      {/* Typing cursor animation */}
      <style jsx global>{`
        .typing-cursor {
          display: inline-block;
          width: 2px;
          height: 16px;
          background-color: ${theme.colors.midnightNavy};
          margin-left: 2px;
          animation: blink 0.7s infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .thinking-dots .dot {
          display: inline-block;
          margin: 0 2px;
          opacity: 0.7;
        }
        
        .dot1 { animation: pulseDot 1s infinite; animation-delay: 0s; }
        .dot2 { animation: pulseDot 1s infinite; animation-delay: 0.2s; }
        .dot3 { animation: pulseDot 1s infinite; animation-delay: 0.4s; }
        
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.5); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SpeechBubble; 