"use client";

import React, { useState, FormEvent, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

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

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative flex items-center bg-surface border border-border rounded-xl shadow-lg">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          className="flex-1 px-4 py-3 pr-12 bg-transparent text-foreground placeholder-muted-foreground resize-none outline-none min-h-[56px] max-h-[200px]"
          rows={1}
          style={{ lineHeight: '1.5' }}
        />
        <button
          type="submit"
          disabled={!query.trim() || disabled || isSubmitting}
          className={`
            absolute right-2 bottom-2 p-2 rounded-lg transition-all
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

      {/* Suggestions removed as requested */}
    </form>
  );
}