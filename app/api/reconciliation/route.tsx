import { NextResponse } from "next/server";
import { analyzeClinicalReconciliation } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { documents } = await req.json();

    if (
      !documents ||
      Object.keys(documents).length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "At least one clinical document is required.",
        },
        { status: 400 }
      );
    }

    const result =
      await analyzeClinicalReconciliation(
        documents
      );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error(
      "Clinical Reconciliation API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.status === 503
            ? "Gemini is busy. Please try again."
            : "Clinical reconciliation failed.",
      },
      {
        status: error?.status || 500,
      }
    );
  }
}