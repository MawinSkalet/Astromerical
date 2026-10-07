import {
  memo,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { Language, QuizRank } from "./types";

type ArenaTeam = {
  letter: string;
  size?: number;
  responses?: number;
  power?: number;
  players?: { id: string; name: string; ready: boolean }[];
};
type Mode = "idle" | "lobby" | "live" | "reveal";
type Point = [number, number];

export const constellations = [
  {
    letter: "A",
    en: "Aries",
    th: "เมษ",
    color: "#ff929d",
    x: 185,
    y: 124,
    mark: "M20 34V16C20 3 4 4 5 15c0 6 8 9 10 3M20 16C20 3 36 4 35 15c0 6-8 9-10 3",
    stars: [
      [-65, 23],
      [-38, 7],
      [-9, -8],
      [25, -19],
      [53, -13],
      [68, 10],
    ] as Point[],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
  },
  {
    letter: "B",
    en: "Libra",
    th: "ตุล",
    color: "#60ded0",
    x: 815,
    y: 124,
    mark: "M5 32h30M5 23h9c-9-15 21-15 12 0h9",
    stars: [
      [-58, -6],
      [-18, -31],
      [26, -20],
      [57, 17],
      [7, 31],
      [-43, 22],
    ] as Point[],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [1, 4],
    ],
  },
  {
    letter: "C",
    en: "Leo",
    th: "สิงห์",
    color: "#f3cc75",
    x: 185,
    y: 338,
    mark: "M13 22c-11-2-12 13-3 13 14 0-3-27 10-29 8-1 12 8 8 14-6 9-1 15 7 10",
    stars: [
      [-67, 26],
      [-28, 10],
      [11, 20],
      [36, -3],
      [22, -28],
      [49, -35],
      [64, -14],
      [51, 9],
    ] as Point[],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 3],
      [1, 4],
    ],
  },
  {
    letter: "D",
    en: "Aquarius",
    th: "กุมภ์",
    color: "#b5a3ff",
    x: 815,
    y: 338,
    mark: "m4 14 6-5 7 6 7-6 7 6 5-5M4 29l6-5 7 6 7-6 7 6 5-5",
    stars: [
      [-68, -15],
      [-42, -29],
      [-15, -5],
      [14, -24],
      [42, -1],
      [68, -17],
      [-49, 23],
      [-19, 10],
      [14, 31],
      [49, 16],
    ] as Point[],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [6, 7],
      [7, 8],
      [8, 9],
      [2, 7],
    ],
  },
] as const;

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return reduced;
}

export function ConstellationMark({
  letter,
  className = "",
}: {
  letter: string;
  className?: string;
}) {
  const sign =
    constellations.find((entry) => entry.letter === letter) ||
    constellations[0];
  return (
    <svg
      className={`lq-constellation-mark ${className}`}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={sign.mark} />
    </svg>
  );
}

