import { useState, useCallback, useRef } from 'react';

interface UseEnterpriseQueryOptions {
  onAudioReceived?: (audioData: any) => void;
  onVisualizationReceived?: (visualization: any) => void;
  onAgentChange?: (agent: string) => void;
}

export const useEnterpriseQuery = (options: UseEnterpriseQueryOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session] = useState({
    session_id: `session-${Date.now()}`,
    user_id: 'enterprise-user',
    app_name: 'enterprise_iq'
  });

  const sendQuery = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:8000';

      const response = await fetch(`${backendUrl}/run_sse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          user_query: query,
          session_id: session.session_id,
          user_id: session.user_id,
          app_name: session.app_name,
          is_canvas: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = { text: '', content: '' };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.replace('data: ', '').trim();
            if (data === '[DONE]' || data === '') continue;

            try {
              const jsonData = JSON.parse(data);

              if (jsonData.text) {
                fullResponse.text += jsonData.text;
                fullResponse.content += jsonData.text;
              }

              if (jsonData.audio && options.onAudioReceived) {
                options.onAudioReceived(jsonData.audio);
              }

              if ((jsonData.visualisation || jsonData.visualization_output) && options.onVisualizationReceived) {
                options.onVisualizationReceived(jsonData.visualisation || jsonData.visualization_output);
              }

              if (jsonData.agent && options.onAgentChange) {
                options.onAgentChange(jsonData.agent);
              }
            } catch (e) {
              console.warn('Error parsing SSE data:', e);
            }
          }
        }
      }

      return fullResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session, options]);

  return {
    sendQuery,
    loading,
    error,
    session
  };
};