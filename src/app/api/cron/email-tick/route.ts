import { NextResponse } from "next/server";
import { tickEmailCampaign, tickRunningEmailCampaigns } from "@/lib/send/email-tick";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization");
  if (secret) return header === `Bearer ${secret}`;
  return process.env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const results = await tickRunningEmailCampaigns();
  return NextResponse.json({
    ok: true,
    ticks: results,
    sent: results.reduce((sum, row) => sum + row.sent, 0),
  });
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { campaign_id?: string };
  if (body.campaign_id) {
    const result = await tickEmailCampaign(body.campaign_id);
    return NextResponse.json(result);
  }
  const results = await tickRunningEmailCampaigns();
  return NextResponse.json({
    ok: true,
    ticks: results,
    sent: results.reduce((sum, row) => sum + row.sent, 0),
  });
}
