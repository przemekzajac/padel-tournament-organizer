import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db/schema';
import type {
  Tournament,
  TournamentFormat,
  PointsPerMatch,
  Player,
  Round,
  Gender,
} from '@/types/tournament';

interface CreateTournamentInput {
  name: string;
  format: TournamentFormat;
  points_per_match: PointsPerMatch;
  court_count: number;
  players: { name: string; gender: Gender | null }[];
}

interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isLoading: boolean;

  // Actions
  loadTournaments: () => Promise<void>;
  loadTournament: (id: string) => Promise<void>;
  createTournament: (
    input: CreateTournamentInput,
    initialRounds: Round[],
  ) => Promise<Tournament>;
  updateTournament: (tournament: Tournament) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  endTournament: (id: string) => Promise<void>;
  submitRound: (
    tournamentId: string,
    updatedRound: Round,
    updatedPlayers: Player[],
    nextRound: Round | null,
  ) => Promise<void>;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournaments: [],
  currentTournament: null,
  isLoading: false,

  loadTournaments: async () => {
    set({ isLoading: true });
    const tournaments = await db.tournaments
      .orderBy('created_at')
      .reverse()
      .toArray();
    set({ tournaments, isLoading: false });
  },

  loadTournament: async (id: string) => {
    set({ isLoading: true });
    const tournament = await db.tournaments.get(id);
    set({ currentTournament: tournament ?? null, isLoading: false });
  },

  createTournament: async (
    input: CreateTournamentInput,
    initialRounds: Round[],
  ) => {
    const tournament: Tournament = {
      id: uuidv4(),
      name: input.name,
      format: input.format,
      points_per_match: input.points_per_match,
      court_count: input.court_count,
      status: 'active',
      created_at: new Date().toISOString(),
      completed_at: null,
      players: input.players.map((p) => ({
        id: uuidv4(),
        name: p.name,
        gender: p.gender,
        cumulative_points: 0,
        total_points_won: 0,
        total_points_conceded: 0,
        matches_played: 0,
        bench_count: 0,
      })),
      rounds: initialRounds,
    };

    await db.tournaments.add(tournament);
    set((state) => ({
      tournaments: [tournament, ...state.tournaments],
      currentTournament: tournament,
    }));
    return tournament;
  },

  updateTournament: async (tournament: Tournament) => {
    await db.tournaments.put(tournament);
    set((state) => ({
      tournaments: state.tournaments.map((t) =>
        t.id === tournament.id ? tournament : t,
      ),
      currentTournament:
        state.currentTournament?.id === tournament.id
          ? tournament
          : state.currentTournament,
    }));
  },

  deleteTournament: async (id: string) => {
    await db.tournaments.delete(id);
    set((state) => ({
      tournaments: state.tournaments.filter((t) => t.id !== id),
      currentTournament:
        state.currentTournament?.id === id ? null : state.currentTournament,
    }));
  },

  endTournament: async (id: string) => {
    const tournament = get().tournaments.find((t) => t.id === id);
    if (!tournament) return;

    const updated: Tournament = {
      ...tournament,
      status: 'completed',
      completed_at: new Date().toISOString(),
    };

    await db.tournaments.put(updated);
    set((state) => ({
      tournaments: state.tournaments.map((t) =>
        t.id === id ? updated : t,
      ),
      currentTournament:
        state.currentTournament?.id === id ? updated : state.currentTournament,
    }));
  },

  submitRound: async (
    tournamentId: string,
    updatedRound: Round,
    updatedPlayers: Player[],
    nextRound: Round | null,
  ) => {
    const tournament = get().tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    const updatedRounds = tournament.rounds.map((r) =>
      r.round_number === updatedRound.round_number ? updatedRound : r,
    );

    if (nextRound) {
      updatedRounds.push(nextRound);
    }

    const updated: Tournament = {
      ...tournament,
      players: updatedPlayers,
      rounds: updatedRounds,
    };

    await db.tournaments.put(updated);
    set((state) => ({
      tournaments: state.tournaments.map((t) =>
        t.id === tournamentId ? updated : t,
      ),
      currentTournament:
        state.currentTournament?.id === tournamentId
          ? updated
          : state.currentTournament,
    }));
  },
}));
