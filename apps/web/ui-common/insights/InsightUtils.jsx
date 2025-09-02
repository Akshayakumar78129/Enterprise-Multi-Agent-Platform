'use client';



import { AIResponseDashboard } from '../ai-interaction/aiResponse';



const LS_KEY = 'ai_session_v1';



function uuid() { return 'sess-' + Math.random().toString(36).slice(2) + Date.now().toString(36); }



export function getAISession() {

  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {}; } catch { return {}; }

}

export function setAISession(s) {

  try { localStorage.setItem(LS_KEY, JSON.stringify(s || {})); } catch {}

}



export function ensureAISession(partial = {}) {

  const s = { ...(getAISession() || {}), ...(partial || {}) };

  if (!s.user_id) s.user_id = 'ari';

  if (!s.app_name) s.app_name = 'orchestrator'; // default to multi-agent

  if (!s.session_id) s.session_id = uuid();

  setAISession(s);

  return s;

}



export function buildSimplePrompt({ text, agent = 'orchestrator', mode = 'concise', extras = null }) {
  const ctx = extras ? `\n\n[Context]\n${JSON.stringify(extras, null, 2)}` : '';
  const policy = mode === 'concise'
    ? `\n\n[Policy]\nQuick mode: Do NOT call tools or transfer to other agents. Answer directly in 3-5 bullets using only provided context. If insufficient, say so briefly and suggest one quick next step.`
    : `\n\n[Policy]\nBe comprehensive but not overly long: deliver a clear summary, key drivers, and 2-3 next steps. If multiple datapoints are present, explain relationships/similarities/differences succinctly.`;
  return `${text}\n\n[Agent]\n${agent}\n\n[Mode]\n${mode}${policy}${ctx}`;
}



/** Click on chart → short insight string */
export async function requestInsight({ variant = 'concise', text, agent = 'orchestrator', extras = null }) {
  const session = ensureAISession({ app_name: agent });
  const prompt = buildSimplePrompt({ text, agent, mode: variant, extras });
  const chunks = [];
  for await (const part of AIResponseDashboard(prompt, session)) {
    if (part === '[DONE]') break;
    if (part === '[ERROR]') throw new Error('AIResponseDashboard error');
    if (typeof part === 'object') {
      const a = part.agent || agent;
      const t = (part.text || '').trim();
      if (t) chunks.push({ agent: a, text: t });
    } else if (typeof part === 'string' && part.trim()) {
      chunks.push({ agent, text: part.trim() });
    }
  }
  if (!chunks.length) return '(no answer)';
  if (chunks.length === 1) return chunks[0].text;
  return chunks.map(p => `[${p.agent}] ${p.text}`).join('\n\n');
}



/** Event used by the charts to “send to chat” (Shift+Click) */

export function emitAskAI(detail) {
  try { window.dispatchEvent(new CustomEvent('ai:insight-request', { detail })); } catch {}
}

