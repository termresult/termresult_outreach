import { NextResponse } from "next/server";
import { MOCK_OPERATOR, isMockAuth } from "@/lib/auth/mock";

const COOKIE = "outreach_session";
const WEEK = 60 * 60 * 24 * 5;

export async function POST() {
  const response = NextResponse.json({ ok: true, email: MOCK_OPERATOR.email, mock: isMockAuth() });
  response.cookies.set(COOKIE, `mock:${MOCK_OPERATOR.email}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WEEK,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
