import { BookOpen, Check, CheckCircle2, Sparkles, X } from "lucide-react";
import { Numeral } from "./Illustrations";
import type { Language, QuestionReveal } from "./types";

export function QuizReveal({
  reveal,
  host,
  lang,
  seconds,
  last,
}: {
  reveal: QuestionReveal;
  host: boolean;
  lang: Language;
  seconds: number;
  last: boolean;
}) {
  const th = lang === "th";
  const b = (en: string, thai: string) => (th ? thai : en);
  const choices = th ? reveal.choices_th || reveal.choices : reveal.choices;
  return (
    <div
      className={`lq-answer-reveal ${host ? "is-presenter" : "is-player"}`}
      key={reveal.question_id}
    >
      <div className="lq-reveal-kicker">
        <Sparkles size={18} />
        {b("Answer revealed", "เปิดเฉลย")}
      </div>
      <p className="lq-reveal-prompt">
        {th ? reveal.prompt_th || reveal.prompt : reveal.prompt}
      </p>
      {reveal.representation && (
        <div className="lq-reveal-numeral">
          <Numeral value={reveal.representation} system={reveal.system} small />
        </div>
      )}
      <div className="lq-reveal-answer">
        <CheckCircle2 size={30} />
        <div>
          <small>{b("Correct answer", "คำตอบที่ถูก")}</small>
          <h2>{th ? reveal.answer_th || reveal.answer : reveal.answer}</h2>
        </div>
      </div>
      {!host && (
        <div
          className={`lq-personal-feedback ${reveal.correct ? "is-correct" : "is-missed"}`}
          role="status"
        >
          {reveal.correct ? <CheckCircle2 size={22} /> : <X size={22} />}
          <div>
            <strong>
              {reveal.correct
                ? b("You got it!", "ตอบถูกแล้ว!")
                : reveal.submitted_index === null
                  ? b("No answer this time", "ข้อนี้ยังไม่ได้ตอบ")
                  : b("Keep going!", "ไปต่อกัน ลองใหม่ข้อหน้า!")}
            </strong>
            <span>
              {b("Your answer", "คำตอบของคุณ")}:{" "}
              {reveal.submitted_index === null
                ? "—"
                : choices[reveal.submitted_index]}
            </span>
          </div>
          <b>
            +{reveal.points.toLocaleString(th ? "th-TH" : "en-US")}
            <small>{b("points", "คะแนน")}</small>
          </b>
        </div>
      )}
      {host && (
        <div
          className="lq-reveal-distribution"
          aria-label={b("Answer distribution", "จำนวนผู้เลือกแต่ละคำตอบ")}
        >
          {choices.map((choice, index) => (
            <div
              key={index}
              className={`lq-reveal-choice lq-choice-${index} ${index === reveal.correct_index ? "is-correct" : ""}`}
            >
              <span className="lq-reveal-letter">{"ABCD"[index]}</span>
              <span>{choice}</span>
              <strong>
                {reveal.answer_counts[index]}{" "}
                {index === reveal.correct_index && <Check size={17} />}
              </strong>
            </div>
          ))}
        </div>
      )}
      <div className="lq-reveal-explanation">
        <p>
          {th
            ? reveal.explanation_th || reveal.explanation
            : reveal.explanation}
        </p>
        <small>
          <BookOpen size={15} />
          {th
            ? reveal.source_title_th || reveal.source_title
            : reveal.source_title}
          {reveal.source_slide &&
            ` · ${b("Slide", "สไลด์")} ${reveal.source_slide}`}
        </small>
      </div>
      <div className="lq-reveal-next">
        {last
          ? b("Results in", "พบผลการแข่งขันใน")
          : b("Next question in", "ข้อถัดไปใน")}{" "}
        <strong>{seconds}</strong> {b("sec", "วินาที")}
      </div>
    </div>
  );
}
