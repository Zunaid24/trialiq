import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const roles = new Set(["admin", "investigator", "clinical_reviewer", "coordinator", "viewer"]);

function adminClient() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ message: "Administrator access required" }, { status: 403 });
  const admin = adminClient();
  const { data: users, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  const { data: profiles } = await supabase.from("profiles").select("id,full_name,role,last_seen_at,created_at");
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
  return NextResponse.json({ users: users.users.map((u: any) => { const p = profileMap.get(u.id); return { id: u.id, email: u.email, full_name: p?.full_name || u.user_metadata?.full_name || "", role: p?.role || "viewer", last_seen_at: p?.last_seen_at || null, created_at: u.created_at }; }) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ message: "Administrator access required" }, { status: 403 });
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const role = String(body.role || "viewer");
  if (!email || !roles.has(role)) return NextResponse.json({ message: "Valid email and role are required" }, { status: 400 });
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { role } });
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  if (data.user) await admin.from("profiles").upsert({ id: data.user.id, full_name: data.user.user_metadata?.full_name || email.split("@")[0], role });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return NextResponse.json({ message: "Administrator access required" }, { status: 403 });
  const body = await request.json();
  if (!body.id || !roles.has(body.role)) return NextResponse.json({ message: "Valid user and role are required" }, { status: 400 });
  if (body.id === user.id && body.role !== "admin") return NextResponse.json({ message: "You cannot remove your own administrator access." }, { status: 400 });
  const admin = adminClient();
  const { error } = await admin.from("profiles").update({ role: body.role }).eq("id", body.id);
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
