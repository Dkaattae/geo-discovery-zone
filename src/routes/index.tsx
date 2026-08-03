import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Profile } from "@/data";
import { Splash, ProfilePicker, CreateProfile, Home, Setup } from "@/components/screens";
import { Session } from "@/components/Session";
import {
  loadProfiles,
  saveProfiles,
  loadLastProfileId,
  saveLastProfileId,
  newProfile,
} from "@/lib/storage";
import { clampLevel } from "@/lib/level";

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

function App() {
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("splash");
  const [topic, setTopic] = useState<"location" | "capital" | "mixed">("location");

  useEffect(() => {
    setProfiles(loadProfiles());
    setActiveId(loadLastProfileId());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveProfiles(profiles);
  }, [profiles, ready]);

  const active = profiles.find((p) => p.id === activeId) ?? null;

  function updateActive(update: (p: Profile) => Profile) {
    setProfiles((prev) => prev.map((p) => (p.id === activeId ? update(p) : p)));
  }

  if (!ready) return <div className="min-h-screen bg-background" />;

  if (screen === "splash") {
    return (
      <Splash
        onStart={() => setScreen(active ? "home" : profiles.length ? "picker" : "create")}
      />
    );
  }

  if (screen === "create") {
    return (
      <CreateProfile
        onCreate={(name, avatar, grade) => {
          const p = newProfile(name, avatar, grade);
          setProfiles((prev) => [...prev, p]);
          setActiveId(p.id);
          saveLastProfileId(p.id);
          setScreen("home");
        }}
        onCancel={() => setScreen(profiles.length ? "picker" : "splash")}
      />
    );
  }

  if (screen === "picker" || !active) {
    return (
      <ProfilePicker
        profiles={profiles}
        onPick={(id) => {
          setActiveId(id);
          saveLastProfileId(id);
          setScreen("home");
        }}
        onNew={() => setScreen("create")}
      />
    );
  }

  if (screen === "home") {
    return (
      <Home
        profile={active}
        onStart={() => setScreen("setup")}
        onSwitch={() => setScreen("picker")}
      />
    );
  }

  if (screen === "setup") {
    return (
      <Setup
        profile={active}
        onStart={(chosenTopic, level) => {
          setTopic(chosenTopic);
          updateActive((p) => ({ ...p, level: clampLevel(level) }));
          setScreen("session");
        }}
        onBack={() => setScreen("home")}
      />
    );
  }

  return (
    <Session
      key={active.id + topic}
      profile={active}
      topic={topic}
      onUpdateProfile={updateActive}
      onHome={() => setScreen("home")}
    />
  );
}
