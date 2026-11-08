import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function daysAgo(value: string) { return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000)); }
function priorityFor(item: any) {
  const stored = String(item.priority || "").toLowerCase();
  if (stored === "critical" || stored === "high") return "HIGH";
  const text = JSON.stringify(item.metadata ?? {}).toLowerCase();
  if (/critical|urgent|unsafe/.test(text)) return "HIGH";
  if (/high priority|not eligible|requires review|review required/.test(text) || /high|critical/.test(String(item.status).toLowerCase())) return "HIGH";
  return "MEDIUM";
}
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    const [findingsResult, studiesResult, participantsResult, documentsResult] = await Promise.all([
      supabase.from("findings").select("id,analysis_type,title,summary,confidence,status,priority,metadata,created_at,updated_at,study_id,participant_id").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(200),
      supabase.from("studies").select("id,name,protocol_name,status,created_at,updated_at").eq("owner_id", user.id).order("updated_at", { ascending: false }).limit(25),
      supabase.from("participants").select("id,participant_code,status,study_id,created_at").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(500),
      supabase.from("documents").select("id,name,document_type,processing_status,created_at,study_id,participant_id").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(100),
    ]);
    if (findingsResult.error) throw findingsResult.error; if (studiesResult.error) throw studiesResult.error; if (participantsResult.error) throw participantsResult.error; if (documentsResult.error) throw documentsResult.error;
    const findings = findingsResult.data ?? []; const studies = studiesResult.data ?? []; const participants = participantsResult.data ?? []; const documents = documentsResult.data ?? [];
    const unresolved = findings.filter((item) => !["resolved", "closed", "dismissed"].includes(String(item.status).toLowerCase()));
    const critical = findings.filter((item) => priorityFor(item) === "HIGH");
    const typeMap = new Map<string, number>(); findings.forEach((item) => typeMap.set(item.analysis_type, (typeMap.get(item.analysis_type) ?? 0) + 1));
    const recentMap = new Map<string, number>(); for (let index = 6; index >= 0; index -= 1) recentMap.set(new Date(Date.now() - index * 86400000).toISOString().slice(0, 10), 0);
    findings.forEach((item) => { const key = new Date(item.created_at).toISOString().slice(0, 10); if (recentMap.has(key)) recentMap.set(key, (recentMap.get(key) ?? 0) + 1); });
    const recurring = new Map<string, { count: number; types: Set<string>; latest: string }>();
    findings.forEach((item) => { const key = String(item.participant_id || item.study_id || "").trim(); if (!key) return; const bucket = recurring.get(key) ?? { count: 0, types: new Set<string>(), latest: item.created_at }; bucket.count += 1; bucket.types.add(item.analysis_type); if (new Date(item.created_at) > new Date(bucket.latest)) bucket.latest = item.created_at; recurring.set(key, bucket); });
    const recurringRisks = Array.from(recurring.entries()).filter(([, value]) => value.count >= 2).sort((a, b) => b[1].count - a[1].count).slice(0, 5).map(([entity, value]) => ({ entity, count: value.count, modules: Array.from(value.types), latest: value.latest }));
    const latest = findings[0]; const pct = (v: unknown) => { const n = Number(v); if (!Number.isFinite(n)) return null; return Math.round(n <= 1 ? n * 100 : n); };
    const avgConfidence = findings.length ? Math.round(findings.reduce((sum, item) => sum + (pct(item.confidence) ?? 0), 0) / findings.length) : null;
    const insights = findings.length === 0 ? [{ tone: "neutral", title: "Your intelligence layer is ready", body: "Run an analysis and TrialIQ will build a persistent evidence history for this workspace." }, { tone: "info", title: "Start building clinical memory", body: "Repeated findings across participants, documents and workflows will become visible as patterns." }] : [{ tone: critical.length ? "critical" : "positive", title: critical.length ? `${critical.length} findings deserve attention` : "No obvious high-risk findings", body: critical.length ? "Open the review queue and work from the highest-priority evidence first." : "The current saved evidence does not contain obvious high-priority signals." }, { tone: unresolved.length ? "warning" : "positive", title: unresolved.length ? `${unresolved.length} findings still need a decision` : "Review queue is clear", body: unresolved.length ? "Resolve or review findings so TrialIQ can measure how review pressure changes over time." : "All currently saved findings are resolved or closed." }, recurringRisks.length ? { tone: "warning", title: `${recurringRisks.length} recurring patterns detected`, body: "TrialIQ found repeated intelligence tied to the same study or participant context." } : { tone: "info", title: "Memory is accumulating", body: "More saved analyses will unlock recurring-risk and longitudinal-change detection." }];
    const actions = unresolved.slice().sort((a, b) => { const ap = priorityFor(a) === "HIGH" ? 0 : 1; const bp = priorityFor(b) === "HIGH" ? 0 : 1; return ap - bp || new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); }).slice(0, 20).map((item) => ({ id: item.id, priority: priorityFor(item), type: item.analysis_type, title: item.title, summary: item.summary, createdAt: item.created_at, participantCode: (item.metadata as any)?.participantCode ?? null, participant: item.participant_id ? `Participant ${item.participant_id}` : item.study_id ? "Study-level finding" : "Workspace finding", time: daysAgo(item.created_at) === 0 ? "Today" : `${daysAgo(item.created_at)}d ago`, href: "/dashboard/review-queue" }));
    return NextResponse.json({ success: true, data: { study: studies[0] ?? { id: "workspace", name: "My TrialIQ Workspace", status: "Ready" }, overview: { findings: findings.length, unresolved: unresolved.length, critical: critical.length, studies: studies.length, participants: participants.length, documents: documents.length, avgConfidence }, findingMix: Array.from(typeMap.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value), trend: Array.from(recentMap.entries()).map(([date, value]) => ({ date, value })), insights, actions, recurringRisks, recentFindings: findings.slice(0, 8).map((item) => ({ id: item.id, type: item.analysis_type, title: item.title, summary: item.summary, confidence: pct(item.confidence), participantCode: (item.metadata as any)?.participantCode ?? null, status: item.status, createdAt: item.created_at })), studies: studies.slice(0, 6), recentDocuments: documents.slice(0, 5), latestChange: latest ? { title: latest.title, type: latest.analysis_type, createdAt: latest.created_at } : null } });
  } catch (error) { console.error("Dashboard API Error:", error); return NextResponse.json({ success: false, message: "Unable to load dashboard data." }, { status: 500 }); }
}
