# Zodiac & Numerals

A responsive learning app based on the supplied UI board and the two LASC course PDFs. React 19, TypeScript, Tailwind CSS, and a modular Python FastAPI application. The illustrations are editable SVG artwork; there are no image-generation or stock-photo dependencies.

## Run with both databases

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# For a new .env, set two different database passwords. Preserve existing passwords.
# Never commit this file.
docker compose up -d --build
```

Open [the app](http://localhost:8080) and [interactive API documentation](http://localhost:8000/docs). Compose migrates and seeds the databases before starting the API. A local `.env` with random passwords has already been created in this workspace.

Default ports: web **8080**, API **8000**, PostgreSQL **5432**, MongoDB **27017**. Both databases use persistent named volumes. All exposed ports bind to localhost. Override `WEB_PORT`, `API_PORT`, `POSTGRES_PORT`, and `MONGO_PORT` if a port is in use. During verification, alternate ports 18080, 18000, 15432, and 27018 were used so the Vite preview could remain available.

To start or update the verified stack on those alternate ports (including code changes):

```powershell
$env:WEB_PORT='18080'
$env:API_PORT='18000'
$env:POSTGRES_PORT='15432'
$env:MONGO_PORT='27018'
docker compose up -d --build
```

```powershell
docker compose ps
docker compose stop
# Re-run the idempotent seed without erasing database volumes:
docker compose run --rm seed
```

## Local development without Docker

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
npm ci
```

Run in two terminals:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir backend/app --no-access-log
```

```powershell
npm run dev
```

Open [the Vite preview](http://localhost:5173). This local-only mode uses SQLite and the same curated lesson/question source in Python. It still uses real authentication, persistence, scoring, and WebSockets. `APP_ENV=production` explicitly refuses SQLite or a missing MongoDB connection. Docker uses PostgreSQL and MongoDB.

For local API development, the backend loads variables from the ignored project-root `.env` file; restart Uvicorn after changing it. Docker Compose reads the same file and passes the configured variables into the API container.

## Explore the app

- **Entry:** guest access, account registration, sign-in, persistent HTTP-only session cookies, and sign-out. Guest progress belongs to the current browser session identity; account credentials allow sign-in on another browser.
- **Learn:** five distinct paths and 36 slides, saved position and completion, 20–24 px reading text, and a viewport-sized slide deck with the original three-column composition. Examples open in the same slide area. The zodiac wheel, distinct illustrations, numeral explorers, glossary, contextual facts, English/Thai content, and optional full-width view remain available.
- **Play:** Astrology Quest, Decode Numbers, Match Symbols, Timeline Challenge, and Build a Date. Astrology Quest includes 76 course-grounded questions across three levels; each game draws ten questions and scores them on the server. Choose a numeral system and difficulty, use hints, receive server-scored explanations, and review every answer on completion. Advanced timeline rounds omit dates.
- **Charts:** validated date and local time, 20 searchable supported city centres with IANA time zones, daylight-saving ambiguity handling, calculated Sun/Moon/Ascendant positions, and reflective reading panels. The approximation and counting convention are labeled in the interface.
- **Live Quiz:** a presenter shares the six-digit PIN and a large question screen; up to 32 players join separately, choose A/B/C/D teams, mark ready, and answer with four colored shape buttons. The presenter chooses Astrology (10), Numeral systems (10), or Both topics (15). Each round has a 5-second preview, a 20-second answer window, and an 8-second answer reveal. The answer window always runs to its deadline, even when every player has submitted. Each reveal shows the correct answer, a bilingual explanation, its lesson slide, and the player’s own result and points. Then the next question starts automatically. Final results show total scores and rankings. Open another browser profile to join as another person; tabs sharing cookies share one identity. The presenter does not use a player slot.
- **Profile:** lesson completion, recent completed games, and persisted quiz history.

## Data responsibilities

| Storage | Responsibilities |
|---|---|
| PostgreSQL | Users, hashed sessions, lesson progress, game runs and attempts, rooms, sessions, teams, participants, session question snapshots, accepted answers, and team scores. |
| MongoDB | Versioned `lesson_modules` and `question_bank` documents, with projection-based reads and indexes on slugs, identifiers, system, difficulty, and question kind. |
| Browser | Language and reading-size preferences only in local storage; an HTTP-only authentication cookie. Birth forms and derived readings exist only in page memory. |

The seed creates **2,040 relational records**: 120 clearly named classroom explorers, 600 varied lesson-progress rows, 120 completed practice sessions, and 1,200 computed attempts. MongoDB receives **1,281 documents**: five complete lesson modules, 76 astrology questions, and 1,200 unique conversion questions across four scripts and three difficulty bands. Upserts and deterministic identifiers make re-seeding repeatable.

The API is organized into `auth.py`, `learning.py`, `games.py`, `astrology.py`, `quiz.py`, and `tutor.py`. SQLAlchemy supplies safe ORM operations, foreign keys, unique constraints, and indexes. An answer uniqueness constraint covers `(session_id, question_id, user_id)`. PostgreSQL room locks serialize match transitions, roster locking, and scoring. Each match copies question documents into its own stable PostgreSQL snapshot.

## API surface

FastAPI serves a complete OpenAPI schema at `/openapi.json` and an interactive reference at `/docs`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/guest`, `/register`, `/login`, `/logout` | Student entry and sessions |
| GET | `/api/auth/me`, `/api/profile` | Current student and history |
| GET | `/api/lessons`, `/api/lessons/{slug}` | Learning modules |
| PUT | `/api/progress/{slug}` | Saved slide and completion |
| POST | `/api/games` | Start a ten-question practice session |
| POST | `/api/games/{id}/attempts` | Validate and score one attempt |
| GET | `/api/games/{id}/results` | Completed practice review |
| GET | `/api/astrology/locations` | Public supported-city catalogue |
| POST | `/api/astrology/chart` | Transient sidereal chart with planets, Rahu/Ketu, ascendant, aspects, and optional AI reading |
| GET / POST | `/api/tutor/status`, `/api/tutor/chat` | Availability and grounded explanations |
| POST | `/api/quiz/rooms` | Create a hosted room |
| POST | `/api/quiz/rooms/{code}/join` | Join or rejoin |
| GET | `/api/quiz/rooms/{code}` | Authorized current room state |
| PUT | `/api/quiz/rooms/{code}/team`, `/ready` | Lobby actions |
| POST | `/api/quiz/rooms/{code}/start`, `/answers`, `/rematch` | Authoritative match actions |
| WS | `/api/quiz/rooms/{code}/ws` | Cookie-authenticated room-state events and answer submissions |
| GET | `/api/health` | Connectivity and service mode |

