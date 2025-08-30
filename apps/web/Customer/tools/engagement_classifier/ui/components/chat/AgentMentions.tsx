import React from 'react';
import { Users, TrendingUp, Package, DollarSign } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
}

interface AgentMentionsProps {
  agents: Agent[];
  query: string;
  onSelect: (agent: Agent) => void;
  onClose: () => void;
  styles?: any;
}

const AgentMentions: React.FC<AgentMentionsProps> = ({ 
  agents, 
  query, 
  onSelect, 
  onClose,
  styles = {}
}) => {
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(query.toLowerCase()) ||
    agent.description.toLowerCase().includes(query.toLowerCase())
  );

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'sales':
        return <TrendingUp size={16} className={`${styles.agentIcon} ${styles.sales}`} />;
      case 'inventory':
        return <Package size={16} className={`${styles.agentIcon} ${styles.inventory}`} />;
      case 'financial':
        return <DollarSign size={16} className={`${styles.agentIcon} ${styles.financial}`} />;
      default:
        return <Users size={16} className={`${styles.agentIcon} ${styles.default}`} />;
    }
  };

  if (filteredAgents.length === 0) {
    return (
      <div className={styles.agentMentions}>
        <div className={styles.noAgents}>
          No agents found matching "{query}"
        </div>
      </div>
    );
  }

  return (
    <div className={styles.agentMentions}>
      <div className={styles.mentionsHeader}>
        <span>Available Agents</span>
        <button onClick={onClose} className={styles.closeMentions}>×</button>
      </div>
      {filteredAgents.map((agent) => (
        <div
          key={agent.id}
          className={styles.agentMentionItem}
          onClick={() => onSelect(agent)}
        >
          {getAgentIcon(agent.id)}
          <div className={styles.agentInfo}>
            <div className={styles.agentName}>{agent.name}</div>
            <div className={styles.agentDescription}>{agent.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentMentions;