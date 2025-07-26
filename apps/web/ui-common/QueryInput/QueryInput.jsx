import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../design-system/theme';

/**
 * QueryInput Component
 * 
 * Natural language input component allowing users to interact with visualizations
 * by asking questions and providing commands.
 * 
 * Features:
 * - Expandable/collapsible input area
 * - Auto-expanding height based on content
 * - Command suggestion with slash commands
 * - Recent queries history
 * - Voice input support
 * - Loading state during query processing
 */
export const QueryInput = ({
  onSubmit,
  onSuggestionSelect,
  placeholder = "Ask a question or use / for commands...",
  initialValue = "",
  suggestions = [],
  recentQueries = [],
  isLoading = false,
  position = "bottom", // "bottom" or "floating"
  maxHeight = 120,
}) => {
  const theme = useTheme();
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);
  const suggestionRef = useRef(null);
  const historyRef = useRef(null);
  
  // Filter suggestions based on input
  useEffect(() => {
    if (query.startsWith('/')) {
      const searchTerm = query.slice(1).toLowerCase();
      const filtered = suggestions.filter(suggestion => 
        suggestion.command.toLowerCase().includes(searchTerm) ||
        suggestion.description.toLowerCase().includes(searchTerm)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [query, suggestions]);
  
  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [query, maxHeight]);
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionRef.current && 
        !suggestionRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
      
      if (
        historyRef.current && 
        !historyRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowHistory(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Speech recognition for voice input
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser');
      return;
    }
    
    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      setQuery(transcript);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };
  
  // Handle input changes
  const handleChange = (e) => {
    setQuery(e.target.value);
    
    // Show slash command suggestions
    if (e.target.value.startsWith('/')) {
      setShowSuggestions(true);
      setShowHistory(false);
    }
  };
  
  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.template || `/${suggestion.command} `);
    setShowSuggestions(false);
    inputRef.current.focus();
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };
  
  // Handle history item selection
  const handleHistoryClick = (historyItem) => {
    setQuery(historyItem);
    setShowHistory(false);
    inputRef.current.focus();
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!query.trim() || isLoading) return;
    
    if (onSubmit) {
      onSubmit(query, setQuery);
    }
    
    // Don't clear the input, let the parent component decide
    // setQuery('');
    setShowSuggestions(false);
    setShowHistory(false);
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift key)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
      return;
    }
    
    // Toggle history on Up arrow when input is empty
    if (e.key === 'ArrowUp' && query === '') {
      e.preventDefault();
      setShowHistory(true);
      setShowSuggestions(false);
      return;
    }
    
    // Close suggestions/history on Escape
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowHistory(false);
      return;
    }
  };
  
  // Styles
  const containerStyles = {
    position: position === 'floating' ? 'absolute' : 'relative',
    bottom: position === 'floating' ? '20px' : '0',
    left: position === 'floating' ? '50%' : '0',
    transform: position === 'floating' ? 'translateX(-50%)' : 'none',
    width: position === 'floating' ? '80%' : '100%',
    maxWidth: position === 'floating' ? '800px' : 'none',
    backgroundColor: theme.colors.graphite,
    borderRadius: position === 'floating' ? theme.borderRadius.xl : `${theme.borderRadius.lg} ${theme.borderRadius.lg} 0 0`,
    boxShadow: position === 'floating' ? theme.shadows.lg : 'none',
    border: `1px solid ${theme.colors.graphiteLight}`,
    padding: theme.spacing[4],
    zIndex: theme.zIndex[40],
    transition: theme.transitions.default,
  };
  
  const inputContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  };
  
  const inputStyles = {
    flex: 1,
    backgroundColor: theme.colors.midnightNavy,
    color: theme.colors.cloudWhite,
    border: `1px solid ${isFocused ? theme.colors.electricCyan : theme.colors.graphiteLight}`,
    borderRadius: theme.borderRadius.lg,
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.primary,
    resize: 'none',
    minHeight: '48px',
    maxHeight: `${maxHeight}px`,
    overflowY: 'auto',
    outline: 'none',
    transition: theme.transitions.default,
    boxShadow: isFocused ? theme.shadows.glow.cyan : 'none',
  };
  
  const buttonBaseStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '40px',
    height: '40px',
    borderRadius: theme.borderRadius.full,
    border: 'none',
    backgroundColor: 'transparent',
    color: theme.colors.cloudWhite,
    cursor: 'pointer',
    transition: theme.transitions.fast,
    outline: 'none',
    marginLeft: theme.spacing[2],
  };
  
  const expandButtonStyles = {
    ...buttonBaseStyles,
    color: isExpanded ? theme.colors.electricCyan : theme.colors.cloudWhite,
    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
  };
  
  const micButtonStyles = {
    ...buttonBaseStyles,
    backgroundColor: isListening ? theme.colors.signalMagenta : 'transparent',
    color: isListening ? theme.colors.cloudWhite : theme.colors.cloudWhite,
  };
  
  const submitButtonStyles = {
    ...buttonBaseStyles,
    backgroundColor: query.trim() ? theme.colors.electricCyan : theme.colors.graphiteLight,
    color: query.trim() ? theme.colors.midnightNavy : theme.colors.cloudWhite,
    opacity: isLoading ? 0.7 : 1,
    cursor: isLoading || !query.trim() ? 'default' : 'pointer',
  };
  
  const suggestionContainerStyles = {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    width: '100%',
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: theme.colors.graphite,
    border: `1px solid ${theme.colors.graphiteLight}`,
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.lg,
    zIndex: theme.zIndex[45],
    marginBottom: theme.spacing[2],
    display: showSuggestions ? 'block' : 'none',
  };
  
  const historyContainerStyles = {
    ...suggestionContainerStyles,
    display: showHistory ? 'block' : 'none',
  };
  
  const suggestionItemStyles = {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
    cursor: 'pointer',
    transition: theme.transitions.fast,
    display: 'flex',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.colors.graphiteLight}`,
    '&:hover': {
      backgroundColor: theme.colors.midnightNavy,
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  };
  
  const commandStyles = {
    color: theme.colors.electricCyan,
    fontWeight: theme.typography.fontWeight.semiBold,
    marginRight: theme.spacing[2],
  };
  
  const loadingIndicatorStyles = {
    position: 'absolute',
    right: '100px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: `2px solid ${theme.colors.electricCyan}`,
    borderTopColor: 'transparent',
    animation: 'spin 1s linear infinite',
    display: isLoading ? 'block' : 'none',
  };
  
  return (
    <div style={containerStyles}>
      {/* Suggestions Popup */}
      {showSuggestions && (
        <div ref={suggestionRef} style={suggestionContainerStyles}>
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              style={{
                ...suggestionItemStyles,
                backgroundColor: index % 2 === 0 ? theme.colors.graphite : theme.colors.graphiteLight,
              }}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span style={commandStyles}>/{suggestion.command}</span>
              <span>{suggestion.description}</span>
            </div>
          ))}
          
          {filteredSuggestions.length === 0 && (
            <div style={{ padding: theme.spacing[4], textAlign: 'center', color: theme.colors.cloudWhite }}>
              No matching commands found
            </div>
          )}
        </div>
      )}
      
      {/* History Popup */}
      {showHistory && (
        <div ref={historyRef} style={historyContainerStyles}>
          {recentQueries.length > 0 ? (
            recentQueries.map((historyItem, index) => (
              <div
                key={index}
                style={{
                  ...suggestionItemStyles,
                  backgroundColor: index % 2 === 0 ? theme.colors.graphite : theme.colors.graphiteLight,
                }}
                onClick={() => handleHistoryClick(historyItem)}
              >
                <span>{historyItem}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: theme.spacing[4], textAlign: 'center', color: theme.colors.cloudWhite }}>
              No recent queries
            </div>
          )}
        </div>
      )}
      
      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        <div style={inputContainerStyles}>
          <textarea
            ref={inputRef}
            style={inputStyles}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          
          {/* Loading indicator */}
          <div style={loadingIndicatorStyles} />
          
          {/* Buttons */}
          <button
            type="button"
            style={expandButtonStyles}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <span role="img" aria-label="Expand">⌄</span>
          </button>
          
          <button
            type="button"
            style={micButtonStyles}
            onClick={startListening}
            title="Voice input"
            disabled={isListening}
          >
            <span role="img" aria-label="Microphone">🎤</span>
          </button>
          
          <button
            type="submit"
            style={submitButtonStyles}
            disabled={isLoading || !query.trim()}
            title="Submit"
          >
            <span role="img" aria-label="Submit">➤</span>
          </button>
        </div>
      </form>
      
      {/* Loading animation style */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default QueryInput; 