'use client'

const backendAiUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || process.env.ADK_BASE_URL || 'http://127.0.0.1:5000';

export async function* AIResponseDashboard(query, session) {
    if (!query) yield '[ERROR]';
    console.log(backendAiUrl)

    try {
        const response = await fetch(`${backendAiUrl}/run_sse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
            body: JSON.stringify({ 
                new_message: { role: "user", parts: [{ text: query }] },
                session_id: session.session_id, 
                user_id: session.user_id, 
                app_name: session.app_name, 
                streaming: true 
            })
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
                            yield jsonData;
                            
                        } catch (e) {
                            console.warn('Error in AIResponseDashboard:', e);
                        }
                    }
                }
            }
            // Signal completion once after stream ends
            yield '[DONE]';
        } finally {
            reader.releaseLock();
        }
    } catch (e) {
        console.warn('Error in AIResponseDashboard:', e);
        yield '[ERROR]';
    }
}

// Enhanced version that yields full JSON objects for visualization support
export async function* AIResponseDashboardWithViz(query, session) {
    if (!query) yield '[ERROR]';
    console.log('🔗 Backend URL:', backendAiUrl);
    console.log('📤 Request payload:', { 
        new_message: { role: "user", parts: [{ text: query }] },
        session_id: session.session_id, 
        user_id: session.user_id, 
        app_name: session.app_name, 
        streaming: true 
    });

    try {
        // Use different endpoint based on agent type
        const endpoint = session.app_name === 'orchestration_agent' ? '/run_sse' : '/run_sse_agent';
        const response = await fetch(`${backendAiUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
            body: JSON.stringify({ 
                new_message: { role: "user", parts: [{ text: query }] },
                session_id: session.session_id, 
                user_id: session.user_id, 
                app_name: session.app_name, 
                streaming: true 
            })
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers);
        
        if (!response.ok) {
            console.error('❌ HTTP Error:', response.status, response.statusText);
            try {
                const errorText = await response.text();
                console.error('❌ Error body:', errorText);
            } catch (e) {
                console.error('❌ Could not read error body:', e);
            }
            yield '[ERROR]';
            return;
        }
        
        
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
                            console.log('🟢 AIResponseDashboardWithViz:', jsonData);
                            // Yield the full JSON object for visualization support
                            yield jsonData;
                            
                        } catch (e) {
                            console.warn('❌ JSON Parse Error in AIResponseDashboardWithViz:', e);
                            console.warn('❌ Raw data that failed to parse:', data);
                            // Try yielding as plain text
                            yield { text: data };
                        }
                    }
                }
            }
            // Signal completion once after stream ends
            yield '[DONE]';
        } finally {
            reader.releaseLock();
        }
    } catch (e) {
        console.warn('Error in AIResponseDashboardWithViz:', e);
        yield '[ERROR]';
    }
}