import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Compass,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import { Numeral, signs, ZodiacWheel } from "./Illustrations";
import type { Language, Lesson, Representation } from "./types";

const values: Record<string, number[]> = {
  roman: [14, 16, 49, 14, 1994, 8],
  thai: [14, 35, 256, 307, 2567, 1206],
  mayan: [14, 19, 43, 404, 360, 443],
  babylonian: [34, 23, 134, 3602, 3600, 3723],
};
function represent(value: number, system: string): Representation {
  if (system === "thai")
    return {
      text: String(value).replace(/\d/g, (d) => "๐๑๒๓๔๕๖๗๘๙"[+d]),
      levels: [],
    };
  if (system === "roman") {
    let n = value,
      text = "";
    for (const [v, s] of [
      [1000, "M"],
      [900, "CM"],
      [500, "D"],
      [400, "CD"],
      [100, "C"],
      [90, "XC"],
      [50, "L"],
      [40, "XL"],
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"],
    ] as [number, string][]) {
      while (n >= v) {
        text += s;
        n -= v;
      }
    }
    return { text, levels: [] };
  }
  const base = system === "mayan" ? 20 : 60,
    levels: number[] = [];
  let n = value;
  do {
    levels.unshift(n % base);
    n = Math.floor(n / base);
  } while (n);
  return { text: "", levels };
}

