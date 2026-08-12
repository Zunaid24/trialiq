"use client";

import { useState } from "react";
import {
  FlaskConical,
  UploadCloud,
  Loader2,
  Play,
} from "lucide-react";

import { extractPdfText } from "@/lib/extractPdfText";
import LabIntelligenceReport from "@/components/LabIntelligenceReport";

export default function LabIntelligencePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  async function loadDemoLabReport() {
    try {
      setLoading(true);

      const response = await fetch(
        "/demo/lab-demo.pdf"
      );

      if (!response.ok) {
        throw new Error(
          "Demo lab document could not be loaded."
        );
      }

      const blob = await response.blob();

      const demoFile = new File(
        [blob],
        "lab-demo.pdf",
        {
          type: "application/pdf",
        }
      );

      setFile(demoFile);
      setReport(null);
    } catch (error) {
      console.error(error);
      alert("Unable to load demo document.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!file) return;

    try {
      setLoading(true);
      setReport(null);

      const document =
        await extractPdfText(file);

      const response = await fetch(
        "/api/lab-intelligence",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Lab intelligence analysis failed."
        );
      }

      setReport(data.result);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Lab analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl px-6 py-12">

        <div className="mb-8">

          <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700">
            <FlaskConical size={17} />
            AI Laboratory Intelligence
          </div>

          <h1 className="mt-5 text-4xl font-bold">
            Lab Intelligence
          </h1>

          <p className="mt-3 max-w-3xl text-slate-500">
            Review laboratory results, identify abnormal
            and critical values, detect missing assessments,
            and surface protocol-relevant follow-up actions.
          </p>

        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="font-semibold text-rose-900">
              Try the demo
            </h2>

            <p className="mt-1 text-sm text-rose-700">
              Load the sample participant document.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDemoLabReport}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
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
                className="text-rose-600"
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
                    Upload Laboratory Report
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
            className="mt-6 flex items-center gap-3 rounded-xl bg-rose-600 px-7 py-4 font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Reviewing Labs...
              </>
            ) : (
              "Analyze Laboratory Results"
            )}
          </button>

        </div>

        {report && (
          <LabIntelligenceReport report={report} />
        )}

      </div>

    </main>
  );
}