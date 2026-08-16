import http from "node:http";
import { execFile, spawn, type ChildProcess } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const HOST = "127.0.0.1";
const PORT = Number(process.env.TRIALIQ_AGENT_PORT || 45822);
const SITE_PORT = Number(process.env.TRIALIQ_SITE_PORT || 3000);
const PROJECT_DIR = process.env.TRIALIQ_PROJECT_DIR || process.cwd();
const RUNNER_PID_FILE = path.join(os.tmpdir(), "trialiq-local-runner.pid");

let siteProcess: ChildProcess | null = null;
let runnerProcess: ChildProcess | null = null;
let siteStartError = "";
let runnerStartError = "";
let gitSync: { status: string; message: string; branch: string; commit: string } = {
  status: "checking",
  message: "Checking GitHub for updates...",
  branch: "unknown",
  commit: "unknown",
};

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Private-Network": "true",
  });
  res.end(JSON.stringify(body));
}

function runGit(args: string[]): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile("git", args, { cwd: PROJECT_DIR, windowsHide: true }, (error, stdout, stderr) => {
      resolve({ ok: !error, stdout: String(stdout).trim(), stderr: String(stderr).trim() });
    });
  });
}

async function showGitPopup(message: string) {
  if (process.platform !== "win32") return;
  const escaped = message.replace(/'/g, "''");
  execFile(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      `Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('${escaped}', 'TrialIQ Git Sync', 'OK', 'Error') | Out-Null`,
    ],
    { windowsHide: true },
    () => undefined,
  );
}

async function getGitInfo() {
  const branch = await runGit(["branch", "--show-current"]);
  const commit = await runGit(["rev-parse", "--short", "HEAD"]);
  return {
    branch: branch.ok ? branch.stdout : "unknown",
    commit: commit.ok ? commit.stdout : "unknown",
  };
}

async function syncGit() {
  const info = await getGitInfo();
  gitSync = { status: "checking", message: "Fetching origin/main...", ...info };

  if (info.branch !== "main") {
    gitSync = { status: "blocked", message: `Local branch is '${info.branch}'. Switch to main before starting TrialIQ.`, ...info };
    await showGitPopup(gitSync.message);
    return gitSync;
  }

  const dirty = await runGit(["status", "--porcelain"]);
  if (!dirty.ok) {
    gitSync = { status: "error", message: dirty.stderr || "Unable to read Git status.", ...info };
    await showGitPopup(gitSync.message);
    return gitSync;
  }

  if (dirty.stdout) {
    gitSync = { status: "blocked", message: "Local changes are present. Commit or stash them before TrialIQ can pull main.", ...info };
    await showGitPopup(gitSync.message);
    return gitSync;
  }

  const fetched = await runGit(["fetch", "origin", "main"]);
  if (!fetched.ok) {
    gitSync = { status: "error", message: fetched.stderr || "Git fetch failed.", ...info };
    await showGitPopup(gitSync.message);
    return gitSync;
  }

  const counts = await runGit(["rev-list", "--left-right", "--count", "HEAD...origin/main"]);
  if (!counts.ok) {
    gitSync = { status: "error", message: counts.stderr || "Unable to compare local main with origin/main.", ...info };
    await showGitPopup(gitSync.message);
    return gitSync;
  }

  const [aheadText, behindText] = counts.stdout.split(/\s+/).map(Number);
  const ahead = Number.isFinite(aheadText) ? aheadText : 0;
  const behind = Number.isFinite(behindText) ? behindText : 0;

  if (ahead > 0 && behind > 0) {
    gitSync = {
      status: "blocked",
      message: `main has diverged: local is ${ahead} commit(s) ahead and ${behind} commit(s) behind origin/main. Merge/reconcile this in GitHub first.`,
      ...info,
    };
    await showGitPopup(gitSync.message);
    return gitSync;
  }

  if (ahead > 0) {
    gitSync = {
      status: "blocked",
      message: `Local main is ${ahead} commit(s) ahead of origin/main. Push or reconcile the local commits before starting TrialIQ.`,
      ...info,
    };
    await showGitPopup(gitSync.message);
    return gitSync;
  }

  if (behind > 0) {
    const pulled = await runGit(["pull", "--ff-only", "origin", "main"]);
    if (!pulled.ok) {
      gitSync = { status: "blocked", message: pulled.stderr || "Git pull failed. Resolve the Git state before starting TrialIQ.", ...await getGitInfo() };
      await showGitPopup(gitSync.message);
      return gitSync;
    }
  }

  const updated = await getGitInfo();
  gitSync = {
    status: behind > 0 ? "updated" : "current",
    message: behind > 0 ? `Local project updated from origin/main (${behind} commit(s)).` : "Local main is already up to date.",
    ...updated,
  };
  return gitSync;
}

