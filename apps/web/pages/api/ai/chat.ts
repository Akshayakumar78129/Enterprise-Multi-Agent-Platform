import type { NextApiRequest, NextApiResponse } from "next";

type AgentName = "orchestrator" | "sales" | "customer" | "finance";

const mapAgentToAppName: Record<AgentName, string> = {
  orchestrator: "orchestration_agent",
  sales: "sales_agent",
  customer: "customer_agent",
  finance: "financial_agent",
};

const GATEWAY =
  process.env.AGENT_GATEWAY_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8002";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { agent = "orchestrator", message, context } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });

    const appName =
      mapAgentToAppName[(agent as AgentName) || "orchestrator"] || "orchestration_agent";

    // 1) ensure session (idempotent)
    const userId = "web-user";
    const sessionId = "dashboard";
    const createSessionUrl = `${GATEWAY}/apps/${appName}/users/${userId}/sessions/${sessionId}`;
    await fetch(createSessionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    // 2) POST SSE
    const sseUrl = `${GATEWAY}/run_sse_agent`;
    const payload = {
      app_name: appName,
      user_id: userId,
      session_id: sessionId,
      streaming: true,
      new_message: {
        parts: [{ text: message }],
        context: context ?? null,
      },
    };

    const controller = new AbortController();
    const timeoutMs = 60000; // 60s hard cap
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const upstream = await fetch(sseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream", // important for some proxies
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!upstream.ok || !upstream.body) {
      clearTimeout(timeout);
      const detail = await upstream.text().catch(() => "");
      return res
        .status(upstream.status || 502)
        .json({ error: `Upstream ${upstream.status}`, detail });
    }

    // 3) Parse SSE: return as soon as we get first meaningful 'data:' with text
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let firstAgent: string | null = null;
    let answer = "";

    outer: while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const records = buffer.split("\n\n");
      buffer = records.pop() ?? "";

      for (const rec of records) {
        // SSE lines
        const lines = rec.split("\n");
        // allow multiple "data:" lines per record
        const datas = lines.filter(l => l.startsWith("data: "));
        for (const d of datas) {
          try {
            const json = JSON.parse(d.slice(6));
            if (!firstAgent && json.agent) firstAgent = json.agent;
            if (json.text) {
              answer = json.text;
              break outer; // return on first real text response
            }
          } catch {
            // ignore keepalives
          }
        }
      }
    }

    clearTimeout(timeout);

    if (!answer) {
      return res.status(502).json({ error: "No content from agent" });
    }

    return res.status(200).json({
      agent,
      answer,
      raw: { appName, firstAgent, context },
    });
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "Gateway timeout" : e?.message || "Proxy error";
    return res.status(502).json({ error: msg });
  }
}
