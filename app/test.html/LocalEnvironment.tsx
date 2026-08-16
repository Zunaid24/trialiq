"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Loader2, MonitorCog, RefreshCw, Square, Zap } from "lucide-react";

const AGENT_URL = "http://127.0.0.1:45822";
const START_AGENT_URL = "trialiq://start-agent";

type AgentStatus = {
  ok: boolean;
  agent?: string;
  projectDir?: string;
  site?: { host?: string; live?: boolean; managed?: boolean };
  git?: { branch?: string; commit?: string };
  gitSync?: { status?: string; message?: string; branch?: string; commit?: string };
};

export default function LocalEnvironment() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [busy, setBusy] = useState<"start" | "stop" | "restart" | null>(null);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${AGENT_URL}/status`, { cache: "no-store" });
      if (!response.ok) throw new Error("Agent unavailable");
      setStatus(await response.json());
      setMessage("");
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2500);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function action(kind: "start" | "stop" | "restart") {
    setBusy(kind);
    setMessage("");
    try {
      const response = await fetch(`${AGENT_URL}/site/${kind}`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || `Unable to ${kind} local site.`);
      setMessage(kind === "stop" ? "Local site stopped." : "Local site is live.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Unable to ${kind} local site.`);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  function startAgent() {
    setMessage("Starting the TrialIQ local agent…");
    window.location.href = START_AGENT_URL;
    window.setTimeout(() => void refresh(), 1500);
    window.setTimeout(() => void refresh(), 4000);
  }

  const agentOnline = Boolean(status?.ok && status?.agent === "online");
  const siteLive = Boolean(status?.site?.live);
  const managed = Boolean(status?.site?.managed);
  const gitSyncBlocked = status?.gitSync?.status === "blocked" || status?.gitSync?.status === "error";
  const gitSyncMessage = status?.gitSync?.message || "";

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-xl p-2 ${agentOnline ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            <MonitorCog size={19} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold">Local environment</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${agentOnline ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {agentOnline ? "Agent online" : "Agent offline"}
              </span>
              {agentOnline && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${gitSyncBlocked ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                Git {status?.gitSync?.status || "checking"}
              </span>}
            </div>
            <p className="mt-1 text-sm text-slate-500">Control the local Next.js site used by Playwright without opening a terminal.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${siteLive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                {siteLive ? <CheckCircle2 size={13} /> : <CircleAlert size={13} />} localhost:3000 {siteLive ? "live" : "offline"}
              </span>
              {siteLive && <span className={`rounded-full border px-2.5 py-1 ${managed ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{managed ? "Managed by agent" : "Not agent-managed"}</span>}
              {status?.git?.commit && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-slate-500">{status.git.branch} · {status.git.commit}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!agentOnline && <button type="button" onClick={startAgent} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800">
            <Zap size={14} fill="currentColor" /> Start Agent
          </button>}
          <button type="button" onClick={() => void action("start")} disabled={!agentOnline || siteLive || !!busy || gitSyncBlocked} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
            {busy === "start" ? <Loader2 size={14} className="animate-spin" /> : <MonitorCog size={14} />} Start local site
          </button>
          <button type="button" onClick={() => void action("restart")} disabled={!agentOnline || !siteLive || !!busy || gitSyncBlocked} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
            {busy === "restart" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Restart
          </button>
          <button type="button" onClick={() => void action("stop")} disabled={!agentOnline || !siteLive || !!busy} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40">
            {busy === "stop" ? <Loader2 size={14} className="animate-spin" /> : <Square size={13} fill="currentColor" />} Stop
          </button>
        </div>
      </div>

      {!agentOnline && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>Local agent not connected.</strong> Use <strong>Start Agent</strong> above after installing the one-time Windows protocol. Your browser will launch the local TrialIQ agent, then this page will detect it automatically.</p>}
      {gitSyncBlocked && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-900"><strong>Git sync blocked.</strong> {gitSyncMessage}</p>}
      {message && <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700">{message}</p>}
    </section>
  );
}
