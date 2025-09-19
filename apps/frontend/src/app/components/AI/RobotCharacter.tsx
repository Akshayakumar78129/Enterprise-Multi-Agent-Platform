import React, { useState, useRef, useEffect } from 'react';
import { LaserPointer } from './LaserPointer';
import { SpeechBubble } from './SpeechBubble';

interface RobotCharacterProps {
  initialPosition?: { x: number; y: number };
  laserTarget?: { x: number; y: number } | null;
  isVisible?: boolean;
  message?: string | null;
  state?: 'idle' | 'thinking' | 'speaking' | 'pointing' | 'error';
  laserColor?: 'red' | 'green';
  className?: string;
  onQuerySubmit?: (query: string, selectedPoints: any[]) => void;
  userSelectedPoints?: any[];
}

export const RobotCharacter: React.FC<RobotCharacterProps> = ({
  initialPosition = { x: 20, y: 20 },
  laserTarget = null,
  isVisible = true,
  message = null,
  state = 'idle',
  laserColor = 'red',
  className = '',
  onQuerySubmit,
  userSelectedPoints = [],
}) => {
  // Soft pastel theme colors for robot
  const robotThemeColors = {
    body: '#f0edf5',       // Light lavender
    accent: '#b794f4',     // Soft purple (primary)
    border: '#d0b9f2',     // Light purple border
    visorText: '#9f7aea',  // Medium purple
    eye: '#4a5568',        // Dark gray for contrast
  };

  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const robotRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for user interactions
  const [currentSelectedPoints, setCurrentSelectedPoints] = useState<any[]>([]);
  const [contextSummaryMessage, setContextSummaryMessage] = useState('');
  const [queryInputValue, setQueryInputValue] = useState('');
  
  // Used to calculate the robot's "eye" position for laser origin
  const getRobotEyePosition = () => {
    if (!robotRef.current) return { x: 0, y: 0 };
    
    const robotRect = robotRef.current.getBoundingClientRect();
    // Return the center of the robot head area for laser origin
    return {
      x: robotRect.left + (robotRect.width / 2),
      y: robotRect.top + (robotRect.height / 3), // Approximately where the visor/eye would be
    };
  };
  
  // Handle mouse down on robot (start dragging)
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!robotRef.current) return;
    
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    
    const robotRect = robotRef.current.getBoundingClientRect();
    setDragOffset({
      x: clientX - robotRect.left,
      y: clientY - robotRect.top,
    });
    
    setIsDragging(true);
    e.preventDefault();
  };
  
  // Handle mouse move (continue dragging)
  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current || !robotRef.current) return;
    
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = clientX - dragOffset.x - containerRect.left;
    const newY = clientY - dragOffset.y - containerRect.top;
    
    // Make sure robot stays within bounds
    const robotWidth = robotRef.current.offsetWidth;
    const robotHeight = robotRef.current.offsetHeight;
    
    const boundedX = Math.max(20, Math.min(newX, containerRect.width - robotWidth - 20));
    const boundedY = Math.max(20, Math.min(newY, containerRect.height - robotHeight - 20));
    
    setPosition({ x: boundedX, y: boundedY });
  };
  
  // Handle mouse up (end dragging)
  const handleMouseUp = () => {
    if (isDragging && robotRef.current && containerRef.current) {
      // Update position state when drag ends to ensure laser tracking
      const robotRect = robotRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const newPosition = {
        x: robotRect.left - containerRect.left,
        y: robotRect.top - containerRect.top
      };
      
      setPosition(newPosition);
    }
    setIsDragging(false);
  };
  
  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('touchend', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragOffset]);
  
  // Handle laser pointer logic
  const [laserOrigin, setLaserOrigin] = useState({ x: 0, y: 0 });
  
  // Update laser origin when position changes or robot becomes visible
  useEffect(() => {
    if (isVisible && robotRef.current) {
      const updateOrigin = () => {
        setLaserOrigin(getRobotEyePosition());
      };
      
      // Update immediately
      updateOrigin();
      
      // Set up regular updates while robot is visible and pointing
      const intervalId = setInterval(updateOrigin, 100);
      
      return () => clearInterval(intervalId);
    }
  }, [position, isVisible, state]);
  
  // Update internal selected points and context message when prop changes
  useEffect(() => {
    console.log('RobotCharacter: userSelectedPoints prop changed:', userSelectedPoints);
    setCurrentSelectedPoints(userSelectedPoints);
    if (userSelectedPoints && userSelectedPoints.length > 0) {
      console.log('RobotCharacter: Setting context summary for', userSelectedPoints.length, 'points');
      setContextSummaryMessage(buildContextSummary(userSelectedPoints));
    } else {
      console.log('RobotCharacter: Clearing context summary');
      setContextSummaryMessage('');
    }
  }, [userSelectedPoints]);
  
  // Robot appearance based on state
  const getRobotStyles = () => {
    const baseStyles: React.CSSProperties = {
      width: '44px',
      height: '65px',
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      cursor: isDragging ? 'grabbing' : 'grab',
      zIndex: 60,
      transition: isDragging ? 'none' : 'all 0.3s ease',
    };
    
    // Additional styles based on state
    if (state === 'thinking') {
      return {
        ...baseStyles,
        animation: 'robotThinking 1s infinite alternate',
      };
    }
    
    if (state === 'speaking') {
      return {
        ...baseStyles,
        animation: 'robotSpeaking 0.5s infinite alternate',
      };
    }
    
    if (state === 'pointing') {
      return {
        ...baseStyles,
        animation: 'robotPointing 0.3s ease-out 1 forwards',
      };
    }
    
    return baseStyles;
  };
  
  // Don't render if not visible
  if (!isVisible) return null;
  
  // Helper function to build context summary
  const buildContextSummary = (points: any[]) => {
    if (!points || points.length === 0) return '';
    let summary = "Context:\n";
    summary += points.map(p => {
      const chartLabel = p.chartLabel || `Chart ${p.chartId || ''}`;
      const pointLabel = p.label || `Index ${p.index}`;
      const pointValue = p.value !== undefined ? p.value : '';
      return `• ${chartLabel} | ${pointLabel}: ${pointValue}`;
    }).join('\n');
    return summary;
  };

  const handleQueryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryInputValue(e.target.value);
  };

  const handleSendQuery = () => {
    if (onQuerySubmit && queryInputValue.trim()) {
      onQuerySubmit(queryInputValue, currentSelectedPoints);
      setQueryInputValue('');
      // Optionally, clear selections or change state after query
      setCurrentSelectedPoints([]); 
      setContextSummaryMessage('');
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
      {/* Robot Character */}
      <div
        ref={robotRef}
        className={`robot-character ${className}`}
        style={getRobotStyles()}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <svg viewBox="0 0 44 65" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'auto' }}>
          {/* Robot Body Parts styled with soft pastel colors */}
          {/* Main Body */}
          <rect x="7" y="25" width="30" height="40" rx="6" fill={robotThemeColors.body} stroke={robotThemeColors.border} strokeWidth="2" />
          
          {/* Head */}
          <rect x="10" y="3" width="24" height="20" rx="5" fill={robotThemeColors.body} stroke={robotThemeColors.border} strokeWidth="2" />
          
          {/* Visor - using accent for fill */}
          <rect x="14" y="7" width="16" height="6" rx="2" fill={robotThemeColors.accent} stroke={robotThemeColors.visorText} strokeWidth="1" opacity="0.8" />
          
          {/* Arms - smaller rectangles on the sides of the body */}
          <rect x="0" y="30" width="7" height="30" rx="3" fill={robotThemeColors.body} stroke={robotThemeColors.border} strokeWidth="2" />
          <rect x="37" y="30" width="7" height="30" rx="3" fill={robotThemeColors.body} stroke={robotThemeColors.border} strokeWidth="2" />

          {/* Legs - smaller rectangles below the body */}
          <rect x="9" y="63" width="8" height="20" rx="3" transform="translate(0 -18)" fill={robotThemeColors.body} stroke={robotThemeColors.border} strokeWidth="2" />
          <rect x="27" y="63" width="8" height="20" rx="3" transform="translate(0 -18)" fill={robotThemeColors.body} stroke={robotThemeColors.border} strokeWidth="2" />

          {/* Antenna */}
          <rect x="20" y="0" width="4" height="5" rx="2" fill={robotThemeColors.body} />
          <circle 
            cx="22" 
            cy="2" 
            r="2"
            fill={state === 'thinking' || state === 'speaking' ? robotThemeColors.accent : robotThemeColors.body} 
            stroke={robotThemeColors.border}
            strokeWidth="0.5"
          />
          
          {/* Eye */}
          <circle cx="22" cy="12" r="4" fill={robotThemeColors.eye} opacity="0.3" />
          <circle 
            cx="22" 
            cy="12" 
            r="2" 
            fill={laserColor === 'red' ? '#fc8181' : '#9ae6b4'} 
          />

          {/* Body details */}
          <rect x="14" y="30" width="16" height="6" rx="2" fill={robotThemeColors.accent} opacity="0.3" />
          <circle cx="17" cy="40" r="2" fill={robotThemeColors.accent} opacity="0.5" />
          <circle cx="22" cy="40" r="2" fill={robotThemeColors.accent} opacity="0.5" />
          <circle cx="27" cy="40" r="2" fill={robotThemeColors.accent} opacity="0.5" />
        </svg>
      </div>
      
      {/* AI Laser Pointer - Hide if user has selected points */}
      {state === 'pointing' && laserTarget && (!currentSelectedPoints || currentSelectedPoints.length === 0) && (
        <LaserPointer 
          origin={laserOrigin}
          target={laserTarget}
          color="#fc8181" // Soft red for AI laser
          pulsing={state === 'pointing'}
          width={3}
        />
      )}
      
      {/* USER Selected Points Lasers (Multiple Green Lasers) */}
      {currentSelectedPoints && currentSelectedPoints.length > 0 && currentSelectedPoints.map((point, idx) => {
        console.log(`RobotCharacter: Rendering laser ${idx} for point:`, point, 'from origin:', laserOrigin, 'to target:', point.targetCoords);
        return (
          <LaserPointer
            key={`user-laser-${idx}`}
            origin={laserOrigin} 
            target={point.targetCoords}
            color="#9ae6b4" // Soft green for user selections
            pulsing={false}
            width={3}
          />
        );
      })}
      
      {/* Speech Bubble */}
      {(state === 'speaking' || state === 'thinking' || (currentSelectedPoints && currentSelectedPoints.length > 0)) && (message || contextSummaryMessage) && (
        <SpeechBubble
          anchorElement={robotRef.current}
          message={message || contextSummaryMessage}
          isThinking={state === 'thinking' || (currentSelectedPoints && currentSelectedPoints.length > 0 && !message)}
          position="right"
        />
      )}
      
      {/* Global styles for animations */}
      <style jsx>{`
        @keyframes robotThinking {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(2px) rotate(3deg); }
        }
        
        @keyframes robotSpeaking {
          0% { transform: translateY(0px); }
          100% { transform: translateY(2px); }
        }
        
        @keyframes robotPointing {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Query Input Area - Shown when 'thinking' or context is available */}
      {(state === 'thinking' || (currentSelectedPoints && currentSelectedPoints.length > 0)) && (
        <div 
          style={{
            position: 'absolute',
            bottom: '-70px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            zIndex: 70,
            backgroundColor: '#ffffff',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #e0d9f2',
            display: 'flex',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(183, 148, 244, 0.1)',
          }}
        >
          <input 
            type="text" 
            value={queryInputValue}
            onChange={handleQueryInputChange}
            placeholder="Ask about context..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendQuery()}
            style={{
              width: '100%',
              padding: '8px 10px',
              backgroundColor: '#f8f7fa',
              border: '1px solid #e0d9f2',
              borderRadius: '4px',
              color: '#4a5568',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <button 
            onClick={handleSendQuery}
            style={{
              padding: '8px 12px',
              background: '#b794f4',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
};

export default RobotCharacter;
