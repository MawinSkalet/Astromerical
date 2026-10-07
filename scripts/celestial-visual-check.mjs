// Deterministic UI fixtures complement the real multi-player browser check.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
);
const base = process.argv[2] || "http://localhost:18080";
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const root = "test-results/celestial";
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const errors = [];
const geometry = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() =>
    localStorage.setItem("zodiac-language", "en"),
  );
  const response = await context.request.post(`${base}/api/auth/guest`, {
    data: { name: "Celestial visual preview" },
  });
  assert.equal(response.status(), 200);
  const user = await response.json();
  const teams = ["A", "B", "C", "D"].map((letter, index) => ({
    id: `fixture-${letter}`,
    letter,
    size: 4,
    responses: 0,
    power: 0,
    correct: 0,
    answered: 0,
    points: 0,
    players: ["Aurora", "Orion", "Luna", "Sirius"].map((name, player) => ({
      id: `${letter}-${player}`,
      name: `${name} ${letter}`,
      ready: true,
    })),
  }));
  let state = {
    code: "PREVIEW",
    status: "active",
    host: true,
    team_id: null,
    role: "presenter",
    phase: "question",
    player_count: 16,
    question_id: "fixture-1",
    choice_count: 4,
    responses: 0,
    ready: false,
    teams,
    server_now: Date.now(),
    max_players: 32,
    category: "astrology",
    session_id: "visual",
    question_number: 3,
    total: 10,
    starts_at: Date.now(),
    ends_at: Date.now() + 20000,
    question: {
      prompt:
        "Which part of the birth chart represents the sign rising on the eastern horizon?",
      prompt_th: "จุดใดในดวงชะตาหมายถึงราศีที่กำลังขึ้นทางขอบฟ้าทิศตะวันออก?",
      choices: ["The Sun", "The ascendant", "The Moon", "The zodiac wheel"],
      choices_th: ["ดวงอาทิตย์", "ลัคนา", "ดวงจันทร์", "วงจักรราศี"],
    },
  };
  await context.route("**/api/quiz/rooms/PREVIEW", (route) =>
    route.fulfill({ json: state }),
  );
  const sockets = [];
  await context.routeWebSocket("**/api/quiz/rooms/PREVIEW/ws", (socket) => {
    sockets.push(socket);
    socket.onMessage((message) => {
      if (String(message).includes("ping"))
        socket.send(JSON.stringify({ event: "pong", server_now: Date.now() }));
    });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/#/quiz/PREVIEW`);
  await page.locator(".celestial-live").waitFor();
  const update = (change) => {
    state = { ...state, ...change, server_now: Date.now() };
    for (const socket of sockets)
      socket.send(JSON.stringify({ event: "room_state", state }));
  };
  await page.screenshot({ path: `${root}/host-active.png`, fullPage: true });
  for (const selector of [
    ".lq-host-question",
    ".lq-host-question h2",
    ".lq-game-stage",
    ".lq-response-arena",
    ".lq-response-arena>p",
    ".lq-response-lane>span",
  ])
    geometry.push(
      await page
        .locator(selector)
        .first()
        .evaluate(
          (element, selector) => ({
            selector,
            box: element.getBoundingClientRect().toJSON(),
            display: getComputedStyle(element).display,
            padding: getComputedStyle(element).padding,
            minHeight: getComputedStyle(element).minHeight,
            lineHeight: getComputedStyle(element).lineHeight,
            fontSize: getComputedStyle(element).fontSize,
            height: getComputedStyle(element).height,
          }),
          selector,
        ),
    );
  update({
    responses: 6,
    teams: teams.map((team, index) => ({
      ...team,
      responses: index === 0 ? 3 : index === 1 ? 2 : index === 2 ? 1 : 0,
    })),
  });
  await page.locator(".celestial-comet").first().waitFor();
  const head = page
    .locator(".celestial-comet")
    .first()
    .locator("circle")
    .first();
  const before = await head.evaluate((element) => element.getCTM().e);
  await page.waitForTimeout(330);
  const after = await head.evaluate((element) => element.getCTM().e);
  await writeFile(`${root}/geometry.json`, JSON.stringify(geometry, null, 2));
  console.log(JSON.stringify({ cometBefore: before, cometAfter: after }));
  assert.ok(
    Math.abs(after - before) > 15,
    "The comet must visibly travel, not only create an SVG node",
  );
  await page
    .locator(".lq-response-arena")
    .screenshot({ path: `${root}/comet-flight.png` });
  await page
    .getByRole("button", { name: "Switch to Thai", exact: true })
    .click();
  await page.screenshot({
    path: `${root}/host-active-thai.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.screenshot({ path: `${root}/host-laptop.png`, fullPage: true });
  const leaderboard = ["Aurora", "Orion", "Luna", "Sirius"].map(
    (name, index) => ({
      id: index === 1 ? user.id : `rank-${index}`,
      name,
      team: teams[index].letter,
      points: 8200 - index * 700,
      correct: 9 - index,
      streak: 6 - index,
      rank: index + 1,
    }),
  );
  update({
    status: "finished",
    phase: "finished",
    question: null,
    winners: ["A"],
    teams: teams.map((team, index) => ({
      ...team,
      power: 7682.5 - index * 500,
      points: 30730 - index * 2000,
      correct: 33 - index * 2,
    })),
    leaderboard,
  });
  await page.locator(".celestial-reveal").waitFor();
  assert.equal(await page.locator(".lq-podium-streak").count(), 3);
  await page.waitForTimeout(900);
  await page
    .locator(".lq-results-hero")
    .screenshot({ path: `${root}/solar-reveal.png` });
  await page.waitForFunction(() =>
    [
      ...document.querySelectorAll(
        ".lq-team-result > strong .lq-animated-score",
      ),
    ].every(
      (element) =>
        element.firstElementChild.textContent ===
        element.lastElementChild.textContent,
    ),
  );
  await page.screenshot({
    path: `${root}/results-laptop-thai.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Switch to English", exact: true })
    .click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .locator(".lq-results-hero")
    .screenshot({ path: `${root}/results-hero.png` });
  await page.screenshot({
    path: `${root}/results-desktop.png`,
    fullPage: true,
  });
  for (const width of [320, 360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Results overflow at ${width}`,
    );
    await page.screenshot({
      path: `${root}/results-${width}.png`,
      fullPage: true,
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  update({
    status: "active",
    phase: "question",
    host: false,
    role: "player",
    team_id: teams[1].id,
    question: null,
    answered: false,
    selected_index: null,
    responses: 0,
    teams,
    question_id: "fixture-2",
    starts_at: Date.now(),
    ends_at: Date.now() + 20000,
  });
  await page.locator(".lq-answer-pad").waitFor();
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Answer overflow at ${width}`,
    );
    assert.ok(
      await page
        .locator(".lq-answer-pad")
        .evaluate(
          (element) => element.getBoundingClientRect().bottom < innerHeight,
        ),
      `Answer buttons outside the viewport at ${width}`,
    );
  }
  update({ answered: true, selected_index: 1, responses: 1 });
  await page.locator(".lq-submission-spark").waitFor();
  await page.screenshot({
    path: `${root}/submitted-mobile.png`,
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  await writeFile(`${root}/geometry.json`, JSON.stringify(geometry, null, 2));
  await writeFile(
    `${root}/visual-check.json`,
    JSON.stringify(
      {
        cometTravels: true,
        responsiveWidths: [320, 360, 390, 768, 1280, 1440],
        phoneInputsFit: true,
        svgScoreReveal: true,
        consoleErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      cometTravels: true,
      responsive: true,
      consoleErrors: errors,
    }),
  );
  await context.close();
} finally {
  await browser.close();
}
