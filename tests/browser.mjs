import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import axeCore from "axe-core";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const isRemote = !baseUrl.startsWith("http://127.0.0.1") && !baseUrl.startsWith("http://localhost");
const navigationWaitUntil = isRemote ? "domcontentloaded" : "networkidle";
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const runtimeErrors = [];
page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
});

async function waitForApp() {
  await page.getByTestId("command-center").waitFor({ state: "visible", timeout: isRemote ? 20000 : 5000 });
}

async function assertNoHorizontalOverflow(label) {
  const values = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(values.scrollWidth <= values.clientWidth + 1, `${label} has horizontal overflow: ${values.scrollWidth} > ${values.clientWidth}`);
}

async function assertMonochromeDesign() {
  const palette = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const tokens = [
      "--ink",
      "--ink-2",
      "--muted",
      "--line-strong",
      "--line",
      "--surface-2",
      "--surface",
      "--paper",
      "--canvas",
      "--brand",
      "--success",
      "--warning",
      "--danger",
    ].map((token) => root.getPropertyValue(token).trim());
    const selectors = [
      ".app-sidebar .nav-item[data-active]",
      ".ui-button--primary",
      '.ui-status-badge[data-tone="danger"]',
      '.ui-status-badge[data-tone="warning"]',
      '.ui-status-badge[data-tone="success"]',
    ];
    const rendered = selectors
      .map((selector) => document.querySelector(selector))
      .filter(Boolean)
      .map((element) => {
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          color: style.color,
          border: style.borderTopColor,
          borderStyle: style.borderTopStyle,
        };
      });
    return { tokens, rendered };
  });
  const isGrayHex = (value) => {
    const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
    if (short) return short[1] === short[2] && short[2] === short[3];
    const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
    return Boolean(match && match[1] === match[2] && match[2] === match[3]);
  };
  const isRenderedGray = (value) => {
    const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
    return channels.length === 3 && Math.max(...channels) - Math.min(...channels) <= 1;
  };
  assert.ok(palette.tokens.every(isGrayHex), `Design tokens must be grayscale: ${JSON.stringify(palette.tokens)}`);
  assert.ok(
    palette.rendered.every((style) => [style.background, style.color, style.border].every(isRenderedGray)),
    `Rendered interface colors must be grayscale: ${JSON.stringify(palette.rendered)}`,
  );
  assert.ok(
    new Set(palette.rendered.map((style) => `${style.background}|${style.color}|${style.border}|${style.borderStyle}`)).size >= 3,
    `Statuses must remain distinguishable without color: ${JSON.stringify(palette.rendered)}`,
  );
}

async function assertCustomTypeface() {
  const typography = await page.evaluate(async () => {
    await document.fonts.ready;
    const family = getComputedStyle(document.body).fontFamily;
    const faces = Array.from(document.fonts).map((face) => ({
      family: face.family,
      status: face.status,
      style: face.style,
      weight: face.weight,
    }));
    return { family, faces, status: document.fonts.status };
  });
  assert.equal(typography.status, "loaded", `Typeface loading did not finish: ${JSON.stringify(typography)}`);
  assert.ok(
    typography.faces.some((face) => /avant|forge/i.test(face.family) && face.status === "loaded"),
    `The supplied Avant Garde family must be loaded: ${JSON.stringify(typography)}`,
  );
  assert.ok(
    /avant|forge/i.test(typography.family),
    `The supplied Avant Garde family must be the primary application typeface: ${typography.family}`,
  );
}

async function runAxe(label) {
  await page.addScriptTag({ content: axeCore.source });
  const report = await page.evaluate(async () => window.axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
  }));
  const serious = report.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
  assert.deepEqual(
    serious.map((violation) => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.length, help: violation.help })),
    [],
    `${label} accessibility violations`,
  );
  return report.violations.length;
}

async function dismissToasts() {
  const dismissButtons = page.locator(".ui-toast .ui-icon-button");
  while (await dismissButtons.count()) {
    await dismissButtons.first().click();
  }
}

