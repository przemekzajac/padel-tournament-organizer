export type TournamentFormat = 'americano' | 'mexicano' | 'mixicano';
export type TournamentStatus = 'active' | 'completed';
export type Gender = 'male' | 'female';
export type PointsPerMatch = 16 | 24 | 32;

export interface Player {
  id: string;
  name: string;
  gender: Gender | null; // Required for Mixicano, null for others
  cumulative_points: number; // Float — includes bench points
  total_points_won: number; // Sum of team scores in played matches
  total_points_conceded: number; // Sum of opponent scores in played matches
  matches_played: number; // Excludes bench rounds
  bench_count: number; // Times benched
}

export interface Match {
  court_number: number; // 1-based
  team_a_player_ids: [string, string];
  team_b_player_ids: [string, string];
  team_a_score: number | null;
  team_b_score: number | null;
}

export interface Round {
  round_number: number; // 1-based
  matches: Match[];
  benched_player_ids: string[];
  bench_points: number | null; // Calculated after scores entered
}

export interface Tournament {
  id: string; // UUID
  name: string;
  format: TournamentFormat;
  points_per_match: PointsPerMatch;
  court_count: number; // 1–8
  status: TournamentStatus;
  created_at: string; // ISO 8601
  completed_at: string | null;
  players: Player[];
  rounds: Round[];
}

// Derived type for standings display
export interface PlayerStanding {
  player: Player;
  rank: number;
  point_differential: number;
}
