"use client";
import React, { useMemo } from "react";

export type PFStatusVariant = "default" | "secondary" | "destructive";

export interface PFStatus {
  text: string;
  variant: PFStatusVariant;
}

export interface PFTab {
  id: string;
  title: string;
  render: () => React.ReactNode;
}

export interface PFAgentPopupProps {
  agentName: string;
  status: PFStatus;
  tabs: PFTab[];
  defaultTab?: string;
  isLoading?: boolean;
  triggerClassName?: string;
}

export function PFAgentPopup({
  agentName,
  status,
  tabs,
  defaultTab = "overview",
  isLoading = false,
  triggerClassName = ""
}: PFAgentPopupProps) {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  const TabBar = useMemo(() => (
    <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #3a4459', paddingBottom: 8 }}>
      {tabs.map(t => (
        <button key={t.id}
          onClick={() => setActiveTab(t.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === t.id ? '#00e0ff' : '#f7f9fb',
            borderBottom: activeTab === t.id ? '2px solid #00e0ff' : 'none',
            padding: '6px 10px',
            cursor: 'pointer',
            fontWeight: activeTab === t.id ? 700 : 500
          }}>
          {t.title}
        </button>
      ))}
    </div>
  ), [tabs, activeTab]);

  const ActiveTabContent = useMemo(() => tabs.find(t => t.id === activeTab)?.render() ?? null, [activeTab, tabs]);

  if (!open) {
    // Only brain icon button, matching FloatingAIChat closed-state style
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.6)'; }}
        onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.4)'; }}
        title="Purchase Frequency Agent"
      >
        🧠
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '90px',
        right: '20px',
        width: 420,
        height: 520,
        background: 'linear-gradient(135deg, rgba(26,31,46,0.98), rgba(42,47,62,0.98))',
        border: '1px solid rgba(0, 224, 255, 0.3)',
        borderRadius: 12,
        color: '#f7f9fb',
        padding: 12,
        boxShadow: '0 10px 30px rgba(0, 224, 255, 0.2)',
        backdropFilter: 'blur(20px)',
        zIndex: 1005
      }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #22d3ee, #3b82f6)', display:'flex', alignItems:'center', justifyContent:'center' }}>🧠</div>
          <div>
            <div style={{ fontWeight: 800 }}>{agentName}</div>
            <div style={{ fontSize: 12, color: status.variant === 'destructive' ? '#fca5a5' : '#94a3b8' }}>{status.text}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setOpen(false)} style={{ background:'transparent', border:'1px solid rgba(0,224,255,0.2)', color:'#94a3b8', fontSize: 20, cursor:'pointer', borderRadius: 8, width: 32, height: 32, lineHeight: '28px' }}>×</button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height: '100%', color:'#94a3b8' }}>Loading...</div>
      ) : (
        <>
          {TabBar}
          <div style={{ marginTop: 10, height: 420, overflowY: 'auto' }}>
            {ActiveTabContent}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}