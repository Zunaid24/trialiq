interface Props {
  report: any;
}

export default function AnalysisReport({ report }: Props) {
  if (!report) return null;

  return (
    <div className="mt-12 space-y-8">

      {/* =====================================================
          SUMMARY / HERO
      ===================================================== */}

      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 p-10 text-white shadow-xl">

        <span
          className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
            report.eligible
              ? "bg-green-500/20 text-green-100"
              : "bg-red-500/20 text-red-100"
          }`}
        >
          {report.screeningResult ?? "Screening Complete"}
        </span>

        <h1 className="mt-6 text-4xl font-bold">
          {report.studyTitle ?? "Clinical Trial"}
        </h1>

        <p className="mt-5 max-w-3xl text-lg text-blue-100">
          {report.executiveSummary ??
            report.reasonForIneligibility ??
            "Clinical trial screening analysis completed."}
        </p>

        {/* Metrics */}

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">

          <Metric
            label="Participant"
            value={report.participantId ?? "--"}
          />

          <Metric
            label="Eligibility"
            value={report.screeningResult ?? "--"}
          />

          <Metric
            label="Score"
            value={
              report.eligibilityScore != null
                ? `${report.eligibilityScore}%`
                : "--"
            }
          />

          <Metric
            label="Confidence"
            value={
              report.confidence != null
                ? `${report.confidence}%`
                : "--"
            }
          />

        </div>

      </div>

      {/* =====================================================
          PRIMARY FINDING
      ===================================================== */}

      <Section title="Primary Finding">

        <div className="space-y-4">

          {report.reasonForIneligibility && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

              <h3 className="font-semibold text-red-900">
                Reason for Ineligibility
              </h3>

              <p className="mt-2 leading-7 text-red-800">
                {report.reasonForIneligibility}
              </p>

            </div>
          )}

          {report.executiveSummary && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <h3 className="font-semibold text-blue-900">
                Clinical Summary
              </h3>

              <p className="mt-2 leading-7 text-blue-800">
                {report.executiveSummary}
              </p>

            </div>
          )}

        </div>

      </Section>

      {/* =====================================================
          INCLUSION CRITERIA
      ===================================================== */}

      <Section title="Inclusion Criteria">

        <div className="space-y-3">

          {report.criteriaEvaluation?.inclusion?.length ? (
            report.criteriaEvaluation.inclusion.map(
              (item: any, index: number) => (
                <Criterion
                  key={index}
                  item={item}
                />
              )
            )
          ) : (
            <p className="text-slate-500">
              No inclusion criteria available.
            </p>
          )}

        </div>

      </Section>

      {/* =====================================================
          EXCLUSION CRITERIA
      ===================================================== */}

      <Section title="Exclusion Criteria">

        <div className="space-y-3">

          {report.criteriaEvaluation?.exclusion?.length ? (
            report.criteriaEvaluation.exclusion.map(
              (item: any, index: number) => (
                <Criterion
                  key={index}
                  item={item}
                />
              )
            )
          ) : (
            <p className="text-slate-500">
              No exclusion criteria available.
            </p>
          )}

        </div>

      </Section>

      {/* =====================================================
          CLINICAL ACTION ITEMS
      ===================================================== */}

      <Section title="Clinical Action Items">

        <div className="space-y-4">

          {report.pendingAssessments?.length ? (
            report.pendingAssessments.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border border-yellow-200 bg-yellow-50 p-5"
                >

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div>

                      <h3 className="font-semibold text-slate-900">
                        {item.assessment}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.clinicalImpact}
                      </p>

                    </div>

                    <span className="w-fit rounded-full bg-yellow-200 px-3 py-1 text-sm font-medium text-yellow-800">
                      {item.status}
                    </span>

                  </div>

                </div>
              )
            )
          ) : (
            <p className="text-slate-500">
              No pending assessments.
            </p>
          )}

        </div>

      </Section>

      {/* =====================================================
          RECOMMENDATIONS
      ===================================================== */}

      <Section title="Coordinator Recommendations">

        {report.recommendations?.length ? (
          <div className="space-y-3">

            {report.recommendations.map(
              (recommendation: string, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border bg-slate-50 p-4"
                >

                  <div className="flex gap-3">

                    <span className="font-semibold text-blue-600">
                      {index + 1}.
                    </span>

                    <p className="leading-6 text-slate-700">
                      {recommendation}
                    </p>

                  </div>

                </div>
              )
            )}

          </div>
        ) : (
          <p className="text-slate-500">
            No recommendations available.
          </p>
        )}

      </Section>

    </div>
  );
}


/* ============================================================
   METRIC
============================================================ */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">

      <p className="text-sm text-blue-100">
        {label}
      </p>

      <h3 className="mt-2 text-2xl font-bold text-white">
        {value}
      </h3>

    </div>
  );
}


/* ============================================================
   SECTION
============================================================ */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-white p-8 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold text-slate-900">
        {title}
      </h2>

      {children}

    </section>
  );
}


/* ============================================================
   CRITERION
============================================================ */

function Criterion({ item }: { item: any }) {
  const status = item.status ?? "";

  let badge = "bg-gray-100 text-gray-700";

  if (
    status.toLowerCase().includes("pending")
  ) {
    badge = "bg-yellow-100 text-yellow-700";
  } else if (
    status.toLowerCase().includes("not met") ||
    status.toLowerCase().includes("not")
  ) {
    badge = "bg-red-100 text-red-700";
  } else if (
    status.toLowerCase().includes("met")
  ) {
    badge = "bg-green-100 text-green-700";
  }

  return (
    <div className="rounded-xl border p-4">

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="min-w-0">

          <p className="font-medium text-slate-900">
            {item.criterion}
          </p>

          <div className="mt-2 space-y-1 text-sm text-slate-500">

            {item.expected && (
              <p>
                <span className="font-medium text-slate-600">
                  Expected:
                </span>{" "}
                {item.expected}
              </p>
            )}

            {item.actual && (
              <p>
                <span className="font-medium text-slate-600">
                  Actual:
                </span>{" "}
                {item.actual}
              </p>
            )}

          </div>

        </div>

        <span
          className={`w-fit shrink-0 rounded-full px-3 py-1 text-sm font-medium ${badge}`}
        >
          {status || "Unknown"}
        </span>

      </div>

    </div>
  );
}