interface Props {
  report: any;
}

export default function Recommendations({ report }: Props) {
  return (
    <div className="rounded-3xl border bg-white p-8 shadow-sm">

      <h2 className="mb-6 text-2xl font-bold">
        AI Recommendations
      </h2>

      <div className="space-y-4">

        {report.pendingAssessments?.map(
          (item: any, index: number) => (
            <div
              key={index}
              className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5"
            >
              <h3 className="font-semibold">
                {item.assessment}
              </h3>

              <p className="mt-2 text-slate-600">
                {item.clinicalImpact}
              </p>

              <span className="mt-4 inline-block rounded-full bg-yellow-200 px-3 py-1 text-sm">
                {item.status}
              </span>
            </div>
          )
        )}

      </div>

    </div>
  );
}