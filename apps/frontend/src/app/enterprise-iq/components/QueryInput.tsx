"use client";

import React, { useState, FormEvent, KeyboardEvent, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { VoiceInputButton } from './VoiceInputButton';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function QueryInput({
  onSubmit,
  placeholder = "Ask about customer insights, sales performance, or inventory...",
  disabled = false,
  className = ""
}: QueryInputProps) {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height based on content
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 56), 400);
    textarea.style.height = `${newHeight}px`;
  }, [query]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!query.trim() || disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(query);
      setQuery('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setQuery(transcript);
    // Focus the textarea to show the user what was transcribed
    textareaRef.current?.focus();
  };

  // Handler for voice input submission
  const handleVoiceSubmit = () => {
    // Submit the current query (which was just set by voice)
    if (query.trim() && !disabled && !isSubmitting) {
      const submitEvent = new Event('submit', { cancelable: true, bubbles: true }) as any;
      handleSubmit(submitEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative flex items-center bg-surface border border-border rounded-xl shadow-lg">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          className="flex-1 px-4 py-3 pr-24 bg-transparent text-foreground placeholder-muted-foreground resize-none outline-none flex items-center"
          rows={1}
          style={{ lineHeight: '1.75', minHeight: '56px', maxHeight: '400px', overflow: 'hidden', paddingTop: '16px', paddingBottom: '16px' }}
        />
        <div className="absolute right-2 bottom-2 flex items-center gap-2">
          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            onSubmit={handleVoiceSubmit}
            disabled={disabled || isSubmitting}
          />
          <button
            type="submit"
            disabled={!query.trim() || disabled || isSubmitting}
            className={`
              p-2 rounded-lg transition-all
            ${!query.trim() || disabled || isSubmitting
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-accent text-white hover:bg-accent/90 active:scale-95'
            }
          `}
          aria-label="Send query"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
        </div>
      </div>

      {/* Suggestions removed as requested */}
    </form>
  );
}