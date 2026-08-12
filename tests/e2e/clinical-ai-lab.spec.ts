import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const email = process.env.PLAYWRIGHT_EMAIL;
const password = process.env.PLAYWRIGHT_PASSWORD;

test.describe("TrialIQ live clinical AI QA — Lab Intelligence", () => {
  test.skip(!email || !password, "QA credentials are not configured");

  test("runs the demo laboratory analysis and returns a structured clinical result", async ({ page }) => {
    await page.goto(baseURL);
    await page.getByRole("link", { name: "Sign in" }).click();
    await page.getByRole("textbox", { name: "Email" }).fill(email!);
    await page.getByRole("textbox", { name: "Password" }).fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole("link", { name: "Clinical Workspace" }).click();
    await page.getByRole("link", { name: "Lab Intelligence Identify" }).click();
    await page.getByRole("button", { name: "Load Demo" }).click();

    const responsePromise = page.waitForResponse(
      response => response.url().includes("/api/lab-intelligence") && response.request().method() === "POST",
      { timeout: 60000 }
    );

    await page.getByRole("button", { name: "Analyze Laboratory Results" }).click();
    const response = await responsePromise;
    const result = await response.json();

    console.log("LAB INTELLIGENCE API STATUS:", response.status());
    console.log("LAB INTELLIGENCE API RESPONSE:", JSON.stringify(result, null, 2));

    expect(response.ok(), `Lab Intelligence API returned HTTP ${response.status()}: ${JSON.stringify(result)}`).toBeTruthy();

    const serialized = JSON.stringify(result);
    expect(serialized.length).toBeGreaterThan(100);
    expect(serialized).toMatch(/lab|laboratory|result|finding|abnormal|clinical|evidence/i);
    // Guardrail regression: PDF extraction must not expose the broken "×10 n /L" unit.
    expect(serialized).toContain("×10⁹/L");
    expect(serialized).not.toContain("×10 n /L");

    await expect(page.locator("body")).not.toContainText(/application error|internal server error/i);
    await page.screenshot({ path: "test-results/lab-intelligence-ai-report.png", fullPage: true });

    test.info().annotations.push({
      type: "clinical-ai",
      description: "Live Lab Intelligence analysis returned clinical result/evidence content and passed unit normalization guardrails.",
    });
  });
});
