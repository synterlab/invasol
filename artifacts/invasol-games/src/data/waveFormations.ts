import { SlimeType } from "../entities/Slime";

export interface SpawnEntry {
  delay: number;
  x: number;
  type: SlimeType;
  zigzag?: boolean;
  speed?: number;
}

export interface WaveFormation {
  name: string;
  minWave: number;
  spawns: SpawnEntry[];
  isBossWave?: boolean;
}

export const waveFormations: WaveFormation[] = [
  // === WAVE 1+ ===
  {
    name: "Pincer",
    minWave: 1,
    spawns: [
      { delay: 0, x: 0.1, type: "Common" },
      { delay: 0, x: 0.9, type: "Common" },
      { delay: 2, x: 0.2, type: "Common" },
      { delay: 2, x: 0.8, type: "Common" },
    ],
  },
  {
    name: "Curtain",
    minWave: 1,
    spawns: [
      { delay: 0, x: 0.15, type: "Common" },
      { delay: 0.5, x: 0.35, type: "Common" },
      { delay: 1.0, x: 0.55, type: "Common" },
      { delay: 1.5, x: 0.75, type: "Common" },
      { delay: 2.0, x: 0.9, type: "Common" },
    ],
  },
  {
    name: "Arrow",
    minWave: 1,
    spawns: [
      { delay: 0, x: 0.5, type: "Common" },
      { delay: 0.6, x: 0.35, type: "Common" },
      { delay: 0.6, x: 0.65, type: "Common" },
      { delay: 1.2, x: 0.2, type: "Common" },
      { delay: 1.2, x: 0.8, type: "Common" },
    ],
  },
  {
    name: "Wall",
    minWave: 1,
    spawns: [
      { delay: 0, x: 0.1, type: "Common" },
      { delay: 0, x: 0.3, type: "Common" },
      { delay: 0, x: 0.5, type: "Common" },
      { delay: 0, x: 0.7, type: "Common" },
      { delay: 0, x: 0.9, type: "Common" },
    ],
  },
  // === WAVE 2+ ===
  {
    name: "DriftColumn",
    minWave: 2,
    spawns: [
      { delay: 0, x: 0.5, type: "Volatile" },
      { delay: 1.5, x: 0.45, type: "Common" },
      { delay: 1.5, x: 0.55, type: "Common" },
      { delay: 3, x: 0.5, type: "Crystal" },
    ],
  },
  {
    name: "Swarm",
    minWave: 2,
    spawns: [
      { delay: 0, x: 0.1, type: "Common" },
      { delay: 0.3, x: 0.25, type: "Common" },
      { delay: 0.6, x: 0.4, type: "Common" },
      { delay: 0.9, x: 0.55, type: "Common" },
      { delay: 1.2, x: 0.7, type: "Common" },
      { delay: 1.5, x: 0.85, type: "Common" },
      { delay: 2.0, x: 0.2, type: "Volatile" },
      { delay: 2.5, x: 0.75, type: "Volatile" },
    ],
  },
  {
    name: "Zigzag Patrol",
    minWave: 2,
    spawns: [
      { delay: 0, x: 0.2, type: "Common", zigzag: true },
      { delay: 0.5, x: 0.5, type: "Common", zigzag: true },
      { delay: 1.0, x: 0.8, type: "Common", zigzag: true },
      { delay: 2.5, x: 0.35, type: "Volatile" },
    ],
  },
  // === WAVE 3+ ===
  {
    name: "Crystal Vanguard",
    minWave: 3,
    spawns: [
      { delay: 0, x: 0.3, type: "Crystal" },
      { delay: 0, x: 0.7, type: "Crystal" },
      { delay: 1.5, x: 0.5, type: "Common" },
      { delay: 2, x: 0.2, type: "Common" },
      { delay: 2, x: 0.8, type: "Common" },
    ],
  },
  {
    name: "Diamond",
    minWave: 3,
    spawns: [
      { delay: 0, x: 0.5, type: "Crystal" },
      { delay: 0.8, x: 0.3, type: "Common" },
      { delay: 0.8, x: 0.7, type: "Common" },
      { delay: 1.6, x: 0.1, type: "Common" },
      { delay: 1.6, x: 0.9, type: "Common" },
      { delay: 2.4, x: 0.5, type: "Volatile" },
    ],
  },
  {
    name: "Volatile Chain",
    minWave: 3,
    spawns: [
      { delay: 0, x: 0.5, type: "Volatile" },
      { delay: 0, x: 0.2, type: "Common" },
      { delay: 0, x: 0.8, type: "Common" },
      { delay: 2, x: 0.35, type: "Volatile" },
      { delay: 2, x: 0.65, type: "Volatile" },
      { delay: 4, x: 0.5, type: "Crystal" },
    ],
  },
  // === WAVE 4+ ===
  {
    name: "Mirror Squad",
    minWave: 4,
    spawns: [
      { delay: 0, x: 0.2, type: "Mirror" },
      { delay: 0.8, x: 0.5, type: "Mirror" },
      { delay: 1.6, x: 0.8, type: "Mirror" },
      { delay: 2.5, x: 0.35, type: "Volatile" },
      { delay: 2.5, x: 0.65, type: "Volatile" },
    ],
  },
  {
    name: "Ambush",
    minWave: 4,
    spawns: [
      { delay: 0, x: 0.05, type: "Common", zigzag: true },
      { delay: 0, x: 0.95, type: "Common", zigzag: true },
      { delay: 1, x: 0.15, type: "Mirror" },
      { delay: 1, x: 0.85, type: "Mirror" },
      { delay: 2.5, x: 0.5, type: "Volatile" },
    ],
  },
  {
    name: "Crystal Web",
    minWave: 4,
    spawns: [
      { delay: 0, x: 0.1, type: "Crystal" },
      { delay: 0, x: 0.5, type: "Crystal" },
      { delay: 0, x: 0.9, type: "Crystal" },
      { delay: 1.5, x: 0.3, type: "Mirror" },
      { delay: 1.5, x: 0.7, type: "Mirror" },
      { delay: 3, x: 0.5, type: "Volatile" },
      { delay: 3, x: 0.2, type: "Common" },
      { delay: 3, x: 0.8, type: "Common" },
    ],
  },
  // === WAVE 5+ BOSS ===
  {
    name: "Boss Rush",
    minWave: 5,
    isBossWave: true,
    spawns: [
      { delay: 0, x: 0.25, type: "Crystal" },
      { delay: 0, x: 0.75, type: "Crystal" },
      { delay: 1, x: 0.5, type: "Mirror" },
      { delay: 2, x: 0.1, type: "Volatile" },
      { delay: 2, x: 0.9, type: "Volatile" },
      { delay: 3.5, x: 0.5, type: "Common" },
      { delay: 3.5, x: 0.3, type: "Common" },
      { delay: 3.5, x: 0.7, type: "Common" },
    ],
  },
  {
    name: "Mirror Maze",
    minWave: 5,
    spawns: [
      { delay: 0, x: 0.1, type: "Mirror" },
      { delay: 0.5, x: 0.3, type: "Mirror" },
      { delay: 1.0, x: 0.5, type: "Mirror" },
      { delay: 1.5, x: 0.7, type: "Mirror" },
      { delay: 2.0, x: 0.9, type: "Mirror" },
      { delay: 3, x: 0.2, type: "Volatile" },
      { delay: 3, x: 0.8, type: "Volatile" },
    ],
  },
  // === WAVE 6+ ===
  {
    name: "Double Pincer",
    minWave: 6,
    spawns: [
      { delay: 0, x: 0.05, type: "Crystal" },
      { delay: 0, x: 0.95, type: "Crystal" },
      { delay: 1, x: 0.15, type: "Common" },
      { delay: 1, x: 0.85, type: "Common" },
      { delay: 2.5, x: 0.05, type: "Volatile", zigzag: true },
      { delay: 2.5, x: 0.95, type: "Volatile", zigzag: true },
      { delay: 4, x: 0.5, type: "Mirror" },
    ],
  },
  {
    name: "Serpent",
    minWave: 6,
    spawns: [
      { delay: 0, x: 0.1, type: "Common", zigzag: true },
      { delay: 0.4, x: 0.9, type: "Common", zigzag: true },
      { delay: 0.8, x: 0.2, type: "Crystal", zigzag: true },
      { delay: 1.2, x: 0.8, type: "Crystal", zigzag: true },
      { delay: 1.6, x: 0.35, type: "Mirror", zigzag: true },
      { delay: 2.0, x: 0.65, type: "Mirror", zigzag: true },
      { delay: 3, x: 0.5, type: "Volatile" },
    ],
  },
  // === WAVE 8+ MEGA BOSS ===
  {
    name: "Tsunami",
    minWave: 8,
    isBossWave: true,
    spawns: [
      { delay: 0, x: 0.1, type: "Common" },
      { delay: 0, x: 0.2, type: "Common" },
      { delay: 0, x: 0.3, type: "Common" },
      { delay: 0, x: 0.4, type: "Common" },
      { delay: 0, x: 0.5, type: "Common" },
      { delay: 0, x: 0.6, type: "Common" },
      { delay: 0, x: 0.7, type: "Common" },
      { delay: 0, x: 0.8, type: "Common" },
      { delay: 0, x: 0.9, type: "Common" },
      { delay: 2, x: 0.15, type: "Crystal" },
      { delay: 2, x: 0.5, type: "Crystal" },
      { delay: 2, x: 0.85, type: "Crystal" },
      { delay: 4, x: 0.3, type: "Volatile" },
      { delay: 4, x: 0.7, type: "Volatile" },
    ],
  },
  {
    name: "Mirror Storm",
    minWave: 8,
    spawns: [
      { delay: 0, x: 0.15, type: "Mirror", zigzag: true },
      { delay: 0, x: 0.85, type: "Mirror", zigzag: true },
      { delay: 1, x: 0.35, type: "Mirror" },
      { delay: 1, x: 0.65, type: "Mirror" },
      { delay: 2, x: 0.5, type: "Mirror", zigzag: true },
      { delay: 3, x: 0.1, type: "Volatile" },
      { delay: 3, x: 0.5, type: "Volatile" },
      { delay: 3, x: 0.9, type: "Volatile" },
    ],
  },
  // === WAVE 10+ ENDGAME ===
  {
    name: "Leviathan",
    minWave: 10,
    isBossWave: true,
    spawns: [
      { delay: 0, x: 0.05, type: "Crystal" },
      { delay: 0, x: 0.95, type: "Crystal" },
      { delay: 0.5, x: 0.2, type: "Mirror" },
      { delay: 0.5, x: 0.8, type: "Mirror" },
      { delay: 1, x: 0.35, type: "Volatile" },
      { delay: 1, x: 0.65, type: "Volatile" },
      { delay: 2, x: 0.5, type: "Crystal" },
      { delay: 3, x: 0.1, type: "Common", zigzag: true },
      { delay: 3, x: 0.3, type: "Common", zigzag: true },
      { delay: 3, x: 0.7, type: "Common", zigzag: true },
      { delay: 3, x: 0.9, type: "Common", zigzag: true },
      { delay: 5, x: 0.5, type: "Mirror" },
      { delay: 5, x: 0.25, type: "Volatile" },
      { delay: 5, x: 0.75, type: "Volatile" },
    ],
  },
];
