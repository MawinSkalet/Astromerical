// Local browser regression check: wheel geometry and a host-paced live match.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const base = process.argv[2] || "http://localhost:5173";
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const root = "test-results/wheel-quiz-controls";
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const errors = [];
const contexts = [];
async function person(name, viewport) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
  });
  contexts.push(context);
  await context.addInitScript(() =>
    localStorage.setItem("zodiac-language", "en"),
  );
  assert.equal(
    (
      await context.request.post(`${base}/api/auth/guest`, { data: { name } })
    ).status(),
    200,
  );
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  return { context, page };
}
try {
  const host = await person("Wheel and quiz host", {
    width: 1440,
    height: 1000,
  });
  const player = await person("Quiz controls player", {
    width: 390,
    height: 844,
  });
  await host.page.goto(`${base}/#/chart`);
  await host.page.locator(".zodiac-sign").last().waitFor();
  const names = await host.page.locator(".sign-name").allTextContents();
  const centres = await host.page.locator(".sign-name").evaluateAll((labels) =>
    labels.map((label) => ({
      x: Number(label.getAttribute("x")),
      y: Number(label.getAttribute("y")) + 2,
    })),
  );
  assert.deepEqual(names, [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ]);
  for (let i = 0; i < centres.length; i++) {
    const angle =
      (Math.atan2(centres[i].y - 250, centres[i].x - 250) * 180) / Math.PI;
    const difference = ((angle - (-90 - i * 30) + 540) % 360) - 180;
    assert.ok(
      Math.abs(difference) < 0.001,
      `${names[i]} must follow the reference direction`,
    );
  }
  await host.page.locator('.birth-form input[type="date"]').fill("2001-04-15");
  await host.page.locator('.birth-form input[type="time"]').fill("14:30");
  const chartResponse = host.page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/astrology/chart") &&
      r.request().method() === "POST",
  );
  await host.page.locator('.birth-form button[type="submit"]').click();
  const chart = await (await chartResponse).json();
  assert.equal(chart.placements.length, 3);
  await host.page.locator(".wheel-placement").first().waitFor();
  await host.page.screenshot({
    path: `${root}/wheel-desktop.png`,
    fullPage: true,
  });
  // Exercise every sector, both edges, and the Pisces -> Aries wrap with the
  // real chart response shape. The astronomical calculation is not modified.
  const fixtures = names.flatMap((sign, index) =>
    [0, 15, 29.99].map((degree) => ({
      ...chart.placements[0],
      body: `${sign}-${degree}`,
      sign,
      index,
      degree,
      longitude: index * 30 + degree,
    })),
  );
  await host.page.route("**/api/astrology/chart", (route) =>
    route.fulfill({
      json: { ...chart, placements: fixtures },
    }),
  );
  await host.page.locator('.birth-form button[type="submit"]').click();
  await host.page.waitForFunction(
    () => document.querySelectorAll(".wheel-placement").length === 36,
  );
  const markers = await host.page.locator(".zodiac-wheel").evaluate((svg) => {
    const sectors = [...svg.querySelectorAll(".sign-sector")];
    return [...svg.querySelectorAll(".wheel-placement circle")].map(
      (circle, i) => {
        const x = Number(circle.getAttribute("cx")),
          y = Number(circle.getAttribute("cy"));
        return {
          longitude:
            ((Math.atan2(250 - y, x - 250) * 180) / Math.PI - 75 + 360) % 360,
          insideSign: sectors[Math.floor(i / 3)].isPointInFill(
            new DOMPoint(x, y),
          ),
        };
      },
    );
  });
  markers.forEach((marker, i) => {
    const difference =
      ((marker.longitude - fixtures[i].longitude + 540) % 360) - 180;
    assert.ok(
      Math.abs(difference) < 0.001,
      `${fixtures[i].body} must retain its longitude`,
    );
    if (fixtures[i].degree !== 0)
      assert.ok(
        marker.insideSign,
        `${fixtures[i].body} must sit inside its own sign`,
      );
  });
  await host.page.unroute("**/api/astrology/chart");
  await host.page.goto(`${base}/#/quiz`);
  await host.page
    .getByRole("button", { name: "Host a game", exact: true })
    .click();
  await host.page.locator(".lq-categories").waitFor();
  const pin = (await host.page.locator(".lq-code b").innerText()).replace(
    /\s/g,
    "",
  );
  await player.page.goto(`${base}/#/quiz`);
  await player.page.locator("#lq-pin").fill(pin);
  await player.page
    .getByRole("button", { name: "Join game", exact: true })
    .click();
  await player.page
    .getByRole("button", { name: "I’m ready", exact: true })
    .click();
  await host.page.locator(".lq-categories button").first().click();
  await host.page
    .getByRole("button", { name: "Start game", exact: true })
    .click();
  let points = 0;
  for (let round = 1; round <= 10; round++) {
    await host.page
      .getByRole("button", { name: "Start answers", exact: true })
      .click();
    await player.page.locator(".lq-phase-question").waitFor();
    assert.equal(await player.page.locator(".lq-skip-button").count(), 0);
    await player.page.locator(".lq-answer-pad button").first().click();
    await player.page.locator(".lq-answer-pad.has-submitted").waitFor();
    const active = await (
      await host.context.request.get(`${base}/api/quiz/rooms/${pin}`)
    ).json();
    assert.equal(active.phase, "question");
    if (round === 1)
      await host.page.screenshot({
        path: `${root}/skip-desktop.png`,
        fullPage: true,
      });
    await host.page.getByRole("button", { name: "Skip", exact: true }).click();
    await host.page.locator(".lq-phase-reveal").waitFor();
    await player.page.locator(".lq-personal-feedback").waitFor();
    const revealed = await (
      await player.context.request.get(`${base}/api/quiz/rooms/${pin}`)
    ).json();
    assert.equal(revealed.phase, "reveal");
    assert.equal(revealed.question_number, round);
    assert.ok(
      revealed.starts_at < active.ends_at,
      "Host must end answering before the 20s deadline",
    );
    points += revealed.reveal.points;
    if (round === 1) {
      await host.page.setViewportSize({ width: 390, height: 844 });
      assert.ok(
        await host.page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Host controls must fit mobile width",
      );
      await host.page.screenshot({
        path: `${root}/next-mobile.png`,
        fullPage: true,
      });
      await host.page
        .getByRole("button", { name: "Switch to Thai", exact: true })
        .click();
      assert.equal(
        await host.page.locator(".lq-skip-button").innerText(),
        "ข้อถัดไป",
      );
      await host.page
        .getByRole("button", { name: "Switch to English", exact: true })
        .click();
      await host.page.setViewportSize({ width: 1440, height: 1000 });
    }
    await host.page
      .getByRole("button", {
        name: round === 10 ? "Show results" : "Next question",
        exact: true,
      })
      .click();
  }
  await player.page.locator(".lq-results-hero").waitFor();
  const finished = await (
    await player.context.request.get(`${base}/api/quiz/rooms/${pin}`)
  ).json();
  assert.equal(finished.status, "finished");
  assert.equal(finished.leaderboard[0].points, points);
  assert.deepEqual(errors, []);
  const report = {
    signs: names.length,
    markerPositions: markers.length,
    skippedRounds: 10,
    points,
    browserErrors: errors,
  };
  await writeFile(`${root}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await Promise.all(contexts.map((context) => context.close()));
  await browser.close();
}
