export interface AIResponse {
  audio?: {
    mime_type: string;
    data: string;
  };
  text: string;
  visualisation?: any;
}

export interface SessionInfo {
  session_id: string;
  user_id: string;
  app_name: string;
}

export class AIClient {
  private backendUrl: string;
  private session: SessionInfo | null = null;

  constructor(backendUrl?: string) {
    // Use relative URL to leverage Next.js proxy
    this.backendUrl = backendUrl || '';
  }

  async createSession(appName: string = 'orchestration_agent'): Promise<SessionInfo> {
    const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = `session_${Math.random().toString(36).substr(2, 9)}`;

    // Use relative path to leverage Next.js proxy
    const response = await fetch(
      `/apps/${appName}/users/${userId}/sessions/${sessionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({})
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Session creation failed:', errorText);
      throw new Error(`Failed to create session: ${response.status}`);
    }

    this.session = { session_id: sessionId, user_id: userId, app_name: appName };
    return this.session;
  }

  getSession(): SessionInfo | null {
    return this.session;
  }

  async *streamQuery(
    query: string,
    onProgress?: (data: AIResponse) => void
  ): AsyncGenerator<AIResponse, void, unknown> {
    if (!this.session) {
      await this.createSession();
    }

    // Use relative path to leverage Next.js proxy
    const response = await fetch(`/run_sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        user_query: query,
        session_id: this.session!.session_id,
        user_id: this.session!.user_id,
        app_name: this.session!.app_name
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send query: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) {
      throw new Error('Response body is empty');
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr && dataStr !== '[DONE]') {
            try {
              const data = JSON.parse(dataStr) as AIResponse;
              if (onProgress) {
                onProgress(data);
              }
              yield data;
            } catch (e) {
              console.error('Failed to parse SSE data:', e, dataStr);
            }
          }
        } else if (line.startsWith('error: ')) {
          throw new Error(line.slice(7));
        }
      }
    }
  }

  async sendQuery(query: string): Promise<AIResponse[]> {
    const responses: AIResponse[] = [];

    for await (const response of this.streamQuery(query)) {
      responses.push(response);
    }

    return responses;
  }
}