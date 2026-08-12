"use client";

import { useState } from "react";
import {
  Activity,
  UploadCloud,
  Loader2,
  Play,
} from "lucide-react";

import { extractPdfText } from "@/lib/extractPdfText";
import SafetyReport from "@/components/SafetyReport";

export default function SafetyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  async function loadDemo() {
    try {
      setLoading(true);

      const response = await fetch(
        "/demo/safety-demo.pdf"
      );

      if (!response.ok) {
        throw new Error(
          "Safety demo document could not be loaded."
        );
      }

      const blob = await response.blob();

      const demoFile = new File(
        [blob],
        "safety-demo.pdf",
        {
          type: "application/pdf",
        }
      );

      setFile(demoFile);
      setReport(null);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load safety demo."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!file) {
      alert("Please upload a safety record.");
      return;
    }

    try {
      setLoading(true);
      setReport(null);

      const documentText =
        await extractPdfText(file);

      const response = await fetch(
        "/api/safety",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document: documentText,
            fileName: file.name,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Safety signal analysis failed."
        );
      }

      setReport(data.result);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Safety signal analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl p-10">

        {/* HEADER */}

        <div className="mb-8">

          <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-700">
            <Activity size={18} />
            AI Safety Intelligence
          </div>

          <h1 className="mt-5 text-5xl font-bold text-slate-900">
            Safety Signal Detection
          </h1>

          <p className="mt-4 max-w-3xl text-slate-500">
            Analyze multiple safety events to identify
            recurring patterns, unusual event clusters
            and potential safety signals requiring
            clinical review.
          </p>

        </div>

        {/* DEMO */}

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Play
                size={17}
                className="text-red-600"
              />

              <h2 className="font-semibold text-red-900">
                Try the live demo
              </h2>

            </div>

            <p className="mt-1 text-sm text-red-700">
              Load the synthetic multi-participant safety
              dataset.
            </p>

          </div>

          <button
            type="button"
            onClick={loadDemo}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Loading Demo...
              </>
            ) : (
              <>
                <Play size={17} />

                Load Demo
              </>
            )}
          </button>

        </div>

        {/* UPLOAD */}

        <div className="rounded-3xl border bg-white p-10 shadow-sm">

          <label className="cursor-pointer">

            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition hover:border-red-400 hover:bg-red-50/30">

              <UploadCloud
                size={48}
                className="text-red-600"
              />

              {file ? (
                <>
                  <h2 className="mt-5 font-semibold text-green-600">
                    ✓ {file.name}
                  </h2>

                  <p className="mt-2 text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(
                      2
                    )}{" "}
                    MB
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    Click to replace document
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-5 text-xl font-semibold">
                    Upload Safety Records
                  </h2>

                  <p className="mt-2 text-slate-500">
                    PDF only
                  </p>
                </>
              )}

            </div>

            <input
              hidden
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => {
                setFile(
                  event.target.files?.[0] ?? null
                );

                setReport(null);
              }}
            />

          </label>

          <button
            type="button"
            disabled={!file || loading}
            onClick={handleAnalyze}
            className="mt-8 flex items-center gap-3 rounded-xl bg-red-600 px-8 py-4 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Detecting Safety Signals...
              </>
            ) : (
              "Detect Safety Signals"
            )}
          </button>

        </div>

        {report && (
          <SafetyReport report={report} />
        )}

      </div>

    </main>
  );
}