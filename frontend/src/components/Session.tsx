import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type AnswerResult, type Profile } from "@/lib/api";
import type { ServedQuestion, Session as SessionState, SessionSummary } from "@/lib/api";
import { Button } from "@/components/Button";
import { UsMap } from "@/components/UsMap";
import { levelLabel } from "@/lib/level";
import { cn } from "@/lib/utils";

interface SessionProps {
  profile: Profile;
  session: SessionState;
  firstQuestion: ServedQuestion;
  /** Called when the session ends, so the caller can refresh the profile. */
  onFinished: () => void;
  /** Starts a fresh session on the same topic — an ended one cannot serve more. */
  onPlayAgain: () => void;
  onHome: () => void;
}

type Sheet = "milestone" | "review" | "quit" | null;

/**
 * The play loop, driven entirely by the API.
 *
 * Every rule that used to live here — which question comes next, whether an
 * answer is right, where mastery and the level move, when review is offered —
 * is now the server's answer to a request. What is left is presentation and
 * one piece of genuinely local state: whether the reveal has been on screen
 * long enough for Next to light up.
 */
export function Session({
  profile,
  session,
  firstQuestion,
  onFinished,
  onPlayAgain,
  onHome,
}: SessionProps) {
  const [served, setServed] = useState<ServedQuestion>(firstQuestion);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [counts, setCounts] = useState(session.counts);
  const [current, setCurrent] = useState<Profile>(profile);
  const [reviewRemaining, setReviewRemaining] = useState(session.reviewRoundRemaining ?? 0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [nextReady, setNextReady] = useState(true);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** The profile as it was before the answer in play, for a local undo. */
  const profileBeforeAnswer = useRef<Profile>(profile);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, []);

  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | null> => {
    setBusy(true);
    setError(null);
    try {
      return await action();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.displayMessage
          : "The map is not answering right now. Try again in a moment.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const present = useCallback((next: ServedQuestion) => {
    setServed(next);
    setResult(null);
    setPickedIndex(null);
    setDetailOpen(false);
    setNextReady(true);
  }, []);

  async function serveNext(forceReview = false) {
    const next = await run(() => api.nextQuestion(session.id, { forceReview }));
    if (next) present(next);
  }

  async function commit(choiceIndex: number) {
    if (result || busy) return;
    profileBeforeAnswer.current = current;

    const answered = await run(() =>
      api.submitAnswer(session.id, { questionId: served.question.id, choiceIndex }),
    );
    if (!answered) return;

    setPickedIndex(choiceIndex);
    setResult(answered);
    setCounts(answered.session.counts);
    if (answered.profile) setCurrent(answered.profile);
    setReviewRemaining(answered.session.reviewRoundRemaining ?? 0);

    // A wrong answer holds Next for a beat so the reason is seen.
    const wait = answered.reveal.nextEnabledAfterMs ?? 0;
    setNextReady(wait === 0);
    if (wait > 0) {
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => setNextReady(true), wait);
    }
  }

  async function undo() {
    if (!result) return;
    const undone = await run(async () => {
      await api.undoAnswer(session.id, result.answerId);
      return true;
    });
    if (!undone) return;
    // The server rolled its own state back; this restores what is on screen.
    setCurrent(profileBeforeAnswer.current);
    setResult(null);
    setPickedIndex(null);
    setDetailOpen(false);
    setNextReady(true);
  }

  function next() {
    const prompts = result?.prompts;
    if (reviewRemaining > 0) {
      void serveNext(true);
      return;
    }
    if (prompts?.offerReview) {
      setSheet("review");
      return;
    }
    if (prompts?.milestone) {
      setSheet("milestone");
      return;
    }
    void serveNext();
  }

  async function acceptReview() {
    setSheet(null);
    const round = await run(() => api.startReviewRound(session.id));
    if (!round) return;
    present(round.served);
    setReviewRemaining(round.remaining);
  }

  async function end() {
    const ended = await run(() => api.endSession(session.id));
    if (!ended) return;
    setSummary(ended);
    onFinished();
  }

  if (summary) {
    return (
      <SummaryScreen
        name={current.name}
        summary={summary}
        onKeepPlaying={onPlayAgain}
        onHome={onHome}
      />
    );
  }

  const { question, entity } = served;
  const choices = question.choices ?? [];
  const revealing = result !== null;
  const highlight = revealing
    ? (result.reveal.mapHighlightGeometryId ?? entity?.geometryId)
    : question.highlightGeometryId;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-xl" aria-hidden>
            {current.avatar}
          </span>
          <span className="font-semibold">{levelLabel(current.level)}</span>
        </div>
        <Button variant="ghost" onClick={() => setSheet("quit")}>
          Quit
        </Button>
      </header>

      <div className="mt-3 flex items-center gap-2" aria-hidden>
        {Array.from({ length: Math.min(counts.answered, 20) }).map((_, index) => (
          <span key={index} className="h-2 w-2 rounded-full bg-accent" />
        ))}
      </div>

      <h1 className="mt-5 text-3xl leading-tight sm:text-4xl">{question.prompt}</h1>

      {question.format === "map_identify" && (
        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-border bg-card p-2 atlas-grid">
          <UsMap
            highlightFips={revealing ? undefined : highlight}
            correctFips={revealing ? highlight : undefined}
          />
        </div>
      )}

      {question.format === "multiple_choice" && entity && (
        <div className="mt-4 flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4">
          <div className="w-32 shrink-0">
            <UsMap highlightFips={entity.geometryId} />
          </div>
          <p className="font-display text-2xl">{entity.name}</p>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {choices.map((choice, index) => {
          // Nothing is marked until the server has graded: the answer key is
          // not sent with the question any more.
          const isAnswer = revealing && index === result.correctIndex;
          const isPicked = revealing && !isAnswer && index === pickedIndex;
          return (
            <Button
              key={choice}
              variant="choice"
              size="lg"
              disabled={revealing || busy}
              onClick={() => void commit(index)}
              className={cn(
                "text-lg",
                isAnswer && "border-correct bg-correct-soft text-foreground",
                isPicked && "border-accent bg-secondary",
                revealing && !isAnswer && !isPicked && "opacity-55",
              )}
            >
              {choice}
            </Button>
          );
        })}
      </div>

      {error && (
        <p
          className="mt-5 rounded-2xl border-2 border-learn bg-learn-soft p-4 text-lg"
          role="alert"
        >
          {error}
        </p>
      )}

      {result && (
        <Reveal
          correct={result.correct}
          headline={result.reveal.headline}
          detail={result.reveal.detail}
          answerName={result.correctAnswer ?? result.reveal.answerLabel ?? ""}
          detailOpen={detailOpen}
          onToggleDetail={() => setDetailOpen((open) => !open)}
          nextReady={nextReady && !busy}
          onNext={next}
          onUndo={result.correct ? undefined : () => void undo()}
        />
      )}

      {sheet === "milestone" && (
        <Sheet>
          <h2 className="text-3xl">Great stopping point!</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            You have answered {result?.prompts?.milestone ?? counts.answered} questions.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => {
                setSheet(null);
                void serveNext();
              }}
            >
              Keep going
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setSheet(null);
                void end();
              }}
            >
              I&apos;m done for now
            </Button>
          </div>
        </Sheet>
      )}

      {sheet === "review" && (
        <Sheet>
          <h2 className="text-3xl">Want to try those tricky ones again?</h2>
          <div className="mt-6 flex flex-col gap-3">
            <Button size="lg" onClick={() => void acceptReview()}>
              Let&apos;s do it
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setSheet(null);
                void serveNext();
              }}
            >
              Keep going
            </Button>
          </div>
        </Sheet>
      )}

      {sheet === "quit" && (
        <Sheet>
          <h2 className="text-3xl">Done for now?</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            You can come back to the map any time.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button size="lg" onClick={() => setSheet(null)}>
              Keep playing
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setSheet(null);
                void end();
              }}
            >
              Finish up
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[color-mix(in_oklab,var(--foreground)_45%,transparent)] p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="animate-rise w-full max-w-md rounded-3xl border-2 border-border bg-card p-6 shadow-xl"
      >
        {children}
      </div>
    </div>
  );
}

