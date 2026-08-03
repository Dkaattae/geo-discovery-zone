import type { Profile } from "@/data";

const KEY = "atlas-kids.profiles.v1";
const LAST_KEY = "atlas-kids.lastProfile.v1";

export function loadProfiles(): Profile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Profile[]) : [];
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: Profile[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profiles));
  } catch {
    /* storage full or blocked — the session still works in memory */
  }
}

export function loadLastProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_KEY);
}

export function saveLastProfileId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(LAST_KEY, id);
  else window.localStorage.removeItem(LAST_KEY);
}

export function newProfile(name: string, avatar: string, grade: number): Profile {
  const level = grade * 2;
  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    avatar,
    level,
    lastSessionEndLevel: level,
    bestSustainedLevel: level,
    stats: { answered: 0, correct: 0 },
    mastery: {},
    reviewQueue: [],
  };
}
