// Node-safe ADK streaming client for Engagement Classifier backend
// Uses the AIResponseDashboard logic from ui-common following the handQueryDemo pattern
// ESM-compatible version (no require)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TextDecoder } from 'util';

// __dirname replacement for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendAiUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || process.env.BACKEND_AI_URL || 'http://127.0.0.1:8000';

console.log('🔥 ADK Stream module loaded - logging is working!');
console.log('🔍 NEXT_PUBLIC_BACKEND_AI_URL:', process.env.NEXT_PUBLIC_BACKEND_AI_URL);
console.log('🔍 BACKEND_AI_URL:', process.env.BACKEND_AI_URL);
console.log('🌐 Final Backend AI URL:', backendAiUrl);

// Function to read the .env file and extract the API key
const getApiKey = () => {
  try {
    // Path to the .env file in the orchestration_agent directory
    const envPath = path.resolve(
      __dirname,           // current: chatbot/utils
      '..',                // up to chatbot
      '..',                // up to engagement_classifier
      '..',                // up to tools
      '..',                // up to Customer
      '..',                // up to web
      '..',                // up to apps
      'adk',               // into adk
      'orchestration_agent', // into orchestration_agent
      '.env'               // the file
    );

    console.log(`🔑 Attempting to read API key from: ${envPath}`);

    if (!fs.existsSync(envPath)) {
      console.error(`🚨 .env file not found at: ${envPath}`);
      return null;
    }

    const envFileContent = fs.readFileSync(envPath, 'utf8');
    const match = envFileContent.match(/^GOOGLE_API_KEY=(.*)$/m);
    
    if (match && match[1]) {
      const apiKey = match[1].trim();
      console.log('🔑 Successfully loaded GOOGLE_API_KEY.');
      return apiKey;
    } else {
      console.error('🚨 GOOGLE_API_KEY not found in .env file.');
    }
  } catch (error) {
    console.error('Error reading API key from .env file:', error);
  }
  return null;
};


/**
 * Node.js compatible version of AIResponseDashboard function
 * Mirrors the ui-common/ai-interaction/aiResponse.js logic but without 'use client'
 */
async function* AIResponseDashboard(query, session) {
  yield* AIResponseDashboardInternal(query, session, 0);
}

// Internal helper with single retry on SSE error lines (e.g., INVALID_ARGUMENT, UNAVAILABLE)
async function* AIResponseDashboardInternal(query, session, attempt) {
  console.log('🐛 DEBUG - AIResponseDashboard called with:', { query, session, attempt });
  if (!query) {
    yield '[ERROR]';
    return;
  }
  console.log('[adkStream] backendAiUrl:', backendAiUrl);

  // ADK should not require client to send an API key. Proceed without blocking.
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('⚠️ GOOGLE_API_KEY not available locally; proceeding without api_key injection.');
  }

  try {
    console.log('🔗 Creating ADK session...');
    // First, create/ensure session exists
    const sessionResponse = await fetch(`${backendAiUrl}/apps/${session.app_name}/users/${session.user_id}/sessions/${session.session_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    console.log('📋 Session creation status:', sessionResponse.status, sessionResponse.statusText);

    console.log('🚀 Sending request to ADK...');
    const requestBody = {
      app_name: session.app_name,
      user_id: session.user_id,
      session_id: session.session_id,
      streaming: true,
      new_message: {
        parts: [{ text: query }]
      }
    };
    console.log('📤 Request body:', requestBody);

    let response = await fetch(`${backendAiUrl}/run_sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 ADK response status:', response.status, response.statusText);
    console.log('📥 ADK response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Try to recreate session and retry once on 4xx
      if (response.status >= 400 && response.status < 500 && attempt === 0) {
        try {
          console.warn('⚠️ Upstream returned', response.status, '- retrying once after re-creating session');
          await fetch(`${backendAiUrl}/apps/${session.app_name}/users/${session.user_id}/sessions/${session.session_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          const retryBody = {
            app_name: session.app_name,
            user_id: session.user_id,
            session_id: session.session_id,
            streaming: true,
            new_message: {
              parts: [{ text: query }]
            }
          };
          const retry = await fetch(`${backendAiUrl}/run_sse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
            body: JSON.stringify(retryBody)
          });
          if (!retry.ok) {
            console.error('❌ Retry failed:', retry.status, await retry.text());
            yield '[ERROR]';
            return;
          }
          response = retry;
          console.log('🔁 Retry succeeded');
        } catch (e) {
          console.error('❌ Retry exception:', e);
          yield '[ERROR]';
          return;
        }
      } else {
        console.error('❌ Upstream error:', response.status, await response.text());
        yield '[ERROR]';
        return;
      }
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      console.log('📖 Starting to read ADK stream...');
      let chunkCount = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('✅ ADK stream ended, total chunks received:', chunkCount);
          break;
        }

        chunkCount++;
        const rawChunk = decoder.decode(value, { stream: true });
        console.log(`📦 Raw chunk ${chunkCount}:`, JSON.stringify(rawChunk));
        
        buffer += rawChunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        console.log(`📝 Processing ${lines.length} lines from buffer`);
        
        for (const line of lines) {
          console.log('🔍 Processing line:', JSON.stringify(line));
          if (line.startsWith('data: ')) {
            const data = line.replace('data: ', '').trim();
            console.log('📊 Extracted data:', JSON.stringify(data));

            if (data === '[DONE]' || data === '') {
              console.log('⏭️ Skipping empty or DONE data');
              continue;
            }

            try {
              const jsonData = JSON.parse(data);
              console.log('🟢 AIResponseDashboard parsed JSON:', jsonData);
              yield jsonData;
            } catch (e) {
              console.warn('❌ JSON parse error:', e, 'Raw data:', data);
            }
          } else if (line.startsWith('error: ')) {
            // Parse error and decide if we should retry once
            console.error('🚨 ADK error line:', line);
            const lower = line.toLowerCase();
            const retriable = attempt === 0 && (lower.includes('invalid_argument') || lower.includes('unavailable') || lower.includes('function call turn') || lower.includes('503'));
            if (retriable) {
              console.warn('🔁 Retrying stream once due to upstream error...');
              // Tail recurse with attempt+1
              for await (const chunk of AIResponseDashboardInternal(query, session, attempt + 1)) {
                yield chunk;
              }
              return;
            }
            // Non-retriable or already retried
            yield '[ERROR]';
            return;
          } else if (line.trim()) {
            console.log('❓ Unknown line format:', JSON.stringify(line));
          }
        }
      }
      // Only yield [DONE] when the stream actually ends
      yield '[DONE]';
    } finally {
      reader.releaseLock();
    }
  } catch (e) {
    console.warn('Error in AIResponseDashboard:', e);
    yield '[ERROR]';
  }
}

