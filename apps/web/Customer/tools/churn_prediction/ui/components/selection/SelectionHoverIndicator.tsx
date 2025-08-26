import React, { useEffect, useState } from 'react';

interface SelectionHoverIndicatorProps {
  selectedPoints: any[];
  currentHoverPoint?: { x: number; y: number; label: string; value: any };
}

const SelectionHoverIndicator: React.FC<SelectionHoverIndicatorProps> = ({ 
  selectedPoints, 
  currentHoverPoint 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentHoverPoint) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentHoverPoint]);

  if (!currentHoverPoint || !isVisible) return null;

  // Check if current point is selected
  const isSelected = selectedPoints.some(p => 
    p.label === currentHoverPoint.label && 
    p.value === currentHoverPoint.value
  );

  return (
    <div
      style={{
        position: 'fixed',
        left: currentHoverPoint.x,
        top: currentHoverPoint.y - 40,
        transform: 'translateX(-50%)',
        background: isSelected 
          ? 'linear-gradient(135deg, #00e0ff, #00a6cc)' 
          : 'rgba(30, 39, 56, 0.95)',
        border: `2px solid ${isSelected ? '#00e0ff' : 'rgba(255, 255, 255, 0.2)'}`,
        borderRadius: 8,
        padding: '6px 12px',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        zIndex: 10000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        animation: 'fadeIn 0.2s ease-out',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}
    >
      {isSelected && (
        <span style={{ fontSize: 14 }}>✓</span>
      )}
      <span>{currentHoverPoint.label}</span>
      <span style={{ opacity: 0.8 }}>
        {currentHoverPoint.value}
      </span>
      {!isSelected && (
        <span style={{ 
          fontSize: 10, 
          opacity: 0.6,
          marginLeft: 4
        }}>
          Shift+Click
        </span>
      )}
    </div>
  );
};

export default SelectionHoverIndicator;