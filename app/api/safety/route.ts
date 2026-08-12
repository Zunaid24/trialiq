import { NextResponse } from "next/server";
import { analyzeSafetySignals } from "@/lib/gemini";
import { addClinicalAuditMetadata } from "@/lib/clinicalAudit";

import {
  addDashboardAction,
  addDashboardActivity,
  setSafetySignals,
} from "@/lib/dashboardStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const document = body?.document;
    const fileName = body?.fileName;

    if (!document || typeof document !== "string") {
      return NextResponse.json(
        { success: false, message: "Safety record document is required." },
        { status: 400 }
      );
    }

    const result = addClinicalAuditMetadata(
      await analyzeSafetySignals(document, fileName),
      "Safety Signal Detection"
    );

    const signals = Array.isArray(result?.signals) ? result.signals : [];
    setSafetySignals(signals.length);

    for (const signal of signals) {
      const priorityValue = String(signal?.priority ?? "").toLowerCase();
      const priority = priorityValue.includes("high") ? "HIGH" : "MEDIUM";

      addDashboardAction({
        id: `SAFETY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        priority,
        type: "Safety Signal",
        title: signal?.signal || "Potential safety signal identified",
        participant:
          Array.isArray(signal?.affectedParticipants) && signal.affectedParticipants.length > 0
            ? `${signal.affectedParticipants.length} affected participant${signal.affectedParticipants.length === 1 ? "" : "s"}`
            : "Multiple participants",
        time: "Just now",
        href: "/dashboard/workspace/safety",
      });
    }

    if (signals.length > 0) {
      addDashboardActivity({
        id: `SAFETY-ACT-${Date.now()}`,
        title: "Safety signal analysis completed",
        description: `${signals.length} potential safety signal${signals.length === 1 ? "" : "s"} identified`,
        time: "Just now",
        type: "safety",
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Safety Signal API Error:", error);

    if (error?.status === 503) {
      return NextResponse.json(
        { success: false, message: "Gemini is currently experiencing high demand. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, message: error?.message || "Safety signal analysis failed." },
      { status: 500 }
    );
  }
}
