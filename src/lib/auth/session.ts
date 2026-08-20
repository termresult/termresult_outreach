import { cookies } from "next/headers";
import { MOCK_OPERATOR, isMockAuth } from "@/lib/auth/mock";
import { isAllowlisted } from "@/lib/auth/allowlist";

export type SessionUser = {
  email: string;
  uid: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  if (isMockAuth()) return MOCK_OPERATOR;

  const token = (await cookies()).get("outreach_session")?.value;
  if (!token) return null;

  if (token.startsWith("mock:")) {
    const email = token.slice(5);
    if (!isAllowlisted(email)) return null;
    return { email, uid: "mock-operator" };
  }

  return null;
}
