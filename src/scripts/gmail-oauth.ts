import { createServer } from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { exec } from "node:child_process";

const PORT = 4175;
const REDIRECT = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

function envValue(name: string): string {
  return (process.env[name] ?? "").trim();
}

function loadDotEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function upsertEnv(values: Record<string, string>) {
  const path = resolve(process.cwd(), ".env.local");
  const current = existsSync(path) ? readFileSync(path, "utf8") : "";
  const lines = current.split(/\r?\n/);
  const seen = new Set<string>();
  const next = lines.map((line) => {
    const eq = line.indexOf("=");
    if (eq < 1 || line.trim().startsWith("#")) return line;
    const key = line.slice(0, eq);
    if (values[key] === undefined) return line;
    seen.add(key);
    return `${key}=${values[key]}`;
  });
  for (const [key, value] of Object.entries(values)) {
    if (!seen.has(key)) next.push(`${key}=${value}`);
  }
  writeFileSync(path, `${next.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n").replace(/\n*$/, "\n")}`, "utf8");
}

function openUrl(url: string) {
  const command = process.platform === "win32" ? `start "" "${url}"` : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
  exec(command);
}

async function main() {
  loadDotEnv();
  const clientId = envValue("GOOGLE_GMAIL_CLIENT_ID");
  const clientSecret = envValue("GOOGLE_GMAIL_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    console.error("Set GOOGLE_GMAIL_CLIENT_ID and GOOGLE_GMAIL_CLIENT_SECRET in .env.local first.");
    process.exit(1);
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", REDIRECT);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  const token = await new Promise<{ refresh_token: string; email?: string }>((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
        if (url.pathname !== "/oauth2callback") {
          res.writeHead(404);
          res.end();
          return;
        }
        const error = url.searchParams.get("error");
        const code = url.searchParams.get("code");
        if (error || !code) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end(error ?? "Missing code");
          reject(new Error(error ?? "Missing code"));
          server.close();
          return;
        }
        const body = new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: REDIRECT,
          grant_type: "authorization_code",
        });
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        const payload = (await response.json()) as {
          refresh_token?: string;
          access_token?: string;
          scope?: string;
          error?: string;
          error_description?: string;
        };
        if (!response.ok || !payload.refresh_token) {
          throw new Error(payload.error_description ?? payload.error ?? "No refresh token. Re-consent with prompt=consent.");
        }
        if (!payload.scope?.includes("https://www.googleapis.com/auth/gmail.send")) {
          throw new Error(
            "Google did not grant gmail.send. Add that scope under Auth > Data Access, then run pnpm gmail:oauth again.",
          );
        }
        let email: string | undefined;
        if (payload.access_token) {
          const me = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${payload.access_token}` },
          });
          const info = (await me.json()) as { email?: string };
          email = info.email;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<p>Gmail connected${email ? ` as <b>${email}</b>` : ""}. You can close this tab.</p>`);
        server.close();
        resolvePromise({ refresh_token: payload.refresh_token, email });
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(err instanceof Error ? err.message : "OAuth failed");
        server.close();
        reject(err);
      }
    });
    server.listen(PORT, "127.0.0.1", () => {
      console.log(`Sign in as admin@termresult.com:\n${authUrl.toString()}`);
      openUrl(authUrl.toString());
    });
  });

  upsertEnv({
    GOOGLE_GMAIL_REFRESH_TOKEN: token.refresh_token,
    GMAIL_FROM: token.email || envValue("GMAIL_FROM") || "admin@termresult.com",
  });
  if (token.email && token.email.toLowerCase() !== "admin@termresult.com") {
    console.warn(`Signed in as ${token.email}, not admin@termresult.com. Mail will send as that mailbox.`);
  }
  console.log("Refresh token saved to .env.local");
}

void main();
