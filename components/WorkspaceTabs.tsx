"use client";

interface Props {
  active: string;
}

const tabs = [
  {
    id: "overview",
    label: "Overview",
  },
  {
    id: "evidence",
    label: "Evidence",
  },
  {
    id: "recommendations",
    label: "Recommendations",
  },
  {
    id: "documents",
    label: "Documents",
  },
];

export default function WorkspaceTabs({ active }: Props) {
  return (
    <div className="mb-8 flex gap-3 border-b border-slate-200 pb-5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
            active === tab.id
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}