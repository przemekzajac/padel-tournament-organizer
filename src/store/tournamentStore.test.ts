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

  it('submits a round and updates players and rounds', async () => {
    const store = useTournamentStore.getState();
    const tournament = await store.createTournament(
      {
        name: 'Submit Round Test',
        format: 'mexicano',
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

    const playerIds = tournament.players.map(p => p.id);
    const round1 = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: [playerIds[0], playerIds[1]] as [string, string],
        team_b_player_ids: [playerIds[2], playerIds[3]] as [string, string],
        team_a_score: 14,
        team_b_score: 10,
      }],
      benched_player_ids: [] as string[],
      bench_points: null as number | null,
    };

    // Add round1 to tournament first
    const withRound = { ...tournament, rounds: [round1] };
    await useTournamentStore.getState().updateTournament(withRound);

    // Now submit with updated players
    const updatedPlayers = tournament.players.map(p => {
      if (p.id === playerIds[0] || p.id === playerIds[1]) {
        return { ...p, cumulative_points: 14, total_points_won: 14, total_points_conceded: 10, matches_played: 1 };
      }
      return { ...p, cumulative_points: 10, total_points_won: 10, total_points_conceded: 14, matches_played: 1 };
    });

    const updatedRound = { ...round1, bench_points: 12 };

    await useTournamentStore.getState().submitRound(
      tournament.id,
      updatedRound,
      updatedPlayers,
      null,
    );

    const state = useTournamentStore.getState();
    const t = state.tournaments.find(t => t.id === tournament.id)!;
    expect(t.rounds[0].bench_points).toBe(12);
    expect(t.players[0].cumulative_points).toBe(14);
  });

  it('submitRound appends next round', async () => {
    const store = useTournamentStore.getState();
    const tournament = await store.createTournament(
      {
        name: 'Next Round Test',
        format: 'mexicano',
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

    const playerIds = tournament.players.map(p => p.id);
    const round1 = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: [playerIds[0], playerIds[1]] as [string, string],
        team_b_player_ids: [playerIds[2], playerIds[3]] as [string, string],
        team_a_score: 14,
        team_b_score: 10,
      }],
      benched_player_ids: [] as string[],
      bench_points: null as number | null,
    };

    const withRound = { ...tournament, rounds: [round1] };
    await useTournamentStore.getState().updateTournament(withRound);

    const nextRound = {
      round_number: 2,
      matches: [{
        court_number: 1,
        team_a_player_ids: [playerIds[0], playerIds[2]] as [string, string],
        team_b_player_ids: [playerIds[1], playerIds[3]] as [string, string],
        team_a_score: null as number | null,
        team_b_score: null as number | null,
      }],
      benched_player_ids: [] as string[],
      bench_points: null as number | null,
    };

    await useTournamentStore.getState().submitRound(
      tournament.id,
      { ...round1, bench_points: 12 },
      tournament.players,
      nextRound,
    );

    const t = useTournamentStore.getState().tournaments.find(t => t.id === tournament.id)!;
    expect(t.rounds).toHaveLength(2);
    expect(t.rounds[1].round_number).toBe(2);
  });

  it('loadTournament sets currentTournament', async () => {
    const store = useTournamentStore.getState();
    const tournament = await store.createTournament(
      {
        name: 'Load Test',
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

    // Reset currentTournament
    useTournamentStore.setState({ currentTournament: null });
    expect(useTournamentStore.getState().currentTournament).toBeNull();

    await useTournamentStore.getState().loadTournament(tournament.id);
    expect(useTournamentStore.getState().currentTournament).toBeDefined();
    expect(useTournamentStore.getState().currentTournament!.id).toBe(tournament.id);
  });

  it('loadTournament with invalid ID returns null', async () => {
    await useTournamentStore.getState().loadTournament('nonexistent-id');
    expect(useTournamentStore.getState().currentTournament).toBeNull();
  });

  it('endTournament sets completed_at timestamp', async () => {
    const store = useTournamentStore.getState();
    const tournament = await store.createTournament(
      {
        name: 'Timestamp Test',
        format: 'americano',
        points_per_match: 16,
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

    const beforeEnd = new Date().toISOString();
    await useTournamentStore.getState().endTournament(tournament.id);

    const t = useTournamentStore.getState().tournaments[0];
    expect(t.completed_at).toBeDefined();
    expect(t.completed_at! >= beforeEnd).toBe(true);
  });

  it('creates multiple tournaments sorted by creation date', async () => {
    const store = useTournamentStore.getState();

    await store.createTournament({
      name: 'First',
      format: 'americano',
      points_per_match: 24,
      court_count: 1,
      players: [
        { name: 'A', gender: null },
        { name: 'B', gender: null },
        { name: 'C', gender: null },
        { name: 'D', gender: null },
      ],
    }, []);

    await store.createTournament({
      name: 'Second',
      format: 'mexicano',
      points_per_match: 16,
      court_count: 1,
      players: [
        { name: 'A', gender: null },
        { name: 'B', gender: null },
        { name: 'C', gender: null },
        { name: 'D', gender: null },
      ],
    }, []);

    // loadTournaments should sort by created_at DESC
    await useTournamentStore.getState().loadTournaments();
    const tournaments = useTournamentStore.getState().tournaments;
    expect(tournaments).toHaveLength(2);
    expect(tournaments[0].name).toBe('Second');
    expect(tournaments[1].name).toBe('First');
  });

  it('delete clears currentTournament if it was the active one', async () => {
    const store = useTournamentStore.getState();
    const tournament = await store.createTournament({
      name: 'To Delete Current',
      format: 'americano',
      points_per_match: 24,
      court_count: 1,
      players: [
        { name: 'A', gender: null },
        { name: 'B', gender: null },
        { name: 'C', gender: null },
        { name: 'D', gender: null },
      ],
    }, []);

    // currentTournament is set by createTournament
    expect(useTournamentStore.getState().currentTournament?.id).toBe(tournament.id);

    await useTournamentStore.getState().deleteTournament(tournament.id);
    expect(useTournamentStore.getState().currentTournament).toBeNull();
  });
});
