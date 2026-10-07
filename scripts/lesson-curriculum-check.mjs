// Check the real seeded lesson content, with disposable progress writes mocked.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
);
const base = process.argv[2] || "http://localhost:18080";
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const root = "test-results/curriculum";
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const results = [],
  errors = [];
try {
  for (const [width, height, size] of [
    [1440, 900, 22],
    [1280, 720, 24],
    [390, 844, 22],
    [390, 844, 24],
  ]) {
    for (const lang of ["en", "th"]) {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: "reduce",
      });
      await context.addInitScript(
        ({ lang, size }) => {
          localStorage.setItem("zodiac-language", lang);
          localStorage.setItem("zodiac-reading-size", String(size));
        },
        { lang, size },
      );
      const response = await context.request.post(`${base}/api/auth/guest`, {
        data: { name: `Lesson check ${width} ${lang}` },
      });
      assert.equal(response.status(), 200);
      await context.route("**/api/progress/*", (route) =>
        route.fulfill({ json: { ok: true } }),
      );
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(e.message));
      for (const [slug, count] of [
        ["thai-astrology", 12],
        ["thai-numerals", 6],
        ["mayan", 6],
        ["babylonian", 6],
        ["roman", 6],
      ]) {
        await page.goto(`${base}/#/learn/${slug}`);
        await page.locator(".lesson-slide .lesson-description p").waitFor();
        for (let index = 0; index < count; index++) {
          await page.waitForFunction(
            (n) =>
              Number(
                document.querySelector(".lesson-pagination strong")
                  ?.textContent,
              ) === n,
            index + 1,
          );
          const geometry = await page.evaluate(() => {
            const selectors = [
              ".lesson-description",
              ".slide-visual",
              ".lesson-stage",
              ".lesson-controls",
            ];
            return {
              pageOverflow:
                document.documentElement.scrollHeight > innerHeight + 2 ||
                document.documentElement.scrollWidth > innerWidth + 2,
              boxes: selectors.map((selector) => {
                const e = document.querySelector(selector),
                  r = e.getBoundingClientRect();
                return {
                  selector,
                  top: r.top,
                  bottom: r.bottom,
                  left: r.left,
                  right: r.right,
                  height: r.height,
                  scroll: e.scrollHeight,
                  client: e.clientHeight,
                };
              }),
            };
          });
          const problems = [];
          if (geometry.pageOverflow) problems.push("page overflow");
          for (const box of geometry.boxes)
            if (
              box.bottom > height + 2 ||
              box.left < -1 ||
              box.right > width + 1 ||
              box.height < 12
            )
              problems.push(`${box.selector} outside viewport`);
          const visual = geometry.boxes[1],
            stage = geometry.boxes[2];
          if (
            stage.top < visual.top - 2 ||
            stage.bottom > visual.bottom + 2 ||
            stage.scroll > stage.client + 3
          )
            problems.push("illustration clipped");
          const record = {
            slug,
            slide: index + 1,
            lang,
            width,
            height,
            size,
            problems,
            ...geometry,
          };
          results.push(record);
          if (
            problems.length ||
            (slug === "thai-astrology" && index === 2) ||
            (slug === "roman" && index === 5) ||
            (slug === "mayan" && index === 2)
          )
            await page.screenshot({
              path: `${root}/${slug}-${index + 1}-${lang}-${width}.png`,
            });
          if (index < count - 1)
            await page.locator(".lesson-controls button").last().click();
        }
      }
      console.log(`${width}×${height} ${lang} (${size}px): 36 slides checked`);
      await context.close();
    }
  }
  await writeFile(
    `${root}/geometry.json`,
    JSON.stringify({ results, errors }, null, 2),
  );
  const failures = results.filter((r) => r.problems.length);
  console.log(
    JSON.stringify(
      {
        slides: results.length,
        failures: failures.map(({ slug, slide, lang, width, problems }) => ({
          slug,
          slide,
          lang,
          width,
          problems,
        })),
        errors,
      },
      null,
      2,
    ),
  );
  assert.deepEqual(errors, []);
  assert.equal(
    failures.length,
    0,
    "Some slide content is clipped; see geometry.json",
  );
} finally {
  await browser.close();
}
