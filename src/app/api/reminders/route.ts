import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  createReminder,
  listReminderSchools,
  listReminders,
  ReminderError,
} from "@/lib/store/reminders";
import type { ReminderInput } from "@/types/reminder";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const [reminders, schools] = await Promise.all([listReminders(), listReminderSchools()]);
  return NextResponse.json({ reminders, schools });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = (await request.json()) as ReminderInput & { operator_name?: string };

  try {
    const reminder = await createReminder(body, body.operator_name ?? "");
    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    if (error instanceof ReminderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
