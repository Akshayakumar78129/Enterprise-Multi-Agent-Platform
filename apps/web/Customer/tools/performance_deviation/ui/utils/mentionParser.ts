// apps/web/Customer/tools/performance_deviation/ui/utils/mentionParser.ts
import { AGENT_LIST } from "../config/agentRegistry";
export const detectMention = (text: string) => {
  const m = text.match(/@([a-zA-Z_]+)/);
  if (!m) return null;
  const q = m[1].toLowerCase();
  return AGENT_LIST.find(a => a.name.toLowerCase().startsWith(q)) || null;
};
