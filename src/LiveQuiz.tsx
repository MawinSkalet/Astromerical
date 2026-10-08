import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Gamepad2,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Monitor,
  SkipForward,
  Smartphone,
  Sparkles,
  Star,
  Timer,
  Trophy,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { api } from "./api";
import { Numeral } from "./Illustrations";
import { QuizReveal } from "./QuizReveal";
import {
  AnimatedScore,
  CelestialArena,
  CelestialPodium,
  ConstellationMark,
  SubmissionSpark,
  constellations,
} from "./CelestialArena";
import type { Language, Room, User } from "./types";
import "./live-quiz.css";
import "./celestial-quiz.css";
import "./quiz-reveal.css";

type Category = "astrology" | "numerals" | "mixed";
type Props = {
  code?: string;
  lang: Language;
  user: User;
  go: (path: string) => void;
  notify: (message: string) => void;
};
const letters = ["A", "B", "C", "D"];
const shapes = ["triangle", "diamond", "circle", "square"];

function AnswerShape({ index }: { index: number }) {
  return (
    <svg className="lq-shape" viewBox="0 0 48 48" aria-hidden="true">
      {index === 0 ? (
        <path d="M24 4 46 43H2Z" />
      ) : index === 1 ? (
        <path d="m24 1 23 23-23 23L1 24Z" />
      ) : index === 2 ? (
        <circle cx="24" cy="24" r="21" />
      ) : (
        <rect x="4" y="4" width="40" height="40" rx="3" />
      )}
    </svg>
  );
}

