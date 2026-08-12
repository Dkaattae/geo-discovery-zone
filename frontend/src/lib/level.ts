/**
 * Display-only level formatting.
 *
 * The arithmetic that *moves* a level now lives in the backend (`app/levels.py`,
 * `app/grading.py`) — this file only renders a number the server sent. The
 * session endpoints return a `levelLabel` object; these helpers cover the
 * screens that hold a bare `level` and have no session to ask.
 */

const gradeNames = ["K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export const gradeOf = (level: number) => Math.floor(level / 2);
export const bandOf = (level: number) => level - 2 * gradeOf(level);

export function gradeLabel(level: number) {
  const grade = Math.min(8, Math.max(0, gradeOf(level)));
  return grade === 0 ? "Kindergarten" : `${gradeNames[grade]} grade`;
}

export function bandLabel(level: number) {
  const band = bandOf(level);
  if (band < 0.75) return "Easy";
  if (band < 1.5) return "Medium";
  return "Hard";
}

export function levelLabel(level: number) {
  return `${gradeLabel(level)} · ${bandLabel(level)}`;
}
