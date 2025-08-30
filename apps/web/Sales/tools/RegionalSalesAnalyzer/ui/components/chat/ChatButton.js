import React, { useState, useEffect } from 'react';

const ChatButton = ({ 
  onClick, 
  hasNewMessage = false, 
  isActive = false,
  messageCount = 0 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Show tooltip briefly when first loaded
    const timer = setTimeout(() => {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          backgroundColor: isActive ? '#1d4ed8' : '#3b82f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: isHovered 
            ? '0 8px 25px rgba(59, 130, 246, 0.4)' 
            : '0 4px 15px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          zIndex: 1001,
          border: '2px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Main Icon */}
        <div style={{
          fontSize: '24px',
          color: 'white',
          transition: 'transform 0.3s ease',
          transform: isActive ? 'rotate(45deg)' : 'rotate(0deg)'
        }}>
          {isActive ? '✕' : '🤖'}
        </div>

        {/* Notification Badge */}
        {hasNewMessage && messageCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '20px',
            height: '20px',
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white',
            border: '2px solid white',
            animation: 'pulse 2s infinite'
          }}>
            {messageCount > 9 ? '9+' : messageCount}
          </div>
        )}

        {/* Pulse Animation Ring */}
        {hasNewMessage && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            right: '-4px',
            bottom: '-4px',
            borderRadius: '50%',
            border: '2px solid #3b82f6',
            animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            opacity: 0.75
          }} />
        )}
      </div>

      {/* Tooltip */}
      {(showTooltip || isHovered) && !isActive && (
        <div style={{
          position: 'fixed',
          bottom: '85px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          zIndex: 1002,
          backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.3s ease',
          pointerEvents: 'none'
        }}>
          🤖 Ask AI about regional sales
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            right: '20px',
            width: '8px',
            height: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            transform: 'rotate(45deg)'
          }} />
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default ChatButton;