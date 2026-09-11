import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listAttendees } from "@/lib/store/attendees";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  return NextResponse.json({ attendees: await listAttendees() });
}
