// apps/web/Customer/tools/performance_deviation/ui/config/agentRegistry.ts
export const AGENT_CONFIG = {
  orchestrator: { name:"orchestrator", color:"#00e0ff", avatar:"🧩", displayName:"Orchestrator" },
  sales:       { name:"sales", color:"#10b981", avatar:"📈", displayName:"Sales Agent" },
  customer:    { name:"customer", color:"#3b82f6", avatar:"👥", displayName:"Customer Agent" },
  finance:     { name:"finance", color:"#f59e0b", avatar:"💰", displayName:"Finance Agent" },
  inventory:   { name:"inventory", color:"#8b5cf6", avatar:"📦", displayName:"Inventory Agent" }
};

export const AGENT_LIST = Object.values(AGENT_CONFIG);
