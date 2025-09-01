import React from 'react';

interface TooltipData {
  title: string;
  items: Array<{
    label: string;
    value: string | number;
    color?: string;
    type?: 'primary' | 'secondary' | 'metric';
  }>;
  insight?: string;
  status?: 'critical' | 'warning' | 'good' | 'neutral';
}

interface DataTooltipProps {
  data: TooltipData;
  position: { x: number; y: number };
  visible: boolean;
}

const DataTooltip: React.FC<DataTooltipProps> = ({ data, position, visible }) => {
  if (!visible) return null;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'critical': return '#e930ff';
      case 'warning': return '#ffc145';
      case 'good': return '#00e0ff';
      default: return '#5fd4d6';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x + 12}px`,
        top: `${position.y - 8}px`,
        backgroundColor: '#1e293b',
        border: '1px solid #475569',
        borderRadius: '6px',
        padding: '5px 6px',
        width: 'fit-content',
        minWidth: '100px',
        maxWidth: '140px',
        fontSize: '11px',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        zIndex: 2000,
        transform: position.x > window.innerWidth - 160 ? 'translateX(-100%)' : 'none',
        pointerEvents: 'none'
      }}
    >
      {/* Title */}
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: '#00e0ff',
        marginBottom: '4px',
        lineHeight: '1.2'
      }}>
        {data.title}
      </div>

      {/* Data Items */}
      <div style={{ marginBottom: data.insight ? '4px' : '0' }}>
        {data.items.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: index < data.items.length - 1 ? '1px' : '0',
              fontSize: '10px',
              gap: '4px',
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word'
            }}
          >
            <span style={{
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              {item.color && item.type !== 'secondary' && (
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: item.color
                }} />
              )}
              <span style={{ display: 'inline-block', maxWidth: '100px', wordBreak: 'break-word' }}>{item.label}:</span>
            </span>
            <span style={{
              color: item.type === 'primary' ? '#f1f5f9' : '#cbd5e1',
              fontWeight: item.type === 'primary' ? '600' : '500'
            }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Insight */}
      {data.insight && (
        <div style={{
          fontSize: '10px',
          color: getStatusColor(data.status),
          fontWeight: '500',
          lineHeight: '1.3',
          marginTop: '4px',
          paddingTop: '4px',
          borderTop: '1px solid #374151'
        }}>
          {data.insight}
        </div>
      )}

      {/* Context Action Hint */}
      <div style={{
        fontSize: '9px',
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: '4px',
        paddingTop: '4px',
        borderTop: '1px solid #374151',
        textAlign: 'center'
      }}>
        💡 Left Shift + Click to add to AI context
      </div>
    </div>
  );
};

export default DataTooltip;
