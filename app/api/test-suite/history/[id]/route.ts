import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[A-Za-z0-9_.-]+$/.test(id)) return NextResponse.json({ error: "Invalid run id" }, { status: 400 });
  const file = path.join(process.cwd(), "test-reports", "web-runs", `${id}.json`);
  try {
    const report = JSON.parse(await fs.readFile(file, "utf8"));
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
}
