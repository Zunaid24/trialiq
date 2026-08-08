interface Props {
  report: any;
}

export default function AnalysisReport({ report }: Props) {
  if (!report) return null;

  const statusColor = report.eligible? "text-green-600"
  : "text-red-600";

  return (
    <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 p-10 text-white shadow-xl">

  <div>

    <span
      className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
        report.eligible
          ? "bg-green-500/20 text-green-100"
          : "bg-red-500/20 text-red-100"
      }`}
    >
      {report.screeningResult}
    </span>

    <h1 className="mt-6 text-5xl font-bold">
      {report.studyTitle ?? "Clinical Trial"}
    </h1>

    <p className="mt-5 max-w-3xl text-lg text-blue-100">
      {report.executiveSummary ??
        report.reasonForIneligibility}
    </p>

  </div>

  <div className="mt-10 grid grid-cols-4 gap-8">

    <Metric
      label="Participant"
      value={report.participantId}
    />

    <Metric
      label="Eligibility"
      value={report.screeningResult}
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
        

      {/* Reason */}

      <Section title="Primary Finding">

        <div className="rounded-2xl bg-red-50 p-5 border border-red-100">

          <div className="space-y-5">

  <div className="rounded-xl border border-red-200 bg-red-50 p-5">

    <h3 className="font-semibold">
      Primary Finding
    </h3>

    <p className="mt-2">
      {report.reasonForIneligibility}
    </p>

  </div>

  <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">

    <h3 className="font-semibold">
      Executive Summary
    </h3>

    <p className="mt-2">
      {report.executiveSummary}
    </p>

  </div>

</div>

        </div>

      </Section>

      {/* Inclusion */}

      <Section title="Inclusion Criteria">

        <div className="space-y-3">
  {report.criteriaEvaluation?.inclusion?.map(
    (item: any, index: number) => (
      <Criterion
        key={index}
        item={item}
      />
    )
  )}
</div>
      </Section>

      {/* Exclusion */}

      <Section title="Exclusion Criteria">

        <div className="space-y-3">

          {report.criteriaEvaluation?.exclusion?.map(
            (item: any, index: number) => (
              <Criterion key={index} item={item} />
            )
          )}

        </div>

      </Section>

      {/* Recommendations */}

      <Section title="Clinical Action Items">
  <div className="space-y-4">

    {report.pendingAssessments?.map((item: any, index: number) => (
      <div
        key={index}
        className="rounded-xl border border-yellow-200 bg-yellow-50 p-5"
      >
        <h3 className="font-semibold">
          {item.assessment}
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          {item.clinicalImpact}
        </p>

        <span className="mt-4 inline-block rounded-full bg-yellow-200 px-3 py-1 text-sm">
          {item.status}
        </span>
      </div>
    ))}

  </div>
</Section>

    </div>
  );
}

function Card({
  title,
  value,
  color = "",
}: {
  title: string;
  value?: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h3 className={`mt-2 text-xl font-bold ${color}`}>
        {value ?? "-"}
      </h3>
    </div>
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
    <div className="rounded-3xl border bg-white p-8 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold">
        {title}
      </h2>

      {children}

    </div>
  );
}

function Criterion({ item }: any) {
  let badge =
    "bg-gray-100 text-gray-700";

  if (item.status.includes("Met"))
    badge = "bg-green-100 text-green-700";

  if (item.status.includes("Pending"))
    badge = "bg-yellow-100 text-yellow-700";

  if (item.status.includes("Not"))
    badge = "bg-red-100 text-red-700";

  return (
    <div className="flex items-center justify-between rounded-xl border p-4">

      <div>

        <p className="font-medium">
          {item.criterion}
        </p>

        <p className="text-sm text-gray-500">
  Expected: {item.expected}
  <br />
  Actual: {item.actual}
</p>

      </div>

      <span className={`rounded-full px-3 py-1 text-sm ${badge}`}>
        {item.status}
      </span>

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
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-sm text-blue-100">
        {label}
      </p>

      <h3 className="mt-2 text-3xl font-bold text-white">
        {value}
      </h3>
    </div>
  );
}
function ScoreBar({ score }: { score: number }) {
  return (
    <div className="mt-4">

      <div className="h-3 overflow-hidden rounded-full bg-slate-200">

        <div
          className="h-full rounded-full bg-green-500"
          style={{
            width: `${score}%`,
          }}
        />

      </div>

    </div>
  );
}