export function LiveQuiz({ code, lang, user, go, notify }: Props) {
  const th = lang === "th";
  const b = (en: string, thai: string) => (th ? thai : en);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState<Category>("mixed");
  const [room, setRoom] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState("connecting");
  const [reconnect, setReconnect] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const stage = useRef<HTMLElement>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionId = useRef<string | null>(null);
  const categoryName = (value?: string | null) =>
    value === "astrology"
      ? b("Astrology", "โหราศาสตร์")
      : value === "numerals"
        ? b("Numeral systems", "ระบบตัวเลข")
        : b("Both topics", "รวมสองหมวด");

  useEffect(() => {
    if (!code) {
      setRoom(null);
      setError("");
      return;
    }
    let alive = true;
    let retry: ReturnType<typeof setTimeout>;
    let attempts = 0;
    let pingAt = 0;
    const accept = (state: Room) => {
      if (!alive) return;
      setRoom(state);
      setNow(Date.now());
      setOffset(state.server_now - Date.now());
      if (state.answered || state.question_id !== questionId.current) {
        setBusy(false);
        if (pending.current) clearTimeout(pending.current);
      }
      questionId.current = state.question_id;
    };
    setRoom(null);
    setError("");
    setBusy(false);
    api<Room>(`/quiz/rooms/${code}`)
      .then(accept)
      .catch((e) => alive && setError(e.message));
    function connect() {
      if (!alive) return;
      setConnection("connecting");
      const ws = new WebSocket(
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/quiz/rooms/${code}/ws`,
      );
      socket.current = ws;
      ws.onopen = () => {
        if (alive) {
          setConnection("connected");
          setError("");
          attempts = 0;
        }
      };
      ws.onmessage = (event) => {
        if (!alive) return;
        try {
          const message = JSON.parse(event.data);
          if (message.event === "room_state") accept(message.state);
          if (
            message.event === "answer_accepted" ||
            message.event === "answer_error"
          ) {
            setBusy(false);
            if (pending.current) clearTimeout(pending.current);
            if (message.event === "answer_error") setError(message.detail);
          }
          if (message.event === "pong" && pingAt)
            setOffset(
              message.server_now + (Date.now() - pingAt) / 2 - Date.now(),
            );
        } catch {
          setError("A room update could not be read. Please reconnect.");
        }
      };
      ws.onclose = (event) => {
        if (!alive) return;
        setConnection("disconnected");
        setBusy(false);
        if (event.code !== 1008 && attempts < 6)
          retry = setTimeout(connect, Math.min(1000 * 2 ** attempts++, 10000));
      };
      ws.onerror = () => ws.close();
    }
    connect();
    const heartbeat = setInterval(() => {
      if (socket.current?.readyState === WebSocket.OPEN) {
        pingAt = Date.now();
        socket.current.send(JSON.stringify({ action: "PING" }));
      }
    }, 20000);
    return () => {
      alive = false;
      clearTimeout(retry);
      clearInterval(heartbeat);
      if (pending.current) clearTimeout(pending.current);
      socket.current?.close();
    };
  }, [code, reconnect]);

  useEffect(() => {
    if (room?.status !== "active") return;
    const clock = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(clock);
  }, [room?.status]);
  useEffect(() => {
    const changed = () =>
      setFullscreen(document.fullscreenElement === stage.current);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);

  async function enter(host: boolean, event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const next = await api<Room>(
        host ? "/quiz/rooms" : `/quiz/rooms/${code || input}/join`,
        "POST",
      );
      if (code === next.code) setReconnect((value) => value + 1);
      else go(`/quiz/${next.code}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function action(endpoint: string, method = "POST", body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const result = await api<Room | { ok: boolean }>(
        `/quiz/rooms/${code}/${endpoint}`,
        method,
        body,
      );
      if ("code" in result) {
        if (endpoint === "rematch") go(`/quiz/${result.code}`);
        else setRoom(result);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function choose(index: number) {
    if (
      !room ||
      room.host ||
      room.phase !== "question" ||
      room.answered ||
      busy ||
      seconds <= 0 ||
      socket.current?.readyState !== WebSocket.OPEN
    )
      return;
    setBusy(true);
    setError("");
    socket.current.send(
      JSON.stringify({
        action: "SUBMIT_ANSWER",
        question_id: room.question_id,
        choice_index: index,
        request_id: crypto.randomUUID(),
      }),
    );
    pending.current = setTimeout(() => {
      setBusy(false);
      setError(
        b(
          "Checking your submission. Reconnect if it does not appear.",
          "กำลังตรวจสอบคำตอบ หากยังไม่แสดงให้เชื่อมต่อใหม่",
        ),
      );
      if (socket.current?.readyState === WebSocket.OPEN)
        socket.current.send("snapshot");
    }, 8000);
  }
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (event.target as HTMLElement).matches("input,textarea,select,button")
      )
        return;
      if (/^[1-4]$/.test(event.key)) {
        event.preventDefault();
        choose(Number(event.key) - 1);
      }
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [room, busy, now, connection]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code || "");
      notify(b("Room code copied", "คัดลอกรหัสห้องแล้ว"));
    } catch {
      notify(b("Select the room code to copy it.", "เลือกรหัสห้องเพื่อคัดลอก"));
    }
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current?.requestFullscreen();
    } catch {
      notify(
        b(
          "Full screen is unavailable in this browser.",
          "เบราว์เซอร์นี้ไม่รองรับโหมดเต็มจอ",
        ),
      );
    }
  }
  const seconds = Math.max(
    0,
    Math.ceil(((room?.ends_at || 0) - now - offset) / 1000),
  );
  const mine = room?.teams.find((team) => team.id === room.team_id);
  const readyCount =
    room?.teams.reduce(
      (sum, team) => sum + team.players.filter((person) => person.ready).length,
      0,
    ) || 0;
  const canStart = !!room?.player_count && readyCount === room.player_count;
  const ownRank = room?.leaderboard?.find((person) => person.id === user.id);
  const progress =
    room?.starts_at && room.ends_at
      ? Math.max(
          0,
          Math.min(
            1,
            (room.ends_at - now - offset) / (room.ends_at - room.starts_at),
          ),
        )
      : 0;
  const errorNote = error && (
    <div className="lq-error" role="alert">
      {error}
    </div>
  );

  if (!code)
    return (
      <main className="live-quiz lq-entry" ref={stage}>
        <div className="lq-entry-story">
          <span className="lq-live-label">
            <span />
            Live Quiz
          </span>
          <h1>
            {b(
              "A universe of knowledge.\nBrighter together.",
              "จุดประกายความรู้\nให้สว่างทั้งจักรวาล",
            )}
          </h1>
          <p>
            {b(
              "Choose your constellation. Share a screen, answer together, and watch your team's stars come alive.",
              "เลือกกลุ่มดาวของทีม เปิดจอร่วมกัน แล้วใช้ทุกคำตอบเติมแสงให้กลุ่มดาวของคุณ",
            )}
          </p>
          <div className="lq-entry-arena">
            <CelestialArena
              teams={letters.map((letter) => ({ letter, power: 0 }))}
              lang={lang}
            />
          </div>
          <div className="lq-entry-facts">
            <span>
              <Users size={17} />
              {b("4 teams · up to 32 players", "4 ทีม · ผู้เล่นสูงสุด 32 คน")}
            </span>
            <span>
              <Eye size={17} />
              {b("Answers after each timer", "เฉลยทีละข้อหลังหมดเวลา")}
            </span>
          </div>
        </div>
        <section className="lq-entry-form">
          <Smartphone className="lq-entry-icon" size={32} strokeWidth={1.5} />
          <h2>{b("Your team is waiting", "ทีมของคุณกำลังรออยู่")}</h2>
          <p>
            {b(
              "Enter the 6-digit code on the shared screen.",
              "กรอกรหัส 6 หลักจากหน้าจอผู้จัดเกม",
            )}
          </p>
          <form onSubmit={(event) => enter(false, event)}>
            <label htmlFor="lq-pin">{b("Game PIN", "รหัสห้อง")}</label>
            <input
              id="lq-pin"
              className="lq-pin-input"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000 000"
              value={input}
              onChange={(event) =>
                setInput(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              pattern="[0-9]{6}"
              required
            />
            <button
              className="lq-primary"
              type="submit"
              disabled={busy || input.length !== 6}
            >
              {b("Join game", "เข้าร่วมเกม")}
              <ArrowRight size={19} />
            </button>
          </form>
          <div className="lq-entry-divider" />
          <div className="lq-host-entry">
            <Monitor size={23} />
            <div>
              <h3>{b("Leading the room?", "เป็นผู้จัดเกมใช่ไหม?")}</h3>
              <p>
                {b(
                  "Open the presenter screen and invite everyone in.",
                  "เปิดจอผู้จัดแล้วชวนทุกคนเข้าห้อง",
                )}
              </p>
            </div>
          </div>
          <button
            className="lq-secondary"
            disabled={busy}
            onClick={() => enter(true)}
          >
            {busy ? (
              <LoaderCircle size={18} className="spin" />
            ) : (
              <Monitor size={18} />
            )}
            {b("Host a game", "สร้างห้องและเป็นผู้จัด")}
          </button>
          {errorNote}
          <small className="lq-entry-foot">
            {b(
              "Astrology 10 · Numeral systems 10 · Both topics 15",
              "โหราศาสตร์ 10 ข้อ · ระบบตัวเลข 10 ข้อ · รวม 15 ข้อ",
            )}
          </small>
        </section>
      </main>
    );

  if (!room)
    return (
      <main className="live-quiz lq-loading" ref={stage}>
        {error ? (
          <>
            {errorNote}
            <button
              className="lq-primary"
              onClick={() => enter(false)}
              disabled={busy}
            >
              {b("Join this room", "เข้าร่วมห้องนี้")}
            </button>
            <button
              className="lq-secondary"
              onClick={() => setReconnect((n) => n + 1)}
            >
              {b("Reconnect", "เชื่อมต่อใหม่")}
            </button>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" size={30} />
            <p>{b("Connecting to the room…", "กำลังเชื่อมต่อห้อง…")}</p>
          </>
        )}
        <button className="lq-text" onClick={() => go("/quiz")}>
          <ArrowLeft size={16} />
          {b("Back", "กลับ")}
        </button>
      </main>
    );

  return (
    <main
      className={`live-quiz lq-room lq-${room.host ? "presenter" : "player"} lq-phase-${room.phase}`}
      ref={stage}
    >
      <header className="lq-toolbar">
        <div className="lq-room-identity">
          <span className="lq-live-label">
            <span />
            Live Quiz
          </span>
          <strong>
            {room.host ? <Monitor size={17} /> : <Smartphone size={17} />}
            {room.host
              ? b("Presenter screen", "หน้าจอผู้จัด")
              : `${b("Team", "ทีม")} ${mine?.letter || ""}`}
          </strong>
        </div>
        <button
          className="lq-code"
          onClick={copy}
          aria-label={b("Copy game PIN", "คัดลอกรหัสห้อง")}
        >
          <span>{b("Game PIN", "รหัสห้อง")}</span>
          <b>
            {code.slice(0, 3)} {code.slice(3)}
          </b>
          <Copy size={17} />
        </button>
        <div className="lq-toolbar-actions">
          <span className={`lq-connection ${connection}`} title={connection}>
            {connection === "connected" ? (
              <Wifi size={17} />
            ) : (
              <WifiOff size={17} />
            )}
            <span>
              {connection === "connected"
                ? b("Live", "เชื่อมต่อแล้ว")
                : b("Reconnecting", "กำลังเชื่อมต่อ")}
            </span>
          </span>
          {connection !== "connected" && (
            <button
              className="lq-icon-button"
              onClick={() => setReconnect((n) => n + 1)}
              aria-label={b("Reconnect", "เชื่อมต่อใหม่")}
            >
              <ArrowRight size={18} />
            </button>
          )}
          <button
            className="lq-icon-button lq-fullscreen"
            onClick={toggleFullscreen}
            aria-label={b("Toggle full screen", "เปิดหรือปิดโหมดเต็มจอ")}
          >
            {fullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
          </button>
          <button className="lq-text lq-exit" onClick={() => go("/quiz")}>
            {b("Leave", "ออกจากห้อง")}
          </button>
        </div>
      </header>
      {errorNote}

      {room.status === "lobby" ? (
        <>
          <div className="lq-lobby-heading">
            <div>
              <h1>
                {room.host
                  ? b("Gather your team.", "รวมทีมให้พร้อม")
                  : b("Find your people.", "เลือกทีมของคุณ")}
              </h1>
              <p>
                {room.host
                  ? b(
                      "Share the PIN. Players join on their own phones or computers.",
                      "แบ่งปันรหัสห้องให้ผู้เล่นเข้าร่วมผ่านมือถือหรือคอมพิวเตอร์ของตัวเอง",
                    )
                  : b(
                      "Choose a team, then mark yourself ready. Watch the shared screen for questions.",
                      "เลือกทีมแล้วกดพร้อม ดูคำถามจากหน้าจอผู้จัด และตอบบนอุปกรณ์ของคุณ",
                    )}
              </p>
            </div>
            <div className="lq-player-count">
              <Users size={22} />
              <strong>
                {room.player_count}
                <small> / {room.max_players}</small>
              </strong>
              <span>{b("players joined", "คนเข้าร่วมแล้ว")}</span>
            </div>
          </div>
          <div className="lq-lobby-layout">
            <section
              className="lq-lobby-teams"
              aria-label={b("Team roster", "รายชื่อผู้เล่นแต่ละทีม")}
            >
              <div className="lq-roster-grid">
                {room.teams.map((team) => (
                  <div
                    className={`lq-roster team-${team.letter} ${mine?.id === team.id ? "is-mine" : ""}`}
                    key={team.id}
                  >
                    <button
                      className="lq-roster-heading"
                      disabled={room.host || busy}
                      onClick={() =>
                        action("team", "PUT", { letter: team.letter })
                      }
                      aria-pressed={mine?.id === team.id}
                    >
                      <ConstellationMark letter={team.letter} />
                      <span>
                        <strong>
                          {b("Team", "ทีม")} {team.letter}
                        </strong>
                        <small>
                          {th
                            ? constellations.find(
                                (sign) => sign.letter === team.letter,
                              )?.th
                            : constellations.find(
                                (sign) => sign.letter === team.letter,
                              )?.en}{" "}
                          · {team.size} {b("players", "คน")}
                        </small>
                      </span>
                      {mine?.id === team.id && <CheckCircle2 size={19} />}
                    </button>
                    <div className="lq-roster-names">
                      {team.players.length ? (
                        team.players.map((person) => (
                          <div key={person.id}>
                            <span className="lq-avatar">{person.name[0]}</span>
                            <strong>{person.name}</strong>
                            {person.ready ? (
                              <CheckCircle2
                                size={16}
                                aria-label={b("Ready", "พร้อม")}
                              />
                            ) : (
                              <span
                                className="lq-waiting-dot"
                                title={b("Not ready", "ยังไม่พร้อม")}
                              />
                            )}
                          </div>
                        ))
                      ) : (
                        <p>{b("A place for your people", "รอเพื่อนร่วมทีม")}</p>
                      )}
                    </div>
                    {!room.host && (
                      <button
                        className="lq-team-select"
                        disabled={busy}
                        onClick={() =>
                          action("team", "PUT", { letter: team.letter })
                        }
                      >
                        {mine?.id === team.id
                          ? b("Your team", "ทีมของคุณ")
                          : b("Join team", "เลือกทีมนี้")}
                        {mine?.id === team.id ? (
                          <Check size={15} />
                        ) : (
                          <ArrowRight size={15} />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="lq-lobby-arena">
                <CelestialArena teams={room.teams} mode="lobby" lang={lang} />
                <p>
                  {b(
                    "Each player adds a star. Ready together, shine together.",
                    "ทุกคนคือดาวดวงหนึ่งของทีม พร้อมไปด้วยกัน สว่างไปด้วยกัน",
                  )}
                </p>
              </div>
            </section>
            <aside className="lq-setup">
              {room.host ? (
                <>
                  <h2>{b("Set the challenge", "เลือกความท้าทาย")}</h2>
                  <p>
                    {b(
                      "Questions come from your lesson slides.",
                      "คำถามอิงเนื้อหาจากสไลด์บทเรียน",
                    )}
                  </p>
                  <fieldset className="lq-categories">
                    <legend className="sr-only">
                      {b("Question category", "หมวดคำถาม")}
                    </legend>
                    {(
                      [
                        {
                          key: "astrology",
                          Icon: Sparkles,
                          count: 10,
                          detail: b(
                            "Signs, planets & the ascendant",
                            "ราศี ดาว และลัคนา",
                          ),
                        },
                        {
                          key: "numerals",
                          Icon: BookOpen,
                          count: 10,
                          detail: b(
                            "Thai, Maya, Babylonian & Roman",
                            "ไทย มายา บาบิโลน และโรมัน",
                          ),
                        },
                        {
                          key: "mixed",
                          Icon: Star,
                          count: 15,
                          detail: b(
                            "A little of both worlds",
                            "รวมความรู้จากทั้งสองหมวด",
                          ),
                        },
                      ] as const
                    ).map(({ key, Icon, count, detail }) => (
                      <button
                        key={key}
                        className={category === key ? "selected" : ""}
                        aria-pressed={category === key}
                        onClick={() => setCategory(key)}
                      >
                        <Icon size={23} />
                        <span>
                          <strong>{categoryName(key)}</strong>
                          <small>{detail}</small>
                        </span>
                        <b>
                          {count}
                          <small>{b("Qs", "ข้อ")}</small>
                        </b>
                      </button>
                    ))}
                  </fieldset>
                  <div className="lq-ready-meter">
                    <span>{b("Ready to play", "ผู้เล่นพร้อมแล้ว")}</span>
                    <strong>
                      {readyCount} / {room.player_count}
                    </strong>
                    <div>
                      <i
                        style={{
                          width: `${room.player_count ? (readyCount / room.player_count) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <button
                    className="lq-primary"
                    disabled={busy || !canStart || connection !== "connected"}
                    onClick={() => action("start", "POST", { category })}
                  >
                    {busy ? (
                      <LoaderCircle className="spin" size={20} />
                    ) : (
                      <Gamepad2 size={20} />
                    )}
                    {b("Start game", "เริ่มเกม")}
                    <ArrowRight size={18} />
                  </button>
                  <p className="lq-start-note" aria-live="polite">
                    {!room.player_count
                      ? b(
                          "Waiting for the first player to join",
                          "รอผู้เล่นคนแรกเข้าร่วม",
                        )
                      : !canStart
                        ? b(
                            "Waiting for everyone to mark ready",
                            "รอให้ผู้เล่นทุกคนกดพร้อม",
                          )
                        : b(
                            "Everyone is ready. Let’s play!",
                            "ทุกคนพร้อมแล้ว เริ่มได้เลย!",
                          )}
                  </p>
                </>
              ) : (
                <div className="lq-player-ready">
                  <Smartphone size={37} strokeWidth={1.3} />
                  <h2>
                    {room.ready
                      ? b("You’re in. You’re ready.", "พร้อมแล้ว ไปด้วยกัน!")
                      : b(
                          "Ready to light up your constellation?",
                          "พร้อมเติมแสงให้กลุ่มดาวหรือยัง?",
                        )}
                  </h2>
                  <p>
                    {b(
                      "The host starts when everyone is ready. Keep this screen open for your answer buttons.",
                      "ผู้จัดจะเริ่มเมื่อทุกคนพร้อม เปิดหน้านี้ไว้สำหรับกดตอบคำถาม",
                    )}
                  </p>
                  <button
                    className={room.ready ? "lq-secondary" : "lq-primary"}
                    disabled={busy || connection !== "connected"}
                    onClick={() =>
                      action("ready", "PUT", { ready: !room.ready })
                    }
                  >
                    <CheckCircle2 size={20} />
                    {room.ready
                      ? b("I need a moment", "ขอเตรียมตัวอีกนิด")
                      : b("I’m ready", "พร้อมแล้ว")}
                  </button>
                  {room.ready && (
                    <span className="lq-ready-confirm">
                      <Check size={17} />
                      {b("Waiting for the presenter", "รอผู้จัดเริ่มเกม")}
                    </span>
                  )}
                </div>
              )}
              <div className="lq-rules">
                <span>
                  <Timer size={17} />
                  {b(
                    "5s to read · 20s to answer",
                    "อ่านโจทย์ 5 วิ · ตอบ 20 วิ",
                  )}
                </span>
                <span>
                  <Eye size={17} />
                  {b(
                    "8s answer reveal after every question",
                    "เฉลย 8 วิหลังหมดเวลาแต่ละข้อ",
                  )}
                </span>
              </div>
            </aside>
          </div>
        </>
      ) : room.status === "active" ? (
        <>
          <div className="lq-round-meta">
            <span>
              {b("Question", "ข้อที่")}{" "}
              <strong>
                {room.question_number} <small>/ {room.total}</small>
              </strong>
              <span className="lq-topic">{categoryName(room.category)}</span>
            </span>
            <div className="lq-round-actions">
              <span>
                {room.phase === "preview"
                  ? b("Get ready", "เตรียมตัว")
                  : room.phase === "reveal"
                    ? b("Answer revealed", "ช่วงเฉลย")
                    : b("Answers are open", "เปิดให้ตอบแล้ว")}
              </span>
              {room.host && (
                <button
                  className="lq-skip-button"
                  disabled={busy || connection !== "connected" || seconds === 0}
                  title={
                    room.phase === "question"
                      ? b(
                          "End answering and reveal the answer",
                          "จบเวลาตอบและเปิดเฉลยทันที",
                        )
                      : undefined
                  }
                  onClick={() =>
                    action("skip", "POST", {
                      question_id: room.question_id,
                      phase: room.phase,
                    })
                  }
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <SkipForward size={17} />
                  )}
                  {room.phase === "preview"
                    ? b("Start answers", "เริ่มตอบ")
                    : room.phase === "question"
                      ? b("Skip", "เฉลยเลย")
                      : room.question_number === room.total
                        ? b("Show results", "ดูผลการแข่งขัน")
                        : b("Next question", "ข้อถัดไป")}
                </button>
              )}
            </div>
          </div>
          <section
            className={`lq-game-stage ${seconds <= 5 && room.phase === "question" ? "is-urgent" : ""}`}
            aria-label={b("Quiz stage", "สนามควิซ")}
          >
            <div className="lq-stage-top">
              <span className="lq-phase-title">
                {room.host ? <Monitor size={18} /> : <Smartphone size={18} />}
                {room.host
                  ? b("Shared screen", "จอร่วมกัน")
                  : `${b("Team", "ทีม")} ${mine?.letter}`}
              </span>
              <div
                className="lq-countdown"
                role="timer"
                aria-label={b("Seconds remaining", "วินาทีที่เหลือ")}
              >
                <Timer size={21} />
                <strong>{seconds}</strong>
                <span>{b("sec", "วิ")}</span>
              </div>
              <span className="lq-response-count">
                <Users size={18} />
                <strong>
                  {room.responses} / {room.player_count}
                </strong>
                <span>{b("answered", "ตอบแล้ว")}</span>
              </span>
            </div>
            <div className="lq-clock-track">
              <i style={{ transform: `scaleX(${progress})` }} />
            </div>
            {room.phase === "reveal" && room.reveal ? (
              <QuizReveal
                reveal={room.reveal}
                host={room.host}
                lang={lang}
                seconds={seconds}
                last={room.question_number === room.total}
              />
            ) : room.host && room.question ? (
              <>
                <div className="lq-host-question" key={room.question_id}>
                  <h2>
                    {th
                      ? room.question.prompt_th || room.question.prompt
                      : room.question.prompt}
                  </h2>
                  {room.question.representation && (
                    <div className="lq-question-numeral">
                      <Numeral
                        value={room.question.representation}
                        system={room.question.system}
                      />
                    </div>
                  )}
                </div>
                {room.phase === "preview" ? (
                  <div className="lq-preview-lock">
                    <Eye size={21} />
                    <span>
                      {b(
                        "Read the question. Answer buttons open in",
                        "อ่านโจทย์ให้พร้อม ปุ่มตอบจะเปิดใน",
                      )}{" "}
                      <strong>{seconds}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="lq-answer-board">
                    {room.question.choices.map((choice, index) => (
                      <div
                        className={`lq-answer-tile lq-answer-${index}`}
                        key={index}
                      >
                        <AnswerShape index={index} />
                        <span>
                          {th
                            ? room.question?.choices_th?.[index] || choice
                            : choice}
                        </span>
                        <small>{letters[index]}</small>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="lq-player-instruction">
                  {room.answered ? (
                    <SubmissionSpark
                      key={room.question_id}
                      letter={mine?.letter || "A"}
                    />
                  ) : (
                    <Eye size={23} />
                  )}
                  <h2>
                    {room.phase === "preview"
                      ? b("Eyes on the shared screen.", "ดูโจทย์บนจอผู้จัด")
                      : room.answered
                        ? b("Answer received!", "รับคำตอบแล้ว!")
                        : b("Your move.", "ถึงตาคุณแล้ว")}
                  </h2>
                  <p>
                    {room.phase === "preview"
                      ? b(
                          "Take a breath. Your buttons will unlock shortly.",
                          "อ่านโจทย์และเตรียมตัว ปุ่มตอบจะเปิดในอีกสักครู่",
                        )
                      : room.answered
                        ? b(
                            "You've added light to your constellation. The answer appears when the timer ends.",
                            "คุณเติมแสงให้กลุ่มดาวแล้ว รอดูเฉลยเมื่อหมดเวลาข้อนี้",
                          )
                        : b(
                            "Match the shape on the shared screen, then tap once.",
                            "เลือกรูปทรงที่ตรงกับคำตอบบนจอผู้จัด แล้วกดหนึ่งครั้ง",
                          )}
                  </p>
                </div>
                <div
                  className={`lq-answer-pad ${room.answered ? "has-submitted" : ""}`}
                >
                  {Array.from({ length: room.choice_count }, (_, index) => (
                    <button
                      className={`lq-answer-tile lq-answer-${index} ${room.selected_index === index ? "is-selected" : ""}`}
                      disabled={
                        room.phase !== "question" ||
                        !!room.answered ||
                        busy ||
                        seconds === 0 ||
                        connection !== "connected"
                      }
                      key={index}
                      onClick={() => choose(index)}
                      aria-label={`${b("Answer", "คำตอบ")} ${letters[index]}: ${th ? ["สามเหลี่ยม", "ข้าวหลามตัด", "วงกลม", "สี่เหลี่ยม"][index] : shapes[index]}`}
                      aria-pressed={room.selected_index === index}
                    >
                      <AnswerShape index={index} />
                      <span>{letters[index]}</span>
                      {room.selected_index === index ? (
                        <CheckCircle2 size={25} />
                      ) : (
                        <kbd>{index + 1}</kbd>
                      )}
                    </button>
                  ))}
                </div>
                <div className="lq-submission-status" role="status">
                  {busy ? (
                    <>
                      <LoaderCircle className="spin" size={18} />
                      {b("Sending your answer…", "กำลังส่งคำตอบ…")}
                    </>
                  ) : room.answered ? (
                    <>
                      <CheckCircle2 size={18} />
                      {b(
                        "Submitted · waiting for the timer",
                        "ส่งแล้ว · รอหมดเวลา",
                      )}
                    </>
                  ) : room.phase === "preview" ? (
                    <>
                      {b("Buttons open in", "ปุ่มจะเปิดใน")}{" "}
                      <strong>{seconds}</strong>
                    </>
                  ) : seconds === 0 ? (
                    b("Time’s up", "หมดเวลา")
                  ) : (
                    b("One answer per question", "ตอบได้ครั้งเดียวต่อข้อ")
                  )}
                </div>
              </>
            )}
          </section>
          {room.host && (
            <section className="lq-response-arena">
              <div className="lq-response-lanes">
                {room.teams.map((team) => (
                  <div
                    className={`lq-response-lane team-${team.letter}`}
                    key={team.id}
                  >
                    <ConstellationMark letter={team.letter} />
                    <span>
                      <strong>
                        {b("Team", "ทีม")} {team.letter}
                      </strong>
                      <small>
                        {team.responses} / {team.size}{" "}
                        {b("answered", "ตอบแล้ว")}
                      </small>
                    </span>
                    <div className="lq-lane-track">
                      <i
                        style={{
                          width: `${team.size ? (team.responses / team.size) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="lq-live-arena">
                <CelestialArena
                  teams={room.teams}
                  mode="live"
                  roundKey={room.question_id || ""}
                  lang={lang}
                />
              </div>
              <p>
                {b(
                  "Stars light up when answers arrive. Scores reveal at the finish.",
                  "ดาวสว่างขึ้นเมื่อส่งคำตอบ เปิดคะแนนพร้อมกันท้ายเกม",
                )}
              </p>
            </section>
          )}
        </>
      ) : (
        <>
          <section className="lq-results-hero">
            <div>
              <Trophy size={39} />
              <span>
                {b(
                  "Your constellation has risen",
                  "กลุ่มดาวของคุณเปล่งประกายแล้ว",
                )}
              </span>
              <h1>
                {room.winners?.length === 1
                  ? `${b("Team", "ทีม")} ${room.winners[0]} ${b("takes the win!", "ชนะ!")}`
                  : b("A shared victory!", "ชัยชนะร่วมกัน!")}
              </h1>
              <p>
                {b(
                  "Every answer added a little light. Now see who made the sky shine brightest.",
                  "ทุกคำตอบได้เติมแสงให้ท้องฟ้า มาดูกันว่ากลุ่มดาวใดส่องสว่างที่สุด",
                )}
              </p>
              {ownRank && (
                <div className="lq-own-result">
                  <strong>
                    <AnimatedScore value={ownRank.points} lang={lang} />
                    <small>{b("points", "คะแนน")}</small>
                  </strong>
                  <strong>
                    {ownRank.correct} / {room.total}
                    <small>{b("correct answers", "ตอบถูก")}</small>
                  </strong>
                  <strong>
                    #{ownRank.rank}
                    <small>{b("your rank", "อันดับของคุณ")}</small>
                  </strong>
                </div>
              )}
              <div className="lq-result-actions">
                {room.host && (
                  <button
                    className="lq-primary"
                    disabled={busy}
                    onClick={() => action("rematch")}
                  >
                    {b("Play again", "เล่นอีกครั้ง")}
                    <ArrowRight size={18} />
                  </button>
                )}
                <button
                  className="lq-secondary"
                  onClick={() => go("/learn/thai-astrology")}
                >
                  <BookOpen size={18} />
                  {b("Back to lessons", "กลับบทเรียน")}
                </button>
              </div>
            </div>
            <div className="lq-finish-arena">
              <CelestialArena
                teams={room.teams}
                mode="reveal"
                lang={lang}
                winners={room.winners}
              />
            </div>
          </section>
          <div className="lq-results-grid">
            <section className="lq-team-results">
              <h2>{b("Team standings", "อันดับทีม")}</h2>
              <p>
                {b(
                  "Average points per player keeps teams balanced.",
                  "คิดคะแนนเฉลี่ยต่อคน เพื่อให้ทีมขนาดต่างกันแข่งขันได้",
                )}
              </p>
              {[...room.teams]
                .filter((team) => team.size)
                .sort((a, z) => z.power - a.power)
                .map((team, index) => (
                  <div
                    className={`lq-team-result team-${team.letter}`}
                    key={team.id}
                  >
                    <span>{index + 1}</span>
                    <ConstellationMark letter={team.letter} />
                    <span>
                      <strong>
                        {b("Team", "ทีม")} {team.letter}
                      </strong>
                      <small>
                        {team.correct} {b("correct", "คำตอบถูก")} · {team.size}{" "}
                        {b("players", "คน")}
                      </small>
                    </span>
                    <strong>
                      <AnimatedScore
                        value={team.power}
                        lang={lang}
                        decimals={1}
                        delay={300 + index * 100}
                      />
                      <small>{b("pts / player", "คะแนน / คน")}</small>
                    </strong>
                    {room.winners?.includes(team.letter) && (
                      <Trophy size={19} />
                    )}
                  </div>
                ))}
            </section>
            <section className="lq-leaderboard">
              <h2>{b("Top players", "ผู้เล่นยอดเยี่ยม")}</h2>
              <p>
                {b(
                  "Correct answers + quick thinking. Best streak shown below.",
                  "คะแนนจากคำตอบถูกและความเร็ว พร้อมสถิติตอบถูกต่อเนื่อง",
                )}
              </p>
              <CelestialPodium
                leaders={room.leaderboard?.slice(0, 3) || []}
                lang={lang}
                userId={user.id}
              />
              {room.leaderboard?.slice(3, 5).map((person) => (
                <div
                  key={person.id}
                  className={person.id === user.id ? "is-you" : ""}
                >
                  <span className={`lq-rank rank-${person.rank}`}>
                    {person.rank === 1 ? <Trophy size={20} /> : person.rank}
                  </span>
                  <span className={`lq-avatar team-${person.team}`}>
                    {person.name[0]}
                  </span>
                  <span>
                    <strong>
                      {person.name}
                      {person.id === user.id && (
                        <small>{b("you", "คุณ")}</small>
                      )}
                    </strong>
                    <small>
                      {b("Team", "ทีม")} {person.team} ·{" "}
                      {b("Best streak", "ตอบถูกต่อเนื่อง")} {person.streak}
                    </small>
                  </span>
                  <b>
                    <AnimatedScore value={person.points} lang={lang} />
                  </b>
                </div>
              ))}
            </section>
          </div>
        </>
      )}
    </main>
  );
}
