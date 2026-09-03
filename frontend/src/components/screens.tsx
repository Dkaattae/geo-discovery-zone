import { useState } from "react";
import type { Profile, ProfileProgress, SessionTopic } from "@/lib/api";
import { Button } from "@/components/Button";
import { UsMap } from "@/components/UsMap";
import { gradeLabel, levelLabel } from "@/lib/level";
import { cn } from "@/lib/utils";

// Local to this module on purpose: exporting it alongside the components below
// breaks fast refresh (react-refresh/only-export-components). Nothing outside
// screens.tsx uses it — if something needs to, give it its own module.
const AVATARS = ["🦉", "🐢", "🦊", "🐙", "🦁", "🐝", "🦜", "🐳", "🦒", "🐸"];

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

/** Shown while the app is waiting on the backend. */
export function Loading({ label = "One moment…" }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-lg text-muted-foreground" role="status">
        {label}
      </p>
    </main>
  );
}

/**
 * The backend is unreachable. Worth its own screen: a grown-up can act on
 * "the app cannot reach the server", where a spinner forever teaches nothing.
 */
export function Offline({ onRetry }: { onRetry: () => void }) {
  return (
    <Page className="text-center">
      <h1 className="mt-16 text-4xl">The map is not answering</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Wander the Atlas cannot reach its server right now. Your progress is safe — it is stored
        there, not here.
      </p>
      <Button size="lg" className="mt-8" onClick={onRetry}>
        Try again
      </Button>
    </Page>
  );
}

/**
 * The grown-up gate. A username and a password, and nothing else: no email, no
 * real names, nothing about the child but the nickname on a profile.
 */
