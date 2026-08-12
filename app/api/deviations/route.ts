import { NextResponse } from "next/server";
import { analyzeProtocolDeviation } from "@/lib/gemini";
import { addClinicalAuditMetadata } from "@/lib/clinicalAudit";

function isJsonParseError(error: any) {
  const message = String(error?.message ?? error ?? "");
  return /expected .* after property value in json|unexpected end of json input|unexpected token/i.test(message);
}

async function analyzeWithJsonRetry(protocol: string, participantRecord: string) {
  let lastError: any;

  // Gemini can occasionally return malformed JSON despite responseMimeType:
  // application/json. Retry the same evidence-bound analysis a few times
  // rather than turning a transient generation defect into an HTTP 500.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await analyzeProtocolDeviation(protocol, participantRecord);
    } catch (error: any) {
      lastError = error;

      if (!isJsonParseError(error) || attempt === 3) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }

  throw lastError ?? new Error("Protocol deviation analysis failed.");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const protocol = body?.protocol;
    const participantRecord = body?.participantRecord;

    if (!protocol || typeof protocol !== "string") {
      return NextResponse.json({ success: false, message: "Clinical trial protocol is required." }, { status: 400 });
    }

    if (!participantRecord || typeof participantRecord !== "string") {
      return NextResponse.json({ success: false, message: "Participant record is required." }, { status: 400 });
    }

    const result = addClinicalAuditMetadata(
      await analyzeWithJsonRetry(protocol, participantRecord),
      "Protocol Deviation Detection"
    );

    const { setProtocolDeviations, addDashboardAction, addDashboardActivity } = await import("@/lib/dashboardStore");
    const deviations = Array.isArray(result?.deviations) ? result.deviations : [];
    const confirmedDeviations = deviations.filter((item: any) => String(item?.status ?? "").toLowerCase().includes("confirmed"));

    setProtocolDeviations(confirmedDeviations.length);

    for (const deviation of deviations) {
      const status = String(deviation?.status ?? "").toLowerCase();
      if (status.includes("confirmed") || status.includes("potential")) {
        const priority = String(deviation?.severity ?? "").toLowerCase().includes("high") ? "HIGH" : "MEDIUM";
        addDashboardAction({
          id: `DEV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          priority,
          type: "Protocol Deviation",
          title: deviation?.description || "Protocol deviation requires review",
          participant: result?.participantId ? `Participant ${result.participantId}` : "Participant record",
          time: "Just now",
          href: "/dashboard/workspace/deviations",
        });
      }
    }

    if (deviations.length > 0) {
      addDashboardActivity({
        id: `DEV-ACT-${Date.now()}`,
        title: "Protocol deviation analysis completed",
        description: `${deviations.length} potential deviation${deviations.length === 1 ? "" : "s"} identified`,
        time: "Just now",
        type: "deviation",
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Protocol Deviation API Error:", error);

    if (error?.status === 503) {
      return NextResponse.json({ success: false, message: "Gemini is currently experiencing high demand. Please try again." }, { status: 503 });
    }

    return NextResponse.json({ success: false, message: error?.message || "Protocol deviation analysis failed." }, { status: 500 });
  }
}
