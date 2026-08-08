interface Props {
  report: any;
}

export default function OverviewCard({ report }: Props) {
  if (!report) return null;

  return (
    <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 p-10 text-white shadow-xl">

      <div className="flex items-center justify-between">

        <div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              report.eligible
                ? "bg-green-500/20 text-green-100"
                : "bg-red-500/20 text-red-100"
            }`}
          >
            {report.screeningResult}
          </span>

          <h1 className="mt-6 text-5xl font-bold">
            Eligibility Screening
          </h1>

          <p className="mt-5 max-w-3xl text-lg text-blue-100">
            {report.reasonForIneligibility}
          </p>

        </div>

      </div>

      <div className="mt-10 grid grid-cols-4 gap-6">

        <Metric
          label="Participant"
          value={report.participantId}
        />

        <Metric
          label="Result"
          value={report.screeningResult}
        />

        <Metric
          label="Confidence"
          value={`${report.confidence ?? 97}%`}
        />

        <Metric
          label="Decision"
          value={report.eligible ? "Eligible" : "Screen Failure"}
        />

      </div>

    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
      <p className="text-sm text-blue-100">{label}</p>

      <h2 className="mt-2 text-2xl font-bold">
        {value}
      </h2>
    </div>
  );
}