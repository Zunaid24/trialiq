import { NextResponse } from "next/server";
import { analyzeMedicalCoding } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const document = body?.document;
    const fileName = body?.fileName;

    if (
      !document ||
      typeof document !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Clinical document is required.",
        },
        { status: 400 }
      );
    }

    const result = await analyzeMedicalCoding(
      document,
      fileName
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error(
      "Medical Coding API Error:",
      error
    );

    if (error?.status === 503) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gemini is currently experiencing high demand. Please try again.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Medical coding analysis failed.",
      },
      { status: 500 }
    );
  }
}