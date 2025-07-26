import React, { useState } from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Button } from '../../../../../../ui-common/design-system/components/Button';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { QueryInput } from '../../../../../../ui-common/QueryInput/QueryInput';

interface PatternQueryInputProps {
  onSubmit?: (query: string) => void;
  isLoading?: boolean;
  className?: string;
}

interface QuerySuggestion {
  label: string;
  query: string;
  icon?: string;
}

export const PatternQueryInput: React.FC<PatternQueryInputProps> = ({
  onSubmit,
  isLoading = false,
  className
}) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  
  // Sample query suggestions
  const suggestions: QuerySuggestion[] = [
    { 
      label: 'Explain anomalies', 
      query: '/explain anomaly-pattern',
      icon: '🔍'
    },
    { 
      label: 'Compare weekdays vs weekends', 
      query: '/compare weekday-weekend',
      icon: '📊'
    },
    { 
      label: 'Find related products', 
      query: '/find associated-with Electronics',
      icon: '🔗'
    },
    { 
      label: 'Predict next hour trend', 
      query: '/predict next-hour trend',
      icon: '📈'
    }
  ];
  
  const handleQueryChange = (value: string) => {
    setQuery(value);
  };
  
  const handleQuerySubmit = () => {
    if (query.trim() && onSubmit) {
      onSubmit(query);
      // Don't clear the query here to preserve context
    }
  };
  
  const handleSuggestionClick = (suggestion: QuerySuggestion) => {
    setQuery(suggestion.query);
    if (onSubmit) {
      onSubmit(suggestion.query);
    }
  };
  
  return (
    <Card 
      title="Ask about transaction patterns" 
      elevation="md"
      className={className}
    >
      <div style={{ padding: theme.spacing[3] }}>
        <div style={{ marginBottom: theme.spacing[3] }}>
          <QueryInput
            value={query}
            onChange={handleQueryChange}
            onSubmit={handleQuerySubmit}
            placeholder="Ask a question or type a slash command..."
            isLoading={isLoading}
          />
        </div>
        
        <div>
          <div style={{ 
            fontSize: theme.typography.fontSize.sm, 
            color: theme.colors.cloudWhite,
            marginBottom: theme.spacing[2]
          }}>
            Suggested queries:
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: theme.spacing[2]
          }}>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                style={{
                  padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
                  backgroundColor: theme.colors.graphiteDark,
                  borderRadius: '16px',
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.electricCyan,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[1]
                }}
              >
                {suggestion.icon && <span>{suggestion.icon}</span>}
                <span>{suggestion.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Command help */}
        <div style={{ 
          marginTop: theme.spacing[4],
          padding: theme.spacing[2],
          backgroundColor: theme.colors.graphiteDark,
          borderRadius: '4px',
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.cloudWhite
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: theme.spacing[1] }}>
            Available commands:
          </div>
          <ul style={{ margin: 0, paddingLeft: theme.spacing[4] }}>
            <li>/explain [pattern-type] - Get explanation about patterns</li>
            <li>/compare [dimension] - Compare transaction dimensions</li>
            <li>/find associated-with [product] - Find related products</li>
            <li>/predict [timeframe] - Predict future patterns</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}; 