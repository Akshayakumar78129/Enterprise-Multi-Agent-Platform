'use client'

const backendAiUrl =
  process.env.NEXT_PUBLIC_BACKEND_AI_URL ||
  process.env.ADK_BASE_URL ||
  'http://127.0.0.1:8002';

function pickEndpoint(session) {
  const singleAgents = new Set(['sales', 'customer', 'finance', 'inventory']);
  const app = (session?.app_name || '').toLowerCase();
  return singleAgents.has(app) ? '/run_sse_agent' : '/run_sse';
}

function toServerAppName(app) {
  const a = (app || '').toLowerCase();
  if (['sales','customer','finance','inventory'].includes(a)) return `${a}_agent`;
  return a;
}

async function ensureRemoteSession(session) {
  try {
    const sid = session?.session_id;
    const uid = session?.user_id;
    const app = toServerAppName(session?.app_name);
    if (!sid || !uid || !app) return;
    const url = `${backendAiUrl}/apps/${encodeURIComponent(app)}/users/${encodeURIComponent(uid)}/sessions/${encodeURIComponent(sid)}`;
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: {} }) });
  } catch (_) {
    // best-effort; ignore
  }
}

async function* readSSE(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data) continue;
        if (data === '[DONE]') { yield '[DONE]'; continue; }
        try {
          const json = JSON.parse(data);
          yield json;           // expect { agent, text, ... }
          // If ADK encloses completion in </response>, close early to avoid UI hang
          if (json && typeof json.text === 'string' && json.text.includes('</response>')) {
            yield '[DONE]';
          }
        } catch {
          // fallback plain text; also check for closing tag
          yield { text: data };
          if (data.includes('</response>')) {
            yield '[DONE]';
          }
        }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
}

/**
 * Sends {query, session, streaming:true} first.
 * If the server returns 422, retry legacy payload {new_message, session_id, user_id, app_name, streaming:true}.
 */
export async function* AIResponseDashboard(query, session) {
  if (!query) { yield '[ERROR]'; return; }
  const fixed = {
    session_id: session?.session_id,
    user_id: session?.user_id,
    app_name: toServerAppName(session?.app_name),
  };
  const endpoint = pickEndpoint(fixed);

  // v2 payload (preferred)
  const v2Payload = {
    query,
    session: {
      session_id: fixed.session_id,
      user_id: fixed.user_id,
      app_name: fixed.app_name,
    },
    streaming: true,
  };

  // legacy payload (fallback)
  const v1Payload = {
    new_message: { role: 'user', parts: [{ text: query }] },
    session_id: fixed.session_id,
    user_id: fixed.user_id,
    app_name: fixed.app_name,
    streaming: true,
  };

  // helper
  async function post(payload, signal) {
    return fetch(`${backendAiUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
      body: JSON.stringify(payload),
      signal,
    });
  }

  try {
    // Create/ensure remote session first to prevent 404
    await ensureRemoteSession(fixed);

    // Abort controller to avoid infinite waiting when backend hangs
    const controller = new AbortController();
    const timeout = setTimeout(() => { try { controller.abort(); } catch {} }, 120000);

    // Try V2
    let response = await post(v1Payload, controller.signal);
    if (response.status === 404) {
      // Session likely missing; ensure and retry once
      await ensureRemoteSession(fixed);
      response = await post(v1Payload, controller.signal);
    }
    // Some servers only accept one shape; we tried v1 first per ADK main.py
    if (response.status === 422) {
      response = await post(v2Payload, controller.signal);
    }
    if (!response.ok) { clearTimeout(timeout); yield '[ERROR]'; return; }
    
    // First-chunk watchdog: allow more time for model/tooling to start streaming
    let first = false;
    const firstTimer = setTimeout(() => { if (!first) { try { controller.abort(); } catch {} } }, 30000);
    
    try {
      for await (const chunk of readSSE(response)) {
        first = true;
        yield chunk;
      }
    } finally {
      clearTimeout(firstTimer);
    }
    clearTimeout(timeout);
  } catch (e) {
    console.warn('AIResponseDashboard error:', e);
    yield '[ERROR]';
  }
}

// Keep the WithViz alias for existing imports
export async function* AIResponseDashboardWithViz(query, session) {
  yield* AIResponseDashboard(query, session);
}