function checkSite(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://${HOST}:${SITE_PORT}`, (response) => {
      response.resume();
      resolve(Boolean(response.statusCode && response.statusCode < 500));
    });
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

function processAlive(pid: number | null) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readRunnerPid() {
  try {
    const pid = Number(fs.readFileSync(RUNNER_PID_FILE, "utf8").trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function writeRunnerPid(pid: number) {
  fs.writeFileSync(RUNNER_PID_FILE, String(pid), "utf8");
}

function clearRunnerPid() {
  try { fs.unlinkSync(RUNNER_PID_FILE); } catch {}
}

function terminateProcess(child: ChildProcess) {
  const pid = child.pid;
  if (!pid) return;
  if (process.platform === "win32") {
    execFile("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true }, () => undefined);
  } else {
    child.kill("SIGTERM");
  }
}

function terminatePid(pid: number | null) {
  if (!pid) return;
  if (process.platform === "win32") {
    execFile("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true }, () => undefined);
  } else {
    try { process.kill(pid, "SIGTERM"); } catch {}
  }
}

function runnerStatus() {
  if (runnerProcess?.pid && !runnerProcess.killed) {
    return { managed: true, status: "running", pid: runnerProcess.pid, error: runnerStartError || undefined };
  }

  const persistedPid = readRunnerPid();
  if (processAlive(persistedPid)) {
    return { managed: true, status: "running", pid: persistedPid, error: runnerStartError || undefined };
  }

  clearRunnerPid();
  return { managed: true, status: "idle", pid: null, error: runnerStartError || undefined };
}

async function startRunner() {
  if (gitSync.status === "blocked" || gitSync.status === "error") {
    return { ok: false, ...runnerStatus(), error: gitSync.message, git: gitSync };
  }

  const existing = runnerStatus();
  if (existing.status === "running") return { ok: true, alreadyRunning: true, ...existing };

  runnerStartError = "";
  const npmCommand = process.platform === "win32" ? "cmd.exe" : "npm";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npm run test:runner"]
    : ["run", "test:runner"];

  let child: ChildProcess;
  try {
    child = spawn(npmCommand, args, {
      cwd: PROJECT_DIR,
      detached: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
  } catch (error) {
    runnerStartError = error instanceof Error ? error.message : "Unable to start the local quality runner.";
    return { ok: false, ...runnerStatus(), error: runnerStartError };
  }

  if (!child.pid) {
    runnerStartError = "Unable to start the local quality runner: no process id was returned.";
    return { ok: false, ...runnerStatus(), error: runnerStartError };
  }

  runnerProcess = child;
  writeRunnerPid(child.pid);

  child.stdout?.on("data", (chunk) => {
    const text = String(chunk).trim();
    if (text) console.log(`[TrialIQ][Runner] ${text}`);
  });
  child.stderr?.on("data", (chunk) => {
    const text = String(chunk).trim();
    if (text) {
      runnerStartError = text.slice(-4000);
      console.error(`[TrialIQ][Runner] ${text}`);
    }
  });
  child.on("error", (error) => {
    runnerStartError = error.message;
    console.error(`[TrialIQ][Runner] Process error: ${error.message}`);
  });
  child.on("exit", (code, signal) => {
    if (code !== 0 && !runnerStartError) {
      runnerStartError = `Local quality runner exited with code ${code ?? "unknown"}${signal ? ` (${signal})` : ""}.`;
    }
    if (runnerProcess === child) runnerProcess = null;
    clearRunnerPid();
  });

  await new Promise((resolve) => setTimeout(resolve, 1200));
  const current = runnerStatus();
  if (current.status !== "running") {
    return { ok: false, ...current, error: runnerStartError || "Local quality runner stopped during startup." };
  }

  return { ok: true, alreadyRunning: false, ...current };
}

async function stopRunner() {
  const current = runnerStatus();
  if (current.status !== "running") return { ok: true, alreadyStopped: true, ...current };

  const pid = current.pid;
  if (runnerProcess?.pid === pid) terminateProcess(runnerProcess);
  else terminatePid(pid);

  runnerProcess = null;
  clearRunnerPid();
  return { ok: true, stopped: true, pid, ...runnerStatus() };
}

async function startSite() {
  if (gitSync.status === "blocked" || gitSync.status === "error") {
    return { ok: false, live: false, error: gitSync.message, git: gitSync };
  }

  if (await checkSite()) return { ok: true, alreadyRunning: true, live: true };
  if (siteProcess && !siteProcess.killed) return { ok: true, alreadyStarting: true, live: false };

  siteStartError = "";
  let child: ChildProcess;
  try {
    if (process.platform === "win32") {
      child = spawn("cmd.exe", ["/d", "/s", "/c", `npm run dev -- --hostname ${HOST} --port ${SITE_PORT}`], {
        cwd: PROJECT_DIR,
        detached: false,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } else {
      child = spawn("npm", ["run", "dev", "--", "--hostname", HOST, "--port", String(SITE_PORT)], {
        cwd: PROJECT_DIR,
        detached: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
    }
  } catch (error) {
    return { ok: false, live: false, error: error instanceof Error ? error.message : "Unable to start Next.js." };
  }

  siteProcess = child;
  child.stdout?.on("data", (chunk) => {
    const text = String(chunk).trim();
    if (text) console.log(`[TrialIQ][Next.js] ${text}`);
  });
  child.stderr?.on("data", (chunk) => {
    const text = String(chunk).trim();
    if (text) {
      siteStartError = text.slice(-4000);
      console.error(`[TrialIQ][Next.js] ${text}`);
    }
  });
  child.on("error", (error) => {
    siteStartError = error.message;
    console.error(`[TrialIQ][Next.js] Process error: ${error.message}`);
  });
  child.on("exit", (code, signal) => {
    if (code !== 0 && !siteStartError) siteStartError = `Next.js process exited with code ${code ?? "unknown"}${signal ? ` (${signal})` : ""}.`;
    if (siteProcess === child) siteProcess = null;
  });

  const started = await waitForSite(20000);
  if (!started) {
    const error = siteStartError || `Next.js did not become available on http://${HOST}:${SITE_PORT} within 20 seconds.`;
    terminateProcess(child);
    if (siteProcess === child) siteProcess = null;
    return { ok: false, live: false, error };
  }
  return { ok: true, alreadyRunning: false, live: true, pid: child.pid ?? null };
}

async function waitForSite(timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await checkSite()) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function stopSite() {
  if (!siteProcess || siteProcess.killed) return { ok: true, alreadyStopped: !(await checkSite()) };
  const pid = siteProcess.pid;
  terminateProcess(siteProcess);
  siteProcess = null;
  return { ok: true, pid };
}

async function status() {
  const [siteLive, git] = await Promise.all([checkSite(), getGitInfo()]);
  return {
    ok: true,
    agent: "online",
    projectDir: PROJECT_DIR,
    site: { host: `${HOST}:${SITE_PORT}`, live: siteLive, managed: Boolean(siteProcess && !siteProcess.killed) },
    runner: runnerStatus(),
    git,
    gitSync,
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});
  try {
    if (req.method === "GET" && req.url === "/health") return json(res, 200, { ok: true, agent: "online", gitSync, runner: runnerStatus() });
    if (req.method === "GET" && req.url === "/status") return json(res, 200, await status());
    if (req.method === "POST" && req.url === "/git/sync") return json(res, 200, await syncGit());
    if (req.method === "POST" && req.url === "/runner/start") {
      const result = await startRunner();
      return json(res, result.ok ? 200 : 500, result);
    }
    if (req.method === "POST" && req.url === "/runner/stop") return json(res, 200, await stopRunner());
    if (req.method === "POST" && req.url === "/site/start") {
      const result = await startSite();
      return json(res, result.ok ? 200 : 500, result);
    }
    if (req.method === "POST" && req.url === "/site/stop") return json(res, 200, await stopSite());
    if (req.method === "POST" && req.url === "/site/restart") {
      await stopSite();
      const result = await startSite();
      return json(res, result.ok ? 200 : 500, result);
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Local agent operation failed" });
  }
});

async function boot() {
  await syncGit();
  server.listen(PORT, HOST, () => {
    console.log(`[TrialIQ] Local agent listening on http://${HOST}:${PORT}`);
    console.log(`[TrialIQ] Project: ${PROJECT_DIR}`);
    console.log(`[TrialIQ] Site target: http://${HOST}:${SITE_PORT}`);
    console.log(`[TrialIQ] Git sync: ${gitSync.status} — ${gitSync.message}`);
  });
}

void boot();
