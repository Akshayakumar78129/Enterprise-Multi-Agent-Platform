// apps/web/Customer/tools/performance_deviation/ui/components/ThemeToggle.tsx
import React from "react";
import { useTheme } from "../../../../../ui-common/hooks/useTheme";

export default function ThemeToggle(){
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle}
      title="Toggle theme"
      style={{padding:'8px 12px', borderRadius:12, border:'1px solid rgba(58,68,89,0.3)', background:'transparent', color:'var(--text)'}}>
      {theme==='dark'?'🌙 Dark':'☀️ Light'}
    </button>
  );
}
