export const MAX_LEVEL = 18;

export const gradeOf = (level: number) => Math.floor(level / 2);
export const bandOf = (level: number) => level - 2 * gradeOf(level);

const gradeNames = ["K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export function gradeLabel(level: number) {
  const g = Math.min(8, Math.max(0, gradeOf(level)));
  return g === 0 ? "Kindergarten" : `${gradeNames[g]} grade`;
}

export function bandLabel(level: number) {
  const b = bandOf(level);
  if (b < 0.75) return "Easy";
  if (b < 1.5) return "Medium";
  return "Hard";
}

export function levelLabel(level: number) {
  return `${gradeLabel(level)} · ${bandLabel(level)}`;
}

/** 3–4 options in a window around the current level. */
export function levelWindow(current: number): number[] {
  const step = 1;
  const raw = [current - step, current, current + step, current + 2 * step];
  return Array.from(
    new Set(raw.map((l) => Math.min(MAX_LEVEL, Math.max(0, Math.round(l * 2) / 2)))),
  ).sort((a, b) => a - b);
}

export const clampLevel = (l: number) => Math.min(MAX_LEVEL, Math.max(0, l));
