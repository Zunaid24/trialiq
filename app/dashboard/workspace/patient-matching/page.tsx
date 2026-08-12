"use client";

import { useState } from "react";
import {
  UsersRound,
  UploadCloud,
  Loader2,
  Play,
} from "lucide-react";

import { extractPdfText } from "@/lib/extractPdfText";
import AnalysisReport from "@/components/AnalysisReport";

export default function PatientMatchingPage() {
  const [protocolFile, setProtocolFile] =
    useState<File | null>(null);

  const [participantFile, setParticipantFile] =
    useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  async function loadDemoFiles() {
    try {
      setLoading(true);

      const [protocolResponse, participantResponse] =
        await Promise.all([
          fetch("/demo/protocol-demo.pdf"),
          fetch("/demo/participant-demo.pdf"),
        ]);

      if (
        !protocolResponse.ok ||
        !participantResponse.ok
      ) {
        throw new Error(
          "Demo files could not be loaded."
        );
      }

      const protocolBlob =
        await protocolResponse.blob();

      const participantBlob =
        await participantResponse.blob();

      setProtocolFile(
        new File(
          [protocolBlob],
          "protocol-demo.pdf",
          {
            type: "application/pdf",
          }
        )
      );

      setParticipantFile(
        new File(
          [participantBlob],
          "participant-demo.pdf",
          {
            type: "application/pdf",
          }
        )
      );

      setReport(null);
    } catch (error) {
      console.error(error);

      alert(
        "Unable to load the demo files."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!protocolFile || !participantFile) {
      alert(
        "Please provide both the protocol and participant document."
      );

      return;
    }

    try {
      setLoading(true);
      setReport(null);

      const [
        protocolText,
        participantText,
      ] = await Promise.all([
        extractPdfText(protocolFile),
        extractPdfText(participantFile),
      ]);

      const response = await fetch(
        "/api/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            protocol: protocolText,
            participant: participantText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Patient matching failed."
        );
      }

      let result = data.result;

      if (typeof result === "string") {
        result = result
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        result = JSON.parse(result);
      }

      setReport(result);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Patient matching failed."
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

          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">

            <UsersRound size={18} />

            AI Patient Matching

          </div>

          <h1 className="mt-5 text-5xl font-bold">
            Patient Matching
          </h1>

          <p className="mt-4 max-w-3xl text-slate-500">
            Compare a participant medical profile against
            a clinical trial protocol and identify eligibility,
            missing information, exclusion risks and required
            coordinator actions.
          </p>

        </div>


        {/* DEMO */}

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <Play
                size={17}
                className="text-blue-600"
              />

              <h2 className="font-semibold text-blue-900">
                Try the live demo
              </h2>

            </div>

            <p className="mt-1 text-sm text-blue-700">
              Load both the sample protocol and
              participant automatically.
            </p>

          </div>

          <button
            type="button"
            onClick={loadDemoFiles}
            disabled={loading}
            className="flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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


        {/* DOCUMENTS */}

        <div className="grid gap-6 md:grid-cols-2">

          {/* PROTOCOL */}

          <DocumentUpload
            title="Clinical Trial Protocol"
            description="Upload the study protocol used for eligibility comparison."
            file={protocolFile}
            iconColor="text-violet-600"
            borderColor="hover:border-violet-400"
            onChange={(file) => {
              setProtocolFile(file);
              setReport(null);
            }}
          />

          {/* PARTICIPANT */}

          <DocumentUpload
            title="Participant Medical Summary"
            description="Upload the participant's available clinical information."
            file={participantFile}
            iconColor="text-blue-600"
            borderColor="hover:border-blue-400"
            onChange={(file) => {
              setParticipantFile(file);
              setReport(null);
            }}
          />

        </div>


        {/* ANALYZE */}

        <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="font-semibold">
                Ready for matching
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Both documents are required to perform
                the eligibility comparison.
              </p>

            </div>

            <button
              type="button"
              disabled={
                !protocolFile ||
                !participantFile ||
                loading
              }
              onClick={handleAnalyze}
              className="flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Matching Patient...
                </>
              ) : (
                "Analyze Patient Match"
              )}

            </button>

          </div>

        </div>


        {/* REPORT */}

        {report && (
          <AnalysisReport report={report} />
        )}

      </div>

    </main>
  );
}


function DocumentUpload({
  title,
  description,
  file,
  iconColor,
  borderColor,
  onChange,
}: {
  title: string;
  description: string;
  file: File | null;
  iconColor: string;
  borderColor: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">

      <div className="mb-5">

        <h2 className="text-lg font-semibold">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>

      </div>

      <label className="block cursor-pointer">

        <div
          className={`flex min-h-[240px] flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition ${borderColor}`}
        >

          <UploadCloud
            size={42}
            className={iconColor}
          />

          {file ? (
            <>
              <h3 className="mt-4 font-semibold text-green-600">
                ✓ {file.name}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {(file.size / 1024 / 1024).toFixed(
                  2
                )}{" "}
                MB
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Click to replace
              </p>
            </>
          ) : (
            <>
              <h3 className="mt-4 font-medium">
                Upload PDF
              </h3>

              <p className="mt-2 text-sm text-slate-400">
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
            onChange(
              event.target.files?.[0] ?? null
            );
          }}
        />

      </label>

    </div>
  );
}