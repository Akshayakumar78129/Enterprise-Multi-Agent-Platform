export async function sendToAgent(
  message: string,
  agent: "orchestrator" | "sales" | "customer" | "finance" | null = "orchestrator",
  snapshot?: any,
  focus?: any
) {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent: agent || "orchestrator",
      message,
      context: { snapshot: snapshot ?? null, focus: focus ?? null },
    }),
  });
  if (!res.ok) throw new Error(`Agent API failed (${res.status})`);
  return res.json(); // { answer, raw, agent }
}
