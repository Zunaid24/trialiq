interface Props {
  report: any;
}

export default function EvidenceTable({ report }: Props) {
  return (
    <div className="rounded-3xl border bg-white p-8 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold">
        AI Evidence
      </h2>

      <div className="space-y-4">

        {report.criteriaEvaluation?.inclusion?.map(
          (item: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl border p-5"
            >
              <div>

                <h3 className="font-semibold">
                  {item.criterion}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Expected: {item.expected}
                </p>

                <p className="text-sm text-slate-500">
                  Actual: {item.actual}
                </p>

              </div>

              <span
                className={`rounded-full px-3 py-1 text-sm ${
                  item.status.includes("Not")
                    ? "bg-red-100 text-red-700"
                    : item.status.includes("Pending")
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {item.status}
              </span>
            </div>
          )
        )}

      </div>

    </div>
  );
}