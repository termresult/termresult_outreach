import { NextResponse } from "next/server";
import { importFctFromDisk, importText } from "@/lib/import/run-import";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { fromDisk?: boolean };
      if (!body.fromDisk) {
        return NextResponse.json({ error: "Nothing to import." }, { status: 400 });
      }
      return NextResponse.json(importFctFromDisk());
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a CSV or JSON file." }, { status: 400 });
    }
    const text = await file.text();
    return NextResponse.json(importText(file.name, text));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
