import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mode, setMode] = useState(() => (typeof document !== 'undefined' ? (document.documentElement.dataset.theme || 'dark') : 'dark'));

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.dataset.theme = mode;
    localStorage.setItem('eiq-theme', mode);
  }, [mode]);

  useEffect(() => {
    const saved = localStorage.getItem('eiq-theme');
    if (saved) setMode(saved);
  }, []);

  return (
    <button
      onClick={() => setMode(prev => prev === 'dark' ? 'light' : 'dark')}
      style={{
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid #3a4459',
        background: 'transparent',
        color: '#f7f9fb',
        cursor: 'pointer'
      }}
      title="Toggle theme"
    >
      {mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
