import React from 'react';
import { createPortal } from 'react-dom';

interface CustomTooltipProps {
  x: number;
  y: number;
  title?: string;
  items: any[];
  visible: boolean;
}

export function CustomTooltip({ x, y, title, items, visible }: CustomTooltipProps) {
  if (!visible || !items || items.length === 0) return null;

  const tooltipContent = (
    <div
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: 10000,
        pointerEvents: 'none',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        maxWidth: '300px'
      }}
    >
      {title && (
        <div style={{
          fontWeight: 'bold',
          marginBottom: '8px',
          color: 'white',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          paddingBottom: '4px'
        }}>
          {title}
        </div>
      )}
      <div style={{ color: 'white' }}>
        {items.map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: index < items.length - 1 ? '4px' : '0',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
              {item.color && (
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: item.color,
                  borderRadius: '2px'
                }} />
              )}
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{item.label}:</span>
            </div>
            <span style={{ fontWeight: 'bold', color: 'white' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(tooltipContent, document.body);
  }

  return tooltipContent;
}