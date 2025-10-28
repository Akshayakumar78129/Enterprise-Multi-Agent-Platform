"use client";

import React from 'react';

export interface FormattedMessageProps {
  content: string;
}

/**
 * FormattedMessage component that formats insight messages
 * Handles markdown-like formatting including bold text, emojis, and line breaks
 */
export function FormattedMessage({ content }: FormattedMessageProps) {
  if (!content) return null;

  // Split by bold markers (**text**)
  const parts = content.split(/(\*\*[^*]+\*\*)/g);

  return (
    <div className="text-sm leading-relaxed">
      {parts.map((part, index) => {
        // Check if this part is bold (wrapped in **)
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={index} className="font-semibold">
              {boldText}
            </strong>
          );
        }
        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}
