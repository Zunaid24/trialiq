import { redirect } from "next/navigation";
import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";
import { AiBox, AiStatus, ButtonLink, Card, StatusPill } from "@/components/ds";
import { modulesForArea } from "@/lib/modules";

// Before and after: the manual way each check is done today, next to what TrialIQ does instead.
const compare = [
  { task: "Eligibility screening", before: "The protocol sits in one window and the chart in another. Every criterion is checked by eye.", after: "Every criterion comes back with a verdict and the exact line from the record behind it." },
  { task: "Lab values", before: "Each value and its range is copied out of the report and compared by hand.", after: "Values outside the reference range are flagged with the report line they came from." },
  { task: "Medications", before: "Each medicine is checked against the prohibited list and the washout rules.", after: "Prohibited medicines and open washout periods are flagged for the investigator." },
  { task: "Deviations and adverse events", before: "Log entries are written from visit notes, often days later.", after: "A draft entry is ready with the fields that are still missing called out." },
  { task: "Cross record checks", before: "Dates are compared across every document before the monitor visit.", after: "Records that disagree are listed while there is still time to fix them." },
  { task: "Audit trail", before: "Decisions live in emails and in the margins of printouts.", after: "Each decision is saved with the name of the person who made it and their reason." },
];

const how = [
  { n: "01", title: "Reads the files you already have", body: "Upload the protocol and the participant PDFs. No forms to fill and no system to integrate." },
  { n: "02", title: "Matches every rule to the record", body: "TrialIQ pulls each criterion out of the protocol and looks for the matching fact in the chart." },
  { n: "03", title: "Shows its evidence", body: "Every answer carries the protocol rule, the record value and the page it was found on." },
  { n: "04", title: "Stops at the decision", body: "The AI drafts. A coordinator or PI confirms, with a reason, before anything counts." },
];

const why = [
  { title: "Proof beside every answer", body: "No black box. Open any result and the source line is right there, so checking the AI is quick." },
  { title: "Built around human sign off", body: "ICH E6(R3) keeps qualified people responsible for trial decisions. TrialIQ never decides on its own." },
  { title: "One decision at a time", body: "Open items come first and everything else waits a click away. Coordinators see what to do next, not a wall of data." },
  { title: "Twelve checks, one way of working", body: "Every check reads the same way and ends with the same sign off, so there is one thing to learn." },
];

