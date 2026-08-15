import http from "node:http";
import { execFile, spawn, type ChildProcess } from "node:child_process";

const HOST = "127.0.0.1";
const PORT = Number(process.env.TRIALIQ_AGENT_PORT || 45822);
const SITE_PORT = Number(process.env.TRIALIQ_SITE_PORT || 3000);
const PROJECT_DIR = process.env.TRIALIQ_PROJECT_DIR || process.cwd();

let siteProcess: ChildProcess | null = null;

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

function checkSite(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${SITE_PORT}`, (response) => {
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

function gitStatus(): Promise<{ branch: string; commit: string }> {
  return new Promise((resolve) => {
    execFile("git", ["branch", "--show-current"], { cwd: PROJECT_DIR }, (branchError, branch) => {
      if (branchError) return resolve({ branch: "unknown", commit: "unknown" });
      execFile("git", ["rev-parse", "--short", "HEAD"], { cwd: PROJECT_DIR }, (commitError, commit) => {
        resolve({ branch: branch.trim(), commit: commitError ? "unknown" : commit.trim() });
      });
    });
  });
}

async function startSite() {
  if (await checkSite()) return { ok: true, alreadyRunning: true };

  if (siteProcess && !siteProcess.killed) return { ok: true, alreadyStarting: true };

  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  siteProcess = spawn(command, ["run", "dev", "--", "--hostname", HOST, "--port", String(SITE_PORT)], {
    cwd: PROJECT_DIR,
    detached: false,
    windowsHide: true,
    stdio: "ignore",
  });

  siteProcess.on("exit", () => {
    siteProcess = null;
  });

  const started = await waitForSite(15000);
  if (!started) {
    try { siteProcess?.kill(); } catch { /* process may already have exited */ }
    siteProcess = null;
    return { ok: false, error: "Next.js did not become available on localhost:3000 within 15 seconds." };
  }

  return { ok: true, alreadyRunning: false };
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
  if (!siteProcess || siteProcess.killed) {
    return { ok: true, alreadyStopped: !(await checkSite()) };
  }

  const pid = siteProcess.pid;
  if (process.platform === "win32" && pid) {
    execFile("taskkill", ["/PID", String(pid), "/T", "/F"], () => undefined);
  } else {
    siteProcess.kill("SIGTERM");
  }
  siteProcess = null;
  return { ok: true, pid };
}

async function status() {
  const [siteLive, git] = await Promise.all([checkSite(), gitStatus()]);
  return {
    ok: true,
    agent: "online",
    projectDir: PROJECT_DIR,
    site: { host: `127.0.0.1:${SITE_PORT}`, live: siteLive, managed: Boolean(siteProcess && !siteProcess.killed) },
    runner: { managed: false, status: "not-managed-yet" },
    git,
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});

  try {
    if (req.method === "GET" && req.url === "/health") return json(res, 200, { ok: true, agent: "online" });
    if (req.method === "GET" && req.url === "/status") return json(res, 200, await status());
    if (req.method === "POST" && req.url === "/site/start") return json(res, 200, await startSite());
    if (req.method === "POST" && req.url === "/site/stop") return json(res, 200, await stopSite());
    if (req.method === "POST" && req.url === "/site/restart") {
      await stopSite();
      return json(res, 200, await startSite());
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) {
    return json(res, 500, { error: error instanceof Error ? error.message : "Local agent operation failed" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[TrialIQ] Local agent listening on http://${HOST}:${PORT}`);
  console.log(`[TrialIQ] Project: ${PROJECT_DIR}`);
  console.log(`[TrialIQ] Site target: http://${HOST}:${SITE_PORT}`);
});
