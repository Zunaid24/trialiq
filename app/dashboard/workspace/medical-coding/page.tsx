"use client";

import { useState } from "react";
import {
  Stethoscope,
  UploadCloud,
  Loader2,
  Play,
} from "lucide-react";

import { extractPdfText } from "@/lib/extractPdfText";
import MedicalCodingReport from "@/components/MedicalCodingReport";

export default function MedicalCodingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  async function loadDemo() {
    try {
      setLoading(true);

      const response = await fetch(
        "/demo/medical-coding-demo.pdf"
      );

      if (!response.ok) {
        throw new Error(
          "Medical coding demo document could not be loaded."
        );
      }

      const blob = await response.blob();

      const demoFile = new File(
        [blob],
        "medical-coding-demo.pdf",
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
          : "Unable to load medical coding demo."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!file) {
      alert("Please upload a clinical document.");
      return;
    }

    try {
      setLoading(true);
      setReport(null);

      const documentText =
        await extractPdfText(file);

      const response = await fetch(
        "/api/medical-coding",
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
            "Medical coding analysis failed."
        );
      }

      setReport(data.result);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Medical coding analysis failed."
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

          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-medium text-cyan-700">
            <Stethoscope size={18} />
            AI Clinical Coding
          </div>

          <h1 className="mt-5 text-5xl font-bold text-slate-900">
            Medical Coding Intelligence
          </h1>

          <p className="mt-4 max-w-3xl text-slate-500">
            Extract clinical terms from source documents
            and generate AI-assisted MedDRA and ICD-10
            coding suggestions with evidence, confidence
            and human review status.
          </p>

        </div>

        {/* DEMO */}

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Play
                size={17}
                className="text-cyan-600"
              />

              <h2 className="font-semibold text-cyan-900">
                Try the live demo
              </h2>

            </div>

            <p className="mt-1 text-sm text-cyan-700">
              Load the sample clinical coding document.
            </p>

          </div>

          <button
            type="button"
            onClick={loadDemo}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
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

            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition hover:border-cyan-400 hover:bg-cyan-50/30">

              <UploadCloud
                size={48}
                className="text-cyan-600"
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
                    Upload Clinical Document
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
            className="mt-8 flex items-center gap-3 rounded-xl bg-cyan-600 px-8 py-4 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >

            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Coding Clinical Terms...
              </>
            ) : (
              "Analyze & Suggest Codes"
            )}

          </button>

        </div>

        {report && (
          <MedicalCodingReport report={report} />
        )}

      </div>

    </main>
  );
}