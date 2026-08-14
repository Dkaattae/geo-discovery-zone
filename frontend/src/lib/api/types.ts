/**
 * Wire types for `openapi.yaml`.
 *
 * Hand-written rather than generated so the client stays readable and the diff
 * reviewable; they cover the operations this app calls, not the whole contract.
 * Optional fields are `?: T | undefined` because the server omits absent fields
 * rather than nulling them, and `exactOptionalPropertyTypes` is on.
 */

export type Scope = "us" | "world";

export type QuestionFormat =
  | "map_identify"
  | "map_click"
  | "multiple_choice"
  | "image"
  | "ab_compare"
  | "pin_pick"
  | "pin_drop"
  | "drag_order"
  | "click_profile";

export type Topic =
  | "location"
  | "capital"
  | "climate"
  | "agriculture"
  | "wildlife"
  | "landmark"
  | "size"
  | "physical"
  | "superlative"
  | "elevation";

/** What the session picker offers. `mixed` draws across topics. */
export type SessionTopic = "location" | "capital" | "mixed";

export interface Problem {
  type?: string | undefined;
  title: string;
  status: number;
  detail?: string | undefined;
  instance?: string | undefined;
  errors?: { path: string; message: string }[] | undefined;
}

export interface Entity {
  id: string;
  type: string;
  name: string;
  scope?: Scope | undefined;
  capital?: string | undefined;
  region?: string | undefined;
  /** FIPS for US states, ISO 3166-1 alpha-3 for countries. Never join on name. */
  geometryId?: string | undefined;
  funFact?: string | undefined;
  funFactDetail?: string | undefined;
}

export interface Question {
  id: string;
  entityId: string;
  format: QuestionFormat;
  prompt: string;
  level: number;
  choices?: string[] | undefined;
  /** Absent when the server withheld the answer key. */
  correctIndex?: number | undefined;
  topic?: Topic | undefined;
  scope?: Scope | undefined;
  region?: string | undefined;
  ageBand?: 1 | 2 | 3 | undefined;
  highlightGeometryId?: string | undefined;
  reveal?: "none" | "map_highlight" | "profile_highlight" | "image" | undefined;
  shortExplanation?: string | undefined;
  detailExplanation?: string | undefined;
}

export interface LevelLabel {
  level: number;
  grade: number;
  band: number;
  gradeLabel: string;
  bandLabel: "Easy" | "Medium" | "Hard";
  display: string;
}

export interface Profile {
  id: string;
  /** A nickname. The server is never told a child's real name. */
  name: string;
  avatar: string;
  level: number;
  bestSustainedLevel: number;
  lastSessionEndLevel: number;
  stats: { answered: number; correct: number; streakDays?: number | undefined };
  mastery: Record<string, number>;
  reviewQueue: string[];
  createdAt?: string | undefined;
}

export interface ProfileProgress {
  profileId: string;
  mastery: Record<string, number>;
  masteredEntityIds: string[];
  /** Join keys the map fills in. */
  masteredGeometryIds: string[];
  entitiesSeen: number;
  mapProgress: {
    entityType?: string | undefined;
    scope?: Scope | undefined;
    filled: number;
    total: number;
  };
  suggestedLevels: number[];
  reviewQueue: string[];
}

export interface SessionCounts {
  answered: number;
  correct: number;
  wrong: number;
  correctStreak?: number | undefined;
  wrongStreak?: number | undefined;
}

export interface Session {
  id: string;
  profileId: string;
  topic: string;
  level: number;
  state: "active" | "ended";
  startedAt: string;
  counts: SessionCounts;
  levelLabel?: LevelLabel | undefined;
  endedAt?: string | null | undefined;
  askedQuestionIds?: string[] | undefined;
  seenEntityIds?: string[] | undefined;
  learnedEntityIds?: string[] | undefined;
  reviewRoundRemaining?: number | undefined;
}

export interface ServedQuestion {
  question: Question;
  entity?: Entity | undefined;
  /** True when pulled from the review queue. Never shown to the kid as a label. */
  isReview: boolean;
  index: number;
  phase?: "PRESENTING" | "SELECTED" | "COMMITTED" | "REVEALING" | undefined;
}

export interface Reveal {
  tone: "reward" | "reason";
  headline: string;
  detail?: string | undefined;
  answerLabel?: string | undefined;
  mapHighlightGeometryId?: string | undefined;
  sourceUrl?: string | null | undefined;
  /** 0 when correct; a short beat on a wrong answer so the reason is seen. */
  nextEnabledAfterMs?: number | undefined;
}

export interface SessionPrompts {
  milestone?: number | null | undefined;
  offerReview?: boolean | undefined;
  levelDroppedQuietly?: boolean | undefined;
}

export interface AnswerResult {
  answerId: string;
  correct: boolean;
  reveal: Reveal;
  session: Session;
  correctIndex?: number | undefined;
  correctAnswer?: string | undefined;
  distanceKm?: number | undefined;
  profile?: Profile | undefined;
  levelChange?: number | null | undefined;
  prompts?: SessionPrompts | undefined;
}

export interface SessionSummary {
  sessionId: string;
  answered: number;
  learnedCount: number;
  /** Places learned, never a percentage. */
  headline: string;
  correct?: number | undefined;
  placesSeen?: number | undefined;
  learnedEntityIds?: string[] | undefined;
  endLevel?: number | undefined;
  endLevelLabel?: LevelLabel | undefined;
}

export interface Account {
  id: string;
  username: string;
  createdAt: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: "bearer";
  expiresIn: number;
}

export interface ContentVersion {
  contentVersion: string;
  generatedAt: string;
  counts?: { entities?: number; questions?: number; bundles?: number } | undefined;
}

export interface StartSessionResponse {
  session: Session;
  served?: ServedQuestion | undefined;
}

export interface ReviewRoundResponse {
  served: ServedQuestion;
  remaining: number;
}
