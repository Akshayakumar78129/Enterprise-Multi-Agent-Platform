import React from 'react';

interface LaserPointerProps {
  origin: { x: number; y: number };
  target: { x: number; y: number };
  color?: string;
  pulsing?: boolean;
  width?: number;
}

export const LaserPointer: React.FC<LaserPointerProps> = ({
  origin,
  target,
  color = '#fc8181', // Soft red default
  pulsing = true,
  width = 3,
}) => {
  if (!origin || !target) return null;

  // Calculate angle and distance
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Create gradient ID unique to this laser
  const gradientId = `laser-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        {/* Define gradient for the laser beam */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.1" />
            <stop offset="50%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Laser beam line */}
        <line
          x1={origin.x}
          y1={origin.y}
          x2={target.x}
          y2={target.y}
          stroke={`url(#${gradientId})`}
          strokeWidth={width}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 4px ${color})`,
            animation: pulsing ? 'laserPulse 1s infinite' : 'none',
          }}
        />

        {/* Origin point glow */}
        <circle
          cx={origin.x}
          cy={origin.y}
          r={width + 2}
          fill={color}
          opacity="0.5"
          style={{
            filter: `blur(2px)`,
          }}
        />

        {/* Target point */}
        <circle
          cx={target.x}
          cy={target.y}
          r={width + 4}
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.8"
          style={{
            animation: 'targetPulse 1s infinite',
          }}
        />
        <circle
          cx={target.x}
          cy={target.y}
          r={width}
          fill={color}
          opacity="0.8"
        />
      </svg>

      {/* Laser animation styles */}
      <style jsx>{`
        @keyframes laserPulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes targetPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
};

export default LaserPointer;