function Preview() {
  return (
    <Card as="div" className="overflow-hidden shadow-[0_24px_60px_-24px_rgba(26,31,46,0.25)]">
      <div className="flex items-center gap-2 border-b border-line bg-page px-4 py-2.5 text-xs text-ink-3"><span className="font-mono text-ink-2">PT-1042</span><span>Screening visit 08 Aug 2026</span></div>
      <div className="space-y-4 p-5">
        <div>
          <p className="text-lg font-semibold tracking-[-0.01em] text-ink">Not eligible: 3 inclusion criteria not met</p>
          <p className="mt-0.5 text-[13px] text-ink-2">6 more criteria need evidence before the PI can sign off.</p>
        </div>
        <AiStatus>Checked by TrialIQ against 12 protocol criteria, 2 min ago.</AiStatus>
        <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {[["I4", "Blood counts", "Hb 10.2, ANC 1.1, platelets 145", "no"], ["I5", "Kidney function", "Creatinine 1.4 mg/dL (max 1.2)", "no"], ["E3", "No prohibited meds in washout", "Prednisone 01 to 05 Aug, washout not confirmed", "rev"]].map(([id, t, d, s], i) => (
            <div key={id} className={`flex items-center gap-3 px-3.5 py-3 ${i === 0 ? "bg-tint shadow-[inset_3px_0_0_var(--primary)]" : "bg-white"}`}>
              <span className="w-6 font-mono text-xs text-ink-3">{id}</span>
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-ink">{t}</span><span className="block truncate text-xs text-ink-2">{d}</span></span>
              <StatusPill tone={s as "no" | "rev"}>{s === "no" ? "Not met" : "Needs evidence"}</StatusPill>
            </div>
          ))}
        </div>
        <AiBox label="TrialIQ suggests">The protocol excerpt does not say whether a lab retest is allowed. Ask the PI before screen failing.</AiBox>
      </div>
    </Card>
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
    <div className="min-h-screen bg-page text-ink">
      <SiteNav />
      <main>
        <section className="mx-auto grid max-w-[1160px] items-center gap-12 px-5 pb-20 pt-14 md:px-8 lg:grid-cols-[1fr_520px] lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-soft bg-tint px-3 py-1 text-[13px] font-semibold text-brand-800"><span className="h-1.5 w-1.5 rounded-full bg-primary" />AI screening assistant for clinical trial sites</p>
            <h1 className="mt-5 text-[42px] font-semibold leading-[1.06] tracking-[-0.025em] text-ink md:text-[58px]">AI reads the protocol.<br /><span className="text-primary">You make the call.</span></h1>
            <p className="mt-5 max-w-xl text-[17px] leading-7 text-ink-2">TrialIQ reads the protocol and the participant record together, checks every eligibility criterion and puts the source line beside each answer. Coordinators stop hunting through PDFs and start deciding.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink kind="primary" size="lg" href="/auth?demo=1">Screen a demo participant</ButtonLink>
              <ButtonLink size="lg" href="#compare">See before and after</ButtonLink>
            </div>
            <p className="mt-4 text-[13px] text-ink-3">Opens with a shared demo account and synthetic records. No real patient data.</p>
          </div>
          <Preview />
        </section>

        <section id="compare" className="border-y border-line bg-white">
          <div className="mx-auto max-w-[1160px] px-5 py-20 md:px-8">
            <h2 className="max-w-3xl text-[32px] font-semibold leading-tight tracking-[-0.02em]">A coordinator&apos;s day goes into finding information. TrialIQ gives that time back to deciding.</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-2">Here is what each task looks like by hand today, and what it looks like when the AI does the reading first.</p>
            <div className="mt-10 overflow-hidden rounded-xl border border-line">
              <div className="hidden grid-cols-[220px_1fr_1fr] bg-page text-[13px] font-semibold md:grid">
                <p className="px-5 py-3 text-ink-2">Task</p>
                <p className="border-l border-line px-5 py-3 text-ink-2">By hand today</p>
                <p className="border-l border-line px-5 py-3 text-primary">With TrialIQ</p>
              </div>
              {compare.map((c) => (
                <div key={c.task} className="grid border-t border-line first:border-t-0 md:grid-cols-[220px_1fr_1fr] md:first:border-t">
                  <p className="px-5 pt-4 text-sm font-semibold text-ink md:py-4">{c.task}</p>
                  <p className="px-5 pt-2 text-sm leading-6 text-ink-2 md:border-l md:border-line md:py-4"><span className="font-semibold text-ink-3 md:hidden">By hand: </span>{c.before}</p>
                  <p className="px-5 pb-4 pt-2 text-sm leading-6 text-ink md:border-l md:border-line md:bg-tint/50 md:py-4"><span className="font-semibold text-primary md:hidden">With TrialIQ: </span>{c.after}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-[1160px] px-5 py-20 md:px-8">
          <h2 className="max-w-2xl text-[32px] font-semibold leading-tight tracking-[-0.02em]">How the AI works</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-2">A Gemini model reads the documents and drafts each check. It never signs anything off.</p>
          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {how.map((s) => (
              <li key={s.n} className="rounded-xl border border-line bg-white p-6">
                <span className="font-mono text-sm font-medium text-primary">{s.n}</span>
                <h3 className="mt-3 text-base font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="why" className="bg-brand-800 text-white">
          <div className="mx-auto max-w-[1160px] px-5 py-20 md:px-8">
            <h2 className="max-w-2xl text-[32px] font-semibold leading-tight tracking-[-0.02em]">Why teams can trust it</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-white/75">Most AI tools give an answer. TrialIQ gives the answer and the proof, then hands the decision to a person.</p>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {why.map((w) => (
                <div key={w.title} className="rounded-xl border border-white/15 bg-white/5 p-6">
                  <h3 className="text-base font-semibold">{w.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/75">{w.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="checks" className="mx-auto max-w-[1160px] px-5 py-20 md:px-8">
          <h2 className="max-w-2xl text-[32px] font-semibold leading-tight tracking-[-0.02em]">Twelve checks across the trial</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-2">Each one reads the source documents and names who signs it off.</p>
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            {groups.map((g) => (
              <div key={g.title}>
                <h3 className="text-sm font-semibold text-ink-2">{g.title}</h3>
                <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
                  {g.list.map((m) => (
                    <li key={m.id} className="flex items-baseline justify-between gap-4 px-4 py-3">
                      <span className="text-sm font-semibold text-ink">{m.title}</span>
                      <span className="text-right text-xs text-ink-3">{m.signOff}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-[1160px] flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <h2 className="text-[26px] font-semibold tracking-[-0.015em] text-ink">Screen PT-1042 yourself</h2>
              <p className="mt-2 text-[15px] text-ink-2">About a minute. The demo sign in is filled in for you.</p>
            </div>
            <ButtonLink kind="primary" size="lg" href="/auth?demo=1">Open the demo</ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
