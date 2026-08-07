import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Profile, Question } from "@/data";
import { entityById } from "@/data";
import { Button } from "@/components/Button";
import { UsMap } from "@/components/UsMap";
import { pickQuestion, type Topic } from "@/lib/session";
import { clampLevel, levelLabel } from "@/lib/level";
import { cn } from "@/lib/utils";

interface SessionProps {
  profile: Profile;
  topic: Topic | "mixed";
  onUpdateProfile: (update: (p: Profile) => Profile) => void;
  onHome: () => void;
}

type Phase = "presenting" | "revealing";

export function Session({ profile, topic, onUpdateProfile, onHome }: SessionProps) {
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const [asked, setAsked] = useState<string[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [isReview, setIsReview] = useState(false);
  const [phase, setPhase] = useState<Phase>("presenting");
  const [chosen, setChosen] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [nextReady, setNextReady] = useState(true);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [stats, setStats] = useState({ answered: 0, correct: 0, wrong: 0 });
  const [learned, setLearned] = useState<string[]>([]);
  const [seenPlaces, setSeenPlaces] = useState<string[]>([]);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [reviewOffer, setReviewOffer] = useState(false);
  const [reviewOffered, setReviewOffered] = useState(false);
  const [reviewRoundLeft, setReviewRoundLeft] = useState(0);
  const [quitOpen, setQuitOpen] = useState(false);
  const [summary, setSummary] = useState(false);
  const reviewCorrect = useRef<Record<string, number>>({});

  const serve = useCallback(
    (opts?: { forceReview?: boolean }) => {
      const p = profileRef.current;
      setAsked((prevAsked) => {
        const q = pickQuestion({
          profile: p,
          topic,
          askedIds: prevAsked,
          index: prevAsked.length,
          forceReview: opts?.forceReview,
        });
        if (q) {
          setQuestion(q);
          setIsReview(p.reviewQueue.includes(q.entityId));
          setChosen(null);
          setDetailOpen(false);
          setNextReady(true);
          setPhase("presenting");
          return [...prevAsked, q.id];
        }
        return prevAsked;
      });
    },
    [topic],
  );

  useEffect(() => {
    serve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entity = question ? entityById(question.entityId) : undefined;
  const correct = question && chosen !== null && chosen === question.correctIndex;

  function commit(index: number) {
    if (!question || phase !== "presenting") return;
    const isCorrect = index === question.correctIndex;
    setChosen(index);
    setPhase("revealing");
    setNextReady(isCorrect);
    if (!isCorrect) {
      const t = setTimeout(() => setNextReady(true), 1100);
      void t;
    }

    const nextCorrectStreak = isCorrect ? correctStreak + 1 : 0;
    const nextWrongStreak = isCorrect ? 0 : wrongStreak + 1;
    setCorrectStreak(nextCorrectStreak);
    setWrongStreak(nextWrongStreak);

    const newStats = {
      answered: stats.answered + 1,
      correct: stats.correct + (isCorrect ? 1 : 0),
      wrong: stats.wrong + (isCorrect ? 0 : 1),
    };
    setStats(newStats);
    setSeenPlaces((prev) =>
      prev.includes(question.entityId) ? prev : [...prev, question.entityId],
    );

    const wasReview = isReview;
    onUpdateProfile((p) => {
      const prevMastery = p.mastery[question.entityId] ?? 0;
      const mastery = isCorrect ? Math.min(1, prevMastery + 0.35) : Math.max(0, prevMastery - 0.15);

      let queue = [...p.reviewQueue];
      if (!isCorrect) {
        if (!queue.includes(question.entityId)) queue.push(question.entityId);
        if (queue.length > 20) queue = queue.slice(queue.length - 20);
      } else if (wasReview) {
        const count = (reviewCorrect.current[question.entityId] ?? 0) + 1;
        reviewCorrect.current[question.entityId] = count;
        if (count >= 2) queue = queue.filter((id) => id !== question.entityId);
      }

      let level = p.level;
      if (nextCorrectStreak > 0 && nextCorrectStreak % 4 === 0) level = clampLevel(level + 0.5);
      if (nextWrongStreak > 0 && nextWrongStreak % 3 === 0) level = clampLevel(level - 0.5);

      if (isCorrect && prevMastery <= 0.7 && mastery > 0.7) {
        setLearned((prev) =>
          prev.includes(question.entityId) ? prev : [...prev, question.entityId],
        );
      }

      return {
        ...p,
        level,
        bestSustainedLevel: Math.max(p.bestSustainedLevel, level),
        stats: {
          answered: p.stats.answered + 1,
          correct: p.stats.correct + (isCorrect ? 1 : 0),
        },
        mastery: { ...p.mastery, [question.entityId]: mastery },
        reviewQueue: queue,
      };
    });
  }

  function next() {
    const answered = stats.answered;
    if (reviewRoundLeft > 0) {
      const left = reviewRoundLeft - 1;
      setReviewRoundLeft(left);
      serve({ forceReview: left > 0 });
      return;
    }
    if (!reviewOffered && stats.wrong >= 5 && correct) {
      setReviewOffer(true);
      return;
    }
    if ([5, 10, 20].includes(answered)) {
      setMilestone(answered);
      return;
    }
    serve();
  }

  function endSession() {
    onUpdateProfile((p) => ({ ...p, lastSessionEndLevel: p.level }));
    setSummary(true);
  }

  const masteredCount = learned.length;

  if (summary) {
    return (
      <SummaryScreen
        profile={profile}
        answered={stats.answered}
        learned={masteredCount}
        placesSeen={seenPlaces.length}
        onKeepPlaying={() => {
          setSummary(false);
          serve();
        }}
        onHome={onHome}
      />
    );
  }

  if (!question || !entity) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg">No questions here yet. Try another topic.</p>
        <Button className="mt-6" onClick={onHome}>
          Back home
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-xl" aria-hidden>
            {profile.avatar}
          </span>
          <span className="font-semibold">{levelLabel(profile.level)}</span>
        </div>
        <Button variant="ghost" onClick={() => setQuitOpen(true)}>
          Quit
        </Button>
      </header>

      <div className="mt-3 flex items-center gap-2" aria-hidden>
        {Array.from({ length: Math.min(stats.answered, 20) }).map((_, i) => (
          <span key={i} className="h-2 w-2 rounded-full bg-accent" />
        ))}
      </div>

      <h1 className="mt-5 text-3xl leading-tight sm:text-4xl">{question.prompt}</h1>

      {question.type === "map-identify" && (
        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-border bg-card p-2 atlas-grid">
          <UsMap
            highlightFips={phase === "presenting" || correct ? question.highlightFips : undefined}
            correctFips={phase === "revealing" ? entity.fipsCode : undefined}
          />
        </div>
      )}

      {question.type === "text-mc" && (
        <div className="mt-4 flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-4">
          <div className="w-32 shrink-0">
            <UsMap highlightFips={entity.fipsCode} />
          </div>
          <p className="font-display text-2xl">{entity.name}</p>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {question.choices.map((choice, i) => {
          const isPicked = chosen === i;
          const isAnswer = i === question.correctIndex;
          const revealed = phase === "revealing";
          return (
            <Button
              key={choice}
              variant="choice"
              size="lg"
              disabled={revealed}
              onClick={() => commit(i)}
              className={cn(
                "text-lg",
                revealed && isAnswer && "border-correct bg-correct-soft text-foreground",
                revealed && isPicked && !isAnswer && "border-accent bg-secondary",
                revealed && !isAnswer && !isPicked && "opacity-55",
              )}
            >
              {choice}
            </Button>
          );
        })}
      </div>

      {phase === "revealing" && (
        <Reveal
          correct={!!correct}
          headline={correct ? entity.funFact : question.shortExplanation}
          detail={correct ? entity.funFactDetail : question.detailExplanation}
          answerName={question.choices[question.correctIndex] ?? entity.name}
          detailOpen={detailOpen}
          onToggleDetail={() => setDetailOpen((v) => !v)}
          nextReady={nextReady}
          onNext={next}
          onUndo={
            correct
              ? undefined
              : () => {
                  setPhase("presenting");
                  setChosen(null);
                }
          }
        />
      )}

      {milestone !== null && (
        <Sheet>
          <h2 className="text-3xl">Great stopping point!</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            You have answered {milestone} questions
            {masteredCount > 0
              ? ` and learned ${masteredCount} new ${masteredCount === 1 ? "place" : "places"}`
              : ""}
            .
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => {
                setMilestone(null);
                serve();
              }}
            >
              Keep going
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setMilestone(null);
                endSession();
              }}
            >
              I'm done for now
            </Button>
          </div>
        </Sheet>
      )}

      {reviewOffer && (
        <Sheet>
          <h2 className="text-3xl">Want to try those tricky ones again?</h2>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              size="lg"
              onClick={() => {
                setReviewOffer(false);
                setReviewOffered(true);
                setReviewRoundLeft(5);
                serve({ forceReview: true });
              }}
            >
              Let's do it
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setReviewOffer(false);
                setReviewOffered(true);
                serve();
              }}
            >
              Keep going
            </Button>
          </div>
        </Sheet>
      )}

      {quitOpen && (
        <Sheet>
          <h2 className="text-3xl">Done for now?</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            You can come back to the map any time.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button size="lg" onClick={() => setQuitOpen(false)}>
              Keep playing
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setQuitOpen(false);
                endSession();
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
  detail: string;
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

      {detailOpen && <p className="mt-4 text-lg leading-relaxed">{detail}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button size="lg" disabled={!nextReady} onClick={onNext} className="grow sm:grow-0">
          Next
        </Button>
        {!detailOpen && (
          <Button variant="reveal" onClick={onToggleDetail}>
            {correct ? "Tell me more →" : "Why? →"}
          </Button>
        )}
        {detailOpen && (
          <Button variant="reveal" onClick={onToggleDetail}>
            Close
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
  profile,
  answered,
  learned,
  placesSeen,
  onKeepPlaying,
  onHome,
}: {
  profile: Profile;
  answered: number;
  learned: number;
  placesSeen: number;
  onKeepPlaying: () => void;
  onHome: () => void;
}) {
  const line = useMemo(() => {
    if (learned > 0) return `You learned ${learned} new ${learned === 1 ? "place" : "places"}!`;
    if (answered > 0)
      return `You explored ${placesSeen} ${placesSeen === 1 ? "place" : "places"} on the map.`;
    return "The map is waiting whenever you are.";
  }, [answered, learned, placesSeen]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-10">
      <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
        Nice work, {profile.name}
      </p>
      <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{line}</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        You answered {answered} {answered === 1 ? "question" : "questions"} today.
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
