import { NextResponse } from "next/server";
import { analyzeLabIntelligence } from "@/lib/gemini";
import { addClinicalAuditMetadata } from "@/lib/clinicalAudit";
import { hardenClinicalOutput } from "@/lib/clinicalOutputGuardrails";

export async function POST(req: Request) {
  try {
    const { document } = await req.json();

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          message: "Laboratory document is required.",
        },
        { status: 400 }
      );
    }

    const result = addClinicalAuditMetadata(
      hardenClinicalOutput(
        "Laboratory Intelligence",
        await analyzeLabIntelligence(document),
        document
      ),
      "Laboratory Intelligence"
    );

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Lab Intelligence API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.status === 503
            ? "Gemini is busy. Please try again."
            : "Lab intelligence analysis failed.",
      },
      { status: error?.status || 500 }
    );
  }
}
