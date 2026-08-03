import { entities, questions, type Question, type Profile } from "@/data";

export type Topic = "location" | "capital";

const near = (q: Question, level: number, span: number) => Math.abs(q.level - level) <= span;

export interface PickArgs {
  profile: Profile;
  topic: Topic | "mixed";
  askedIds: string[];
  index: number; // 0-based count of questions served this session
  forceReview?: boolean;
}

/** Picks the next question. Returns null only when the bank is empty. */
export function pickQuestion({ profile, topic, askedIds, index, forceReview }: PickArgs): Question | null {
  const topicOk = (q: Question) => topic === "mixed" || q.topic === topic;
  const fresh = (q: Question) => !askedIds.includes(q.id);
  const recentlyAsked = askedIds.slice(-6);

  const wantsReview = forceReview || (index > 0 && index % 7 === 6);
  if (wantsReview && profile.reviewQueue.length > 0) {
    const reviewPool = questions.filter(
      (q) => profile.reviewQueue.includes(q.entityId) && !recentlyAsked.includes(q.id),
    );
    if (reviewPool.length) return sample(reviewPool);
  }

  for (const span of [1.5, 3, 6, 99]) {
    const pool = questions.filter((q) => topicOk(q) && fresh(q) && near(q, profile.level, span));
    if (pool.length) return sample(pool);
  }
  // Everything has been seen: allow repeats, avoid the last few.
  const recycled = questions.filter((q) => topicOk(q) && !recentlyAsked.includes(q.id));
  if (recycled.length) return sample(recycled);
  return questions.length ? sample(questions) : null;
}

function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function masteredEntityIds(profile: Profile) {
  return entities.filter((e) => (profile.mastery[e.id] ?? 0) > 0.7).map((e) => e.id);
}

export function masteredFips(profile: Profile) {
  return new Set(
    entities
      .filter((e) => (profile.mastery[e.id] ?? 0) > 0.7 && e.fipsCode)
      .map((e) => e.fipsCode as string),
  );
}
