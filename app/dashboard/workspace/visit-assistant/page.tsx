"use client";

import { useState } from "react";
import {
  CalendarDays,
  UploadCloud,
  Loader2,
  Play,
} from "lucide-react";

import { extractPdfText } from "@/lib/extractPdfText";
import VisitIntelligenceReport from "@/components/VisitIntelligenceReport";

export default function VisitIntelligencePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  async function loadDemoProtocol() {
    try {
      setLoading(true);

      const response = await fetch(
        "/demo/protocol-demo.pdf"
      );

      if (!response.ok) {
        throw new Error("Demo protocol could not be loaded.");
      }

      const blob = await response.blob();

      const demoFile = new File(
        [blob],
        "protocol-demo.pdf",
        {
          type: "application/pdf",
        }
      );

      setFile(demoFile);
      setReport(null);
    } catch (error) {
      console.error(error);
      alert("Unable to load demo protocol.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!file) return;

    try {
      setLoading(true);
      setReport(null);

      const protocol =
        await extractPdfText(file);

      const response = await fetch(
        "/api/visit-intelligence",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            protocol,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Visit intelligence analysis failed."
        );
      }

      setReport(data.result);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl px-6 py-12">

        <div className="mb-8">

          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-medium text-cyan-700">
            <CalendarDays size={17} />
            AI Visit Intelligence
          </div>

          <h1 className="mt-5 text-4xl font-bold">
            Visit & Schedule Intelligence
          </h1>

          <p className="mt-3 max-w-3xl text-slate-500">
            Convert a clinical trial protocol into a
            coordinator-ready visit schedule with
            assessments, timing, safety requirements
            and critical actions.
          </p>

        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="font-semibold text-cyan-900">
              Try the demo protocol
            </h2>

            <p className="mt-1 text-sm text-cyan-700">
              Load the sample protocol automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDemoProtocol}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            <Play size={16} />
            Load Demo
          </button>

        </div>

        <div className="rounded-3xl border bg-white p-8 shadow-sm">

          <label className="block cursor-pointer">

            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-14 text-center">

              <UploadCloud
                size={48}
                className="text-cyan-600"
              />

              {file ? (
                <>
                  <h2 className="mt-5 font-semibold text-green-600">
                    ✓ {file.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-5 text-xl font-semibold">
                    Upload Clinical Trial Protocol
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    PDF only
                  </p>
                </>
              )}

            </div>

            <input
              hidden
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                setFile(
                  e.target.files?.[0] ?? null
                );
                setReport(null);
              }}
            />

          </label>

          <button
            type="button"
            disabled={!file || loading}
            onClick={handleAnalyze}
            className="mt-6 flex items-center gap-3 rounded-xl bg-cyan-600 px-7 py-4 font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Building Visit Schedule...
              </>
            ) : (
              "Generate Visit Intelligence"
            )}
          </button>

        </div>

        {report && (
          <VisitIntelligenceReport report={report} />
        )}

      </div>

    </main>
  );
}