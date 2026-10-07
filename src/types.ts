export type Language = "en" | "th";
export type Section =
  "learn" | "play" | "quiz" | "chart" | "profile" | "welcome";
export interface User {
  id: string;
  name: string;
  guest: boolean;
}
export interface Slide {
  title: string;
  body: string;
  example: string;
  note: string;
  example_th: string;
  note_th: string;
  title_th: string;
  body_th: string;
  visual: string;
}
export interface Lesson {
  slug: string;
  title: string;
  title_th: string;
  subtitle: string;
  subtitle_th: string;
  intro: string;
  system: string;
  source: string;
  slides: Slide[];
  terms: string[][];
  total?: number;
}
export interface Representation {
  text: string;
  levels: number[];
}
export interface Question {
  id: string;
  kind: string;
  system: string;
  prompt: string;
  prompt_th?: string;
  representation?: Representation;
  choices: string[];
  choices_th?: string[];
  category?: "astrology" | "numerals";
  source_title?: string;
  source_title_th?: string;
  hint: string;
  hint_th?: string;
  symbols?: Representation[];
  options?: string[];
  events?: { label: string; year: string }[];
  date_parts?: Representation[];
}
export interface Feedback {
  correct: boolean;
  answer: string;
  explanation: string;
}
export interface Review extends Feedback {
  points?: number;
  prompt: string;
  prompt_th?: string;
  explanation_th?: string;
  answer_th?: string;
  submitted_th?: string;
  submitted: string;
  representation?: Representation;
  system?: string;
  source_title?: string;
  source_title_th?: string;
}
export interface GameResult {
  score: number;
  total: number;
  system: string;
  activity: string;
  answers: Review[];
}
export interface Profile {
  user: User;
  completed_games: number;
  progress: { slug: string; slide: number; completed: boolean }[];
  games: {
    id: string;
    activity: string;
    system: string;
    date: string;
    score: number;
    total: number;
  }[];
  quizzes: { id: string; code: string; correct: number; answered: number }[];
}
export interface Placement {
  body: string;
  number: string;
  sign: string;
  sign_th: string;
  symbol: string;
  index: number;
  degree: number;
  longitude: number;
  reflection: string;
  reflection_th: string;
}
export interface ChartResult {
  placements: Placement[];
  planet_positions?: {
    body: string;
    body_th: string;
    symbol: string;
    number: string | null;
    sign: string;
    sign_th: string;
    degree: number;
    longitude: number;
    house: number;
    point_type?: "planet" | "lunar node" | "angle";
  }[];
  aspects?: { first: string; second: string; kind: string; orb: number }[];
  reading?: {
    personality: string;
    love: string;
    career_money: string;
    opportunities: string;
    challenges: string;
  };
  reading_mode?: "ai" | "chart-guide" | "fallback";
  source_basis?: {
    title: string;
    pages: string;
    facts: string[];
    limits: string;
  };
  profile?: {
    body: string;
    sign: string;
    sign_th: string;
    strength: string;
    strength_th: string;
    watchout: string;
    watchout_th: string;
  }[];
  personality?: string;
  personality_th?: string;
  method: string;
  overall: string;
  overall_th?: string;
  disclaimer: string;
}
export interface Team {
  id: string;
  letter: string;
  players: { id: string; name: string; ready: boolean }[];
  size: number;
  correct: number;
  power: number;
  answered: number;
  responses: number;
  points: number;
}
export interface QuizRank {
  id: string;
  name: string;
  team: string;
  points: number;
  correct: number;
  streak: number;
  rank: number;
}
export interface QuestionReveal {
  question_id: string;
  prompt: string;
  prompt_th?: string;
  system: string;
  representation?: Representation;
  choices: string[];
  choices_th?: string[];
  answer: string;
  answer_th?: string;
  correct_index: number;
  answer_counts: number[];
  explanation: string;
  explanation_th?: string;
  source_title?: string;
  source_title_th?: string;
  source_slide?: number;
  submitted_index: number | null;
  correct: boolean | null;
  points: number;
}
export interface Room {
  code: string;
  status: "lobby" | "active" | "finished";
  host: boolean;
  team_id: string | null;
  role: "presenter" | "player";
  phase: "lobby" | "preview" | "question" | "reveal" | "finished";
  player_count: number;
  question_id: string | null;
  choice_count: number;
  responses: number;
  ready: boolean;
  teams: Team[];
  server_now: number;
  max_players: number;
  question: Question | null;
  category?: "astrology" | "numerals" | "mixed" | null;
  session_id: string | null;
  question_number?: number;
  total?: number;
  ends_at?: number;
  starts_at?: number;
  answered?: boolean;
  selected?: string;
  selected_index?: number | null;
  winners?: string[];
  reveal?: QuestionReveal;
  leaderboard?: QuizRank[];
}
