'use client'

const backendAiUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:5000';

export async function* AIResponseDashboard(query, session) {
    if (!query) yield '[ERROR]';
    console.log(backendAiUrl)

    try {
        const response = await fetch(`${backendAiUrl}/run_sse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
            body: JSON.stringify({ user_query: query, session_id: session.session_id, user_id: session.user_id, app_name: session.app_name, is_canvas: false })
        });
        
        
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
                    if (line.startsWith('data: ')) {
                        const data = line.replace('data: ', '').trim();
                        
                        if (data === '[DONE]' || data === '') continue;
                        
                        try {
                            const jsonData = JSON.parse(data);
                            console.log('🟢 AIResponseDashboard:', jsonData);
                            yield jsonData.text;
                            
                        } catch (e) {
                            console.warn('Error in AIResponseDashboard:', e);
                        }
                    }
                }
                yield '[DONE]';
            }
        } finally {
            reader.releaseLock();
        }
    } catch (e) {
        console.warn('Error in AIResponseDashboard:', e);
        yield '[ERROR]';
    }
}