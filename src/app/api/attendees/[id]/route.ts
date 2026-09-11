import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { parseAttendeeUpdateBody } from "@/lib/attendees/update-input";
import { AttendeeError, updateAttendee } from "@/lib/store/attendees";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  try {
    const { input, actor } = parseAttendeeUpdateBody(body);
    const attendee = await updateAttendee(id, input, actor);
    return NextResponse.json({ attendee });
  } catch (error) {
    if (error instanceof AttendeeError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
