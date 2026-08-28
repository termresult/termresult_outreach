import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  getProprietor,
  lockProprietor,
  ProprietorError,
  updateProprietor,
} from "@/lib/store/proprietors";
import type { ProprietorInput } from "@/types/proprietor";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await ctx.params;
  const proprietor = await getProprietor(id);
  if (!proprietor) return NextResponse.json({ error: "School not found." }, { status: 404 });
  return NextResponse.json({ proprietor });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await request.json()) as Partial<ProprietorInput> & { operator_name?: string };

  try {
    const proprietor = await updateProprietor(id, body, body.operator_name ?? "");
    return NextResponse.json({ proprietor });
  } catch (error) {
    if (error instanceof ProprietorError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await ctx.params;
  const body = (await request.json()) as { action?: string; operator_name?: string };

  if (body.action !== "lock") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  try {
    const proprietor = await lockProprietor(id, body.operator_name ?? "");
    return NextResponse.json({ proprietor });
  } catch (error) {
    if (error instanceof ProprietorError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
