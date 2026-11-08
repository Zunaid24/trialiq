import Link from "next/link";

type Entry = { title: string; text: string; href: string };

// Plain list hub for a section: what each check does and where it lives. No tool grid.
export default function HubPage({ title, intro, entries }: { title: string; intro: string; entries: Entry[] }) {
  return (
    <div className="max-w-3xl px-9 pb-12 pt-8">
      <h1 className="text-[28px] font-semibold tracking-[-0.015em]">{title}</h1>
      <p className="mt-1 text-[15px] text-ink-2">{intro}</p>
      <ul className="mt-6">
        {entries.map((e) => (
          <li key={e.href}><Link href={e.href} className="flex items-baseline gap-6 border-t border-line px-3 py-4 hover:bg-surface">
            <span className="w-52 shrink-0 text-sm font-medium">{e.title}</span><span className="text-sm text-ink-2">{e.text}</span>
          </Link></li>
        ))}
      </ul>
    </div>
  );
}
