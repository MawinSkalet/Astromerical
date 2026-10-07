# Local room verification — 7 October 2026

Environment: this Windows workstation, Docker Desktop, one FastAPI/Uvicorn worker, PostgreSQL 16, MongoDB 7, and the nginx frontend proxy. The API and web ports were 18000 and 18080. Tests used real cookie-authenticated clients and 33 authenticated WebSocket connections: one presenter and 32 players.

The intended classroom room size is up to 32 players (eight per team when evenly distributed). The API enforces that room limit; the check below tests all 32 seats.

`backend/tests/load_room.py` joined 32 distinct test students, rejected a 33rd player, locked eight students into each of the four teams, and submitted 32 answers simultaneously through WebSocket. It then retried all 32 submissions and reconnected one player's WebSocket.

| Check | Observed result |
|---|---|
| Unique accepted answers | 32 |
| Duplicate retries | 32; no additional score |
| Full room | Extra player rejected with HTTP 409 |
| Player payload | No question text or choices during active play |
| Scores before finish | Hidden for every team |
| Reconnect | Current question/phase restored; accepted selection restored if still on the same question |
| Answer/retry acknowledgement latency, median | 374.09 ms |
| Answer/retry acknowledgement latency, p95 | 663.77 ms |
| Answer/retry acknowledgement latency, maximum | 757.59 ms |
| Submit, retry, verify, reconnect phase | 3.824 seconds |

The report is written to `test-results/load-32.json` when the script runs. The measured scope is one local room and its first question, with a 20-second question window. It is not a production capacity guarantee, a multiple-room load test, or an end-to-end performance target. Separate unit/integration tests check late submissions, unequal rosters, simultaneous team completion, and tied results.

`scripts/live-quiz-browser-check.mjs` played a complete 10-question match in isolated Edge contexts (one presenter and four players). All 10 answering windows ran to their server deadline after all players had submitted. Each question then revealed its correct answer, bilingual explanation, slide number, response counts, and personalized player result for 8 seconds. The test checked 288 active player snapshots: question content stayed absent from player input payloads, reveal data appeared only in the reveal phase, and team totals stayed hidden until the finish. It also verified bidirectional language switching during a reveal, reconnecting during both answering and reveal, no final answer review, the podium, final scores against server totals, and no browser errors. Screenshots and the report are under `test-results/live-quiz/`.

The updated backend suite passes 25 tests with AI provider keys disabled and a disposable SQLite database. Coverage includes full deadlines after every player answers, correct/incorrect/unanswered personal feedback over HTTP and WebSocket, late-answer rejection, the final question’s complete reveal, rankings, and coverage of all 38 live-bank questions by bilingual lesson slides.

`scripts/celestial-visual-check.mjs` uses deterministic frontend room fixtures to inspect layouts at widths 320, 360, 390, 768, 1280, and 1440 px. It measured the comet head changing position, confirmed all mobile answer buttons fit, checked the animated score reveal, and recorded no browser errors. These visual fixtures complement the real match above; they do not measure server capacity. Images and results are under `test-results/celestial/`.

Run the check against an isolated local environment. It creates named test records and a real room, and leaves them in place for inspection. The match finishes automatically on the server even after test clients disconnect.


`scripts/lesson-curriculum-check.mjs` checks the real seeded 36-slide curriculum in English and Thai: 1440×900 at 22 px, 1280×720 at 24 px, and 390×844 at both 22 and 24 px. All 288 slide states passed viewport, illustration-fit, and browser-error checks. The test mocks progress writes only; lesson bodies come from the deployed content database. Screenshots and geometry are under `test-results/curriculum/`. This check covers the listed viewports and main lesson view, rather than every possible device size.
