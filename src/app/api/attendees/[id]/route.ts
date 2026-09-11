import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { AttendeeError, updateAttendee } from "@/lib/store/attendees";
import type { AttendeeInput } from "@/types/attendee";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await request.json()) as Partial<AttendeeInput> & { operator_name?: string };

  try {
    const attendee = await updateAttendee(id, body, body.operator_name ?? "");
    return NextResponse.json({ attendee });
  } catch (error) {
    if (error instanceof AttendeeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
