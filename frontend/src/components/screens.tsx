import { useState } from "react";
import type { Profile } from "@/data";
import { entities } from "@/data";
import { Button } from "@/components/Button";
import { UsMap } from "@/components/UsMap";
import { masteredFips } from "@/lib/session";
import { gradeLabel, levelLabel, levelWindow } from "@/lib/level";
import { cn } from "@/lib/utils";

export const AVATARS = ["🦉", "🐢", "🦊", "🐙", "🦁", "🐝", "🦜", "🐳", "🦒", "🐸"];

function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={cn("mx-auto w-full max-w-2xl px-5 py-8 sm:py-12", className)}>{children}</main>
  );
}

export function Splash({ onStart }: { onStart: () => void }) {
  return (
    <main className="atlas-grid flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">
        A map you can wander
      </p>
      <h1 className="mt-4 text-6xl leading-[0.95] sm:text-7xl">
        Wander
        <span className="block text-accent-foreground">the Atlas</span>
      </h1>
      <p className="mt-5 max-w-sm text-lg text-muted-foreground">
        Find places, learn their stories. No clocks, no scores.
      </p>
      <Button size="lg" className="mt-9 px-12" onClick={onStart}>
        Start
      </Button>
    </main>
  );
}

export function ProfilePicker({
  profiles,
  onPick,
  onNew,
}: {
  profiles: Profile[];
  onPick: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <Page>
      <h1 className="text-4xl">Who is exploring?</h1>
      {profiles.length === 0 && (
        <p className="mt-3 text-lg text-muted-foreground">
          Make an explorer to save the places you learn.
        </p>
      )}
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {profiles.map((p) => (
          <Button
            key={p.id}
            variant="choice"
            size="lg"
            onClick={() => onPick(p.id)}
            className="items-center gap-4"
          >
            <span className="text-3xl" aria-hidden>
              {p.avatar}
            </span>
            <span>
              <span className="block text-xl">{p.name}</span>
              <span className="block text-sm font-medium text-muted-foreground">
                {levelLabel(p.level)}
              </span>
            </span>
          </Button>
        ))}
        <Button variant="quiet" size="lg" onClick={onNew}>
          + New explorer
        </Button>
      </div>
    </Page>
  );
}

export function CreateProfile({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string, avatar: string, grade: number) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]!);
  const [grade, setGrade] = useState(2);

  return (
    <Page>
      <h1 className="text-4xl">New explorer</h1>

      <label className="mt-8 block text-lg font-semibold" htmlFor="name">
        Your name
      </label>
      <input
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Type your name"
        className="mt-2 w-full rounded-xl border-2 border-border bg-card px-4 py-4 text-xl outline-none focus:border-primary"
      />

      <p className="mt-8 text-lg font-semibold">Pick an animal</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {AVATARS.map((a) => (
          <button
            key={a}
            onClick={() => setAvatar(a)}
            aria-label={`Choose ${a}`}
            aria-pressed={avatar === a}
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-3xl transition-colors",
              avatar === a ? "border-primary bg-accent" : "border-border bg-card",
            )}
          >
            <span aria-hidden>{a}</span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-lg font-semibold">What grade are you in?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
          <button
            key={g}
            onClick={() => setGrade(g)}
            aria-pressed={grade === g}
            className={cn(
              "tap-target rounded-xl border-2 px-5 text-lg font-semibold transition-colors",
              grade === g ? "border-primary bg-accent" : "border-border bg-card",
            )}
          >
            {g === 0 ? "K" : g}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{gradeLabel(grade * 2)}</p>

      <div className="mt-10 flex flex-col gap-3">
        <Button size="lg" disabled={!name.trim()} onClick={() => onCreate(name.trim(), avatar, grade)}>
          Start
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Back
        </Button>
      </div>
    </Page>
  );
}

export function Home({
  profile,
  onStart,
  onSwitch,
}: {
  profile: Profile;
  onStart: () => void;
  onSwitch: () => void;
}) {
  const mastered = masteredFips(profile);
  const total = entities.filter((e) => e.type === "state").length;

  return (
    <Page>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Hello again
          </p>
          <h1 className="mt-1 text-4xl">
            <span className="mr-2" aria-hidden>
              {profile.avatar}
            </span>
            {profile.name}
          </h1>
        </div>
        <Button variant="ghost" onClick={onSwitch}>
          Switch
        </Button>
      </header>

      <section className="mt-7 rounded-3xl border-2 border-border bg-card p-3 atlas-grid">
        <UsMap masteredFips={mastered} />
      </section>
      <p className="mt-3 text-lg">
        <span className="font-semibold">
          {mastered.size} of {total}
        </span>{" "}
        places filled in. Every one you learn colors the map.
      </p>

      <div className="contour-rule my-8" />

      <Button size="lg" className="w-full" onClick={onStart}>
        Start
      </Button>
      <p className="mt-3 text-center text-sm text-muted-foreground">{levelLabel(profile.level)}</p>
    </Page>
  );
}

export function Setup({
  profile,
  onStart,
  onBack,
}: {
  profile: Profile;
  onStart: (topic: "location" | "capital" | "mixed", level: number) => void;
  onBack: () => void;
}) {
  const [topic, setTopic] = useState<"location" | "capital" | "mixed">("location");
  const [level, setLevel] = useState(profile.lastSessionEndLevel);
  const options = levelWindow(profile.lastSessionEndLevel);

  return (
    <Page>
      <h1 className="text-4xl">What do you want to find?</h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {(
          [
            { id: "location", label: "Places on the map" },
            { id: "capital", label: "Capital cities" },
            { id: "mixed", label: "A bit of both" },
          ] as const
        ).map((t) => (
          <Button
            key={t.id}
            variant="choice"
            size="lg"
            aria-pressed={topic === t.id}
            onClick={() => setTopic(t.id)}
            className={cn(topic === t.id && "border-primary bg-accent")}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <h2 className="mt-10 text-2xl">How tricky?</h2>
      <div className="mt-4 grid gap-3">
        {options.map((l) => (
          <Button
            key={l}
            variant="choice"
            size="lg"
            aria-pressed={level === l}
            onClick={() => setLevel(l)}
            className={cn(level === l && "border-primary bg-accent")}
          >
            {levelLabel(l)}
          </Button>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <Button size="lg" onClick={() => onStart(topic, level)}>
          Start
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </Page>
  );
}
