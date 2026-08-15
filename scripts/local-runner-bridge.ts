import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";

const HOST = "127.0.0.1";
const PORT = Number(process.env.TRIALIQ_BRIDGE_PORT || 45821);
const PID_FILE = path.join(os.tmpdir(), "trialiq-test-runner.pid");

function readRunnerPid() {
  try {
    const pid = Number(fs.readFileSync(PID_FILE, "utf8").trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function isProcessAlive(pid: number | null) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function runnerStatus() {
  const pid = readRunnerPid();
  if (!isProcessAlive(pid)) {
    try { fs.unlinkSync(PID_FILE); } catch {}
    return { running: false, pid: null };
  }
  return { running: true, pid };
}

function startRunner() {
  const current = runnerStatus();
  if (current.running) return current;

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(npmCommand, ["run", "test:runner"], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: process.env,
  });

  if (!child.pid) throw new Error("Unable to start the local TrialIQ runner.");
  fs.writeFileSync(PID_FILE, String(child.pid), "utf8");
  child.unref();
  return { running: true, pid: child.pid };
}

function sendJson(res: http.ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});

  if (req.method === "GET" && req.url === "/health") {
    return sendJson(res, 200, { ok: true, service: "trialiq-local-runner-bridge", ...runnerStatus() });
  }

  if (req.method === "POST" && req.url === "/start") {
    try {
      const runner = startRunner();
      return sendJson(res, 200, { ok: true, ...runner });
    } catch (error) {
      return sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return sendJson(res, 404, { ok: false, error: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`[TrialIQ] Local runner bridge listening on http://${HOST}:${PORT}`);
  console.log(`[TrialIQ] Run Test can now start the local runner automatically.`);
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