export function AnimatedScore({
  value,
  lang,
  decimals = 0,
  delay = 0,
  svg = false,
}: {
  value: number;
  lang: Language;
  decimals?: number;
  delay?: number;
  svg?: boolean;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    setShown(0);
    let frame = 0;
    let start: number | undefined;
    const animate = (time: number) => {
      start ??= time;
      const progress = Math.max(0, Math.min(1, (time - start - delay) / 2100));
      setShown(value * (1 - (1 - progress) ** 4));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced, delay]);
  const format = (number: number) =>
    number.toLocaleString(lang === "th" ? "th-TH" : "en-US", {
      maximumFractionDigits: decimals,
    });
  return svg ? (
    <tspan className="lq-animated-score" aria-label={format(value)}>
      {format(shown)}
    </tspan>
  ) : (
    <span className="lq-animated-score">
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

export function SubmissionSpark({ letter }: { letter: string }) {
  return (
    <span className={`lq-submission-spark team-${letter}`} aria-hidden="true">
      <svg viewBox="0 0 60 60" fill="none">
        <circle className="lq-spark-ring" cx="30" cy="30" r="23" />
        <path className="lq-spark-trace" d="m9 36 13-19 16 9 12-13" />
        <path
          className="lq-spark-star"
          d="m30 19 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"
        />
        <circle cx="9" cy="36" r="2" />
        <circle cx="22" cy="17" r="2" />
        <circle cx="50" cy="13" r="2" />
      </svg>
    </span>
  );
}

const skyStars = Array.from({ length: 85 }, (_, index) => ({
  x: (index * 137.508 + 29) % 1000,
  y: (index * 79.373 + 17) % 460,
  radius: index % 9 === 0 ? 1.5 : 0.65,
  opacity: 0.14 + (index % 5) * 0.1,
}));

function CometHead({
  x,
  y,
  centerY,
  color,
  glowId,
}: {
  x: number;
  y: number;
  centerY: number;
  color: string;
  glowId: string;
}) {
  const head = useRef<SVGGElement>(null);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const controlX = 500 + (x - 500) * 0.7;
    const controlY = y < centerY ? centerY + 10 : centerY - 20;
    const animate = (time: number) => {
      const progress = Math.min(1, (time - start) / 1100);
      const p = 1 - (1 - progress) ** 1.5;
      const px = (1 - p) ** 2 * 500 + 2 * (1 - p) * p * controlX + p ** 2 * x;
      const py =
        (1 - p) ** 2 * centerY + 2 * (1 - p) * p * controlY + p ** 2 * y;
      head.current?.setAttribute("transform", `translate(${px} ${py})`);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [x, y, centerY]);
  return (
    <g
      className="celestial-comet-head"
      ref={head}
      transform={`translate(500 ${centerY})`}
    >
      <circle r="10" fill={color} filter={`url(#${glowId})`} />
      <circle r="3.5" fill="#fff8df" />
    </g>
  );
}

const zodiacMarks = [
  constellations[0].mark,
  "M8 5c0 13 24 13 24 0M20 16a10 10 0 1 0 0 20 10 10 0 0 0 0-20",
  "M7 5q13 6 26 0M7 35q13-6 26 0M13 8v24M27 8v24",
  "M7 15a5 5 0 1 0 10 0 5 5 0 0 0-10 0M7 15C13 3 29 5 33 12M23 26a5 5 0 1 0 10 0 5 5 0 0 0-10 0M33 26C27 38 11 36 7 29",
  constellations[2].mark,
  "M6 32V12c0-8 9-8 9 0v20-20c0-8 9-8 9 0v16c0 13 12 9 12-3 0-9-12-8-12 1",
  constellations[1].mark,
  "M5 32V12c0-8 9-8 9 0v20-20c0-8 9-8 9 0v15q0 8 12 5m-5-5 5 5-5 4",
  "M8 32 32 8M20 8h12v12M10 18l12 12",
  "M5 11c8-9 9 12 9 19 0-20 11-23 11-9 0 21 13 13 11 5-2-7-15 0-16 10",
  constellations[3].mark,
  "M9 5q12 15 0 30M31 5q-12 15 0 30M5 20h30",
];

// This atlas displays participation only. Server points are read exclusively in reveal mode.
export const CelestialArena = memo(function CelestialArena({
  teams,
  mode = "idle",
  lang,
  roundKey = "",
  winners = [],
}: {
  teams: ArenaTeam[];
  mode?: Mode;
  lang: Language;
  roundKey?: string;
  winners?: string[];
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reduced = useReducedMotion();
  const th = lang === "th";
  const compact = mode === "live";
  const centerY = compact ? 140 : 230;
  const teamY = (sign: (typeof constellations)[number]) =>
    compact ? (sign.y < 230 ? 92 : 226) : sign.y;
  const [comets, setComets] = useState<{ team: number; key: number }[]>([]);
  const previous = useRef({
    round: roundKey,
    counts: teams.map((team) => team.responses || 0),
  });
  const serial = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const signature = teams
    .map((team) => `${team.letter}:${team.responses || 0}`)
    .join(",");

  useEffect(() => {
    const counts = constellations.map(
      (sign) =>
        teams.find((team) => team.letter === sign.letter)?.responses || 0,
    );
    if (mode === "live" && previous.current.round === roundKey && !reduced) {
      const incoming = counts.flatMap((count, team) =>
        count > (previous.current.counts[team] || 0)
          ? [{ team, key: ++serial.current }]
          : [],
      );
      if (incoming.length) {
        setComets((current) => [...current, ...incoming].slice(-12));
        const timer = setTimeout(() => {
          setComets((current) =>
            current.filter(
              (comet) => !incoming.some((entry) => entry.key === comet.key),
            ),
          );
          timers.current = timers.current.filter((entry) => entry !== timer);
        }, 1550);
        timers.current.push(timer);
      }
    } else if (
      previous.current.round !== roundKey ||
      mode !== "live" ||
      reduced
    ) {
      setComets([]);
    }
    previous.current = { round: roundKey, counts };
  }, [signature, roundKey, mode, reduced]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const title = th ? "วงโคจรแห่งความรู้" : "Celestial Orbit";
  return (
    <div
      className={`celestial-arena celestial-${mode} ${reduced ? "celestial-reduced" : ""}`}
    >
      <svg
        className="celestial-atlas"
        viewBox={compact ? "0 0 1000 280" : "0 0 1000 460"}
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>{title}</title>
        <desc id={`${id}-desc`}>
          {mode === "reveal"
            ? th
              ? `กลุ่มดาวผู้ชนะ: ${winners.join(", ")}`
              : `Winning constellations: ${winners.join(", ")}`
            : th
              ? "กลุ่มดาวสี่ทีมรอบดวงอาทิตย์ แสดงจำนวนผู้เล่นและการส่งคำตอบ"
              : "Four team constellations surround a sun, showing players and submitted answers."}
        </desc>
        <defs>
          <radialGradient id={`${id}-nebula`}>
            <stop stopColor="#27688a" stopOpacity=".3" />
            <stop offset="1" stopColor="#112b4d" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-halo`}>
            <stop stopColor="#f1d89b" stopOpacity=".27" />
            <stop offset=".38" stopColor="#d6ad60" stopOpacity=".1" />
            <stop offset="1" stopColor="#e9c87e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-sun`} cx="38%" cy="32%">
            <stop stopColor="#fff8d9" />
            <stop offset=".48" stopColor="#f4d38c" />
            <stop offset="1" stopColor="#b87f36" />
          </radialGradient>
          <filter
            id={`${id}-glow`}
            x="-150%"
            y="-150%"
            width="400%"
            height="400%"
          >
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter
            id={`${id}-sun-glow`}
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="10" />
          </filter>
          {constellations.map((sign) => (
            <linearGradient
              key={sign.letter}
              id={`${id}-trail-${sign.letter}`}
              x1="500"
              y1={centerY}
              x2={sign.x}
              y2={teamY(sign)}
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f1d89b" stopOpacity="0" />
              <stop offset=".55" stopColor={sign.color} stopOpacity=".6" />
              <stop offset="1" stopColor={sign.color} />
            </linearGradient>
          ))}
        </defs>

        <ellipse
          cx="500"
          cy={centerY}
          rx="460"
          ry={compact ? 140 : 220}
          fill={`url(#${id}-nebula)`}
        />
        <g fill="#d9e8f0" aria-hidden="true">
          {skyStars.map((star, index) => (
            <circle
              key={index}
              cx={star.x}
              cy={compact ? star.y % 280 : star.y}
              r={star.radius}
              opacity={star.opacity}
            />
          ))}
        </g>
        <g
          className="celestial-orbits"
          fill="none"
          stroke="#d4bc83"
          transform={
            compact
              ? "translate(500 140) scale(1 .6) translate(-500 -230)"
              : undefined
          }
        >
          <ellipse cx="500" cy="230" rx="406" ry="175" opacity=".12" />
          <ellipse cx="500" cy="230" rx="299" ry="113" opacity=".17" />
          <ellipse
            cx="500"
            cy="230"
            rx="211"
            ry="68"
            transform="rotate(-24 500 230)"
            opacity=".17"
          />
          <ellipse
            cx="500"
            cy="230"
            rx="211"
            ry="68"
            transform="rotate(24 500 230)"
            opacity=".13"
          />
          <path
            d="M55 230h270m350 0h270M500 28v68m0 268v68"
            opacity=".1"
            strokeDasharray="2 8"
          />
        </g>
        <g
          className="celestial-zodiac-ring"
          transform={`translate(500 ${centerY}) ${compact ? "scale(.75)" : ""}`}
          aria-hidden="true"
        >
          <circle r="107" fill="none" stroke="#d4bc83" strokeOpacity=".16" />
          <circle r="113" fill="none" stroke="#d4bc83" strokeOpacity=".1" />
          {Array.from({ length: 60 }, (_, index) => (
            <path
              key={index}
              d={`M0 -${index % 5 ? 108 : 105}v${index % 5 ? -3 : -9}`}
              transform={`rotate(${index * 6})`}
              stroke="#e9cd8f"
              strokeOpacity={index % 5 ? ".16" : ".45"}
            />
          ))}
          {zodiacMarks.map((mark, index) => {
            const angle = ((index * 30 - 90) * Math.PI) / 180;
            return (
              <g
                key={index}
                transform={`translate(${Math.cos(angle) * 91 - 6.5} ${Math.sin(angle) * 91 - 6.5}) scale(.325)`}
                fill="none"
                stroke="#e9cd8f"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity=".8"
              >
                <path d={mark} />
              </g>
            );
          })}
        </g>
        <circle
          cx="500"
          cy={centerY}
          r={compact ? 115 : 148}
          fill={`url(#${id}-halo)`}
        />
        <g className="celestial-solar-reveal" fill="none" stroke="#ffe2a2">
          <circle cx="500" cy="230" r="50" />
          <circle cx="500" cy="230" r="50" />
        </g>
        {mode === "reveal" && (
          <g
            className="celestial-victory-burst"
            transform="translate(500 230)"
            fill="none"
            stroke="#f1d89b"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            {Array.from({ length: 24 }, (_, index) => (
              <path
                key={index}
                d={`M0 -${58 + (index % 3) * 9}v-${65 + (index % 4) * 12}`}
                transform={`rotate(${index * 15})`}
                pathLength="1"
              />
            ))}
          </g>
        )}
        <g className="celestial-sun" transform={`translate(500 ${centerY})`}>
          <circle
            r="42"
            fill="#f1ca75"
            opacity=".3"
            filter={`url(#${id}-sun-glow)`}
          />
          <g
            className="celestial-corona"
            stroke="#eacc89"
            strokeLinecap="round"
          >
            {Array.from({ length: 24 }, (_, index) => (
              <path
                key={index}
                d={`M0 -42v-${index % 2 ? 9 : 19}`}
                transform={`rotate(${index * 15})`}
                opacity={index % 2 ? ".45" : ".7"}
                strokeWidth={index % 2 ? 1 : 1.3}
              />
            ))}
          </g>
          <circle r="35" fill={`url(#${id}-sun)`} />
          <circle r="29" fill="none" stroke="#fff4c3" strokeOpacity=".5" />
          <g stroke="#855e31" fill="none" strokeWidth=".9" opacity=".8">
            <circle r="9" />
            {Array.from({ length: 12 }, (_, index) => (
              <path
                key={index}
                d="M0 -14v-10m-2 5 2-5 2 5"
                transform={`rotate(${index * 30})`}
              />
            ))}
          </g>
        </g>
        <text
          className="celestial-center-title"
          x="500"
          y={compact ? 257 : 386}
          textAnchor="middle"
        >
          {title}
        </text>
        <text
          className="celestial-center-note"
          x="500"
          y="408"
          textAnchor="middle"
        >
          {mode === "reveal"
            ? th
              ? "ทุกคำตอบ กลายเป็นแสงของทีม"
              : "Every answer becomes your team's light"
            : mode === "live"
              ? th
                ? "ส่งคำตอบ แล้วเติมแสงให้กลุ่มดาว"
                : "Send an answer. Light up your constellation."
              : th
                ? "สี่กลุ่มดาว หนึ่งจักรวาลแห่งความรู้"
                : "Four constellations. One universe of knowledge."}
        </text>

        {constellations.map((sign, index) => {
          const team = teams.find((entry) => entry.letter === sign.letter);
          const size = team?.size || 0;
          const responses = team?.responses || 0;
          const ready =
            team?.players?.filter((player) => player.ready).length || 0;
          const ratio =
            mode === "idle" || mode === "reveal"
              ? 1
              : mode === "live"
                ? size
                  ? responses / size
                  : 0
                : size
                  ? Math.max(0.25, ready / size)
                  : 0;
          const lit = Math.ceil(ratio * sign.stars.length);
          const winner = mode === "reveal" && winners.includes(sign.letter);
          const arrival = comets.some((comet) => comet.team === index);
          const edges = sign.edges
            .map(
              ([from, to]) =>
                `M${sign.stars[from][0]} ${sign.stars[from][1]}L${sign.stars[to][0]} ${sign.stars[to][1]}`,
            )
            .join(" ");
          return (
            <g
              key={sign.letter}
              className={`celestial-constellation ${winner ? "is-winner" : ""} ${arrival ? "has-arrival" : ""}`}
              transform={`translate(${sign.x} ${teamY(sign)})`}
              style={
                {
                  "--star-color": sign.color,
                  "--reveal-delay": `${index * 130 + 100}ms`,
                } as CSSProperties
              }
            >
              <ellipse
                className="celestial-team-aura"
                rx="115"
                ry="70"
                fill={sign.color}
                opacity={winner ? 0.09 : 0.025}
                filter={`url(#${id}-sun-glow)`}
              />
              <g className="celestial-team-label" transform="translate(0 -65)">
                <rect
                  x="-57"
                  y="-16"
                  width="27"
                  height="27"
                  rx="13.5"
                  fill={sign.color}
                  fillOpacity=".14"
                  stroke={sign.color}
                  strokeOpacity=".3"
                />
                <text
                  x="-43.5"
                  y="3"
                  textAnchor="middle"
                  fill={sign.color}
                  fontSize="14"
                  fontWeight="700"
                >
                  {sign.letter}
                </text>
                <text x="-20" y="3" fill="#e3eaf1" fontSize="17">
                  {th ? sign.th : sign.en}
                </text>
                {winner && (
                  <path
                    className="celestial-crown"
                    d="m-12-29-5-12 11 5 6-11 6 11 11-5-5 12Z"
                    fill={sign.color}
                  />
                )}
              </g>
              <path
                d={edges}
                fill="none"
                stroke={sign.color}
                strokeOpacity=".15"
                strokeWidth="1.2"
              />
              <path
                className="celestial-constellation-lines"
                d={edges}
                fill="none"
                stroke={sign.color}
                strokeOpacity={0.15 + ratio * 0.55}
                strokeWidth={winner ? 2 : 1.4}
                pathLength="1"
              />
              {sign.stars.map(([x, y], star) => (
                <g
                  key={star}
                  className={`celestial-star ${star < lit ? "is-lit" : ""}`}
                  transform={`translate(${x} ${y})`}
                >
                  <circle
                    className="celestial-star-glow"
                    r={star % 3 === 0 ? 11 : 7}
                    fill={sign.color}
                    filter={`url(#${id}-glow)`}
                  />
                  <circle
                    r={star % 3 === 0 ? 3.2 : 2.2}
                    fill={star < lit ? "#fff9e9" : sign.color}
                    opacity={star < lit ? 1 : 0.4}
                  />
                  {star % 3 === 0 && (
                    <path
                      d="M-7 0H7M0-7V7"
                      stroke={sign.color}
                      opacity={star < lit ? 0.8 : 0.25}
                      strokeWidth=".7"
                    />
                  )}
                </g>
              ))}
              <g className="celestial-member-stars">
                {Array.from({ length: Math.min(size, 32) }, (_, member) => {
                  const angle = ((member * 137.508 - 90) * Math.PI) / 180;
                  const radius = 63 + Math.floor(member / 9) * 8;
                  return (
                    <circle
                      key={team?.players?.[member]?.id || member}
                      cx={Math.cos(angle) * radius * 1.5}
                      cy={Math.sin(angle) * radius * 0.7}
                      r="1.6"
                      fill={sign.color}
                      opacity={
                        mode === "reveal" ||
                        member < responses ||
                        team?.players?.[member]?.ready
                          ? ".9"
                          : ".35"
                      }
                    />
                  );
                })}
              </g>
              <g className="celestial-team-detail" transform="translate(0 66)">
                {mode === "reveal" ? (
                  <text
                    textAnchor="middle"
                    fill={sign.color}
                    fontSize="22"
                    fontWeight="600"
                  >
                    {size ? (
                      <AnimatedScore
                        svg
                        value={team?.power || 0}
                        lang={lang}
                        decimals={1}
                        delay={350 + index * 130}
                      />
                    ) : (
                      "—"
                    )}
                  </text>
                ) : mode !== "idle" ? (
                  <text textAnchor="middle" fill={sign.color} fontSize="14">
                    {mode === "live"
                      ? `${responses} / ${size} ${th ? "ตอบแล้ว" : "answered"}`
                      : `${size} ${th ? "คน" : size === 1 ? "player" : "players"}`}
                  </text>
                ) : null}
                {mode === "reveal" && (
                  <text y="20" textAnchor="middle" fill="#a5b5c7" fontSize="11">
                    {size
                      ? th
                        ? "คะแนน / คน"
                        : "points / player"
                      : th
                        ? "ไม่มีผู้เล่น"
                        : "No players"}
                  </text>
                )}
              </g>
            </g>
          );
        })}

        {!reduced &&
          comets.map((comet) => {
            const sign = constellations[comet.team];
            const path = `M500 ${centerY} Q${500 + (sign.x - 500) * 0.7} ${sign.y < 230 ? centerY + 10 : centerY - 20} ${sign.x} ${teamY(sign)}`;
            return (
              <g
                className="celestial-comet"
                key={comet.key}
                data-team={sign.letter}
              >
                <path
                  className="celestial-comet-trail"
                  d={path}
                  pathLength="1"
                  fill="none"
                  stroke={`url(#${id}-trail-${sign.letter})`}
                  strokeWidth="2.5"
                />
                <CometHead
                  x={sign.x}
                  y={teamY(sign)}
                  centerY={centerY}
                  color={sign.color}
                  glowId={`${id}-glow`}
                />
                <circle
                  className="celestial-arrival-ring"
                  cx={sign.x}
                  cy={teamY(sign)}
                  r="25"
                  fill="none"
                  stroke={sign.color}
                />
              </g>
            );
          })}
      </svg>
    </div>
  );
});

export function CelestialPodium({
  leaders,
  lang,
  userId,
}: {
  leaders: QuizRank[];
  lang: Language;
  userId: string;
}) {
  const order = [leaders[1], leaders[0], leaders[2]].filter(Boolean);
  return (
    <ol
      className="lq-celestial-podium"
      aria-label={lang === "th" ? "ผู้เล่นสามอันดับแรก" : "Top three players"}
    >
      {order.map((person) => (
        <li
          key={person.id}
          className={`lq-podium-player lq-podium-rank-${person.rank} team-${person.team}`}
          style={
            {
              "--podium-delay": `${(3 - person.rank) * 170 + 350}ms`,
            } as CSSProperties
          }
        >
          <span className="lq-podium-emblem">
            <ConstellationMark letter={person.team} />
            {person.rank === 1 && (
              <svg
                className="lq-podium-crown"
                viewBox="0 0 36 26"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="m4 24-4-17 11 6 7-13 7 13 11-6-4 17Z" />
              </svg>
            )}
          </span>
          <strong title={person.name}>{person.name}</strong>
          {person.id === userId && (
            <small>{lang === "th" ? "คุณ" : "you"}</small>
          )}
          <small className="lq-podium-streak">
            {lang === "th" ? "ตอบถูกต่อเนื่อง" : "Best streak"} {person.streak}
          </small>
          <span className="lq-podium-score">
            <AnimatedScore value={person.points} lang={lang} delay={500} />
          </span>
          <div className="lq-podium-plinth">
            <span>{person.rank}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
