// apps/web/ui-common/ai-interaction/aiClient.js
'use client';

import { AIResponseDashboardWithViz } from './aiResponse';

/** Build prompt for chatbot; keep simple and explicit */
export function buildPrompt({ text, agent = 'orchestrator', mode = 'concise', extras = null }) {
  const ctx = extras ? `\n\n[Context]\n${JSON.stringify(extras, null, 2)}` : '';
  return `${text}\n\n[Agent]\n${agent}\n\n[Mode]\n${mode}${ctx}`;
}

/** Stream helper used by the chatbot */
export async function runAIQuery(prompt, session) {
  const parts = [];
  for await (const chunk of AIResponseDashboardWithViz(prompt, session)) {
    if (chunk === '[DONE]') break;
    if (chunk === '[ERROR]') throw new Error('AIResponseDashboard error');
    if (chunk && typeof chunk === 'object') {
      const a = chunk.agent || 'orchestrator';
      const t = (chunk.text || '').trim();
      if (t) parts.push({ agent: a, text: t });
    } else if (typeof chunk === 'string' && chunk.trim()) {
      parts.push({ agent: 'orchestrator', text: chunk.trim() });
    }
  }
  return { parts };
}
