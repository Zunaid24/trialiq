import http from "node:http";
import { execFile, spawn } from "node:child_process";
import path from "node:path";

const HOST = "127.0.0.1";
const PROXY_PORT = Number(process.env.TRIALIQ_AGENT_PORT || 45822);
const INTERNAL_PORT = Number(process.env.TRIALIQ_INTERNAL_AGENT_PORT || PROXY_PORT + 1);
const SITE_PORT = Number(process.env.TRIALIQ_SITE_PORT || 3000);
const PROJECT_DIR = path.resolve(process.env.TRIALIQ_PROJECT_DIR || process.cwd());

function runPowerShell(command: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
      { windowsHide: true },
      (error, stdout, stderr) => resolve({
        ok: !error,
        stdout: String(stdout).trim(),
        stderr: String(stderr).trim(),
      }),
    );
  });
}

async function getPortOwner(port: number) {
  if (process.platform !== "win32") return null;

  const result = await runPowerShell(
    `$c = Get-NetTCPConnection -LocalAddress '${HOST}' -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { $p = Get-CimInstance Win32_Process -Filter \"ProcessId = $($c.OwningProcess)\" -ErrorAction SilentlyContinue; [PSCustomObject]@{Pid=$c.OwningProcess;CommandLine=$p.CommandLine} | ConvertTo-Json -Compress }`,
  );

  if (!result.ok || !result.stdout) return null;

  try {
    const value = JSON.parse(result.stdout) as { Pid?: number; CommandLine?: string };
    if (!value.Pid) return null;
    return { pid: Number(value.Pid), commandLine: String(value.CommandLine || "") };
  } catch {
    return null;
  }
}

async function stopPortOwner(port: number, label: string) {
  const owner = await getPortOwner(port);
  if (!owner) return true;

  console.log(`[TrialIQ] Existing ${label} detected on port ${port} (PID ${owner.pid}). Stopping it...`);

  await new Promise<void>((resolve) => {
    execFile("taskkill", ["/PID", String(owner.pid), "/T", "/F"], { windowsHide: true }, () => resolve());
  });

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (!(await getPortOwner(port))) {
      console.log(`[TrialIQ] Port ${port} is free.`);
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.error(`[TrialIQ] Port ${port} did not become free.`);
  return false;
}

async function getSiteOwner() {
  return getPortOwner(SITE_PORT);
}

function isTrialIQSite(commandLine: string) {
  const normalizedCommand = commandLine.toLowerCase().replace(/\\/g, "/");
  const normalizedProject = PROJECT_DIR.toLowerCase().replace(/\\/g, "/");
  return normalizedCommand.includes(normalizedProject) &&
    (normalizedCommand.includes("next") || normalizedCommand.includes("npm run dev"));
}

async function waitForPortFree(timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await getSiteOwner())) return true;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

async function refreshLocalSite() {
  const owner = await getSiteOwner();

  if (owner) {
    if (!isTrialIQSite(owner.commandLine)) {
      return {
        ok: false,
        status: 409,
        error: `Port ${SITE_PORT} is already used by another application (PID ${owner.pid}). TrialIQ will not terminate unrelated applications.`,
      };
    }

    console.log(`[TrialIQ] Existing TrialIQ site detected on port ${SITE_PORT} (PID ${owner.pid}). Stopping it...`);

    await new Promise<void>((resolve) => {
      execFile("taskkill", ["/PID", String(owner.pid), "/T", "/F"], { windowsHide: true }, () => resolve());
    });

    if (!(await waitForPortFree())) {
      return {
        ok: false,
        status: 500,
        error: `Port ${SITE_PORT} did not become free after stopping TrialIQ PID ${owner.pid}.`,
      };
    }

    console.log(`[TrialIQ] Port ${SITE_PORT} is free.`);
  }

  await requestInternal("/site/stop", "POST");

  return { ok: true, status: 200 };
}

function requestInternal(pathname: string, method = "GET", body?: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: HOST,
        port: INTERNAL_PORT,
        path: pathname,
        method,
        headers: body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : undefined,
      },
      (response) => {
        let data = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => { data += chunk; });
        response.on("end", () => resolve({ status: response.statusCode || 500, body: data }));
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function proxyRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const chunks: Buffer[] = [];
  req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const headers: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined && key.toLowerCase() !== "host") headers[key] = Array.isArray(value) ? value.join(",") : value;
    }
    if (body.length) headers["content-length"] = body.length;

    const upstream = http.request(
      {
        hostname: HOST,
        port: INTERNAL_PORT,
        path: req.url,
        method: req.method,
        headers,
      },
      (response) => {
        res.writeHead(response.statusCode || 500, response.headers);
        response.pipe(res);
      },
    );
    upstream.on("error", (error) => {
      if (!res.headersSent) res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Local agent unavailable: ${error.message}` }));
    });
    if (body.length) upstream.write(body);
    upstream.end();
  });
}

async function handle(req: http.IncomingMessage, res: http.ServerResponse) {
  if ((req.method === "POST") && (req.url === "/site/start" || req.url === "/site/restart")) {
    try {
      const refresh = await refreshLocalSite();
      if (!refresh.ok) {
        res.writeHead(refresh.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, live: false, error: refresh.error }));
        return;
      }

      const result = await requestInternal("/site/start", "POST");
      res.writeHead(result.status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(result.body);
      return;
    } catch (error) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unable to refresh local site." }));
      return;
    }
  }

  proxyRequest(req, res);
}

async function startInternalAgent() {
  // 45823 is a dedicated TrialIQ port. Clean up a previous core agent before spawning a new one.
  const free = await stopPortOwner(INTERNAL_PORT, "stale internal agent");
  if (!free) {
    console.error(`[TrialIQ] Cannot start internal agent because port ${INTERNAL_PORT} is still occupied.`);
    process.exitCode = 1;
    return;
  }

  const child = spawn(
    process.platform === "win32" ? "cmd.exe" : "npm",
    process.platform === "win32"
      ? ["/d", "/s", "/c", `set TRIALIQ_AGENT_PORT=${INTERNAL_PORT}&& npm run local:agent:core`]
      : ["run", "local:agent:core"],
    {
      cwd: PROJECT_DIR,
      env: { ...process.env, TRIALIQ_AGENT_PORT: String(INTERNAL_PORT) },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

  child.stdout?.on("data", (chunk) => process.stdout.write(String(chunk)));
  child.stderr?.on("data", (chunk) => process.stderr.write(String(chunk)));
  child.on("exit", (code) => {
    console.log(`[TrialIQ] Internal agent exited with code ${code ?? "unknown"}.`);
    process.exitCode = code ?? 1;
  });
}

const server = http.createServer((req, res) => {
  void handle(req, res);
});

void startInternalAgent();
server.listen(PROXY_PORT, HOST, () => {
  console.log(`[TrialIQ] Local agent proxy listening on http://${HOST}:${PROXY_PORT}`);
  console.log(`[TrialIQ] Internal agent: http://${HOST}:${INTERNAL_PORT}`);
  console.log(`[TrialIQ] Site target: http://${HOST}:${SITE_PORT}`);
  console.log(`[TrialIQ] Every Start Local Site request will refresh the TrialIQ Next.js process.`);
});
