import { describe, it, expect, beforeEach } from 'vitest';
import { useTournamentStore } from './tournamentStore';
import { db } from '@/db/schema';

describe('tournamentStore', () => {
  beforeEach(async () => {
    await db.tournaments.clear();
    useTournamentStore.setState({
      tournaments: [],
      currentTournament: null,
      isLoading: false,
    });
  });

  it('creates a tournament and persists it', async () => {
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

    // Verify persisted to IndexedDB
    const persisted = await db.tournaments.get(tournament.id);
    expect(persisted).toBeDefined();
    expect(persisted!.name).toBe('Test Tournament');

    // Verify store state
    const state = useTournamentStore.getState();
    expect(state.tournaments).toHaveLength(1);
  });

  it('loads tournaments from IndexedDB', async () => {
    const store = useTournamentStore.getState();
    await store.createTournament(
      {
        name: 'T1',
        format: 'mexicano',
        points_per_match: 16,
        court_count: 1,
        players: [
          { name: 'A', gender: null },
          { name: 'B', gender: null },
          { name: 'C', gender: null },
          { name: 'D', gender: null },
          { name: 'E', gender: null },
          { name: 'F', gender: null },
          { name: 'G', gender: null },
          { name: 'H', gender: null },
        ],
      },
      [],
    );

    // Reset store state to simulate fresh load
    useTournamentStore.setState({ tournaments: [] });
    expect(useTournamentStore.getState().tournaments).toHaveLength(0);

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

    // Verify persisted
    const persisted = await db.tournaments.get(tournament.id);
    expect(persisted!.status).toBe('completed');
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
    const persisted = await db.tournaments.get(tournament.id);
    expect(persisted).toBeUndefined();
  });
});