export function LessonStage({
  lesson,
  index,
  language,
}: {
  lesson: Lesson;
  index: number;
  language: Language;
}) {
  const th = language === "th";
  if (lesson.system === "astrology")
    return <AstrologyStage index={index} language={language} />;
  return (
    <NumeralStage
      key={lesson.system + index}
      lesson={lesson}
      index={index}
      th={th}
    />
  );
}
function NumeralStage({
  lesson,
  index,
  th,
}: {
  lesson: Lesson;
  index: number;
  th: boolean;
}) {
  const system = lesson.system;
  const [value, setValue] = useState(values[system][index]);
  const representation = represent(value, system),
    base = system === "mayan" ? 20 : system === "babylonian" ? 60 : 10;
  const symbols =
    system === "roman"
      ? ["I", "V", "X", "L", "C", "D", "M"]
      : system === "thai"
        ? [..."๐๑๒๓๔๕๖๗๘๙"]
        : [];
  return (
    <section
      className={"lesson-stage numeral-stage stage-" + index}
      aria-label={th ? "ภาพประกอบบทเรียนตัวเลข" : "Numeral lesson illustration"}
    >
      {index === 0 &&
        (symbols.length ? (
          <div className="large-symbol-key">
            {symbols.map((symbol, i) => (
              <div key={symbol}>
                <strong>{symbol}</strong>
                <span>
                  {system === "thai" ? i : [1, 5, 10, 50, 100, 500, 1000][i]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="visual-comparisons">
            {(system === "mayan" ? [1, 5, 0] : [1, 10]).map((n) => (
              <div key={n}>
                <Numeral value={represent(n, system)} system={system} />
                <strong>= {n}</strong>
              </div>
            ))}
          </div>
        ))}
      {index === 2 && system === "roman" ? (
        <div className="subtraction-pairs">
          {[
            ["IV", 4],
            ["IX", 9],
            ["XL", 40],
            ["XC", 90],
            ["CD", 400],
            ["CM", 900],
          ].map(([s, n]) => (
            <div key={s}>
              <strong>{s}</strong>
              <span>{n}</span>
            </div>
          ))}
        </div>
      ) : index === 4 && system === "mayan" ? (
        <div className="counting-comparison">
          <div>
            <span>{th ? "การนับทั่วไป" : "Ordinary counting"}</span>
            <strong>1 → 20 → 400</strong>
          </div>
          <div>
            <span>{th ? "ปฏิทินนับยาว" : "Long Count calendar"}</span>
            <strong>1 → 20 → 360</strong>
          </div>
        </div>
      ) : index === 4 && system === "babylonian" ? (
        <div className="clock-visual">
          <Clock3 size={82} strokeWidth={1} />
          <strong>1 {th ? "ชั่วโมง" : "hour"}</strong>
          <p>
            60 {th ? "นาที" : "minutes"} = 3,600 {th ? "วินาที" : "seconds"}
          </p>
        </div>
      ) : index === 4 && system === "thai" ? (
        <div className="era-visual">
          <CalendarDays size={55} />
          <strong>พ.ศ. ๒๕๖๗</strong>
          <ArrowRight />
          <strong>2024 CE</strong>
          <p>2567 − 543 = 2024</p>
        </div>
      ) : (
        index !== 0 && (
          <>
            <div className="worked-number">
              <Numeral value={representation} system={system} />
              <span>=</span>
              <strong>{value.toLocaleString()}</strong>
            </div>
            {system === "roman" ? (
              <div className="number-breakdown">
                {index === 1
                  ? "X + V + I = 10 + 5 + 1"
                  : index === 3
                    ? "X + IV = 10 + (5 − 1)"
                    : index === 4
                      ? "M + CM + XC + IV = 1000 + 900 + 90 + 4"
                      : index === 5
                        ? "VIII ✓     IIX ✕"
                        : ""}
              </div>
            ) : (
              <div className="place-value-visual">
                {(representation.levels.length
                  ? representation.levels
                  : String(value).split("").map(Number)
                ).map((digit, i, all) => {
                  const place = base ** (all.length - i - 1);
                  return (
                    <div key={i}>
                      <span>× {place.toLocaleString()}</span>
                      <strong>{digit}</strong>
                      <span>= {(digit * place).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )
      )}
      {index === 5 && (
        <label className="number-playground">
          {th
            ? "ลองเปลี่ยนจำนวน แล้วสังเกตสัญลักษณ์"
            : "Change the number and watch the symbols"}
          <input
            type="range"
            min="1"
            max={system === "roman" ? 99 : 3999}
            value={value}
            onChange={(e) => setValue(+e.target.value)}
          />
          <output>{value}</output>
        </label>
      )}
    </section>
  );
}
function AstrologyStage({
  index,
  language,
}: {
  index: number;
  language: Language;
}) {
  const th = language === "th";
  const [selected, setSelected] = useState(0);
  const bodies = [
    ["๑", "Sun", "อาทิตย์"],
    ["๒", "Moon", "จันทร์"],
    ["๓", "Mars", "อังคาร"],
    ["๔", "Mercury", "พุธ"],
    ["๕", "Jupiter", "พฤหัสบดี"],
    ["๖", "Venus", "ศุกร์"],
    ["๗", "Saturn", "เสาร์"],
  ];
  if (index === 0)
    return (
      <div className="lesson-stage sky-overview">
        <ZodiacWheel language={language} compact />
      </div>
    );
  if (index === 1)
    return (
      <div className="lesson-stage ecliptic-stage">
        <svg
          viewBox="0 0 500 240"
          role="img"
          aria-label={
            th
              ? "จักรราศี 12 ส่วน ส่วนละ 30 องศา"
              : "Twelve equal 30-degree sectors"
          }
        >
          <circle
            cx="250"
            cy="120"
            r="97"
            fill="none"
            stroke="#ab8a4f"
            strokeWidth="2"
          />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return (
              <path
                key={i}
                d={`M250 120 L${250 + 97 * Math.cos(a)} ${120 + 97 * Math.sin(a)}`}
                stroke="#b7a47c"
              />
            );
          })}
          <circle cx="250" cy="120" r="24" fill="#172b4d" />
          <text x="250" y="127" textAnchor="middle" fill="white" fontSize="20">
            ☼
          </text>
        </svg>
        <strong>360° ÷ 12 = 30°</strong>
      </div>
    );
  if (index === 2)
    return (
      <div className="lesson-stage sign-study">
        <div className="sign-study-grid">
          {signs.map((s, i) => (
            <button
              key={s[0]}
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
            >
              <strong>{s[3] + "\uFE0E"}</strong>
              <span>{th ? s[2] : s[0]}</span>
            </button>
          ))}
        </div>
        <p>
          <strong>
            {signs[selected][3] + "\uFE0E"} {signs[selected][th ? 2 : 0]}
          </strong>
          <span>
            {signs[selected][1]} / {signs[selected][th ? 0 : 2]}
          </span>
          <span className="sign-study-range">
            {selected * 30}° ≤ λ &lt; {(selected + 1) * 30}° ·{" "}
            {th ? "ถัดไป" : "Next"}: {signs[(selected + 1) % 12][th ? 2 : 0]}
          </span>
        </p>
      </div>
    );
  if (index === 3 || index === 4)
    return (
      <div className="lesson-stage planet-study">
        {bodies.slice(index === 3 ? 0 : 4, index === 3 ? 4 : 7).map((p) => (
          <div key={p[0]}>
            <strong>{p[0]}</strong>
            <span>{p[th ? 2 : 1]}</span>
          </div>
        ))}
      </div>
    );
  if (index === 5)
    return (
      <div className="lesson-stage node-study">
        <span className="node rahu">
          <strong>๘</strong>
          {th ? "ราหู" : "Rahu"}
        </span>
        <div className="lunar-orbit">
          <Moon size={40} />
          <span>180°</span>
        </div>
        <span className="node ketu">
          <strong>๙</strong>
          {th ? "เกตุ" : "Ketu"}
        </span>
        <p>
          {th
            ? "จุดตัดวงโคจรที่อยู่ตรงข้ามกัน"
            : "Opposite intersections of the lunar orbit"}
        </p>
      </div>
    );
  if (index === 6)
    return (
      <div className="lesson-stage horizon-study">
        <Compass size={48} />
        <div className="horizon-sky">
          <span>ล</span>
          <Sun size={46} />
        </div>
        <div className="horizon-line" />
        <strong>{th ? "ขอบฟ้าทิศตะวันออก" : "Eastern horizon"}</strong>
        <p>
          {th
            ? "ลัคนา = ราศีที่กำลังขึ้น"
            : "Ascendant = the rising zodiac sign"}
        </p>
      </div>
    );
  if (index === 7)
    return (
      <div className="lesson-stage rhythms-study">
        {[
          ["๒", th ? "จันทร์" : "Moon", th ? "≈ 2½ วัน" : "≈ 2½ days", 18],
          ["๑", th ? "อาทิตย์" : "Sun", th ? "≈ 1 เดือน" : "≈ 1 month", 48],
          ["๗", th ? "เสาร์" : "Saturn", th ? "≈ 2½ ปี" : "≈ 2½ years", 100],
        ].map(([glyph, name, time, width]) => (
          <div key={glyph}>
            <strong>{glyph}</strong>
            <span>
              {name}
              <small>
                {time} / {th ? "ราศี" : "sign"}
              </small>
            </span>
            <i style={{ width: `${width}%` }} />
          </div>
        ))}
      </div>
    );
  if (index === 8)
    return (
      <div className="lesson-stage temple-record">
        {[
          ["♈", th ? "เมษ" : "Aries", "๑ ๓"],
          ["♉", th ? "พฤษภ" : "Taurus", "๒ ๖"],
          ["♊", th ? "เมถุน" : "Gemini", "ล"],
        ].map(([glyph, name, digits]) => (
          <div key={name}>
            <span>
              {glyph + "\uFE0E"} {name}
            </span>
            <strong>{digits}</strong>
          </div>
        ))}
      </div>
    );
  if (index === 9)
    return (
      <div className="lesson-stage eclipse-study">
        {[false, true].map((lunar) => (
          <div key={String(lunar)}>
            <strong>
              {th
                ? lunar
                  ? "จันทรุปราคา"
                  : "สุริยุปราคา"
                : lunar
                  ? "Lunar eclipse"
                  : "Solar eclipse"}
            </strong>
            <div className="eclipse-alignment">
              {(lunar
                ? ["sun", "earth", "moon"]
                : ["sun", "moon", "earth"]
              ).map((body) => (
                <span key={body} className={"celestial-body " + body}>
                  {th
                    ? { sun: "อาทิตย์", earth: "โลก", moon: "จันทร์" }[body]
                    : body}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  if (index === 10)
    return (
      <div className="lesson-stage meaning-study">
        <div>
          <Compass size={40} />
          <strong>{th ? "ตำแหน่ง" : "Position"}</strong>
          <p>
            {th
              ? "คำนวณจากวัน เวลา สถานที่"
              : "Calculated from date, time, and place"}
          </p>
        </div>
        <div>
          <Sparkles size={40} />
          <strong>{th ? "การตีความ" : "Interpretation"}</strong>
          <p>
            {th ? "มุมมองตามวัฒนธรรม" : "A cultural perspective for reflection"}
          </p>
        </div>
      </div>
    );
  return (
    <div className="lesson-stage chart-invitation">
      <ZodiacWheel language={language} compact />
      <a href="#/chart">
        <CalendarDays size={24} />
        {th
          ? "ใส่วันเกิด แล้วสำรวจดวงของคุณ"
          : "Enter your birth details and explore your chart"}
        <ArrowRight size={22} />
      </a>
    </div>
  );
}
