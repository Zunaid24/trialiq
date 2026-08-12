import { NextResponse } from "next/server";
import { analyzeMedicationReview } from "@/lib/gemini";
import { addClinicalAuditMetadata } from "@/lib/clinicalAudit";
import { hardenClinicalOutput } from "@/lib/clinicalOutputGuardrails";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const document = body?.document;
    const fileName = body?.fileName;

    if (!document || typeof document !== "string") {
      return NextResponse.json(
        { success: false, message: "Medication document is required." },
        { status: 400 }
      );
    }

    const result = addClinicalAuditMetadata(
      hardenClinicalOutput(
        "Concomitant Medication Review",
        await analyzeMedicationReview(document, fileName),
        document
      ),
      "Concomitant Medication Review"
    );

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Medication Review API Error:", error);

    if (error?.status === 503) {
      return NextResponse.json(
        { success: false, message: "Gemini is currently experiencing high demand. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, message: error?.message || "Medication review failed." },
      { status: 500 }
    );
  }
}
