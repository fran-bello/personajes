export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  characters: string[];
  gamesPlayed?: number;
  gamesWon?: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export interface Player {
  user: User | string;
  team: number;
}

export interface Timer {
  timeLeft: number;
  isPaused: boolean;
}

export interface RoundScores {
  round1: { team1: number; team2: number };
  round2: { team1: number; team2: number };
  round3: { team1: number; team2: number };
}

export interface PlayerStats {
  hits: number;
  fails: number;
}

export interface Game {
  _id: string;
  roomCode: string;
  host: User | string;
  players: Player[];
  characters: string[];
  currentCharacterIndex: number;
  currentRound: number;
  currentTeam: number;
  currentPlayerIndex: number;
  status: 'waiting' | 'playing' | 'finished';
  timer: Timer;
  timePerRound: number;
  roundScores: RoundScores;
  numPlayers: number;
  gameMode: 'teams' | 'pairs';
  charactersPerPlayer: number;
  playerCharacters: Record<string, string[]>;
  roundCharacters: string[];
  blockedCharacters: string[];
  playerStats: Record<string, PlayerStats>;
  waitingForPlayer: boolean;
  showingRoundIntro: boolean;
}

export interface LocalPlayer {
  id: number;
  name: string;
  team: number;
  characters: string[];
  avatar: string; // Emoji avatar for local game
}

// Avatares predeterminados para juego local
export const LOCAL_AVATARS = [
  '🦊', '🐼', '🦁', '🐯', '🐻', 
  '🐨', '🐸', '🦉', '🦄', '🐲'
];

export interface LocalGameState {
  gameState: 'config' | 'setup' | 'playing' | 'finished';
  numPlayers: number;
  gameMode: 'teams' | 'pairs';
  charactersPerPlayer: number;
  timePerRound: number;
  players: LocalPlayer[];
  characters: string[];
  currentCharacterIndex: number;
  round: number;
  currentTeam: number;
  timeLeft: number;
  isPaused: boolean;
  scores: RoundScores;
  team1Players: LocalPlayer[];
  team2Players: LocalPlayer[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon: string;
  characterCount?: number;
  characters?: string[];
}

