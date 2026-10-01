const PROJECT = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() || "termresult-outreach";
const LOCATION = process.env.CLOUD_TASKS_LOCATION?.trim() || "us-central1";
const QUEUE = process.env.CLOUD_TASKS_QUEUE?.trim() || "email-send";
const TICK_URL =
  process.env.EMAIL_TICK_URL?.trim() ||
  "https://termresult-email-tick-219195820109.us-central1.run.app/tick";

async function accessToken(): Promise<string> {
  const metadata = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } },
  ).catch(() => null);
  if (metadata?.ok) {
    const payload = (await metadata.json()) as { access_token?: string };
    if (payload.access_token) return payload.access_token;
  }

  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Could not get Cloud Tasks token.");
  return token.token;
}

export async function scheduleEmailTick(campaignId: string, delaySeconds: number): Promise<void> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.warn("schedule.skip", { reason: "missing_cron_secret", campaignId });
    return;
  }

  const wait = Math.max(1, Math.ceil(delaySeconds));
  const scheduleTime = new Date(Date.now() + wait * 1000).toISOString();
  const name = `projects/${PROJECT}/locations/${LOCATION}/queues/${QUEUE}/tasks`;
  const token = await accessToken();
  const response = await fetch(`https://cloudtasks.googleapis.com/v2/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      task: {
        scheduleTime,
        httpRequest: {
          httpMethod: "POST",
          url: TICK_URL,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secret}`,
          },
          body: Buffer.from(JSON.stringify({ campaign_id: campaignId })).toString("base64"),
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloud Tasks rejected the next tick: ${response.status} ${text}`);
  }
  console.info("schedule.next", { campaignId, delaySeconds: wait, scheduleTime });
}
