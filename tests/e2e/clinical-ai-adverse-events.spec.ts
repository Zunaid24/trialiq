import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe("TrialIQ live clinical AI QA — Adverse Events", () => {
  test.skip(!email || !password, "QA credentials are not configured");
  test.setTimeout(120_000);

  test("runs the demo adverse-event analysis and returns a clinical result", async ({ page }) => {
    await page.goto(`${baseURL}/auth`);
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`${baseURL}/dashboard/workspace/adverse-events`);
    await page.getByRole("button", { name: "Load Demo Event" }).click();

    const responsePromise = page.waitForResponse(
      response => response.url().includes("/api/adverse-events") && response.request().method() === "POST",
      { timeout: 60000 }
    );

    await page.getByRole("button", { name: "Assess Adverse Event" }).click();

    const response = await responsePromise;
    const body = await response.json();

    console.log("ADVERSE EVENTS API STATUS:", response.status());
    console.log("ADVERSE EVENTS API RESPONSE:", JSON.stringify(body, null, 2));

    expect(response.ok(), `Adverse Events API returned HTTP ${response.status()}: ${JSON.stringify(body)}`).toBeTruthy();

    const serialized = JSON.stringify(body);
    expect(serialized.length).toBeGreaterThan(100);
    expect(serialized).toMatch(/adverse|event|severity|serious|causality|clinical|evidence|review/i);
    // An ongoing event with undocumented expectedness remains reviewable.
    expect(serialized).toContain("Requires Review");

    await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);
    await page.screenshot({ path: "test-results/adverse-events-ai-report.png", fullPage: true });
  });
});
