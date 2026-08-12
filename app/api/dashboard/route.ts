import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function daysAgo(value: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
    }

    const [findingsResult, studiesResult, participantsResult, documentsResult] = await Promise.all([
      supabase
        .from("findings")
        .select("id,analysis_type,title,summary,confidence,status,metadata,created_at,updated_at,study_id,participant_id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("studies")
        .select("id,name,protocol_name,status,created_at,updated_at")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(25),
      supabase
        .from("participants")
        .select("id,participant_code,status,study_id,created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("documents")
        .select("id,name,document_type,processing_status,created_at,study_id,participant_id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (findingsResult.error) throw findingsResult.error;
    if (studiesResult.error) throw studiesResult.error;
    if (participantsResult.error) throw participantsResult.error;
    if (documentsResult.error) throw documentsResult.error;

    const findings = findingsResult.data ?? [];
    const studies = studiesResult.data ?? [];
    const participants = participantsResult.data ?? [];
    const documents = documentsResult.data ?? [];

    const unresolved = findings.filter((item) => !["resolved", "closed", "dismissed"].includes(String(item.status).toLowerCase()));
    const critical = findings.filter((item) => {
      const text = JSON.stringify(item.metadata ?? {}).toLowerCase();
      return /critical|high priority|urgent|unsafe|not eligible/.test(text) || /critical|high|urgent/.test(String(item.status).toLowerCase());
    });

    const typeMap = new Map<string, number>();
    findings.forEach((item) => typeMap.set(item.analysis_type, (typeMap.get(item.analysis_type) ?? 0) + 1));

    const recentMap = new Map<string, number>();
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(Date.now() - index * 86400000);
      recentMap.set(date.toISOString().slice(0, 10), 0);
    }
    findings.forEach((item) => {
      const key = new Date(item.created_at).toISOString().slice(0, 10);
      if (recentMap.has(key)) recentMap.set(key, (recentMap.get(key) ?? 0) + 1);
    });

    const topStudy = studies[0];
    const latestFinding = findings[0];
    const avgConfidence = findings.length
      ? Math.round(findings.reduce((sum, item) => sum + (Number(item.confidence) || 0), 0) / findings.length)
      : null;

    const insights = [
      findings.length === 0
        ? { tone: "neutral", title: "Your intelligence layer is ready", body: "Run your first analysis and TrialIQ will turn the result into a persistent, user-scoped finding." }
        : { tone: critical.length ? "critical" : "positive", title: critical.length ? `${critical.length} findings deserve attention` : "No high-risk findings detected", body: critical.length ? "Open the Review Queue to inspect the highest-risk evidence first." : "Your current saved findings do not contain obvious critical or high-priority signals." },
      unresolved.length
        ? { tone: "warning", title: `${unresolved.length} findings are still open`, body: "TrialIQ keeps findings available across sessions instead of making you repeat analysis." }
        : { tone: "positive", title: "Review queue is clear", body: "There are no unresolved saved findings in this workspace." },
      latestFinding
        ? { tone: "info", title: `Latest: ${latestFinding.analysis_type}`, body: `${latestFinding.title} · saved ${daysAgo(latestFinding.created_at) === 0 ? "today" : `${daysAgo(latestFinding.created_at)}d ago`}.` }
        : { tone: "info", title: "Build a longitudinal record", body: "Save analyses across modules to see patterns, recurring risks and review pressure over time." },
    ];

    return NextResponse.json({
      success: true,
      data: {
        study: topStudy ?? { id: "workspace", name: "My TrialIQ Workspace", status: "Ready" },
        overview: {
          findings: findings.length,
          unresolved: unresolved.length,
          critical: critical.length,
          studies: studies.length,
          participants: participants.length,
          documents: documents.length,
          avgConfidence,
        },
        findingMix: Array.from(typeMap.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value),
        trend: Array.from(recentMap.entries()).map(([date, value]) => ({ date, value })),
        insights,
        recentFindings: findings.slice(0, 8).map((item) => ({
          id: item.id,
          type: item.analysis_type,
          title: item.title,
          summary: item.summary,
          confidence: item.confidence,
          status: item.status,
          createdAt: item.created_at,
        })),
        studies: studies.slice(0, 6),
        recentDocuments: documents.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ success: false, message: "Unable to load dashboard data." }, { status: 500 });
  }
}
