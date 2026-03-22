import { describe, it, expect } from 'vitest';
import { isValidScore, processRoundScores } from './scoring';
import type { Player, Round } from '@/types/tournament';

function makePlayer(id: string, overrides?: Partial<Player>): Player {
  return {
    id,
    name: `Player ${id}`,
    gender: null,
    cumulative_points: 0,
    total_points_won: 0,
    total_points_conceded: 0,
    matches_played: 0,
    bench_count: 0,
    ...overrides,
  };
}

describe('isValidScore', () => {
  it('accepts valid scores that sum to points per match', () => {
    expect(isValidScore(12, 12, 24)).toBe(true);
    expect(isValidScore(20, 12, 32)).toBe(true);
    expect(isValidScore(0, 16, 16)).toBe(true);
    expect(isValidScore(16, 0, 16)).toBe(true);
  });

  it('rejects scores that do not sum correctly', () => {
    expect(isValidScore(10, 10, 24)).toBe(false);
    expect(isValidScore(15, 10, 24)).toBe(false);
  });

  it('rejects null scores', () => {
    expect(isValidScore(null, 12, 24)).toBe(false);
    expect(isValidScore(12, null, 24)).toBe(false);
  });

  it('rejects negative scores', () => {
    expect(isValidScore(-1, 25, 24)).toBe(false);
  });

  it('rejects non-integer scores', () => {
    expect(isValidScore(12.5, 11.5, 24)).toBe(false);
  });
});

describe('processRoundScores', () => {
  it('distributes points correctly for a single match', () => {
    const players = [makePlayer('a'), makePlayer('b'), makePlayer('c'), makePlayer('d')];
    const round: Round = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['a', 'b'],
        team_b_player_ids: ['c', 'd'],
        team_a_score: 18,
        team_b_score: 14,
      }],
      benched_player_ids: [],
      bench_points: null,
    };

    const { updatedPlayers, benchPoints } = processRoundScores(players, round, 32);

    // Team A gets 18 each
    const playerA = updatedPlayers.find(p => p.id === 'a')!;
    expect(playerA.cumulative_points).toBe(18);
    expect(playerA.total_points_won).toBe(18);
    expect(playerA.total_points_conceded).toBe(14);
    expect(playerA.matches_played).toBe(1);

    // Team B gets 14 each
    const playerC = updatedPlayers.find(p => p.id === 'c')!;
    expect(playerC.cumulative_points).toBe(14);
    expect(playerC.total_points_won).toBe(14);
    expect(playerC.total_points_conceded).toBe(18);

    // No bench players, but bench points still calculated
    expect(benchPoints).toBe(16); // (18+18+14+14)/4 = 16
  });

  it('awards bench points correctly', () => {
    const players = [
      makePlayer('a'), makePlayer('b'), makePlayer('c'),
      makePlayer('d'), makePlayer('e'),
    ];
    const round: Round = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['a', 'b'],
        team_b_player_ids: ['c', 'd'],
        team_a_score: 18,
        team_b_score: 14,
      }],
      benched_player_ids: ['e'],
      bench_points: null,
    };

    const { updatedPlayers, benchPoints } = processRoundScores(players, round, 32);

    // Bench points = average of active scores = (18+18+14+14)/4 = 16
    expect(benchPoints).toBe(16);

    const playerE = updatedPlayers.find(p => p.id === 'e')!;
    expect(playerE.cumulative_points).toBe(16);
    expect(playerE.matches_played).toBe(0);
    expect(playerE.bench_count).toBe(1);
  });

  it('handles two courts correctly', () => {
    const players = Array.from({ length: 8 }, (_, i) => makePlayer(`p${i}`));
    const round: Round = {
      round_number: 1,
      matches: [
        {
          court_number: 1,
          team_a_player_ids: ['p0', 'p1'],
          team_b_player_ids: ['p2', 'p3'],
          team_a_score: 18,
          team_b_score: 14,
        },
        {
          court_number: 2,
          team_a_player_ids: ['p4', 'p5'],
          team_b_player_ids: ['p6', 'p7'],
          team_a_score: 20,
          team_b_score: 12,
        },
      ],
      benched_player_ids: [],
      bench_points: null,
    };

    const { benchPoints } = processRoundScores(players, round, 32);
    // (18+18+14+14+20+20+12+12)/8 = 128/8 = 16
    expect(benchPoints).toBe(16);
  });

  it('handles shutout (0-32) correctly', () => {
    const players = [makePlayer('a'), makePlayer('b'), makePlayer('c'), makePlayer('d')];
    const round: Round = {
      round_number: 1,
      matches: [{
        court_number: 1,
        team_a_player_ids: ['a', 'b'],
        team_b_player_ids: ['c', 'd'],
        team_a_score: 0,
        team_b_score: 32,
      }],
      benched_player_ids: [],
      bench_points: null,
    };

    const { updatedPlayers } = processRoundScores(players, round, 32);

    expect(updatedPlayers.find(p => p.id === 'a')!.cumulative_points).toBe(0);
    expect(updatedPlayers.find(p => p.id === 'c')!.cumulative_points).toBe(32);
  });
});