interface RevealProps {
  correct: boolean;
  headline: string;
  detail?: string | undefined;
  answerName: string;
  detailOpen: boolean;
  onToggleDetail: () => void;
  nextReady: boolean;
  onNext: () => void;
  onUndo?: (() => void) | undefined;
}

function Reveal({
  correct,
  headline,
  detail,
  answerName,
  detailOpen,
  onToggleDetail,
  nextReady,
  onNext,
  onUndo,
}: RevealProps) {
  return (
    <section
      aria-live="polite"
      className={cn(
        "animate-pop mt-6 rounded-3xl border-2 p-5 sm:p-6",
        correct ? "border-correct bg-correct-soft" : "border-learn bg-learn-soft",
      )}
    >
      <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {correct ? "You got it" : `The answer is ${answerName}`}
      </p>
      <p className="mt-2 font-display text-2xl leading-snug sm:text-3xl">{headline}</p>

      {detailOpen && detail && <p className="mt-4 text-lg leading-relaxed">{detail}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button size="lg" disabled={!nextReady} onClick={onNext} className="grow sm:grow-0">
          Next
        </Button>
        {detail && (
          <Button variant="reveal" onClick={onToggleDetail}>
            {detailOpen ? "Close" : correct ? "Tell me more →" : "Why? →"}
          </Button>
        )}
        {onUndo && (
          <Button variant="ghost" onClick={onUndo}>
            Oops, tapped by mistake
          </Button>
        )}
      </div>
    </section>
  );
}

function SummaryScreen({
  name,
  summary,
  onKeepPlaying,
  onHome,
}: {
  name: string;
  summary: SessionSummary;
  onKeepPlaying: () => void;
  onHome: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-10">
      <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
        Nice work, {name}
      </p>
      {/* The headline comes from the server: places learned, never a percentage. */}
      <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{summary.headline}</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        You answered {summary.answered} {summary.answered === 1 ? "question" : "questions"} today.
      </p>
      <div className="contour-rule my-8" />
      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={onKeepPlaying}>
          Keep playing
        </Button>
        <Button variant="quiet" onClick={onHome}>
          Back home
        </Button>
      </div>
    </div>
  );
}
