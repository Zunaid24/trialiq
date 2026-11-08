import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, FileSearch, FileText, ScanSearch, ShieldCheck, UserCheck } from "lucide-react";
import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";
import Compare from "@/components/site/Compare";
import { LogoMark } from "@/components/brand/Logo";
import { ButtonLink, StatusPill } from "@/components/ds";
import { modulesForArea } from "@/lib/modules";

const flow = [
  { icon: FileText, title: "You add the PDFs", body: "The protocol and the participant record you already have. No forms and no integration." },
  { icon: ScanSearch, title: "AI reads both", body: "TrialIQ pulls every rule out of the protocol and finds the matching fact in the chart." },
  { icon: FileSearch, title: "Every answer cites its source", body: "Each verdict carries the rule, the record value and the page it came from." },
  { icon: UserCheck, title: "A person signs it off", body: "The coordinator or PI confirms with a reason. Nothing counts until they do." },
];

const trust = [
  { icon: FileSearch, title: "Proof beside every answer", body: "Open any result and the source line is right there. Checking the AI is quick." },
  { icon: UserCheck, title: "People stay in charge", body: "Built around ICH E6(R3) human oversight. TrialIQ drafts and never decides." },
  { icon: BadgeCheck, title: "One decision at a time", body: "Open items come first. Everything else waits a click away." },
  { icon: ShieldCheck, title: "An audit trail by default", body: "Every decision is saved with a name and a reason a monitor can follow." },
];

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[540px] lg:mx-0" aria-hidden>
      <div className="absolute -left-4 top-6 w-[62%] -rotate-6 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
        <p className="text-[11px] font-semibold text-white/70">Protocol, page 14</p>
        <div className="mt-3 space-y-2">{[90, 70, 85].map((w, i) => <div key={i} className="h-1.5 rounded bg-white/25" style={{ width: `${w}%` }} />)}</div>
        <div className="mt-2 rounded bg-[#9CC0FF]/40 px-1.5 py-1 text-[10px] font-medium text-white">ANC 1.5 x10⁹/L or more</div>
        <div className="mt-2 space-y-2">{[80, 60].map((w, i) => <div key={i} className="h-1.5 rounded bg-white/25" style={{ width: `${w}%` }} />)}</div>
      </div>
      <div className="absolute -right-2 top-0 w-[56%] rotate-6 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
        <p className="text-[11px] font-semibold text-white/70">Lab report, 06 Aug</p>
        <div className="mt-3 space-y-2">{[75, 90].map((w, i) => <div key={i} className="h-1.5 rounded bg-white/25" style={{ width: `${w}%` }} />)}</div>
        <div className="mt-2 rounded bg-[#FF9C8A]/40 px-1.5 py-1 text-[10px] font-medium text-white">ANC 1.1 x10⁹/L</div>
        <div className="mt-2 space-y-2">{[65, 80].map((w, i) => <div key={i} className="h-1.5 rounded bg-white/25" style={{ width: `${w}%` }} />)}</div>
      </div>

      <div className="relative mt-28 overflow-hidden rounded-2xl bg-white shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]">
        <div className="hero-scan pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="flex items-center gap-2 text-xs text-ink-3"><span className="font-mono text-ink-2">PT-1042</span>Screening visit</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok" />Checked by TrialIQ</span>
        </div>
        <div className="p-5">
          <p className="text-lg font-semibold tracking-[-0.01em] text-ink">Not eligible: 2 criteria not met</p>
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line">
            {([["I4", "Blood counts", "ANC 1.1, needs 1.5 or more", "no", "Not met"], ["I5", "Kidney function", "Creatinine 1.4, max 1.2", "no", "Not met"], ["E3", "Prohibited medicines", "Prednisone, washout unclear", "rev", "Needs evidence"]] as const).map(([id, t, d, tone, pill], i) => (
              <div key={id} className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "bg-tint shadow-[inset_3px_0_0_var(--primary)]" : ""}`}>
                <span className="w-6 font-mono text-xs text-ink-3">{id}</span>
                <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-ink">{t}</span><span className="block truncate text-xs text-ink-2">{d}</span></span>
                <StatusPill tone={tone}>{pill}</StatusPill>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-3">Source: Lab report 06 Aug, page 2</p>
            <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white">Confirm not met</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  // Supabase can return the email verification code to the Site URL; route it through the callback.
  if (params.code) redirect(`/auth/callback?code=${encodeURIComponent(params.code)}&next=/dashboard`);

  const groups = [
    { title: "For each participant", list: modulesForArea("participant") },
    { title: "Across the study", list: modulesForArea("study") },
    { title: "For data quality", list: modulesForArea("data") },
  ];

  return (
    <div className="min-h-screen bg-white text-ink">
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0B1A3A] text-white">
          <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" aria-hidden />
          <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-primary/50 blur-[140px]" aria-hidden />
          <div className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#5B8DEF]/25 blur-[120px]" aria-hidden />
          <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 px-5 pb-24 pt-16 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[13px] font-medium text-white/85"><span className="h-1.5 w-1.5 rounded-full bg-[#9CC0FF]" />AI for clinical trial sites</p>
              <h1 className="mt-6 text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] md:text-[68px]">
                AI reads the protocol.
                <span className="block bg-gradient-to-r from-[#9CC0FF] via-white to-[#9CC0FF] bg-clip-text text-transparent">You make the call.</span>
              </h1>
              <p className="mt-6 max-w-[520px] text-lg leading-8 text-white/70">TrialIQ reads the protocol and the participant record side by side, checks every criterion and shows the source line behind each answer. Your team stops searching and starts deciding.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink size="lg" href="/auth?demo=1" className="border-white bg-white text-brand-800 hover:bg-tint">Screen a demo participant</ButtonLink>
                <Link href="#compare" className="inline-flex h-12 items-center rounded-lg border border-white/25 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10">See before and after</Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/70">
                <span className="flex items-center gap-2"><FileSearch size={16} className="text-[#9CC0FF]" />A source for every answer</span>
                <span className="flex items-center gap-2"><UserCheck size={16} className="text-[#9CC0FF]" />A person signs every decision</span>
              </div>
            </div>
            <HeroVisual />
          </div>
        </section>

        {/* Before and after */}
        <section id="compare" className="bg-page">
          <div className="mx-auto max-w-[1200px] px-5 py-24 md:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary">Before and after</p>
              <h2 className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-[-0.025em] md:text-[44px]">Same check. Without the hours of reading.</h2>
              <p className="mt-4 text-[17px] leading-7 text-ink-2">Coordinators spend most of a check finding information, not deciding on it. Pick a task to see what changes.</p>
            </div>
            <div className="mt-12"><Compare /></div>
          </div>
        </section>

        {/* How the AI works */}
        <section id="how" className="bg-white">
          <div className="mx-auto max-w-[1200px] px-5 py-24 md:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary">How the AI works</p>
              <h2 className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-[-0.025em] md:text-[44px]">The AI does the reading. It stops at the decision.</h2>
            </div>
            <ol className="relative mt-14 grid gap-6 md:grid-cols-4">
              <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-line via-primary/40 to-line md:block" aria-hidden />
              {flow.map((f, i) => {
                const Icon = f.icon;
                const last = i === flow.length - 1;
                return (
                  <li key={f.title} className="relative">
                    <span className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border ${last ? "border-ink bg-ink text-white" : "border-line bg-white text-primary"} shadow-sm`}><Icon size={22} strokeWidth={1.8} /></span>
                    <p className="mt-5 font-mono text-xs text-ink-3">{`0${i + 1}`}{i === 1 || i === 2 ? "  AI" : "  Person"}</p>
                    <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.01em] text-ink">{f.title}</h3>
                    <p className="mt-2 text-[15px] leading-6 text-ink-2">{f.body}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Why trust it */}
        <section id="why" className="relative overflow-hidden bg-[#0B1A3A] text-white">
          <div className="pointer-events-none absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-primary/30 blur-[140px]" aria-hidden />
          <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 gap-14 px-5 py-24 md:px-8 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold text-[#9CC0FF]">Why teams trust it</p>
              <h2 className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-[-0.025em] md:text-[44px]">Most AI gives you an answer. TrialIQ gives you the proof.</h2>
              <p className="mt-5 max-w-md text-[17px] leading-7 text-white/70">In a regulated trial an answer without a source creates more work. So every result shows where it came from, and a person always has the last word.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {trust.map((w) => {
                const Icon = w.icon;
                return (
                  <div key={w.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                    <Icon size={22} strokeWidth={1.8} className="text-[#9CC0FF]" />
                    <h3 className="mt-4 text-base font-semibold">{w.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">{w.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Checks */}
        <section id="checks" className="bg-white">
          <div className="mx-auto max-w-[1200px] px-5 py-24 md:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary">Twelve checks</p>
              <h2 className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-[-0.025em] md:text-[44px]">One way of working, from screening to data quality.</h2>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {groups.map((g) => (
                <div key={g.title} className="rounded-2xl border border-line bg-page p-6">
                  <h3 className="text-sm font-semibold text-ink">{g.title}</h3>
                  <ul className="mt-4 space-y-3">
                    {g.list.map((m) => (
                      <li key={m.id} className="flex items-start gap-3">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span><span className="block text-[15px] font-semibold text-ink">{m.title}</span><span className="block text-[13px] text-ink-3">Sign off: {m.signOff}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white px-5 pb-24 md:px-8">
          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-brand-800 px-8 py-14 text-white md:px-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden />
            <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-5">
                <LogoMark size={52} className="hidden shrink-0 rounded-xl ring-1 ring-white/30 sm:block" />
                <div>
                  <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] md:text-[36px]">Screen PT-1042 yourself.</h2>
                  <p className="mt-2 text-[17px] text-white/80">It takes about a minute. The demo sign in is filled in for you.</p>
                </div>
              </div>
              <ButtonLink size="lg" href="/auth?demo=1" className="border-white bg-white text-brand-800 hover:bg-tint">Open the demo</ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
