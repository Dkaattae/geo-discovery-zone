export interface Entity {
  id: string;
  type: "state" | "country" | "city";
  name: string;
  capital?: string;
  fipsCode?: string;
  region: string;
  funFact: string;
  funFactDetail: string;
}

export interface Question {
  id: string;
  entityId: string;
  type: "map-identify" | "text-mc";
  prompt: string;
  choices: string[];
  correctIndex: number;
  level: number;
  topic: "location" | "capital";
  ageBand: 1 | 2 | 3;
  highlightFips?: string;
  shortExplanation: string;
  detailExplanation: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  level: number;
  lastSessionEndLevel: number;
  bestSustainedLevel: number;
  stats: { answered: number; correct: number };
  mastery: Record<string, number>;
  reviewQueue: string[];
}
