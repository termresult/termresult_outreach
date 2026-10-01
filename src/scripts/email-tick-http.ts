import { createServer } from "node:http";
import { tickEmailCampaign, tickRunningEmailCampaigns } from "../lib/send/email-tick";

const port = Number(process.env.PORT ?? 8080);

function authorized(header: string | undefined): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return header === `Bearer ${secret}`;
}

function json(res: import("node:http").ServerResponse, status: number, body: unknown) {
  const text = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(text);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  if (url.pathname !== "/" && url.pathname !== "/tick") {
    json(res, 404, { error: "Not found." });
    return;
  }

  if (!authorized(req.headers.authorization)) {
    json(res, 401, { error: "Unauthorized." });
    return;
  }

  try {
    let campaignId: string | undefined;
    if (req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const raw = Buffer.concat(chunks).toString("utf8");
      if (raw.trim()) {
        const parsed = JSON.parse(raw) as { campaign_id?: string };
        campaignId = parsed.campaign_id;
      }
    }
    if (campaignId) {
      json(res, 200, await tickEmailCampaign(campaignId));
      return;
    }
    const results = await tickRunningEmailCampaigns();
    json(res, 200, {
      ok: true,
      ticks: results,
      sent: results.reduce((sum, row) => sum + row.sent, 0),
    });
  } catch (err) {
    json(res, 500, { error: err instanceof Error ? err.message : "Tick failed." });
  }
}).listen(port, () => {
  console.log(`email-tick listening on ${port}`);
});
