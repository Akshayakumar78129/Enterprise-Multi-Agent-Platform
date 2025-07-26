import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../design-system/theme';
import { LaserPointer } from '../LaserPointer/LaserPointer';
import { SpeechBubble } from '../SpeechBubble/SpeechBubble';

/**
 * Robot Character Component
 * 
 * A draggable robot assistant that can interact with charts and provide explanations.
 * Features:
 * - Draggable character that can be positioned anywhere on screen
 * - Laser pointer capability for pointing at chart elements
 * - Speech bubble for showing explanations or thoughts
 * - Different states: idle, thinking, speaking, pointing
 */
export const RobotCharacter = ({
  initialPosition = { x: 20, y: 20 },
  laserTarget = null,
  isVisible = true,
  message = null,
  state = 'idle', // 'idle', 'thinking', 'speaking', 'pointing'
  laserColor = 'red', // 'red' for AI, 'green' for user
  className = '',
  onQuerySubmit, // New prop for handling submitted queries
  userSelectedPoints = [], // New prop for user-selected data points
}) => {
  const theme = useTheme();

  // Define robot part colors based on the HTML neon theme
  const robotThemeColors = {
    body: '#b0bec5',       // --robot-body
    accent: '#00e5ff',     // --robot-accent / --neon-blue
    border: '#546e7a',     // --robot-border
    visorText: '#00a3b3', // from HTML .character-visor border
    // Add other colors if needed for consistency with HTML, e.g., eye details.
    // For now, existing theme.colors will be used for some parts like the eye pupil.
  };

  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const robotRef = useRef(null);
  const containerRef = useRef(null);
  
  // State for user interactions
  const [currentSelectedPoints, setCurrentSelectedPoints] = useState([]);
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
  const handleMouseDown = (e) => {
    if (!robotRef.current) return;
    
    const robotRect = robotRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - robotRect.left,
      y: e.clientY - robotRect.top,
    });
    
    setIsDragging(true);
    e.preventDefault();
  };
  
  // Handle mouse move (continue dragging)
  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - dragOffset.x - containerRect.left;
    const newY = e.clientY - dragOffset.y - containerRect.top;
    
    // Make sure robot stays within bounds (independent of zoom/pan)
    const robotWidth = robotRef.current.offsetWidth;
    const robotHeight = robotRef.current.offsetHeight;
    
    const boundedX = Math.max(20, Math.min(newX, containerRect.width - robotWidth - 20));
    const boundedY = Math.max(20, Math.min(newY, containerRect.height - robotHeight - 20));
    
    setPosition({ x: boundedX, y: boundedY });
  };
  
  // Handle mouse up (end dragging)
  const handleMouseUp = () => {
    if (isDragging && robotRef.current) {
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
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
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
    const baseStyles = {
      width: '44px',
      height: '65px',
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      cursor: 'move',
      zIndex: theme.zIndex[60],
      transition: isDragging ? 'none' : theme.transitions.robot.movement,
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
  
  // Helper function to build context summary (adapted from provided HTML)
  const buildContextSummary = (points) => {
    if (!points || points.length === 0) return ''; // Return empty if no points, parent can decide 'Listening...'
    let summary = "Context:\n";
    summary += points.map(p => {
      // Assuming point 'p' has: chartId, index, datasetIndex, label, value, (and chartRegistry is accessible or data is passed in)
      // For now, we'll use a simplified version. This needs to be adapted to your actual data structure.
      const chartLabel = p.chartLabel || `Chart ${p.chartId || ''}`;
      const pointLabel = p.label || `Index ${p.index}`;
      const pointValue = p.value !== undefined ? p.value : '';
      return `• ${chartLabel} | ${pointLabel}: ${pointValue}`;
    }).join('\n');
    return summary;
  };

  const handleQueryInputChange = (e) => {
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
    <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 300 }}>
      {/* Robot Character */}
      <div
        ref={robotRef}
        className={`robot-character ${className}`}
        style={getRobotStyles()}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <svg viewBox="0 0 44 65" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'auto' }}>
          {/* Robot Body Parts styled with robotThemeColors */}
          {/* Main Body */}
          <rect x="7" y="25" width="30" height="40" rx="6" fill={robotThemeColors.body} stroke={robotThemeColors.border} strokeWidth="2" />
          
          {/* Head */}
          <rect x="10" y="3" width="24" height="20" rx="5" fill={robotThemeColors.body} stroke={robotThemeColors.border} strokeWidth="2" />
          
          {/* Visor - using accent for fill, specific border for detail */}
          <rect x="14" y="7" width="16" height="6" rx="2" fill={robotThemeColors.accent} stroke={robotThemeColors.visorText} strokeWidth="1" />
          
          {/* Arms - smaller rectangles on the sides of the body */}
          <rect x="0" y="30" width="7" height="30" rx="3" fill={robotThemeColors.body} stroke={robotThemeColors.border} strokeWidth="2" />
          <rect x="37" y="30" width="7" height="30" rx="3" fill={robotThemeColors.body} stroke={robotThemeColors.border} strokeWidth="2" />

          {/* Legs - smaller rectangles below the body */}
          <rect x="9" y="63" width="8" height="20" rx="3" transform="translate(0 -18)" fill={robotThemeColors.body} stroke={robotThemeColors.border} strokeWidth="2" />
          <rect x="27" y="63" width="8" height="20" rx="3" transform="translate(0 -18)" fill={robotThemeColors.body} stroke={robotThemeColors.border} strokeWidth="2" />

          {/* Antenna - keeping existing logic for blinking based on state */}
          <rect x="20" y="0" width="4" height="5" rx="2" fill={robotThemeColors.body} />
          <circle 
            cx="22" 
            cy="2" 
            r="2" // Slightly smaller antenna light
            fill={state === 'thinking' || state === 'speaking' ? theme.colors.electricCyan : robotThemeColors.body} 
            stroke={robotThemeColors.border}
            strokeWidth="0.5"
          />
          
          {/* Original Eye parts - can be further refined if needed */}
          {/* Inner eye part can use accent or a different neon color */}
          <circle cx="22" cy="12" r="4" fill={theme.colors.midnightNavy} />
          <circle 
            cx="22" 
            cy="12" 
            r="2" 
            fill={laserColor === 'red' ? theme.colors.signalMagenta : theme.colors.success} 
          />

          {/* Removed original theme.colors based robot part details that are now covered by the new structure */}
          {/* E.g., <rect x="14" y="30" width="16" height="6" rx="2" fill={theme.colors.electricCyan} opacity="0.6" /> */}
          {/* E.g., <circle cx="17" cy="40" r="2" fill={theme.colors.electricCyan} /> */}

        </svg>
      </div>
      
      {/* AI Laser Pointer - Hide if user has selected points */}
      {state === 'pointing' && laserTarget && (!currentSelectedPoints || currentSelectedPoints.length === 0) && (
        <LaserPointer 
          origin={laserOrigin}
          target={laserTarget}
          color="#ff1f4f" // Neon red for AI laser
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
            target={point.targetCoords} // Page-relative coordinates
            color="#39ff14" // Neon green for user selections
            pulsing={false} // User lasers don't pulse
            width={3}
          />
        );
      })}
      
      {/* Speech Bubble */}
      {(state === 'speaking' || state === 'thinking' || (currentSelectedPoints && currentSelectedPoints.length > 0)) && (message || contextSummaryMessage) && (
        <SpeechBubble
          anchorElement={robotRef.current}
          message={message} // Prioritize context summary if available
          isThinking={state === 'thinking' || (currentSelectedPoints && currentSelectedPoints.length > 0 && !message)}
          position="right"
        />
      )}
      
      {/* Global styles for animations */}
      <style jsx global>{`
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
            bottom: '-70px', // Adjust as needed, relative to robot
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            zIndex: theme.zIndex[70], // Above robot and laser
            backgroundColor: 'var(--input-bg, #2a2a4a)',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid var(--border-color, #00e5ff4d)',
            display: 'flex',
            gap: '8px',
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
              backgroundColor: 'var(--input-bg, #2a2a4a)',
              border: '1px solid var(--border-color, #00e5ff4d)',
              borderRadius: '4px',
              color: 'var(--text-light, #e0e0ff)',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <button 
            onClick={handleSendQuery}
            style={{
              padding: '8px 12px',
              background: 'var(--neon-blue, #00e5ff)', 
              color: 'var(--text-dark, #1a1a2e)',
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