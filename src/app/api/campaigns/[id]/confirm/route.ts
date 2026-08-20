import { NextResponse } from "next/server";
import { confirmCampaign } from "@/lib/campaigns/create";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json(confirmCampaign(id));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not confirm.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
