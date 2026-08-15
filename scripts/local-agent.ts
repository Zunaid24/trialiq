import http from "node:http";
import { execFile } from "node:child_process";

const HOST = "127.0.0.1";
const PORT = Number(process.env.TRIALIQ_AGENT_PORT || 45822);
const SITE_PORT = Number(process.env.TRIALIQ_SITE_PORT || 3000);

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
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
    execFile("git", ["branch", "--show-current"], { cwd: process.cwd() }, (branchError, branch) => {
      if (branchError) return resolve({ branch: "unknown", commit: "unknown" });
      execFile("git", ["rev-parse", "--short", "HEAD"], { cwd: process.cwd() }, (commitError, commit) => {
        resolve({
          branch: branchError ? "unknown" : branch.trim(),
          commit: commitError ? "unknown" : commit.trim(),
        });
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  if (req.url === "/status") {
    const [siteLive, git] = await Promise.all([checkSite(), gitStatus()]);
    return json(res, 200, {
      ok: true,
      agent: "online",
      site: { host: `127.0.0.1:${SITE_PORT}`, live: siteLive },
      runner: { managed: false, status: "not-managed-yet" },
      git,
    });
  }

  if (req.url === "/health") return json(res, 200, { ok: true, agent: "online" });

  return json(res, 404, { error: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`[TrialIQ] Local agent listening on http://${HOST}:${PORT}`);
  console.log(`[TrialIQ] Site status target: http://${HOST}:${SITE_PORT}`);
});
