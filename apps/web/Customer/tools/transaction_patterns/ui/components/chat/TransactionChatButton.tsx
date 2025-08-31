import React, { useState, useEffect } from 'react';

interface TransactionChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
  hasNewMessage?: boolean;
  position?: 'bottom-right' | 'bottom-left';
}

const TransactionChatButton: React.FC<TransactionChatButtonProps> = ({
  onClick,
  isOpen,
  hasNewMessage = false,
  position = 'bottom-right'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  // Show pulse animation periodically when closed
  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(() => {
        setShowPulse(true);
        setTimeout(() => setShowPulse(false), 3000);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const positionStyles = {
    'bottom-right': { bottom: '30px', right: '30px' },
    'bottom-left': { bottom: '30px', left: '30px' }
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        ...positionStyles[position],
        width: isHovered ? 'auto' : '60px',
        height: '60px',
        padding: isHovered ? '16px 24px' : '0',
        background: 'linear-gradient(135deg, #00e0ff 0%, #e930ff 100%)',
        border: 'none',
        borderRadius: '50px',
        color: 'white',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        zIndex: 999,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovered
          ? '0 15px 40px rgba(0, 224, 255, 0.4), 0 0 60px rgba(233, 48, 255, 0.3)'
          : '0 10px 30px rgba(0, 224, 255, 0.3), 0 0 40px rgba(233, 48, 255, 0.2)',
        transform: isHovered ? 'translateY(-3px) scale(1.05)' : 'translateY(0) scale(1)',
        overflow: 'hidden'
      }}
      aria-label="Open Transaction Intelligence Chat"
    >
      {/* Pulse Animation */}
      {showPulse && !isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            borderRadius: '50px',
            background: 'linear-gradient(135deg, #00e0ff 0%, #e930ff 100%)',
            transform: 'translate(-50%, -50%)',
            animation: 'pulse 2s infinite',
            zIndex: -1
          }}
        />
      )}

      {/* New Message Indicator */}
      {hasNewMessage && !isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            width: '12px',
            height: '12px',
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            border: '2px solid white',
            animation: 'bounce 2s ease-in-out infinite'
          }}
        />
      )}

      {/* Icon */}
      <span
        style={{
          fontSize: isHovered ? '20px' : '24px',
          animation: isOpen ? 'none' : 'float 6s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </span>

      {/* Text (shown on hover) */}
      {isHovered && !isOpen && (
        <span
          style={{
            whiteSpace: 'nowrap',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          Transaction AI
        </span>
      )}

      {/* Styles */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.5;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </button>
  );
};

export default TransactionChatButton;