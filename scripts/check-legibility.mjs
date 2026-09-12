import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseUrl = process.env.MONARCHIC_WEBSITE_SMOKE_URL ?? "http://127.0.0.1:4332";
const evidenceDir = process.env.MONARCHIC_VISUAL_EVIDENCE_DIR ?? "/tmp/monarchic-legibility";
await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
const errors = [];
const routes = ["/", "/products", "/products/hosted-mcps", "/products/mcp-orgfleet", "/products/usage-developer", "/research", "/research/explicitmem", "/company", "/security", "/privacy", "/terms"];

try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of routes) {
      assert.equal((await page.goto(baseUrl + route)).status(), 200);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("main").count(), 1);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: overflow at ${width}px`);
      for (const selector of [".site-wordmark svg", "#footer svg.monarchic-wordmark"]) {
        const mark = page.locator(selector);
        const bounds = await mark.boundingBox();
        assert(bounds && bounds.width > 100 && bounds.height > 15, `${route}: missing wordmark`);
        assert.equal(await mark.getAttribute("viewBox"), "84 183 2007 314");
      }
      if (route === "/products/mcp-orgfleet") assert.match(await page.locator("h1").innerText(), /Org Fleet/i);
      if (width === 390 || width === 1440) {
        await page.screenshot({ path: `${evidenceDir}/${width}-${route.replaceAll("/", "_")}.png`, fullPage: true });
      }
    }
    console.log(`ok ${width}px: ${routes.length} routes, wordmarks, fonts, overflow, landmarks`);
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await page.goto(baseUrl + "/products/hosted-mcps");
  const developer = page.locator('[data-plan-card="usage-developer"]');
  const individual = page.locator('[data-plan-card="usage-individual"]');
  const border = (locator) => locator.evaluate((el) => getComputedStyle(el).borderTopColor);
  const restingBorder = await border(developer);
  assert.equal(restingBorder, await border(individual));
  await developer.hover();
  await page.waitForTimeout(250);
  assert.notEqual(await border(developer), restingBorder);
  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  assert.equal(await border(developer), restingBorder);
  await developer.getByRole("link").first().focus();
  await page.waitForTimeout(250);
  assert.notEqual(await border(developer), restingBorder);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const top = page.getByRole("link", { name: "Back to top", exact: true });
  await top.waitFor({ state: "visible" });
  await top.click();
  await page.waitForFunction(() => scrollY === 0);
  assert.equal(await page.locator(":focus").getAttribute("aria-label"), "Monarchic home");
  await page.goto(baseUrl);
  const field = page.locator("[data-brain-field]");
  await page.waitForFunction(() => document.querySelector("[data-brain-field]")?.dataset.brainState === "idle");
  await field.hover();
  assert.equal(await field.getAttribute("data-brain-state"), "tracking");
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(350);
  assert.equal(await field.getAttribute("data-brain-state"), "idle");
  await field.focus();
  await page.keyboard.press("Enter");
  assert.equal(await field.getAttribute("data-brain-state"), "pulse");
  await page.waitForTimeout(800);
  const still = await page.locator("[data-brain-canvas]").evaluate((el) => el.toDataURL());
  await page.waitForTimeout(250);
  assert.equal(await page.locator("[data-brain-canvas]").evaluate((el) => el.toDataURL()), still);
  await page.close();

  const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await touch.goto(baseUrl);
  const brain = touch.locator("[data-brain-field]");
  await brain.scrollIntoViewIfNeeded();
  await touch.waitForFunction(() => document.querySelector("[data-brain-field]")?.dataset.brainState === "idle");
  await touch.waitForTimeout(250);
  const bounds = await brain.boundingBox();
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height * 0.65;
  const cdp = await touch.context().newCDPSession(touch);
  const beforeScroll = await touch.evaluate(() => scrollY);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let step = 1; step <= 6; step++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - step * 25 }] });
    assert.notEqual(await brain.getAttribute("data-brain-state"), "tracking");
    assert.notEqual(await brain.getAttribute("data-brain-state"), "pulse");
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await touch.waitForTimeout(300);
  assert(await touch.evaluate(() => scrollY) > beforeScroll, "Swipe must scroll the page");
  await brain.scrollIntoViewIfNeeded();
  await touch.waitForTimeout(300);
  await brain.tap();
  assert.equal(await brain.getAttribute("data-brain-state"), "pulse");
  await touch.close();
  assert.deepEqual(errors, []);
  console.log("ok interaction: hover/focus-only plan highlight, back-to-top, wheel, touch swipe, tap, keyboard, reduced motion");
} finally {
  await browser.close();
}
