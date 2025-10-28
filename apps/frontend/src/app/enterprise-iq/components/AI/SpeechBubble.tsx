import React, { useEffect, useState, useCallback } from 'react';

// Z-Index hierarchy system
const Z_INDEX = {
  ROBOT: 50,
  SPEECH_BUBBLE: 100,
  AUDIO_CONTROLS: 200,
  CANVAS_BASE: 300,
  COMPONENTS_BASE: 1000,
  COMPONENTS_SELECTED: 2000,
  FULLSCREEN: 5000,
  FULLSCREEN_CONTROLS: 5001
};

interface SpeechBubbleProps {
  anchorElement: HTMLElement | null;
  message: string;
  isThinking?: boolean;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  anchorElement,
  message,
  isThinking = false,
  position = 'right',
}) => {
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0 });

  const updatePosition = useCallback(() => {
    if (!anchorElement) return;

    const rect = anchorElement.getBoundingClientRect();
    let x = rect.left;
    let y = rect.top;

    // Adjust position based on specified direction
    switch (position) {
      case 'right':
        x = rect.right + 10;
        y = rect.top + rect.height / 2;
        break;
      case 'left':
        x = rect.left - 10;
        y = rect.top + rect.height / 2;
        break;
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top - 10;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom + 10;
        break;
    }

    setBubblePosition({ x, y });
  }, [anchorElement, position]);

  useEffect(() => {
    if (!anchorElement) return;

    updatePosition();
    // Update position on window resize/scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [updatePosition]);

  if (!message || !anchorElement) return null;

  const bubbleStyles: React.CSSProperties = {
    position: 'fixed',
    left: `${bubblePosition.x}px`,
    top: `${bubblePosition.y}px`,
    transform: position === 'right' ? 'translateY(-50%)' :
               position === 'left' ? 'translate(-100%, -50%)' :
               position === 'top' ? 'translate(-50%, -100%)' :
               'translate(-50%, 0)',
    backgroundColor: '#ffffff',
    border: '2px solid #e0d9f2',
    borderRadius: '12px',
    padding: '12px 16px',
    maxWidth: '500px',
    maxHeight: '600px',
    overflow: 'auto',
    boxShadow: '0 4px 16px rgba(183, 148, 244, 0.15)',
    zIndex: Z_INDEX.SPEECH_BUBBLE,  // Below graphs (1000+) but above robot (50)
    fontSize: '14px',
    color: '#4a5568',
    animation: isThinking ? 'bubbleThinking 2s infinite' : 'bubbleAppear 0.3s ease-out',
  };

  // Tail/pointer styles
  const tailStyles: React.CSSProperties = {
    position: 'absolute',
    width: '0',
    height: '0',
    borderStyle: 'solid',
    borderWidth: position === 'right' ? '8px 12px 8px 0' :
                position === 'left' ? '8px 0 8px 12px' :
                position === 'top' ? '0 8px 12px 8px' :
                '12px 8px 0 8px',
    borderColor: position === 'right' ? `transparent #e0d9f2 transparent transparent` :
                 position === 'left' ? `transparent transparent transparent #e0d9f2` :
                 position === 'top' ? `transparent transparent #e0d9f2 transparent` :
                 `#e0d9f2 transparent transparent transparent`,
    left: position === 'right' ? '-11px' :
          position === 'left' ? 'auto' :
          '50%',
    right: position === 'left' ? '-11px' : 'auto',
    top: position === 'right' || position === 'left' ? '50%' :
         position === 'top' ? 'auto' :
         '-11px',
    bottom: position === 'top' ? '-11px' : 'auto',
    transform: position === 'right' || position === 'left' ? 'translateY(-50%)' :
               position === 'top' || position === 'bottom' ? 'translateX(-50%)' :
               'none',
  };

  const tailInnerStyles: React.CSSProperties = {
    ...tailStyles,
    borderWidth: position === 'right' ? '6px 9px 6px 0' :
                position === 'left' ? '6px 0 6px 9px' :
                position === 'top' ? '0 6px 9px 6px' :
                '9px 6px 0 6px',
    borderColor: position === 'right' ? `transparent #ffffff transparent transparent` :
                 position === 'left' ? `transparent transparent transparent #ffffff` :
                 position === 'top' ? `transparent transparent #ffffff transparent` :
                 `#ffffff transparent transparent transparent`,
    left: position === 'right' ? '-8px' :
          position === 'left' ? 'auto' :
          tailStyles.left,
    right: position === 'left' ? '-8px' : tailStyles.right,
    top: position === 'right' || position === 'left' ? tailStyles.top :
         position === 'top' ? 'auto' :
         '-8px',
    bottom: position === 'top' ? '-8px' : tailStyles.bottom,
  };

  return (
    <div style={bubbleStyles}>
      {/* Tail/pointer */}
      <div style={tailStyles} />
      <div style={tailInnerStyles} />
      
      {/* Message content */}
      {isThinking ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{message}</span>
          <span className="thinking-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      ) : (
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{message}</div>
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes bubbleAppear {
          0% {
            opacity: 0;
            transform: ${position === 'right' ? 'translateY(-50%) scale(0.8)' :
                        position === 'left' ? 'translate(-100%, -50%) scale(0.8)' :
                        position === 'top' ? 'translate(-50%, -100%) scale(0.8)' :
                        'translate(-50%, 0) scale(0.8)'};
          }
          100% {
            opacity: 1;
            transform: ${position === 'right' ? 'translateY(-50%) scale(1)' :
                        position === 'left' ? 'translate(-100%, -50%) scale(1)' :
                        position === 'top' ? 'translate(-50%, -100%) scale(1)' :
                        'translate(-50%, 0) scale(1)'};
          }
        }

        @keyframes bubbleThinking {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }

        .thinking-dots span {
          display: inline-block;
          animation: dotBounce 1.4s infinite ease-in-out both;
          color: #b794f4;
        }

        .thinking-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .thinking-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes dotBounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SpeechBubble;
