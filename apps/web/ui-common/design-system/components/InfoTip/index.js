import React, { useState } from 'react';
import { useTheme } from '../../theme';

export const InfoTip = ({ label = 'What am I seeing?', children }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        aria-label="Info"
        onClick={() => setOpen(o=>!o)}
        style={{
          border: '1px solid ' + theme.colors.graphiteLight,
          background: 'transparent',
          color: theme.colors.cloudWhite,
          borderRadius: 999,
          width: 28, height: 28,
          display: 'grid', placeItems: 'center',
          cursor: 'pointer'
        }}
        title={label}
      >
        ℹ️
      </button>
      {open && (
        <div
          role="dialog"
          style={{
            position: 'absolute',
            right: 0, top: 36,
            width: 320,
            background: theme.colors.graphite,
            color: theme.colors.cloudWhite,
            border: '1px solid ' + theme.colors.graphiteLight,
            borderRadius: 8,
            padding: 12,
            boxShadow: theme.shadows.lg,
            zIndex: 10
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
          <div style={{ opacity: .9, fontSize: 13, lineHeight: 1.4 }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTip;
