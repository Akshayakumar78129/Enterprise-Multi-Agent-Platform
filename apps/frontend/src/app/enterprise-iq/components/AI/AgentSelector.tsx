"use client";

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const agents: Agent[] = [
  {
    id: 'general',
    name: 'General Assistant',
    description: 'General purpose AI assistant',
    icon: '🤖'
  },
  {
    id: 'sales',
    name: 'Sales Analyst',
    description: 'Specialized in sales performance and forecasting',
    icon: '📈'
  },
  {
    id: 'customer',
    name: 'Customer Insights',
    description: 'Expert in customer behavior and segmentation',
    icon: '👥'
  },
  {
    id: 'finance',
    name: 'Financial Advisor',
    description: 'Financial analysis and reporting specialist',
    icon: '💰'
  },
  {
    id: 'inventory',
    name: 'Inventory Manager',
    description: 'Inventory optimization and supply chain expert',
    icon: '📦'
  },
  {
    id: 'marketing',
    name: 'Marketing Strategist',
    description: 'Marketing campaigns and ROI analysis',
    icon: '🎯'
  }
];

interface AgentSelectorProps {
  selectedAgent: string;
  onSelectAgent: (agentId: string) => void;
}

export default function AgentSelector({ selectedAgent, onSelectAgent }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentAgent = agents.find(a => a.id === selectedAgent) || agents[0];

  return (
    <div className="relative mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white/10 border border-border rounded-lg hover:bg-white/20 transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentAgent.icon}</span>
          <span className="text-sm text-foreground">{currentAgent.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full glass-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => {
                onSelectAgent(agent.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-3 flex items-start gap-3 hover:bg-white/10 transition-all ${
                agent.id === selectedAgent ? 'bg-white/10' : ''
              }`}
            >
              <span className="text-lg mt-0.5">{agent.icon}</span>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-foreground">
                  {agent.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {agent.description}
                </div>
              </div>
              {agent.id === selectedAgent && (
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}