interface Props {
  report: any;
}

export default function MedicalCodingReport({
  report,
}: Props) {
  if (!report) return null;

  const codingItems = Array.isArray(
    report.codingItems
  )
    ? report.codingItems
    : [];

  const uncodedTerms = Array.isArray(
    report.uncodedTerms
  )
    ? report.uncodedTerms
    : [];

  const recommendedActions = Array.isArray(
    report.recommendedActions
  )
    ? report.recommendedActions
    : [];

  return (
    <div className="mt-10 space-y-8">

      {/* SUMMARY */}

      <div className="rounded-3xl bg-gradient-to-r from-cyan-700 to-blue-600 p-8 text-white shadow-xl">

        <p className="text-sm text-cyan-100">
          AI Medical Coding Assessment
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {report.studyTitle ||
            "Medical Coding Review"}
        </h2>

        <p className="mt-2 text-cyan-100">
          {report.participantId
            ? `Participant ${report.participantId}`
            : report.documentType ||
              "Clinical source document"}
        </p>

        <p className="mt-5 max-w-4xl leading-7 text-cyan-100">
          {report.summary ||
            "Clinical terminology and coding suggestions generated."}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

          <Metric
            label="Terms Reviewed"
            value={
              report.termsReviewed ?? "--"
            }
          />

          <Metric
            label="Suggestions"
            value={
              report.codingSuggestions ??
              codingItems.length
            }
          />

          <Metric
            label="Review Required"
            value={
              report.reviewRequired ??
              codingItems.filter(
                (item: any) =>
                  String(
                    item.status ?? ""
                  )
                    .toLowerCase()
                    .includes("review")
              ).length
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


      {/* CODING ITEMS */}

      <Section title="Coding Suggestions">

        {codingItems.length > 0 ? (
          <div className="space-y-5">

            {codingItems.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6"
                >

                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">
                        {item.dictionary ||
                          "Clinical Coding"}
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-slate-900">
                        {item.verbatimTerm ||
                          "Clinical term"}
                      </h3>

                      {item.normalizedTerm && (
                        <p className="mt-1 text-sm text-slate-500">
                          Normalized:{" "}
                          <span className="font-medium text-slate-700">
                            {item.normalizedTerm}
                          </span>
                        </p>
                      )}

                    </div>

                    <StatusBadge
                      status={
                        item.status ||
                        "Review Required"
                      }
                    />

                  </div>


                  <div className="mt-6 grid gap-4 md:grid-cols-2">

                    <CodingBox
                      label="MedDRA Preferred Term"
                      value={
                        item.meddra
                          ?.preferredTerm
                      }
                    />

                    <CodingBox
                      label="System Organ Class"
                      value={
                        item.meddra
                          ?.systemOrganClass
                      }
                    />

                    <CodingBox
                      label="ICD-10 Code"
                      value={
                        item.icd10?.code
                      }
                    />

                    <CodingBox
                      label="ICD-10 Description"
                      value={
                        item.icd10?.description
                      }
                    />

                  </div>


                  {item.context && (
                    <div className="mt-5 rounded-xl border border-cyan-100 bg-white p-4">

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Clinical Context
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {item.context}
                      </p>

                    </div>
                  )}


                  {Array.isArray(
                    item.alternativeSuggestions
                  ) &&
                    item
                      .alternativeSuggestions
                      .length > 0 && (
                      <div className="mt-5">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Alternative Suggestions
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">

                          {item.alternativeSuggestions.map(
                            (
                              suggestion: string,
                              suggestionIndex: number
                            ) => (
                              <span
                                key={
                                  suggestionIndex
                                }
                                className="rounded-full bg-white px-3 py-1 text-sm text-slate-700"
                              >
                                {suggestion}
                              </span>
                            )
                          )}

                        </div>

                      </div>
                    )}


                  <div className="mt-5 grid gap-4 md:grid-cols-2">

                    <div className="rounded-xl border border-cyan-100 bg-white p-4">

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Source Evidence
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {item.evidence ||
                          "No evidence provided."}
                      </p>

                    </div>


                    <div className="rounded-xl border border-cyan-100 bg-white p-4">

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        AI Confidence
                      </p>

                      <p className="mt-2 text-2xl font-bold text-cyan-700">
                        {item.confidence != null
                          ? `${item.confidence}%`
                          : "--"}
                      </p>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        ) : (
          <Empty
            text="No codable clinical terms were identified."
          />
        )}

      </Section>


      {/* UNCODED */}

      <Section title="Terms Requiring Further Review">

        {uncodedTerms.length > 0 ? (
          <div className="space-y-3">

            {uncodedTerms.map(
              (item: any, index: number) => (
                <div
                  key={index}
                  className="rounded-xl border border-yellow-200 bg-yellow-50 p-4"
                >

                  <p className="font-semibold text-yellow-900">
                    {item.term}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-yellow-800">
                    {item.reason}
                  </p>

                </div>
              )
            )}

          </div>
        ) : (
          <Empty
            text="No additional uncoded terms identified."
          />
        )}

      </Section>


      {/* ACTIONS */}

      <Section title="Recommended Coding Actions">

        {recommendedActions.length > 0 ? (
          <div className="space-y-3">

            {recommendedActions.map(
              (
                action: string,
                index: number
              ) => (
                <div
                  key={index}
                  className="rounded-xl border bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                >

                  <span className="mr-3 font-semibold text-cyan-600">
                    {index + 1}.
                  </span>

                  {action}

                </div>
              )
            )}

          </div>
        ) : (
          <Empty text="No additional actions identified." />
        )}

      </Section>


      {/* REVIEW NOTICE */}

      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

        <p className="font-semibold text-yellow-900">
          Human Coding Review Required
        </p>

        <p className="mt-2 text-sm leading-6 text-yellow-800">
          TrialIQ provides AI-assisted coding suggestions
          for review. Suggested terminology and codes
          should be verified by an appropriately qualified
          medical coder or clinical research professional
          against the applicable coding dictionary and
          source documentation before final use.
        </p>

      </div>

    </div>
  );
}


function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">

      <p className="text-sm text-cyan-100">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>

    </div>
  );
}


function CodingBox({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl border border-cyan-100 bg-white p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-slate-800">
        {value || "Not suggested"}
      </p>

    </div>
  );
}


function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toLowerCase();

  let className =
    "bg-slate-100 text-slate-700";

  if (normalized.includes("suggested")) {
    className =
      "bg-green-100 text-green-700";
  }

  if (normalized.includes("review")) {
    className =
      "bg-yellow-100 text-yellow-700";
  }

  if (
    normalized.includes("insufficient") ||
    normalized.includes("not codeable")
  ) {
    className =
      "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {status}
    </span>
  );
}


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


function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <p className="text-sm text-slate-500">
      {text}
    </p>
  );
}