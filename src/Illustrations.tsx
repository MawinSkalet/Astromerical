import { useState } from "react";
import type { Placement, Representation } from "./types";

export const signs = [
  ["Aries", "Mesh", "เมษ", "♈"],
  ["Taurus", "Vrishabha", "พฤษภ", "♉"],
  ["Gemini", "Mithuna", "เมถุน", "♊"],
  ["Cancer", "Karka", "กรกฎ", "♋"],
  ["Leo", "Simha", "สิงห์", "♌"],
  ["Virgo", "Kanya", "กันย์", "♍"],
  ["Libra", "Tula", "ตุลย์", "♎"],
  ["Scorpio", "Vrishchika", "พิจิก", "♏"],
  ["Sagittarius", "Dhanu", "ธนู", "♐"],
  ["Capricorn", "Makara", "มกร", "♑"],
  ["Aquarius", "Kumbha", "กุมภ์", "♒"],
  ["Pisces", "Meena", "มีน", "♓"],
];
const point = (r: number, a: number) => ({
  x: 250 + r * Math.cos((a * Math.PI) / 180),
  y: 250 + r * Math.sin((a * Math.PI) / 180),
});
export function SunSeal({ size = 46 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      aria-hidden="true"
      className="sun-seal"
    >
      <circle
        cx="30"
        cy="30"
        r="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="30" cy="30" r="7" fill="none" stroke="currentColor" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI) / 8;
        const r = i % 2 ? 11 : 9;
        const end = i % 2 ? 17 : 22;
        return (
          <path
            key={i}
            d={`M ${30 + r * Math.cos(a)} ${30 + r * Math.sin(a)} L ${30 + end * Math.cos(a)} ${30 + end * Math.sin(a)}`}
            stroke="currentColor"
            strokeWidth={i % 2 ? 0.8 : 1.3}
          />
        );
      })}
      <circle cx="30" cy="30" r="2" fill="currentColor" />
    </svg>
  );
}

