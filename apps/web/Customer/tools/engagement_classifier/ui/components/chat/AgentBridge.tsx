import { AIResponseDashboard } from '../../../../../../ui-common/ai-interaction/aiResponse';

// Define chunk structure from backend
interface AgentChunk {
  agent?: string;
  text?: string;
}

/**
 * Bridge function to stream responses from ADK agents.
 * @param query - user query (may include @sales, @inventory, etc.)
 * @param session - session object with { session_id, user_id, app_name }
 * @param onMessage - callback when a new agent message arrives
 * @param onComplete - callback when the stream ends
 * @param onError - callback if an error occurs
 */
export async function sendToAgent(
  query: string,
  session: any,
  onMessage: (agent: string, text: string) => void,
  onComplete?: () => void,
  onError?: (err: any) => void
): Promise<void> {
  try {
    const response = AIResponseDashboard(query, session);

    for await (const chunk of response as AsyncIterable<AgentChunk | string>) {
      if (typeof chunk === 'object' && chunk?.agent && chunk?.text) {
        // Forward agent + text to the UI
        onMessage(chunk.agent, chunk.text);
      } else if (chunk === '[DONE]') {
        if (onComplete) onComplete();
        break;
      } else if (chunk === '[ERROR]') {
        if (onError) onError(new Error('Agent stream failed'));
        break;
      }
    }
  } catch (err) {
    console.error('sendToAgent error:', err);
    if (onError) onError(err);
  }
}
