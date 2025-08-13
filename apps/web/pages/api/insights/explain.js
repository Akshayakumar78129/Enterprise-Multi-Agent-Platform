import { GoogleGenAI } from "@google/genai";


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
  const { prompt, context, mode = 'strategic', action = 'explain' } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ text: 'AI is not configured (missing GEMINI_API_KEY). Provide the key to enable explanations.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const instructionsByMode = {
      quick: [
        'You are an analytics assistant. Explain clearly for business stakeholders.',
        'Be concise, avoid jargon, but be specific with numbers and ranges when available.',
        'Include 2 concrete actions with expected impact and simple success metrics.',
      ].join(' '),
      strategic: [
        'You are a senior, decisive, data-driven strategy assistant.',
        'Given the selection and broader context, produce a short executive brief with these sections:',
        '1) What it means (1-2 bullets);',
        '2) Likely drivers (2 bullets) with evidence from context;',
        '3) Opportunities/Levers (3 bullets) with estimated impact (% or $) and confidence;',
        '4) Risks/Watch-outs (1-2 bullets) with mitigation;',
        '5) Recommended actions for next 30/90 days (3-5 bullets, prioritized, include owners/effort/metric);',
        '6) Quick experiments (1-2 ideas) with success metrics;',
        '7) Metrics to monitor with suggested thresholds and alert rules;',
        '8) Brief directional forecast if feasible with assumptions and a confidence range.',
        'Use layman terms, be specific and practical. Prefer numbers, ranges, confidence.',
      ].join(' '),
      forecast: [
        'You are an analytics forecaster. Provide a directional forecast and 2-3 scenarios (best/base/worst)',
        'with explicit numeric ranges, assumptions, and confidence. Call out implications on revenue/cashflow/volume,',
        'and 2 actions to hedge risk. Be concise and avoid jargon.',
      ].join(' '),
    };

    const modeText = instructionsByMode[mode] || instructionsByMode.strategic;
    const actionText = action === 'followup'
      ? 'Answer the user question directly and specifically using the context. Do not re-summarize the whole selection unless necessary. Use numbers where possible.'
      : 'Explain the selection first, then provide strategy/forecast as requested.';
    const system = `${modeText} ${actionText}`;

    // Allow larger context for richer answers, but still bounded
    const trimmed = typeof context === 'string' ? context : JSON.stringify(context);
    const user = `${prompt || 'Explain the selection.'}\n\nContext JSON (truncated):\n${(trimmed || '').slice(0, 50000)}`;

    const finalPrompt = `${system}\n\n---\n\n${user}`;

    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents:finalPrompt,
    });
    console.log(resp);
    const explanation = resp.text || 'No explanation received.';
    const audit = { prompt: finalPrompt, model: 'gemini-2.5-flash' };
    res.status(200).json({ text: explanation, audit });
  } catch (e) {
    res.status(200).json({ text: `AI error: ${e.message}` });
  }
}
