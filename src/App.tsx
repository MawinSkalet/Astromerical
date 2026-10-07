import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Briefcase,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Coins,
  Compass,
  Gamepad2,
  Globe2,
  GraduationCap,
  Heart,
  Info,
  Lightbulb,
  LoaderCircle,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Send,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Users,
  X,
  XCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { api } from "./api";
import { LiveQuiz } from "./LiveQuiz";
import { translate } from "./i18n";
import {
  Numeral,
  SunSeal,
  TempleArt,
  ZodiacWheel,
} from "./Illustrations";
import { LessonStage } from "./LessonStage";
import type {
  ChartResult,
  Feedback,
  GameResult,
  Language,
  Lesson,
  Profile,
  Question,
  User,
} from "./types";

type Context = {
  lang: Language;
  t: (key: string) => string;
  user: User | null;
  notify: (message: string) => void;
  go: (path: string) => void;
};
const AppContext = createContext<Context>(null!);
const useApp = () => useContext(AppContext);
const topicNames: Record<string, [string, string]> = {
  "thai-astrology": ["Thai Astrology", "โหราศาสตร์ไทย"],
  "thai-numerals": ["Thai Numeral Systems", "ระบบเลขไทย"],
  mayan: ["Mayan Numerals", "ตัวเลขมายา"],
  babylonian: ["Babylonian Numerals", "ตัวเลขบาบิโลน"],
  roman: ["Roman Numerals", "ตัวเลขโรมัน"],
};
const systemNames: Record<string, string> = {
  roman: "Roman",
  mayan: "Mayan",
  babylonian: "Babylonian",
  thai: "Thai",
  astrology: "Astrology",
};
const activities = ["astroquest", "decode", "match", "timeline", "date"];
const activityIcons = [Sparkles, Gamepad2, Compass, Clock3, CalendarDays];
function readingParagraphs(text: string) {
  return text
    .split(/\n{2,}/u)
    .flatMap((block) =>
      block.match(/[^.!?。！？]+[.!?。！？]+(?=\s|$)|[^.!?。！？]+$/gu) ?? [block],
    )
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function useData<T>(path: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    api<T>(path)
      .then((x) => {
        if (live) setData(x);
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [path, version]);
  return { data, error, loading, reload: () => setVersion((x) => x + 1) };
}
function ErrorNote({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="error-note" role="alert">
      <Info size={18} />
      <span>{message}</span>
      {retry && <button onClick={retry}>Try again</button>}
    </div>
  );
}
function Loading() {
  const { t } = useApp();
  return (
    <div className="loading">
      <LoaderCircle className="spin" size={25} />
      <p>{t("loading")}</p>
    </div>
  );
}
function PageTitle({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={(secondary ? "button secondary" : "button") + " " + className}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [lang, setLang] = useState<Language>(() =>
    localStorage.getItem("zodiac-language") === "th" ? "th" : "en",
  );
  const [user, setUser] = useState<User | null>(null),
    [authLoading, setAuthLoading] = useState(true),
    [authError, setAuthError] = useState("");
  const [path, setPath] = useState(
    window.location.hash.slice(1) || "/learn/thai-astrology",
  );
  const [toast, setToast] = useState(""),
    [search, setSearch] = useState(false),
    [profileMenu, setProfileMenu] = useState(false);
  const t = (key: string) => translate(lang, key);
  const go = (p: string) => {
    window.location.hash = p;
    setProfileMenu(false);
    setSearch(false);
  };
  const notify = (s: string) => setToast(s);
  useEffect(() => {
    const route = () => {
      setPath(window.location.hash.slice(1) || "/learn/thai-astrology");
      setProfileMenu(false);
      setSearch(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, []);
  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch((e) => {
        if (e.status !== 401) setAuthError(e.message);
      })
      .finally(() => setAuthLoading(false));
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("zodiac-language", lang);
  }, [lang]);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 4200);
      return () => clearTimeout(id);
    }
  }, [toast]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearch(false);
        setProfileMenu(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const [section, slug] = path.split("/").slice(1);
  const active = section === "profile" ? "learn" : section;
  async function logout() {
    try {
      await api("/auth/logout", "POST");
      setUser(null);
    } catch (e) {
      notify((e as Error).message);
    }
  }
  return (
    <AppContext.Provider value={{ lang, t, user, notify, go }}>
      <div
        className={`app-frame ${user && section === "learn" ? "lesson-shell" : ""}`}
      >
        <header className="header">
          <a
            className="brand"
            href="#/learn/thai-astrology"
            aria-label="Zodiac and Numerals home"
          >
            <SunSeal />
            <span>
              <span className="brand-name">Zodiac &amp; Numerals</span>
              <span className="brand-tagline">{t("welcome")}</span>
            </span>
          </a>
          <nav className="top-nav" aria-label="Main navigation">
            {["learn", "play", "quiz"].map((s) => (
              <a
                href={"#/" + (s === "learn" ? "learn/thai-astrology" : s)}
                key={s}
                className={active === s ? "active" : ""}
              >
                {t(s)}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button search-toggle"
              aria-label={t("search")}
              onClick={() => setSearch(true)}
            >
              <Search size={19} />
            </button>
            <button
              className="language-toggle"
              onClick={() => setLang(lang === "en" ? "th" : "en")}
              aria-label={
                lang === "en" ? "Switch to Thai" : "Switch to English"
              }
            >
              <Globe2 size={16} />
              {lang === "en" ? "EN" : "ไทย"}
            </button>
            {user ? (
              <div className="profile-anchor">
                <button
                  className="profile-trigger"
                  onClick={() => setProfileMenu(!profileMenu)}
                  aria-expanded={profileMenu}
                >
                  <span className="avatar">{user.name[0].toUpperCase()}</span>
                  <span className="profile-label">
                    {user.name}
                    <small>{t("student")}</small>
                  </span>
                  <ChevronDown size={14} />
                </button>
                {profileMenu && (
                  <>
                    <button
                      className="dismiss-menu"
                      aria-label="Close menu"
                      onClick={() => setProfileMenu(false)}
                    />
                    <div className="profile-menu">
                      <strong>{user.name}</strong>
                      <span>
                        {user.guest ? "Guest explorer" : "Student account"}
                      </span>
                      <button onClick={() => go("/profile")}>
                        <GraduationCap size={17} />
                        {t("viewProfile")}
                      </button>
                      <button onClick={() => go("/chart")}>
                        <CalendarDays size={17} />
                        {t("birthReading")}
                      </button>
                      <button onClick={logout}>
                        <LogOut size={17} />
                        {t("signout")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <span className="guest-label">{t("student")}</span>
            )}
          </div>
        </header>
        {authLoading ? (
          <Loading />
        ) : !user ? (
          <Welcome onEntry={setUser} serverError={authError} />
        ) : section === "chart" ? (
          <ChartPage />
        ) : section === "tutor" ? (
          <TutorPage />
        ) : section === "play" ? (
          <PlayPage key={slug || "hub"} activity={slug} />
        ) : section === "quiz" ? (
          <LiveQuiz code={slug} lang={lang} user={user} go={go} notify={notify} />
        ) : section === "profile" ? (
          <ProfilePage />
        ) : (
          <LearnPage
            key={slug || "thai-astrology"}
            slug={topicNames[slug] ? slug : "thai-astrology"}
          />
        )}
        <footer className="footer">
          <span>
            <span className="tiny-star">✧</span>{" "}
            {lang === "th"
              ? "ต่างวัฒนธรรม ท้องฟ้าเดียวกัน"
              : "Different cultures, the same sky."}
          </span>
          <span>
            {lang === "th"
              ? "สร้างจากความสงสัย เรียนรู้ด้วยกัน"
              : "Made for curious minds."}{" "}
            <span className="footer-dot">·</span> Zodiac &amp; Numerals
          </span>
        </footer>
        {user &&
          section !== "learn" &&
          section !== "tutor" &&
          section !== "quiz" && (
            <button
              className={`chatbot-launcher ${section === "learn" ? "above-lesson-controls" : ""}`}
              onClick={() =>
                go("/tutor/" + (topicNames[slug] ? slug : "thai-astrology"))
              }
            >
              <MessageCircle size={22} />
              <span>{t("chatbot")}</span>
            </button>
          )}
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {search && <SearchDialog onClose={() => setSearch(false)} />}
    </AppContext.Provider>
  );
}

function Welcome({
  onEntry,
  serverError,
}: {
  onEntry: (u: User) => void;
  serverError: string;
}) {
  const { lang, t } = useApp();
  const [mode, setMode] = useState("guest"),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function enter(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data =
        mode === "guest"
          ? { name: name.trim() || "Curious explorer" }
          : { name: name.trim() || "Explorer", email, password };
      onEntry(await api<User>("/auth/" + mode, "POST", data));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="welcome-page">
      <div className="welcome-copy">
        <span className="small-label">
          <span className="gold-dash" />
          {lang === "th"
            ? "เรียนรู้จากอดีต มองสู่วันข้างหน้า"
            : "A new perspective on ancient knowledge"}
        </span>
        <h1>
          {lang === "th" ? (
            <>
              โลกเก่า
              <br />
              ความเป็นไปได้ใหม่
            </>
          ) : (
            <>
              Old worlds.
              <br />
              New possibilities.
            </>
          )}
        </h1>
        <p>
          {lang === "th"
            ? "สำรวจโหราศาสตร์ไทย ถอดรหัสตัวเลขโบราณ และเรียนรู้ไปพร้อมเพื่อน ๆ"
            : "Explore Thai astrology, decode the numbers of ancient civilizations, and discover how much there is to learn together."}
        </p>
        <div className="welcome-chips">
          <span>
            <BookOpen size={16} />
            {lang === "th" ? "5 บทเรียน" : "5 learning paths"}
          </span>
          <span>
            <Gamepad2 size={16} />
            {lang === "th" ? "5 เกม" : "5 ways to play"}
          </span>
          <span>
            <Users size={16} />
            {lang === "th" ? "ควิซทีมสด" : "Live team quizzes"}
          </span>
        </div>
        <form className="entry-form" onSubmit={enter}>
          <div className="segmented">
            {["guest", "login", "register"].map((m) => (
              <button
                type="button"
                className={mode === m ? "selected" : ""}
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
              >
                {m === "guest"
                  ? lang === "th"
                    ? "ผู้เยี่ยมชม"
                    : "Guest"
                  : t(m === "login" ? "signin" : "register")}
              </button>
            ))}
          </div>
          {mode !== "login" && (
            <label>
              {t("name")}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  lang === "th"
                    ? "เราเรียกคุณว่าอะไรดี"
                    : "What should we call you?"
                }
                maxLength={60}
                autoComplete="given-name"
              />
            </label>
          )}
          {mode !== "guest" && (
            <>
              <label>
                {t("email")}
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <label>
                {t("password")}
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </label>
            </>
          )}
          {(error || serverError) && (
            <ErrorNote message={error || serverError} />
          )}
          <Button type="submit" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <>
                {mode === "guest"
                  ? t("guest")
                  : t(mode === "login" ? "signin" : "register")}
                <ArrowRight size={17} />
              </>
            )}
          </Button>
          <p className="form-footnote">
            {lang === "th"
              ? "ผู้เยี่ยมชมเริ่มเรียนได้ทันที ความก้าวหน้าจะผูกกับเบราว์เซอร์นี้"
              : "No account needed to explore. Guest progress stays linked to this browser."}
          </p>
        </form>
      </div>
      <div className="welcome-art">
        <ZodiacWheel language={lang} />
        <p className="serif-quote">
          “
          {lang === "th"
            ? "ท้องฟ้าเดียวกัน มุมมองใหม่เสมอ"
            : "The same sky, new perspectives."}
          ”
        </p>
        <TempleArt />
      </div>
    </main>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const { lang, t, go } = useApp();
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const matches = Object.entries(topicNames).filter(([, names]) =>
    names.join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t("search")}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            const items =
              e.currentTarget.querySelectorAll<HTMLElement>("button,input");
            if (e.shiftKey && document.activeElement === items[0]) {
              e.preventDefault();
              items[items.length - 1].focus();
            } else if (
              !e.shiftKey &&
              document.activeElement === items[items.length - 1]
            ) {
              e.preventDefault();
              items[0].focus();
            }
          }
        }}
      >
        <div className="search-field">
          <Search size={20} />
          <input
            ref={ref}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
          />
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>
        <p className="small-label">{t("lessons")}</p>
        {matches.length ? (
          matches.map(([slug, names]) => (
            <button
              className="search-result"
              key={slug}
              onClick={() => go("/learn/" + slug)}
            >
              <BookOpen size={19} />
              <span>{names[lang === "th" ? 1 : 0]}</span>
              <ArrowRight size={17} />
            </button>
          ))
        ) : (
          <p className="muted">
            {lang === "th"
              ? "ไม่พบบทเรียน ลองค้นหาใหม่"
              : "No lessons found. Try “Roman” or “Mayan”."}
          </p>
        )}
      </section>
    </div>
  );
}

function Sidebar({
  section,
  selected,
}: {
  section: "learn" | "play";
  selected?: string;
}) {
  const { lang, t } = useApp();
  const numeralSlugs = ["thai-numerals", "mayan", "babylonian", "roman"];
  const [numeralsExpanded, setNumeralsExpanded] = useState(
    numeralSlugs.includes(selected || ""),
  );
  useEffect(() => {
    setNumeralsExpanded(numeralSlugs.includes(selected || ""));
  }, [selected]);
  const numeralSelected = numeralSlugs.includes(selected || "");
  return (
    <aside className="sidebar">
      <div>
        <h2>{t(section)}</h2>
        <p>{t(section === "learn" ? "learnIntro" : "playIntro")}</p>
      </div>
      <nav aria-label={t(section) + " topics"}>
        {section === "learn" ? (
          <>
            <a
              href="#/learn/thai-astrology"
              className={selected === "thai-astrology" ? "active" : ""}
            >
              <Compass size={17} />
              <span>
                {topicNames["thai-astrology"][lang === "th" ? 1 : 0]}
              </span>
              {selected === "thai-astrology" && <ChevronRight size={14} />}
            </a>
            <button
              type="button"
              className={
                "sidebar-group-toggle " +
                (numeralSelected ? "active " : "") +
                (numeralsExpanded ? "expanded" : "")
              }
              aria-expanded={numeralsExpanded}
              aria-controls="learn-numeral-topics"
              onClick={() => setNumeralsExpanded((expanded) => !expanded)}
            >
              <BookOpen size={17} />
              <span>{t("numerals")}</span>
              <ChevronDown size={14} />
            </button>
            {numeralsExpanded && (
              <div className="sidebar-subnav" id="learn-numeral-topics">
                {numeralSlugs.map((slug, i) => {
                  const Icon = [BookOpen, Sun, GraduationCap, BookOpenCheck][i];
                  return (
                    <a
                      href={"#/learn/" + slug}
                      className={selected === slug ? "active" : ""}
                      key={slug}
                    >
                      <Icon size={16} />
                      <span>{topicNames[slug][lang === "th" ? 1 : 0]}</span>
                      {selected === slug && <ChevronRight size={14} />}
                    </a>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          activities.map((a, i) => {
            const Icon = activityIcons[i];
            return (
              <a
                href={"#/play/" + a}
                className={selected === a ? "active" : ""}
                key={a}
              >
                <Icon size={17} />
                <span>{t(a)}</span>
              </a>
            );
          })
        )}
        {section === "learn" && (
          <div className="mobile-learn-actions">
            <a href="#/chart">
              <Sun size={15} />
              <span>{t("viewChart")}</span>
            </a>
            <a href={"#/tutor/" + (selected || "thai-astrology")}>
              <MessageCircle size={15} />
              <span>{t("chatbot")}</span>
            </a>
          </div>
        )}
      </nav>
      <div className="sidebar-bottom">
        <p className="serif-quote">
          “
          {lang === "th"
            ? "ต่างวัฒนธรรม ท้องฟ้าเดียวกัน"
            : section === "learn"
              ? "Different cultures,\nthe same sky."
              : "Old numbers.\nNew possibilities."}
          ”
        </p>
        <TempleArt books={section === "play"} />
      </div>
    </aside>
  );
}

function TutorPanel({
  slug,
  compact = false,
  fullPage = false,
}: {
  slug: string;
  compact?: boolean;
  fullPage?: boolean;
}) {
  const { lang, t } = useApp();
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
      [],
    ),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [mode, setMode] = useState("course-guide"),
    [open, setOpen] = useState(!compact);
  const end = useRef<HTMLDivElement>(null);
  const { data: tutorStatus } = useData<{ enabled: boolean; mode?: string }>(
    "/tutor/status",
  );
  useEffect(() => {
    setMessages([]);
    setError("");
  }, [slug]);
  useEffect(() => {
    const pane = end.current?.parentElement;
    pane?.scrollTo({
      top: pane.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [messages, busy]);
  async function send(message: string) {
    if (!message.trim() || busy) return;
    setInput("");
    setError("");
    setMessages((x) => [...x, { role: "you", text: message }]);
    setBusy(true);
    try {
      const r = await api<{ answer: string; mode: string }>(
        "/tutor/chat",
        "POST",
        { lesson_slug: slug, message, language: lang },
      );
      setMode(r.mode);
      setMessages((x) => [...x, { role: "tutor", text: r.answer }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (tutorStatus?.enabled === false)
    return (
      <section className="tutor-panel paused-tutor">
        <span className="tutor-icon">
          <Clock3 size={19} />
        </span>
        <h3>
          {lang === "th"
            ? "ผู้ช่วยสอนพักระหว่างควิซ"
            : "Your tutor is taking a quiz break"}
        </h3>
        <p>
          {lang === "th"
            ? "กลับมาถามได้เมื่อการแข่งขันจบแล้ว"
            : "Finish your active match, then come back to explore the answers together."}
        </p>
      </section>
    );
  return (
    <section className={"tutor-panel " + (compact ? "compact-tutor" : "")}>
      <button
        className="tutor-heading"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="tutor-icon">
          <Sparkles size={19} />
        </span>
        <span>
          <strong>{t("tutor")}</strong>
          <small>{t("tutorSub")}</small>
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <>
          <div className="tutor-messages" role="log" aria-live="polite">
            {messages.length === 0 ? (
              <div className="tutor-intro">
                <span className="avatar bot">
                  <Sparkles size={14} />
                </span>
                <div>
                  <span className="chat-label">
                    {tutorStatus?.mode === "ai" ? t("aiTutor") : t("courseGuide")}
                  </span>
                  <div className="chat-bubble">
                    {lang === "th"
                      ? "สวัสดี! มีคำถามเกี่ยวกับบทเรียนไหม? ลองถามเรื่องสัญลักษณ์หรือขอตัวอย่างได้เลย"
                      : "Hello, curious mind! I’m here to help you make sense of the lesson. Where shall we begin?"}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div className={"chat-message " + m.role} key={i}>
                  <span className="chat-label">
                    {m.role === "you"
                      ? lang === "th"
                        ? "คุณ"
                        : "You"
                      : t(mode === "ai" ? "aiTutor" : "courseGuide")}
                  </span>
                  <div className="chat-bubble">{m.text}</div>
                </div>
              ))
            )}
            {busy && (
              <div className="thinking">
                <LoaderCircle size={15} className="spin" />
                Thinking…
              </div>
            )}
            <div ref={end} />
          </div>
          {messages.length === 0 && (
            <div className="suggested-questions">
              {(slug === "all"
                ? lang === "th"
                  ? [
                      "ลัคนาคืออะไร?",
                      "XIV แทนจำนวนเท่าไร?",
                      "เลขไทยใช้ค่าประจำหลักอย่างไร?",
                      "เลขมายาใช้จุดกับขีดอย่างไร?",
                      "ทำไมบาบิโลนจึงใช้ฐาน 60?",
                    ]
                  : [
                      "What is the ascendant?",
                      "What does XIV represent?",
                      "How do Thai numerals use place value?",
                      "How do Mayan dots and bars work?",
                      "Why is Babylonian numeration base 60?",
                    ]
                : slug === "thai-astrology"
                  ? [
                      lang === "th" ? "ลัคนาคืออะไร?" : "What is the ascendant?",
                      lang === "th"
                        ? "ตัวเลขแทนดาวอะไร?"
                        : "What do the numbers mean?",
                    ]
                  : [
                      lang === "th" ? "อธิบายสัญลักษณ์" : "Explain the symbols",
                      lang === "th"
                        ? "ค่าประจำหลักคืออะไร?"
                        : "How does place value work?",
                    ]
              ).map((q) => (
                <button onClick={() => send(q)} key={q}>
                  {q}
                  <ArrowUp size={13} />
                </button>
              ))}
            </div>
          )}
          {error && <ErrorNote message={error} />}
          <form
            className="tutor-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label={t("question")}
              placeholder={t("question")}
              maxLength={1500}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t("send")}
            >
              <Send size={17} />
            </button>
          </form>
          <p className="tutor-footnote">
            <Info size={12} />
            {lang === "th"
              ? "อ้างอิงเฉพาะเนื้อหาบทเรียนนี้"
              : "Grounded in your course material."}
          </p>
        </>
      )}
      {!fullPage && (
        <a className="tutor-full-link" href={"#/tutor/" + slug}>
          <MessageCircle size={14} />
          {lang === "th" ? "เปิดแชตบอตเต็มหน้า" : "Open full chatbot"}
          <ArrowRight size={13} />
        </a>
      )}
    </section>
  );
}

function LearnPage({ slug }: { slug: string }) {
  const { lang, t, go, notify } = useApp();
  const {
    data: lesson,
    error,
    loading,
    reload,
  } = useData<Lesson>("/lessons/" + slug);
  const { data: profile, error: profileError } = useData<Profile>("/profile");
  const [index, setIndex] = useState(0),
    [initialized, setInitialized] = useState(false),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState("");
  const [readingSize, setReadingSize] = useState(() => {
    const saved = Number(localStorage.getItem("zodiac-reading-size"));
    return [20, 22, 24].includes(saved) ? saved : 22;
  });
  const [focusReading, setFocusReading] = useState(false);
  const [showExample, setShowExample] = useState(false);
  useEffect(() => {
    if ((profile || profileError) && !initialized) {
      setIndex(profile?.progress.find((p) => p.slug === slug)?.slide || 0);
      setInitialized(true);
    }
  }, [profile, profileError, initialized, slug]);
  async function move(next: number, complete = false) {
    if (!lesson) return;
    setSaving(true);
    setSaveError("");
    try {
      await api("/progress/" + slug, "PUT", {
        slide: next,
        completed: complete,
      });
      setIndex(next);
      setShowExample(false);
      if (complete) {
        notify(
          lang === "th"
            ? "เรียนบทนี้จบแล้ว!"
            : "Lesson complete. A little wiser already!",
        );
        go("/profile");
      }
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  const slide = lesson?.slides[index];
  return (
    <div
      className={
        "section-layout reading-layout " + (focusReading ? "focus-reading" : "")
      }
      style={{ "--reading-size": `${readingSize}px` } as CSSProperties}
    >
      <Sidebar section="learn" selected={slug} />
      <main className="lesson-main">
        {loading || !initialized ? (
          <Loading />
        ) : error ? (
          <ErrorNote message={error} retry={reload} />
        ) : (
          lesson &&
          slide && (
            <>
              <div className="lesson-topline">
                <div className="segmented topic-switch">
                  <button
                    className={slug === "thai-astrology" ? "selected" : ""}
                    onClick={() => go("/learn/thai-astrology")}
                  >
                    {t("astrology")}
                  </button>
                  <button
                    className={slug !== "thai-astrology" ? "selected" : ""}
                    onClick={() => go("/learn/thai-numerals")}
                  >
                    {t("numerals")}
                  </button>
                </div>
                <div
                  className="reading-tools"
                  aria-label={
                    lang === "th"
                      ? "ปรับการอ่านสไลด์"
                      : "Slide reading controls"
                  }
                >
                  <button
                    className="example-toggle"
                    aria-pressed={showExample}
                    onClick={() => setShowExample(!showExample)}
                  >
                    <Lightbulb size={16} />
                    {lang === "th"
                      ? showExample
                        ? "กลับบทเรียน"
                        : "ตัวอย่าง"
                      : showExample
                        ? "Lesson"
                        : "Example"}
                  </button>
                  <label className="reading-size-field">
                    <span className="sr-only">
                      {lang === "th" ? "ขนาดตัวอักษร" : "Text size"}
                    </span>
                    <select
                      value={readingSize}
                      onChange={(e) => {
                        setReadingSize(+e.target.value);
                        localStorage.setItem(
                          "zodiac-reading-size",
                          e.target.value,
                        );
                      }}
                    >
                      {[20, 22, 24].map((size) => (
                        <option key={size} value={size}>
                          {size} px
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="reading-focus"
                    aria-pressed={focusReading}
                    aria-label={
                      lang === "th"
                        ? focusReading
                          ? "กลับหน้าปกติ"
                          : "อ่านเต็มหน้า"
                        : focusReading
                          ? "Exit reading view"
                          : "Reading view"
                    }
                    title={lang === "th" ? "อ่านเต็มหน้า" : "Reading view"}
                    onClick={() => setFocusReading(!focusReading)}
                  >
                    {focusReading ? (
                      <Minimize2 size={18} />
                    ) : (
                      <Maximize2 size={18} />
                    )}
                  </button>
                </div>
              </div>
              <PageTitle
                title={lang === "th" ? lesson.title_th : lesson.title}
                subtitle={lang === "th" ? lesson.subtitle_th : lesson.subtitle}
              />
              <article
                className={`lesson-slide ${showExample ? "show-example" : ""}`}
                key={index}
              >
                <div className="lesson-description">
                  <h2>{lang === "th" ? slide.title_th : slide.title}</h2>
                  {!showExample && (
                    <p>{lang === "th" ? slide.body_th : slide.body}</p>
                  )}
                </div>
                {showExample ? (
                  <section
                    className="slide-example-view"
                    aria-label={
                      lang === "th"
                        ? "ตัวอย่างและข้อสังเกต"
                        : "Example and reflection"
                    }
                  >
                    <div className="lesson-example">
                      <Lightbulb size={27} />
                      <div>
                        <strong>
                          {lang === "th"
                            ? "ลองอ่านตัวอย่างนี้"
                            : "A closer look"}
                        </strong>
                        <p>
                          {lang === "th" ? slide.example_th : slide.example}
                        </p>
                      </div>
                    </div>
                    <div className="slide-takeaway">
                      <BookOpenCheck size={23} />
                      <p>{lang === "th" ? slide.note_th : slide.note}</p>
                    </div>
                    <button
                      className="back-to-slide"
                      onClick={() => setShowExample(false)}
                    >
                      <ArrowLeft size={17} />
                      {lang === "th" ? "กลับบทเรียน" : "Back to the lesson"}
                    </button>
                  </section>
                ) : (
                  <div className="slide-visual">
                    <LessonStage
                      lesson={lesson}
                      index={index}
                      language={lang}
                    />
                  </div>
                )}
              </article>
              <div className="lesson-controls">
                <Button
                  secondary
                  onClick={() => move(index - 1)}
                  disabled={index === 0 || saving}
                >
                  <ArrowLeft size={17} />
                  {t("back")}
                </Button>
                <div className="lesson-pagination">
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                  <span>/ {String(lesson.slides.length).padStart(2, "0")}</span>
                  <div className="slide-dots">
                    {lesson.slides.map((_, i) => (
                      <span className={i <= index ? "filled" : ""} key={i} />
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() =>
                    move(
                      index === lesson.slides.length - 1 ? index : index + 1,
                      index === lesson.slides.length - 1,
                    )
                  }
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <>
                      {t(
                        index === lesson.slides.length - 1 ? "finish" : "next",
                      )}
                      <ArrowRight size={17} />
                    </>
                  )}
                </Button>
              </div>
              {saveError && (
                <ErrorNote message={saveError} retry={() => move(index)} />
              )}
              <p className="source-note">{lesson.source}</p>
            </>
          )
        )}
      </main>
      <aside className="right-rail">
        <TutorPanel slug={slug} />
        {lesson && (
          <div className="context-card">
            <span className="small-label">
              <Compass size={15} />
              {t("keyFacts")}
            </span>
            <p>{lang === "th" ? slide?.note_th : slide?.note}</p>
            <details>
              <summary>
                {lang === "th" ? "คำศัพท์บทเรียน" : "Lesson glossary"}
                <ChevronDown size={14} />
              </summary>
              <dl>
                {lesson.terms.map(([word, definition]) => (
                  <div key={word}>
                    <dt>{word}</dt>
                    <dd>{definition}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>
        )}
        <a href="#/chart" className="side-cta">
          <span className="side-cta-icon">
            <Sun size={22} />
          </span>
          <span>
            <strong>{t("viewChart")}</strong>
            <small>
              {lang === "th"
                ? "อ่านแผนผังจากวันและเวลาเกิด"
                : "Explore your birth chart"}
            </small>
          </span>
          <ArrowRight size={16} />
        </a>
      </aside>
    </div>
  );
}

function TutorPage() {
  const { lang, t } = useApp();
  return (
    <main className="chatbot-page">
      <div className="chatbot-page-intro">
        <span className="tutor-icon">
          <MessageCircle size={32} />
        </span>
        <h1>
          {lang === "th" ? "แชตบอตผู้ช่วยเรียนรู้" : "Your learning chatbot"}
        </h1>
        <p>
          {lang === "th"
            ? "ถามได้ทุกเรื่องจากบทเรียนโหราศาสตร์และระบบตัวเลขโบราณ ไม่ต้องเลือกหมวดก่อน แชตจะค้นสไลด์ที่เกี่ยวข้องให้อัตโนมัติ"
            : "Ask about any astrology or numeral lesson. No topic selection needed; the tutor searches relevant course slides automatically."}
        </p>
        <a href="#/chart" className="chatbot-chart-link">
          <CalendarDays size={22} />
          <span>
            <strong>{t("birthReading")}</strong>
            <small>
              {lang === "th"
                ? "ใส่วันและเวลาเกิดที่หน้าดูดวง"
                : "Use the birth chart form for your date and time"}
            </small>
          </span>
          <ArrowRight size={20} />
        </a>
      </div>
      <TutorPanel key="all-topics" slug="all" fullPage />
    </main>
  );
}

function PlayPage({ activity }: { activity?: string }) {
  const { lang, t, go } = useApp();
  return (
    <div className="section-layout play-layout">
      <Sidebar section="play" selected={activity} />
      {activity && activities.includes(activity) ? (
        <GamePage activity={activity} />
      ) : (
        <main className="play-hub">
          <div className="breadcrumb">
            <Gamepad2 size={15} />
            {lang === "th" ? "ห้องฝึกความรู้" : "Your practice room"}
          </div>
          <h1>
            {lang === "th"
              ? "เรียนรู้ด้วยการเล่น"
              : "A little play. A lot of discovery."}
          </h1>
          <p className="hub-intro">
            {lang === "th"
              ? "สำรวจราศีและดวงดาว ถอดรหัสตัวเลขโบราณ แล้วท้าทายตัวเองด้วยห้าเกมสั้น ๆ"
              : "Explore zodiac signs and celestial symbols, decode ancient numbers, and discover five ways to play."}
          </p>
          <div className="game-cards">
            {activities.map((a, i) => {
              const Icon = activityIcons[i];
              return (
                <button
                  className={"game-card card-" + a}
                  key={a}
                  onClick={() => go("/play/" + a)}
                >
                  <div className="game-card-art">
                    {a === "astroquest" ? (
                      <div className="astro-game-art">
                        <span>♈︎</span>
                        <SunSeal size={86} />
                        <span>ล</span>
                        <span>๒</span>
                      </div>
                    ) : a === "decode" ? (
                      <span className="game-glyph">XIV</span>
                    ) : a === "match" ? (
                      <div className="match-art">
                        <span>•••</span>
                        <span>3</span>
                        <span>V</span>
                        <span>5</span>
                      </div>
                    ) : a === "timeline" ? (
                      <div className="timeline-art">
                        <span>300</span>
                        <i />
                        <span>1202</span>
                        <i />
                        <span>2024</span>
                      </div>
                    ) : (
                      <div className="date-art">
                        <CalendarDays size={57} strokeWidth={1} />
                        <span>XXIV</span>
                      </div>
                    )}
                  </div>
                  <div className="game-card-copy">
                    <Icon size={20} />
                    <span className="small-label">
                      {lang === "th"
                        ? "10 ข้อ · ฝึกตามจังหวะคุณ"
                        : "10 rounds · At your own pace"}
                    </span>
                    <h2>{t(a)}</h2>
                    <p>
                      {
                        [
                          lang === "th"
                            ? "รู้จักราศี อ่านสัญลักษณ์ดาว และไขความหมายลัคนา"
                            : "Discover zodiac signs, planetary symbols, and the ascendant.",
                          lang === "th"
                            ? "ถอดความหมายของสัญลักษณ์โบราณ"
                            : "Turn ancient symbols into familiar numbers.",
                          lang === "th"
                            ? "จับคู่สัญลักษณ์กับค่าที่ตรงกัน"
                            : "Make connections, one symbol at a time.",
                          lang === "th"
                            ? "จัดเหตุการณ์ประวัติศาสตร์ตามลำดับ"
                            : "Find your way through the history of numbers.",
                          lang === "th"
                            ? "อ่านวันเดือนปีจากตัวเลขโบราณ"
                            : "Piece together a date from a different era.",
                        ][i]
                      }
                    </p>
                    <span className="text-link">
                      {lang === "th" ? "ลองเล่น" : "Let’s play"}
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="practice-note">
            <Lightbulb size={20} />
            <p>
              {lang === "th"
                ? "ไม่ต้องรีบ ทุกคำตอบมีคำอธิบาย ชวนให้ลองใหม่เสมอ"
                : "No rush, no pressure. Every answer comes with an explanation, and there’s always another chance to try."}
            </p>
          </div>
        </main>
      )}
    </div>
  );
}

function SystemReference({ system }: { system: string }) {
  const { lang } = useApp();
  return (
    <section className="reference-card">
      <h3>
        {systemNames[system]} {lang === "th" ? "ตัวเลข" : "numerals"}
      </h3>
      <p>
        {lang === "th"
          ? {
              roman: "ใช้ตัวอักษรประกอบกันเพื่อแทนจำนวน",
              mayan: "จุดแทน 1 ขีดแทน 5 เปลือกหอยแทน 0 อ่านระดับจากล่างขึ้นบน",
              babylonian:
                "ลิ่มหน่วยแทน 1 ลิ่มมุมแทน 10 กลุ่มมีค่าประจำหลัก 1, 60, 3600…",
              thai: "เลขไทยใช้ค่าประจำหลักฐานสิบเช่นเดียวกับเลขฮินดูอารบิก",
            }[system as "roman" | "mayan" | "babylonian" | "thai"]
          : system === "roman"
            ? "Use a combination of letters to represent numbers."
            : system === "mayan"
              ? "A dot is 1, a bar is 5, and a shell is 0. Read levels from the bottom upward."
              : system === "babylonian"
                ? "A unit wedge is 1. A corner wedge is 10. Groups use place values of 1, 60, 3600…"
                : "Thai digits share the decimal place values of modern Hindu-Arabic digits."}
      </p>
      {system === "roman" ? (
        <>
          <div className="roman-key">
            {[
              "I = 1",
              "V = 5",
              "X = 10",
              "L = 50",
              "C = 100",
              "D = 500",
              "M = 1,000",
            ].map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
          <hr />
          <h4>{lang === "th" ? "ตัวอย่างที่พบบ่อย" : "Common examples"}</h4>
          {["IV = 4", "IX = 9", "XIV = 14", "XL = 40", "CM = 900"].map((x) => (
            <div className="reference-example" key={x}>
              {x}
            </div>
          ))}
        </>
      ) : system === "mayan" ? (
        <>
          <div className="mini-symbols">
            <Numeral value={{ text: "", levels: [3] }} system="mayan" small />
            <span>= 3</span>
            <Numeral value={{ text: "", levels: [10] }} system="mayan" small />
            <span>= 10</span>
          </div>
          <hr />
          <p>
            {lang === "th" ? "การนับทั่วไป" : "Ordinary counting"}: 1, 20, 400…
          </p>
          <p>
            {lang === "th" ? "ข้อยกเว้นปฏิทิน" : "Calendar exception"}: 1, 20,
            360…
          </p>
        </>
      ) : system === "babylonian" ? (
        <>
          <div className="mini-symbols">
            <Numeral
              value={{ text: "", levels: [23] }}
              system="babylonian"
              small
            />
            <span>= 23</span>
          </div>
          <hr />
          <p>2 : 14 = 2 × 60 + 14 = 134</p>
          <p>
            {lang === "th"
              ? "แผนภาพในบทเรียนแสดง 0 อย่างชัดเจน"
              : "0 is shown explicitly in our learning diagrams."}
          </p>
        </>
      ) : (
        <>
          <p className="thai-key">
            ๐ ๑ ๒ ๓ ๔<br />๕ ๖ ๗ ๘ ๙
          </p>
          <hr />
          <p>๒๕๖ = 256</p>
        </>
      )}
    </section>
  );
}

function GamePage({ activity }: { activity: string }) {
  const { lang, t, go } = useApp();
  const isAstrology = activity === "astroquest";
  const [system, setSystem] = useState(isAstrology ? "astrology" : "roman"),
    [difficulty, setDifficulty] = useState("beginner"),
    [run, setRun] = useState<{ id: string; questions: Question[] } | null>(
      null,
    ),
    [index, setIndex] = useState(0),
    [feedback, setFeedback] = useState<Feedback | null>(null),
    [answer, setAnswer] = useState(""),
    [matches, setMatches] = useState<string[]>(["", "", "", ""]),
    [order, setOrder] = useState<number[]>([0, 1, 2, 3]),
    [date, setDate] = useState<string[]>(["", "", ""]),
    [hint, setHint] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<GameResult | null>(null),
    [score, setScore] = useState(0);
  const q = run?.questions[index];
  const inputRef = useRef<HTMLInputElement>(null);
  async function start() {
    setBusy(true);
    setError("");
    try {
      setRun(await api("/games", "POST", { activity, system, difficulty }));
      setIndex(0);
      setFeedback(null);
      setAnswer("");
      setResult(null);
      setScore(0);
      setHint(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function getAnswer() {
    return activity === "match"
      ? matches.join(",")
      : activity === "timeline"
        ? order.join(",")
        : activity === "date"
          ? `${date[2].padStart(4, "0")}-${date[1].padStart(2, "0")}-${date[0].padStart(2, "0")}`
          : answer;
  }
  async function check(e: FormEvent) {
    e.preventDefault();
    if (!q || !run) return;
    setBusy(true);
    setError("");
    try {
      const f = await api<Feedback>(`/games/${run.id}/attempts`, "POST", {
        question_id: q.id,
        answer: getAnswer(),
        language: lang,
      });
      setFeedback(f);
      if (f.correct) setScore((s) => s + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function next() {
    if (!run) return;
    if (index === run.questions.length - 1) {
      setBusy(true);
      try {
        setResult(await api<GameResult>(`/games/${run.id}/results`));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    } else {
      setIndex((i) => i + 1);
      setFeedback(null);
      setAnswer("");
      setMatches(["", "", "", ""]);
      setOrder([0, 1, 2, 3]);
      setDate(["", "", ""]);
      setHint(false);
      inputRef.current?.focus();
    }
  }
  const title =
    activity === "decode"
      ? lang === "th"
        ? "ถอดรหัสตัวเลขโบราณ"
        : "Decode ancient numbers"
      : t(activity);
  return (
    <>
      <main className="game-main">
        {result ? (
          <GameResults result={result} retry={start} />
        ) : (
          <>
            <div className="breadcrumb">
              <a href="#/play">{t("play")}</a>
              <ChevronRight size={13} />
              {t(activity)}
            </div>
            <PageTitle
              title={title}
              subtitle={
                isAstrology
                  ? lang === "th"
                    ? "ทดสอบความรู้เรื่องราศี สัญลักษณ์ดาว และลัคนา"
                    : "Read the symbols and explore the sky."
                  : lang === "th"
                    ? "เรียนรู้การอ่านตัวเลขจากรอบโลก"
                    : "Learn to read numeral systems from around the world."
              }
            >
              {run && (
                <div className="round-progress">
                  <strong>
                    {index + 1} / {run.questions.length}
                  </strong>
                  <div className="progress-track">
                    <i
                      style={{
                        width: `${((index + 1) / run.questions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </PageTitle>
            {!run ? (
              <>
                <div className="setup-art">
                  {isAstrology ? (
                    <div className="astro-game-art">
                      <span>♈︎</span>
                      <SunSeal size={112} />
                      <span>ล</span>
                    </div>
                  ) : activity === "decode" ? (
                    <span className="game-glyph">XIV</span>
                  ) : activity === "match" ? (
                    <Compass size={96} strokeWidth={0.6} />
                  ) : activity === "timeline" ? (
                    <Clock3 size={96} strokeWidth={0.6} />
                  ) : (
                    <CalendarDays size={96} strokeWidth={0.6} />
                  )}
                  <span className="orbit-dot" />
                </div>
                <h2>
                  {lang === "th"
                    ? "ทำความรู้จักเกมนี้"
                    : "A small challenge, a new perspective."}
                </h2>
                <p className="setup-description">
                  {lang === "th"
                    ? {
                        astroquest:
                          "ตอบคำถาม 10 ข้อเกี่ยวกับราศี สัญลักษณ์ดาว และลัคนา เลือกหนึ่งคำตอบ แล้วอ่านคำอธิบาย ระดับสูงจะให้ฝึกหาตำแหน่งราศีจากองศา",
                        decode:
                          "อ่านสัญลักษณ์โบราณแล้วใส่ค่าปัจจุบัน มีคำใบ้เมื่อคุณต้องการ และมีคำอธิบายหลังตอบทุกข้อ",
                        match:
                          "จับคู่สัญลักษณ์สี่ตัวกับค่าปัจจุบัน เลือกค่าให้ครบทุกตัว แล้วตรวจสอบคำตอบ",
                        timeline:
                          "เลื่อนเหตุการณ์ประวัติศาสตร์สี่เหตุการณ์ให้เรียงจากเก่าสุดไปใหม่สุด ระดับสูงจะซ่อนวันที่",
                        date: "อ่านวัน เดือน และปีจากสัญลักษณ์ แล้วประกอบวันที่คริสต์ศักราชด้วยตัวเลขปัจจุบัน ใช้การนับทั่วไป",
                      }[
                        activity as
                          | "astroquest"
                          | "decode"
                          | "match"
                          | "timeline"
                          | "date"
                      ]
                    : isAstrology
                      ? "Explore ten questions about zodiac signs, planetary digits, and the ascendant. Choose one answer, then discover the rule. Advanced rounds include zodiac longitudes."
                      : activity === "decode"
                        ? "Read each ancient numeral and enter its modern value. You’ll get a hint when you need one and an explanation with every answer."
                        : activity === "match"
                          ? "Match four ancient numerals with their modern values. Choose a number for every symbol, then check your connections."
                          : activity === "timeline"
                            ? "Move four historical milestones into chronological order, from the earliest to the most recent. The dates are there to help you."
                            : "Read an ancient day, month, and year. Rebuild the Gregorian date using modern digits. Ordinary counting conventions are used."}
                </p>
                <div className="game-settings">
                  {activity !== "timeline" && !isAstrology && (
                    <label>
                      {t("numerals")}
                      <select
                        value={system}
                        onChange={(e) => setSystem(e.target.value)}
                      >
                        {Object.entries(systemNames)
                          .filter(([k]) => k !== "astrology")
                          .map(([k, n]) => (
                            <option key={k} value={k}>
                              {n}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  <label>
                    {t("difficulty")}
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                    >
                      {["beginner", "intermediate", "advanced"].map((d) => (
                        <option value={d} key={d}>
                          {t(d)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="start-row">
                  <Button onClick={start} disabled={busy}>
                    {busy ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <>
                        {t("start")}
                        <ArrowRight size={17} />
                      </>
                    )}
                  </Button>
                  <span>
                    <Clock3 size={15} />
                    {lang === "th"
                      ? "10 ข้อ ไม่จำกัดเวลา"
                      : "10 rounds, no time limit"}
                  </span>
                </div>
              </>
            ) : (
              q && (
                <>
                  {!isAstrology && (
                    <div
                      className="system-tabs"
                      role="group"
                      aria-label="Numeral system"
                    >
                      {["mayan", "babylonian", "roman", "thai"].map((s) => (
                        <button
                          disabled={s !== system}
                          className={s === system ? "active" : ""}
                          key={s}
                        >
                          {systemNames[s]}
                        </button>
                      ))}
                    </div>
                  )}
                  <form onSubmit={check} className="game-question">
                    <p
                      className={
                        isAstrology ? "astrology-question-title" : "small-label"
                      }
                    >
                      {q.kind === "decode"
                        ? `${systemNames[system]} numeral`
                        : lang === "th"
                          ? q.prompt_th || q.prompt
                          : q.prompt}
                    </p>
                    {q.representation && (
                      <div className="large-numeral">
                        <Numeral value={q.representation} system={system} />
                      </div>
                    )}
                    {activity === "decode" && (
                      <label className="answer-field">
                        {t("answerLabel")}
                        <div className="answer-row">
                          <input
                            ref={inputRef}
                            autoFocus
                            required
                            inputMode="numeric"
                            pattern="[0-9]+"
                            value={answer}
                            disabled={!!feedback}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Your answer"
                            aria-label={t("answerLabel")}
                          />
                          <Button
                            type="submit"
                            disabled={busy || !!feedback || !answer}
                          >
                            {busy ? (
                              <LoaderCircle size={17} className="spin" />
                            ) : (
                              t("check")
                            )}
                          </Button>
                        </div>
                      </label>
                    )}
                    {isAstrology && (
                      <div
                        className="astrology-choices"
                        role="radiogroup"
                        aria-label={
                          lang === "th" ? "เลือกคำตอบ" : "Choose an answer"
                        }
                      >
                        {q.choices.map((choice, i) => (
                          <button
                            type="button"
                            role="radio"
                            aria-checked={answer === choice}
                            disabled={!!feedback}
                            className={answer === choice ? "selected" : ""}
                            key={choice}
                            onClick={() => setAnswer(choice)}
                          >
                            <span>{"ABCD"[i]}</span>
                            {lang === "th"
                              ? q.choices_th?.[i] || choice
                              : choice}
                          </button>
                        ))}
                      </div>
                    )}
                    {q.symbols && (
                      <div className="match-questions">
                        {q.symbols.map((value, i) => (
                          <div className="match-question" key={i}>
                            <Numeral value={value} system={system} small />
                            <ArrowRight size={18} />
                            <select
                              required
                              disabled={!!feedback}
                              aria-label={"Modern value for symbol " + (i + 1)}
                              value={matches[i]}
                              onChange={(e) =>
                                setMatches((x) =>
                                  x.map((v, j) =>
                                    i === j ? e.target.value : v,
                                  ),
                                )
                              }
                            >
                              <option value="">Choose a value</option>
                              {q.options?.map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.events && (
                      <ol className="timeline-questions">
                        {order.map((original, i) => (
                          <li key={original}>
                            <span className="timeline-position">{i + 1}</span>
                            <span>
                              <strong>{q.events![original].label}</strong>
                              <small>{q.events![original].year}</small>
                            </span>
                            <div>
                              <button
                                type="button"
                                disabled={i === 0 || !!feedback}
                                className="icon-button"
                                aria-label={
                                  "Move " +
                                  q.events![original].label +
                                  " earlier"
                                }
                                onClick={() =>
                                  setOrder((x) => {
                                    const n = [...x];
                                    [n[i - 1], n[i]] = [n[i], n[i - 1]];
                                    return n;
                                  })
                                }
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button
                                type="button"
                                disabled={i === 3 || !!feedback}
                                className="icon-button"
                                aria-label={
                                  "Move " + q.events![original].label + " later"
                                }
                                onClick={() =>
                                  setOrder((x) => {
                                    const n = [...x];
                                    [n[i + 1], n[i]] = [n[i], n[i + 1]];
                                    return n;
                                  })
                                }
                              >
                                <ArrowUp size={16} className="rotate-180" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                    {q.date_parts && (
                      <div className="date-questions">
                        {q.date_parts.map((value, i) => (
                          <label key={i}>
                            <span>{["Day", "Month", "Year"][i]}</span>
                            <div className="date-numeral">
                              <Numeral value={value} system={system} small />
                            </div>
                            <input
                              type="number"
                              required
                              min={i === 2 ? 1900 : 1}
                              max={i === 2 ? 2026 : i === 1 ? 12 : 31}
                              value={date[i]}
                              disabled={!!feedback}
                              onChange={(e) =>
                                setDate((x) =>
                                  x.map((v, j) =>
                                    j === i ? e.target.value : v,
                                  ),
                                )
                              }
                            />
                          </label>
                        ))}
                      </div>
                    )}
                    {activity !== "decode" && !feedback && (
                      <Button
                        type="submit"
                        disabled={
                          busy ||
                          (isAstrology && !answer) ||
                          (activity === "match" && matches.some((x) => !x))
                        }
                      >
                        {t("check")}
                        <Check size={17} />
                      </Button>
                    )}
                    <button
                      className="hint-button"
                      type="button"
                      onClick={() => setHint(!hint)}
                    >
                      <Lightbulb size={16} />
                      {hint
                        ? lang === "th"
                          ? "ซ่อนคำใบ้"
                          : "Hide hint"
                        : t("hint")}
                    </button>
                    {hint && (
                      <div className="hint-box">
                        {lang === "th" ? q.hint_th || q.hint : q.hint}
                      </div>
                    )}
                    {feedback && (
                      <div
                        className={
                          "answer-feedback " +
                          (feedback.correct ? "correct" : "incorrect")
                        }
                        role="status"
                      >
                        {feedback.correct ? (
                          <CheckCircle2 size={28} />
                        ) : (
                          <Lightbulb size={26} />
                        )}
                        <div>
                          <h3>
                            {t(feedback.correct ? "correct" : "incorrect")}
                          </h3>
                          <p>{feedback.explanation}</p>
                          {!feedback.correct && (
                            <p>
                              <strong>
                                {lang === "th" ? "คำตอบ" : "Answer"}:{" "}
                                {feedback.answer}
                              </strong>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </form>
                  {feedback && (
                    <div className="next-question">
                      <span>
                        {score} {lang === "th" ? "คำตอบถูก" : "correct answers"}
                        <Star size={15} />
                      </span>
                      <Button onClick={next} disabled={busy}>
                        {t(
                          index === run!.questions.length - 1
                            ? "seeResults"
                            : "nextQuestion",
                        )}
                        <ArrowRight size={17} />
                      </Button>
                    </div>
                  )}
                </>
              )
            )}
            {error && <ErrorNote message={error} />}
          </>
        )}
      </main>
      <aside className="right-rail game-rail">
        {isAstrology ? (
          <div className="astrology-reference">
            <Sparkles size={27} />
            <h3>{t("astrology")}</h3>
            <p>
              {lang === "th"
                ? "๑ อาทิตย์ · ๒ จันทร์ · ล ลัคนา"
                : "๑ Sun · ๒ Moon · ล Ascendant"}
            </p>
            <p>
              {lang === "th"
                ? "12 ราศี ราศีละ 30° ลัคนาอยู่ที่ขอบฟ้าตะวันออก"
                : "12 signs, 30° each. The ascendant is on the eastern horizon."}
            </p>
            <a href="#/learn/thai-astrology">
              {t("returnLearn")} <ArrowRight size={18} />
            </a>
            <a href="#/chart">
              {t("birthReading")} <ArrowRight size={18} />
            </a>
          </div>
        ) : (
          <SystemReference system={system} />
        )}
        <p className="serif-quote">
          “
          {lang === "th"
            ? isAstrology
              ? "เรียนรู้ดวงดาว เข้าใจท้องฟ้า"
              : "ตัวเลขเป็นภาษาที่ข้ามกาลเวลา"
            : isAstrology
              ? "Explore the stars. Understand the sky."
              : "Numbers are a language\nacross time."}
          ”
        </p>
        <TutorPanel
          slug={
            isAstrology
              ? "thai-astrology"
              : system === "thai"
                ? "thai-numerals"
                : system
          }
          compact
        />
        {run && !result && (
          <button className="text-button" onClick={() => go("/play")}>
            {lang === "th" ? "ออกจากการฝึก" : "Exit practice"}
          </button>
        )}
      </aside>
    </>
  );
}

function GameResults({
  result,
  retry,
}: {
  result: GameResult;
  retry: () => void;
}) {
  const { lang, t, go } = useApp();
  const [missed, setMissed] = useState(true);
  return (
    <div className="game-results">
      <div className="result-emblem">
        <Trophy size={35} strokeWidth={1.3} />
      </div>
      <span className="small-label">{t("complete")}</span>
      <h1>
        {lang === "th" ? "เก่งขึ้นอีกนิดแล้ว" : "A little wiser already."}
      </h1>
      <p>
        {lang === "th"
          ? "ทุกคำถามเป็นอีกโอกาสในการเรียนรู้"
          : "Every question is another connection made."}
      </p>
      <div className="final-score">
        {result.score}
        <span>/ {result.total}</span>
      </div>
      <div className="result-stats">
        <span>
          <CheckCircle2 size={17} />
          {result.score} {lang === "th" ? "คำตอบถูก" : "correct"}
        </span>
        <span>
          <Lightbulb size={17} />
          {result.total - result.score}{" "}
          {lang === "th" ? "ข้อที่ควรทบทวน" : "to revisit"}
        </span>
      </div>
      <div className="result-actions">
        <Button onClick={retry}>
          {t("retry")}
          <ArrowRight size={16} />
        </Button>
        <Button secondary onClick={() => go("/play")}>
          {t("returnPlay")}
        </Button>
      </div>
      <div className="review-heading">
        <h2>{lang === "th" ? "ทบทวนคำตอบ" : "Keep the learning going"}</h2>
        <button className="text-button" onClick={() => setMissed(!missed)}>
          {t(missed ? "all" : "missed")}
        </button>
      </div>
      {result.answers
        .filter((a) => !missed || !a.correct)
        .map((a, i) => (
          <div className="review-item" key={i}>
            {a.correct ? <CheckCircle2 size={19} /> : <Lightbulb size={19} />}
            <div>
              <strong>
                {result.system === "astrology" ? (
                  lang === "th" ? (
                    a.prompt_th || a.prompt
                  ) : (
                    a.prompt
                  )
                ) : a.representation ? (
                  <Numeral
                    value={a.representation}
                    system={result.system}
                    small
                  />
                ) : (
                  a.prompt
                )}
              </strong>
              <p>
                {lang === "th"
                  ? a.explanation_th || a.explanation
                  : a.explanation}
              </p>
              <small>
                {lang === "th" ? "คำตอบของคุณ" : "Your answer"}:{" "}
                {lang === "th" ? a.submitted_th || a.submitted : a.submitted}
              </small>
            </div>
          </div>
        ))}
      {missed && result.score === result.total && (
        <div className="perfect-note">
          <Star size={23} />
          <p>
            {lang === "th"
              ? "ถูกทุกข้อ! ลองระดับที่ท้าทายขึ้น"
              : "A perfect round! Try a new system or a higher difficulty."}
          </p>
        </div>
      )}
    </div>
  );
}

function ChartPage() {
  const { lang, t, go } = useApp();
  const [date, setDate] = useState(""),
    [time, setTime] = useState(""),
    [city, setCity] = useState("Bangkok, Thailand"),
    [fold, setFold] = useState(""),
    [result, setResult] = useState<ChartResult | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [resultLanguage, setResultLanguage] = useState<Language | null>(null),
    [translating, setTranslating] = useState(false),
    [translationError, setTranslationError] = useState("");
  const chartRequestId = useRef(0);
  const canonicalResult = useRef<ChartResult | null>(null);
  const readingsByLanguage = useRef<Partial<Record<Language, ChartResult>>>({});
  const [activeReading, setActiveReading] = useState<
    "love" | "career_money" | "opportunities" | "challenges"
  >("love");
  const { data: locations } = useData<
    { id: string; name: string; name_th: string; timezone: string }[]
  >("/astrology/locations");
  const chosen = locations?.find((l) => l.name === city || l.name_th === city);
  const chartRole = (body: string) =>
    lang === "th"
      ? ({ Sun: "แก่นตัวตน", Moon: "ด้านความรู้สึก", Ascendant: "วิธีเริ่มต้น" }[body] || body)
      : ({ Sun: "Identity", Moon: "Emotional needs", Ascendant: "Approach" }[body] || body);
  const readingSections = [
    { key: "love", icon: Heart, title: lang === "th" ? "ความรัก" : "Love" },
    { key: "career_money", icon: Briefcase, title: lang === "th" ? "งานและเงิน" : "Work & money" },
    { key: "opportunities", icon: Coins, title: lang === "th" ? "โอกาส" : "Opportunity" },
    { key: "challenges", icon: Compass, title: lang === "th" ? "สิ่งที่ควรระวัง" : "Challenges" },
  ] as const;
  const selectedReading = readingSections.find(({ key }) => key === activeReading);
  useEffect(() => {
    if (!canonicalResult.current || !resultLanguage || resultLanguage === lang) return;

    const cachedReading = readingsByLanguage.current[lang];
    if (cachedReading) {
      setResult(cachedReading);
      setResultLanguage(lang);
      setTranslationError("");
      setTranslating(false);
      return;
    }

    const requestId = ++chartRequestId.current;
    let active = true;
    const source = canonicalResult.current;
    if (!source) return;
    setTranslating(true);
    setTranslationError("");
    api<{
      reading: NonNullable<ChartResult["reading"]>;
      overall: string;
    }>("/astrology/translate-reading", "POST", {
      language: lang,
      reading: {
        personality:
          source.reading?.personality ||
          source.personality_th ||
          source.personality ||
          source.overall_th ||
          source.overall,
        love: source.reading?.love || "",
        career_money: source.reading?.career_money || "",
        opportunities: source.reading?.opportunities || "",
        challenges: source.reading?.challenges || "",
      },
      overall: source.overall,
    })
      .then((translatedText) => {
        if (!active || requestId !== chartRequestId.current) return;
        const translated: ChartResult = {
          ...source,
          reading: translatedText.reading,
          personality: lang === "en" ? translatedText.reading.personality : source.personality,
          personality_th: lang === "th" ? translatedText.reading.personality : source.personality_th,
          overall: lang === "en" ? translatedText.overall : source.overall,
          overall_th: lang === "th" ? translatedText.overall : source.overall_th,
        };
        readingsByLanguage.current[lang] = translated;
        setResult(translated);
        setResultLanguage(lang);
      })
      .catch(() => {
        if (!active || requestId !== chartRequestId.current) return;
        setTranslationError(
          lang === "th"
            ? "แปลคำอ่านไม่สำเร็จ ลองเปลี่ยนภาษาอีกครั้ง"
            : "Could not translate the reading. Try switching languages again.",
        );
      })
      .finally(() => {
        if (active && requestId === chartRequestId.current) setTranslating(false);
      });

    return () => {
      active = false;
    };
  }, [lang, resultLanguage]);

  async function generate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setTranslationError("");
    setResultLanguage(null);
    setTranslating(false);
    canonicalResult.current = null;
    readingsByLanguage.current = {};
    chartRequestId.current += 1;
    try {
      if (!chosen) throw new Error("Choose a birthplace from the city list.");
      const chartInput = {
        birth_date: date,
        birth_time: time,
        location_id: chosen.id,
        fold: fold === "" ? null : +fold,
      };
      const chart = await api<ChartResult>("/astrology/chart", "POST", {
        ...chartInput,
        language: lang,
      });
      canonicalResult.current = chart;
      readingsByLanguage.current = { [lang]: chart };
      setResultLanguage(lang);
      setResult(chart);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="chart-page">
      <div className="breadcrumb">
        <a href="#/learn/thai-astrology">{t("learn")}</a>
        <ChevronRight size={13} />
        {t("birthReading")}
      </div>
      <PageTitle
        title={t("birthReading")}
        subtitle={
          lang === "th"
            ? "ใส่วันเกิด เวลาเกิด และสถานที่เกิด เพื่ออ่านราศีอาทิตย์ จันทร์ และลัคนาของคุณ"
            : "A map of the sky at your moment in time. A new perspective to explore."
        }
      >
        <Button secondary onClick={() => go("/learn/thai-astrology")}>
          <BookOpen size={16} />
          {lang === "th" ? "เรียนรู้พื้นฐาน" : "Learn the foundations"}
        </Button>
      </PageTitle>
      <div className="chart-layout">
        <div className="birth-form-column">
          <form className="birth-form" onSubmit={generate}>
            <h2>{lang === "th" ? "ช่วงเวลาของคุณ" : "Your moment in time"}</h2>
            <p>
              {lang === "th"
                ? "เริ่มด้วยรายละเอียดเพียงเล็กน้อย"
                : "Begin with a few details."}
            </p>
            <label>
              {t("birthDate")}
              <div className="input-with-icon">
                <CalendarDays size={17} />
                <input
                  required
                  type="date"
                  min="1900-01-01"
                  max={new Date().toLocaleDateString("en-CA")}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </label>
            <label>
              {t("birthTime")}
              <div className="input-with-icon">
                <Clock3 size={17} />
                <input
                  required
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </label>
            <label>
              {t("birthplace")}
              <div className="input-with-icon">
                <MapPin size={17} />
                <input
                  required
                  list="birthplaces"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Search a city…"
                  autoComplete="off"
                />
                <datalist id="birthplaces">
                  {locations?.map((l) => (
                    <option
                      key={l.id}
                      value={lang === "th" ? l.name_th : l.name}
                    >
                      {l.name} — {l.timezone}
                    </option>
                  ))}
                </datalist>
              </div>
            </label>
            <span className="timezone-note">
              {chosen?.timezone || "Choose one of the 20 supported cities."}
            </span>
            <label className="fold-label">
              {lang === "th"
                ? "เมื่อเวลาท้องถิ่นเกิดซ้ำ"
                : "If the clock time occurred twice"}
              <select value={fold} onChange={(e) => setFold(e.target.value)}>
                <option value="">Automatic</option>
                <option value="0">First occurrence</option>
                <option value="1">Second occurrence</option>
              </select>
            </label>
            {error && <ErrorNote message={error} />}
            <Button type="submit" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <>
                  {t("generate")}
                  <ArrowRight size={17} />
                </>
              )}
            </Button>
            <p className="privacy-note">
              <Info size={15} />
              {t("privacy")}
            </p>
          </form>
          <div className="chart-decoration">
            <TempleArt />
            <p className="serif-quote">
              “
              {lang === "th"
                ? "ท้องฟ้าเดียวกัน มุมมองใหม่เสมอ"
                : "The same sky,\nnew perspectives."}
              ”
            </p>
          </div>
        </div>
        <div className="chart-wheel-column">
          <ZodiacWheel language={lang} placements={result?.placements} />
          {result ? (
            <div className="placement-legend">
              {result.placements.map((p) => (
                <span key={p.body}>
                  <b>{p.number}</b>
                  {p.body} {p.symbol}
                </span>
              ))}
            </div>
          ) : (
            <p className="wheel-empty">
              <Sun size={16} />
              {lang === "th"
                ? "แผนผังของคุณจะปรากฏที่นี่"
                : "Your Sun, Moon, and rising sign will find their place here."}
            </p>
          )}
          {result && (
            <section className="personality-summary chart-personality">
              <p className="personality-kicker">
                {lang === "th"
                  ? "อิงจากอาทิตย์ จันทร์ และลัคนา"
                  : "Based on Sun, Moon, and Ascendant"}
              </p>
              <h3>
                <Star size={22} strokeWidth={1.4} />
                {lang === "th" ? "ภาพรวมบุคลิกของคุณ" : "Your personality"}
              </h3>
              <div className="personality-intro">
                {readingParagraphs(
                  lang === "th"
                    ? result.reading?.personality || result.personality_th || result.overall_th || ""
                    : result.reading?.personality || result.personality || result.overall,
                ).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              {result.profile?.length ? (
                <div className="personality-traits">
                  <div className="personality-trait-group strengths">
                    <h4>
                      <Sparkles size={15} />
                      {lang === "th" ? "จุดแข็งที่อาจเด่น" : "Possible strengths"}
                    </h4>
                    <ul>
                      {result.profile.map((p) => (
                        <li key={p.body}>
                          <b>{chartRole(p.body)} · {lang === "th" ? p.sign_th : p.sign}</b>
                          <span>{lang === "th" ? p.strength_th : p.strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="personality-trait-group watchouts">
                    <h4>
                      <Compass size={15} />
                      {lang === "th" ? "เรื่องที่ควรสังเกต" : "Things to watch"}
                    </h4>
                    <ul>
                      {result.profile.map((p) => (
                        <li key={p.body}>
                          <b>{chartRole(p.body)} · {lang === "th" ? p.sign_th : p.sign}</b>
                          <span>{lang === "th" ? p.watchout_th : p.watchout}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </section>
          )}
          <details className="method-note">
            <summary>
              {lang === "th" ? "เกี่ยวกับการคำนวณนี้" : "About this chart"}
              <Info size={14} />
            </summary>
            <p>
              {result?.method ||
                "An educational sidereal model using calculated celestial positions, an approximate Lahiri offset, and city-centre coordinates. This is an introduction, not a traditional Thai ephemeris."}
            </p>
          </details>
        </div>
        <aside className="reading-panel">
          <div className="reading-panel-heading">
            <div>
              <h2>{t("reading")}</h2>
              <p className="reading-subtitle">{t("reflection")}</p>
            </div>
            {result && (
              <span className={`reading-mode-badge ${result.reading_mode || "chart-guide"}`} aria-live="polite">
                {translating
                  ? lang === "th" ? "กำลังแปลคำอ่าน" : "Translating reading"
                  : result.reading_mode === "ai"
                  ? lang === "th" ? "AI อ่านผังดาว" : "AI reading"
                  : result.reading_mode === "fallback"
                    ? lang === "th" ? "คำอ่านพื้นฐาน" : "Basic guide"
                    : lang === "th" ? "คำอ่านจากแผนผัง" : "Chart guide"}
              </span>
            )}
          </div>
          {result ? (
            <>
              <div className="reading-tabs" aria-label={lang === "th" ? "เลือกหัวข้อคำอ่าน" : "Choose a reading topic"}>
                {readingSections.map(({ key, icon: Icon, title }) => (
                  <button
                    type="button"
                    className={`reading-tab ${activeReading === key ? "active" : ""}`}
                    aria-pressed={activeReading === key}
                    onClick={() => setActiveReading(key)}
                    key={key}
                  >
                    <Icon size={16} strokeWidth={1.7} />
                    <span>{title}</span>
                  </button>
                ))}
              </div>
              <section className="reading-tab-panel" aria-live="polite">
                {selectedReading && (
                  <h3>
                    <selectedReading.icon size={19} strokeWidth={1.6} />
                    {selectedReading.title}
                  </h3>
                )}
                <div className="reading-copy">
                  {readingParagraphs(
                    result.reading?.[activeReading] ||
                      (lang === "th" ? "ยังไม่มีคำอ่านสำหรับหัวข้อนี้" : "No reading is available for this topic yet."),
                  ).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </section>
              <details className="placement-reflections">
                <summary>
                  <span>{lang === "th" ? "ดูอาทิตย์ จันทร์ และลัคนา" : "Explore Sun, Moon, and Ascendant"}</span>
                  <ChevronDown size={16} />
                </summary>
                <div className="placement-reflection-list">
                  {result.placements.map((p, i) => {
                    const Icon = [Sun, Moon, ArrowUp][i] || Sun;
                    return (
                      <article className="reading-item" key={p.body}>
                        <Icon size={23} strokeWidth={1.2} />
                        <div>
                          <h3>
                            {lang === "th"
                              ? { Sun: "อาทิตย์", Moon: "จันทร์", Ascendant: "ลัคนา" }[p.body] || p.body
                              : p.body}{" "}
                            {lang === "th" ? "ในราศี" + p.sign_th : "in " + p.sign}
                          </h3>
                          <small>{p.degree.toFixed(1)}° {lang === "th" ? p.sign_th : p.sign}</small>
                          <p>{lang === "th" ? p.reflection_th : p.reflection}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </details>
              {translationError && (
                <p className="reading-status-note" role="status">{translationError}</p>
              )}
            </>
          ) : (
            <div className="empty-reading">
              <SunSeal size={76} />
              <h3>
                {lang === "th"
                  ? "แต่ละแผนผังมีจุดเริ่มต้น"
                  : "Every chart begins with a moment."}
              </h3>
              <p>
                {lang === "th"
                  ? "กรอกรายละเอียดแล้วค้นพบตำแหน่งอาทิตย์ จันทร์ และลัคนา"
                  : "Enter your details to discover your calculated Sun, Moon, and Ascendant placements."}
              </p>
            </div>
          )}
          <a className="chart-tutor-link" href="#/tutor/thai-astrology">
            <MessageCircle size={17} />
            <span>
              <strong>{t("tutor")}</strong>
              <small>
                {lang === "th"
                  ? "ถามต่อเกี่ยวกับแผนผังของคุณ"
                  : "Ask about your chart"}
              </small>
            </span>
            <ArrowRight size={15} />
          </a>
        </aside>
      </div>
    </main>
  );
}

function ProfilePage() {
  const { lang, t, go, user } = useApp();
  const {
    data: profile,
    error,
    loading,
    reload,
  } = useData<Profile>("/profile");
  const completed = profile?.progress.filter((p) => p.completed).length || 0;
  return (
    <main className="profile-page">
      <div className="breadcrumb">
        <GraduationCap size={16} />
        {t("student")}
      </div>
      <PageTitle
        title={t("profile")}
        subtitle={
          lang === "th"
            ? "ทุกความสงสัยพาคุณไปได้ไกลขึ้น"
            : "Every bit of curiosity takes you a little further."
        }
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote message={error} retry={reload} />
      ) : (
        profile && (
          <>
            <div className="profile-overview">
              <span className="large-avatar">
                {user?.name[0].toUpperCase()}
              </span>
              <div>
                <h2>{user?.name}</h2>
                <p>
                  {user?.guest
                    ? lang === "th"
                      ? "ผู้เยี่ยมชม · ความก้าวหน้าผูกกับเบราว์เซอร์นี้"
                      : "Guest explorer · Progress linked to this browser"
                    : "Student account"}
                </p>
              </div>
              <div className="profile-stat">
                <strong>
                  {completed}
                  <span>/ 5</span>
                </strong>
                <span>
                  {t("lessons")} {t("complete").toLowerCase()}
                </span>
              </div>
              <div className="profile-stat">
                <strong>{profile.completed_games}</strong>
                <span>{t("games")}</span>
              </div>
            </div>
            <div className="profile-content">
              <section>
                <h2>
                  <BookOpen size={21} />
                  {t("progress")}
                </h2>
                <div className="learning-paths">
                  {Object.entries(topicNames).map(([slug, names]) => {
                    const p = profile.progress.find((p) => p.slug === slug);
                    const total = slug === "thai-astrology" ? 12 : 6;
                    const percent = p?.completed
                      ? 100
                      : p
                        ? Math.round(((p.slide + 1) / total) * 100)
                        : 0;
                    return (
                      <button
                        key={slug}
                        className="learning-path"
                        onClick={() => go("/learn/" + slug)}
                      >
                        <span className="path-icon">
                          {p?.completed ? (
                            <CheckCircle2 size={22} />
                          ) : (
                            <BookOpen size={22} />
                          )}
                        </span>
                        <span>
                          <strong>{names[lang === "th" ? 1 : 0]}</strong>
                          <div className="progress-track">
                            <i style={{ width: percent + "%" }} />
                          </div>
                        </span>
                        <small>{percent}%</small>
                        <ChevronRight size={17} />
                      </button>
                    );
                  })}
                </div>
              </section>
              <section>
                <h2>
                  <Gamepad2 size={21} />
                  {t("games")}
                </h2>
                {profile.games.length ? (
                  profile.games.map((game) => (
                    <div className="history-item" key={game.id}>
                      <div>
                        <strong>{t(game.activity)}</strong>
                        <span>
                          {systemNames[game.system]} ·{" "}
                          {new Date(game.date).toLocaleDateString(
                            lang === "th" ? "th-TH" : "en-GB",
                            { day: "numeric", month: "short" },
                          )}
                        </span>
                      </div>
                      <strong>
                        {game.score}
                        <small> / {game.total}</small>
                      </strong>
                    </div>
                  ))
                ) : (
                  <div className="empty-history">
                    <Gamepad2 size={30} strokeWidth={1} />
                    <p>
                      {lang === "th"
                        ? "คำถามแรกของคุณรออยู่"
                        : "Your first little challenge is waiting."}
                    </p>
                    <button className="text-link" onClick={() => go("/play")}>
                      {t("start")}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                <h2 className="quiz-history-title">
                  <Trophy size={21} />
                  {t("quizzes")}
                </h2>
                {profile.quizzes.length ? (
                  profile.quizzes.map((q) => (
                    <button
                      className="history-item quiz-history"
                      key={q.id}
                      onClick={() => go("/quiz/" + q.code)}
                    >
                      <div>
                        <strong>Room {q.code}</strong>
                        <span>{q.answered} questions answered</span>
                      </div>
                      <strong>
                        {q.correct}
                        <small> / 10</small>
                      </strong>
                    </button>
                  ))
                ) : (
                  <div className="empty-history">
                    <Users size={27} strokeWidth={1} />
                    <p>
                      {lang === "th"
                        ? "เรียนรู้ด้วยกันได้ในควิซทีม"
                        : "Learning is even better together."}
                    </p>
                    <button className="text-link" onClick={() => go("/quiz")}>
                      {t("quiz")}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </section>
            </div>
          </>
        )
      )}
    </main>
  );
}
