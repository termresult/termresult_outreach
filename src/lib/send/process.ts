import { getAdapter } from "@/lib/send/adapters";
import { getCampaign, listMessages, replaceMessages, saveCampaign } from "@/lib/store/outreach";
import type { Message } from "@/types/message";

export const SEND_BATCH = 12;

export async function processQueue(
  campaignId?: string,
  limit = SEND_BATCH,
): Promise<{ sent: number; failed: number; skipped: number; left_queued: number }> {
  const rows = (await listMessages(campaignId)).filter((row) => row.status === "queued").slice(0, limit);
  if (campaignId) {
    const campaign = await getCampaign(campaignId);
    if (campaign && campaign.status !== "done") {
      campaign.status = "running";
      await saveCampaign(campaign);
    }
  }

  const next: Message[] = [];
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    const adapter = getAdapter(row.channel);
    if (!adapter.configured) {
      next.push(row);
      continue;
    }
    const result = await adapter.send(row);
    const updated: Message = { ...row, attempted_at: new Date().toISOString() };
    if (result.status === "skipped") {
      updated.status = "skipped";
      updated.skip_reason = result.skip_reason ?? "provider_not_configured";
      updated.completed_at = updated.attempted_at;
      skipped += 1;
    } else if (result.status === "failed") {
      updated.status = "failed";
      updated.error = result.error ?? "send failed";
      updated.completed_at = updated.attempted_at;
      failed += 1;
    } else {
      updated.status = "sent";
      updated.provider_id = result.provider_id ?? null;
      updated.completed_at = updated.attempted_at;
      sent += 1;
    }
    next.push(updated);
  }

  await replaceMessages(next);

  let leftQueued = 0;
  if (campaignId) {
    leftQueued = (await listMessages(campaignId)).filter((row) => row.status === "queued").length;
    const campaign = await getCampaign(campaignId);
    if (campaign && leftQueued === 0) {
      campaign.status = "done";
      await saveCampaign(campaign);
    }
  } else {
    leftQueued = (await listMessages()).filter((row) => row.status === "queued").length;
  }

  return { sent, failed, skipped, left_queued: leftQueued };
}
