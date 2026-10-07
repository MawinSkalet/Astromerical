import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

type TugTeam = {
  letter: string;
  power: number;
  correct?: number;
  size?: number;
};
const colors = ["#d35252", "#087f8c", "#b58a26", "#8761c3"];
const anchors = [
  [80, 82],
  [80, 348],
  [640, 82],
  [640, 348],
];
function destination(teams: TugTeam[]) {
  const total = teams.reduce((s, t) => s + t.power, 0);
  return total
    ? {
        x:
          360 +
          (teams.reduce((s, t, i) => s + t.power * (anchors[i][0] - 360), 0) /
            total) *
            0.48,
        y:
          215 +
          (teams.reduce((s, t, i) => s + t.power * (anchors[i][1] - 215), 0) /
            total) *
            0.48,
      }
    : { x: 360, y: 215 };
}
export function TugIllustration({
  teams,
  active = false,
  finished = false,
  language = "en",
}: {
  teams: TugTeam[];
  active?: boolean;
  finished?: boolean;
  language?: string;
}) {
  const id = useId().replace(/:/g, "");
  const [position, setPosition] = useState(() => destination(teams));
  const [pulse, setPulse] = useState<{ team: number; key: number } | null>(
    null,
  );
  const current = useRef(position),
    previous = useRef(teams.map((t) => t.power));
  const signature = teams.map((t) => t.power).join(",");
  useEffect(() => {
    const target = destination(teams),
      from = current.current;
    let frame = 0,
      start = 0;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const changes = teams.map((t, i) => t.power - (previous.current[i] || 0));
    const largest = Math.max(...changes);
    const pullingTeam = changes.indexOf(largest);
    const pullX = anchors[pullingTeam][0] - 360;
    const pullY = anchors[pullingTeam][1] - 215;
    const pullLength = Math.hypot(pullX, pullY);
    const kick = active && largest > 0 ? 18 : 0;
    if (kick) setPulse({ team: pullingTeam, key: Date.now() });
    previous.current = teams.map((t) => t.power);
    if (reduced) {
      current.current = target;
      setPosition(target);
      return;
    }
    function animate(time: number) {
      if (!start) start = time;
      const progress = Math.min((time - start) / 1250, 1);
      const ease =
        1 + 2.70158 * (progress - 1) ** 3 + 1.70158 * (progress - 1) ** 2;
      const next = {
        x:
          from.x +
          (target.x - from.x) * ease +
          (pullX / pullLength) * kick * Math.sin(Math.PI * progress),
        y:
          from.y +
          (target.y - from.y) * ease +
          (pullY / pullLength) * kick * Math.sin(Math.PI * progress),
      };
      current.current = next;
      setPosition(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
    // Geometry changes only when the authoritative powers change.
  }, [signature, active]);
  useEffect(() => {
    if (pulse) {
      const timeout = setTimeout(() => setPulse(null), 1800);
      return () => clearTimeout(timeout);
    }
  }, [pulse]);
  const max = Math.max(...teams.map((t) => t.power), 0),
    leaders = teams
      .map((t, i) => (t.power === max && max > 0 ? i : -1))
      .filter((i) => i >= 0);
  const th = language === "th";
  return (
    <div
      className={
        "tug-illustration tug-stage " +
        (active ? "is-live " : "") +
        (pulse ? "is-pulling " : "") +
        (finished ? "is-finished" : "")
      }
      style={
        {
          "--pull-color": colors[pulse?.team ?? leaders[0] ?? 1],
        } as CSSProperties
      }
    >
      <div className="arena-announcement" aria-live="polite">
        <span
          className={pulse ? "pull-announcement" : ""}
          key={pulse?.key || "idle"}
        >
          {pulse
            ? th
              ? `ทีม ${teams[pulse.team].letter} ออกแรงดึง!`
              : `Team ${teams[pulse.team].letter} pulls!`
            : finished
              ? th
                ? "จบการแข่งขัน!"
                : "Match complete!"
              : active
                ? leaders.length === 1
                  ? th
                    ? `ทีม ${teams[leaders[0]].letter} กำลังช่วยกันดึง`
                    : `Team ${teams[leaders[0]].letter} is pulling together`
                  : th
                    ? "แรงดึงสมดุล — ช่วยทีมด้วยคำตอบถัดไป"
                    : "Balanced pull — your next answer matters"
                : th
                  ? "สี่ทีม หนึ่งสนามพลังความรู้"
                  : "Four teams. One arena of knowledge."}
        </span>
      </div>
      <svg
        className="arena-svg"
        viewBox="0 0 720 430"
        role="img"
        aria-label={
          th
            ? "ทีมสี่สีดึงเชือกและปมตรงกลางตามพลังทีมที่เซิร์ฟเวอร์คำนวณ"
            : "Four teams pull ropes and a moving knot according to server-calculated team power"
        }
      >
        <defs>
          {colors.map((c, i) => (
            <pattern
              id={`${id}-rope-${i}`}
              key={c}
              patternUnits="userSpaceOnUse"
              width="16"
              height="16"
              patternTransform="rotate(35)"
            >
              <rect width="16" height="16" fill={c} />
              <path
                d="M0 0V16 M8 0V16"
                stroke="#fff"
                strokeOpacity=".5"
                strokeWidth="3"
              />
            </pattern>
          ))}
          <radialGradient id={`${id}-floor`}>
            <stop stopColor="#f2e4bf" stopOpacity=".7" />
            <stop offset="1" stopColor="#fdfcf9" stopOpacity="0" />
          </radialGradient>
          <filter
            id={`${id}-glow`}
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <ellipse
          cx="360"
          cy="230"
          rx="300"
          ry="185"
          fill={`url(#${id}-floor)`}
        />
        <g fill="none" stroke="#d9d0bf">
          <circle cx="360" cy="215" r="106" strokeDasharray="5 11" />
          <circle cx="360" cy="215" r="145" strokeOpacity=".5" />
          <path d="M360 27V403 M27 215H693" strokeDasharray="4 8" />
        </g>
        {anchors.map(([x, y], i) => (
          <g key={i}>
            <path
              d={`M${x} ${y}L${position.x} ${position.y}`}
              stroke={colors[i]}
              strokeWidth={leaders.includes(i) ? 26 : 17}
              strokeOpacity=".12"
              strokeLinecap="round"
              filter={leaders.includes(i) ? `url(#${id}-glow)` : undefined}
            />
            <path
              d={`M${x} ${y}L${position.x} ${position.y}`}
              stroke={colors[i]}
              strokeWidth="15"
              strokeLinecap="round"
            />
            <path
              d={`M${x} ${y}L${position.x} ${position.y}`}
              stroke={`url(#${id}-rope-${i})`}
              strokeWidth="11"
            />
            {pulse?.team === i && (
              <g key={pulse.key}>
                <path
                  className="rope-energy"
                  d={`M${position.x} ${position.y}L${x} ${y}`}
                  stroke="#fff6d0"
                  strokeWidth="4"
                  strokeDasharray="18 45"
                  fill="none"
                />
                <circle
                  className="anchor-shockwave"
                  cx={x}
                  cy={y}
                  r="30"
                  stroke={colors[i]}
                  fill="none"
                  strokeWidth="3"
                />
              </g>
            )}
            <g
              className={"pullers " + (pulse?.team === i ? "hauling" : "")}
              key={`${i}-${pulse?.team === i ? pulse.key : 0}`}
              style={
                {
                  transformOrigin: `${x}px ${y}px`,
                  "--lean": `${x < 360 ? -8 : 8}deg`,
                } as CSSProperties
              }
            >
              {[-1, 0, 1].map((person, j) => {
                const px = x + person * 24,
                  py = y + (y < 215 ? -30 : 31);
                return (
                  <g
                    key={j}
                    stroke={colors[i]}
                    strokeLinecap="round"
                    fill={colors[i]}
                  >
                    <circle cx={px} cy={py - 14} r="7" />
                    <path
                      d={`M${px} ${py - 3}l${x < 360 ? -5 : 5} 16 M${px} ${py + 1}L${x < 360 ? px + 13 : px - 13} ${y} M${px + (x < 360 ? -5 : 5)} ${py + 13}l-10 11 M${px + (x < 360 ? -5 : 5)} ${py + 13}l13 10`}
                      strokeWidth="6"
                      fill="none"
                    />
                  </g>
                );
              })}
            </g>
            <circle
              cx={x}
              cy={y}
              r="21"
              fill={colors[i]}
              stroke="#fffdf7"
              strokeWidth="3"
            />
            <text
              x={x}
              y={y + 7}
              textAnchor="middle"
              fill="white"
              fontSize="22"
              fontWeight="700"
            >
              {"ABCD"[i]}
            </text>
            {pulse?.team === i && (
              <g
                className="pull-dust"
                key={`dust-${pulse.key}`}
                fill={colors[i]}
                opacity=".45"
              >
                {Array.from({ length: 9 }, (_, j) => (
                  <circle
                    key={j}
                    cx={x + (j - 4) * 10}
                    cy={y + (y < 215 ? 12 : -12)}
                    r={2 + (j % 3)}
                    style={
                      {
                        "--dust-x": `${(j - 4) * 7}px`,
                        "--dust-y": `${y < 215 ? 25 : -25}px`,
                        animationDelay: `${j * 40}ms`,
                      } as CSSProperties
                    }
                  />
                ))}
              </g>
            )}
          </g>
        ))}
        <circle cx="360" cy="215" r="6" fill="#c7b797" />
        <text x="360" y="378" textAnchor="middle" fill="#756b56" fontSize="14">
          {th ? "จุดเริ่มต้น" : "Starting point"}
        </text>
        {pulse && (
          <g
            key={`burst-${pulse.key}`}
            transform={`translate(${position.x} ${position.y})`}
          >
            <circle
              className="knot-burst"
              r="48"
              fill="none"
              stroke={colors[pulse.team]}
              strokeWidth="4"
            />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * Math.PI) / 6;
              return (
                <path
                  className="pull-spark"
                  key={i}
                  d={`M${Math.cos(a) * 47} ${Math.sin(a) * 47}l${Math.cos(a) * 20} ${Math.sin(a) * 20}`}
                  stroke={colors[pulse.team]}
                  strokeWidth="3"
                />
              );
            })}
          </g>
        )}
        <g transform={`translate(${position.x} ${position.y})`}>
          <ellipse cy="36" rx="37" ry="10" fill="#7d602d" opacity=".12" />
          <g className={pulse ? "knot-impact" : ""} key={pulse?.key || "knot"}>
            <circle r="38" fill="#dfc890" stroke="#977634" strokeWidth="2" />
            <path
              d="M-24-23Q32-18-12 32 M0-36Q-30 19 31 13 M-34-3Q21-32 16 35 M-22 27Q-22-25 30-18 M-34 9Q9 35 25-25 M-9-35Q28 7-31 13"
              stroke="#a18444"
              strokeWidth="4"
              fill="none"
            />
            <circle r="8" fill="#b28c43" />
          </g>
        </g>
        {finished && (
          <g className="victory-confetti">
            {Array.from({ length: 32 }, (_, i) => (
              <rect
                key={i}
                x={40 + ((i * 83) % 640)}
                y={25 + ((i * 37) % 360)}
                width="5"
                height="11"
                fill={colors[i % 4]}
                transform={`rotate(${i * 23} ${40 + ((i * 83) % 640)} ${25 + ((i * 37) % 360)})`}
                style={{ animationDelay: `${i * 30}ms` }}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