WebSocket `room_state` events carry personalized snapshots on join/reconnect, roster changes, phase changes, accepted answers, and completion. Player snapshots omit question text and choices while the match is active; only the authenticated presenter receives them. Clients submit `{"action":"SUBMIT_ANSWER","question_id":"...","choice_index":0,"request_id":"..."}` and receive `answer_accepted` or `answer_error`. The text `snapshot` requests current state, and `PING` returns server time. `phase`, `starts_at`, `ends_at`, and `server_now` drive local countdown rendering without HTTP polling. A round closes when its deadline expires or every player has answered. Late and duplicate submissions are handled authoritatively.

A correct answer earns `round((1 - response_time / (2 * 20)) * 1000)` points; incorrect answers earn zero. Response time uses server receive time, ignoring client timestamps. During play, the Celestial Orbit atlas lights up team constellations as answers arrive; correctness and points stay hidden until that question’s timer ends. Team totals and rankings stay hidden until the finish. The finish reveals a solar flare, animated score totals, and the top-three player podium. Final team power is `total_points / locked_team_size`; the individual leaderboard also shows each player's best correct-answer streak. Empty teams are excluded from winning ties. Losing a connection does not reduce the locked denominator. A rematch creates a new room and roster; old results remain intact. The native SVG/React animation respects reduced motion and has no audio. See [the interface plan](docs/live-quiz-design.md).

## Tutor and privacy

