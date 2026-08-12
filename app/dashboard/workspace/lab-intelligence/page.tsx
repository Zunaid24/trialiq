"use client";

import { useState } from "react";
import {
  AlertCircle,
  FileText,
  FlaskConical,
  Loader2,
  Play,
  UploadCloud,
} from "lucide-react";

import { extractPdfText } from "@/lib/extractPdfText";
import LabIntelligenceReport from "@/components/LabIntelligenceReport";

export default function LabIntelligencePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDemoLabReport() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/demo/lab-demo.pdf");

      if (!response.ok) {
        throw new Error("Demo lab document could not be loaded.");
      }

      const blob = await response.blob();
      const demoFile = new File([blob], "lab-demo.pdf", {
        type: "application/pdf",
      });

      setFile(demoFile);
      setReport(null);
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load demo document."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setReport(null);

      const document = await extractPdfText(file);
      const response = await fetch("/api/lab-intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ document }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Lab intelligence analysis failed.");
      }

      setReport(data.result);
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error ? error.message : "Lab analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(nextFile: File | null) {
    setError(null);
    setReport(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (nextFile.type !== "application/pdf") {
      setFile(null);
      setError("Please select a PDF laboratory report.");
      return;
    }

    setFile(nextFile);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-12">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-700">
            <FlaskConical size={16} />
            AI Laboratory Intelligence
          </div>

          <div className="mt-5 max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Lab Intelligence
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Review laboratory results, identify abnormal and critical values,
              detect missing assessments, and surface protocol-relevant follow-up actions.
            </p>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <div className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-700">
                <Play size={17} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Try the demo</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Load the sample participant document to see the full review workflow.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadDemoLabReport}
              disabled={loading}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && !file ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              Load Demo
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-950">Source document</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload a laboratory report in PDF format.
              </p>
            </div>
            <FileText size={20} className="text-slate-400" />
          </div>

          <label className="block cursor-pointer">
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center transition hover:border-blue-400 hover:bg-blue-50/30">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <UploadCloud size={24} />
              </div>

              {file ? (
                <>
                  <h3 className="mt-4 font-semibold text-slate-900">
                    {file.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · PDF ready for analysis
                  </p>
                </>
              ) : (
                <>
                  <h3 className="mt-4 font-semibold text-slate-900">
                    Upload Laboratory Report
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose a PDF from your device, or use the demo above.
                  </p>
                </>
              )}
            </div>

            <input
              hidden
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            />
          </label>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              AI output is intended to support review and does not replace qualified clinical assessment.
            </p>

            <button
              type="button"
              disabled={!file || loading}
              onClick={handleAnalyze}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Reviewing Labs...
                </>
              ) : (
                "Analyze Laboratory Results"
              )}
            </button>
          </div>
        </section>

        {report && <LabIntelligenceReport report={report} />}
      </div>
    </main>
  );
}
