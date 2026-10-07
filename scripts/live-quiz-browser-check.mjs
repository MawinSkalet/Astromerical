// Real local-browser check, using isolated guest sessions and no AI calls.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const base = process.argv[2] || "http://localhost:18080";
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const errors = [];
const playerFrames = [];
const root = "test-results/live-quiz";
await mkdir(root, { recursive: true });
const contexts = [];
async function person(name, viewport, reducedMotion = "reduce") {
  const context = await browser.newContext({ viewport, reducedMotion });
  contexts.push(context);
  await context.addInitScript(() =>
    localStorage.setItem("zodiac-language", "en"),
  );
  const response = await context.request.post(`${base}/api/auth/guest`, {
    data: { name },
  });
  assert.equal(response.status(), 200);
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/#/quiz`);
  await page.locator(".lq-entry-form").waitFor();
  return { context, page };
}
try {
  const host = await person(
    "Quiz preview host",
    { width: 1440, height: 1000 },
    "no-preference",
  );
  const a = await person("Aurora", { width: 390, height: 844 });
  const z = await person("Orion", { width: 1280, height: 900 });
  const c = await person("Luna", { width: 360, height: 800 });
  const d = await person("Sirius", { width: 412, height: 915 });
  const players = [a, z, c, d];
  await host.page.screenshot({
    path: `${root}/entry-desktop.png`,
    fullPage: true,
  });
  await host.page
    .getByRole("button", { name: "Host a game", exact: true })
    .click();
  await host.page.locator(".lq-categories").waitFor();
  const pin = (await host.page.locator(".lq-code b").innerText()).replace(
    /\s/g,
    "",
  );
  for (const player of players) {
    player.page.on("websocket", (ws) =>
      ws.on("framereceived", ({ payload }) => {
        try {
          const message = JSON.parse(String(payload));
          if (
            message.event === "room_state" &&
            message.state.status === "active"
          )
            playerFrames.push(message.state);
        } catch {}
      }),
    );
    await player.page.locator("#lq-pin").fill(pin);
    await player.page
      .getByRole("button", { name: "Join game", exact: true })
      .click();
    await player.page.locator(".lq-player-ready").waitFor();
    await player.page
      .getByRole("button", { name: "I’m ready", exact: true })
      .click();
    await player.page.locator(".lq-ready-confirm").waitFor();
  }
  await host.page.locator(".lq-categories button").first().click();
  assert.match(
    await host.page.locator(".lq-categories button.selected").innerText(),
    /Astrology/,
  );
  await host.page
    .getByRole("button", { name: "Switch to Thai", exact: true })
    .click();
  assert.match(
    await host.page.locator(".lq-categories button.selected").innerText(),
    /โหราศาสตร์/,
  );
  await host.page
    .getByRole("button", { name: "Switch to English", exact: true })
    .click();
  assert.match(
    await host.page.locator(".lq-categories button.selected").innerText(),
    /Astrology/,
  );
  await host.page.screenshot({
    path: `${root}/lobby-desktop.png`,
    fullPage: true,
  });
  assert.equal(
    await host.page.locator(".celestial-member-stars circle").count(),
    4,
  );
  assert.equal(await host.page.locator(".tug-stage").count(), 0);
  await a.page.screenshot({ path: `${root}/lobby-mobile.png`, fullPage: true });
  await host.page
    .getByRole("button", { name: "Start game", exact: true })
    .click();
  await a.page.locator(".lq-phase-preview").waitFor();
  assert.equal(
    await a.page.locator(".lq-answer-pad button:disabled").count(),
    4,
  );
  await host.page.screenshot({
    path: `${root}/preview-desktop.png`,
    fullPage: true,
  });
  for (let round = 1; round <= 10; round++) {
    await Promise.all(
      players.map((player) =>
        player.page.waitForFunction(
          () =>
            document.querySelector(
              ".lq-phase-question .lq-answer-pad button:not(:disabled)",
            ),
          null,
          { timeout: 30000 },
        ),
      ),
    );
    if (round === 1) {
      await host.page.locator(".lq-answer-board").waitFor();
      await host.page.screenshot({
        path: `${root}/question-desktop.png`,
        fullPage: true,
      });
      await a.page.screenshot({
        path: `${root}/answer-mobile.png`,
        fullPage: true,
      });
      assert.ok(
        await a.page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Mobile horizontal overflow",
      );
      assert.ok(
        await a.page
          .locator(".lq-answer-pad")
          .evaluate(
            (element) => element.getBoundingClientRect().bottom < innerHeight,
          ),
        "Answer buttons below mobile viewport",
      );
      const safe = await a.context.request.get(`${base}/api/quiz/rooms/${pin}`);
      assert.equal((await safe.json()).question, null);
    }
    await a.page.locator(".lq-answer-pad button").first().click();
    await a.page
      .getByRole("heading", { name: "Answer received!", exact: true })
      .waitFor();
    if (round === 1) {
      await host.page.locator(".celestial-comet").first().waitFor();
      await host.page.waitForTimeout(300);
      await host.page
        .locator(".lq-response-arena")
        .screenshot({ path: `${root}/answer-comet-desktop.png` });
      await a.page.reload();
      await a.page
        .getByRole("heading", { name: "Answer received!", exact: true })
        .waitFor();
      assert.equal(
        await a.page.locator(".lq-answer-pad button.is-selected").count(),
        1,
      );
      assert.equal(await a.page.locator(".lq-submission-spark").count(), 1);
      assert.equal(
        await a.page
          .locator(".lq-submission-spark svg")
          .evaluate(
            (element) =>
              getComputedStyle(element.querySelector(".lq-spark-star"))
                .animationName,
          ),
        "none",
      );
      await a.page.screenshot({
        path: `${root}/submitted-mobile.png`,
        fullPage: true,
      });
    }
    await z.page.locator(".lq-answer-pad button").nth(1).click();
    await c.page.locator(".lq-answer-pad button").nth(2).click();
    await d.page.locator(".lq-answer-pad button").nth(3).click();
    const waiting = await (
      await host.context.request.get(`${base}/api/quiz/rooms/${pin}`)
    ).json();
    assert.equal(
      waiting.phase,
      "question",
      "All answers must not close the timer early",
    );
    assert.equal(waiting.responses, 4);
    assert.equal(waiting.reveal, undefined);
    await host.page
      .locator(".lq-phase-reveal .lq-answer-reveal")
      .waitFor({ timeout: 30000 });
    await Promise.all(
      players.map((p) => p.page.locator(".lq-personal-feedback").waitFor()),
    );
    const revealed = await (
      await host.context.request.get(`${base}/api/quiz/rooms/${pin}`)
    ).json();
    assert.equal(revealed.phase, "reveal");
    assert.ok(revealed.starts_at >= waiting.ends_at);
    assert.equal(revealed.ends_at - revealed.starts_at, 8000);
    assert.equal(
      revealed.reveal.answer_counts.reduce((a, b) => a + b, 0),
      4,
    );
    assert.ok(
      revealed.reveal.explanation &&
        revealed.reveal.explanation_th &&
        revealed.reveal.source_slide,
    );
    for (let i = 0; i < players.length; i++) {
      const own = await (
        await players[i].context.request.get(`${base}/api/quiz/rooms/${pin}`)
      ).json();
      assert.equal(own.reveal.submitted_index, i);
      assert.equal(own.reveal.correct, i === own.reveal.correct_index);
      assert.equal(own.question, null);
    }
    if (round === 1) {
      await host.page.screenshot({
        path: `${root}/reveal-desktop.png`,
        fullPage: true,
      });
      await a.page.screenshot({
        path: `${root}/reveal-mobile.png`,
        fullPage: true,
      });
      await host.page
        .getByRole("button", { name: "Switch to Thai", exact: true })
        .click();
      assert.match(
        await host.page.locator(".lq-reveal-kicker").textContent(),
        /หมดเวลา/,
      );
      await host.page.screenshot({
        path: `${root}/reveal-thai-desktop.png`,
        fullPage: true,
      });
      await host.page
        .getByRole("button", { name: "Switch to English", exact: true })
        .click();
      assert.match(
        await host.page.locator(".lq-reveal-kicker").textContent(),
        /Time’s up/,
      );
      await a.page.reload();
      await a.page.locator(".lq-personal-feedback").waitFor();
    }
    console.log(`Round ${round}: full timer and personalized reveal verified`);
  }
  await host.page.locator(".lq-results-hero").waitFor({ timeout: 10000 });
  await a.page.locator(".lq-own-result").waitFor();
  const finalState = await (
    await host.context.request.get(`${base}/api/quiz/rooms/${pin}`)
  ).json();
  assert.equal(
    await host.page.locator(".celestial-reveal .is-winner").count(),
    finalState.winners.length,
  );
  assert.equal(await host.page.locator(".lq-podium-player").count(), 3);
  await host.page.waitForFunction(() =>
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
  const displayed = await host.page
    .locator(".lq-team-result > strong .lq-animated-score > span:first-child")
    .allTextContents();
  assert.deepEqual(
    displayed,
    finalState.teams
      .filter((team) => team.size)
      .sort((a, b) => b.power - a.power)
      .map((team) =>
        team.power.toLocaleString("en-US", { maximumFractionDigits: 1 }),
      ),
  );
  await host.page
    .getByRole("button", { name: "Switch to Thai", exact: true })
    .click();
  assert.match(
    await host.page.locator(".celestial-center-title").textContent(),
    /วงโคจรแห่งความรู้/,
  );
  await host.page.screenshot({
    path: `${root}/results-thai-desktop.png`,
    fullPage: true,
  });
  await host.page
    .getByRole("button", { name: "Switch to English", exact: true })
    .click();
  assert.match(
    await host.page.locator(".celestial-center-title").textContent(),
    /Celestial Orbit/,
  );
  assert.equal(await host.page.locator(".lq-review").count(), 0);
  assert.equal(finalState.review, undefined);
  assert.equal(await host.page.locator(".lq-leaderboard>div").count(), 1);
  await host.page.screenshot({
    path: `${root}/results-desktop.png`,
    fullPage: true,
  });
  await host.page
    .locator(".lq-results-hero")
    .screenshot({ path: `${root}/results-hero.png` });
  await a.page.screenshot({
    path: `${root}/results-mobile.png`,
    fullPage: true,
  });
  assert.ok(
    await a.page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Results mobile horizontal overflow",
  );
  assert.ok(playerFrames.length > 20);
  assert.ok(
    playerFrames.every(
      (state) =>
        state.question === null &&
        !state.review &&
        !state.leaderboard &&
        (state.phase === "reveal" ? !!state.reveal : !state.reveal) &&
        state.teams.every((team) => team.correct === 0 && team.points === 0),
    ),
  );
  assert.deepEqual(errors, []);
  const report = {
    room: pin,
    rounds: 10,
    players: 4,
    activePlayerFrames: playerFrames.length,
    questionContentHidden: true,
    teamTotalsHiddenUntilFinish: true,
    fullAnswerWindow: true,
    perQuestionReveals: 10,
    noFinalAnswerReview: true,
    cometOnSubmission: true,
    membershipStars: true,
    scoresMatchServer: true,
    podium: true,
    reducedMotion: true,
    languageRoundTrip: true,
    reconnectRestored: true,
    mobileNoHorizontalOverflow: true,
    consoleErrors: errors,
  };
  await writeFile(
    `${root}/browser-check.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await Promise.all(contexts.map((context) => context.close()));
  await browser.close();
}