export function SignIn({
  onSignIn,
  onRegister,
  pending,
  error,
}: {
  onSignIn: (username: string, password: string) => void;
  onRegister: (username: string, password: string) => void;
  pending: boolean;
  error?: string | undefined;
}) {
  const [mode, setMode] = useState<"signIn" | "register">("signIn");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const registering = mode === "register";
  const ready = username.trim().length >= 3 && password.length >= 8;

  return (
    <Page>
      <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
        For a grown-up
      </p>
      <h1 className="mt-2 text-4xl">{registering ? "Make an account" : "Welcome back"}</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Progress is saved on the server, so it follows you to another device. We store a username, a
        password and what has been learned — no real names, no email, nothing else.
      </p>

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (!ready || pending) return;
          const submit = registering ? onRegister : onSignIn;
          submit(username.trim(), password);
        }}
      >
        <label className="block text-lg font-semibold" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          value={username}
          autoComplete="username"
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Pick a username"
          className="mt-2 w-full rounded-xl border-2 border-border bg-card px-4 py-4 text-xl outline-none focus:border-primary"
        />

        <label className="mt-6 block text-lg font-semibold" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          autoComplete={registering ? "new-password" : "current-password"}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          className="mt-2 w-full rounded-xl border-2 border-border bg-card px-4 py-4 text-xl outline-none focus:border-primary"
        />

        {error && (
          <p
            className="mt-4 rounded-xl border-2 border-learn bg-learn-soft p-4 text-lg"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Button type="submit" size="lg" disabled={!ready || pending}>
            {pending ? "One moment…" : registering ? "Create account" : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="quiet"
            onClick={() => setMode(registering ? "signIn" : "register")}
          >
            {registering ? "I already have an account" : "I need an account"}
          </Button>
        </div>
      </form>
    </Page>
  );
}

export function ProfilePicker({
  profiles,
  onPick,
  onNew,
  onSignOut,
}: {
  profiles: Profile[];
  onPick: (id: string) => void;
  onNew: () => void;
  onSignOut: () => void;
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
        {profiles.map((profile) => (
          <Button
            key={profile.id}
            variant="choice"
            size="lg"
            onClick={() => onPick(profile.id)}
            className="items-center gap-4"
          >
            <span className="text-3xl" aria-hidden>
              {profile.avatar}
            </span>
            <span>
              <span className="block text-xl">{profile.name}</span>
              <span className="block text-sm font-medium text-muted-foreground">
                {levelLabel(profile.level)}
              </span>
            </span>
          </Button>
        ))}
        <Button variant="quiet" size="lg" onClick={onNew}>
          + New explorer
        </Button>
      </div>
      <div className="mt-10 text-center">
        <Button variant="ghost" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </Page>
  );
}

export function CreateProfile({
  onCreate,
  onCancel,
  pending,
  error,
}: {
  onCreate: (name: string, avatar: string, grade: number) => void;
  onCancel: () => void;
  pending: boolean;
  error?: string | undefined;
}) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]!);
  const [grade, setGrade] = useState(2);

  return (
    <Page>
      <h1 className="text-4xl">New explorer</h1>

      <label className="mt-8 block text-lg font-semibold" htmlFor="name">
        Pick a nickname
      </label>
      <input
        id="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Fox, Captain Map, anything you like"
        maxLength={24}
        className="mt-2 w-full rounded-xl border-2 border-border bg-card px-4 py-4 text-xl outline-none focus:border-primary"
      />
      <p className="mt-2 text-sm text-muted-foreground">
        A nickname, not your real name — this is the only thing about you that is saved.
      </p>

      <p className="mt-8 text-lg font-semibold">Pick an animal</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {AVATARS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setAvatar(option)}
            aria-label={`Choose ${option}`}
            aria-pressed={avatar === option}
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-3xl transition-colors",
              avatar === option ? "border-primary bg-accent" : "border-border bg-card",
            )}
          >
            <span aria-hidden>{option}</span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-lg font-semibold">What grade are you in?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setGrade(option)}
            aria-pressed={grade === option}
            className={cn(
              "tap-target rounded-xl border-2 px-5 text-lg font-semibold transition-colors",
              grade === option ? "border-primary bg-accent" : "border-border bg-card",
            )}
          >
            {option === 0 ? "K" : option}
          </button>
        ))}
      </div>
      {/* Grade only picks a starting difficulty; the server keeps the level, not the grade. */}
      <p className="mt-2 text-sm text-muted-foreground">
        Starts you at {gradeLabel(grade * 2)}. It moves on its own as you play.
      </p>

      {error && (
        <p className="mt-6 rounded-xl border-2 border-learn bg-learn-soft p-4 text-lg" role="alert">
          {error}
        </p>
      )}

      <div className="mt-10 flex flex-col gap-3">
        <Button
          size="lg"
          disabled={!name.trim() || pending}
          onClick={() => onCreate(name.trim(), avatar, grade)}
        >
          {pending ? "One moment…" : "Start"}
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
  progress,
  onStart,
  onSwitch,
}: {
  profile: Profile;
  progress: ProfileProgress | undefined;
  onStart: () => void;
  onSwitch: () => void;
}) {
  // The map fills itself in from the server's join keys — the client no longer
  // decides what counts as mastered.
  const mastered = new Set(progress?.masteredGeometryIds ?? []);
  const filled = progress?.mapProgress.filled ?? 0;
  const total = progress?.mapProgress.total ?? 0;

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
          {filled} of {total}
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
  progress,
  onStart,
  onBack,
  pending,
}: {
  profile: Profile;
  progress: ProfileProgress | undefined;
  onStart: (topic: SessionTopic, level: number) => void;
  onBack: () => void;
  pending: boolean;
}) {
  const [topic, setTopic] = useState<SessionTopic>("location");
  const [level, setLevel] = useState(profile.lastSessionEndLevel);
  // Three or four choices around where the last session ended — the server
  // decides which, so a K–2 child never scrolls past 7th grade.
  const options = progress?.suggestedLevels?.length
    ? progress.suggestedLevels
    : [profile.lastSessionEndLevel];

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
        ).map((option) => (
          <Button
            key={option.id}
            variant="choice"
            size="lg"
            aria-pressed={topic === option.id}
            onClick={() => setTopic(option.id)}
            className={cn(topic === option.id && "border-primary bg-accent")}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <h2 className="mt-10 text-2xl">How tricky?</h2>
      <div className="mt-4 grid gap-3">
        {options.map((option) => (
          <Button
            key={option}
            variant="choice"
            size="lg"
            aria-pressed={level === option}
            onClick={() => setLevel(option)}
            className={cn(level === option && "border-primary bg-accent")}
          >
            {levelLabel(option)}
          </Button>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <Button size="lg" disabled={pending} onClick={() => onStart(topic, level)}>
          {pending ? "One moment…" : "Start"}
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </Page>
  );
}
