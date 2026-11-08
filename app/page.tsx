import { redirect } from "next/navigation";
import SiteNav from "@/components/site/SiteNav";
import SiteFooter from "@/components/site/SiteFooter";
import { AiBox, AiStatus, ButtonLink, Card, StatusPill } from "@/components/ds";
import { modulesForArea } from "@/lib/modules";

const problems = [
  { title: "Screening means reading two documents at once", body: "A coordinator holds the protocol in one window and the chart in another, and checks every criterion by hand. Screen failures often show up late, after visits and lab work are done." },
  { title: "Protocols are long and they change", body: "Criteria, visit windows and prohibited medicines sit across many pages and amendments. Finding the rule that applies today takes time." },
  { title: "The same facts get typed again and again", body: "Values move from lab reports and notes into forms by hand. Each copy is another place for a mismatch and another query later." },
  { title: "AI is only useful if people can trust it", body: "Regulators expect a qualified person to stay in charge. A tool that hides its reasoning creates more checking, not less." },
];

const steps = [
  { n: "1", title: "Add the documents you already have", body: "Protocol, screening summary, lab report, medication list. TrialIQ works from the files, not from forms you have to fill in." },
  { n: "2", title: "TrialIQ drafts the check", body: "Every criterion or value comes back with what the protocol asks for, what the record shows and where it was found." },
  { n: "3", title: "You decide, with a reason", body: "One decision at a time. Confirm, request evidence or send to the PI. Nothing is final until a person signs it off." },
  { n: "4", title: "The audit trail writes itself", body: "Each decision is saved with who made it, when and why, so a monitor can follow it later." },
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
            <p className="text-sm font-semibold text-primary">For clinical research sites and sponsor teams</p>
            <h1 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink md:text-[52px]">Know why a participant can or cannot enroll, with the evidence next to every criterion.</h1>
            <p className="mt-5 max-w-xl text-[17px] leading-7 text-ink-2">TrialIQ reads the protocol and the participant record, drafts each check with its source and leaves every decision to your team. Coordinators spend their time deciding instead of searching.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink kind="primary" size="lg" href="/auth?demo=1">Try the demo</ButtonLink>
              <ButtonLink size="lg" href="#how">See how it works</ButtonLink>
            </div>
            <p className="mt-4 text-[13px] text-ink-3">The demo opens with a shared account and synthetic records. No real patient data.</p>
          </div>
          <Preview />
        </section>

        <section id="problem" className="border-y border-line bg-white">
          <div className="mx-auto max-w-[1160px] px-5 py-20 md:px-8">
            <h2 className="max-w-2xl text-[30px] font-semibold leading-tight tracking-[-0.015em]">Most of a coordinator&apos;s day goes into finding information, not deciding on it.</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-2">Published research on trial operations points to the same friction again and again. TrialIQ was designed around these problems.</p>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {problems.map((p) => (
                <div key={p.title} className="rounded-xl border border-line bg-page p-6">
                  <h3 className="text-base font-semibold text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-2">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-[1160px] px-5 py-20 md:px-8">
          <h2 className="max-w-2xl text-[30px] font-semibold leading-tight tracking-[-0.015em]">AI does the reading. People make the call.</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-2">TrialIQ takes over the manual parts of a check and stops at the decision. Every screen has one clear next step.</p>
          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="rounded-xl border border-line bg-white p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tint text-sm font-semibold text-brand-800">{s.n}</span>
                <h3 className="mt-4 text-base font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="checks" className="border-y border-line bg-white">
          <div className="mx-auto max-w-[1160px] px-5 py-20 md:px-8">
            <h2 className="max-w-2xl text-[30px] font-semibold leading-tight tracking-[-0.015em]">Twelve checks that replace manual work</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-2">Each check reads the source documents, shows what it found and names who signs it off.</p>
            <div className="mt-10 grid gap-8 lg:grid-cols-3">
              {groups.map((g) => (
                <div key={g.title}>
                  <h3 className="text-sm font-semibold text-ink-2">{g.title}</h3>
                  <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                    {g.list.map((m) => (
                      <li key={m.id} className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-ink">{m.title}</p>
                        <p className="mt-0.5 text-[13px] leading-5 text-ink-2">Instead of {m.replaces.charAt(0).toLowerCase() + m.replaces.slice(1)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="trust" className="mx-auto max-w-[1160px] px-5 py-20 md:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.015em]">Built for human oversight</h2>
              <p className="mt-3 text-[15px] leading-7 text-ink-2">ICH E6(R3) asks sponsors and sites to keep qualified people responsible for trial decisions. TrialIQ is designed around that rule.</p>
            </div>
            <ul className="space-y-4">
              {[
                ["Evidence beside every claim", "Each result shows the protocol rule, the record value and the source it came from."],
                ["A person signs off", "TrialIQ drafts. Decisions need a named person and a written reason."],
                ["Facts and suggestions stay apart", "What the record says is labelled separately from what TrialIQ suggests."],
                ["Synthetic data in the demo", "Every demo record is made up. Nothing here is for clinical use."],
              ].map(([t, b]) => (
                <li key={t} className="rounded-xl border border-line bg-white p-5"><p className="text-sm font-semibold text-ink">{t}</p><p className="mt-1 text-sm leading-6 text-ink-2">{b}</p></li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-brand-800">
          <div className="mx-auto flex max-w-[1160px] flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <h2 className="text-[26px] font-semibold tracking-[-0.015em] text-white">Open the demo and screen PT-1042 yourself</h2>
              <p className="mt-2 text-[15px] text-white/80">It takes about a minute. The sign-in details are filled in for you.</p>
            </div>
            <ButtonLink size="lg" href="/auth?demo=1" className="border-white bg-white text-brand-800 hover:bg-tint">Try the demo</ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
