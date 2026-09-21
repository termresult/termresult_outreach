import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { deleteReminder, ReminderError, updateReminder } from "@/lib/store/reminders";
import type { ReminderInput } from "@/types/reminder";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await request.json()) as Partial<ReminderInput> & {
    operator_name?: string;
    done?: boolean;
  };

  try {
    const reminder = await updateReminder(id, body, body.operator_name ?? "");
    return NextResponse.json({ reminder });
  } catch (error) {
    if (error instanceof ReminderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as { operator_name?: string };

  try {
    await deleteReminder(id, body.operator_name ?? "");
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ReminderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
