import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  createProprietor,
  listProprietors,
  ProprietorError,
} from "@/lib/store/proprietors";
import type { ProprietorInput } from "@/types/proprietor";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  return NextResponse.json({ proprietors: await listProprietors() });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = (await request.json()) as ProprietorInput & { operator_name?: string };

  try {
    const result = await createProprietor(body, body.operator_name ?? "");
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof ProprietorError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
