import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../design-system/theme';

/**
 * LaserPointer Component
 * 
 * Creates a laser pointer effect between two points, typically from the robot's
 * eye to a specific element on a chart or visualization.
 * 
 * Features:
 * - Dynamic laser that follows target point
 * - Different colors based on who's pointing (AI vs user)
 * - Pulsing animation for emphasis
 * - End point dot for precise targeting
 * - Auto-updates when robot or target moves
 */
export const LaserPointer = ({
  origin, // { x, y } coordinates of laser origin (robot eye)
  target, // { x, y } coordinates of target point
  color = '#ff1f4f', // Default red color
  width = 3, // Match POC width
  pulsing = true,
  endPointRadius = 4,
  className = '',
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const laserRef = useRef(null);
  const endPointRef = useRef(null);

  console.log('LaserPointer: Rendering with props:', { origin, target, color, width, pulsing });

  // Calculate angle between origin and target (in degrees)
  const getAngleDegrees = () => {
    if (!origin || !target) return 0;
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * (180 / Math.PI);
    // Adjust for CSS transform origin (starts from left edge, pointing right)
    return angleDeg;
  };

  // Calculate distance between origin and target
  const getDistance = () => {
    if (!origin || !target) return 0;
    return Math.sqrt(
      Math.pow(target.x - origin.x, 2) + Math.pow(target.y - origin.y, 2)
    );
  };

  // Update laser position and rotation
  const updateLaserTransform = () => {
    if (!origin || !target || !laserRef.current || !endPointRef.current) return;
    
    const angle = getAngleDegrees();
    const distance = getDistance();

    // Update laser beam
    laserRef.current.style.left = `${origin.x}px`;
    laserRef.current.style.top = `${origin.y}px`;
    laserRef.current.style.width = `${distance}px`;
    laserRef.current.style.transform = `rotate(${angle}deg)`;
    laserRef.current.style.height = `${width}px`;

    // Update end point
    endPointRef.current.style.left = `${target.x - endPointRadius}px`;
    endPointRef.current.style.top = `${target.y - endPointRadius}px`;
  };

  // Animate the laser appearance
  useEffect(() => {
    if (origin && target) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsVisible(true);
        updateLaserTransform();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [origin, target]);

  // Update laser when origin or target changes
  useEffect(() => {
    updateLaserTransform();
  }, [origin, target, width]);

  if (!origin || !target) return null;

  const angle = getAngleDegrees();
  const distance = getDistance();

  // Laser beam styles
  const laserStyles = {
    position: 'absolute',
    transformOrigin: '0 50%', // Start from left edge, center vertically
    left: `${origin.x}px`,
    top: `${origin.y}px`,
    height: `${width}px`,
    width: `${distance}px`,
    transform: `rotate(${angle}deg)`,
    background: `linear-gradient(to right, rgba(${color === '#39ff14' ? '57, 255, 20' : '255, 31, 79'}, 0.1), ${color})`,
    borderRadius: '50px',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.05s linear, background 0.2s ease, box-shadow 0.2s ease',
    zIndex: theme.zIndex[60],
    boxShadow: pulsing ? `0 0 8px 2px ${color}` : `0 0 4px 1px ${color}`,
    animation: pulsing ? 'laserPulsing 0.8s infinite alternate' : 'none',
    pointerEvents: 'none',
  };

  // End point dot styles
  const endPointStyles = {
    position: 'absolute',
    left: `${target.x - endPointRadius}px`,
    top: `${target.y - endPointRadius}px`,
    width: `${endPointRadius * 2}px`,
    height: `${endPointRadius * 2}px`,
    borderRadius: '50%',
    backgroundColor: color,
    zIndex: theme.zIndex[60] + 1,
    boxShadow: `0 0 5px 1px ${color}`,
    animation: pulsing ? 'endPointPulsing 0.8s infinite alternate' : 'none',
    pointerEvents: 'none',
  };

  return (
    <>
      <div 
        ref={laserRef}
        className={`laser-pointer ${className}`} 
        style={laserStyles} 
      />
      <div 
        ref={endPointRef}
        className={`laser-end-point ${className}`} 
        style={endPointStyles} 
      />

      {/* Animations for laser and end point */}
      <style jsx global>{`
        @keyframes laserPulsing {
          0% { 
            opacity: 0.7; 
            height: ${width}px; 
            box-shadow: 0 0 8px 2px ${color};
          }
          100% { 
            opacity: 1; 
            height: ${width + 1}px; 
            box-shadow: 0 0 12px 3px ${color};
          }
        }
        
        @keyframes endPointPulsing {
          0% { 
            transform: scale(0.8); 
            opacity: 0.8; 
            box-shadow: 0 0 5px 1px ${color};
          }
          100% { 
            transform: scale(1.2); 
            opacity: 1; 
            box-shadow: 0 0 8px 2px ${color};
          }
        }
      `}</style>
    </>
  );
};

export default LaserPointer; 