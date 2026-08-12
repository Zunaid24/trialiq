import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body?.action === "resolve" ? "resolved" : body?.action === "dismiss" ? "dismissed" : "reviewed";
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { reviewed_at: now, updated_at: now };
  if (action === "resolved" || action === "dismissed") { update.status = action; update.resolved_at = now; }
  const { data, error } = await supabase.from("findings").update(update).eq("id", id).eq("owner_id", user.id).select("id,status,reviewed_at,resolved_at").single();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  await supabase.from("finding_reviews").insert({ owner_id: user.id, finding_id: id, action, note: body?.note || null });
  return NextResponse.json({ success: true, finding: data });
}
