import {
  countMessagesByStatus,
  getCampaign,
  listRunningEmailCampaigns,
  nextQueuedMessage,
  replaceMessages,
  saveCampaign,
} from "@/lib/store/outreach";
import { getContact } from "@/lib/store/contacts";
import {
  canSendFromCursor,
  lagosDateKey,
  remainingGapSeconds,
  secondsUntilNextLagosMidnight,
  sentTodayFromCursor,
} from "@/lib/send/throttle";
import { isGmailConfigured, sendEmail } from "@/lib/send/email-gmail";
import { scheduleEmailTick } from "@/lib/send/schedule-next";
import { emptySendCursor, type Campaign } from "@/types/campaign";
import type { Message } from "@/types/message";

export type EmailTickResult = {
  campaign_id: string;
  sent: number;
  failed: number;
  skipped: number;
  left_queued: number;
  reason?: "provider_not_configured" | "none_queued" | "daily_cap" | "gap" | "not_running";
};

export function runningEmailCampaigns(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter((row) => row.channel === "email" && row.status === "running");
}

async function queueNext(campaign: Campaign, delaySeconds: number) {
  try {
    await scheduleEmailTick(campaign.id, delaySeconds);
  } catch (err) {
    console.error("schedule.failed", {
      campaign_id: campaign.id,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

export async function tickEmailCampaign(
  campaignId: string,
  now = new Date(),
): Promise<EmailTickResult> {
  const campaign = await getCampaign(campaignId);
  if (!campaign || campaign.channel !== "email") {
    return { campaign_id: campaignId, sent: 0, failed: 0, skipped: 0, left_queued: 0, reason: "none_queued" };
  }

  const cursor = campaign.send_cursor ?? emptySendCursor();
  if (campaign.status !== "running") {
    return {
      campaign_id: campaignId,
      sent: 0,
      failed: 0,
      skipped: 0,
      left_queued: cursor.queued_left,
      reason: "not_running",
    };
  }
  if (!isGmailConfigured()) {
    return {
      campaign_id: campaignId,
      sent: 0,
      failed: 0,
      skipped: 0,
      left_queued: cursor.queued_left,
      reason: "provider_not_configured",
    };
  }

  const sentToday = sentTodayFromCursor(cursor, now);
  const gate = canSendFromCursor({
    queuedLeft: cursor.queued_left,
    lastEmailAt: cursor.last_email_at,
    sentToday,
    throttle: campaign.throttle,
    now,
  });
  if (!gate.ok) {
    if (gate.reason === "daily_cap") {
      await queueNext(campaign, secondsUntilNextLagosMidnight(now));
    } else if (gate.reason === "gap") {
      await queueNext(campaign, remainingGapSeconds(cursor.last_email_at, campaign.throttle.gap_seconds, now));
    }
    return {
      campaign_id: campaignId,
      sent: 0,
      failed: 0,
      skipped: 0,
      left_queued: cursor.queued_left,
      reason: gate.reason,
    };
  }

  const next = await nextQueuedMessage(campaignId);
  if (!next) {
    campaign.status = "done";
    campaign.send_cursor = { ...cursor, queued_left: 0 };
    await saveCampaign(campaign);
    return { campaign_id: campaignId, sent: 0, failed: 0, skipped: 0, left_queued: 0, reason: "none_queued" };
  }

  const result = await sendEmail(next, {
    contact: await getContact(next.contact_id),
    subject: campaign.email_subject,
    suppressions: [],
  });
  const attempted = new Date().toISOString();
  const updated: Message = { ...next, attempted_at: attempted };

  if (result.status === "skipped") {
    updated.status = "skipped";
    updated.skip_reason = result.skip_reason ?? "provider_not_configured";
    updated.completed_at = attempted;
  } else if (result.status === "failed") {
    updated.status = "failed";
    updated.error = result.error ?? "send failed";
    updated.completed_at = attempted;
  } else {
    updated.status = "sent";
    updated.provider_id = result.provider_id ?? null;
    updated.completed_at = attempted;
  }

  await replaceMessages([updated]);

  const day = lagosDateKey(now);
  const nextSentToday = result.status === "sent" ? sentToday + 1 : sentToday;
  const queuedLeft = Math.max(0, cursor.queued_left - 1);
  campaign.send_cursor = {
    last_email_at: result.status === "sent" ? attempted : cursor.last_email_at,
    send_day: day,
    sent_today: nextSentToday,
    queued_left: queuedLeft,
  };
  if (queuedLeft === 0) campaign.status = "done";
  await saveCampaign(campaign);

  if (campaign.status === "running" && queuedLeft > 0) {
    if (nextSentToday >= campaign.throttle.daily_cap) {
      await queueNext(campaign, secondsUntilNextLagosMidnight(now));
    } else {
      await queueNext(campaign, campaign.throttle.gap_seconds);
    }
  }

  return {
    campaign_id: campaignId,
    sent: result.status === "sent" ? 1 : 0,
    failed: result.status === "failed" ? 1 : 0,
    skipped: result.status === "skipped" ? 1 : 0,
    left_queued: queuedLeft,
  };
}

export async function tickRunningEmailCampaigns(now = new Date()): Promise<EmailTickResult[]> {
  const results: EmailTickResult[] = [];
  for (const campaign of await listRunningEmailCampaigns()) {
    results.push(await tickEmailCampaign(campaign.id, now));
  }
  return results;
}

export async function refreshQueuedLeft(campaign: Campaign): Promise<number> {
  const queued = await countMessagesByStatus(campaign.id, "queued");
  campaign.send_cursor = { ...(campaign.send_cursor ?? emptySendCursor()), queued_left: queued };
  await saveCampaign(campaign);
  return queued;
}
