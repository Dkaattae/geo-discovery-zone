import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  api,
  ApiError,
  clearLegacyProfiles,
  loadLastProfileId,
  loadToken,
  saveLastProfileId,
  saveToken,
  signOutLocally,
  type SessionTopic,
  type StartSessionResponse,
} from "@/lib/api";
import {
  CreateProfile,
  Home,
  Loading,
  Offline,
  ProfilePicker,
  Setup,
  SignIn,
  Splash,
} from "@/components/screens";
import { Session } from "@/components/Session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wander the Atlas — Geography Quiz for Kids" },
      {
        name: "description",
        content:
          "A calm, timer-free map game for kids in K–8. Find states, learn their stories, and color in the map as you go.",
      },
      { property: "og:title", content: "Wander the Atlas — Geography Quiz for Kids" },
      {
        property: "og:description",
        content:
          "A calm, timer-free map game for kids in K–8. Find states, learn their stories, and color in the map as you go.",
      },
    ],
  }),
  component: App,
});

type Screen = "splash" | "picker" | "create" | "home" | "setup" | "session";

/**
 * Screen flow and everything that talks to the API.
 *
 * Profiles, progress and sessions all live on the server now; the only things
 * this app keeps on the device are the bearer token and which profile was last
 * chosen. Queries stay disabled until after mount, because nothing here can run
 * during SSR — the token is in `localStorage`.
 */
function App() {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("splash");
  const [topic, setTopic] = useState<SessionTopic>("location");
  const [started, setStarted] = useState<StartSessionResponse | null>(null);
  const [authError, setAuthError] = useState<string | undefined>(undefined);

  useEffect(() => {
    clearLegacyProfiles(); // The localStorage-first build kept children's data here.
    setToken(loadToken());
    setActiveId(loadLastProfileId());
    setReady(true);
  }, []);

  const signedIn = ready && token !== null;

  const profiles = useQuery({
    queryKey: ["profiles"],
    queryFn: () => api.listProfiles(),
    enabled: signedIn,
    retry: false,
  });

  const progress = useQuery({
    queryKey: ["progress", activeId],
    queryFn: () => api.getProgress(activeId!),
    enabled: signedIn && activeId !== null,
    retry: false,
  });

  // A token can expire or be revoked; when the server says so, sign out rather
  // than leaving a grown-up staring at an error.
  useEffect(() => {
    const failure = profiles.error ?? progress.error;
    if (failure instanceof ApiError && failure.isUnauthenticated) {
      signOutLocally();
      setToken(null);
      setActiveId(null);
      setScreen("splash");
      queryClient.clear();
    }
  }, [profiles.error, progress.error, queryClient]);

  const authenticate = useMutation({
    mutationFn: async (input: { username: string; password: string; register: boolean }) => {
      if (input.register) await api.register(input.username, input.password);
      return api.signIn(input.username, input.password);
    },
    onSuccess: (issued) => {
      saveToken(issued.accessToken);
      setToken(issued.accessToken);
      setAuthError(undefined);
      setScreen("picker");
    },
    onError: (error: unknown) => setAuthError(messageFor(error)),
  });

  const createProfile = useMutation({
    mutationFn: (input: { name: string; avatar: string; grade: number }) =>
      api.createProfile(input),
    onSuccess: async (profile) => {
      saveLastProfileId(profile.id);
      setActiveId(profile.id);
      await queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setScreen("home");
    },
  });

  const startSession = useMutation({
    mutationFn: (input: { profileId: string; topic: SessionTopic; level: number }) =>
      // Started without a first question so the follow-up can ask for one
      // without the answer key — the server grades, so the device never needs it.
      api.startSession({ ...input, serveFirstQuestion: false }).then(async (response) => ({
        session: response.session,
        served: await api.nextQuestion(response.session.id),
      })),
    onSuccess: ({ session, served }) => {
      setStarted({ session, served });
      setScreen("session");
    },
  });

  const active = profiles.data?.find((profile) => profile.id === activeId) ?? null;

  function signOut() {
    const revoke = api.signOut().catch(() => undefined); // Best effort; local sign-out is what matters.
    void revoke;
    signOutLocally();
    setToken(null);
    setActiveId(null);
    queryClient.clear();
    setScreen("splash");
  }

  function play(chosenTopic: SessionTopic, level: number) {
    if (!activeId) return;
    setTopic(chosenTopic);
    startSession.mutate({ profileId: activeId, topic: chosenTopic, level });
  }

  if (!ready) return <div className="min-h-screen bg-background" />;

  if (screen === "splash") {
    return <Splash onStart={() => setScreen(signedIn ? (active ? "home" : "picker") : "picker")} />;
  }

  if (!signedIn) {
    return (
      <SignIn
        pending={authenticate.isPending}
        error={authError}
        onSignIn={(username, password) =>
          authenticate.mutate({ username, password, register: false })
        }
        onRegister={(username, password) =>
          authenticate.mutate({ username, password, register: true })
        }
      />
    );
  }

  if (profiles.isError) {
    return <Offline onRetry={() => void profiles.refetch()} />;
  }

  if (profiles.isPending) {
    return <Loading label="Finding your explorers…" />;
  }

  if (screen === "create") {
    return (
      <CreateProfile
        pending={createProfile.isPending}
        error={messageFor(createProfile.error)}
        onCreate={(name, avatar, grade) => createProfile.mutate({ name, avatar, grade })}
        onCancel={() => setScreen(profiles.data.length ? "picker" : "splash")}
      />
    );
  }

  if (screen === "picker" || !active) {
    return (
      <ProfilePicker
        profiles={profiles.data}
        onPick={(id) => {
          saveLastProfileId(id);
          setActiveId(id);
          setScreen("home");
        }}
        onNew={() => setScreen("create")}
        onSignOut={signOut}
      />
    );
  }

  if (screen === "home") {
    return (
      <Home
        profile={active}
        progress={progress.data}
        onStart={() => setScreen("setup")}
        onSwitch={() => setScreen("picker")}
      />
    );
  }

  if (screen === "setup") {
    return (
      <Setup
        profile={active}
        progress={progress.data}
        pending={startSession.isPending}
        onStart={play}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (!started?.served) return <Loading label="Finding a question…" />;

  return (
    <Session
      key={started.session.id}
      profile={active}
      session={started.session}
      firstQuestion={started.served}
      onFinished={() => {
        void queryClient.invalidateQueries({ queryKey: ["profiles"] });
        void queryClient.invalidateQueries({ queryKey: ["progress", activeId] });
      }}
      onPlayAgain={() => play(topic, active.level)}
      onHome={() => {
        setStarted(null);
        setScreen("home");
      }}
    />
  );
}

function messageFor(error: unknown): string | undefined {
  if (!error) return undefined;
  if (error instanceof ApiError) return error.displayMessage;
  return "Could not reach the server. Check that the backend is running.";
}