/**
 * Stream AI responses from ADK using AIResponseDashboard.
 * Follows the handQueryDemo pattern to process chunks with agent and text properties.
 * Yields either parsed JSON chunks (expected shape { agent?: string, text?: string })
 * or the control strings '[DONE]' / '[ERROR]'.
 */
export async function* AIResponseDashboardNode(query, session) {
  console.log('🔥🔥🔥 AIResponseDashboardNode ENTRY POINT - Function called!');
  console.log('🔥🔥🔥 Query received:', query);
  console.log('🔥🔥🔥 Session received:', JSON.stringify(session, null, 2));
  
  if (!query) {
    console.log('❌ No query provided to AIResponseDashboardNode');
    yield '[ERROR]';
    return;
  }

  console.log('🎯 AIResponseDashboardNode called with query:', query);
  console.log('🎯 Session:', JSON.stringify(session, null, 2));

  try {
    // Send the original query (with @tag) so chatbot can also parse tags.
    console.log('🚀 Calling internal AIResponseDashboard...');
    const response = AIResponseDashboard(query, session);
    console.log('📡 AIResponseDashboard generator created, starting iteration...');

    let chunkCount = 0;
    for await (const chunk of response) {
      chunkCount++;
      // DEBUG: Log what ADK is actually returning
      console.log(`🔍 ADK chunk ${chunkCount} received:`, typeof chunk, chunk);
      
      // Handle the new response format with agent and text properties
      if (typeof chunk === 'object' && chunk !== null) {
        // Support both {agent,text} and {text,visualisation} shapes
        if (chunk.text || chunk.agent) {
          console.log('✅ Agent/Router response:', chunk.agent || '(unknown)', '- Message:', chunk.text || '(no text)');
          yield chunk;
        } else if (chunk.visualisation) {
          // ignore pure visualisation events
        }
      } else if (chunk === '[DONE]') {
        console.log('🏁 AI response completed - received [DONE]');
        yield '[DONE]';
        break;
      } else if (chunk === '[ERROR]') {
        console.error('🚨 Error in AI response - received [ERROR]');
        yield '[ERROR]';
        break;
      } else if (typeof chunk === 'string') {
        // Fallback for plain text chunks if any
        console.log('📝 Plain text chunk received:', chunk);
        yield { text: chunk };
      }
    }
    console.log(`📊 Total chunks processed: ${chunkCount}`);
  } catch (e) {
    console.error('💥 Error in AIResponseDashboardNode:', e);
    yield '[ERROR]';
  }
}