try {
  await page.goto(baseUrl, { waitUntil: navigationWaitUntil });
  await waitForApp();
  assert.equal(await page.locator("h1").count(), 1, "Desktop should expose one page heading");
  assert.equal(await page.locator(".app-sidebar .nav-item").count(), 8, "Supervisor should see eight role-relevant modules");
  await assertNoHorizontalOverflow("desktop command center");
  await assertMonochromeDesign();
  await assertCustomTypeface();
  await page.screenshot({ path: "artifacts/forgeos-command-desktop.png", fullPage: true });

  const notificationTrigger = page.getByRole("button", { name: "Open notifications, 3 unread" });
  await notificationTrigger.click();
  const notificationPanel = page.getByRole("dialog", { name: "Notifications" });
  await notificationPanel.waitFor({ state: "visible" });
  const closeNotifications = page.getByRole("button", { name: "Close notifications" });
  assert.equal(await closeNotifications.evaluate((element) => document.activeElement === element), true, "Notification panel should move focus to its first action");
  await closeNotifications.click();
  await notificationPanel.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Open notifications, 3 unread");
  assert.equal(await notificationTrigger.evaluate((element) => document.activeElement === element), true, "Notification trigger should regain focus after explicit dismissal");
  await notificationTrigger.click();
  await notificationPanel.waitFor({ state: "visible" });
  await page.locator(".page-identity h1").click();
  await notificationPanel.waitFor({ state: "hidden" });

  const firstWork = page.locator(".live-work-panel .table-link").first();
  await firstWork.click();
  await page.locator(".ui-drawer[open]").waitFor({ state: "visible" });
  assert.equal(await page.locator(".ui-drawer[open] .work-detail").count(), 1, "Work detail drawer should open from the command table");
  await page.getByRole("button", { name: "Close drawer" }).click();

  await page.locator(".live-work-panel").getByRole("button", { name: "Create work item" }).click();
  const createDialog = page.getByRole("dialog", { name: "Create work item" });
  await createDialog.getByRole("button", { name: "Create work item" }).click();
  assert.equal(await createDialog.getByLabel("Work to complete").evaluate((element) => document.activeElement === element), true, "Invalid work form should focus the first field that needs attention");
  await createDialog.getByLabel("Work to complete").fill("Inspect first article bracket B-214");
  await createDialog.getByLabel("Accountable owner").selectOption("Arjun Kulkarni");
  await createDialog.getByLabel("Station, machine, or area").fill("Inspection Bay 1");
  await createDialog.getByLabel("Project").selectOption("CIWS-26");
  await createDialog.getByRole("button", { name: "Create work item" }).click();
  await page.locator(".ui-drawer[open]").waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Accept work" }).click();
  await page.getByText("In progress", { exact: true }).first().waitFor();
  await page.screenshot({ path: "artifacts/forgeos-work-detail.png", fullPage: false });
  await page.getByRole("button", { name: "Close drawer" }).click();

  await page.locator(".app-sidebar .nav-item").filter({ hasText: "Work" }).first().click();
  await page.getByTestId("work-view").waitFor({ state: "visible" });
  assert.equal(await page.locator(".work-register-table tbody tr", { hasText: "Inspect first article bracket B-214" }).count(), 1, "Created work should persist in the register");
  await page.getByLabel("Board").click();
  await page.getByRole("region", { name: "Work by state" }).waitFor();
  await assertNoHorizontalOverflow("desktop work board");
  await dismissToasts();
  await page.screenshot({ path: "artifacts/forgeos-work-board.png", fullPage: false });

  await page.keyboard.press("Control+K");
  const searchDialog = page.getByRole("dialog", { name: "Search ForgeOS" });
  await searchDialog.getByLabel("Search all operations").fill("S010067");
  assert.ok(await searchDialog.locator(".search-results li").count() > 0, "Global search should find a project");
  await page.keyboard.press("Escape");

  const roleSwitcher = page.locator('select[aria-label="View the application as"]');
  await roleSwitcher.selectOption("Operator");
  assert.equal(await page.locator(".app-sidebar .nav-item", { hasText: "Projects" }).count(), 0, "Operator navigation should hide Projects");
  await roleSwitcher.selectOption("Admin");
  await page.locator(".app-sidebar .nav-item").filter({ hasText: "Quality" }).first().click();
  await page.getByRole("heading", { name: "Quality", level: 2 }).waitFor();
  await dismissToasts();
  await page.screenshot({ path: "artifacts/forgeos-quality-desktop.png", fullPage: false });
  const desktopAxeViolations = await runAxe("desktop quality");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl, { waitUntil: navigationWaitUntil });
  await waitForApp();
  await assertNoHorizontalOverflow("mobile command center");
  assert.equal(await page.locator(".mobile-bottom-nav").evaluate((element) => getComputedStyle(element).display), "flex");
  await page.screenshot({ path: "artifacts/forgeos-command-mobile.png", fullPage: false });
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("dialog", { name: "ForgeOS navigation" }).waitFor();
  await page.getByRole("button", { name: "Close drawer" }).click();
  await page.locator(".mobile-bottom-nav").getByRole("button", { name: "Work", exact: true }).click();
  await page.getByTestId("work-view").waitFor();
  await assertNoHorizontalOverflow("mobile work register");
  await page.context().setOffline(true);
  await page.getByText("You are offline.", { exact: true }).waitFor();
  await page.context().setOffline(false);
  await page.getByText("Back online", { exact: true }).waitFor();
  await dismissToasts();
  await page.screenshot({ path: "artifacts/forgeos-work-mobile.png", fullPage: false });
  const mobileAxeViolations = await runAxe("mobile work");

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(baseUrl, { waitUntil: navigationWaitUntil });
  await waitForApp();
  await assertNoHorizontalOverflow("tablet command center");
  await page.screenshot({ path: "artifacts/forgeos-command-tablet.png", fullPage: false });

  assert.deepEqual(runtimeErrors, [], `Runtime errors found: ${runtimeErrors.join(" | ")}`);
  console.log(JSON.stringify({
    desktop: "passed",
    mobile: "passed",
    tablet: "passed",
    monochromeDesign: "passed",
    customTypeface: "passed",
    workCreation: "passed",
    roleAccess: "passed",
    globalSearch: "passed",
    offlineQueue: "passed",
    accessibility: { desktopViolations: desktopAxeViolations, mobileViolations: mobileAxeViolations },
    runtimeErrors: runtimeErrors.length,
  }, null, 2));
} finally {
  await browser.close();
}