export function ZodiacWheel({
  language = "en",
  placements = [],
  compact = false,
}: {
  language?: string;
  placements?: Placement[];
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className={"wheel-wrap " + (compact ? "compact" : "")}>
      <svg
        className="zodiac-wheel"
        viewBox="0 0 500 500"
        role="group"
        aria-label="Interactive twelve-sign zodiac wheel"
      >
        <circle cx="250" cy="250" r="174" className="wheel-paper" />
        {Array.from({ length: 72 }, (_, i) => {
          const p = point(169, i * 5),
            q = point(i % 6 === 0 ? 164 : 167, i * 5);
          return (
            <path
              key={i}
              d={`M${p.x},${p.y} L${q.x},${q.y}`}
              className="wheel-tick"
            />
          );
        })}
        {[160, 164, 99, 52, 46].map((r) => (
          <circle key={r} cx="250" cy="250" r={r} className="wheel-ring" />
        ))}
        {signs.map((sign, i) => {
          const angle = -90 + i * 30;
          const a = point(160, angle - 15),
            b = point(160, angle + 15),
            c = point(53, angle + 15),
            d = point(53, angle - 15),
            glyph = point(130, angle),
            label = point(204, angle),
            line = point(53, angle - 15);
          return (
            <g
              key={sign[0]}
              role="button"
              tabIndex={0}
              aria-label={sign[0] + " " + sign[2]}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(i);
                }
              }}
              className={"zodiac-sign " + (selected === i ? "selected" : "")}
            >
              <path
                d={`M${a.x},${a.y} A160 160 0 0 1 ${b.x},${b.y} L${c.x},${c.y} A53 53 0 0 0 ${d.x},${d.y} Z`}
                className="sign-sector"
              />
              <path
                d={`M${a.x},${a.y} L${line.x},${line.y}`}
                className="wheel-line"
              />
              <text
                x={glyph.x}
                y={glyph.y + 11}
                textAnchor="middle"
                className="sign-glyph"
              >
                {sign[3] + "\uFE0E"}
              </text>
              <text
                x={label.x}
                y={label.y - 2}
                textAnchor="middle"
                className="sign-name"
              >
                {language === "th" ? sign[2] : sign[0]}
              </text>
              <text
                x={label.x}
                y={label.y + 13}
                textAnchor="middle"
                className="sign-subname"
              >
                {language === "th" ? sign[0] : sign[1]}
              </text>
            </g>
          );
        })}
        <g transform="translate(220 220)">
          <SunSeal size={60} />
        </g>
        {placements.map((p, i) => {
          const pos = point(75, -90 + (p.index + (p.degree / 30 - 0.5)) * 30);
          return (
            <g key={p.body}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="12"
                fill={i === 0 ? "#8d6c3d" : i === 1 ? "#0c8091" : "#162b50"}
              />
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                fill="white"
                fontSize="15"
              >
                {p.number}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="wheel-caption" aria-live="polite">
        {selected === null ? (
          <>
            <span className="tiny-star">✧</span>{" "}
            {language === "th"
              ? "เลือกราศีเพื่อสำรวจ"
              : "One sky. Twelve ways to explore."}
          </>
        ) : (
          <>
            <strong>{signs[selected][0]}</strong>{" "}
            <span>
              — {signs[selected][1]} / {signs[selected][2]}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function TempleArt({ books = false }: { books?: boolean }) {
  return (
    <svg
      className="temple-art"
      viewBox="0 0 260 170"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="#b5a17f" strokeWidth=".8" strokeLinejoin="round">
        <path
          d="M0 151 Q14 135 25 146 L44 119 L61 145 L81 124 L99 147 L115 140 L132 151 L260 153"
          fill="#eee9df"
        />
        <path d="M0 156 H260 M5 160 H247" />
        {books ? (
          <>
            <g transform="translate(18 93)">
              <path
                d="M0 52 H69 V39 H0Z M3 37 H64 V25 H3Z M0 23 H63 V11 H0Z M10 9 H70 V-2 H10Z"
                fill="#d8d2bc"
              />
              <path d="M4 40 H66 M4 44 H66 M4 48 H66 M7 27 H61 M7 31 H61 M5 13 H59 M5 17 H59" />
              <path
                d="M0 39 H12 V52 H0Z M3 25 H15 V37 H3Z M0 11 H11 V23 H0Z M10 -2 H23 V9 H10Z"
                fill="#8b9b9d"
              />
            </g>
            <g transform="translate(183 91)">
              <ellipse rx="31" ry="40" />
              <ellipse rx="17" ry="40" />
              <ellipse rx="31" ry="16" transform="rotate(25)" />
              <ellipse rx="28" ry="36" transform="rotate(30)" />
              <path d="M0-47 V47 M-40 0 H40 M-7 42 L-15 61 H15 L7 42 M-20 61 H20 V66 H-20Z" />
              <circle r="4" fill="#b5a17f" />
            </g>
          </>
        ) : (
          <>
            <g transform="translate(173 10)">
              <path
                d="M0 135 H64 L57 126 H7Z M8 125 H56 V105 H8Z"
                fill="#e1d9c8"
              />
              <path
                d="M4 105 H60 L45 86 H19Z M11 86 H53 L41 66 H23Z M17 66 H47 L36 47 H28Z M24 47 H40 L32 6Z"
                fill="#d5c8ad"
              />
              <path d="M32 0 V140 M25 47 H39 M18 66 H46 M12 86 H52 M6 105 H58 M9 111 H55 M9 116 H55 M9 121 H55" />
              <path d="M25 125 V111 Q32 100 39 111 V125" fill="#8f9fa1" />
              <path d="M10 135 V119 M54 135 V119 M20 85 V74 M44 85 V74" />
            </g>
            <g transform="translate(94 70)">
              <path
                d="M0 77 H50 L44 68 H6Z M9 68 V53 H41 V68 M4 53 H46 L35 35 H15Z M12 35 H38 L29 20 H21Z M19 20 H31 L25-15Z"
                fill="#e3dfd3"
              />
              <path d="M25-23 V76 M13 60 H37 M15 64 H35" />
            </g>
            <g transform="translate(42 100)">
              <path
                d="M0 48 H40 L34 41 H6Z M8 41 V24 H32 V41 M3 24 H37 L25 9 H15Z M13 9 H27 L20-20Z"
                fill="#e6e0d3"
              />
            </g>
            <path
              d="M15 145 V111 M14 121 Q-2 119 5 107 Q-2 95 11 92 Q13 79 25 88 Q39 88 35 102 Q48 110 32 118 Q26 128 15 121"
              fill="#dce1da"
            />
          </>
        )}
      </g>
      <g fill="#c4b79a">
        <circle cx="29" cy="66" r="1" />
        <circle cx="119" cy="32" r="1.2" />
        <path
          d="M146 56 V64 M142 60 H150 M70 83 V89 M67 86 H73"
          stroke="#c4b79a"
        />
      </g>
    </svg>
  );
}

export function Numeral({
  value,
  system,
  small = false,
}: {
  value: Representation;
  system: string;
  small?: boolean;
}) {
  if (value.text)
    return (
      <span className={"ancient-text " + system + (small ? " small" : "")}>
        {value.text}
      </span>
    );
  if (system === "mayan")
    return (
      <div
        className={"mayan-number " + (small ? "small" : "")}
        aria-label={"Maya base-20 levels: " + value.levels.join(", ")}
      >
        {value.levels.map((d, i) => (
          <div key={i} className="mayan-level">
            {d === 0 ? (
              <svg width="42" height="21" viewBox="0 0 42 21">
                <path
                  d="M2 10 Q21-9 40 10 Q21 30 2 10Z M5 10 H37 M13 6 L18 15 M22 4 L27 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <>
                <div className="mayan-dots">
                  {Array.from({ length: d % 5 }, (_, j) => (
                    <i key={j} />
                  ))}
                </div>
                <div className="mayan-bars">
                  {Array.from({ length: Math.floor(d / 5) }, (_, j) => (
                    <i key={j} />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  return (
    <div
      className={"babylonian-number " + (small ? "small" : "")}
      aria-label={"Babylonian base-60 groups: " + value.levels.join(", ")}
    >
      {value.levels.map((d, i) => (
        <span key={i} className="wedge-group">
          {d === 0 ? (
            <span className="zero-placeholder">0</span>
          ) : (
            <>
              <span className="ten-wedges">
                {Array.from({ length: Math.floor(d / 10) }, (_, j) => (
                  <svg key={j} width="17" height="25" viewBox="0 0 17 25">
                    <path d="M15 1 L1 12 L15 23 L9 12Z" fill="currentColor" />
                  </svg>
                ))}
              </span>
              <span className="unit-wedges">
                {Array.from({ length: d % 10 }, (_, j) => (
                  <svg key={j} width="12" height="27" viewBox="0 0 12 27">
                    <path d="M1 2 H11 L7 10 L6 25 L5 10Z" fill="currentColor" />
                  </svg>
                ))}
              </span>
            </>
          )}
        </span>
      ))}
    </div>
  );
}

export { TugIllustration } from "./TugArena";
