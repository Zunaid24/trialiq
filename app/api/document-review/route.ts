import { NextResponse } from "next/server";
import { analyzeDocumentReview } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { document, fileName } = await req.json();

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          message: "Clinical document is required.",
        },
        { status: 400 }
      );
    }

    const result = await analyzeDocumentReview(
      document,
      fileName
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error(
      "Document Review API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.status === 503
            ? "Gemini is busy. Please try again."
            : "Document review failed.",
      },
      {
        status: error?.status || 500,
      }
    );
  }
}