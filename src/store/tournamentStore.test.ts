import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTournamentStore } from './tournamentStore';

// Mock the Supabase data layer
vi.mock('@/db/supabase', () => ({
  fetchTournaments: vi.fn().mockResolvedValue([]),
  fetchTournament: vi.fn().mockResolvedValue(null),
  insertTournament: vi.fn().mockResolvedValue(undefined),
  upsertTournament: vi.fn().mockResolvedValue(undefined),
  removeTournament: vi.fn().mockResolvedValue(undefined),
}));

describe('tournamentStore', () => {
  beforeEach(() => {
    useTournamentStore.setState({
      tournaments: [],
      currentTournament: null,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  it('creates a tournament and updates state', async () => {
    const store = useTournamentStore.getState();

    const tournament = await store.createTournament(
      {
        name: 'Test Tournament',
        format: 'americano',
        points_per_match: 24,
        court_count: 2,
        players: [
          { name: 'Alice', gender: null },
          { name: 'Bob', gender: null },
          { name: 'Charlie', gender: null },
          { name: 'Diana', gender: null },
          { name: 'Eve', gender: null },
          { name: 'Frank', gender: null },
          { name: 'Grace', gender: null },
          { name: 'Hugo', gender: null },
        ],
      },
      [],
    );

    expect(tournament.id).toBeDefined();
    expect(tournament.name).toBe('Test Tournament');
    expect(tournament.format).toBe('americano');
    expect(tournament.players).toHaveLength(8);
    expect(tournament.status).toBe('active');

    // Verify store state
    const state = useTournamentStore.getState();
    expect(state.tournaments).toHaveLength(1);
  });

  it('loads tournaments from Supabase', async () => {
    const { fetchTournaments } = await import('@/db/supabase');
    const mockTournament = {
      id: 'test-id',
      name: 'T1',
      format: 'mexicano' as const,
      points_per_match: 16 as const,
      court_count: 1,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      completed_at: null,
      players: [],
      rounds: [],
    };
    vi.mocked(fetchTournaments).mockResolvedValueOnce([mockTournament]);

    await useTournamentStore.getState().loadTournaments();
    expect(useTournamentStore.getState().tournaments).toHaveLength(1);
    expect(useTournamentStore.getState().tournaments[0].name).toBe('T1');
  });

  it('ends a tournament', async () => {
    const store = useTournamentStore.getState();
    const tournament = await store.createTournament(
      {
        name: 'To End',
        format: 'americano',
        points_per_match: 32,
        court_count: 1,
        players: [
          { name: 'A', gender: null },
          { name: 'B', gender: null },
          { name: 'C', gender: null },
          { name: 'D', gender: null },
        ],
      },
      [],
    );

    await useTournamentStore.getState().endTournament(tournament.id);

    const state = useTournamentStore.getState();
    expect(state.tournaments[0].status).toBe('completed');
    expect(state.tournaments[0].completed_at).toBeDefined();
  });

  it('deletes a tournament', async () => {
    const store = useTournamentStore.getState();
    const tournament = await store.createTournament(
      {
        name: 'To Delete',
        format: 'americano',
        points_per_match: 24,
        court_count: 1,
        players: [
          { name: 'A', gender: null },
          { name: 'B', gender: null },
          { name: 'C', gender: null },
          { name: 'D', gender: null },
        ],
      },
      [],
    );

    await useTournamentStore.getState().deleteTournament(tournament.id);

    expect(useTournamentStore.getState().tournaments).toHaveLength(0);
  });
});
