// Next.js API route: proxies Engagement Classifier chat to local chatbot server
// - Non-mention messages are handled locally by the chatbot server
// - @mentions will be proxied by the chatbot server to ADK

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { message, context = {}, session = {}, responseMode = 'detailed' } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // Resolve chatbot server URL
    const port = process.env.NEXT_PUBLIC_CHATBOT_PORT || process.env.CHATBOT_PORT || '3010';
    const baseUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL || `http://localhost:${port}`;

    // Proxy to chatbot server. That server will internally decide whether to route to ADK based on @tags.
    const upstream = await fetch(`${baseUrl}/api/chatbot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context, sessionId: session.session_id, mode: responseMode })
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ success: false, error: `Chatbot server error`, details: text });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Engagement classifier API proxy error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } }
};