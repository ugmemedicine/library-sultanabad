import { chromium, devices } from "playwright";

const BASE_URL = "http://127.0.0.1:3000";
const EMAIL = process.env.VIEWPORT_TEST_EMAIL;
const PASSWORD = process.env.VIEWPORT_TEST_PASSWORD;
const STORAGE_STATE_PATH = "tools/.viewport-auth-state.json";

if (!EMAIL || !PASSWORD) {
  console.error("Missing VIEWPORT_TEST_EMAIL or VIEWPORT_TEST_PASSWORD");
  process.exit(1);
}

const targets = [
  { name: "iphone12", options: devices["iPhone 12"] },
  { name: "pixel5", options: devices["Pixel 5"] },
  { name: "ipad11", options: devices["iPad Pro 11"] },
  { name: "desktop", options: { viewport: { width: 1366, height: 900 }, userAgent: devices["Desktop Chrome"].userAgent } }
];

const routes = [
  "/dashboard",
  "/books",
  "/copies",
  "/circulation/issue",
  "/circulation/return",
  "/reports",
  "/reports/issued"
];

async function createAuthState() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
  if (page.url().includes("/dashboard")) {
    console.log("[auth] direct dashboard access granted.");
    await context.storageState({ path: STORAGE_STATE_PATH });
    await browser.close();
    return;
  }

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[type="email"]', { timeout: 60000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await Promise.all([
    page.waitForURL(/dashboard|login/, { timeout: 30000 }),
    page.click('button[type="submit"]')
  ]);
  await page.waitForLoadState("networkidle");
  const url = page.url();
  console.log(`[auth] post-login URL: ${url}`);
  if (!url.includes("/dashboard")) {
    await browser.close();
    throw new Error("Login did not reach dashboard; cannot create authenticated storage state.");
  }
  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}

await createAuthState();

for (const target of targets) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...target.options,
    storageState: STORAGE_STATE_PATH
  });
  const page = await context.newPage();

  for (const route of routes) {
    const safeName = route.replace(/\//g, "_").replace(/^_/, "");
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => !document.body.textContent?.includes("Loading..."), { timeout: 30000 }).catch(() => null);
    console.log(`[${target.name}] ${route} -> ${page.url()}`);
    await page.screenshot({
      path: `viewport-auth-${target.name}-${safeName}.png`,
      fullPage: true
    });
  }

  await browser.close();
}

console.log("Viewport capture completed.");