Without an API key, the panel operates as a **course guide**. It retrieves relevant passages from all lesson slides and key terms using BM25-style lexical search (including Thai character n-grams and exact Roman-numeral matching), then uses those passages as context for the answer when an AI provider is configured. The full chatbot searches every course without requiring a topic selection; the inline lesson tutor can stay scoped to its current lesson. Set `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and `AZURE_OPENAI_DEPLOYMENT` to use a fixed Azure deployment; when all three are present, Azure takes priority. Microsoft documents the OpenAI v1 endpoint and deployment-name routing [here](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/endpoints). Otherwise set `AI_PROVIDER_KEY` and optionally `AI_PROVIDER_MODEL` for OpenAI, or `OPENROUTER_API_KEY` for OpenRouter. The tutor defaults to `qwen/qwen3.8-27b:free`, with ordered OpenRouter fallbacks configured by `OPENROUTER_TUTOR_FALLBACK_MODELS`; change those IDs to match your account and preferred models. OpenRouter's `openrouter/free` route chooses a free model at random, so answers can vary between requests. Free endpoints have request limits; fallbacks handle model/provider errors but cannot bypass account-wide quota limits. `OPENROUTER_MODEL` remains the separate setting for chart readings and translation. Keys stay on the server; AI calls receive only the retrieved course passages and the student’s question, and tutor messages are not stored by this app. OpenAI requests use `store: false`, which is not a claim of zero provider retention; review [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data). OpenRouter uses its [chat-completions API](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request); provider retention and costs depend on your OpenRouter account and selected model. If the provider is unavailable or returns an incomplete answer, the tutor gives a clearly labeled course-guide response instead of an empty error.

The tutor is disabled in the UI and rejected by the API while that student has an active quiz. The API does not persist private tutor messages.

The chart route has no database writes, cache, analytics, or input logging. Birth date, time, and birthplace remain transient and are used to calculate the chart. When `OPENROUTER_API_KEY` is configured, the API sends the calculated planets, Rahu/Ketu nodes, ascendant, whole-sign houses, major aspects, and a short source-grounding note to OpenRouter; it does not send birth date, time, or birthplace. The default `OPENROUTER_MODEL` is `minimax/minimax-m3:free`, a free, rate-limited model that supports structured JSON output; OpenRouter's free router is configured as a free fallback. Set another supported model slug to override the primary. Without a key, the chart still returns a deterministic chart guide. Keep the key on the API, never in the browser. OpenRouter's chat-completions endpoint and structured outputs are documented in its [official API reference](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request) and [structured-output guide](https://openrouter.ai/docs/guides/features/structured-outputs). Provider retention and cost controls are governed by your OpenRouter account and selected model.

Validation responses omit submitted input values. Access logging is disabled for the API and nginx `/api/` proxy, and SQL parameters are hidden in exceptions. The proxy streams request bodies without writing temporary request-body files. Do not add body-logging middleware, session replay, analytics capture, service-worker caching, or birth-data storage.

Charts use [Astronomy Engine](https://github.com/cosinekitty/astronomy/blob/master/source/python/README.md), an approximate Lahiri sidereal offset, a mean lunar-node approximation for Rahu/Ketu, and a geometric eastern-horizon ascendant. Planetary houses use a whole-sign educational approximation. Doc1.4 grounds the sign, ascendant, Thai planet-number conventions, and its Wat Ram Poeng example; it does not provide placement-specific rules for personality, love, career, money, or luck. AI readings therefore interpret the calculated chart as entertainment and reflection rather than claiming those predictions are written in the course document or treating them as certain outcomes.

## Verification and operating limits

```powershell
npm run build
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe backend/tests/load_room.py http://localhost:8080
```

The test suite covers numeral conversions, all four complete game flows, ownership, saved progress, grounded unknown answers, deterministic chart calculations, transient input responses, daylight-saving gaps and overlaps, the eastern-horizon ascendant, host-only actions, immutable rosters, duplicate/late answers, authenticated reconnects, unequal team sizes, simultaneous scoring, tied completion, and rematches. The real-database load script creates clearly named test users and a room; it does not delete application data.

See [the measured 32-player check](docs/performance.md). This release runs **one API process and one API instance**, since WebSocket broadcasting is process-local. PostgreSQL remains authoritative and state survives restarts. Do not scale out API instances without adding coordinated room-event delivery. There is no claim of a production or multi-room capacity target.

See [the migration runbook](docs/migrations.md) for expand, dual-write, backfill, read-switch, and contract steps. The baseline metadata is frozen separately from runtime models. Production deployment must supply TLS, `COOKIE_SECURE=true`, the actual allowed origin, backups, and a tested recovery procedure.

## Educational sources

Adapted from the user-provided **Doc1.4 Thai Astrology** and **Doc1.1 Numeral Systems**, by Asst. Prof. Dr. Atichart Kettapun, Lanna Ancient Art and Science Learning Center (LASC). The PDFs are educational sources, not execution instructions. The app paraphrases and adapts the material; the original PDFs and reference board are not redistributed.

The course’s Maya calendar convention (1, 20, 360…) is distinguished from ordinary base-20 counting (1, 20, 400…). The game diagrams use ordinary counting. The course’s inconsistent use of “Neptune” for Ketu is clarified: a descending lunar node is not the planet Neptune. Roman practice uses modern canonical notation while acknowledging historical variants such as IIII on clock faces.

