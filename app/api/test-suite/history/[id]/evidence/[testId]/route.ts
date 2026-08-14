import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string; testId: string }> }) {
  const { id, testId } = await context.params;
  if (!/^[A-Za-z0-9_.-]+$/.test(id) || !/^\d+$/.test(testId)) return NextResponse.json({ error: "Invalid evidence id" }, { status: 400 });
  const file = path.join(process.cwd(), "test-reports", "web-runs", id, "evidence", `${String(Number(testId)).padStart(2, "0")}.jpg`);
  try {
    const image = await fs.readFile(file);
    return new NextResponse(image, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }
}
