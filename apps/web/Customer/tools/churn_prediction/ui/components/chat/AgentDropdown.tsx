import React, { useState, useRef, useEffect } from 'react';
import { getActiveAgents, formatAgentForDropdown } from '../../config/agentRegistry';

interface AgentDropdownProps {
  onAgentSelect: (agentName: string) => void;
}

interface FormattedAgent {
  value: string;
  label: string;
  description: string;
  avatar: string;
  color: string;
  category: string;
  capabilities: string[];
  isActive: boolean;
}

const AgentDropdown: React.FC<AgentDropdownProps> = ({ onAgentSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'up' | 'down'>('up');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const allAgents = getActiveAgents().map(formatAgentForDropdown);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAgentSelect = (agentName: string) => {
    onAgentSelect(agentName);
    setIsOpen(false);
  };

  // Calculate optimal dropdown position
  const calculateDropdownPosition = () => {
    if (!buttonRef.current) return;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 280; // maxHeight of dropdown
    
    // Check if there's enough space above the button
    const spaceAbove = buttonRect.top;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    
    // Prefer opening upward (since button is at bottom), but check space
    if (spaceAbove >= dropdownHeight + 20) {
      setDropdownPosition('up');
    } else if (spaceBelow >= dropdownHeight + 20) {
      setDropdownPosition('down');
    } else {
      // If neither has enough space, choose the one with more space
      setDropdownPosition(spaceAbove > spaceBelow ? 'up' : 'down');
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      calculateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales': return '💼';
      case 'customer': return '👥';
      case 'inventory': return '📦';
      case 'finance': return '💰';
      case 'support': return '🎧';
      case 'marketing': return '📈';
      default: return '🤖';
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Compact Dropdown Trigger */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(30, 39, 56, 0.6)',
          border: '1px solid rgba(58, 68, 89, 0.5)',
          borderRadius: '8px',
          color: '#f8fafc',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
          width: 'fit-content'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(0, 224, 255, 0.5)';
          e.currentTarget.style.background = 'rgba(30, 39, 56, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(58, 68, 89, 0.5)';
          e.currentTarget.style.background = 'rgba(30, 39, 56, 0.6)';
        }}
      >
        <span style={{ color: '#00e0ff' }}>🤖</span>
        <span>Available Agents ({allAgents.length})</span>
        <svg 
          style={{
            width: '12px',
            height: '12px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Compact Dropdown Content */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          ...(dropdownPosition === 'up' ? {
            bottom: '100%',
            marginBottom: '8px'
          } : {
            top: '100%',
            marginTop: '8px'
          }),
          left: '0',
          width: '320px',
          background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.98), rgba(42, 47, 62, 0.98))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 224, 255, 0.3)',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          maxHeight: '280px',
          overflowY: 'auto',
          zIndex: 1004
        }}>
          
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(58, 68, 89, 0.3)',
            background: 'rgba(30, 39, 56, 0.3)'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🤖</span>
              <span>Available AI Agents</span>
            </div>
            <div style={{
              fontSize: '11px',
              color: '#94a3b8',
              marginTop: '4px'
            }}>
              Click any agent to mention them in your message
            </div>
          </div>

          {/* Agent List */}
          <div 
            className="agent-dropdown-list"
            style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
            onWheel={(e) => {
              // Prevent scroll propagation to parent elements
              e.stopPropagation();
              
              const element = e.currentTarget;
              const { scrollTop, scrollHeight, clientHeight } = element;
              
              // If scrolling up and already at top, prevent default
              if (e.deltaY < 0 && scrollTop === 0) {
                e.preventDefault();
                return;
              }
              
              // If scrolling down and already at bottom, prevent default
              if (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight) {
                e.preventDefault();
                return;
              }
            }}
          >
            {allAgents.length === 0 ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#94a3b8'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔍</div>
                <div style={{ fontSize: '12px' }}>No agents available</div>
              </div>
            ) : (
              allAgents.map((agent, index) => (
                <button
                  key={agent.value}
                  onClick={() => handleAgentSelect(agent.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: index < allAgents.length - 1 ? '1px solid rgba(58, 68, 89, 0.2)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: '#f8fafc'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: `${agent.color}20`,
                      color: agent.color,
                      border: `1px solid ${agent.color}30`
                    }}>
                      {agent.avatar}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <div style={{
                          fontWeight: '600',
                          fontSize: '13px',
                          color: '#f8fafc'
                        }}>
                          {agent.label}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(0, 224, 255, 0.2)',
                          color: '#00e0ff',
                          border: '1px solid rgba(0, 224, 255, 0.3)'
                        }}>
                          @{agent.value}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(58, 68, 89, 0.3)',
                          color: '#94a3b8'
                        }}>
                          {getCategoryIcon(agent.category)} {agent.category}
                        </div>
                      </div>
                      
                      <div style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        lineHeight: '1.3',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {agent.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDropdown;