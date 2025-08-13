import { AGENT_REGISTRY } from '../config';

interface AgentResponse { content: string; meta?: Record<string, any>; }

// Pure front-end mock implementation (all server endpoints removed).
// deterministic pseudo random utilities
function hashStr(str: string): number { let h=0; for (let i=0;i<str.length;i++) h=Math.imul(31,h)+str.charCodeAt(i)|0; return h>>>0; }
function prng(seed: number){ let x=seed||123456789; return () => { x^=x<<13; x^=x>>>17; x^=x<<5; return (x>>>0)/4294967295; }; }

export const sendAgentMessage = async (agent: string, prompt: string, context: any): Promise<AgentResponse> => {
  const registryEntry = AGENT_REGISTRY[agent];
  if (!registryEntry) throw new Error(`Unknown agent: ${agent}`);
  const seedBase = `${agent}|${prompt}|${JSON.stringify(context||{})}`;
  const rand = prng(hashStr(seedBase));
  const delay = 400 + Math.floor(rand()*600);
  await new Promise(r => setTimeout(r, delay));
  const now = new Date();
  const template = registryEntry.template
    .replace(/\[Department\]/g, registryEntry.displayName)
    .replace(/\[Department-Specific Section\]/g, registryEntry.displayName)
    .replace(/\[AGENT_EMOJI\]/g, registryEntry.avatar)
    .replace(/\$\[VALUE\]/g, () => (rand() * 1000).toFixed(2))
    .replace(/\[VALUE\]/g, () => (rand() * 100).toFixed(1))
    .replace(/\[CALCULATION.*?\]/g, () => (rand() * 50).toFixed(2))
    .replace(/\[Action Item \d\]/g, () => `Focus on optimizing metric ${(rand()*10).toFixed(1)}`)
    .replace(/\[Risk \d and mitigation strategy\]/g, () => `Potential slowdown detected – implement contingency plan ${(rand()*5).toFixed(1)}`);
  return { content: template, meta: { ts: now.toISOString(), agent, mode: 'mock', deterministic: true } };
};

export const fetchAgentSuggestions = (query: string) => {
  const lower = query.toLowerCase();
  return Object.keys(AGENT_REGISTRY)
    .filter(k => k.toLowerCase().includes(lower))
    .map(k => ({ agentName: k, ...AGENT_REGISTRY[k] }));
};
